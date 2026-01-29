package com.sourcekraft.documentburster.common.analytics.duckdb;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages DuckDB ATTACH operations for multiple data sources.
 *
 * DuckDB can ATTACH:
 * - SQLite databases (native support)
 * - Any JDBC database (PostgreSQL, MySQL, Oracle, SQL Server, DB2, etc.)
 * - CSV files
 * - Parquet files
 * - JSON files
 *
 * This manager provides a centralized way to attach external data sources
 * and query across them using DuckDB's powerful query engine.
 */
public class DuckDBAttachManager {

    /**
     * Type of data source to attach
     */
    public enum SourceType {
        SQLITE,      // Native SQLite support
        JDBC,        // Generic JDBC database (PostgreSQL, MySQL, Oracle, SQL Server, DB2, etc.)
        CSV,         // CSV files
        PARQUET,     // Parquet files
        JSON         // JSON files
    }

    /**
     * Configuration for attaching a data source
     */
    public static class AttachConfig {
        private final SourceType type;
        private final String alias;
        private final String path;
        private final Map<String, String> options;

        public AttachConfig(SourceType type, String alias, String path) {
            this.type = type;
            this.alias = alias;
            this.path = path;
            this.options = new HashMap<>();
        }

        public AttachConfig(SourceType type, String alias, String path, Map<String, String> options) {
            this.type = type;
            this.alias = alias;
            this.path = path;
            this.options = new HashMap<>(options);
        }

        public SourceType getType() { return type; }
        public String getAlias() { return alias; }
        public String getPath() { return path; }
        public Map<String, String> getOptions() { return options; }

        public void setOption(String key, String value) {
            this.options.put(key, value);
        }
    }

    /**
     * Information about an attached source
     */
    public static class AttachedSource {
        private final String alias;
        private final SourceType type;
        private final String path;
        private final List<String> tables;

        public AttachedSource(String alias, SourceType type, String path, List<String> tables) {
            this.alias = alias;
            this.type = type;
            this.path = path;
            this.tables = new ArrayList<>(tables);
        }

        public String getAlias() { return alias; }
        public SourceType getType() { return type; }
        public String getPath() { return path; }
        public List<String> getTables() { return new ArrayList<>(tables); }
    }

    // Track attached sources per connection
    private final Map<String, AttachedSource> attachedSources = new ConcurrentHashMap<>();

    /**
     * Attach a SQLite database to DuckDB.
     *
     * Example:
     *   attachSQLite(conn, "mydb", "/path/to/database.sqlite");
     *   // Query: SELECT * FROM mydb.users
     *
     * @param connection DuckDB connection
     * @param alias Alias for the attached database
     * @param sqlitePath Path to SQLite database file
     * @throws SQLException if attach fails
     */
    public void attachSQLite(Connection connection, String alias, String sqlitePath) throws SQLException {
        AttachConfig config = new AttachConfig(SourceType.SQLITE, alias, sqlitePath);
        attach(connection, config);
    }

    /**
     * Attach any JDBC database to DuckDB (PostgreSQL, MySQL, Oracle, SQL Server, DB2, etc.).
     *
     * DuckDB will automatically detect the database type and use the appropriate scanner.
     *
     * Examples:
     *   // PostgreSQL
     *   attachJdbcDatabase(conn, "pgdb", "jdbc:postgresql://localhost:5432/mydb", "postgres", "password");
     *
     *   // MySQL
     *   attachJdbcDatabase(conn, "mydb", "jdbc:mysql://localhost:3306/mydb", "root", "password");
     *
     *   // Oracle
     *   attachJdbcDatabase(conn, "oracledb", "jdbc:oracle:thin:@localhost:1521:orcl", "system", "password");
     *
     *   // SQL Server
     *   attachJdbcDatabase(conn, "sqlserver", "jdbc:sqlserver://localhost:1433;databaseName=mydb", "sa", "password");
     *
     *   // IBM DB2
     *   attachJdbcDatabase(conn, "db2", "jdbc:db2://localhost:50000/mydb", "db2admin", "password");
     *
     * @param connection DuckDB connection
     * @param alias Alias for the attached database
     * @param jdbcUrl JDBC connection URL
     * @param username Database username
     * @param password Database password
     * @throws SQLException if attach fails
     */
    public void attachJdbcDatabase(Connection connection, String alias, String jdbcUrl, String username, String password) throws SQLException {
        AttachConfig config = new AttachConfig(SourceType.JDBC, alias, jdbcUrl);
        config.setOption("user", username);
        config.setOption("password", password);
        attach(connection, config);
    }

    /**
     * Attach any JDBC database with custom options.
     *
     * @param connection DuckDB connection
     * @param alias Alias for the attached database
     * @param jdbcUrl JDBC connection URL
     * @param options Connection options (user, password, etc.)
     * @throws SQLException if attach fails
     */
    public void attachJdbcDatabase(Connection connection, String alias, String jdbcUrl, Map<String, String> options) throws SQLException {
        AttachConfig config = new AttachConfig(SourceType.JDBC, alias, jdbcUrl, options);
        attach(connection, config);
    }

