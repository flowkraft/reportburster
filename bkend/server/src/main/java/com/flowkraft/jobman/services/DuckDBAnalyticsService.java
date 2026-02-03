package com.flowkraft.jobman.services;

import com.sourcekraft.documentburster.common.analytics.PivotSQLGenerator;
import com.sourcekraft.documentburster.common.analytics.dto.AggregatorType;
import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import com.sourcekraft.documentburster.common.analytics.dto.PivotResponse;
import com.sourcekraft.documentburster.common.analytics.duckdb.DuckDBFileHandler;
import com.sourcekraft.documentburster.common.analytics.duckdb.DuckDBPivotProcessor;
import com.sourcekraft.documentburster.common.db.DatabaseConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for executing OLAP analytics queries using DuckDB.
 * Handles pivot table operations with server-side processing.
 */
public class DuckDBAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(DuckDBAnalyticsService.class);

    private final DatabaseConnectionManager connectionManager;
    private final PivotSQLGenerator sqlGenerator;
    private final DuckDBFileHandler fileHandler;
    private final QueryCache queryCache;

    public DuckDBAnalyticsService(DatabaseConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
        this.sqlGenerator = new DuckDBPivotProcessor();
        this.fileHandler = new DuckDBFileHandler();
        this.queryCache = new QueryCache(100, 5 * 60 * 1000); // 100 entries, 5 minutes TTL
    }

    /**
     * Execute a pivot query and return the aggregated results.
     *
     * @param request The pivot configuration
     * @return PivotResponse with data and metadata
     * @throws Exception if query execution fails
     */
    public PivotResponse executePivot(PivotRequest request) throws Exception {
        log.info("Executing pivot query for table: {}, aggregator: {}",
                request.getTableName(), request.getAggregatorName());

        long startTime = System.currentTimeMillis();

        // Generate SQL
        String sql = sqlGenerator.generateSQL(request);
        log.debug("Generated SQL: {}", sql);

        // Check cache
        String cacheKey = QueryCache.generateKey(request.getConnectionCode(), sql);
        PivotResponse cachedResponse = queryCache.get(cacheKey);
        if (cachedResponse != null) {
            log.info("Returning cached result for query (cache hit)");
            return cachedResponse;
        }

        // Execute query
        List<Map<String, Object>> results = executeQuery(request.getConnectionCode(), sql);

        // Build response
        PivotResponse response = new PivotResponse();
        response.setData(results);

        // Set metadata
        PivotResponse.PivotMetadata metadata = response.getMetadata();
        metadata.setExecutionTimeMs(System.currentTimeMillis() - startTime);
        metadata.setRowCount(results.size());
        metadata.setAggregatorUsed(request.getAggregatorName());
        metadata.setCached(false);

        log.info("Pivot query completed in {}ms, returned {} rows",
                metadata.getExecutionTimeMs(), metadata.getRowCount());

        // Cache the result
        queryCache.put(cacheKey, response);

        return response;
    }

    /**
     * Execute SQL query and return results as list of maps.
     */
    private List<Map<String, Object>> executeQuery(String connectionCode, String sql) throws Exception {
        List<Map<String, Object>> results = new ArrayList<>();

        try (Connection conn = connectionManager.getJdbcConnection(connectionCode);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

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
        }

        return results;
    }

    /**
     * Get list of supported aggregators.
     */
    public List<String> getSupportedAggregators() {
        return sqlGenerator.getSupportedAggregators();
    }

    /**
     * Check if an aggregator is supported.
     */
    public boolean supportsAggregator(String aggregatorName) {
        return sqlGenerator.supportsAggregator(aggregatorName);
    }

    /**
     * Get aggregator display names for UI.
     */
    public Map<String, String> getAggregatorDisplayNames() {
        Map<String, String> displayNames = new HashMap<>();
        for (AggregatorType type : AggregatorType.values()) {
            displayNames.put(type.name(), type.getDisplayName());
        }
        return displayNames;
    }

    /**
     * Query a file directly (CSV, Parquet, JSON).
     *
     * @param connectionCode Database connection code
     * @param config File query configuration
     * @param query SQL query
     * @return Query results
     * @throws Exception if query execution fails
     */
    public List<Map<String, Object>> queryFile(String connectionCode, DuckDBFileHandler.FileQueryConfig config, String query) throws Exception {
        log.info("Executing file query for: {}, format: {}", config.getFilePath(), config.getFormat());

        try (Connection conn = connectionManager.getJdbcConnection(connectionCode)) {
            return fileHandler.queryFile(conn, config, query);
        }
    }

    /**
     * Get schema information from a file.
     *
     * @param connectionCode Database connection code
     * @param config File query configuration
     * @return List of column information
     * @throws Exception if schema fetch fails
     */
    public List<Map<String, String>> getFileSchema(String connectionCode, DuckDBFileHandler.FileQueryConfig config) throws Exception {
        log.info("Getting schema for file: {}, format: {}", config.getFilePath(), config.getFormat());

        try (Connection conn = connectionManager.getJdbcConnection(connectionCode)) {
            return fileHandler.getFileSchema(conn, config);
        }
    }

    /**
     * Get sample data from a file.
     *
     * @param connectionCode Database connection code
     * @param config File query configuration
     * @param limit Number of rows to return
     * @return Sample data
     * @throws Exception if query fails
     */
    public List<Map<String, Object>> getFileSample(String connectionCode, DuckDBFileHandler.FileQueryConfig config, int limit) throws Exception {
        log.info("Getting sample from file: {}, format: {}, limit: {}", config.getFilePath(), config.getFormat(), limit);

        try (Connection conn = connectionManager.getJdbcConnection(connectionCode)) {
            return fileHandler.getSample(conn, config, limit);
        }
    }

    /**
     * Count rows in a file.
     *
     * @param connectionCode Database connection code
     * @param config File query configuration
     * @return Number of rows
     * @throws Exception if count fails
     */
    public long countFileRows(String connectionCode, DuckDBFileHandler.FileQueryConfig config) throws Exception {
        log.info("Counting rows in file: {}, format: {}", config.getFilePath(), config.getFormat());

        try (Connection conn = connectionManager.getJdbcConnection(connectionCode)) {
            return fileHandler.countRows(conn, config);
        }
    }

    /**
     * Clear query cache.
     */
    public void clearCache() {
        queryCache.clear();
    }

    /**
     * Get cache statistics.
     *
     * @return Map with cache stats
     */
    public Map<String, Object> getCacheStats() {
        return queryCache.getStats();
    }
}
