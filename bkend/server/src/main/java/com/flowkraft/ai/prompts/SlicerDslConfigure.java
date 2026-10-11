package com.flowkraft.ai.prompts;

import java.util.List;

public final class SlicerDslConfigure {

    private SlicerDslConfigure() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "SLICER_DSL_CONFIGURE",
            "Configure Slicer",
            "Generates a complete Slicer DSL configuration script based on user requirements.",
            List.of("dsl", "slicer", "configuration"),
            "DSL Configuration",
            """
You are an expert at configuring Slicers using the Groovy DSL for DataPallas. A slicer displays a list of distinct values from a column and lets users click to filter all connected widgets on the dashboard.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE SLICER HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Slicer Groovy DSL — configures the rb-slicer web component.
 The slicer reads distinct values from the data column and drives
 cross-widget filtering on the dashboard.
*/

slicer('myFilter') {
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
  control 'multiselect'         // 'multiselect' (default, several values) or 'select' (one)
  defaultValue 'Germany', 'France'     // pre-picked values on load
}
</EXAMPLE_DSL>

Generate a Slicer DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- The default configuration is already sensible. Add ONLY the options needed for the user's specific requirement.
- Do not set options that repeat default behavior (e.g. do not set showSearch unless needed).
- Only include the field and the options that change behaviour the user actually asked for.

For more details and examples read: https://datapallas.com/docs/bi-analytics/web-components/slicer

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
