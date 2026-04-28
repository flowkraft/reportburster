package com.flowkraft.ai.prompts;

import java.util.List;

public final class CubeDslConfigure {

    private CubeDslConfigure() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "CUBE_DSL_CONFIGURE",
            "Configure Cube Definition",
            "Generates a complete Cube DSL configuration defining dimensions, measures, joins, segments, and hierarchies over a database table.",
            List.of("dsl", "cube", "configuration", "semantic-model", "olap"),
            "DSL Configuration",
            """
You are an expert at defining semantic data models using the Cube Groovy DSL for DataPallas. The Cube DSL uses standard OLAP/BI terminology (dimensions, measures, joins, segments, hierarchies) — the same vocabulary used by Cube.dev, Looker, Power BI, and Tableau.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE CUBE HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Cube Groovy DSL — semantic model definition
 Uses standard OLAP/BI terminology: dimensions, measures, joins, segments, hierarchies.
 Docs: https://www.reportburster.com/docs/bi-analytics/web-components/cubes
*/

cube {
  sql_table 'public.orders'

  // ── Dimensions — categorical / time attributes ──────────────────────────
  dimension { name 'order_id';   sql 'id';          type 'number'; primary_key true }
  dimension { name 'status';     sql 'status';      type 'string' }
  dimension { name 'created_at'; sql 'created_at';  type 'time' }
  dimension { name 'amount';     sql 'amount';      type 'number' }

  // Case-based dimension (conditional mapping)
  dimension {
    name 'status_label'
    type 'string'
    case_ {
      when sql: "${CUBE}.status = 'A'", label: 'Active'
      when sql: "${CUBE}.status = 'P'", label: 'Pending'
      else_label 'Other'
    }
  }

  // ── Measures — aggregations ─────────────────────────────────────────────
  measure { name 'order_count';   type 'count' }
  measure { name 'total_revenue'; type 'sum'; sql 'amount'; format 'currency' }
  measure { name 'avg_order';     type 'avg'; sql 'amount' }

  // Measure with filter (only counts completed orders)
  measure {
    name 'completed_count'
    type 'count'
    filters { filter sql: "${CUBE}.status = 'completed'" }
    drill_members 'order_id', 'status', 'created_at'
  }

  // ── Joins — relationships to other tables ───────────────────────────────
  join {
    name 'customers'
    sql '${CUBE}.customer_id = customers.id'
    relationship 'many_to_one'
  }

  // ── Segments — reusable named WHERE clauses ─────────────────────────────
  segment { name 'recent'; sql "${CUBE}.created_at >= NOW() - INTERVAL '30 days'" }
  segment {
    name 'high_value'
    title 'High Value Orders'
    description 'Orders above $500'
    sql "${CUBE}.amount > 500"
  }

  // ── Hierarchies — drill-down paths ──────────────────────────────────────
  hierarchy {
    name 'geography'
    title 'Customer Geography'
    levels 'country', 'region', 'city'
  }
}
</EXAMPLE_DSL>

Generate a Cube DSL configuration based on the requirement above. Use the example DSL as a reference for syntax and all available features.

**RULES:**

1. **`sql_table`** — set to the main database table name. Use schema-qualified names if needed (e.g., `'public.orders'`).

2. **Dimensions** — categorical attributes and time fields the user will GROUP BY or filter on:
   - Always include a `primary_key true` dimension for the main ID column.
   - Use `type 'string'` for categorical fields, `type 'number'` for numeric, `type 'time'` for dates.
   - Use `case_` blocks for conditional value mapping (e.g., status codes → labels).
   - Use sub-blocks (`latitude`, `longitude`) for `type 'geo'` dimensions.

3. **Measures** — aggregations the user will compute:
   - Supported types: `count`, `sum`, `avg`, `min`, `max`, `count_distinct`.
   - Use `drill_members` to list dimension names for drill-down from a KPI.
   - Use `format 'currency'` for monetary values.
   - Use `filters` block for filtered measures (e.g., only count completed orders).

4. **Joins** — relationships to other tables:
   - Use `${CUBE}` as self-reference placeholder in SQL expressions.
   - Supported relationships: `'many_to_one'`, `'one_to_many'`, `'one_to_one'`.

5. **Segments** — reusable named WHERE clauses:
   - Use for common filter shortcuts (e.g., "last 30 days", "high value").

6. **Hierarchies** — drill-down paths:
   - Use `levels` to define the dimension drill order (e.g., country → region → city).

7. **Be minimalistic** — only define dimensions, measures, joins, segments, and hierarchies that the user explicitly asked for. Do not add extras "just in case."

8. **Use `${CUBE}` placeholder** in SQL expressions — it gets replaced with the actual table name at query time.

Database vendor: [DATABASE_VENDOR]

Database Schema:
[INSERT THE RELEVANT DATABASE SCHEMA HERE]

Return only the DSL script — no explanations."""
        );
    }
}
