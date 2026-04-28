package com.flowkraft.ai.prompts;

import java.util.List;

public final class FilterPaneDslConfigure {

    private FilterPaneDslConfigure() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "FILTER_PANE_DSL_CONFIGURE",
            "Configure Filter Pane",
            "Generates a complete Filter Pane DSL configuration script based on user requirements.",
            List.of("dsl", "filter-pane", "configuration"),
            "DSL Configuration",
            """
You are an expert at configuring Filter Panes using the Groovy DSL for DataPallas. A filter pane displays a list of distinct values from a column and lets users click to filter all connected widgets on the dashboard.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE FILTER PANE HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 FilterPane Groovy DSL — configures the rb-filter-pane web component.
 The filter pane reads distinct values from the data column and drives
 cross-widget filtering on the dashboard.
*/

filterPane('myFilter') {
  // ─────────────────────────────────────────────────────────────
  // REQUIRED
  // ─────────────────────────────────────────────────────────────
  field 'ShipCountry'           // the data column whose distinct values are listed

  // ─────────────────────────────────────────────────────────────
  // OPTIONAL — Display
  // ─────────────────────────────────────────────────────────────
  label 'Ship To Country'       // heading shown above the list (defaults to field name)
  height '300px'                // fixed height with vertical scroll; omit for auto-height

  // ─────────────────────────────────────────────────────────────
  // OPTIONAL — Sorting
  // Values: 'asc' | 'desc' | 'count_desc' | 'none'
  // ─────────────────────────────────────────────────────────────
  sort 'count_desc'             // show most-frequent values first

  // ─────────────────────────────────────────────────────────────
  // OPTIONAL — Display extras
  // ─────────────────────────────────────────────────────────────
  showCount true                // show "(42)" next to each value
  showSearch true               // show a search box (auto-enabled when > 10 values)
  maxValues 500                 // safety cap on distinct values rendered

  // ─────────────────────────────────────────────────────────────
  // OPTIONAL — Selection behavior
  // ─────────────────────────────────────────────────────────────
  multiSelect true              // allow selecting multiple values at once (default: true)
  defaultSelected 'Germany', 'France'  // pre-selected values on load
}
</EXAMPLE_DSL>

Generate a Filter Pane DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- The default configuration is already sensible. Add ONLY the options needed for the user's specific requirement.
- Do not set options that repeat default behavior (e.g. do not set showSearch unless needed).
- Only include the field and the options that change behaviour the user actually asked for.

For more details and examples read: https://www.reportburster.com/docs/bi-analytics/web-components/filter-pane

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
