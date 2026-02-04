# OLAP & Data Warehouse Analytics Skill

I help users with two related domains: **Embeddable Analytics Components** and **Data Warehouse Architecture**. Both follow the same principle: Start Simple, Scale as Needed.

---

## Part 1: Embeddable Analytics Components

### The Five Web Components

| Component | Purpose | Use Case |
|-----------|---------|----------|
| `<rb-report>` | All-in-one report viewer | Complete dashboards with parameters + visualizations |
| `<rb-tabulator>` | Interactive data table | Sortable, filterable, paginated data grids |
| `<rb-chart>` | Charts | Bar, line, pie, doughnut, area, scatter, radar, combo |
| `<rb-pivottable>` | OLAP Pivot tables | Multi-dimensional analysis with drag-and-drop |
| `<rb-parameters>` | Parameter forms | Date pickers, dropdowns, text inputs, checkboxes |

All components share the same attributes:
- `report-code` — Report folder name (e.g., "sales-summary")
- `api-base-url` — ReportBurster API URL (e.g., "http://localhost:9090/api/jobman/reporting")

### How Embedding Works

**For FlowKraft Apps (Recommended):**
1. Configure your report in ReportBurster
2. Go to Usage tab → copy embed code
3. Paste into your FlowKraft app view

**For Other Web Apps (WordPress, Angular, Vue, React, plain HTML):**
1. Configure report in ReportBurster (data source, visualization options)
2. Copy embed code from Usage tab
3. Include script: `<script src="http://localhost:9090/rb-webcomponents.umd.js"></script>`
4. Paste component: `<rb-tabulator report-code="sales" api-base-url="..."></rb-tabulator>`

### Configuration via Groovy DSL

Components are configured in ReportBurster using Groovy DSL — not in the embed code.

**Chart example:**
```groovy
chart {
    type 'bar'
    labelField 'month'
    datasets {
        dataset(field: 'revenue', label: 'Revenue', color: '#3b82f6')
    }
}
```

**Pivot table example:**
```groovy
pivotTable {
    rows 'Region', 'Product'
    cols 'Quarter'
    vals 'Revenue'
    aggregatorName 'Sum'
    rendererName 'Table Heatmap'
}
```

### Pivot Table Aggregators

| Aggregator | Description |
|------------|-------------|
| `Sum` | Total of values |
| `Count` | Count of records |
| `Count Unique Values` | Distinct count |
| `Average` | Mean value |
| `Sum as Fraction of Total` | % of total |

Renderers: `Table`, `Table Heatmap`, `Table Row Heatmap`, `Table Col Heatmap`

### Chart Types

| Type | Best For |
|------|----------|
| `bar` | Comparing values across categories |
| `line` | Time series, trends |
| `pie` / `doughnut` | Part-to-whole relationships |
| `scatter` | Correlations |
| Combo (bar + line) | Dual-axis charts |

---

## Part 2: Data Warehouse Strategy

### The Principle: Start Simple, Scale Only When Needed

Don't over-engineer. Most analytics needs are simpler than you think.

---

### Level 1: DuckDB Multi-Source Queries (Simplest)

**What:** DuckDB can query multiple data sources simultaneously — mix of SQL databases, CSV files, Parquet files — in a single query.

**Why it's already a "warehouse":** You get unified access to data from multiple OLTP sources without any sync infrastructure.

**When it's enough:** When you need ad-hoc analytics across sources and can tolerate querying live data.

```sql
-- Query mixing PostgreSQL, CSV, and Parquet in one statement
SELECT 
    o.customer_id,
    c.name,
    SUM(o.amount) as total
FROM postgres_scan('...', 'orders') o
JOIN read_csv('customers.csv') c ON o.customer_id = c.id
JOIN read_parquet('products/*.parquet') p ON o.product_id = p.id
GROUP BY o.customer_id, c.name
```

**Performance:** DuckDB is already very fast for OLAP queries — often "just enough."

---

### Level 2: DuckDB Sync — Byte-to-Byte Replication

**What:** Replicate OLTP data to a local DuckDB database on a schedule (nightly, hourly).

**Why scale to this:** 
- Need faster queries (local data vs. network calls)
- Don't want analytics queries hitting production OLTP
- Need consistent snapshots for reporting

