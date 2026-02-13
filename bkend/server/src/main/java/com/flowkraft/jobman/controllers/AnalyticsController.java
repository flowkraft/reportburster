package com.flowkraft.jobman.controllers;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.services.ClickHouseAnalyticsService;
import com.flowkraft.jobman.services.DuckDBAnalyticsService;
import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import com.sourcekraft.documentburster.common.analytics.dto.PivotResponse;
import com.sourcekraft.documentburster.common.analytics.duckdb.DuckDBFileHandler;
import com.sourcekraft.documentburster.common.db.DatabaseConnectionManager;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.ServerDatabaseSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for OLAP analytics operations.
 * Provides endpoints for server-side pivot table processing using DuckDB or ClickHouse.
 * 
 * Engine routing:
 * - engine="duckdb": Uses DuckDB for OLAP processing
 * - engine="clickhouse": Uses ClickHouse for OLAP processing
 * - engine not specified: Auto-detects from connection database type
 *   - duckdb connection → duckdb engine
 *   - clickhouse connection → clickhouse engine
 *   - other connections → browser (client-side processing)
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private DuckDBAnalyticsService duckDBService;
    private ClickHouseAnalyticsService clickHouseService;
    private DatabaseConnectionManager connectionManager;

    /**
     * Lazy initialization of the DatabaseConnectionManager and analytics services.
     * Creates the services on first use with Settings loaded from config.
     */
    private void ensureServicesInitialized() {
        if (connectionManager == null) {
            try {
                String settingsPath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "burst", "settings.xml").toString();
                Settings settings = new Settings(settingsPath);
                connectionManager = new DatabaseConnectionManager(settings);
                duckDBService = new DuckDBAnalyticsService(connectionManager);
                clickHouseService = new ClickHouseAnalyticsService(connectionManager);
                log.info("Analytics services initialized successfully");
            } catch (Exception e) {
                log.error("Failed to initialize analytics services", e);
                throw new RuntimeException("Failed to initialize analytics services: " + e.getMessage(), e);
            }
        }
    }

    /**
     * Resolve connectionCode and tableName from a reportCode by reading reporting.xml.
     * Populates the PivotRequest with the resolved values.
     *
     * @param request The pivot request with reportCode set
     * @throws RuntimeException if reporting.xml not found or invalid
     */
    private void resolveConnectionFromReportCode(PivotRequest request) throws RuntimeException {
        try {
            String reportCode = request.getReportCode();

            // Find the report directory (same logic as ReportingService)
            java.nio.file.Path reportsDir = java.nio.file.Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports", reportCode);
            java.nio.file.Path samplesDir = java.nio.file.Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", reportCode);
            java.nio.file.Path frendSamplesDir = java.nio.file.Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", "_frend", reportCode);

            java.nio.file.Path reportDir = null;
            if (java.nio.file.Files.exists(reportsDir)) {
                reportDir = reportsDir;
            } else if (java.nio.file.Files.exists(samplesDir)) {
                reportDir = samplesDir;
            } else if (java.nio.file.Files.exists(frendSamplesDir)) {
                reportDir = frendSamplesDir;
            } else {
                throw new RuntimeException("Report not found: " + reportCode);
            }

            // Read reporting.xml using JAXB (same as Settings.java)
            java.nio.file.Path reportingXml = reportDir.resolve("reporting.xml");
            if (!java.nio.file.Files.exists(reportingXml)) {
                throw new RuntimeException("reporting.xml not found for report: " + reportCode);
            }

            // Use JAXB to properly parse the XML (same pattern as Settings.java)
            jakarta.xml.bind.JAXBContext jaxbContext = jakarta.xml.bind.JAXBContext.newInstance(
                com.sourcekraft.documentburster.common.settings.model.ReportingSettings.class
            );
            jakarta.xml.bind.Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();

            com.sourcekraft.documentburster.common.settings.model.ReportingSettings reportingSettings;
            try (java.io.FileInputStream fis = new java.io.FileInputStream(reportingXml.toFile())) {
                reportingSettings = (com.sourcekraft.documentburster.common.settings.model.ReportingSettings) unmarshaller.unmarshal(fis);
            }

            if (reportingSettings == null || reportingSettings.report == null || reportingSettings.report.datasource == null) {
                throw new RuntimeException("Invalid reporting.xml structure for report: " + reportCode);
            }

            com.sourcekraft.documentburster.common.settings.model.ReportSettings.DataSource ds = reportingSettings.report.datasource;
            String dsType = ds.type;
            log.debug("resolveConnectionFromReportCode - datasource type: {}", dsType);

            String connectionCode = null;

            // Extract connection code from the appropriate section
            if ("ds.sqlquery".equals(dsType) && ds.sqloptions != null) {
                connectionCode = ds.sqloptions.conncode;
            } else if ("ds.scriptfile".equals(dsType) && ds.scriptoptions != null) {
                connectionCode = ds.scriptoptions.conncode;
            }

            log.debug("resolveConnectionFromReportCode - extracted connectionCode: {}", connectionCode);

            if (connectionCode == null || connectionCode.isEmpty()) {
                throw new RuntimeException("No connection code found in reporting.xml for report: " + reportCode);
            }

            // Priority 1: Check if user explicitly configured tableName in pivot DSL
            String tableName = null;
            java.nio.file.Path pivotConfigPath = reportDir.resolve(reportCode + "-pivot-config.groovy");
            if (java.nio.file.Files.exists(pivotConfigPath)) {
                try {
                    String pivotDsl = java.nio.file.Files.readString(pivotConfigPath);
                    com.sourcekraft.documentburster.common.pivottable.PivotTableOptions pivotOpts =
                        com.sourcekraft.documentburster.common.pivottable.PivotTableOptionsParser.parseGroovyPivotTableDslCode(pivotDsl);
                    tableName = pivotOpts.getTableName();

                    if (tableName != null && !tableName.isEmpty()) {
                        log.info("Using explicit tableName from pivot DSL: '{}'", tableName);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse pivot config for report '{}': {}", reportCode, e.getMessage());
                }
            }

            // Priority 2: If no explicit tableName, fallback to auto-plumbing sentinel
            if (tableName == null || tableName.isEmpty()) {
                tableName = "__SCRIPT_DATA__";
                log.info("No explicit tableName in pivot DSL - will auto-plumb script data for report '{}'", reportCode);
            }

            // Populate the request
            request.setConnectionCode(connectionCode);
            request.setTableName(tableName);

            // Smart auto-substitution: if client explicitly requests DuckDB but report has non-DuckDB connection,
            // auto-configure virtual DuckDB connection (only if not already DuckDB)
            String clientEngine = request.getEngine();
            if ("duckdb".equalsIgnoreCase(clientEngine)) {
                String detectedEngine = detectEngineFromConnection(connectionCode);

                if (!"duckdb".equalsIgnoreCase(detectedEngine)) {
                    // Client explicitly requested DuckDB, auto-configure virtual connection
                    log.info("Client requested DuckDB engine but report uses '{}' connection - auto-configuring virtual DuckDB",
                            connectionCode);
                    request.setConnectionCode("rbt-sample-northwind-duckdb-4f2");
                }
            }

            log.info("Resolved reportCode '{}' to connectionCode='{}', tableName='{}'",
                    reportCode, connectionCode, tableName);

        } catch (Exception e) {
            log.error("Failed to resolve reportCode: {}", request.getReportCode(), e);
            throw new RuntimeException("Failed to resolve report configuration: " + e.getMessage(), e);
        }
    }

    /**
     * Auto-detect the appropriate OLAP engine from the database connection type.
     *
     * @param connectionCode The connection code to look up
     * @return The detected engine: "duckdb", "clickhouse", or "browser"
     */
    private String detectEngineFromConnection(String connectionCode) {
        ensureServicesInitialized();
        try {
            ServerDatabaseSettings dbSettings = connectionManager.getServerDatabaseSettings(connectionCode);
            String dbType = dbSettings.type != null ? dbSettings.type.toLowerCase() : "";
            
            switch (dbType) {
                case "duckdb":
                    log.debug("Auto-detected engine 'duckdb' from connection type '{}'", dbType);
                    return "duckdb";
                case "clickhouse":
                    log.debug("Auto-detected engine 'clickhouse' from connection type '{}'", dbType);
                    return "clickhouse";
                default:
                    log.debug("Connection type '{}' is not an OLAP database, falling back to 'browser' engine", dbType);
                    return "browser";
            }
        } catch (Exception e) {
            log.warn("Failed to detect engine from connection '{}': {}. Falling back to 'browser'", 
                    connectionCode, e.getMessage());
            return "browser";
        }
    }

    /**
     * Execute a pivot table query.
     *
     * POST /api/analytics/pivot
     *
     * Request body example (Option 1 - recommended):
     * {
     *   "reportCode": "piv-northwind-warehouse-duckdb",
     *   "rows": ["country", "city"],
     *   "cols": ["product_category"],
     *   "vals": ["revenue"],
     *   "aggregatorName": "Sum",
     *   "filters": {
     *     "year": ["2023", "2024"]
     *   }
     * }
     *
     * Request body example (Option 2 - legacy):
     * {
     *   "connectionCode": "my-connection",
     *   "tableName": "orders",
     *   "engine": "duckdb",
     *   "rows": ["country", "city"],
     *   "cols": ["product_category"],
     *   "vals": ["revenue"],
     *   "aggregatorName": "Sum"
     * }
     *
     * @param request The pivot configuration
     * @return PivotResponse with aggregated data
     */
    @PostMapping("/pivot")
    public ResponseEntity<?> executePivot(@RequestBody PivotRequest request) {
        ensureServicesInitialized();
        try {
            // If reportCode is provided, resolve connectionCode + tableName from reporting.xml
            if (request.getReportCode() != null && !request.getReportCode().isEmpty()) {
                log.info("Received pivot request for reportCode: {}", request.getReportCode());
                resolveConnectionFromReportCode(request);
            } else {
                log.info("Received pivot request for table: {}, engine: {}",
                        request.getTableName(), request.getEngine());
            }

            // Validate request (after resolution)
            if (request.getConnectionCode() == null || request.getConnectionCode().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required (or provide reportCode)"));
            }
            if (request.getTableName() == null || request.getTableName().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("tableName is required (or provide reportCode)"));
            }

            // Determine engine: use provided value or auto-detect from connection
            String engine;
            if (request.getEngine() != null && !request.getEngine().isEmpty()) {
                engine = request.getEngine().toLowerCase();
                log.debug("Using explicitly provided engine: {}", engine);
            } else {
                engine = detectEngineFromConnection(request.getConnectionCode());
                log.info("Auto-detected engine '{}' from connection '{}'", engine, request.getConnectionCode());
            }
            
            // Browser engine means client-side processing - return empty response
            if ("browser".equals(engine)) {
                log.debug("Engine is 'browser', returning indication for client-side processing");
                Map<String, Object> browserResponse = new HashMap<>();
                browserResponse.put("engine", "browser");
                browserResponse.put("message", "Connection type requires client-side (browser) pivot processing");
                return ResponseEntity.ok(browserResponse);
            }

            // Route to appropriate OLAP service based on engine
            PivotResponse response;
            java.util.List<String> availableColumns = null;
            switch (engine) {
                case "clickhouse":
                    log.debug("Routing to ClickHouse analytics service");
                    response = clickHouseService.executePivot(request);
                    availableColumns = clickHouseService.getTableColumns(request.getConnectionCode(), request.getTableName());
                    break;
                case "duckdb":
                default:
                    log.debug("Routing to DuckDB analytics service");
                    response = duckDBService.executePivot(request);
                    availableColumns = duckDBService.getTableColumns(request.getConnectionCode(), request.getTableName());
                    break;
            }

            // Include all table columns so frontend can show draggable fields
            if (availableColumns != null) {
                response.getMetadata().setAvailableColumns(availableColumns);
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid pivot request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid request: " + e.getMessage()));

        } catch (Exception e) {
            log.error("Error executing pivot query", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Query execution failed: " + e.getMessage()));
        }
    }

    /**
     * Get list of supported aggregators.
     *
     * GET /api/analytics/aggregators
     * GET /api/analytics/aggregators?engine=clickhouse
     *
     * @param engine Optional engine parameter (duckdb or clickhouse)
     * @return List of aggregator names
     */
    @GetMapping("/aggregators")
    public ResponseEntity<List<String>> getSupportedAggregators(
            @RequestParam(defaultValue = "duckdb") String engine) {
        ensureServicesInitialized();
        List<String> aggregators;
        if ("clickhouse".equalsIgnoreCase(engine)) {
            aggregators = clickHouseService.getSupportedAggregators();
        } else {
            aggregators = duckDBService.getSupportedAggregators();
        }
        return ResponseEntity.ok(aggregators);
    }

    /**
     * Get aggregator display names for UI.
     *
     * GET /api/analytics/aggregators/display-names
     *
     * @return Map of aggregator names to display names
     */
    @GetMapping("/aggregators/display-names")
    public ResponseEntity<Map<String, String>> getAggregatorDisplayNames() {
        ensureServicesInitialized();
        Map<String, String> displayNames = duckDBService.getAggregatorDisplayNames();
        return ResponseEntity.ok(displayNames);
    }

    /**
     * Health check endpoint.
     *
     * GET /api/analytics/health
     *
     * @return Health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        ensureServicesInitialized();
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Analytics (DuckDB + ClickHouse)");
        health.put("engines", Map.of(
            "duckdb", Map.of(
                "supportedAggregators", duckDBService.getSupportedAggregators().size(),
                "cache", duckDBService.getCacheStats()
            ),
            "clickhouse", Map.of(
                "supportedAggregators", clickHouseService.getSupportedAggregators().size(),
                "cache", clickHouseService.getCacheStats()
            )
        ));
        return ResponseEntity.ok(health);
    }

    /**
     * Get cache statistics.
     *
     * GET /api/analytics/cache/stats
     * GET /api/analytics/cache/stats?engine=clickhouse
     *
     * @param engine Optional engine parameter (duckdb or clickhouse)
     * @return Cache statistics
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats(
            @RequestParam(defaultValue = "duckdb") String engine) {
        ensureServicesInitialized();
        Map<String, Object> stats;
        if ("clickhouse".equalsIgnoreCase(engine)) {
            stats = clickHouseService.getCacheStats();
        } else {
            stats = duckDBService.getCacheStats();
        }
        return ResponseEntity.ok(stats);
    }

    /**
     * Clear query cache.
     *
     * POST /api/analytics/cache/clear
     * POST /api/analytics/cache/clear?engine=clickhouse
     * POST /api/analytics/cache/clear?engine=all
     *
     * @param engine Optional engine parameter (duckdb, clickhouse, or all)
     * @return Success message
     */
    @PostMapping("/cache/clear")
    public ResponseEntity<Map<String, Object>> clearCache(
            @RequestParam(defaultValue = "duckdb") String engine) {
        Map<String, Object> response = new HashMap<>();
        
        if ("all".equalsIgnoreCase(engine)) {
            duckDBService.clearCache();
            clickHouseService.clearCache();
            response.put("message", "All caches cleared successfully");
            response.put("engines", List.of("duckdb", "clickhouse"));
        } else if ("clickhouse".equalsIgnoreCase(engine)) {
            clickHouseService.clearCache();
            response.put("message", "ClickHouse cache cleared successfully");
            response.put("engine", "clickhouse");
        } else {
            duckDBService.clearCache();
            response.put("message", "DuckDB cache cleared successfully");
            response.put("engine", "duckdb");
        }
        
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Query a file directly (CSV, Parquet, JSON).
     *
     * POST /api/analytics/query-file
     *
     * Request body example:
     * {
     *   "connectionCode": "my-connection",
     *   "filePath": "/path/to/data.csv",
     *   "format": "CSV",
     *   "query": "SELECT * FROM data WHERE amount > 100",
     *   "options": {
     *     "delimiter": ",",
     *     "header": "true"
     *   }
     * }
     *
     * @param request The file query configuration
     * @return Query results
     */
    @PostMapping("/query-file")
    public ResponseEntity<?> queryFile(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received file query request");

            // Validate request
            String connectionCode = (String) request.get("connectionCode");
            String filePath = (String) request.get("filePath");
            String format = (String) request.get("format");
            String query = (String) request.get("query");

            if (connectionCode == null || connectionCode.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required"));
            }
            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("filePath is required"));
            }
            if (query == null || query.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("query is required"));
            }

            // Detect format if not provided
            DuckDBFileHandler.FileFormat fileFormat;
            if (format == null || format.isEmpty()) {
                fileFormat = DuckDBFileHandler.detectFormat(filePath);
                if (fileFormat == null) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Could not detect file format. Please specify format (CSV, PARQUET, or JSON)"));
                }
            } else {
                try {
                    fileFormat = DuckDBFileHandler.FileFormat.valueOf(format.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Invalid format. Must be CSV, PARQUET, or JSON"));
                }
            }

            // Get options if provided
            @SuppressWarnings("unchecked")
            Map<String, String> options = (Map<String, String>) request.getOrDefault("options", new HashMap<>());

            // Execute file query
            DuckDBFileHandler.FileQueryConfig config = new DuckDBFileHandler.FileQueryConfig(filePath, fileFormat, options);
            List<Map<String, Object>> results = duckDBService.queryFile(connectionCode, config, query);

            Map<String, Object> response = new HashMap<>();
            response.put("data", results);
            response.put("rowCount", results.size());
            response.put("filePath", filePath);
            response.put("format", fileFormat.name());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid file query request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid request: " + e.getMessage()));

        } catch (Exception e) {
            log.error("Error executing file query", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("File query failed: " + e.getMessage()));
        }
    }

    /**
     * Get schema information from a file.
     *
     * POST /api/analytics/file-schema
     *
     * Request body example:
     * {
     *   "connectionCode": "my-connection",
     *   "filePath": "/path/to/data.csv",
     *   "format": "CSV"
     * }
     *
     * @param request The file schema request
     * @return File schema
     */
    @PostMapping("/file-schema")
    public ResponseEntity<?> getFileSchema(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received file schema request");

            String connectionCode = (String) request.get("connectionCode");
            String filePath = (String) request.get("filePath");
            String format = (String) request.get("format");

            if (connectionCode == null || connectionCode.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required"));
            }
            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("filePath is required"));
            }

            // Detect format if not provided
            DuckDBFileHandler.FileFormat fileFormat;
            if (format == null || format.isEmpty()) {
                fileFormat = DuckDBFileHandler.detectFormat(filePath);
                if (fileFormat == null) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Could not detect file format"));
                }
            } else {
                try {
                    fileFormat = DuckDBFileHandler.FileFormat.valueOf(format.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Invalid format"));
                }
            }

            DuckDBFileHandler.FileQueryConfig config = new DuckDBFileHandler.FileQueryConfig(filePath, fileFormat);
            List<Map<String, String>> schema = duckDBService.getFileSchema(connectionCode, config);

            Map<String, Object> response = new HashMap<>();
            response.put("schema", schema);
            response.put("filePath", filePath);
            response.put("format", fileFormat.name());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting file schema", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get file schema: " + e.getMessage()));
        }
    }

    /**
     * Get sample data from a file.
     *
     * POST /api/analytics/file-sample
     *
     * Request body example:
     * {
     *   "connectionCode": "my-connection",
     *   "filePath": "/path/to/data.csv",
     *   "format": "CSV",
     *   "limit": 10
     * }
     *
     * @param request The file sample request
     * @return Sample data
     */
    @PostMapping("/file-sample")
    public ResponseEntity<?> getFileSample(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received file sample request");

            String connectionCode = (String) request.get("connectionCode");
            String filePath = (String) request.get("filePath");
            String format = (String) request.get("format");
            Integer limit = request.containsKey("limit") ? (Integer) request.get("limit") : 10;

            if (connectionCode == null || connectionCode.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required"));
            }
            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("filePath is required"));
            }

            // Detect format if not provided
            DuckDBFileHandler.FileFormat fileFormat;
            if (format == null || format.isEmpty()) {
                fileFormat = DuckDBFileHandler.detectFormat(filePath);
                if (fileFormat == null) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Could not detect file format"));
                }
            } else {
                try {
                    fileFormat = DuckDBFileHandler.FileFormat.valueOf(format.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Invalid format"));
                }
            }

            DuckDBFileHandler.FileQueryConfig config = new DuckDBFileHandler.FileQueryConfig(filePath, fileFormat);
            List<Map<String, Object>> sample = duckDBService.getFileSample(connectionCode, config, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("data", sample);
            response.put("rowCount", sample.size());
            response.put("filePath", filePath);
            response.put("format", fileFormat.name());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting file sample", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get file sample: " + e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        error.put("timestamp", System.currentTimeMillis());
        return error;
    }
}
