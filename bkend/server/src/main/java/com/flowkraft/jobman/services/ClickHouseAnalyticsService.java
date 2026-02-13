package com.flowkraft.jobman.services;

import com.sourcekraft.documentburster.common.analytics.PivotSQLGenerator;
import com.sourcekraft.documentburster.common.analytics.clickhouse.ClickHousePivotProcessor;
import com.sourcekraft.documentburster.common.analytics.dto.AggregatorType;
import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import com.sourcekraft.documentburster.common.analytics.dto.PivotResponse;
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
 * Service for executing OLAP analytics queries using ClickHouse.
 * Handles pivot table operations with server-side processing against ClickHouse database.
 * 
 * ClickHouse is an open-source column-oriented DBMS optimized for OLAP workloads.
 * It excels at:
 * - Real-time analytical queries
 * - Large-scale data aggregation
 * - High-speed data ingestion
 * - Efficient storage compression
 */
public class ClickHouseAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(ClickHouseAnalyticsService.class);

    private final DatabaseConnectionManager connectionManager;
    private final PivotSQLGenerator sqlGenerator;
    private final QueryCache queryCache;

    public ClickHouseAnalyticsService(DatabaseConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
        this.sqlGenerator = new ClickHousePivotProcessor();
        this.queryCache = new QueryCache(100, 5 * 60 * 1000); // 100 entries, 5 minutes TTL
    }

    /**
     * Execute a pivot query against ClickHouse and return the aggregated results.
     *
     * @param request The pivot configuration
     * @return PivotResponse with data and metadata
     * @throws Exception if query execution fails
     */
    public PivotResponse executePivot(PivotRequest request) throws Exception {
        log.info("Executing ClickHouse pivot query for table: {}, aggregator: {}",
                request.getTableName(), request.getAggregatorName());

        long startTime = System.currentTimeMillis();

        // Generate SQL
        String sql = sqlGenerator.generateSQL(request);
        log.debug("Generated ClickHouse SQL: {}", sql);

        // Check cache
        String cacheKey = QueryCache.generateKey(request.getConnectionCode(), sql);
        PivotResponse cachedResponse = queryCache.get(cacheKey);
        if (cachedResponse != null) {
            log.info("Returning cached result for ClickHouse query (cache hit)");
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

        log.info("ClickHouse pivot query completed in {}ms, returned {} rows",
                metadata.getExecutionTimeMs(), metadata.getRowCount());

        // Cache the result
        queryCache.put(cacheKey, response);

        return response;
    }

    /**
     * Execute SQL query against ClickHouse and return results as list of maps.
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
     * Get all column names for a table/view.
     */
    public List<String> getTableColumns(String connectionCode, String tableName) throws Exception {
        List<String> columns = new ArrayList<>();
        String sql = "SELECT * FROM `" + tableName.replace("`", "``") + "` LIMIT 0";
        try (Connection conn = connectionManager.getJdbcConnection(connectionCode);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            ResultSetMetaData metaData = rs.getMetaData();
            for (int i = 1; i <= metaData.getColumnCount(); i++) {
                columns.add(metaData.getColumnName(i));
            }
        }
        return columns;
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
     * Get cache statistics.
     */
    public Map<String, Object> getCacheStats() {
        return queryCache.getStats();
    }

    /**
     * Clear the query cache.
     */
    public void clearCache() {
        queryCache.clear();
    }
}
