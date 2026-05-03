# Dashboards Skill

I help users build **interactive BI dashboards** in DataPallas — combinations of KPI cards, charts, pivot tables, data tables, and filters that give stakeholders a real-time, always-up-to-date view of the business.

> **The full official guide is at https://www.reportburster.com/docs/bi-analytics/dashboards.** This SKILL.md captures the essence — the two paths, the building blocks, the data-script pattern. For the complete walkthrough with screenshots, copy-paste-ready code, and the working Northwind sample, fetch the docs.

---

## The Two Paths (Equivalent — Pick by Style)

DataPallas offers two ways to build a dashboard. **Both produce identical files on disk** (a data script, an HTML template, per-component configurations). Neither is "better" — choose by workflow preference.

### Approach 1 — Build on the Data Canvas (visual-first)

Top menu → **Processing** → **Explore Data & Build Dashboards** tab → **Start** → **Launch** → drop cubes/tables on the canvas → configure widgets visually → click **Publish Dashboard**.

The canvas auto-exports the data script, HTML template, and per-component configs.

**Best when:** the user is exploring or prototyping. Drop, tick, drag, render — see the dashboard take shape before committing. Most users start here.

### Approach 2 — Fully Configure (script-first)

Top menu → **Configuration → Reports, Connections & Cubes** → **+ Create** a Report → fill the **DataSource**, **Parameters**, **Output Template**, **Tabulator**, **Chart**, **Pivot Table** tabs by hand (or via **Hey AI, Help Me with…** buttons).

**Best when:** the user wants full HTML/CSS layout control from the start, or when the dashboard's logic is complex enough that writing/AI-generating it once beats configuring widget-by-widget.

### A practical strategy

Start on the **Canvas** — explore visually, publish a working prototype in minutes. Then go check the exported configurations and fine-tune the scripts, layout, and component configs until the dashboard is exactly right. Best of both worlds.

---

## The Building Blocks (Web Components)

Every DataPallas dashboard is assembled from these `rb-*` web components:

| Component                                                                                  | What it renders                                  | Dashboard use                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------ |
| `<rb-parameters>` ([docs](/docs/bi-analytics/web-components/parameters))                   | Date pickers, dropdowns, filters                 | Dashboard-wide filters (date range, country, department)     |
| `<rb-value>`                                                                               | A single scalar (number, text, date)             | KPI cards (revenue, count, avg, %)                           |
| `<rb-trend>`                                                                               | Sparkline + period-over-period delta             | "Last month vs prior" headlines                              |
| `<rb-chart>` ([docs](/docs/bi-analytics/web-components/charts))                            | Bar / line / pie / doughnut / area / scatter     | Trends, distributions, comparisons                           |
| `<rb-tabulator>` ([docs](/docs/bi-analytics/web-components/datatables))                    | Interactive data grid (sort/filter/paginate)     | Top-N tables, transaction lists, drill-down views            |
| `<rb-pivot-table>` ([docs](/docs/bi-analytics/web-components/pivottables))                 | Drag-and-drop multi-dimensional crosstab         | Revenue breakdowns, ad-hoc exploration                       |
| `<rb-report>` ([docs](/docs/bi-analytics/web-components/reports))                          | Complete report viewer wrapping all of the above | Full self-contained report pages                             |

Each one connects to your data through DataPallas's backend. Mix and match on a single page.

---

## The Data Script Pattern (the one piece every dashboard has)

The data script is the heart of any DataPallas dashboard. It runs server-side, fetches data once per component, and pushes it back to the matching `rb-*` element via `ctx.reportData()`.

