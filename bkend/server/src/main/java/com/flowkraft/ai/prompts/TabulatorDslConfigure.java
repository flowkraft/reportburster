package com.flowkraft.ai.prompts;

import java.util.List;

public final class TabulatorDslConfigure {

    private TabulatorDslConfigure() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "TABULATOR_DSL_CONFIGURE",
            "Configure Tabulator Table",
            "Generates a complete Tabulator DSL configuration script based on user requirements.",
            List.of("dsl", "tabulator", "configuration", "data-table"),
            "DSL Configuration",
            """
You are an expert at configuring Tabulator data tables using the Groovy DSL for DataPallas. The DSL is a minimal wrapper over the tabulator.info API — all options map 1:1.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE TABLE HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Tabulator Groovy DSL — minimal wrapper over tabulator.info API
 All options map 1:1 to tabulator.info — no invented concepts.
 Docs: https://tabulator.info/docs/6.3
 Data comes from ctx.reportData by default — no need to specify it.
*/

tabulator {
  // ─────────────────────────────────────────────────────────────────────────────
  // TABLE-LEVEL OPTIONS — flat, exactly as in tabulator.info
  // Any tabulator.info option works here: layout, height, pagination, etc.
  // ─────────────────────────────────────────────────────────────────────────────
  layout "fitColumns"       // fitData|fitDataFill|fitDataStretch|fitDataTable|fitColumns
  height "400px"            // table height (px, %, or number)
  width "100%"              // table width
  autoColumns false         // true = auto-generate columns from data
  renderVertical "virtual"  // virtual|basic - virtual DOM rendering
  renderHorizontal "basic"  // virtual|basic - horizontal rendering
  layoutColumnsOnNewData true  // recalc column widths on new data

  // Pagination (all tabulator.info pagination options supported)
  // pagination true
  // paginationSize 20
  // paginationMode "local"  // "local" (default) or "remote" for server-side

  // Server-side options (when working with large datasets)
  // filterMode "local"      // "local" (default) or "remote" for server-side filtering
  // sortMode "local"        // "local" (default) or "remote" for server-side sorting

  // ─────────────────────────────────────────────────────────────────────────────
  // COLUMN DEFINITIONS — mirrors tabulator.info column definition API
  // Any tabulator.info column property works here.
  // ─────────────────────────────────────────────────────────────────────────────
  columns {
    // Full-featured column example
    column {
      // Required
      title "Name"
      field "name"

      // Alignment: hozAlign (left|center|right), vertAlign (top|middle|bottom)
      hozAlign "left"
      vertAlign "middle"
      headerHozAlign "center"  // header text alignment

      // Width: width, minWidth, maxWidth (px or number)
      width 200
      minWidth 100
      maxWidth 400
      widthGrow 1              // flex grow factor
      widthShrink 1            // flex shrink factor

      // Visibility & Layout
      visible true             // false to hide column
      frozen false             // true to freeze column (left/right)
      responsive 0             // responsive priority (lower = hidden first)
      resizable true           // user can resize column

      // Sorting: sorter (string|number|alphanum|boolean|exists|date|time|datetime|array)
      sorter "string"
      sorterParams([])         // sorter-specific params
      headerSort true          // enable header click sorting

      // Filtering
      headerFilter "input"     // input|number|list|textarea|tick|star|select|autocomplete
      headerFilterParams([values: ["A", "B", "C"]])  // filter-specific params
      headerFilterPlaceholder "Search..."

      // Formatting: formatter (plaintext|textarea|html|money|image|link|datetime|tickCross|star|progress|etc)
      formatter "plaintext"
      formatterParams([:])     // formatter-specific params
      cssClass "my-class"      // custom CSS class
      tooltip true             // show cell tooltip

      // Editing: editor (input|textarea|number|range|tick|star|select|autocomplete|date|time|datetime)
      editor "input"
      editorParams([:])        // editor-specific params
      editable true            // cell is editable
      validator "required"     // required|unique|integer|float|numeric|string|min|max|etc

      // Header customization
      headerTooltip "Column description"
      headerVertical false     // rotate header text
    }

    // Compact shorthand examples
    column { title "Age"; field "age"; hozAlign "right"; sorter "number"; formatter "number" }
    column { title "Status"; field "status"; headerFilter "list"; headerFilterParams([values: ["Active", "Pending"]]) }
    column { title "Amount"; field "amount"; formatter "money"; width 120 }
  }
}
</EXAMPLE_DSL>

Generate a Tabulator DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- Tabulator's default configuration is already good. Your job is to add ONLY the minimum extra configuration needed to match the user's specific requirement — nothing more.
- Do not set options that repeat the default behavior (e.g. do not set layout, height, renderVertical, etc. unless the user specifically asked for non-default values).
- Only define columns the user asked for. Only add formatters, filters, sorters, or editors that the user explicitly needs.
- Do not add options "just in case" or for completeness.

For more details and examples read: https://datapallas.com/docs/bi-analytics/web-components/datatables

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
