package com.flowkraft.ai.prompts;

import java.util.List;

public final class DashboardFromCubeDsl {

    private DashboardFromCubeDsl() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "DASHBOARD_FROM_CUBE_DSL",
            "Build a Dashboard from DataPallas Cube DSL",
            "Returns numbered step-by-step instructions for building a complete dashboard (Groovy data source script, HTML template, Tabulator/Chart/Pivot Table configuration DSLs) using selected DataPallas Cube DSL semantic models as the canonical source of truth.",
            List.of("dashboard", "cube", "dsl", "step-by-step", "semantic-model", "web-components"),
            "Dashboard Creation",
            """
You are an expert at building data dashboards using DataPallas. The user wants to create a complete, working dashboard from scratch using **DataPallas Cube DSL** semantic models as the data layer. Your task is to provide a **numbered step-by-step guide** with all pieces needed.

**CRITICAL OUTPUT RULE — READ FIRST:**
Your output must contain raw SQL inside the Groovy data script — NEVER output Cube DSL syntax (`cube { ... }`, `dimension { ... }`, `measure { ... }`, etc.) in the final deliverables. The cube DSL is INPUT context for you to read and translate into SQL.

# Business-First Thinking

**Before designing anything**, study the cube semantic models carefully and reason about:

1. **What business domain is this?** (e-commerce, HR, finance, logistics, etc.) — the cube names, dimension names, and measure names will tell you.
2. **What decisions does a business person make with this data?** — a sales manager cares about revenue trends and top customers, an HR director cares about headcount and turnover. Design for the specific person who would use THIS data.
3. **What are the most important metrics THESE cubes can produce?** — only propose KPIs, charts, and tables that the actual measures and dimensions support. Do not invent metrics the cubes cannot back.
4. **What is the most common-sense, highest-value dashboard for this data?** — build what a business stakeholder would expect to see.

# Design Principles

- **Less is more.** A clean, focused dashboard with 4–6 well-chosen components is always better than one stuffed with everything the cubes could support.
- **Top-to-bottom, left-to-right priority.** KPI cards first, then the primary trend chart, then breakdowns, then detail tables at the bottom.
- **Naming matters.** Use the most direct, expected business term. "Revenue" not "Total Revenue Amount". "Orders by Region" not "Regional Order Distribution Analysis".

# Dashboard Requirements

<REQUIREMENT>
Analyze my cube semantic models and build the most useful business dashboard.

Use the cubes to make domain-aware choices:
- Identify the **core business entities** from the cube names and their `sql_table` / dimensions
- Determine the **key business metrics** from the cube measures (revenue, conversion rate, average order value, etc.)
- Find the **natural time dimension** from dimensions with `type 'time'`
- Identify **meaningful categorical breakdowns** from dimensions with `type 'string'`

Prioritize what a business stakeholder would check every morning:
1. Key metrics at a glance (KPI cards)
2. Trends over time
3. Top performers and breakdowns
4. Detailed drill-down data

Start with your best suggestion — I will refine from there.
</REQUIREMENT>

# DataPallas Cube DSL Semantic Models

Database vendor: [DATABASE_VENDOR]

The following are the cubes the user has selected as context. Each one is a Groovy DSL definition that maps a database table into a semantic model with named dimensions, aggregated measures, joins, and segments:

[INSERT THE RELEVANT CUBE DSL HERE]

---

## DataPallas CUBE DSL — GRAMMAR REFERENCE

You MUST understand the following grammar to translate the cubes into correct SQL inside the Groovy data script. DataPallas uses a custom Groovy builder DSL — it is **similar in spirit to Cube.dev / LookML, but the syntax is different** and you must follow this reference exactly.

### Top-level form

```groovy
cube { ... }                  // unnamed (default cube)
cube('cube_name') { ... }     // named cube
```

### Cube-level properties

| Property | Example | Meaning |
|---|---|---|
| `sql_table` | `sql_table 'public.orders'` | Underlying table — base FROM target |
| `sql` | `sql 'SELECT * FROM orders WHERE deleted_at IS NULL'` | Underlying subquery (used instead of `sql_table`) |
| `sql_alias` | `sql_alias 'o'` | Short alias (used by joins from other cubes) |
| `title` / `description` / `meta` | (display only) | Ignore for SQL |
| `extends_` | `extends_ 'parent'` | Inheritance — cube borrows everything from parent |

**One of `sql_table` or `sql` is the base table for FROM.**

### Dimensions

```groovy
dimension {
  name 'order_id'        // logical name
  sql 'id'               // column expression — relative to base table or join alias
  type 'number'          // 'number', 'string', 'time', 'boolean', 'geo'
  primary_key true       // optional
}
```

The `sql` value is the **column expression**, which can reference the base table directly, a joined table by alias, or use the `${CUBE}` placeholder.

### Measures

```groovy
measure {
  name 'total_revenue'
  type 'sum'             // 'count', 'sum', 'avg', 'min', 'max', 'count_distinct'
  sql 'amount'           // column or expression to aggregate
  format 'currency'      // display only — ignore
}
```

**The `type` field tells you which SQL aggregation to use:**

| type | SQL output |
|---|---|
| `count` | `COUNT(*)` if no `sql`, else `COUNT(<sql>)` |
| `count_distinct` | `COUNT(DISTINCT <sql>)` |
| `sum` | `SUM(<sql>)` |
| `avg` | `AVG(<sql>)` |
| `min` | `MIN(<sql>)` |
| `max` | `MAX(<sql>)` |

**Measure-scoped filters** (`filters { filter sql: '...' }`) apply to that measure only — render as `CASE WHEN <filter> THEN ... END` inside the aggregation, NOT as a global WHERE clause.

### Joins

```groovy
join {
  name 'customers'                                 // table name to JOIN to
  sql '${CUBE}.customer_id = customers.id'        // ON expression
  relationship 'many_to_one'                       // 'many_to_one' | 'one_to_many' | 'one_to_one'
}
```

Use `INNER JOIN` by default. Use `LEFT JOIN` only when optional matches are implied.

### Segments

```groovy
segment { name 'high_value'; sql "${CUBE}.revenue > 1000" }
```

Reusable named WHERE conditions. Apply when the user's question matches.

### Hierarchies

Metadata only — IGNORE for SQL generation.

### `${CUBE}` placeholder

Literal placeholder referring to the cube's own base table. **You MUST replace every `${CUBE}` with the actual base table alias when emitting SQL.** Never leave `${CUBE}` in the output. Inside Groovy triple-quoted strings, `${...}` is Groovy interpolation — write the resolved table alias (e.g. `o.status`), NOT `${CUBE}.status`.

---

# Instructions

Return the following numbered steps. Each step must include **complete, ready-to-use code** — no placeholders. Every SQL query must be derived from the provided cubes — do not hallucinate columns or tables.

**Multi-Component Reports:** A dashboard may contain multiple tabulators, charts, and/or pivot tables — use only the component types that serve the business need. You MUST use the **named (multi-component) DSL syntax** for all configurations — `tabulator('componentId') { ... }`, `chart('componentId') { ... }`, `pivotTable('componentId') { ... }`. The componentId must match across: (1) `ctx.reportData('componentId', data)` in the data script, (2) the `component-id` attribute on the HTML web component, and (3) the named DSL block.

**Visual coherence:** Pick a unified color palette and carry it through CSS variables, Chart dataset colors, and Tabulator formatting.

---

## Step 1: Groovy Data Source Script

Write the complete Groovy script that fetches data for each dashboard component. **Use the componentId guard pattern** so each component only triggers its own query. **Translate cube dimensions/measures/joins/segments into raw SQL** — never embed cube DSL syntax in the output.

```groovy
import groovy.sql.Sql

def dbSql = ctx.dbSql

def componentId = ctx.variables?.get('componentId')

// Component: atomicValues — KPI metrics derived from cube measures
if (!componentId || componentId == 'atomicValues') {
    // Translate cube measures into SQL aggregations, resolve ${CUBE} to table alias
    def data = dbSql.rows("SELECT ... FROM ...")
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
```

**Key rules:**
- When `componentId` is null (full dashboard load), ALL blocks execute
- When a specific `componentId` is passed (single component refresh), only that block runs
- Use `ctx.dbSql` for database access (connection is pre-configured)
- Use `ctx.reportData('componentName', data)` to route data to each component
- **Atomic values:** Use a single `atomicValues` component returning all KPI metrics as columns in one row
- **Resolve every `${CUBE}`** to the underlying table alias in SQL strings
- **Wrap every measure** with the SQL aggregation matching its `type` field
- **Apply measure-scoped filters** as `CASE WHEN` inside aggregations
- **Apply segments** as WHERE conditions when semantically matching

---

## Step 2: Report Parameters Configuration

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
}
```

The SQL queries in Step 1 must use these parameters via `ctx.variables` to filter the data.

---

## Step 3: HTML Dashboard Template

Write the complete HTML template using the web components your design requires.

"""
            + AiPromptConstants.DASHBOARD_HTML_RULES
            + """

Each web component needs these attributes:
- `report-id="[REPORT_CODE]"` — the report identifier
- `api-base-url="[API_BASE_URL]"` — the API endpoint
- `component-id="uniqueName"` — must match the name used in `ctx.reportData()`

Example: `<rb-tabulator report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="salesGrid"></rb-tabulator>`
Example: `<rb-value report-id="[REPORT_CODE]" api-base-url="[API_BASE_URL]" component-id="atomicValues" field="revenue" format="currency"></rb-value>`

**Atomic Values with `<rb-value>`:** For single-value displays (revenue totals, order counts, averages), use `<rb-value>` instead of `<rb-tabulator>`. Multiple `<rb-value>` elements sharing `component-id="atomicValues"` make only one HTTP request — each picks its column via `field`. Supported `format`: `currency`, `number`, `percent`, `date`, or omit for raw value.

---

## Step 4: Tabulator Configuration DSL

If your dashboard includes `<rb-tabulator>` components, provide the Groovy DSL configuration for each. **Always use the named form** `tabulator('componentId') { ... }`.

```groovy
/*
 Tabulator Groovy DSL — minimal wrapper over tabulator.info API
 Docs: https://tabulator.info/docs/6.3
*/

tabulator {
  layout "fitColumns"
  height "400px"
  renderVertical "virtual"

  columns {
    column { title "Name"; field "name"; sorter "string"; headerFilter "input" }
    column { title "Age"; field "age"; hozAlign "right"; sorter "number" }
    column { title "Amount"; field "amount"; formatter "money"; width 120 }
  }
}
```

"""
            + AiPromptConstants.MULTI_COMPONENT_NOTE
            + """

---

## Step 5: Chart Configuration DSL

If your dashboard includes `<rb-chart>` components, provide the Groovy DSL configuration for each. **Always use the named form** `chart('componentId') { ... }`.

```groovy
/*
 Chart Groovy DSL - aligned 1:1 with Chart.js
 Docs: https://www.chartjs.org/docs/latest/configuration/
*/

chart {
  type 'bar'
  data {
    labelField 'region'
    datasets {
      dataset { field 'revenue'; label 'Revenue'; backgroundColor 'rgba(78, 121, 167, 0.5)'; borderColor '#4e79a7' }
    }
  }
  options {
    responsive true
    plugins { title { display true; text 'Sales by Region' }; legend { position 'bottom' } }
    scales { y { beginAtZero true } }
  }
}
```

"""
            + AiPromptConstants.MULTI_COMPONENT_NOTE
            + """

---

## Step 6: Pivot Table Configuration DSL

If your dashboard includes `<rb-pivot-table>` components, provide the Groovy DSL configuration for each. **Always use the named form** `pivotTable('componentId') { ... }`.

```groovy
/*
 Pivot Table Groovy DSL
 Docs: https://datapallas.com/docs/bi-analytics/web-components/pivottables
*/

pivotTable {
  rows 'region', 'country'
  cols 'year'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
}
```

"""
            + AiPromptConstants.MULTI_COMPONENT_NOTE
            + """

---

# Reference Documentation
- Data Tables: https://datapallas.com/docs/bi-analytics/web-components/datatables
- Charts: https://datapallas.com/docs/bi-analytics/web-components/charts
- Pivot Tables: https://datapallas.com/docs/bi-analytics/web-components/pivottables
- Multi-Component Dashboards: https://datapallas.com/docs/bi-analytics/performance-real-time

Provide all steps with complete, production-ready code based on the cube semantic models provided."""
        );
    }
}