```groovy
import groovy.sql.Sql

def dbSql = ctx.dbSql
def componentId = ctx.variables?.get('componentId')

// Get parameter values (ctx.token may be null during data fetch — fallback to '')
def userVars = ctx.variables.getUserVariables(ctx.token ?: '')
def country = userVars?.get('country')?.toString()
def filterByCountry = country && country != '-- All --' && country.trim() != ''

// Component: KPI block — 1 query returns all 4 KPIs as columns of one row
if (!componentId || componentId == 'atomicValues') {
    def sql = """
        SELECT
            ROUND(SUM(od.UnitPrice * od.Quantity), 0) AS revenue,
            COUNT(DISTINCT o.OrderID)                  AS orders,
            ROUND(SUM(od.UnitPrice * od.Quantity)
                / COUNT(DISTINCT o.OrderID), 0)        AS avgOrderValue,
            COUNT(DISTINCT o.CustomerID)               AS customers
        FROM Orders o
        JOIN "Order Details" od ON o.OrderID = od.OrderID
    """
    if (filterByCountry) sql += " WHERE o.ShipCountry = '${country}'"
    ctx.reportData('atomicValues', dbSql.rows(sql))
}

// Component: Chart — monthly revenue trend
if (!componentId || componentId == 'revenueTrend') {
    // ... another query, ctx.reportData('revenueTrend', data)
}

// One block per component (chart, tabulator, pivot, ...)
```

### The non-negotiable patterns

| Pattern                                                              | Why it matters                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `if (!componentId || componentId == 'X')` guard around each block    | When one widget refreshes (parameter change, manual reload), only its query runs — not the whole dashboard. The `!componentId` half handles the initial full-load case. |
| `ctx.reportData('id', rows)` push                                    | The `id` here MUST match `component-id="id"` on the HTML element AND `tabulator('id')` / `chart('id')` / `pivotTable('id')` in the per-component config. |
| `ctx.variables.getUserVariables(ctx.token ?: '')` for params         | `ctx.token` is null during data-fetch. Always use the `?: ''` fallback or you get a NullPointerException. |
| `dbSql.rows(sql)` returns `List<Map<String, Object>>`                | Each row is a map with column aliases as keys. The component reads keys via `field` attribute. |
| Date handling is DB-specific                                          | SQLite: `STRFTIME('%Y-%m', col / 1000, 'unixepoch')` because Hibernate persists dates as epoch milliseconds. PostgreSQL: `TO_CHAR(col, 'YYYY-MM')`. SQL Server: `FORMAT(col, 'yyyy-MM')`. **I always check the connection type first.** |

---

## The Multi-Component Optimization (KPI Cards Sharing One Fetch)

Multiple `<rb-value>` elements with the **same** `component-id` make **one HTTP request**. The result is cached client-side and each element picks its column via `field`:

```html
<!-- 1 SQL query → 1 HTTP request → 4 KPI cards rendered -->
<rb-value component-id="atomicValues" field="revenue"       format="currency"></rb-value>
<rb-value component-id="atomicValues" field="orders"        format="number"></rb-value>
<rb-value component-id="atomicValues" field="avgOrderValue" format="currency"></rb-value>
<rb-value component-id="atomicValues" field="customers"     format="number"></rb-value>
```

The matching script block returns all four as columns of a single row:

```groovy
SELECT
    ROUND(SUM(...), 0) AS revenue,
    COUNT(DISTINCT ...) AS orders,
    ROUND(SUM(...) / COUNT(...), 0) AS avgOrderValue,
    COUNT(DISTINCT ...) AS customers
```

Forget this pattern and you make 4 requests instead of 1. **Always group atomic values that share a base query.**

---

## `<rb-value>` Format Modes

| `format`     | Example output    |
| ------------ | ----------------- |
| `currency`   | `$58,153`         |
| `number`     | `1,234`           |
| `percent`    | `73%`             |
| `date`       | `Mar 15, 2024`    |
| (omit)       | raw value         |

If the script returns a fraction like `0.36` and you want `36%` rendered, use `format="percent"` — DataPallas applies the formatting client-side.

---

## Per-Component Configurations (the small DSL files)

Each component has its own configuration tab in the Report editor. Three you'll see most often:

### Tabulator (`tabulator('topCustomers') { ... }`)

