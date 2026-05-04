package com.flowkraft.ai.prompts;

import java.util.List;

public final class PivotTableDslConfigure {

    private PivotTableDslConfigure() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "PIVOT_TABLE_DSL_CONFIGURE",
            "Configure Pivot Table",
            "Generates a complete Pivot Table DSL configuration script based on user requirements.",
            List.of("dsl", "pivot-table", "configuration"),
            "DSL Configuration",
            """
You are an expert at configuring Pivot Tables using the Groovy DSL for DataPallas.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE PIVOT TABLE HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Pivot Table Groovy DSL
 Docs: https://datapallas.com/docs/bi-analytics/web-components/pivottables
 Data comes from ctx.reportData by default - no need to specify it
*/

pivotTable {
  // ─────────────────────────────────────────────────────────────────────────────
  // ROW FIELDS - which columns to use as row headers (group by)
  // ─────────────────────────────────────────────────────────────────────────────
  rows 'region', 'country'

  // ─────────────────────────────────────────────────────────────────────────────
  // COLUMN FIELDS - which columns to pivot across horizontally
  // ─────────────────────────────────────────────────────────────────────────────
  cols 'year', 'quarter'

  // ─────────────────────────────────────────────────────────────────────────────
  // VALUE FIELDS - which columns to aggregate
  // ─────────────────────────────────────────────────────────────────────────────
  vals 'revenue'

  // ─────────────────────────────────────────────────────────────────────────────
  // AGGREGATOR - how to combine values
  // ─────────────────────────────────────────────────────────────────────────────
  // Available aggregators:
  // Count, Count Unique Values, List Unique Values, Sum, Integer Sum, Average, Median,
  // Sample Variance, Sample Standard Deviation, Minimum, Maximum, First, Last,
  // Sum over Sum, Sum as Fraction of Total, Sum as Fraction of Rows, Sum as Fraction of Columns,
  // Count as Fraction of Total, Count as Fraction of Rows, Count as Fraction of Columns
  aggregatorName 'Sum'

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDERER - how to display the pivot table
  // ─────────────────────────────────────────────────────────────────────────────
  // Available renderers:
  // Table, Table Heatmap, Table Col Heatmap, Table Row Heatmap, Exportable TSV
  // (Plotly renderers if available: Grouped Column Chart, Stacked Column Chart, etc.)
  rendererName 'Table'

  // ─────────────────────────────────────────────────────────────────────────────
  // SORTING - row and column sort order
  // ─────────────────────────────────────────────────────────────────────────────
  // Options: key_a_to_z (alphabetical), value_a_to_z (by value ascending), value_z_to_a (by value descending)
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'

  // ─────────────────────────────────────────────────────────────────────────────
  // VALUE FILTER - exclude specific values from the pivot
  // ─────────────────────────────────────────────────────────────────────────────
  valueFilter {
    // Exclude specific values from a column
    // filter 'status', exclude: ['Inactive', 'Pending']
    // filter 'region', exclude: ['Unknown']
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DERIVED ATTRIBUTES - compute new fields from existing data
  // ─────────────────────────────────────────────────────────────────────────────
  // derivedAttributes {
  //   'Fiscal Quarter' 'dateFormat(orderDate, "%Y-Q%q")'   // 2024-Q3
  //   'Year'           'dateFormat(orderDate, "%Y")'        // 2024
  //   'Month'          'dateFormat(orderDate, "%Y-%m")'     // 2024-07
  // }

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOM SORTERS - control the display order of dimension values
  // ─────────────────────────────────────────────────────────────────────────────
  // sorters {
  //   sorter 'priority', order: ['Critical', 'High', 'Medium', 'Low']
  //   sorter 'region',   order: ['West', 'Central', 'East']
  // }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIELD VISIBILITY - control which fields appear in the UI
  // ─────────────────────────────────────────────────────────────────────────────
  // hiddenAttributes 'id', 'internal_code'          // hide from everywhere
  // hiddenFromAggregators 'name', 'description'     // hide from value dropdown
  // hiddenFromDragDrop 'total'                      // hide from drag areas

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONS - additional pivot table options
  // ─────────────────────────────────────────────────────────────────────────────
  options {
    menuLimit 500                // max values to show in filter dropdowns
    // unusedOrientationCutoff 85  // layout threshold: horizontal if fewer chars
  }
}
</EXAMPLE_DSL>

Generate a Pivot Table DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- The pivot table's default configuration is already good. Your job is to add ONLY the minimum extra configuration needed to match the user's specific requirement — nothing more.
- Do not set options that repeat the default behavior (e.g. do not set rowOrder, colOrder, rendererName, etc. unless the user specifically asked for non-default values).
- Only specify rows, cols, vals, and aggregator that the user explicitly needs.
- Do not add options "just in case" or for completeness.

For more details and examples read: https://datapallas.com/docs/bi-analytics/web-components/pivottables

"""
            + AiPromptConstants.MULTI_COMPONENT_NOTE
            + """

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

Return only the DSL script — no explanations."""
        );
    }
}
