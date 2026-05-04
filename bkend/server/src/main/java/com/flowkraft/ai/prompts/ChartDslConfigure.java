package com.flowkraft.ai.prompts;

import java.util.List;

public final class ChartDslConfigure {

    private ChartDslConfigure() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "CHART_DSL_CONFIGURE",
            "Configure Chart",
            "Generates a complete Chart DSL configuration script based on user requirements.",
            List.of("dsl", "chart", "configuration", "chartjs"),
            "DSL Configuration",
            """
You are an expert at configuring Charts using the Groovy DSL for DataPallas. The DSL is aligned with Chart.js — options pass through directly to the Chart.js configuration.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE CHART HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Chart Groovy DSL - aligned 1:1 with Chart.js
 Docs: https://www.chartjs.org/docs/latest/configuration/
 Data comes from ctx.reportData by default - no need to specify it

 Only TWO properties are DSL-specific: labelField and field.
 Everything else is verbatim Chart.js vocabulary.
*/

chart {
  // ─────────────────────────────────────────────────────────────────────────────
  // CHART TYPE
  // ─────────────────────────────────────────────────────────────────────────────
  // Types: line, bar, pie, doughnut, radar, polarArea, scatter, bubble
  type 'bar'

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA - mirrors Chart.js data { labels, datasets } structure
  // ─────────────────────────────────────────────────────────────────────────────
  data {
    labelField 'region'               // DSL-only: which reportData column → X-axis labels

    datasets {
      // Full-featured dataset example
      dataset {
        // Core DSL property
        field 'revenue'               // DSL-only: which reportData column → dataset values

        // All other properties are native Chart.js dataset properties (passthrough via catch-all)
        label 'Revenue'               // legend label
        backgroundColor 'rgba(78, 121, 167, 0.5)'  // fill color (can use rgba)
        borderColor '#4e79a7'         // line/border color
        type 'bar'                    // override chart type for this dataset (mixed charts)

        // Axis assignment (for multiple axes)
        yAxisID 'y'                   // which Y axis to use
        xAxisID 'x'                   // which X axis to use

        // Line/Area chart options
        borderWidth 2                 // line thickness
        fill false                    // fill area under line (true|false|'origin'|'start'|'end')
        tension 0.4                   // line curve tension (0 = straight, 1 = very curved)
        pointRadius 4                 // data point size
        pointStyle 'circle'           // circle|cross|crossRot|dash|line|rect|rectRounded|rectRot|star|triangle

        // Display options
        hidden false                  // hide dataset initially
        order 0                       // drawing order (lower = drawn first)
      }

      // Compact shorthand examples (all properties are native Chart.js)
      dataset field: 'sales', label: 'Sales', backgroundColor: '#4e79a7', borderColor: '#4e79a7'
      dataset field: 'profit', label: 'Profit', backgroundColor: '#e15759', borderColor: '#e15759', type: 'line'
      dataset field: 'cost', label: 'Cost', backgroundColor: '#59a14f', borderColor: '#59a14f', fill: true, tension: 0.3
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHART.JS OPTIONS - full passthrough to Chart.js configuration
  // ─────────────────────────────────────────────────────────────────────────────
  options {
    responsive true
    maintainAspectRatio true

    plugins {
      title { display true; text 'Sales by Region' }
      legend { position 'bottom' }    // top|bottom|left|right
      tooltip { enabled true }
      datalabels { display false }    // requires chartjs-plugin-datalabels
    }

    scales {
      y {
        beginAtZero true
        title { display true; text 'Value' }
        // For secondary axis: y2 { position 'right'; beginAtZero true }
      }
      x {
        title { display true; text 'Region' }
      }
    }

    // Animation
    animation { duration 1000 }
  }
}
</EXAMPLE_DSL>

Generate a Chart DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- Chart.js default configuration is already good. Your job is to add ONLY the minimum extra configuration needed to match the user's specific requirement — nothing more.
- Do not set options that repeat the default behavior (e.g. do not set responsive, maintainAspectRatio, animation, etc. unless the user specifically asked for non-default values).
- Only define datasets the user asked for. Only add scales, plugins, or styling that the user explicitly needs.
- Do not add options "just in case" or for completeness.

For more details and examples read: https://datapallas.com/docs/bi-analytics/web-components/charts

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