```groovy
tabulator('topCustomers') {
  layout "fitColumns"
  columns {
    column { title "Company"; field "company"; headerFilter "input"; widthGrow 2 }
    column { title "Country"; field "country"; headerFilter "list" }
    column { title "Revenue"; field "revenue"; hozAlign "right"; sorter "number"
             formatter "money"; formatterParams([thousand: ',', symbol: '$', precision: 2]) }
  }
}
```

### Chart (`chart('revenueTrend') { ... }`)

```groovy
chart('revenueTrend') {
  type 'line'                              // or 'bar', 'doughnut', 'area', 'pie', 'scatter'
  data {
    labelField 'month'                     // x-axis values
    datasets {
      dataset {
        field 'revenue'                    // y-axis values
        label 'Revenue'
        borderColor '#0f766e'
        backgroundColor 'rgba(15,118,110,0.1)'
        fill true
        tension 0.3
      }
    }
  }
  options {
    plugins { legend { display false } }
    scales {
      y { beginAtZero true; title { display true; text 'Revenue ($)' } }
      x { title { display true; text 'Month' } }
    }
  }
}
```

### Pivot Table (`pivotTable('orderExplorer') { ... }`)

```groovy
pivotTable('orderExplorer') {
  rows 'country'
  cols 'year'
  vals 'revenue'
  aggregatorName 'Sum'                     // Sum, Count, Average, Min, Max, ...
  rendererName 'Table Heatmap'             // Table, Table Heatmap, Bar Chart, Line Chart, ...
  rowOrder 'value_z_to_a'
}
```

The ID in the function call (`tabulator('topCustomers')`, `chart('revenueTrend')`, etc.) MUST match `component-id="..."` in the HTML and `ctx.reportData('...', data)` in the script.

---

## Parameters (Dashboard-Wide Filters)

`<rb-parameters>` renders dropdowns/date-pickers at the top of the dashboard. Configured via Groovy in the Parameters tab:

```groovy
reportParameters {
    parameter(
        id: 'country',
        type: String,
        label: 'Country',
        defaultValue: '-- All --'
    ) {
        constraints(required: false)
        ui(
            control: 'select',
            options: "SELECT '-- All --' AS country UNION ALL SELECT DISTINCT ShipCountry FROM Orders WHERE ShipCountry IS NOT NULL ORDER BY 1"
        )
    }
}
```

When the user changes a parameter, every component refreshes — that's where the `componentId` guard in the data script earns its keep.

---

## Publishing & Sharing

Whichever path the dashboard was built through (Canvas or Fully Configure), the result is identical:

- A **shareable URL** the dashboard gets automatically
- Embeddable in any external page via the `<rb-dashboard>` web component (see the Usage tab on the report)
- Available as `${dashboard_url}` in scheduled email templates → combined with DataPallas's scheduling, recipients get a fresh link daily/weekly/monthly that opens the live dashboard

---

## The Bundled Northwind Sales Dashboard (Working Reference)

DataPallas ships with a complete working dashboard the user can study and adapt:

- **In the UI**: Top menu → **Processing** → left menu → **Samples - Try All** → click **Try It** on **Sales Dashboard**.
- **On disk**: `/datapallas/config/samples/_frend/dashboard-cfo/` — full data script, HTML template, Tabulator/Chart/Pivot configs, Parameters config.

This sample combines: 4 KPI cards (`atomicValues`), a line chart (`revenueTrend`), a doughnut chart (`revenueByCategory`), a top-10 customer tabulator (`topCustomers`), a heatmap pivot (`orderExplorer`), and a country `<rb-parameters>` filter. **I read it before advising on dashboard work** — it's the canonical pattern.

---

## How I Use This Knowledge

When the user wants to build a dashboard:

