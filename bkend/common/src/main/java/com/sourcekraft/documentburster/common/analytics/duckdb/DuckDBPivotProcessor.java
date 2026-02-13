package com.sourcekraft.documentburster.common.analytics.duckdb;

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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * DuckDB-specific implementation of PivotSQLGenerator.
 * Generates SQL queries optimized for DuckDB's OLAP capabilities.
 */
public class DuckDBPivotProcessor implements PivotSQLGenerator {

    private static final Logger log = LoggerFactory.getLogger(DuckDBPivotProcessor.class);

    @Override
    public String generateSQL(PivotRequest request) {
        log.debug("Generating pivot SQL for request: {}", request);

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

        // Add aggregation columns — support multiple val columns + fraction aggregators
        AggregatorType aggregator = AggregatorType.fromString(request.getAggregatorName());

        if (request.getVals().isEmpty()) {
            if (aggregator != AggregatorType.COUNT && aggregator != AggregatorType.COUNT_FRACTION_TOTAL) {
                throw new IllegalArgumentException("Aggregator " + aggregator.name() + " requires a specific column");
            }
            if (aggregator.requiresPostProcessing()) {
                sql.append(generateFractionSQL(aggregator, null, request));
            } else {
                sql.append("COUNT(*)");
            }
            sql.append(" AS aggregated_value");
        } else {
            List<String> aggColumns = new ArrayList<>();
            for (String valCol : request.getVals()) {
                String aggSql;
                if (aggregator.requiresPostProcessing()) {
                    aggSql = generateFractionSQL(aggregator, valCol, request);
                } else {
                    aggSql = generateAggregationSQL(aggregator, valCol);
                }
                aggColumns.add(aggSql + " AS " + quoteIdentifier(valCol));
            }
            sql.append(String.join(", ", aggColumns));
        }

        // FROM clause
        sql.append(" FROM ").append(quoteIdentifier(request.getTableName()));

        // WHERE clause (filters)
        String whereClause = generateWhereClause(request.getFilters());
        if (!whereClause.isEmpty()) {
            sql.append(" WHERE ").append(whereClause);
        }

        // GROUP BY clause
        if (!dimensions.isEmpty()) {
            sql.append(" GROUP BY ");
            if (request.isIncludeSubtotals()) {
                // Use ROLLUP for subtotals
                sql.append("ROLLUP(");
                sql.append(dimensions.stream()
                        .map(this::quoteIdentifier)
                        .collect(Collectors.joining(", ")));
                sql.append(")");
            } else {
                sql.append(dimensions.stream()
                        .map(this::quoteIdentifier)
                        .collect(Collectors.joining(", ")));
            }
        }

        // ORDER BY clause — row dimensions use rowOrder, col dimensions use colOrder
        if (!dimensions.isEmpty()) {
            sql.append(" ORDER BY ");
            List<String> orderParts = new ArrayList<>();

            // Aggregate alias for value-based sorting
            String aggAlias = request.getVals().isEmpty()
                    ? "aggregated_value"
                    : quoteIdentifier(request.getVals().get(0));

            // Row dimensions → use rowOrder
            if (isValueSort(request.getRowOrder()) && !request.getRows().isEmpty()) {
                orderParts.add(aggAlias + getDirectionSuffix(request.getRowOrder()));
            } else {
                for (String dim : request.getRows()) {
                    orderParts.add(quoteIdentifier(dim) + getDirectionSuffix(request.getRowOrder()));
                }
            }

            // Col dimensions → use colOrder
            if (isValueSort(request.getColOrder()) && !request.getCols().isEmpty()) {
                orderParts.add(aggAlias + getDirectionSuffix(request.getColOrder()));
            } else {
                for (String dim : request.getCols()) {
                    orderParts.add(quoteIdentifier(dim) + getDirectionSuffix(request.getColOrder()));
                }
            }

            sql.append(String.join(", ", orderParts));
        }

        // LIMIT clause
        if (request.getLimit() != null && request.getLimit() > 0) {
            sql.append(" LIMIT ").append(request.getLimit());
        }

        String finalSQL = sql.toString();
        log.debug("Generated SQL: {}", finalSQL);
        return finalSQL;
    }

