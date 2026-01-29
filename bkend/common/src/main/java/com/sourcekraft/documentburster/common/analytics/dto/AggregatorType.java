package com.sourcekraft.documentburster.common.analytics.dto;

/**
 * Supported aggregator types for OLAP pivot tables.
 * Supports 20 aggregators compatible with DuckDB SQL.
 */
public enum AggregatorType {
    // Basic aggregators
    SUM("Sum", "SUM({0})"),
    COUNT("Count", "COUNT(*)"),
    COUNT_UNIQUE("Count Unique Values", "COUNT(DISTINCT {0})"),
    AVERAGE("Average", "AVG({0})"),
    MAX("Maximum", "MAX({0})"),
    MIN("Minimum", "MIN({0})"),

    // Statistical aggregators
    MEDIAN("Median", "MEDIAN({0})"),
    MODE("Mode", "MODE({0})"),
    STDDEV("Standard Deviation", "STDDEV({0})"),
    VARIANCE("Variance", "VARIANCE({0})"),
    SAMPLE_VARIANCE("Sample Variance", "VAR_SAMP({0})"),
    SAMPLE_STDDEV("Sample Standard Deviation", "STDDEV_SAMP({0})"),

    // Percentile aggregators
    PERCENTILE_25("25th Percentile (Q1)", "PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY {0})"),
    PERCENTILE_75("75th Percentile (Q3)", "PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY {0})"),
    PERCENTILE_80_LOWER("80% Lower Bound", "PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY {0})"),
    PERCENTILE_80_UPPER("80% Upper Bound", "PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY {0})"),
    PERCENTILE_90("90th Percentile", "PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY {0})"),
    PERCENTILE_95("95th Percentile", "PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY {0})"),
    PERCENTILE_99("99th Percentile", "PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY {0})"),

    // Positional aggregators
    FIRST("First", "FIRST({0})"),
    LAST("Last", "LAST({0})"),

    // List aggregators
    LIST_UNIQUE("List Unique Values", "STRING_AGG(DISTINCT CAST({0} AS VARCHAR), '', '')"),
    STRING_CONCAT("Concatenate", "STRING_AGG(CAST({0} AS VARCHAR), ', ')"),

    // Integer aggregators
    INTEGER_SUM("Integer Sum", "CAST(SUM({0}) AS BIGINT)"),

    // Boolean aggregators
    BOOL_AND("All True", "BOOL_AND({0})"),
    BOOL_OR("Any True", "BOOL_OR({0})"),

    // Date aggregators
    MIN_DATE("Earliest Date", "MIN({0})"),
    MAX_DATE("Latest Date", "MAX({0})"),
    DATE_RANGE_DAYS("Date Range (Days)", "DATE_DIFF('day', MIN({0}), MAX({0}))"),

    // Fraction aggregators (computed post-query)
    SUM_FRACTION_TOTAL("Sum as Fraction of Total", "SUM({0})"),
    SUM_FRACTION_ROWS("Sum as Fraction of Rows", "SUM({0})"),
    SUM_FRACTION_COLS("Sum as Fraction of Columns", "SUM({0})"),
    COUNT_FRACTION_TOTAL("Count as Fraction of Total", "COUNT(*)");

    private final String displayName;
    private final String sqlTemplate;

    AggregatorType(String displayName, String sqlTemplate) {
        this.displayName = displayName;
        this.sqlTemplate = sqlTemplate;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSqlTemplate() {
        return sqlTemplate;
    }

    /**
     * Generate SQL for this aggregator with the given column name.
     */
    public String generateSQL(String columnName) {
        return sqlTemplate.replace("{0}", columnName);
    }

    /**
     * Check if this aggregator requires post-processing (fraction calculations).
     */
    public boolean requiresPostProcessing() {
        return this == SUM_FRACTION_TOTAL
            || this == SUM_FRACTION_ROWS
            || this == SUM_FRACTION_COLS
            || this == COUNT_FRACTION_TOTAL;
    }

    /**
     * Get aggregator by name (case-insensitive).
     */
    public static AggregatorType fromString(String name) {
        if (name == null) {
            return COUNT;
        }

        // Try exact match first
        for (AggregatorType type : values()) {
            if (type.name().equalsIgnoreCase(name)) {
                return type;
            }
        }

        // Try display name match
        for (AggregatorType type : values()) {
            if (type.displayName.equalsIgnoreCase(name)) {
                return type;
            }
        }

        // Default to COUNT
        return COUNT;
    }
}
