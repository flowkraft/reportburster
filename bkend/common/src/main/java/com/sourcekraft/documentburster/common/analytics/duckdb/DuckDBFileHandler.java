package com.sourcekraft.documentburster.common.analytics.duckdb;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles direct file queries using DuckDB without importing data.
 *
 * DuckDB can query files directly using:
 * - read_csv() / read_csv_auto() for CSV files
 * - read_parquet() for Parquet files
 * - read_json() / read_json_auto() for JSON files
 *
 * This allows querying large files without loading them into a database first.
 */
public class DuckDBFileHandler {

    /**
     * File format types supported by DuckDB
     */
    public enum FileFormat {
        CSV,
        PARQUET,
        JSON
    }

    /**
     * Configuration for file query
     */
    public static class FileQueryConfig {
        private final String filePath;
        private final FileFormat format;
        private final Map<String, String> options;

        public FileQueryConfig(String filePath, FileFormat format) {
            this.filePath = filePath;
            this.format = format;
            this.options = new HashMap<>();
        }

        public FileQueryConfig(String filePath, FileFormat format, Map<String, String> options) {
            this.filePath = filePath;
            this.format = format;
            this.options = new HashMap<>(options);
        }

        public String getFilePath() { return filePath; }
        public FileFormat getFormat() { return format; }
        public Map<String, String> getOptions() { return options; }

        public void setOption(String key, String value) {
            this.options.put(key, value);
        }
    }

    /**
     * Query a CSV file directly.
     *
     * Example:
     *   List<Map<String, Object>> results = queryCSV(conn, "/path/to/data.csv", "SELECT * FROM data WHERE amount > 100");
     *
     * @param connection DuckDB connection
     * @param filePath Path to CSV file
     * @param query SQL query (use "data" as table name in FROM clause)
     * @return List of result rows
     * @throws SQLException if query fails
     */
    public List<Map<String, Object>> queryCSV(Connection connection, String filePath, String query) throws SQLException {
        return queryFile(connection, new FileQueryConfig(filePath, FileFormat.CSV), query);
    }

    /**
     * Query a CSV file with custom options.
     *
     * Example:
     *   Map<String, String> opts = new HashMap<>();
     *   opts.put("delimiter", "|");
     *   opts.put("header", "true");
     *   List<Map<String, Object>> results = queryCSV(conn, "/path/to/data.csv", "SELECT * FROM data", opts);
     *
     * @param connection DuckDB connection
     * @param filePath Path to CSV file
     * @param query SQL query
     * @param options CSV options (delimiter, header, etc.)
     * @return List of result rows
     * @throws SQLException if query fails
     */
    public List<Map<String, Object>> queryCSV(Connection connection, String filePath, String query, Map<String, String> options) throws SQLException {
        return queryFile(connection, new FileQueryConfig(filePath, FileFormat.CSV, options), query);
    }

    /**
     * Query a Parquet file directly.
     *
     * Example:
     *   List<Map<String, Object>> results = queryParquet(conn, "/path/to/data.parquet", "SELECT * FROM data WHERE year = 2024");
     *
     * @param connection DuckDB connection
     * @param filePath Path to Parquet file
     * @param query SQL query (use "data" as table name in FROM clause)
     * @return List of result rows
     * @throws SQLException if query fails
     */
    public List<Map<String, Object>> queryParquet(Connection connection, String filePath, String query) throws SQLException {
        return queryFile(connection, new FileQueryConfig(filePath, FileFormat.PARQUET), query);
    }

    /**
     * Query a JSON file directly.
     *
     * Example:
     *   List<Map<String, Object>> results = queryJSON(conn, "/path/to/data.json", "SELECT * FROM data WHERE status = 'active'");
     *
     * @param connection DuckDB connection
     * @param filePath Path to JSON file
     * @param query SQL query (use "data" as table name in FROM clause)
     * @return List of result rows
     * @throws SQLException if query fails
     */
    public List<Map<String, Object>> queryJSON(Connection connection, String filePath, String query) throws SQLException {
        return queryFile(connection, new FileQueryConfig(filePath, FileFormat.JSON), query);
    }

