package com.flowkraft.exploredata;

import com.flowkraft.common.AppPaths;
import com.flowkraft.embed.ShareTokenService;
import com.sourcekraft.documentburster.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.sqlite.SQLiteConfig;
import org.sqlite.SQLiteConfig.JournalMode;
import org.sqlite.SQLiteDataSource;

import java.io.File;
import java.sql.*;
import java.time.Instant;
import java.util.*;

/**
 * Canvas persistence service — stores canvas state in SQLite.
 *
 * <p>DB location: {@code {PORTABLE_EXECUTABLE_DIR}/data/ai-hub.db}
 * resolved via {@link Utils#resolvePathAgainstPortableDir(String)} so it
 * always lands in the correct directory regardless of CWD (avoids the
 * CWD-anchored fallback bug class documented in project memory).
 *
 * <p>Singleton pattern: {@link #ensureDb()} is called lazily on first access.
 * {@code CREATE TABLE IF NOT EXISTS} makes every start idempotent — no
 * migration scripts, no schema versioning for v0.
 *
 * <p>Uses raw JDBC (no spring-jdbc dependency) to avoid adding a dependency
 * that does not exist in the server module's pom.
 */
@Service
public class ExploreDataService {

    private static final Logger log = LoggerFactory.getLogger(ExploreDataService.class);
    private static final String DB_RELATIVE = "data/ai-hub.db";

    /** Lazy-initialized on first canvas operation. */
    private SQLiteDataSource dataSource;

    /** A published dashboard's share links go with the dashboard, so this service revokes them. */
    @Autowired
    private ShareTokenService shareTokens;

    // ── DB init ───────────────────────────────────────────────────────────────