1. **Ask which path fits the user's mood.** Exploring? → Canvas (Approach 1). Already know the layout? → Fully Configure (Approach 2). Most users should start on the Canvas.
2. **For Canvas-driven work**, I cross-reference the `datapallas-data-exploration` skill — that's where the canvas details live. After Publish, the script/template/configs land in a Report folder for fine-tuning.
3. **For Fully Configure work**, I walk through the seven-step recipe (DataSource → Parameters → Template → Tabulator → Chart → Pivot → View) using the bundled Northwind dashboard as the reference.
4. **For data-script questions** (componentId guards, parameter access, multi-component optimization), I use the patterns from this SKILL.md and the bundled `dashboard-cfo` sample.
5. **For component-level config** (Tabulator columns, Chart options, Pivot setup), I fetch the relevant web-component doc:
   - https://www.reportburster.com/docs/bi-analytics/web-components/datatables
   - https://www.reportburster.com/docs/bi-analytics/web-components/charts
   - https://www.reportburster.com/docs/bi-analytics/web-components/pivottables
   - https://www.reportburster.com/docs/bi-analytics/web-components/parameters
6. **For performance** (caching, real-time, large datasets), I fetch:
   - https://www.reportburster.com/docs/bi-analytics/performance-real-time
   - https://www.reportburster.com/docs/bi-analytics/data-warehouse-olap

---

## "Hey AI, Help Me with…" — Always

The user is **never expected to write data scripts, templates, or component configs by hand**. Everywhere a Groovy script or HTML template is needed, DataPallas places a **Hey AI, Help Me with…** button right next to the editor. The AI drafts against the live schema; the user runs and tweaks.

When advising, I lean on this hard: instead of giving the user 50 lines of Groovy, I tell them *"click Hey AI, Help Me with… above the script editor and describe what you want — it drafts the code against your live schema."* I provide snippets when needed for clarity, but the AI button is the recommended path.

---

## My Working Mode (Read-Only)

I read the Northwind sample dashboard, the docs, and the user's existing report configs to understand patterns. I **don't modify dashboard files directly** — I provide the data-script block, HTML snippet, or component-config DSL, and tell the user exactly which tab to paste it into.

When I provide a snippet, I:

1. Explain what it does (KPI block, trend chart, pivot heatmap)
2. Give the complete code to paste
3. Tell the user which tab/file (DataSource / Parameters / Output Template / Tabulator / Chart / Pivot Table)
4. Mention `Hey AI, Help Me with…` as the lower-effort path

---

## Documentation Links

- **Dashboards (full walkthrough)**: https://www.reportburster.com/docs/bi-analytics/dashboards
- **Data Warehouse & OLAP** (DuckDB / ClickHouse for scale): https://www.reportburster.com/docs/bi-analytics/data-warehouse-olap
- **Web Components Overview**: https://www.reportburster.com/docs/bi-analytics/web-components
  - rb-tabulator: https://www.reportburster.com/docs/bi-analytics/web-components/datatables
  - rb-chart: https://www.reportburster.com/docs/bi-analytics/web-components/charts
  - rb-pivot-table: https://www.reportburster.com/docs/bi-analytics/web-components/pivottables
  - rb-parameters: https://www.reportburster.com/docs/bi-analytics/web-components/parameters
  - rb-report: https://www.reportburster.com/docs/bi-analytics/web-components/reports
- **Performance & Real-Time**: https://www.reportburster.com/docs/bi-analytics/performance-real-time
- **Canvas (Approach 1's home)**: https://www.reportburster.com/docs/data-exploration/canvas
- **Cubes (data source for canvas-built dashboards)**: https://www.reportburster.com/docs/semantic-layer
- **Variables (e.g. `${dashboard_url}`)**: https://www.reportburster.com/docs/variables

When the user asks about a specific component option, performance technique, or feature I'm not certain about — **I fetch the relevant doc above** and answer from the live source.

---

## My Principle

> **The two paths are equivalent.** Whichever route the user takes — Canvas or Fully Configure — the same files land on disk and the same dashboard ships. I never sell one path as superior. I match the path to the user's current intent: explore vs. control. And I always lean on **Hey AI, Help Me with…** to do the heavy lifting on scripts and templates.
