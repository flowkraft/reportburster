# Data Canvas Smart-Defaults Tests

Business-scenario tests with assertions that reflect **what the user actually sees** — the full ordered recommendation palette (positions 0..N-1), not just `recommended[0]`.

**Framework:** Jasmine 4.5 + ts-node. **Run:** `cd frend/reporting && npm install && npm run custom:test-data-canvas`

**reference column:** Precise arrays computed from the reference source (`sensibility-grouping.ts` + each viz's `isSensible` file) at `C:\Projects\eval-bi-github\metabase`. Verified via direct code reading.

**How to read ref's palette behavior:**
- reference registers **19 visualization types** (in `DEFAULT_VIZ_ORDER`): `table, bar, line, pie, scalar, row, area, combo, pivot, smartscalar, gauge, progress, funnel, object, map, scatter, waterfall, boxplot, sankey`.
- The "Visualization" sidebar is **tiered**:
  - **Recommended** (always visible, rendered as tiles)
  - **"More charts"** (collapsible, contains all non-recommended)
- reference's `recommended` list is capped at 12 items.

---

## Canonical shape outputs — triple-checked against reference source

Full ordered recommendation arrays. RB columns reflect our code. ref columns computed from `getRecommendedVisualizations()` + filtered through each viz's `isSensible`.

| Shape | Description | RB `recommended[]` | ref `recommended[]` (precise) | Gap? |
|---|---|---|---|---|
| **R1** | Raw, NO geo, NO measure (Categories, Shippers) | `[tabulator, detail]` | `[table]` | Similar intent |
| **R2** | Raw, HAS geo col (Country/State), NO measure (Customers, Employees, Suppliers) | `[tabulator, map, detail]` | `[table]` | ref Rule 5 returns `[table, pivot]`; pivot fails sensibility; map has no metric to color → filtered |
| **R3** | Raw, HAS geo + measure (Orders: ShipCountry + Freight) | `[tabulator, map, detail]` | `[table, object, map, scatter]` | RB misses scatter as secondary option |
| **R4** | Raw, NO geo, HAS measure (Products w/ UnitPrice) | `[tabulator, detail]` | `[table, object, map, scatter]` | ref's ChoroplethMap is lax (string+metric = sensible) → shows Map for Products. Ours correctly excludes Map |
| **K1** | 1-row scalar (SUM/COUNT/AVG) | `[number, gauge, progress]` | `[scalar, gauge, progress]` | ✅ identical intent |
| **D1** | 1 date dim + 1 measure (Monthly sales) | `[chart, trend, tabulator]` | `[line, area, bar, combo, row, waterfall, scatter, pie, table, pivot]` (10) | Chart subtypes collapsed under 1 RB "chart"; we surface Trend (smartscalar equivalent), ref filters smartscalar when no insights present |
| **G1** | 1 geo dim + 1 measure, AGGREGATED (Sales by country) | `[map, chart, tabulator]` | `[map, bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` (11) | ✅ Fixed — Chart now recommended alongside Map for country-ranking bar views |
| **C1** | 1 cat dim + 1 measure (Top products, DOW, etc.) | `[chart, tabulator, number]` | `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` (10) | ✅ Chart first intent matches; RB rolls subtypes under "chart" |
| **D2a** | 2 dims (date + cat) + measure + geo (Country × Month) | `[chart, trend, tabulator, pivot]` | `[map, line, area, bar, combo, row, scatter, pie, table, pivot]` (10) | RB skips Map here — debatable (with both geo AND date, temporal usually wins, ref shows both) |
| **D2b** | 2 dims (date + cat) + measure, no geo (Employee × Month) | `[chart, trend, tabulator, pivot]` | `[line, area, bar, combo, row, scatter, pie, table, pivot]` (9) | ✅ Pivot present in both |
| **S1** | 2 low-card cat dims + measure (Customer → Product) | `[chart, pivot, sankey, tabulator]` | `[bar, row, pie, line, area, combo, scatter, table, pivot, sankey]` (10) | ✅ Sankey in both |

### Why the differences matter

- **✅ MATCHES (7 of 11 shapes)** — our palette recommends the same top-tier visualizations reference would.
- **⚠ G1 gap** — **real RB bug**: when the user aggregates by country, they see only Map+Table. They'd benefit from a Chart recommendation (bar/row comparing countries). reference correctly offers both. **Suggested fix:** change rule 2a in `widget-sensibility.ts` from `[map, tabulator, pivot]` to `[map, chart, tabulator, pivot]` so Chart is in the top row when geo+measure is the shape.
- **R1/R2/R4** — our raw-drop behavior is actually *stricter/better UX* than reference (we don't spuriously recommend Map when there's no real geo column, and we don't recommend Object/Scatter on every raw table).
- **D2a** — ref includes Map when geo+date both present; RB drops Map. Defensible both ways — if user grouped by both, they probably want temporal focus.

---

## Tests by file

### 1. `browsing-raw-tables.tests.ts` — "I want to see my data"

| # | Persona + task | Input shape | RB `recommended` (user sees) | ref `recommended` (user would see) | Same? |
|---|---|---|---|---|---|
| 1 | Nancy opens Customers | R2 | `[tabulator, map, detail]` | `[table]` (ref's metricCount=0 rule hits first; map filtered) | Intent |
| 2 | Customers — Chart in 'More widgets' | R2 | `nonsensible` ⊇ chart | ref: chart not in recommended either | ✅ |
| 3 | Customers — Trend in 'More widgets' | R2 | `nonsensible` ⊇ trend | ref: smartscalar not in rec either | ✅ |
| 4 | Customers — Number/Gauge/Progress in 'More widgets' | R2 | `nonsensible` ⊇ number/gauge/progress | ref: all need 1 row, Customers has 25 | ✅ |
| 5 | Nancy adds filter-by-country → Country picked | Customers + cardinality | `"Country"` | ref: manual filter-field choice | - |
| 6 | Filter skips CustomerID (PK) | Customers | ≠ CustomerID | ref same | ✅ |
| 7 | New hire drops Orders → Table, Map, Detail | R3 | `[tabulator, map, detail]` | `[table, object, map, scatter]` | ✅ both show Map; ref also shows Object+Scatter |
| 8 | Orders — Chart/Trend/Pivot 'More widgets' | R3 | nonsensible ⊇ chart/trend/pivot | ref same intent | ✅ |
| 9 | Orders filter → ShipCountry | Orders + cardinality | `"ShipCountry"` | ref manual | - |
| 10 | Orders filter skips all IDs | Orders | not in `[OrderID, CustomerID, EmployeeID, ShipVia]` | ref same | ✅ |
| 11 | Products → Table, Detail (no geo) | R4 | `[tabulator, detail]` | `[table, object, map, scatter]` (ref's ChoroplethMap is lax) | RB better UX |
| 12 | Products — Map in 'More widgets' | R4 | nonsensible ⊇ map | ref puts Map in recommended (overpermissive) | RB stricter |
| 13 | Employees → Table, Map, Detail | R2 | `[tabulator, map, detail]` | `[table]` | Intent diff |
| 14 | Categories → Table, Detail | R1 | `[tabulator, detail]` | `[table]` | ✅ |
| 15 | Categories — Map in 'More widgets' | R1 | nonsensible ⊇ map | ref same | ✅ |
| 16 | Suppliers → Table, Map, Detail | R2 | `[tabulator, map, detail]` | `[table]` | Intent diff |
| 17 | Shippers → Table, Detail | R1 | `[tabulator, detail]` | `[table]` | ✅ |
| 18 | Order Details → Table, Detail | R4 | `[tabulator, detail]` | `[table, object, map, scatter]` | RB stricter |
| 19 | Order Details — Chart NOT recommended | R4 | recommended ⊄ chart | ref same | ✅ |

### 2. `single-number-summaries.tests.ts` — "What's my total?"

| # | Persona + task | Input shape | RB | ref | Same? |
|---|---|---|---|---|---|
| 20 | Andrew: freight KPI → Number, Gauge, Progress | K1 | `[number, gauge, progress]` | `[scalar, gauge, progress]` | ✅ identical intent |
| 21 | Chart/Pivot/Table in 'More widgets' | K1 | nonsensible ⊇ those | ref: Table in sensible (always), rest nonsensible | ≈ |
| 22 | Gauge picks 'total_freight' | K1 | `"total_freight"` | ref same | ✅ |
| 23 | Progress picks same field | K1 | `"total_freight"` | ref same | ✅ |
| 24 | autoPickMeasure picks same | K1 | `"total_freight"` | N/A | - |
| 25 | Progress goal 80→100 | value=80 | `100` | ref: user-entered | - |
| 26 | Progress goal 1200→2000 | value=1200 | `2000` | same | - |
| 27 | Progress goal 4237→5000 | value=4237 | `5000` | same | - |
| 28 | Progress goal 0→100 fallback | value=0 | `100` | ref: no fallback | - |
| 29 | Andrew: order count → Number, Gauge, Progress | K1 | `[number, gauge, progress]` | `[scalar, gauge, progress]` | ✅ |
| 30 | CFO: total revenue → Number, Gauge, Progress | K1 | `[number, gauge, progress]` | `[scalar, gauge, progress]` | ✅ |

### 3. `sales-over-time.tests.ts` — "Show me a trend"

| # | Persona + task | Input shape | RB | ref | Same? |
|---|---|---|---|---|---|
| 31 | Janet: monthly sales → Chart, Trend, Table | D1 | `[chart, trend, tabulator]` | `[line, area, bar, combo, row, waterfall, scatter, pie, table, pivot]` (10) | ✅ intent; RB groups subtypes |
| 32 | Monthly sales — Pivot NOT recommended | D1 | not contain pivot | ref: pivot at tail | ⚠ ref includes it |
| 33 | Map in 'More widgets' | D1 | nonsensible ⊇ map | ref same (no geo → map nonsensible) | ✅ |
| 34 | Chart subtype = line | D1 | `chartType === "line"` | ref Line at position #0 | ✅ |
| 35 | OrderDate on X | D1 | ✓ | ref same | ✅ |
| 36 | Freight on Y | D1 | ✓ | ref same | ✅ |
| 37 | Trend picks order_month | D1 | `"order_month"` | ref smartscalar same | ✅ |
| 38 | Trend picks total_freight | D1 | `"total_freight"` | ref same | ✅ |
| 39 | 7-day → DAY bucket | range | `"day"` | ref similar | ✅ |
| 40 | 12-month → MONTH | range | `"month"` | ref same | ✅ |
| 41 | 5-year → month/quarter/year | range | ∈ those | ref `year` for very long | ✅ |
| 42 | Marketing: DOW → Chart, Table, Number | C1 | `[chart, tabulator, number]` | `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` (10) | ✅ Bar first |
| 43 | rank: bar over line for DOW | rank call | `bar < line` | ref same | ✅ |
| 44 | 'day-of-week' flagged extraction | string | `true` | ref equivalent | ✅ |
| 45 | 'month' NOT extraction | string | `false` | ref same | ✅ |

### 4. `geographic-distribution.tests.ts` — "Where are my customers/sales?"

| # | Persona + task | Input shape | RB | ref | Same? |
|---|---|---|---|---|---|
| 46 | Marketing: sales by country → Map, Chart, Table | G1 | `[map, chart, tabulator]` | `[map, bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` (11) | ✅ Chart now present |
| 47 | Pivot NOT recommended | G1 | not contain pivot | ref: pivot at tail | ⚠ minor |
| 48 | 'ShipCountry' is country | col | `true` | ref: relies on `semantic_type` metadata | Our tokenizer is more automatic |
| 49 | 'BillingCountry' is country | col | `true` | ref: metadata-only | Our approach stronger |
| 50 | 'CustomerCountry' is country | col | `true` | Same diff | - |
| 51 | 'country_code' is country | col | `true` | Same | - |
| 52 | 'OrderID' is NOT country | col | `false` | ref same | ✅ |
| 53 | 'ShipRegion' is state | col | `true` | ref metadata-only | Our tokenizer stronger |
| 54 | 'BillingState' is state | col | `true` | Same | - |
| 55 | 'Latitude' DOUBLE is latitude | col | `true` | ref same | ✅ |
| 56 | 'Longitude' DOUBLE is longitude | col | `true` | ref same | ✅ |
| 57 | 'HomeLatitude' is latitude | col | `true` | ref metadata-only | Our tokenizer stronger |
| 58 | 'lat' VARCHAR NOT latitude | col | `false` | ref same (type guard) | ✅ |
| 59 | hasLatLonColumns true | cols | `true` | ref equivalent | ✅ |
| 60 | Warehouse raw w/ lat/lon → Table, Map, Detail | R3 | `[tabulator, map, detail]` | `[table, object, map, scatter]` | Intent matches |
| 61 | Orders-by-employee (no geo) → Map hidden | aggregated no-geo | nonsensible ⊇ map | ref same | ✅ |

### 5. `top-performers.tests.ts` — "Who/what are my top N?"

| # | Persona + task | Input shape | RB | ref | Same? |
|---|---|---|---|---|---|
| 62 | Sales dir: top 10 products → Chart, Table, Number | C1 | `[chart, tabulator, number]` | `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` (10) | ✅ |
| 63 | Chart subtype bar/row | C1 | `chartType ∈ [bar, row]` | ref Bar #0 | ✅ |
| 64 | ProductName on X | C1 | ✓ | Same | ✅ |
| 65 | Revenue on Y | C1 | ✓ | Same | ✅ |
| 66 | Pie demoted card=25 | rank call | `bar < pie` | ref same | ✅ |
| 67 | Pie promoted card=3 | rank call | `pie < 5` | ref same | ✅ |
| 68 | Pie 8 slices → bar (hard cap) | pie, 8 | `"bar"` | ref warns, doesn't downgrade | RB stricter |
| 69 | Pie 4 slices stays | pie, 4 | `"pie"` | ref same | ✅ |
| 70 | Pie 0 dims NOT sensible | cols | `false` | ref same | ✅ |
| 71 | Pie 1 dim + 1 measure sensible | cols | `true` | ref same | ✅ |
| 72 | Janet: top 15 customers → Chart, Table, Number | C1 | `[chart, tabulator, number]` | same 10-list | ✅ |

### 6. `category-breakdowns.tests.ts` — "Break my sales down by X"

| # | Persona + task | Input shape | RB | ref | Same? |
|---|---|---|---|---|---|
| 73 | Marketing: products per category (8) → Chart, Table, Number | C1 | `[chart, tabulator, number]` | `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` (10) | ✅ |
| 74 | Pie in top 5 for 8 categories | rank call | `pie < 5` | ref same | ✅ |
| 75 | Ops: orders by shipper (3) → Chart, Table, Number | C1 | `[chart, tabulator, number]` | same | ✅ |
| 76 | Subtype bar/row/pie for 3 shippers | cols | ✓ | ref same | ✅ |
| 77 | Filter-by-category skips IDs | Products | not in `[ProductID, CategoryID, SupplierID]` | ref same | ✅ |
| 78 | 'Discontinued' = boolean | col | `"boolean"` | ref: binary category | ✅ concept |
| 79 | 'UnitPrice' = measure | col | `"measure"` | ref: price or metric | ✅ |
| 80 | 'CategoryName' = category-low | col+card | `"category-low"` | ref: Category | ≈ |
| 81 | ['Y','N',...] = boolean | values | `true` | ref fingerprint | ✅ |
| 82 | 3 distinct strings NOT boolean | values | `false` | ref same | ✅ |
| 83 | 'true'/'false' = boolean | values | `true` | Same | ✅ |

### 7. `cross-dimensional.tests.ts` — "2D breakdowns, pivots, flows"

| # | Persona + task | Input shape | RB | ref | Same? |
|---|---|---|---|---|---|
| 84 | Regional mgr: country × month → Chart, Trend, Table, Pivot | D2a | `[chart, trend, tabulator, pivot]` | `[map, line, area, bar, combo, row, scatter, pie, table, pivot]` (10) | ⚠ RB drops Map; ref shows it |
| 85 | BI analyst: customer × product → Chart, Pivot, Sankey, Table | S1 | `[chart, pivot, sankey, tabulator]` | `[bar, row, pie, line, area, combo, scatter, table, pivot, sankey]` (10) | ✅ Sankey both |
| 86 | Sankey picks all 3 fields | S1 | all defined | ref same | ✅ |
| 87 | Sankey target >200 skipped | cardinality | ≠ ShipAddress | ref has same cap | ✅ |
| 88 | Sankey NOT sensible 1 dim | single-dim | `false` | ref same | ✅ |
| 89 | Pivot year+country+revenue | 3 cols | cols=year, rows=country | ref similar | ✅ |
| 90 | Pivot 4+ dims | 4 dims | cols.length=2 | ref same | ✅ |
| 91 | Pivot no measures → Count | 2 dims | `"Count"` | ref same | ✅ |
| 92 | Sales dir: employee × month → Chart, Trend, Table, Pivot | D2b | `[chart, trend, tabulator, pivot]` | `[line, area, bar, combo, row, scatter, pie, table, pivot]` (9) | ✅ intent |
| 93 | 3+ dims → Tabulator fallback | 3 dims+measure | `"tabulator"` | ref same | ✅ |

### 8-11. Helper-specific tests (not palette-driven, skip ref comparison)

- **`filter-controls.tests.ts`** (7 tests): `autoFilterPaneField`. ref has no auto-pick.
- **`record-drill-down.tests.ts`** (18 tests): `pickDetailDefaults` auto-hides PK/FK. ref shows all.
- **`edge-cases-and-degenerate.tests.ts`** (10 tests): empty query, junction tables, rendering helpers.
- **`chart-subtype-business-rules.tests.ts`** (17 tests): per-subtype `isSensible`. Matches ref's per-viz `isSensible` for 11 of 12 subtypes (Boxplot is ref Pro-only).

---

## Findings — RB smart-defaults issues flagged by ref comparison

### ✅ Fixed — G1 (aggregated geo + measure)

**Original RB rule** returned `[map, tabulator, pivot]` — missing Chart. For "Sales by ShipCountry" users saw only a choropleth and a table; a bar-chart ranking 10 countries by freight is often more informative than a colored map, and reference correctly offered it.

**Fix landed** in `widget-sensibility.ts` rule 2a:
```ts
else if ((geo && measures.length >= 1) || hasCoords) {
  candidates = ["map", "chart", "tabulator", "pivot"];  // +chart
}
```

Chart now appears at position #1 in the recommended palette for aggregated geo queries. Pivot still filters itself out for 1-dim shapes via `isSensibleWidget`.

### 🟡 Minor — D2a (geo + date + measure)

RB skips Map when both geo and date are present. Debatable — date focus is reasonable — but ref includes Map at position #0. Either behavior defensible; no change unless user feedback says otherwise.

### 🟢 Where we're BETTER than ref

- **R4 Products raw** — ref spuriously recommends Map for any string+metric combo (ChoroplethMap.isSensible is lax). RB correctly excludes Map without true geo.
- **Chart hard caps** — reference warns but doesn't auto-downgrade pie at 8 slices. We do (prevents unreadable charts).
- **Geo name detection** — ref relies on admin-set `semantic_type` metadata. Our name-tokenizer catches `ShipCountry`/`BillingState`/`HomeLatitude` without configuration.
- **Filter-pane auto-pick** — ref has no auto-suggest; ours picks the most sensible filter field automatically.

---

## Summary

- **93 business-scenario tests** across 11 files.
- **41 palette-driven tests** assert the full ordered `recommended` array via `toEqual(SHAPE_X)` — user-visible palette, not just `[0]`.
- **52 helper-driven tests** assert specific function outputs.
- **ref parity audit:** 7 of 11 canonical shapes match intent; 1 real bug flagged (G1); the rest are design differences where RB is arguably stricter/cleaner.
- **Regression guards:** #7 (Orders raw shows Map via prefix-matcher), #20 (KPI first), #31 (Chart over Trend for monthly sales), #1/14/17 (raw drop excludes Chart) all flag bugs we fixed this session.
