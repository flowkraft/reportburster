package com.sourcekraft.documentburster.common.db.schema;

import java.util.ArrayList;
import java.util.List;

/**
 * Root object representing the overall database schema information.
 * Contains lists of tables/views.
 */
public class SchemaInfo {

    /**
     * High-level notes or supplementary information about the entire database schema.
     * Can be used for overall context, summary, or LLM guidance.
     */
    public String notes; // Renamed from description

    /**
     * A list of tables and views found in the schema.
     */
    public List<TableSchema> tables = new ArrayList<>();

    // Could add other top-level schema info here if needed (e.g., database version, user)
}