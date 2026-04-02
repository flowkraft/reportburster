package com.flowkraft.analytics.engine.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for associative exploration.
 * Given a set of active selections (field=value pairs), computes which values in each
 * requested field are associated (exist in filtered data) vs excluded (exist in unfiltered
 * data but not in filtered data).
 *
 * Works transparently across DuckDB, ClickHouse, and regular SQL databases.
 * Engine is auto-detected from the connection type.
 */
public class ExploreRequest {

    /** Connection code (resolved from settings) */
    private String connectionCode;

    /** Table or view to explore */
    private String tableName;

    /**
     * Active selections — each represents a user click on a value.
     * Multiple selections are combined with AND logic.
     * Example: [{ field: "ShipCountry", value: "Germany" }, { field: "Category", value: "Beverages" }]
     */
    private List<Selection> selections = new ArrayList<>();

    /**
     * Fields to compute associated/excluded states for.
     * Typically all fields that have a FilterPane on the canvas.
     */
    private List<String> fields = new ArrayList<>();

    /** Max distinct values per field (default: 500) */
    private int limit = 500;

    // Constructors
    public ExploreRequest() {}

    // Getters and Setters
    public String getConnectionCode() { return connectionCode; }
    public void setConnectionCode(String connectionCode) { this.connectionCode = connectionCode; }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }

    public List<Selection> getSelections() { return selections; }
    public void setSelections(List<Selection> selections) { this.selections = selections; }

    public List<String> getFields() { return fields; }
    public void setFields(List<String> fields) { this.fields = fields; }

    public int getLimit() { return limit; }
    public void setLimit(int limit) { this.limit = limit; }

    /**
     * A single user selection: one field/value pair.
     */
    public static class Selection {
        private String field;
        private String value;

        public Selection() {}

        public Selection(String field, String value) {
            this.field = field;
            this.value = value;
        }

        public String getField() { return field; }
        public void setField(String field) { this.field = field; }

        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
}
