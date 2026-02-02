package com.sourcekraft.documentburster.common.analytics.clickhouse;

import com.sourcekraft.documentburster.common.analytics.PivotSQLGenerator;
import com.sourcekraft.documentburster.common.analytics.dto.AggregatorType;
import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import com.sourcekraft.documentburster.common.analytics.dto.WindowFunction;
import com.sourcekraft.documentburster.common.analytics.dto.TimeSeries;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ClickHouse-specific implementation of PivotSQLGenerator.
 * Generates SQL queries compatible with ClickHouse's OLAP capabilities.
 * 
 * Key differences from DuckDB:
 * - Uses backticks (`) for identifier quoting instead of double quotes
 * - ROLLUP syntax: GROUP BY ... WITH ROLLUP instead of GROUP BY ROLLUP(...)
 * - String concatenation: concat() instead of ||
 * - Date functions: toStartOfMonth(), toYear() instead of date_trunc()
 * - MEDIAN: quantile(0.5)(x) instead of MEDIAN(x)
 * - String escaping: backslash escaping instead of doubling quotes
 */
public class ClickHousePivotProcessor implements PivotSQLGenerator {

    private static final Logger log = LoggerFactory.getLogger(ClickHousePivotProcessor.class);

    // ClickHouse-specific aggregator mappings (override DuckDB syntax where needed)
    private static final Map<AggregatorType, String> CLICKHOUSE_AGGREGATORS;
    
    static {
        CLICKHOUSE_AGGREGATORS = new HashMap<>();
        
        // Basic aggregators
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.SUM, "sum({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.COUNT, "count(*)");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.COUNT_UNIQUE, "uniq({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.AVERAGE, "avg({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.MAX, "max({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.MIN, "min({0})");
        
        // Statistical aggregators - ClickHouse uses different function names
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.MEDIAN, "quantile(0.5)({0})");
        // MODE: Use arrayElement with ifNull for safe array access (topK returns array, may be empty)
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.MODE, "arrayElement(topK(1)({0}), 1)");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.STDDEV, "stddevPop({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.VARIANCE, "varPop({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.SAMPLE_VARIANCE, "varSamp({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.SAMPLE_STDDEV, "stddevSamp({0})");
        
        // Percentile aggregators - ClickHouse uses quantile() function
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.PERCENTILE_25, "quantile(0.25)({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.PERCENTILE_75, "quantile(0.75)({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.PERCENTILE_80_LOWER, "quantile(0.10)({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.PERCENTILE_80_UPPER, "quantile(0.90)({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.PERCENTILE_90, "quantile(0.90)({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.PERCENTILE_95, "quantile(0.95)({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.PERCENTILE_99, "quantile(0.99)({0})");
        
        // Positional aggregators - ClickHouse uses any() for first, anyLast() for last
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.FIRST, "any({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.LAST, "anyLast({0})");
        
        // List aggregators - ClickHouse uses groupUniqArray and groupArray
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.LIST_UNIQUE, "arrayStringConcat(groupUniqArray(toString({0})), ', ')");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.STRING_CONCAT, "arrayStringConcat(groupArray(toString({0})), ', ')");
        
        // Integer aggregators
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.INTEGER_SUM, "toInt64(sum({0}))");
        
        // Boolean aggregators - ClickHouse 23.8+ has proper boolean support with groupBitAnd/groupBitOr
        // For compatibility, we use toUInt8 conversion for boolean columns
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.BOOL_AND, "groupBitAnd(toUInt8({0}))");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.BOOL_OR, "groupBitOr(toUInt8({0}))");
        
        // Date aggregators
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.MIN_DATE, "min({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.MAX_DATE, "max({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.DATE_RANGE_DAYS, "dateDiff('day', min({0}), max({0}))");
        
        // Fraction aggregators (computed post-query, same as DuckDB)
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.SUM_FRACTION_TOTAL, "sum({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.SUM_FRACTION_ROWS, "sum({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.SUM_FRACTION_COLS, "sum({0})");
        CLICKHOUSE_AGGREGATORS.put(AggregatorType.COUNT_FRACTION_TOTAL, "count(*)");
    }

    @Override
    public String generateSQL(PivotRequest request) {
        log.debug("Generating ClickHouse pivot SQL for request: {}", request);

        validateRequest(request);

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ");

        // Add dimension columns (rows + cols)
        List<String> dimensions = new ArrayList<>();
        dimensions.addAll(request.getRows());
        dimensions.addAll(request.getCols());

        if (!dimensions.isEmpty()) {
            sql.append(dimensions.stream()
                    .map(this::quoteIdentifier)
                    .collect(Collectors.joining(", ")));
            sql.append(", ");
        }

        // Add aggregation columns
        String valuesColumn = request.getVals().isEmpty() ? "*" : request.getVals().get(0);
        AggregatorType aggregator = AggregatorType.fromString(request.getAggregatorName());

        if (valuesColumn.equals("*") && aggregator != AggregatorType.COUNT) {
            throw new IllegalArgumentException("Aggregator " + aggregator.name() + " requires a specific column, not *");
        }

        String aggregationSQL = generateAggregationSQL(aggregator, valuesColumn);
        sql.append(aggregationSQL);
        sql.append(" AS aggregated_value");

        // FROM clause
        sql.append(" FROM ").append(quoteIdentifier(request.getTableName()));

        // WHERE clause (filters)
        String whereClause = generateWhereClause(request.getFilters());
        if (!whereClause.isEmpty()) {
            sql.append(" WHERE ").append(whereClause);
        }

        // GROUP BY clause - ClickHouse uses different ROLLUP syntax
        if (!dimensions.isEmpty()) {
            sql.append(" GROUP BY ");
            sql.append(dimensions.stream()
                    .map(this::quoteIdentifier)
                    .collect(Collectors.joining(", ")));
            
            if (request.isIncludeSubtotals()) {
                // ClickHouse ROLLUP syntax: GROUP BY ... WITH ROLLUP
                sql.append(" WITH ROLLUP");
            }
        }

        // ORDER BY clause
        if (!dimensions.isEmpty()) {
            sql.append(" ORDER BY ");
            sql.append(dimensions.stream()
                    .map(dim -> quoteIdentifier(dim) + getOrderDirection(request.getRowOrder()))
                    .collect(Collectors.joining(", ")));
        }

        // LIMIT clause
        if (request.getLimit() != null && request.getLimit() > 0) {
            sql.append(" LIMIT ").append(request.getLimit());
        }

        String finalSQL = sql.toString();
        log.debug("Generated ClickHouse SQL: {}", finalSQL);
        return finalSQL;
    }

    private String generateAggregationSQL(AggregatorType aggregator, String column) {
        String template = CLICKHOUSE_AGGREGATORS.get(aggregator);
        if (template == null) {
            // Fallback to the enum's default SQL template (DuckDB compatible)
            log.warn("No ClickHouse-specific template for {}, using default", aggregator);
            return aggregator.generateSQL(quoteIdentifier(column));
        }

        // Replace {0} placeholder with the quoted column name
        return template.replace("{0}", quoteIdentifier(column));
    }

    /**
     * Generate WHERE clause from filters.
     * Supports two formats:
     * 1. Array format: { "region": ["East", "West"] }
     * 2. Object format: { "region": { "East": true, "West": true, "North": false } }
     */
    private String generateWhereClause(Map<String, Object> filters) {
        if (filters == null || filters.isEmpty()) {
            return "";
        }

        return filters.entrySet().stream()
                .map(entry -> {
                    String column = quoteIdentifier(entry.getKey());
                    Object value = entry.getValue();

                    List<String> filterValues = extractFilterValues(value);

                    if (filterValues.isEmpty()) {
                        return null;
                    }

                    String values = filterValues.stream()
                            .map(this::escapeSQLString)
                            .collect(Collectors.joining(", "));
                    return column + " IN (" + values + ")";
                })
                .filter(condition -> condition != null)
                .collect(Collectors.joining(" AND "));
    }

    /**
     * Extract filter values from either array or object format.
     */
    @SuppressWarnings("unchecked")
    private List<String> extractFilterValues(Object value) {
        List<String> result = new ArrayList<>();

        if (value == null) {
            return result;
        }

        if (value instanceof List) {
            // Array format: ["East", "West"]
            List<?> list = (List<?>) value;
            for (Object item : list) {
                if (item != null) {
                    result.add(item.toString());
                }
            }
        } else if (value instanceof Map) {
            // Object format: { "East": true, "West": true, "North": false }
            Map<String, Object> map = (Map<String, Object>) value;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                Object val = entry.getValue();
                // Include only if value is true (boolean) or truthy
                if (val instanceof Boolean) {
                    if ((Boolean) val) {
                        result.add(entry.getKey());
                    }
                } else if (val != null) {
                    // Non-boolean values are considered truthy if non-null
                    result.add(entry.getKey());
                }
            }
        } else {
            // Single value - treat as single-element list
            result.add(value.toString());
        }

        return result;
    }

    private String getOrderDirection(String orderType) {
        if (orderType == null) {
            return " ASC";
        }

        switch (orderType.toLowerCase()) {
            case "key_z_to_a":
            case "value_z_to_a":
                return " DESC";
            case "key_a_to_z":
            case "value_a_to_z":
            default:
                return " ASC";
        }
    }

    /**
     * Quote identifier using ClickHouse backticks.
     * ClickHouse prefers backticks (`) for identifier quoting.
     */
    private String quoteIdentifier(String identifier) {
        if (identifier.contains(".")) {
            // Handle multi-part identifiers: database.table or database.schema.table
            String[] parts = identifier.split("\\.");
            StringBuilder quoted = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                if (i > 0) quoted.append(".");
                quoted.append("`").append(parts[i].replace("`", "``")).append("`");
            }
            return quoted.toString();
        } else {
            return "`" + identifier.replace("`", "``") + "`";
        }
    }

    private String escapeSQLString(String value) {
        // ClickHouse uses single quotes for strings, escape with backslash
        return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    private void validateRequest(PivotRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("PivotRequest cannot be null");
        }
        if (StringUtils.isBlank(request.getTableName())) {
            throw new IllegalArgumentException("Table name cannot be empty");
        }
        // Note: Empty rows/cols is valid - it means aggregate over entire table
    }

    @Override
    public boolean supportsAggregator(String aggregatorName) {
        try {
            AggregatorType.fromString(aggregatorName);
            // ClickHouse supports all aggregators (with fallback to default SQL if needed)
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<String> getSupportedAggregators() {
        // Return all aggregators - ClickHouse has mappings for all or uses fallback
        return Arrays.stream(AggregatorType.values())
                .map(AggregatorType::name)
                .collect(Collectors.toList());
    }

    @Override
    public String getDatabaseType() {
        return "clickhouse";
    }

    // ============================================================================
    // ClickHouse-specific SQL template mappings for Window Functions
    // ============================================================================
    
    private static final Map<WindowFunction, String> CLICKHOUSE_WINDOW_FUNCTIONS;
    
    static {
        CLICKHOUSE_WINDOW_FUNCTIONS = new HashMap<>();
        
        // Running calculations - ClickHouse uses standard OVER() syntax
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.RUNNING_SUM, "sum({0}) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.RUNNING_AVG, "avg({0}) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.RUNNING_MIN, "min({0}) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.RUNNING_MAX, "max({0}) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.RUNNING_COUNT, "count(*) OVER (ORDER BY {1})");
        
        // Moving calculations - ClickHouse supports ROWS BETWEEN
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.MOVING_AVG_3, "avg({0}) OVER (ORDER BY {1} ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.MOVING_AVG_5, "avg({0}) OVER (ORDER BY {1} ROWS BETWEEN 4 PRECEDING AND CURRENT ROW)");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.MOVING_AVG_7, "avg({0}) OVER (ORDER BY {1} ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.MOVING_SUM_3, "sum({0}) OVER (ORDER BY {1} ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.MOVING_SUM_5, "sum({0}) OVER (ORDER BY {1} ROWS BETWEEN 4 PRECEDING AND CURRENT ROW)");
        
        // Ranking functions - ClickHouse uses standard syntax
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.ROW_NUMBER, "row_number() OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.RANK, "rank() OVER (ORDER BY {0} DESC)");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.DENSE_RANK, "dense_rank() OVER (ORDER BY {0} DESC)");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.PERCENT_RANK, "percent_rank() OVER (ORDER BY {0} DESC)");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.NTILE_4, "ntile(4) OVER (ORDER BY {0})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.NTILE_10, "ntile(10) OVER (ORDER BY {0})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.NTILE_100, "ntile(100) OVER (ORDER BY {0})");
        
        // Partitioned calculations
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.PARTITION_SUM, "sum({0}) OVER (PARTITION BY {2})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.PARTITION_AVG, "avg({0}) OVER (PARTITION BY {2})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.PARTITION_COUNT, "count(*) OVER (PARTITION BY {2})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.PARTITION_RANK, "rank() OVER (PARTITION BY {2} ORDER BY {0} DESC)");
        
        // Lead/Lag functions - ClickHouse uses lagInFrame/leadInFrame for better performance in some cases
        // but standard lag/lead also work
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.LAG_1, "lagInFrame({0}, 1) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.LAG_2, "lagInFrame({0}, 2) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.LEAD_1, "leadInFrame({0}, 1) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.LEAD_2, "leadInFrame({0}, 2) OVER (ORDER BY {1})");
        
        // First/Last values - ClickHouse uses first_value/last_value
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.FIRST_VALUE, "first_value({0}) OVER (ORDER BY {1})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.LAST_VALUE, "last_value({0}) OVER (ORDER BY {1} ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)");
        
        // Statistical window functions - ClickHouse uses stddevPop/stddevSamp
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.STDDEV_POP_WINDOW, "stddevPop({0}) OVER (PARTITION BY {2})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.STDDEV_SAMP_WINDOW, "stddevSamp({0}) OVER (PARTITION BY {2})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.VAR_POP_WINDOW, "varPop({0}) OVER (PARTITION BY {2})");
        CLICKHOUSE_WINDOW_FUNCTIONS.put(WindowFunction.VAR_SAMP_WINDOW, "varSamp({0}) OVER (PARTITION BY {2})");
    }

    // ============================================================================
    // ClickHouse-specific SQL template mappings for Date Binning
    // ============================================================================
    
    private static final Map<TimeSeries.DateBin, String> CLICKHOUSE_DATE_BINS;
    
    static {
        CLICKHOUSE_DATE_BINS = new HashMap<>();
        
        // Standard date truncation - ClickHouse uses toStartOf* functions
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.HOUR, "toStartOfHour({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.DAY, "toDate({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.WEEK, "toStartOfWeek({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.MONTH, "toStartOfMonth({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.QUARTER, "toStartOfQuarter({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.YEAR, "toStartOfYear({0})");
        
        // Alternative binning - ClickHouse date part extraction
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.DAY_OF_WEEK, "toDayOfWeek({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.DAY_OF_MONTH, "toDayOfMonth({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.WEEK_OF_YEAR, "toWeek({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.MONTH_NAME, "formatDateTime({0}, '%B')");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.MONTH_NUMBER, "toMonth({0})");
        CLICKHOUSE_DATE_BINS.put(TimeSeries.DateBin.QUARTER_NUMBER, "toQuarter({0})");
    }

    // ============================================================================
    // ClickHouse-specific SQL template mappings for Period Comparisons
    // ============================================================================
    
    private static final Map<TimeSeries.PeriodComparison, String> CLICKHOUSE_PERIOD_COMPARISONS;
    
    static {
        CLICKHOUSE_PERIOD_COMPARISONS = new HashMap<>();
        
        // Period comparisons using lagInFrame (ClickHouse optimized)
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.DAY_OVER_DAY, 
            "lagInFrame({0}, 1) OVER (PARTITION BY {1} ORDER BY {2})");
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.WEEK_OVER_WEEK, 
            "lagInFrame({0}, 7) OVER (PARTITION BY {1} ORDER BY {2})");
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.MONTH_OVER_MONTH, 
            "lagInFrame({0}, 1) OVER (PARTITION BY toYear({2}) ORDER BY toMonth({2}))");
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.QUARTER_OVER_QUARTER, 
            "lagInFrame({0}, 1) OVER (PARTITION BY toYear({2}) ORDER BY toQuarter({2}))");
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.YEAR_OVER_YEAR, 
            "lagInFrame({0}, 1) OVER (ORDER BY toYear({2}))");
        
        // Percent change calculations
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.DAY_OVER_DAY_PCT, 
            "round(100.0 * ({0} - lagInFrame({0}, 1) OVER (ORDER BY {2})) / nullIf(lagInFrame({0}, 1) OVER (ORDER BY {2}), 0), 2)");
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.MONTH_OVER_MONTH_PCT, 
            "round(100.0 * ({0} - lagInFrame({0}, 1) OVER (PARTITION BY toYear({2}) ORDER BY toMonth({2}))) / nullIf(lagInFrame({0}, 1) OVER (PARTITION BY toYear({2}) ORDER BY toMonth({2})), 0), 2)");
        CLICKHOUSE_PERIOD_COMPARISONS.put(TimeSeries.PeriodComparison.YEAR_OVER_YEAR_PCT, 
            "round(100.0 * ({0} - lagInFrame({0}, 1) OVER (ORDER BY toYear({2}))) / nullIf(lagInFrame({0}, 1) OVER (ORDER BY toYear({2})), 0), 2)");
    }

    /**
     * Generate SQL with window function support.
     * Uses ClickHouse-specific OVER() syntax and functions like lagInFrame/leadInFrame.
     *
     * @param request Pivot request with window function configuration
     * @return SQL query with window function
     */
    public String generateSQLWithWindowFunction(PivotRequest request) {
        if (StringUtils.isBlank(request.getWindowFunction())) {
            return generateSQL(request); // Fall back to regular pivot
        }

        validateRequest(request);

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ");

        // Add dimension columns
        List<String> dimensions = new ArrayList<>();
        dimensions.addAll(request.getRows());
        dimensions.addAll(request.getCols());

        if (!dimensions.isEmpty()) {
            sql.append(dimensions.stream()
                    .map(this::quoteIdentifier)
                    .collect(Collectors.joining(", ")));
            sql.append(", ");
        }

        // Add window function
        String valuesColumn = request.getVals().isEmpty() ? "*" : quoteIdentifier(request.getVals().get(0));
        WindowFunction windowFunc = WindowFunction.fromString(request.getWindowFunction());

        String orderBy = request.getOrderByColumn() != null ? quoteIdentifier(request.getOrderByColumn()) : "";
        String partitionBy = request.getPartitionByColumn() != null ? quoteIdentifier(request.getPartitionByColumn()) : null;

        String windowSQL = generateWindowFunctionSQL(windowFunc, valuesColumn, orderBy, partitionBy);
        sql.append(windowSQL).append(" AS window_value");

        // FROM clause
        sql.append(" FROM ").append(quoteIdentifier(request.getTableName()));

        // WHERE clause (filters)
        String whereClause = generateWhereClause(request.getFilters());
        if (!whereClause.isEmpty()) {
            sql.append(" WHERE ").append(whereClause);
        }

        // ORDER BY clause
        if (request.getOrderByColumn() != null) {
            sql.append(" ORDER BY ").append(quoteIdentifier(request.getOrderByColumn()));
        }

        // LIMIT clause
        if (request.getLimit() != null) {
            sql.append(" LIMIT ").append(request.getLimit());
        }

        log.debug("Generated ClickHouse window function SQL: {}", sql);
        return sql.toString();
    }

    /**
     * Generate window function SQL using ClickHouse-specific syntax.
     */
    private String generateWindowFunctionSQL(WindowFunction windowFunc, String valueColumn, 
                                              String orderByColumn, String partitionByColumn) {
        String template = CLICKHOUSE_WINDOW_FUNCTIONS.get(windowFunc);
        if (template == null) {
            // Fallback to DuckDB/standard SQL (WindowFunction enum's default)
            log.warn("No ClickHouse-specific template for window function {}, using default", windowFunc);
            return windowFunc.generateSQL(valueColumn, orderByColumn, partitionByColumn);
        }

        String sql = template;
        
        // Replace placeholders
        if (sql.contains("{0}")) {
            sql = sql.replace("{0}", valueColumn);
        }
        if (sql.contains("{1}")) {
            sql = sql.replace("{1}", orderByColumn);
        }
        if (sql.contains("{2}") && partitionByColumn != null) {
            sql = sql.replace("{2}", partitionByColumn);
        }
        
        return sql;
    }

    /**
     * Generate SQL with time-series date binning.
     * Uses ClickHouse-specific date functions like toStartOfMonth(), toYear(), etc.
     *
     * @param request Pivot request with date binning configuration
     * @return SQL query with date binning
     */
    public String generateSQLWithDateBinning(PivotRequest request) {
        if (StringUtils.isBlank(request.getDateBin()) || StringUtils.isBlank(request.getDateColumn())) {
            return generateSQL(request); // Fall back to regular pivot
        }

        validateRequest(request);

        TimeSeries.DateBin dateBin = TimeSeries.DateBin.fromString(request.getDateBin());
        String dateColumn = quoteIdentifier(request.getDateColumn());
        String binnedDate = generateDateBinSQL(dateBin, dateColumn);

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ");
        sql.append(binnedDate).append(" AS date_period, ");

        // Add other dimensions
        List<String> otherDimensions = new ArrayList<>();
        otherDimensions.addAll(request.getRows());
        otherDimensions.addAll(request.getCols());

        if (!otherDimensions.isEmpty()) {
            sql.append(otherDimensions.stream()
                    .map(this::quoteIdentifier)
                    .collect(Collectors.joining(", ")));
            sql.append(", ");
        }

        // Add aggregation
        String valuesColumn = request.getVals().isEmpty() ? "*" : request.getVals().get(0);
        AggregatorType aggregator = AggregatorType.fromString(request.getAggregatorName());
        String aggregationSQL = generateAggregationSQL(aggregator, valuesColumn);
        sql.append(aggregationSQL).append(" AS aggregated_value");

        // FROM clause
        sql.append(" FROM ").append(quoteIdentifier(request.getTableName()));

        // WHERE clause
        String whereClause = generateWhereClause(request.getFilters());
        if (!whereClause.isEmpty()) {
            sql.append(" WHERE ").append(whereClause);
        }

        // GROUP BY clause
        sql.append(" GROUP BY ").append(binnedDate);
        if (!otherDimensions.isEmpty()) {
            sql.append(", ").append(otherDimensions.stream()
                    .map(this::quoteIdentifier)
                    .collect(Collectors.joining(", ")));
        }

        // ORDER BY clause
        sql.append(" ORDER BY date_period");

        // LIMIT clause
        if (request.getLimit() != null) {
            sql.append(" LIMIT ").append(request.getLimit());
        }

        log.debug("Generated ClickHouse date binning SQL: {}", sql);
        return sql.toString();
    }

    /**
     * Generate date binning SQL using ClickHouse-specific date functions.
     */
    private String generateDateBinSQL(TimeSeries.DateBin dateBin, String dateColumn) {
        String template = CLICKHOUSE_DATE_BINS.get(dateBin);
        if (template == null) {
            // Fallback to DuckDB/standard SQL
            log.warn("No ClickHouse-specific template for date bin {}, using default", dateBin);
            return dateBin.generateSQL(dateColumn);
        }
        return template.replace("{0}", dateColumn);
    }

    /**
     * Generate SQL with period-over-period comparison.
     * Uses ClickHouse-specific functions like lagInFrame(), leadInFrame(), toYear(), toMonth().
     *
     * @param request Pivot request with period comparison configuration
     * @return SQL query with period comparison
     */
    public String generateSQLWithPeriodComparison(PivotRequest request) {
        if (StringUtils.isBlank(request.getPeriodComparison()) || StringUtils.isBlank(request.getDateColumn())) {
            return generateSQL(request); // Fall back to regular pivot
        }

        validateRequest(request);

        TimeSeries.PeriodComparison periodComp = TimeSeries.PeriodComparison.fromString(request.getPeriodComparison());
        String valueColumn = request.getVals().isEmpty() ? "*" : quoteIdentifier(request.getVals().get(0));
        String dateColumn = quoteIdentifier(request.getDateColumn());
        String partitionColumn = request.getPartitionByColumn() != null ? quoteIdentifier(request.getPartitionByColumn()) : null;

        String comparisonSQL = generatePeriodComparisonSQL(periodComp, valueColumn, partitionColumn, dateColumn);

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ");

        // Add dimension columns
        List<String> dimensions = new ArrayList<>();
        dimensions.addAll(request.getRows());
        dimensions.addAll(request.getCols());

        if (!dimensions.isEmpty()) {
            sql.append(dimensions.stream()
                    .map(this::quoteIdentifier)
                    .collect(Collectors.joining(", ")));
            sql.append(", ");
        }

        // Add current value and comparison value
        sql.append(valueColumn).append(" AS current_value, ");
        sql.append(comparisonSQL).append(" AS previous_value");

        // FROM clause
        sql.append(" FROM ").append(quoteIdentifier(request.getTableName()));

        // WHERE clause
        String whereClause = generateWhereClause(request.getFilters());
        if (!whereClause.isEmpty()) {
            sql.append(" WHERE ").append(whereClause);
        }

        // ORDER BY clause
        sql.append(" ORDER BY ").append(dateColumn);

        // LIMIT clause
        if (request.getLimit() != null) {
            sql.append(" LIMIT ").append(request.getLimit());
        }

        log.debug("Generated ClickHouse period comparison SQL: {}", sql);
        return sql.toString();
    }

    /**
     * Generate period comparison SQL using ClickHouse-specific syntax.
     */
    private String generatePeriodComparisonSQL(TimeSeries.PeriodComparison periodComp, 
                                                String valueColumn, String partitionColumn, String dateColumn) {
        String template = CLICKHOUSE_PERIOD_COMPARISONS.get(periodComp);
        if (template == null) {
            // Fallback to DuckDB/standard SQL
            log.warn("No ClickHouse-specific template for period comparison {}, using default", periodComp);
            return periodComp.generateSQL(valueColumn, partitionColumn, dateColumn);
        }
        
        String sql = template;
        sql = sql.replace("{0}", valueColumn);
        if (partitionColumn != null && sql.contains("{1}")) {
            sql = sql.replace("{1}", partitionColumn);
        }
        sql = sql.replace("{2}", dateColumn);
        
        return sql;
    }

    /**
     * Get list of supported window functions.
     */
    public List<String> getSupportedWindowFunctions() {
        return Arrays.stream(WindowFunction.values())
                .map(WindowFunction::name)
                .collect(Collectors.toList());
    }

    /**
     * Get list of supported date bins.
     */
    public List<String> getSupportedDateBins() {
        return Arrays.stream(TimeSeries.DateBin.values())
                .map(TimeSeries.DateBin::name)
                .collect(Collectors.toList());
    }

    /**
     * Get list of supported period comparisons.
     */
    public List<String> getSupportedPeriodComparisons() {
        return Arrays.stream(TimeSeries.PeriodComparison.values())
                .map(TimeSeries.PeriodComparison::name)
                .collect(Collectors.toList());
    }
}