    /**
     * Attach a CSV file to DuckDB.
     *
     * Example:
     *   attachCSV(conn, "csvdata", "/path/to/data.csv");
     *   // Query: SELECT * FROM csvdata
     *
     * @param connection DuckDB connection
     * @param alias Alias for the CSV file
     * @param csvPath Path to CSV file
     * @throws SQLException if attach fails
     */
    public void attachCSV(Connection connection, String alias, String csvPath) throws SQLException {
        AttachConfig config = new AttachConfig(SourceType.CSV, alias, csvPath);
        attach(connection, config);
    }

    /**
     * Attach a CSV file with custom options.
     *
     * Example:
     *   Map<String, String> opts = new HashMap<>();
     *   opts.put("delimiter", "|");
     *   opts.put("header", "true");
     *   attachCSV(conn, "csvdata", "/path/to/data.csv", opts);
     *
     * @param connection DuckDB connection
     * @param alias Alias for the CSV file
     * @param csvPath Path to CSV file
     * @param options CSV reading options (delimiter, header, etc.)
     * @throws SQLException if attach fails
     */
    public void attachCSV(Connection connection, String alias, String csvPath, Map<String, String> options) throws SQLException {
        AttachConfig config = new AttachConfig(SourceType.CSV, alias, csvPath, options);
        attach(connection, config);
    }

    /**
     * Attach a Parquet file to DuckDB.
     *
     * Example:
     *   attachParquet(conn, "parquetdata", "/path/to/data.parquet");
     *   // Query: SELECT * FROM parquetdata
     *
     * @param connection DuckDB connection
     * @param alias Alias for the Parquet file
     * @param parquetPath Path to Parquet file
     * @throws SQLException if attach fails
     */
    public void attachParquet(Connection connection, String alias, String parquetPath) throws SQLException {
        AttachConfig config = new AttachConfig(SourceType.PARQUET, alias, parquetPath);
        attach(connection, config);
    }

    /**
     * Attach a JSON file to DuckDB.
     *
     * Example:
     *   attachJSON(conn, "jsondata", "/path/to/data.json");
     *   // Query: SELECT * FROM jsondata
     *
     * @param connection DuckDB connection
     * @param alias Alias for the JSON file
     * @param jsonPath Path to JSON file
     * @throws SQLException if attach fails
     */
    public void attachJSON(Connection connection, String alias, String jsonPath) throws SQLException {
        AttachConfig config = new AttachConfig(SourceType.JSON, alias, jsonPath);
        attach(connection, config);
    }

    /**
     * Generic attach method that handles all source types.
     *
     * @param connection DuckDB connection
     * @param config Attach configuration
     * @throws SQLException if attach fails
     */
    public void attach(Connection connection, AttachConfig config) throws SQLException {
        String alias = config.getAlias();
        String path = config.getPath();
        SourceType type = config.getType();

        // Check if already attached
        if (attachedSources.containsKey(alias)) {
            throw new SQLException("Alias '" + alias + "' is already attached. Detach it first.");
        }

        try (Statement stmt = connection.createStatement()) {
            String attachSQL = buildAttachSQL(config);
            stmt.execute(attachSQL);

            // Get list of tables from attached source
            List<String> tables = listTablesInAttached(connection, alias, type);

            // Track attached source
            AttachedSource source = new AttachedSource(alias, type, path, tables);
            attachedSources.put(alias, source);

        } catch (SQLException e) {
            throw new SQLException("Failed to attach '" + alias + "' from '" + path + "': " + e.getMessage(), e);
        }
    }

    /**
     * Build ATTACH SQL statement based on source type.
     */
    private String buildAttachSQL(AttachConfig config) {
        String alias = quoteIdentifier(config.getAlias());
        String path = escapeSQLString(config.getPath());
        SourceType type = config.getType();

        switch (type) {
            case SQLITE:
                return String.format("ATTACH '%s' AS %s (TYPE SQLITE)", path, alias);

            case JDBC:
                // Generic JDBC attachment - DuckDB auto-detects the database type
                // Supports: PostgreSQL, MySQL, Oracle, SQL Server, DB2, and more
                Map<String, String> jdbcOpts = config.getOptions();
                StringBuilder jdbcParams = new StringBuilder();

                // Build connection parameters
                for (Map.Entry<String, String> entry : jdbcOpts.entrySet()) {
                    if (jdbcParams.length() > 0) jdbcParams.append(", ");
                    jdbcParams.append(entry.getKey())
                             .append("='")
                             .append(escapeSQLString(entry.getValue()))
                             .append("'");
                }

                // Use DuckDB's generic JDBC scanner
                // Format: ATTACH 'jdbc:...' AS alias (TYPE JDBC, user='...', password='...')
                if (jdbcParams.length() > 0) {
                    return String.format("ATTACH '%s' AS %s (TYPE JDBC, %s)", path, alias, jdbcParams);
                } else {
                    return String.format("ATTACH '%s' AS %s (TYPE JDBC)", path, alias);
                }

            case CSV:
                // Create view from CSV file
                Map<String, String> csvOpts = config.getOptions();
                StringBuilder opts = new StringBuilder();
                if (!csvOpts.isEmpty()) {
                    for (Map.Entry<String, String> entry : csvOpts.entrySet()) {
                        if (opts.length() > 0) opts.append(", ");
                        opts.append(entry.getKey()).append("=").append(entry.getValue());
                    }
                    return String.format("CREATE VIEW %s AS SELECT * FROM read_csv_auto('%s', %s)", alias, path, opts);
                } else {
                    return String.format("CREATE VIEW %s AS SELECT * FROM read_csv_auto('%s')", alias, path);
                }

            case PARQUET:
                // Create view from Parquet file
                return String.format("CREATE VIEW %s AS SELECT * FROM read_parquet('%s')", alias, path);

            case JSON:
                // Create view from JSON file
                return String.format("CREATE VIEW %s AS SELECT * FROM read_json_auto('%s')", alias, path);

            default:
                throw new IllegalArgumentException("Unsupported source type: " + type);
        }
    }