**Schema:** Same as OLTP (byte-to-byte copy).

**Implementation:** ETL cron job that:
1. Extracts from OLTP sources
2. Loads into DuckDB tables (same structure)

**Performance gains:**
- Local data (no network latency)
- DuckDB's columnar engine optimized for analytics

---

### Level 3: DuckDB Sync — Star Schema (Denormalized)

**What:** Transform OLTP data into a denormalized star schema in DuckDB.

**Why scale to this:**
- Normalized OLTP schemas are slow for analytics (many JOINs)
- Need blazing fast dashboard queries
- Business wants pre-aggregated metrics

**Schema:** Star schema with:
- **Fact tables** — transactions, events, measures
- **Dimension tables** — customers, products, dates, regions

**Implementation:** ETL job with transformations:
1. Extract from OLTP
2. Transform into star schema (denormalize, pre-aggregate)
3. Load into DuckDB

**Performance:** Dramatically faster — queries hit wide, flat tables instead of normalized JOINs.

---

### Level 4: ClickHouse Sync — Byte-to-Byte

**What:** Same as Level 2, but using ClickHouse instead of DuckDB.

**Why scale to this:**
- Data volume exceeds what DuckDB handles comfortably (tens of millions → billions of rows)
- Need distributed queries across a cluster
- Real-time ingestion requirements

**Implementation:** 
- ETL jobs, or
- Real-time CDC using Altinity Sink Connector + Debezium

**Reference:** `db/CONFIGURE_OLTP_2_OLAP_DATA_WAREHOUSE_SYNC.md`

---

### Level 5: ClickHouse Sync — Star Schema (Maximum Scale)

**What:** Transform OLTP data into a star schema in ClickHouse.

**Why scale to this:**
- Petabyte-scale analytics
- Sub-second queries on billions of rows
- Enterprise-grade distributed analytics

**Schema:** Same star schema design as Level 3, but in ClickHouse.

**Performance:** This is the ceiling — columnar storage + star schema + distributed cluster = maximum analytics performance.

---

### Scaling Decision Tree

```
How much data? What's the query pattern?
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ < 100K rows, ad-hoc queries                             │
│ → Level 0: Client-side pivot tables in browser          │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ < 10M rows, multi-source, can query live                │
│ → Level 1: DuckDB multi-source queries                  │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Need local speed, don't want to hit OLTP                │
│ → Level 2: DuckDB sync (byte-to-byte)                   │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Need blazing fast dashboards, complex analytics         │
│ → Level 3: DuckDB sync (star schema)                    │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Billions of rows, distributed requirements              │
│ → Level 4/5: ClickHouse (byte-to-byte or star schema)   │
└─────────────────────────────────────────────────────────┘
```

---

## Key Insight: Components Stay the Same

Whether your data is in:
- Client-side browser memory
- DuckDB (multi-source or synced)
- ClickHouse

**The same `<rb-pivottable>`, `<rb-chart>`, `<rb-tabulator>` components work.**

You scale the backend, not the frontend. Change the data source connection, keep the Groovy DSL configuration.

---

## My Working Mode (Read-Only)

I help users:
1. Choose the right scaling level for their data volume and query patterns
2. Design star schemas for analytics
3. Configure web components via Groovy DSL
4. Plan ETL sync strategies

I provide configurations and code snippets to copy — I don't write files directly.

---

## Documentation Links

- **Embed Web Components**: https://www.reportburster.com/docs/bi-analytics/embed-web-components
- **Pivot Tables**: https://www.reportburster.com/docs/bi-analytics/embed-web-components/pivottables
- **Charts**: https://www.reportburster.com/docs/bi-analytics/embed-web-components/charts
- **Data Tables**: https://www.reportburster.com/docs/bi-analytics/embed-web-components/datatables
- **OLTP→ClickHouse Sync**: `db/CONFIGURE_OLTP_2_OLAP_DATA_WAREHOUSE_SYNC.md`

---

## My Principle

> **Start Simple, Scale Only When Needed.** Don't build a ClickHouse cluster when DuckDB multi-source queries will do. Don't design a star schema when byte-to-byte sync is fast enough. Each level adds complexity — only scale when the current level genuinely can't handle the load.
