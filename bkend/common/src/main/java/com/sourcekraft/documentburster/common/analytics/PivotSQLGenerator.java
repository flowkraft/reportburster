package com.sourcekraft.documentburster.common.analytics;

import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import java.util.List;

/**
 * Interface for generating SQL queries for pivot table operations.
 * Implementations should be database-specific (DuckDB, PostgreSQL, etc.).
 */
public interface PivotSQLGenerator {

    /**
     * Generate SQL query from pivot request.
     *
     * @param request The pivot table configuration
     * @return SQL query string
     */
    String generateSQL(PivotRequest request);

    /**
     * Check if this generator supports a given aggregator.
     *
     * @param aggregatorName The aggregator name to check
     * @return true if supported, false otherwise
     */
    boolean supportsAggregator(String aggregatorName);

    /**
     * Get list of all supported aggregator names.
     *
     * @return List of aggregator names
     */
    List<String> getSupportedAggregators();

    /**
     * Get the database type this generator supports.
     *
     * @return Database type identifier (e.g., "duckdb", "postgresql")
     */
    String getDatabaseType();
}