    /**
     * List tables in an attached source.
     */
    private List<String> listTablesInAttached(Connection connection, String alias, SourceType type) throws SQLException {
        List<String> tables = new ArrayList<>();

        try (Statement stmt = connection.createStatement()) {
            String query;

            if (type == SourceType.CSV || type == SourceType.PARQUET || type == SourceType.JSON) {
                // Files are exposed as views
                query = String.format(
                    "SELECT table_name FROM information_schema.tables " +
                    "WHERE table_schema = 'main' AND table_name = '%s'",
                    alias.replace("\"", "")
                );
            } else {
                // Database types (SQLite, PostgreSQL, MySQL)
                query = String.format(
                    "SELECT table_name FROM information_schema.tables " +
                    "WHERE table_schema = '%s'",
                    alias.replace("\"", "")
                );
            }

            try (ResultSet rs = stmt.executeQuery(query)) {
                while (rs.next()) {
                    tables.add(rs.getString("table_name"));
                }
            }
        } catch (SQLException e) {
            // If query fails, return empty list (non-critical)
            // Some sources may not expose schema information
        }

        return tables;
    }

    /**
     * Detach a previously attached source.
     *
     * @param connection DuckDB connection
     * @param alias Alias of the attached source
     * @throws SQLException if detach fails
     */
    public void detach(Connection connection, String alias) throws SQLException {
        if (!attachedSources.containsKey(alias)) {
            throw new SQLException("Alias '" + alias + "' is not attached.");
        }

        AttachedSource source = attachedSources.get(alias);

        try (Statement stmt = connection.createStatement()) {
            String detachSQL = buildDetachSQL(alias, source.getType());
            stmt.execute(detachSQL);

            // Remove from tracking
            attachedSources.remove(alias);

        } catch (SQLException e) {
            throw new SQLException("Failed to detach '" + alias + "': " + e.getMessage(), e);
        }
    }

    /**
     * Build DETACH SQL statement based on source type.
     */
    private String buildDetachSQL(String alias, SourceType type) {
        String quotedAlias = quoteIdentifier(alias);

        switch (type) {
            case SQLITE:
            case JDBC:
                return String.format("DETACH %s", quotedAlias);

            case CSV:
            case PARQUET:
            case JSON:
                // Drop the view
                return String.format("DROP VIEW IF EXISTS %s", quotedAlias);

            default:
                throw new IllegalArgumentException("Unsupported source type: " + type);
        }
    }

    /**
     * Get information about an attached source.
     *
     * @param alias Alias of the attached source
     * @return AttachedSource info, or null if not attached
     */
    public AttachedSource getAttachedSource(String alias) {
        return attachedSources.get(alias);
    }

    /**
     * Get all attached sources.
     *
     * @return Map of alias to AttachedSource
     */
    public Map<String, AttachedSource> getAllAttachedSources() {
        return new HashMap<>(attachedSources);
    }

    /**
     * Check if a source is attached.
     *
     * @param alias Alias to check
     * @return true if attached
     */
    public boolean isAttached(String alias) {
        return attachedSources.containsKey(alias);
    }

    /**
     * Detach all attached sources.
     *
     * @param connection DuckDB connection
     */
    public void detachAll(Connection connection) {
        List<String> aliases = new ArrayList<>(attachedSources.keySet());
        for (String alias : aliases) {
            try {
                detach(connection, alias);
            } catch (SQLException e) {
                // Log error but continue detaching others
                System.err.println("Failed to detach '" + alias + "': " + e.getMessage());
            }
        }
    }

    /**
     * Quote identifier for safe SQL usage.
     */
    private String quoteIdentifier(String identifier) {
        if (identifier == null || identifier.isEmpty()) {
            throw new IllegalArgumentException("Identifier cannot be null or empty");
        }
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    /**
     * Escape string for safe SQL usage.
     */
    private String escapeSQLString(String str) {
        if (str == null) return "";
        return str.replace("'", "''");
    }
}