    private String generateAggregationSQL(AggregatorType aggregator, String column) {
        if (aggregator == AggregatorType.COUNT) {
            return "COUNT(*)";
        }

        String quotedColumn = quoteIdentifier(column);
        return aggregator.generateSQL(quotedColumn);
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
                        return null; // Skip empty filters
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

    private boolean isValueSort(String orderType) {
        return orderType != null && orderType.toLowerCase().startsWith("value_");
    }

    private String getDirectionSuffix(String orderType) {
        if (orderType == null) return " ASC";
        return orderType.toLowerCase().contains("z_to_a") ? " DESC" : " ASC";
    }

    /**
     * Generate fraction SQL using window functions over aggregates.
     * E.g., SUM_FRACTION_TOTAL: CAST(SUM(x) AS DOUBLE) / NULLIF(SUM(SUM(x)) OVER (), 0)
     */
    private String generateFractionSQL(AggregatorType aggregator, String column, PivotRequest request) {
        String baseAgg;
        if (aggregator == AggregatorType.COUNT_FRACTION_TOTAL || column == null) {
            baseAgg = "COUNT(*)";
        } else {
            baseAgg = "SUM(" + quoteIdentifier(column) + ")";
        }

        String partitionClause;
        switch (aggregator) {
            case SUM_FRACTION_ROWS:
                if (!request.getRows().isEmpty()) {
                    partitionClause = "PARTITION BY " + request.getRows().stream()
                            .map(this::quoteIdentifier).collect(Collectors.joining(", "));
                } else {
                    partitionClause = "";
                }
                break;
            case SUM_FRACTION_COLS:
                if (!request.getCols().isEmpty()) {
                    partitionClause = "PARTITION BY " + request.getCols().stream()
                            .map(this::quoteIdentifier).collect(Collectors.joining(", "));
                } else {
                    partitionClause = "";
                }
                break;
            default:  // SUM_FRACTION_TOTAL, COUNT_FRACTION_TOTAL
                partitionClause = "";
                break;
        }

        String overClause = partitionClause.isEmpty() ? "OVER ()" : "OVER (" + partitionClause + ")";
        return "CAST(" + baseAgg + " AS DOUBLE) / NULLIF(SUM(" + baseAgg + ") " + overClause + ", 0)";
    }

    private String quoteIdentifier(String identifier) {
        // DuckDB uses double quotes for identifiers
        // Support multi-source table names: "database.table" or "database.schema.table"
        if (identifier.contains(".")) {
            // Split and quote each part separately
            String[] parts = identifier.split("\\.");
            StringBuilder quoted = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                if (i > 0) quoted.append(".");
                quoted.append("\"").append(parts[i].replace("\"", "\"\"")).append("\"");
            }
            return quoted.toString();
        } else {
            return "\"" + identifier.replace("\"", "\"\"") + "\"";
        }
    }

    private String escapeSQLString(String value) {
        // Escape single quotes and wrap in single quotes
        return "'" + value.replace("'", "''") + "'";
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
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<String> getSupportedAggregators() {
        return Arrays.stream(AggregatorType.values())
                .map(AggregatorType::name)
                .collect(Collectors.toList());
    }

    @Override
    public String getDatabaseType() {
        return "duckdb";
    }

    /**
     * Generate SQL with window function support.
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

        String windowSQL = windowFunc.generateSQL(valuesColumn, orderBy, partitionBy);
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

        log.debug("Generated window function SQL: {}", sql);
        return sql.toString();
    }

    /**
     * Generate SQL with time-series date binning.
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
        String binnedDate = dateBin.generateSQL(dateColumn);

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

        log.debug("Generated date binning SQL: {}", sql);
        return sql.toString();
    }

    /**
     * Generate SQL with period-over-period comparison.
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

        String comparisonSQL = periodComp.generateSQL(valueColumn, partitionColumn, dateColumn);

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

        log.debug("Generated period comparison SQL: {}", sql);
        return sql.toString();
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
