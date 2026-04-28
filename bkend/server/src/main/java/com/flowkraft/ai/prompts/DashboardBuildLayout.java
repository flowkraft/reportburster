package com.flowkraft.ai.prompts;

import java.util.List;

public final class DashboardBuildLayout {

    private DashboardBuildLayout() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "DASHBOARD_BUILD_LAYOUT",
            "Build Dashboard Layout with Web Components",
            "Creates an HTML dashboard template that mixes layout HTML with self-initializing <rb-*> web components for data tables, charts, and pivot tables.",
            List.of("dashboard", "html", "web-components", "layout"),
            "Dashboard Creation",
            """
You are an expert at building data dashboards using HTML and DataPallas web components. Your task is to create an HTML dashboard template that combines regular HTML layout with self-initializing web components.

# Dashboard Requirements

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE DASHBOARD HERE]
</REQUIREMENT>

# Rules

"""
            + AiPromptConstants.DASHBOARD_HTML_RULES
            + """

# Data Fetching Script

The following Groovy script fetches data for the dashboard components. Use it to understand the available data, column names, and component IDs:

[INSERT SCRIPT HERE]

# Available Web Components

The following web components are **self-initializing** — they automatically fetch their own data from the server. You only need to place them in the HTML with the correct attributes. **Do NOT add any <script> tags or JavaScript** — the components handle everything internally.

[AVAILABLE_COMPONENTS]

**Place components exactly as shown** — use the exact tag names and attributes from the "Available Web Components" section above. Do not modify attribute names or invent new ones.

**Atomic Values:** If the data fetching script contains `if (!componentId || componentId == 'atomicValues')`, use `<rb-value>` elements with `component-id="atomicValues"` to display those values. Each `<rb-value>` picks one column via `field`. Multiple elements with the same componentId share one cached fetch. Supported `format`: `currency`, `number`, `percent`, `date`.

Example — 4 KPI cards, 1 shared fetch:
```html
<!-- All 4 share component-id="atomicValues" (1 fetch, cached), each picks a different field -->
<div class="kpi-row">
  <div class="kpi-card">
    <p class="kpi-label">Revenue</p>
    <p class="kpi-value">
      <rb-value report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="atomicValues" field="revenue" format="currency"></rb-value>
    </p>
  </div>
  <div class="kpi-card">
    <p class="kpi-label">Orders</p>
    <p class="kpi-value">
      <rb-value report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="atomicValues" field="orders" format="number"></rb-value>
    </p>
  </div>
  <div class="kpi-card">
    <p class="kpi-label">Avg Order Value</p>
    <p class="kpi-value">
      <rb-value report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="atomicValues" field="avgOrderValue" format="currency"></rb-value>
    </p>
  </div>
  <div class="kpi-card">
    <p class="kpi-label">Customers</p>
    <p class="kpi-value">
      <rb-value report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="atomicValues" field="customers" format="number"></rb-value>
    </p>
  </div>
</div>

```

Generate only the complete HTML code for the dashboard template."""
        );
    }
}