    private synchronized void ensureDb() throws SQLException {
        if (dataSource != null) return;

        // Prefer AppPaths.PORTABLE_EXECUTABLE_DIR_PATH (set from JVM arg) to avoid
        // the CWD-anchored fallback bug class documented in project memory.
        String base = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH;
        String dbPath = (base != null && !base.isBlank())
                ? base + "/" + DB_RELATIVE
                : Utils.resolvePathAgainstPortableDir(DB_RELATIVE);

        dbPath = dbPath.replace("\\", "/");
        File dbFile = new File(dbPath);
        dbFile.getParentFile().mkdirs();

        log.info("ExploreData SQLite → {}", dbFile.getAbsolutePath());

        SQLiteConfig cfg = new SQLiteConfig();
        cfg.setJournalMode(JournalMode.WAL);

        SQLiteDataSource ds = new SQLiteDataSource(cfg);
        ds.setUrl("jdbc:sqlite:" + dbFile.getAbsolutePath().replace("\\", "/"));

        // Idempotent schema creation — safe to run on every start (no migrations needed)
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS canvases (
                        id                   TEXT PRIMARY KEY,
                        name                 TEXT NOT NULL,
                        description          TEXT,
                        connection_id        TEXT,
                        state                TEXT NOT NULL DEFAULT '{}',
                        exported_report_code TEXT,
                        last_exported_at     TEXT,
                        created_at           TEXT NOT NULL,
                        updated_at           TEXT NOT NULL
                    )
                    """);
        }

        this.dataSource = ds;
    }

    private Connection connection() throws SQLException {
        ensureDb();
        return dataSource.getConnection();
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listCanvases() throws SQLException {
        try (Connection conn = connection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT * FROM canvases ORDER BY updated_at DESC");
             ResultSet rs = ps.executeQuery()) {
            return toList(rs);
        }
    }

    public Optional<Map<String, Object>> getCanvas(String id) throws SQLException {
        try (Connection conn = connection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT * FROM canvases WHERE id = ?")) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                List<Map<String, Object>> rows = toList(rs);
                return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
            }
        }
    }

    public Map<String, Object> createCanvas(Map<String, Object> body) throws SQLException {
        String id    = "canvas-" + System.currentTimeMillis() + "-"
                     + UUID.randomUUID().toString().replace("-", "").substring(0, 5);
        String now   = Instant.now().toString();
        String name  = String.valueOf(body.getOrDefault("name", "Untitled Canvas"));
        String desc  = body.containsKey("description") ? (String) body.get("description") : null;
        String conn2 = body.containsKey("connectionId") ? (String) body.get("connectionId") : null;
        String state = "{\"widgets\":[],\"parametersConfig\":{\"parameters\":[]}}";

        try (Connection conn = connection();
             PreparedStatement ps = conn.prepareStatement("""
                     INSERT INTO canvases
                         (id, name, description, connection_id, state, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?)
                     """)) {
            ps.setString(1, id);
            ps.setString(2, name);
            ps.setString(3, desc);
            ps.setString(4, conn2);
            ps.setString(5, state);
            ps.setString(6, now);
            ps.setString(7, now);
            ps.executeUpdate();
        }

        return getCanvas(id).orElseThrow();
    }

    public Optional<Map<String, Object>> updateCanvas(String id, Map<String, Object> body)
            throws SQLException {
        if (getCanvas(id).isEmpty()) return Optional.empty();

        String now = Instant.now().toString();
        List<String> setClauses = new ArrayList<>();
        List<Object> params     = new ArrayList<>();

        if (body.containsKey("name"))               { setClauses.add("name = ?");                params.add(body.get("name")); }
        if (body.containsKey("description"))         { setClauses.add("description = ?");         params.add(body.get("description")); }
        if (body.containsKey("connectionId"))        { setClauses.add("connection_id = ?");       params.add(body.get("connectionId")); }
        if (body.containsKey("state"))               { setClauses.add("state = ?");               params.add(body.get("state")); }
        if (body.containsKey("exportedReportCode"))  { setClauses.add("exported_report_code = ?"); params.add(body.get("exportedReportCode")); }

        setClauses.add("updated_at = ?");
        params.add(now);
        params.add(id);   // WHERE id = ?

        if (!setClauses.isEmpty()) {
            String sql = "UPDATE canvases SET " + String.join(", ", setClauses) + " WHERE id = ?";
            try (Connection conn = connection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(i + 1, params.get(i));
                }
                ps.executeUpdate();
            }
        }
        return getCanvas(id);
    }

    public void deleteCanvas(String id) throws SQLException {
        deleteCanvas(id, false);
    }

    // ── The shipped demo canvases (#36, "New from a demo") ────────────────────

    /** Where the dashboard demos ship, each canvas beside its settings: config/samples/<id>/<id>.canvas.json. */
    private static java.nio.file.Path samplesDir() {
        return java.nio.file.Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples");
    }

    /** One shipped demo's canvas, read whole; empty when the id names none (or names a path). */
    public Optional<Map<String, Object>> demoCanvas(String demoId) throws java.io.IOException {
        if (demoId == null || !demoId.matches("[A-Za-z0-9_-]+"))
            return Optional.empty();
        java.nio.file.Path file = samplesDir().resolve(demoId).resolve(demoId + ".canvas.json");
        if (!java.nio.file.Files.isRegularFile(file))
            return Optional.empty();
        return Optional.of(new com.fasterxml.jackson.databind.ObjectMapper().readValue(file.toFile(),
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                }));
    }

    /**
     * The canvases the dashboard demos ship, by name: what "New from a demo" offers. Their id, name
     * and description only - a canvas itself is read when it is picked.
     */
    public List<Map<String, Object>> listDemoCanvases() throws java.io.IOException {
        List<Map<String, Object>> demos = new ArrayList<>();
        java.nio.file.Path dir = samplesDir();
        if (!java.nio.file.Files.isDirectory(dir))
            return demos;
        List<java.nio.file.Path> folders;
        try (var listing = java.nio.file.Files.list(dir)) {
            folders = listing.toList();
        }
        for (java.nio.file.Path folder : folders) {
            String id = folder.getFileName().toString();
            Optional<Map<String, Object>> canvas = demoCanvas(id);
            if (canvas.isEmpty())
                continue;
            Map<String, Object> demo = new LinkedHashMap<>();
            demo.put("id", id);
            demo.put("name", String.valueOf(canvas.get().getOrDefault("name", id)));
            demo.put("description", canvas.get().get("description"));
            demos.add(demo);
        }
        demos.sort(Comparator.comparing(demo -> String.valueOf(demo.get("name"))));
        return demos;
    }

    /**
     * A new canvas that is a copy of one shipped demo's (#36): its name, description, connection and
     * widgets under a new id, published nowhere - the demo's own dashboard stays the demo's.
     */
    public Map<String, Object> createCanvasFromDemo(Map<String, Object> demo) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", String.valueOf(demo.getOrDefault("name", "Untitled Canvas")));
        body.put("description", demo.get("description") == null ? null : String.valueOf(demo.get("description")));
        body.put("connectionId", demo.get("connection_id") == null ? null : String.valueOf(demo.get("connection_id")));
        Map<String, Object> created = createCanvas(body);
        // What a canvas saves of itself, and nothing else: a shipped file also carries the demo's id,
        // its published report code and its last results, none of which belongs to the copy.
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        Object shipped = demo.get("state");
        if (shipped instanceof String text)
            shipped = mapper.readValue(text, Map.class);
        Map<String, Object> state = new LinkedHashMap<>();
        if (shipped instanceof Map<?, ?> fields)
            for (String key : List.of("widgets", "parametersConfig", "dashboardSettings"))
                if (fields.containsKey(key))
                    state.put(key, fields.get(key));
        return updateCanvas(String.valueOf(created.get("id")), Map.of("state", mapper.writeValueAsString(state)))
                .orElseThrow();
    }

    /**
     * Delete a canvas, and with it the dashboard it published - unless the person said to keep it.
     *
     * <p>A published dashboard is a report of its own: its folders under {@code config/reports} and
     * {@code templates/reports}, and the share links that open it. They used to go silently with
     * the canvas; now the dialog says so and this is the switch behind the words (D2). Kept, the
     * dashboard and its links keep answering and only the canvas that built them is gone - there is
     * then nothing left that can change or re-publish it, which is exactly what "keep the published
     * dashboard" means.
     *
     * @param keepPublished leave the dashboard's folders and its share links alone
     */
    public void deleteCanvas(String id, boolean keepPublished) throws SQLException {
        // Read the published reportId BEFORE the row goes: it is the only place it is written.
        String exportedReportCode = publishedReportCodeOf(id);

        try (Connection conn = connection();
             PreparedStatement ps = conn.prepareStatement(
                     "DELETE FROM canvases WHERE id = ?")) {
            ps.setString(1, id);
            ps.executeUpdate();
        }

        if (!keepPublished) removePublished(exportedReportCode);
    }

    /**
     * Unpublish: the dashboard a canvas published goes, the canvas stays.
     *
     * <p>The canvas forgets the report code, so the Canvas offers Publish again and no longer
     * offers Share - there is nothing to share. Publishing again writes a dashboard under the same
     * code, because the code is derived from the canvas name, and that dashboard is new: the links
     * the old one had were revoked with it, and a link that opens a page nobody meant to publish is
     * exactly what unpublishing is for.
     *
     * @return what was taken away: {@code {reportId, shareLinks}}, or an empty map when the canvas
     *         had published nothing.
     */
    public Map<String, Object> unpublish(String id) throws SQLException {
        String exportedReportCode = publishedReportCodeOf(id);
        if (exportedReportCode == null || exportedReportCode.isBlank()) return Map.of();

        int revoked = removePublished(exportedReportCode);

        try (Connection conn = connection();
             PreparedStatement ps = conn.prepareStatement(
                     "UPDATE canvases SET exported_report_code = NULL, last_exported_at = NULL,"
                             + " updated_at = ? WHERE id = ?")) {
            ps.setString(1, Instant.now().toString());
            ps.setString(2, id);
            ps.executeUpdate();
        }
        return Map.of("reportId", exportedReportCode, "shareLinks", revoked);
    }

    /** The report code this canvas has published, or null when it has published nothing. */
    private String publishedReportCodeOf(String id) throws SQLException {
        try (Connection conn = connection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT exported_report_code FROM canvases WHERE id = ?")) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    /** Everything one published dashboard is: its folders on disk and its share links. */
    private int removePublished(String exportedReportCode) {
        if (exportedReportCode == null || exportedReportCode.isBlank()) return 0;
        deletePublishedDashboardFolders(exportedReportCode);
        return shareTokens.revokeAllFor(exportedReportCode);
    }

    /**
     * Recursively removes the on-disk artifacts of a published dashboard.
     * Uses {@link Utils#resolvePathAgainstPortableDir(String)} to avoid the
     * CWD-anchored fallback bug class documented in project memory.
     */
    private static void deletePublishedDashboardFolders(String reportId) {
        String[] relatives = {
                "config/reports/"   + reportId,
                "templates/reports/" + reportId,
        };
        for (String rel : relatives) {
            File dir = new File(Utils.resolvePathAgainstPortableDir(rel));
            if (dir.exists() && dir.isDirectory()) {
                try {
                    org.apache.commons.io.FileUtils.deleteDirectory(dir);
                    log.info("Deleted published dashboard folder: {}", dir.getAbsolutePath());
                } catch (Exception e) {
                    log.warn("Failed to delete published dashboard folder {}: {}", dir.getAbsolutePath(), e.getMessage());
                }
            }
        }
    }

    // ── ResultSet → DTO ───────────────────────────────────────────────────────

    private static List<Map<String, Object>> toList(ResultSet rs) throws SQLException {
        List<Map<String, Object>> rows = new ArrayList<>();
        while (rs.next()) {
            rows.add(toCanvasDto(rs));
        }
        return rows;
    }

    /** Maps snake_case column names to camelCase for the frontend. */
    private static Map<String, Object> toCanvasDto(ResultSet rs) throws SQLException {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id",                 rs.getString("id"));
        dto.put("name",               rs.getString("name"));
        dto.put("description",        rs.getString("description"));
        dto.put("connectionId",       rs.getString("connection_id"));
        dto.put("state",              rs.getString("state"));
        dto.put("exportedReportCode", rs.getString("exported_report_code"));
        dto.put("lastExportedAt",     rs.getString("last_exported_at"));
        dto.put("createdAt",          rs.getString("created_at"));
        dto.put("updatedAt",          rs.getString("updated_at"));
        return dto;
    }
}
