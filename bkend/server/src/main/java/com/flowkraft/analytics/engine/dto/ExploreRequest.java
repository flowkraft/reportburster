package com.flowkraft.analytics.engine.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.function.UnaryOperator;

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
     * The schema that table is in, when it is not the connection's default one.
     *
     * <p>A table is a (schema, name) pair everywhere it is keyed, quoted or asked about - the
     * canvas's {@code TableRef} ({@code table-ref.ts}) - and the pair travels as a pair: a
     * {@code dash_demo.orders} written into {@code tableName} asks for a table of that exact
     * name and finds none ({@code Binder Error: Referenced column "channel" not found}, which is
     * the sample table of the same name in the default schema answering instead).
     */
    private String tableSchema;

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

    public String getTableSchema() { return tableSchema; }
    public void setTableSchema(String tableSchema) { this.tableSchema = tableSchema; }

    /**
     * The table this explores, written for a database: the schema is a name of its own, quoted on
     * its own. The vendors differ only in the quote character, so the caller hands that in - the
     * same way {@code ExploreSelections.where} takes it.
     *
     * @param quote how this vendor quotes one identifier
     */
    public String quotedTable(UnaryOperator<String> quote) {
        String quoted = quote.apply(tableName);
        if (tableSchema == null || tableSchema.trim().isEmpty())
            return quoted;
        return quote.apply(tableSchema) + "." + quoted;
    }

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
