package com.sourcekraft.documentburster.common.analytics.dto;

/**
 * Window function types for advanced analytics.
 *
 * Window functions perform calculations across rows that are related to the current row.
 * They are essential for running totals, moving averages, rankings, and time-series analysis.
 */
public enum WindowFunction {
    // Running calculations
    RUNNING_SUM("Running Sum", "SUM({0}) OVER (ORDER BY {1})"),
    RUNNING_AVG("Running Average", "AVG({0}) OVER (ORDER BY {1})"),
    RUNNING_MIN("Running Minimum", "MIN({0}) OVER (ORDER BY {1})"),
    RUNNING_MAX("Running Maximum", "MAX({0}) OVER (ORDER BY {1})"),
    RUNNING_COUNT("Running Count", "COUNT(*) OVER (ORDER BY {1})"),

    // Moving calculations (requires rows specification)
    MOVING_AVG_3("Moving Average (3)", "AVG({0}) OVER (ORDER BY {1} ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)"),
    MOVING_AVG_5("Moving Average (5)", "AVG({0}) OVER (ORDER BY {1} ROWS BETWEEN 4 PRECEDING AND CURRENT ROW)"),
    MOVING_AVG_7("Moving Average (7)", "AVG({0}) OVER (ORDER BY {1} ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)"),
    MOVING_SUM_3("Moving Sum (3)", "SUM({0}) OVER (ORDER BY {1} ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)"),
    MOVING_SUM_5("Moving Sum (5)", "SUM({0}) OVER (ORDER BY {1} ROWS BETWEEN 4 PRECEDING AND CURRENT ROW)"),

    // Ranking functions
    ROW_NUMBER("Row Number", "ROW_NUMBER() OVER (ORDER BY {1})"),
    RANK("Rank", "RANK() OVER (ORDER BY {0} DESC)"),
    DENSE_RANK("Dense Rank", "DENSE_RANK() OVER (ORDER BY {0} DESC)"),
    PERCENT_RANK("Percent Rank", "PERCENT_RANK() OVER (ORDER BY {0} DESC)"),
    NTILE_4("Quartile", "NTILE(4) OVER (ORDER BY {0})"),
    NTILE_10("Decile", "NTILE(10) OVER (ORDER BY {0})"),
    NTILE_100("Percentile", "NTILE(100) OVER (ORDER BY {0})"),

    // Partitioned calculations
    PARTITION_SUM("Partition Sum", "SUM({0}) OVER (PARTITION BY {2})"),
    PARTITION_AVG("Partition Average", "AVG({0}) OVER (PARTITION BY {2})"),
    PARTITION_COUNT("Partition Count", "COUNT(*) OVER (PARTITION BY {2})"),
    PARTITION_RANK("Partition Rank", "RANK() OVER (PARTITION BY {2} ORDER BY {0} DESC)"),

    // Lead/Lag functions
    LAG_1("Previous Value", "LAG({0}, 1) OVER (ORDER BY {1})"),
    LAG_2("2 Rows Back", "LAG({0}, 2) OVER (ORDER BY {1})"),
    LEAD_1("Next Value", "LEAD({0}, 1) OVER (ORDER BY {1})"),
    LEAD_2("2 Rows Ahead", "LEAD({0}, 2) OVER (ORDER BY {1})"),

    // First/Last values
    FIRST_VALUE("First Value", "FIRST_VALUE({0}) OVER (ORDER BY {1})"),
    LAST_VALUE("Last Value", "LAST_VALUE({0}) OVER (ORDER BY {1} ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)"),

    // Statistical window functions
    STDDEV_POP_WINDOW("Window StdDev (Pop)", "STDDEV_POP({0}) OVER (PARTITION BY {2})"),
    STDDEV_SAMP_WINDOW("Window StdDev (Sample)", "STDDEV_SAMP({0}) OVER (PARTITION BY {2})"),
    VAR_POP_WINDOW("Window Variance (Pop)", "VAR_POP({0}) OVER (PARTITION BY {2})"),
    VAR_SAMP_WINDOW("Window Variance (Sample)", "VAR_SAMP({0}) OVER (PARTITION BY {2})");

    private final String displayName;
    private final String sqlTemplate;

    WindowFunction(String displayName, String sqlTemplate) {
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
     * Generate SQL for this window function.
     *
     * @param valueColumn Column to aggregate (e.g., "revenue")
     * @param orderByColumn Column to order by (e.g., "date")
     * @param partitionByColumn Optional partition column (e.g., "country")
     * @return SQL window function expression
     */
    public String generateSQL(String valueColumn, String orderByColumn, String partitionByColumn) {
        String sql = sqlTemplate;

        // Replace {0} with value column
        if (sql.contains("{0}")) {
            sql = sql.replace("{0}", valueColumn);
        }

        // Replace {1} with order by column
        if (sql.contains("{1}")) {
            sql = sql.replace("{1}", orderByColumn);
        }

        // Replace {2} with partition by column
        if (sql.contains("{2}") && partitionByColumn != null) {
            sql = sql.replace("{2}", partitionByColumn);
        }

        return sql;
    }

    /**
     * Check if this window function requires a partition column.
     */
    public boolean requiresPartition() {
        return sqlTemplate.contains("{2}");
    }

    /**
     * Check if this window function requires an order by column.
     */
    public boolean requiresOrderBy() {
        return sqlTemplate.contains("{1}");
    }

    /**
     * Get window function by name (case-insensitive).
     */
    public static WindowFunction fromString(String name) {
        if (name == null) {
            throw new IllegalArgumentException("Window function name cannot be null");
        }
        try {
            return WindowFunction.valueOf(name.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown window function: " + name);
        }
    }
}
