package com.sourcekraft.documentburster.common.analytics.dto;

/**
 * Time-series analysis functions for temporal data.
 *
 * Provides date binning, period comparisons, and time-based calculations.
 */
public class TimeSeries {

    /**
     * Date binning interval
     */
    public enum DateBin {
        HOUR("Hour", "date_trunc('hour', {0})"),
        DAY("Day", "date_trunc('day', {0})"),
        WEEK("Week", "date_trunc('week', {0})"),
        MONTH("Month", "date_trunc('month', {0})"),
        QUARTER("Quarter", "date_trunc('quarter', {0})"),
        YEAR("Year", "date_trunc('year', {0})"),

        // Alternative binning
        DAY_OF_WEEK("Day of Week", "dayname({0})"),
        DAY_OF_MONTH("Day of Month", "day({0})"),
        WEEK_OF_YEAR("Week of Year", "week({0})"),
        MONTH_NAME("Month Name", "monthname({0})"),
        MONTH_NUMBER("Month Number", "month({0})"),
        QUARTER_NUMBER("Quarter Number", "quarter({0})");

        private final String displayName;
        private final String sqlTemplate;

        DateBin(String displayName, String sqlTemplate) {
            this.displayName = displayName;
            this.sqlTemplate = sqlTemplate;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String generateSQL(String dateColumn) {
            return sqlTemplate.replace("{0}", dateColumn);
        }

        public static DateBin fromString(String name) {
            if (name == null) {
                throw new IllegalArgumentException("Date bin name cannot be null");
            }
            try {
                return DateBin.valueOf(name.toUpperCase().replace(" ", "_"));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Unknown date bin: " + name);
            }
        }
    }

    /**
     * Period-over-period comparison types
     */
    public enum PeriodComparison {
        DAY_OVER_DAY("Day over Day", "LAG({0}, 1) OVER (PARTITION BY {1} ORDER BY {2})"),
        WEEK_OVER_WEEK("Week over Week", "LAG({0}, 7) OVER (PARTITION BY {1} ORDER BY {2})"),
        MONTH_OVER_MONTH("Month over Month", "LAG({0}, 1) OVER (PARTITION BY YEAR({2}) ORDER BY MONTH({2}))"),
        QUARTER_OVER_QUARTER("Quarter over Quarter", "LAG({0}, 1) OVER (PARTITION BY YEAR({2}) ORDER BY QUARTER({2}))"),
        YEAR_OVER_YEAR("Year over Year", "LAG({0}, 1) OVER (ORDER BY YEAR({2}))"),

        // Percent change
        DAY_OVER_DAY_PCT("Day over Day %", "ROUND(100.0 * ({0} - LAG({0}, 1) OVER (ORDER BY {2})) / NULLIF(LAG({0}, 1) OVER (ORDER BY {2}), 0), 2)"),
        MONTH_OVER_MONTH_PCT("Month over Month %", "ROUND(100.0 * ({0} - LAG({0}, 1) OVER (PARTITION BY YEAR({2}) ORDER BY MONTH({2}))) / NULLIF(LAG({0}, 1) OVER (PARTITION BY YEAR({2}) ORDER BY MONTH({2}))), 0), 2)"),
        YEAR_OVER_YEAR_PCT("Year over Year %", "ROUND(100.0 * ({0} - LAG({0}, 1) OVER (ORDER BY YEAR({2}))) / NULLIF(LAG({0}, 1) OVER (ORDER BY YEAR({2}))), 0), 2)");

        private final String displayName;
        private final String sqlTemplate;

        PeriodComparison(String displayName, String sqlTemplate) {
            this.displayName = displayName;
            this.sqlTemplate = sqlTemplate;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String generateSQL(String valueColumn, String partitionColumn, String dateColumn) {
            String sql = sqlTemplate;
            sql = sql.replace("{0}", valueColumn);
            if (partitionColumn != null && sql.contains("{1}")) {
                sql = sql.replace("{1}", partitionColumn);
            }
            sql = sql.replace("{2}", dateColumn);
            return sql;
        }

        public static PeriodComparison fromString(String name) {
            if (name == null) {
                throw new IllegalArgumentException("Period comparison name cannot be null");
            }
            try {
                return PeriodComparison.valueOf(name.toUpperCase().replace(" ", "_"));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Unknown period comparison: " + name);
            }
        }
    }

    /**
     * Time-series aggregation types
     */
    public enum TimeAggregation {
        CUMULATIVE_SUM("Cumulative Sum", "SUM({0}) OVER (ORDER BY {1} ROWS UNBOUNDED PRECEDING)"),
        CUMULATIVE_AVG("Cumulative Average", "AVG({0}) OVER (ORDER BY {1} ROWS UNBOUNDED PRECEDING)"),
        CUMULATIVE_COUNT("Cumulative Count", "COUNT(*) OVER (ORDER BY {1} ROWS UNBOUNDED PRECEDING)"),

        // Seasonal patterns
        SAME_DAY_LAST_WEEK("Same Day Last Week", "LAG({0}, 7) OVER (ORDER BY {1})"),
        SAME_DAY_LAST_MONTH("Same Day Last Month", "LAG({0}, 30) OVER (ORDER BY {1})"),
        SAME_DAY_LAST_YEAR("Same Day Last Year", "LAG({0}, 365) OVER (ORDER BY {1})");

        private final String displayName;
        private final String sqlTemplate;

        TimeAggregation(String displayName, String sqlTemplate) {
            this.displayName = displayName;
            this.sqlTemplate = sqlTemplate;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String generateSQL(String valueColumn, String dateColumn) {
            String sql = sqlTemplate;
            sql = sql.replace("{0}", valueColumn);
            sql = sql.replace("{1}", dateColumn);
            return sql;
        }

        public static TimeAggregation fromString(String name) {
            if (name == null) {
                throw new IllegalArgumentException("Time aggregation name cannot be null");
            }
            try {
                return TimeAggregation.valueOf(name.toUpperCase().replace(" ", "_"));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Unknown time aggregation: " + name);
            }
        }
    }
}
