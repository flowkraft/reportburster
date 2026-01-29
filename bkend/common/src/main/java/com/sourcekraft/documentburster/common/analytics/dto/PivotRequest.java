package com.sourcekraft.documentburster.common.analytics.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Request DTO for pivot table operations.
 * Represents the configuration for a pivot query to be executed on the server side.
 */
public class PivotRequest {

    private String connectionCode;
    private String tableName;
    private List<String> rows = new ArrayList<>();
    private List<String> cols = new ArrayList<>();
    private List<String> vals = new ArrayList<>();
    private String aggregatorName = "Count";
    // Filters can be either:
    // - Array format: { "region": ["East", "West"] }
    // - Object format: { "region": { "East": true, "West": true } }
    private Map<String, Object> filters = new HashMap<>();
    private String rowOrder = "key_a_to_z";
    private String colOrder = "key_a_to_z";
    private boolean includeSubtotals = false;
    private Integer limit;

    // Advanced analytics options
    private String windowFunction;        // Window function name (e.g., "RUNNING_SUM", "RANK")
    private String orderByColumn;         // Column to order by for window functions
    private String partitionByColumn;     // Column to partition by for window functions
    private String dateBin;               // Date binning (e.g., "DAY", "MONTH", "QUARTER")
    private String dateColumn;            // Date column for time-series operations
    private String periodComparison;      // Period comparison (e.g., "MONTH_OVER_MONTH", "YEAR_OVER_YEAR")
    private String timeAggregation;       // Time aggregation (e.g., "CUMULATIVE_SUM")

    // Constructors
    public PivotRequest() {
    }

    public PivotRequest(String connectionCode, String tableName) {
        this.connectionCode = connectionCode;
        this.tableName = tableName;
    }

    // Getters and Setters
    public String getConnectionCode() {
        return connectionCode;
    }

    public void setConnectionCode(String connectionCode) {
        this.connectionCode = connectionCode;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public List<String> getRows() {
        return rows;
    }

    public void setRows(List<String> rows) {
        this.rows = rows;
    }

    public List<String> getCols() {
        return cols;
    }

    public void setCols(List<String> cols) {
        this.cols = cols;
    }

    public List<String> getVals() {
        return vals;
    }

    public void setVals(List<String> vals) {
        this.vals = vals;
    }

    public String getAggregatorName() {
        return aggregatorName;
    }

    public void setAggregatorName(String aggregatorName) {
        this.aggregatorName = aggregatorName;
    }

    public Map<String, Object> getFilters() {
        return filters;
    }

    public void setFilters(Map<String, Object> filters) {
        this.filters = filters;
    }

    public String getRowOrder() {
        return rowOrder;
    }

    public void setRowOrder(String rowOrder) {
        this.rowOrder = rowOrder;
    }

    public String getColOrder() {
        return colOrder;
    }

    public void setColOrder(String colOrder) {
        this.colOrder = colOrder;
    }

    public boolean isIncludeSubtotals() {
        return includeSubtotals;
    }

    public void setIncludeSubtotals(boolean includeSubtotals) {
        this.includeSubtotals = includeSubtotals;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }

    public String getWindowFunction() {
        return windowFunction;
    }

    public void setWindowFunction(String windowFunction) {
        this.windowFunction = windowFunction;
    }

    public String getOrderByColumn() {
        return orderByColumn;
    }

    public void setOrderByColumn(String orderByColumn) {
        this.orderByColumn = orderByColumn;
    }

    public String getPartitionByColumn() {
        return partitionByColumn;
    }

    public void setPartitionByColumn(String partitionByColumn) {
        this.partitionByColumn = partitionByColumn;
    }

    public String getDateBin() {
        return dateBin;
    }

    public void setDateBin(String dateBin) {
        this.dateBin = dateBin;
    }

    public String getDateColumn() {
        return dateColumn;
    }

    public void setDateColumn(String dateColumn) {
        this.dateColumn = dateColumn;
    }

    public String getPeriodComparison() {
        return periodComparison;
    }

    public void setPeriodComparison(String periodComparison) {
        this.periodComparison = periodComparison;
    }

    public String getTimeAggregation() {
        return timeAggregation;
    }

    public void setTimeAggregation(String timeAggregation) {
        this.timeAggregation = timeAggregation;
    }

    @Override
    public String toString() {
        return "PivotRequest{" +
                "connectionCode='" + connectionCode + '\'' +
                ", tableName='" + tableName + '\'' +
                ", rows=" + rows +
                ", cols=" + cols +
                ", vals=" + vals +
                ", aggregatorName='" + aggregatorName + '\'' +
                ", filters=" + filters +
                ", rowOrder='" + rowOrder + '\'' +
                ", colOrder='" + colOrder + '\'' +
                ", includeSubtotals=" + includeSubtotals +
                ", limit=" + limit +
                ", windowFunction='" + windowFunction + '\'' +
                ", orderByColumn='" + orderByColumn + '\'' +
                ", partitionByColumn='" + partitionByColumn + '\'' +
                ", dateBin='" + dateBin + '\'' +
                ", dateColumn='" + dateColumn + '\'' +
                ", periodComparison='" + periodComparison + '\'' +
                ", timeAggregation='" + timeAggregation + '\'' +
                '}';
    }
}
