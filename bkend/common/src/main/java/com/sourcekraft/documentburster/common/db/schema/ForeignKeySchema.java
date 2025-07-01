package com.sourcekraft.documentburster.common.db.schema;

public class ForeignKeySchema {
    public String fkName; // Foreign key constraint name
    public String fkColumnName; // Column in *this* table that is the FK
    public String pkTableName; // The table the PK belongs to
    public String pkColumnName; // The column in the PK table

    /**
     * Supplementary textual notes explaining the semantic meaning or
     * purpose of this foreign key relationship (e.g., "Links orders to the
     * customer who placed them"). Helps LLMs understand *why* tables are joined.
     * This is typically not fetched directly from standard JDBC metadata.
     */
    public String notes; // Renamed from description

    // Could add update/delete rules if needed
}