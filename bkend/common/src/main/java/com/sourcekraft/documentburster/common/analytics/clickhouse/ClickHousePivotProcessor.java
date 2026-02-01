package com.sourcekraft.documentburster.common.analytics.clickhouse;

import com.sourcekraft.documentburster.common.analytics.PivotSQLGenerator;
import com.sourcekraft.documentburster.common.analytics.dto.AggregatorType;
import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Arrays;
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
 */
public class ClickHousePivotProcessor implements PivotSQLGenerator {

    private static final Logger log = LoggerFactory.getLogger(ClickHousePivotProcessor.class);

    // ClickHouse-specific aggregator mappings
    private static final Map<AggregatorType, String> CLICKHOUSE_AGGREGATORS = Map.of(
            AggregatorType.COUNT, "count(*)",
            AggregatorType.SUM, "sum(%s)",
            AggregatorType.AVG, "avg(%s)",
            AggregatorType.MIN, "min(%s)",
            AggregatorType.MAX, "max(%s)",
            AggregatorType.MEDIAN, "quantile(0.5)(%s)",
            AggregatorType.STDDEV, "stddevPop(%s)",
            AggregatorType.VARIANCE, "varPop(%s)"
    );

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
            // Fallback to standard SQL
            log.warn("Using fallback aggregator for {}", aggregator);
            return aggregator.name().toLowerCase() + "(" + quoteIdentifier(column) + ")";
        }

        if (aggregator == AggregatorType.COUNT) {
            return template;
        }

        return String.format(template, quoteIdentifier(column));
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

    @SuppressWarnings("unchecked")
    private List<String> extractFilterValues(Object value) {
        List<String> result = new ArrayList<>();

        if (value == null) {
            return result;
        }

        if (value instanceof List) {
            List<?> list = (List<?>) value;
            for (Object item : list) {
                if (item != null) {
                    result.add(item.toString());
                }
            }
        } else if (value instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) value;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                Object val = entry.getValue();
                if (val instanceof Boolean) {
                    if ((Boolean) val) {
                        result.add(entry.getKey());
                    }
                } else if (val != null) {
                    result.add(entry.getKey());
                }
            }
        } else {
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
    }

    @Override
    public boolean supportsAggregator(String aggregatorName) {
        try {
            AggregatorType type = AggregatorType.fromString(aggregatorName);
            return CLICKHOUSE_AGGREGATORS.containsKey(type);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<String> getSupportedAggregators() {
        return CLICKHOUSE_AGGREGATORS.keySet().stream()
                .map(AggregatorType::name)
                .collect(Collectors.toList());
    }

    @Override
    public String getDatabaseType() {
        return "clickhouse";
    }
}