    /**
     * Query a file directly with custom configuration.
     *
     * @param connection DuckDB connection
     * @param config File query configuration
     * @param query SQL query (use "data" as table name in FROM clause)
     * @return List of result rows
     * @throws SQLException if query fails
     */
    public List<Map<String, Object>> queryFile(Connection connection, FileQueryConfig config, String query) throws SQLException {
        // Replace "data" in the query with the actual file read function
        String fileFunction = buildFileFunction(config);
        String actualQuery = query.replaceAll("(?i)\\bFROM\\s+data\\b", "FROM " + fileFunction);

        List<Map<String, Object>> results = new ArrayList<>();

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(actualQuery)) {

            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = metaData.getColumnName(i);
                    Object value = rs.getObject(i);
                    row.put(columnName, value);
                }
                results.add(row);
            }
        } catch (SQLException e) {
            throw new SQLException("Failed to query file '" + config.getFilePath() + "': " + e.getMessage(), e);
        }

        return results;
    }

    /**
     * Get schema information from a file.
     *
     * @param connection DuckDB connection
     * @param config File query configuration
     * @return List of column information (name, type)
     * @throws SQLException if schema fetch fails
     */
    public List<Map<String, String>> getFileSchema(Connection connection, FileQueryConfig config) throws SQLException {
        String fileFunction = buildFileFunction(config);
        String query = "SELECT * FROM " + fileFunction + " LIMIT 0";

        List<Map<String, String>> schema = new ArrayList<>();

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();

            for (int i = 1; i <= columnCount; i++) {
                Map<String, String> column = new HashMap<>();
                column.put("name", metaData.getColumnName(i));
                column.put("type", metaData.getColumnTypeName(i));
                column.put("class", metaData.getColumnClassName(i));
                schema.add(column);
            }
        } catch (SQLException e) {
            throw new SQLException("Failed to get schema for file '" + config.getFilePath() + "': " + e.getMessage(), e);
        }

        return schema;
    }

    /**
     * Count rows in a file.
     *
     * @param connection DuckDB connection
     * @param config File query configuration
     * @return Number of rows
     * @throws SQLException if count fails
     */
    public long countRows(Connection connection, FileQueryConfig config) throws SQLException {
        String fileFunction = buildFileFunction(config);
        String query = "SELECT COUNT(*) as row_count FROM " + fileFunction;

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            if (rs.next()) {
                return rs.getLong("row_count");
            }
            return 0;

        } catch (SQLException e) {
            throw new SQLException("Failed to count rows in file '" + config.getFilePath() + "': " + e.getMessage(), e);
        }
    }

    /**
     * Get sample data from a file.
     *
     * @param connection DuckDB connection
     * @param config File query configuration
     * @param limit Number of rows to return
     * @return List of sample rows
     * @throws SQLException if query fails
     */
    public List<Map<String, Object>> getSample(Connection connection, FileQueryConfig config, int limit) throws SQLException {
        String fileFunction = buildFileFunction(config);
        String query = "SELECT * FROM " + fileFunction + " LIMIT " + limit;

        List<Map<String, Object>> results = new ArrayList<>();

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = metaData.getColumnName(i);
                    Object value = rs.getObject(i);
                    row.put(columnName, value);
                }
                results.add(row);
            }
        } catch (SQLException e) {
            throw new SQLException("Failed to get sample from file '" + config.getFilePath() + "': " + e.getMessage(), e);
        }

        return results;
    }

    /**
     * Build DuckDB file reading function based on format.
     */
    private String buildFileFunction(FileQueryConfig config) {
        String path = escapeSQLString(config.getFilePath());
        FileFormat format = config.getFormat();
        Map<String, String> options = config.getOptions();

        switch (format) {
            case CSV:
                if (!options.isEmpty()) {
                    StringBuilder opts = new StringBuilder();
                    for (Map.Entry<String, String> entry : options.entrySet()) {
                        if (opts.length() > 0) opts.append(", ");
                        opts.append(entry.getKey()).append("=").append(entry.getValue());
                    }
                    return String.format("read_csv_auto('%s', %s)", path, opts);
                } else {
                    return String.format("read_csv_auto('%s')", path);
                }

            case PARQUET:
                return String.format("read_parquet('%s')", path);

            case JSON:
                if (!options.isEmpty()) {
                    StringBuilder opts = new StringBuilder();
                    for (Map.Entry<String, String> entry : options.entrySet()) {
                        if (opts.length() > 0) opts.append(", ");
                        opts.append(entry.getKey()).append("=").append(entry.getValue());
                    }
                    return String.format("read_json_auto('%s', %s)", path, opts);
                } else {
                    return String.format("read_json_auto('%s')", path);
                }

            default:
                throw new IllegalArgumentException("Unsupported file format: " + format);
        }
    }

    /**
     * Escape string for safe SQL usage.
     */
    private String escapeSQLString(String str) {
        if (str == null) return "";
        return str.replace("'", "''");
    }

    /**
     * Detect file format from file extension.
     *
     * @param filePath Path to file
     * @return Detected format, or null if unknown
     */
    public static FileFormat detectFormat(String filePath) {
        if (filePath == null) return null;

        String lower = filePath.toLowerCase();
        if (lower.endsWith(".csv") || lower.endsWith(".tsv")) {
            return FileFormat.CSV;
        } else if (lower.endsWith(".parquet") || lower.endsWith(".pq")) {
            return FileFormat.PARQUET;
        } else if (lower.endsWith(".json") || lower.endsWith(".jsonl") || lower.endsWith(".ndjson")) {
            return FileFormat.JSON;
        }

        return null;
    }
}
