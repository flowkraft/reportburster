package com.flowkraft.ai.prompts;

import java.util.List;

public final class DashboardBuildStepByStep {

    private DashboardBuildStepByStep() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "DASHBOARD_BUILD_STEP_BY_STEP_INSTRUCTIONS",
            "Build a Dashboard (Step-by-Step Instructions)",
            "Returns numbered step-by-step instructions covering all pieces needed to build a complete dashboard: Groovy data source script, HTML template, Tabulator/Chart/Pivot Table configuration DSLs, and Report Parameters.",
            List.of("dashboard", "step-by-step", "groovy", "web-components", "complete-guide"),
            "Dashboard Creation",
            """
You are an expert at building data dashboards using DataPallas. The user wants to create a complete, working dashboard from scratch. Your task is to provide a **numbered step-by-step guide** with all pieces needed — NOT just a single template.

# Business-First Thinking

**Before designing anything**, study the database schema carefully and reason about:

1. **What business domain is this?** (e-commerce, HR, finance, logistics, healthcare, etc.) — the table and column names will tell you.
2. **What decisions does a business person make with this data?** — a sales manager cares about revenue trends and top customers, an HR director cares about headcount and turnover, a warehouse manager cares about inventory levels and order fulfillment. Design for the specific person who would use THIS data.
3. **What are the most important metrics THIS schema can actually produce?** — only propose KPIs, charts, and tables that the actual columns support. Do not assume columns exist that are not in the schema. Do not invent metrics the data cannot back. Be pragmatic.
4. **What is the most common-sense, highest-value dashboard for this data?** — build what a business stakeholder would expect to see. No novelty for novelty's sake. The dashboard should feel obvious and inevitable given the data — "of course that's what you'd show."

# Design Principles

- **Less is more.** A clean, focused dashboard with 4–6 well-chosen components is always better than one stuffed with everything the schema could support. Only include what earns its place. If a visualization doesn't help a decision, leave it out.
- **Top-to-bottom, left-to-right priority.** Place the most important, most frequently needed information at the top. As the user scrolls down, importance decreases. Within a row, the most critical item goes on the left. KPI cards first, then the primary trend chart, then breakdowns, then detail tables at the bottom.
- **Naming matters.** Every chart title, table heading, KPI label, column header, section name, and component ID must use the most direct, expected business term for what it represents. Fewer, clearer words always beat more words. "Revenue" not "Total Revenue Amount". "Orders by Region" not "Regional Order Distribution Analysis". Choose the name a business person would already use when talking about this data.

# Dashboard Requirements

<REQUIREMENT>
Analyze my database schema and build the most useful business dashboard.

Use the schema to make domain-aware choices — not just mechanical column-type mapping:
- Identify the **core business entities** (customers, orders, products, employees, transactions, etc.) and their relationships
- Determine the **key business metrics** these entities produce (revenue, conversion rate, average order value, headcount, fulfillment rate, etc.)
- Find the **natural time dimension** for trends (order date, hire date, transaction date) — not every date column is worth trending
- Identify **meaningful categorical breakdowns** (by region, department, product category, status) — pick the ones that drive business decisions, not all of them

Prioritize what a business stakeholder would check every morning:
1. Key metrics at a glance (KPI cards with the numbers that matter most for THIS business)
2. Trends over time (the metric that best shows how the business is performing)
3. Top performers and breakdowns (the dimensions people actually slice by)
4. Detailed drill-down data (filterable data table for investigation)

Start with your best suggestion — I will refine (with your help also) from there.
</REQUIREMENT>

# Database Schema

Database vendor: [DATABASE_VENDOR]

The following describes the relevant tables and columns available:

[INSERT THE RELEVANT DATABASE SCHEMA HERE]

For tables with full schema, the JSON contains table definitions with columns (data types), primary keys, and foreign keys.
For tables listed by name only, you know these tables exist but do not have column details — if you need column details for specific tables, ask the user.
You MUST use only the tables and columns present in the provided schema. Do not infer the existence of other tables or columns not listed.

# Instructions

Return the following numbered steps. Each step must include **complete, ready-to-use code** — no placeholders, no "add more here" comments. Every query, column reference, and table name must exist in the schema above — do not hallucinate columns or tables.

**Multi-Component Reports:** A dashboard may contain multiple tabulators, charts, and/or pivot tables in the same report — use only the component types that serve the business need. You MUST use the **named (multi-component) DSL syntax** for all component configurations — `tabulator('componentId') { ... }`, `chart('componentId') { ... }`, `pivotTable('componentId') { ... }`. The componentId must match across three places: (1) `ctx.reportData('componentId', data)` in the data script, (2) the `component-id` attribute on the HTML web component, and (3) the named DSL block. Do NOT use the unnamed `tabulator { ... }` form — that is only for standalone single-component reports. For details see: https://www.reportburster.com/docs/bi-analytics/performance-real-time#multi-component-reports

**Visual coherence across all components:** The HTML template, Tabulator tables, Charts, and Pivot Tables will render together as one dashboard. Their colors must be visually coherent — pick a unified color palette and carry it through: the CSS variables in the HTML layout, the Chart dataset backgroundColor/borderColor values, any Tabulator formatter colors, and Pivot Table renderer colors should all feel like they belong to the same dashboard. Do not pick colors in isolation per component.

---

## Step 1: Groovy Data Source Script

Write the complete Groovy script that fetches data for each dashboard component. **Use the componentId guard pattern** so each component only triggers its own query:

```groovy
import groovy.sql.Sql

def dbSql = ctx.dbSql

def componentId = ctx.variables?.get('componentId')

// Component: atomicValues — single query returning all KPI values as columns
if (!componentId || componentId == 'atomicValues') {
    def data = dbSql.rows("SELECT COUNT(*) AS totalOrders, SUM(amount) AS revenue, ... FROM ...")
    ctx.reportData('atomicValues', data)
}

// Component: salesGrid (Tabulator)
if (!componentId || componentId == 'salesGrid') {
    def data = dbSql.rows("SELECT ... FROM ...")
    ctx.reportData('salesGrid', data)
}

// Component: revenueChart (Chart)
if (!componentId || componentId == 'revenueChart') {
    def data = dbSql.rows("SELECT ... FROM ...")
    ctx.reportData('revenueChart', data)
}

// Component: orderExplorer (Pivot Table)
if (!componentId || componentId == 'orderExplorer') {
    def data = dbSql.rows("SELECT ... FROM ...")
    ctx.reportData('orderExplorer', data)
}
```

**Key rules:**
- When `componentId` is null (full dashboard load), ALL blocks execute
- When a specific `componentId` is passed (single component refresh), only that block runs
- Use `ctx.dbSql` for database access (connection is pre-configured)
- Use `ctx.reportData('componentName', data)` to route data to each component
- Each component name must match the `component-id` attribute in the HTML template
- **Atomic values:** Use a single `atomicValues` component that returns all KPI metrics as columns in one row. Do NOT create separate components per KPI — one query, one `ctx.reportData('atomicValues', data)` call. In the HTML template (Step 3), use `<rb-value>` elements with `component-id="atomicValues"` and different `field` attributes to display each value.

---

## Step 2: Report Parameters Configuration

**Think carefully about this step** — parameters are NOT optional plumbing, they are core to the dashboard's business value. They define how users interact with and explore the data. A dashboard without the right filters is just a static report.

Consider the business context and the database schema to determine:
- **Date ranges** — almost every business dashboard needs a time window (last 7 days, this month, custom range). Look for date/timestamp columns.
- **Key dimensions** — which categorical fields (department, region, product category, customer segment, status) would a stakeholder want to slice by?
- **Sensible defaults** — each parameter must have a default value that shows meaningful data on first load (e.g., last 30 days, "All" departments). The dashboard must be immediately useful without any user interaction.

```groovy
import java.time.LocalDate

reportParameters {
    parameter(
        id: 'startDate',
        type: LocalDate,
        label: 'Start Date',
        defaultValue: LocalDate.now().minusDays(30)
    ) {
        constraints(required: true)
        ui(control: 'date', format: 'yyyy-MM-dd')
    }
    parameter(
        id: 'department',
        type: String,
        label: 'Department',
        defaultValue: 'All'
    ) {
        constraints(required: false)
        ui(control: 'select', options: ['All', 'Sales', 'Engineering', 'Marketing'])
    }
}
```

The SQL queries in Step 1 must use these parameters via `ctx.variables` to filter the data accordingly.

---

## Step 3: HTML Dashboard Template

Write the complete HTML template using the web components your design requires — choose from `<rb-value>`, `<rb-tabulator>`, `<rb-chart>`, `<rb-pivot-table>`, and `<rb-parameters>`. Only include component types that earn their place in the dashboard.

"""
            + AiPromptConstants.DASHBOARD_HTML_RULES
            + """

Each web component needs these attributes:
- `report-id="[REPORT_CODE]"` — the report identifier
- `api-base-url="[API_BASE_URL]"` — the API endpoint
- `component-id="uniqueName"` — must match the name used in `ctx.reportData()`

Example: `<rb-tabulator report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="salesGrid"></rb-tabulator>`
Example: `<rb-value report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="atomicValues" field="revenue" format="currency"></rb-value>`

**Atomic Values with `<rb-value>`:** For single-value displays (revenue totals, order counts, averages), use `<rb-value>` instead of `<rb-tabulator>`. The data script (Step 1) should have a `ctx.reportData('atomicValues', data)` block returning all values as columns in one row. Multiple `<rb-value>` elements sharing `component-id="atomicValues"` make only one HTTP request — each picks its column via `field`. Supported `format`: `currency` ($58,153), `number` (1,234), `percent` (73%), `date` (Mar 15, 2024), or omit for raw value.

---

## Step 4: Tabulator Configuration DSL

If your dashboard includes `<rb-tabulator>` components, provide the Groovy DSL configuration for each. Since a dashboard has multiple components, **always use the named form** `tabulator('componentId') { ... }` where the componentId matches the `component-id` attribute in the HTML template and the name used in `ctx.reportData('componentId', data)`.

```groovy
/*
 Tabulator Groovy DSL — minimal wrapper over tabulator.info API
 All options map 1:1 to tabulator.info — no invented concepts.
 Docs: https://tabulator.info/docs/6.3
 Data comes from ctx.reportData by default — no need to specify it.
*/

tabulator {
  layout "fitColumns"
  height "400px"
  renderVertical "virtual"

  columns {
    column {
      title "Name"; field "name"
      hozAlign "left"; sorter "string"
      headerFilter "input"
    }
    column { title "Age"; field "age"; hozAlign "right"; sorter "number" }
    column { title "Status"; field "status"; headerFilter "list"; headerFilterParams([values: ["Active", "Pending"]]) }
    column { title "Amount"; field "amount"; formatter "money"; width 120 }
  }
}
```

"""
            + AiPromptConstants.MULTI_COMPONENT_NOTE
            + """

**Key options:** All options are flat at the top level of `tabulator('componentId') { }` (no nested `options {}` block). columns (field, title, sorter, formatter, headerFilter), pagination, paginationSize, layout (fitColumns/fitData/fitDataFill), height, movableRows, selectableRows, groupBy, frozenRows, responsiveLayout.

For full details: https://www.reportburster.com/docs/bi-analytics/web-components/datatables

---

## Step 5: Chart Configuration DSL

If your dashboard includes `<rb-chart>` components, provide the Groovy DSL configuration for each. Since a dashboard has multiple components, **always use the named form** `chart('componentId') { ... }`.

```groovy
/*
 Chart Groovy DSL - aligned 1:1 with Chart.js
 Docs: https://www.chartjs.org/docs/latest/configuration/
 Data comes from ctx.reportData by default - no need to specify it
*/

chart {
  type 'bar'

  data {
    labelField 'region'
    datasets {
      dataset { field 'revenue'; label 'Revenue'; backgroundColor 'rgba(78, 121, 167, 0.5)'; borderColor '#4e79a7' }
      dataset { field 'profit'; label 'Profit'; backgroundColor: '#e15759'; type 'line'; tension 0.4 }
    }
  }

  options {
    responsive true
    plugins {
      title { display true; text 'Sales by Region' }
      legend { position 'bottom' }
    }
    scales {
      y { beginAtZero true; title { display true; text 'Value' } }
      x { title { display true; text 'Region' } }
    }
  }
}
```

"""
            + AiPromptConstants.MULTI_COMPONENT_NOTE
            + """

**Supported chart types:** bar, line, pie, doughnut, radar, polarArea, horizontalBar, stackedBar, area, dualYAxis.

For full details: https://www.reportburster.com/docs/bi-analytics/web-components/charts

---

## Step 6: Pivot Table Configuration DSL

If your dashboard includes `<rb-pivot-table>` components, provide the Groovy DSL configuration for each. Since a dashboard has multiple components, **always use the named form** `pivotTable('componentId') { ... }`.

```groovy
/*
 Pivot Table Groovy DSL
 Docs: https://www.reportburster.com/docs/bi-analytics/web-components/pivottables
 Data comes from ctx.reportData by default - no need to specify it
*/

pivotTable {
  rows 'region', 'country'
  cols 'year', 'quarter'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'

  options {
    menuLimit 500
  }
}
```

"""
            + AiPromptConstants.MULTI_COMPONENT_NOTE
            + """

**Aggregators:** Sum, Count, Average, Minimum, Maximum, Count Unique Values, List Unique Values, Integer Sum, Sum over Sum.
**Renderers:** Table, Table Heatmap, Table Col Heatmap, Table Row Heatmap, Exportable TSV.

For full details: https://www.reportburster.com/docs/bi-analytics/web-components/pivottables

---

# Reference Documentation
- Data Tables: https://www.reportburster.com/docs/bi-analytics/web-components/datatables
- Charts: https://www.reportburster.com/docs/bi-analytics/web-components/charts
- Pivot Tables: https://www.reportburster.com/docs/bi-analytics/web-components/pivottables
- Multi-Component Dashboards / Performance / Real-Time: https://www.reportburster.com/docs/bi-analytics/performance-real-time

Provide all steps with complete, production-ready code based on the user's requirements and the database schema provided."""
        );
    }
}
