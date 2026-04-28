# Plan: Fill Jasmine Smart-Defaults Test Gaps

## Context

The alignment report in `data-canvas-smart-defaults.spec.ts` identified that the existing 93 Jasmine tests across 11 files cover the **palette/recommendation** layer well, but have significant gaps in the **axis assignment**, **auto-pick helpers**, **display decisions**, and **sankey auto-pick** functions. These are the "Layer 2" functions that configure default values when a user clicks a widget.

## Metabase Equivalent Mapping

Each RB function below has a Metabase counterpart. Our tests should assert the same behavior MB's tests cover, plus RB-specific nuances.

| RB Function | Metabase Equivalent | MB Location | MB Tests |
|---|---|---|---|
| `pickDefaultAxes()` | `getSingleSeriesDimensionsAndMetrics()` | `visualizations/lib/utils.ts:278-338` | `lib/utils.unit.spec.ts:223-312` |
| `splitDimsAndMeasures()` | `isDimension`/`isMetric` filter split | `visualizations/lib/utils.ts:302-305` | same file |
| `canReuseAxisPicks()` | `getDefaultDimensions()` reuse logic | `shared/settings/cartesian-chart.ts:60-93` | `cartesian-chart.unit.spec.ts:39-83` |
| `autoPickMeasure()` | `isMetric` filter + first match | `visualizations/lib/utils.ts:302` | implicit in cartesian tests |
| `autoPivotLayout()` | No direct MB equivalent | — | — |
| `suggestRenderModeForCube()` | No MB equivalent (cube-specific) | — | — |
| `defaultDisplay()` | `getRecommendedVisualizations()` + `isSensible` cascade | `visualizations/index.ts:30` + each viz `chart-definition.ts` | per-viz `*.unit.spec.ts` |
| `enforceChartTypeLimits()` | No direct MB equivalent (MB doesn't cap pie slices) | — | — |
| `shapeFromResult()` | Column classification in `getSingleSeriesDimensionsAndMetrics()` | `visualizations/lib/utils.ts:297-337` | `utils.unit.spec.ts:223-312` |
| `pickSankeyFields()` | `SankeyChart.isSensible()` + field extraction | `visualizations/SankeyChart/chart-definition.ts:139` | `chart-definition.unit.spec.ts:32-136` |

### Key Metabase Test Patterns to Mirror

**`getDefaultDimensionsAndMetrics`** (MB `utils.unit.spec.ts:223-312`):
- Date-first reorder: when dim[1] is date and dim[0] is not → swap → `dimensions: ["date", "category"]`
- Cardinality-first reorder: lower-card dim goes to position 1 (series), higher to position 0 (axis)
- MAX_SERIES cap: when series dim cardinality > 100 → drop it → only 1 dimension returned

**`cartesian-chart defaults`** (MB `cartesian-chart.unit.spec.ts:39-160`):
- Reuse previous picks when columns still valid
- Fall back to defaults when previous picks reference missing columns
- Scatter branch: 2 numeric columns → X/Y both measures

**`Sankey isSensible`** (MB `chart-definition.unit.spec.ts:32-136`):
- Needs ≥2 dimensions + ≥1 metric
- Fails with only 1 dimension
- Fails with 0 rows
- Fails with all numeric columns (no string dims)

### Existing Coverage (what we have)

| Function | Tests | File |
|---|---|---|
| `groupWidgetsBySensibility()` | ✅ 50+ tests | All 11 files |
| `isSensibleChartSubtype()` | ✅ 17 tests | `chart-subtype-business-rules.tests.ts` |
| `rankChartSubtypes()` | ✅ covered | `chart-subtype-business-rules.tests.ts` |
| `autoFilterPaneField()` | ✅ 7 tests | `filter-controls.tests.ts` |
| `pickGaugeField()` | ✅ 1 test | `single-number-summaries.tests.ts` |
| `pickProgressField()` | ✅ 1 test | `single-number-summaries.tests.ts` |
| `pickProgressGoal()` | ✅ 4 tests | `single-number-summaries.tests.ts` |
| `pickDetailDefaults()` | ✅ 18 tests | `record-drill-down.tests.ts` |
| `pickDefaultAxes()` | ⚠️ 2 tests only | `sales-over-time.tests.ts` (temporal case only) |
| `pickTrendFields()` | ⚠️ 2 tests only | `sales-over-time.tests.ts` (basic case only) |
| `defaultDisplay()` | ⚠️ 1 test only | `sales-over-time.tests.ts` (temporal case only) |
| `shapeFromResult()` | ⚠️ 1 test only | `sales-over-time.tests.ts` (temporal case only) |

### Gap Analysis (what we need)

| Function | Current | Needed | Priority |
|---|---|---|---|
| `pickDefaultAxes()` | 2 tests | ~15 tests | HIGH — core axis logic |
| `splitDimsAndMeasures()` | 0 tests | ~5 tests | HIGH — used everywhere |
| `canReuseAxisPicks()` | 0 tests | ~4 tests | MEDIUM |
| `autoPickMeasure()` | 1 test | ~6 tests | HIGH — foundation for Gauge/Progress/Trend |
| `autoPivotLayout()` | 0 tests | ~6 tests | MEDIUM |
| `suggestRenderModeForCube()` | 0 tests | ~4 tests | LOW |
| `defaultDisplay()` | 1 test | ~18 tests | HIGH — full cascade coverage |
| `enforceChartTypeLimits()` | 0 tests | ~6 tests | MEDIUM |
| `shapeFromResult()` | 1 test | ~6 tests | HIGH — feeds defaultDisplay |
| `pickSankeyFields()` | 0 tests | ~5 tests | MEDIUM |
| `pickTrendFields()` edge cases | 2 tests | +3 tests | LOW |

---

## New Test Files

### File 1: `axis-assignment.tests.ts`

**Functions under test:** `pickDefaultAxes()`, `splitDimsAndMeasures()`, `canReuseAxisPicks()`
**Source:** `smart-defaults/axis-assignment.ts`
**Fixture reuse:** `ordersSchema`, `customersSchema`, `orderDetailsSchema`, `productsSchema`, `salesByMonthColumns`, `salesByCountryAndMonthColumns`, `customerProductFlowColumns`, `customerProductFlowCardinality`

#### Tests for `pickDefaultAxes()`

```
describe("pickDefaultAxes — scatter branch")
  it("Scatter with 2 measures → xFields=[m0], yFields=[m1]")
     // Products: UnitPrice + UnitsInStock → scatter
  it("Scatter with 1 measure → degenerate: xFields=[], yFields=[m0]")
  it("Scatter with 3 measures → xFields=[m0], yFields=[m1] (extras ignored)")

describe("pickDefaultAxes — bubble branch")
  it("Bubble with 3 measures → xFields=[m0], yFields=[m1], bubbleSizeField=[m2]")
  it("Bubble with 2 measures → xFields=[m0], yFields=[m1], no bubbleSizeField")
  it("Bubble with 1 measure → degenerate: xFields=[], yFields=[m0]")

describe("pickDefaultAxes — normal charts (bar/line/area/pie/etc.)")
  it("1 dim + 1 measure → xFields=[dim], yFields=[measure]")
     // salesByMonthColumns: [order_month] → X, [total_freight] → Y
  it("2 dims (cat + date) → date-first reorder: date on X, cat as series")
     // salesByCountryAndMonthColumns: ShipCountry + order_month
     // order_month is temporal → swap to position 0 on X
  it("2 dims (cat + cat) → cardinality-first: lower-card on X")
     // customerProductFlowColumns + cardinality: CustomerID(25) + ProductName(20)
     // ProductName(20) < CustomerID(25) → ProductName on X
  it("2 dims with high-card series → MAX_SERIES cap drops series dim")
     // cardinality > 100 for dims[1] → only dims[0] kept
  it("0 dims + measures → xFields=[], yFields=[all measures]")
     // orderDetailsSchema aggregated: all measures, no dims
  it("Single dim, no measures → xFields=[dim], yFields=[]")

describe("pickDefaultAxes — cardinality hints absent")
  it("No cardinality → no reorder, no MAX_SERIES cap (passthrough order)")
```

#### Tests for `splitDimsAndMeasures()`

```
describe("splitDimsAndMeasures")
  it("Orders schema → 10 dims + 4 measures (Freight + 3 INTEGER IDs as measures)")
     // Actually: INTEGER types are measures per getFieldKind
  it("Customers schema → all dims (VARCHAR), 0 measures")
  it("Order Details schema → 0 dims (all numeric), 5 measures")
  it("Products schema → mixed dims + measures")
  it("salesByMonthColumns → 1 dim (DATE) + 1 measure (DOUBLE)")
```

#### Tests for `canReuseAxisPicks()`

```
describe("canReuseAxisPicks")
  it("All previous fields present → true")
  it("One field missing → false")
  it("Empty previous array → false")
  it("Undefined previous → false")
```

---

### File 2: `auto-pick-helpers.tests.ts`

**Functions under test:** `autoPickMeasure()`, `autoPivotLayout()`, `suggestRenderModeForCube()`
**Source:** `smart-defaults/auto-pick.ts`
**Fixture reuse:** `ordersSchema`, `customersSchema`, `productsSchema`, `employeesSchema`, `categoriesSchema`, `ordersCardinality`, `productsCardinality`, `employeesCardinality`

#### Tests for `autoPickMeasure()`

```
describe("autoPickMeasure")
  it("Single measure column → returns it")
     // totalFreightKpiColumns → "total_freight"
  it("Multiple measures → returns first classified as measure")
     // ordersSchema columns → first numeric non-ID
  it("With excludeColumn → skips excluded, returns next measure")
     // ordersSchema, excludeColumn="Freight" → picks next numeric
  it("With table schema → ID columns are skipped via classifyColumn")
     // ordersSchema with table → OrderID skipped
  it("No measure columns → returns null")
     // customersSchema → null
  it("All measures excluded → returns null")
```

#### Tests for `autoPivotLayout()`

```
describe("autoPivotLayout")
  it("2 dims + 1 measure → lowest-card to cols, rest to rows, aggregator=Sum")
     // employeesSchema + cardinality: Title(2) → cols, City(3) → rows
  it("1 dim + measures → dim to rows, up to 4 measures to vals, aggregator=Sum")
     // categoriesSchema
  it("0 dims + measures → just vals, aggregator=Sum")
  it("No measures → aggregator=Count, empty vals")
     // customersSchema
  it("4+ dims → two lowest-card to cols, rest to rows")
  it("Boolean dim included as valid pivot dimension")
```

#### Tests for `suggestRenderModeForCube()`

```
describe("suggestRenderModeForCube")
  it("0 dims → number")
  it("1 dim → chart")
  it("2 dims → pivot")
  it("3+ dims → pivot")
```

---

### File 3: `display-decisions.tests.ts`

**Functions under test:** `defaultDisplay()`, `enforceChartTypeLimits()`, `shapeFromResult()`
**Source:** `smart-defaults/display.ts`
**Fixture reuse:** `salesByMonthColumns`, `salesByCountryColumns`, `top10ProductsByRevenueColumns`, `ordersByDayOfWeekColumns`, `ordersSchema`, `customersSchema`, `warehouseLocationsColumns`

#### Tests for `defaultDisplay()` — full cascade

```
describe("defaultDisplay — 0 dims branch")
  it("0 dims + 0 measures → number (no shape yet)")
  it("0 dims + 1 measure → number (single summary value)")
  it("0 dims + 2 measures → chart/scatter (X=first, Y=second)")
  it("0 dims + 3+ measures → number (summary without grouping)")

describe("defaultDisplay — 0 measures branch")
  it("1+ dims + 0 measures → chart/bar (count fallback)")

describe("defaultDisplay — 1 dim branch")
  it("1 state dim + measure → map with region=us_states")
  it("1 country dim + measure → map with region=world_countries")
     // salesByCountryColumns: ShipCountry is country → map
  it("1 temporal dim (not extraction) + measure → chart/line")
     // salesByMonthColumns: order_month is temporal → line
  it("1 temporal extraction dim + measure → chart/bar (discrete)")
     // ordersByDayOfWeekColumns: day_of_week extraction → bar
  it("1 boolean dim + measure → chart/bar")
  it("1 category dim + 2+ measures → chart/bar grouped")
  it("1 category dim + 1 measure → chart/bar")
     // top10ProductsByRevenueColumns: ProductName → bar

describe("defaultDisplay — 2 dims branch")
  it("2 dims (date + cat) + 1 measure → chart/line with series=true")
  it("2 dims (lat + lon) + 1 measure → map/pin")
     // warehouseLocationsColumns: Latitude + Longitude → pin map
  it("2 dims (cat + cat) + 1 measure → chart/bar grouped+series")
  it("2 dims (mixed/unclear) + 1 measure → tabulator fallback")

describe("defaultDisplay — 3+ dims branch")
  it("3 dims → tabulator (too many for flat chart)")

describe("defaultDisplay — final fallthrough")
  it("Unrecognized shape → tabulator")
```

#### Tests for `enforceChartTypeLimits()`

```
describe("enforceChartTypeLimits — pie slice cap")
  it("pie with 3 slices → stays pie")
  it("pie with 5 slices → stays pie (boundary)")
  it("pie with 6 slices → demoted to bar")
  it("doughnut with 4 slices → stays doughnut")
  it("doughnut with 10 slices → demoted to bar")
  it("bar always stays bar (no cap applied)")
  it("line always stays line (no cap applied)")
```

#### Tests for `shapeFromResult()`

```
describe("shapeFromResult")
  it("Temporal extraction bucket → kind=category-low, isExtraction=true")
  it("Truncation bucket → kind=temporal")
  it("Country column → isCountry=true")
  it("Aggregated column (ends with _sum) → goes to measures")
  it("GroupBy column without bucket → classified via classifyColumn")
  it("Mixed groupBy + aggregated → correct dims/measures split")
```

---

### File 4: `sankey-auto-pick.tests.ts`

**Functions under test:** `pickSankeyFields()`
**Source:** `smart-defaults/row2-auto-pick.ts`
**Fixture reuse:** `customerProductFlowColumns`, `customerProductFlowCardinality`, `salesByCountryAndMonthColumns`

```
describe("pickSankeyFields — Customer → Product flow")
  it("Source = lower-cardinality dim, target = higher-cardinality dim")
     // customerProductFlow: CustomerID(25) vs ProductName(20)
     // ProductName(20) is lower → source; CustomerID(25) → target
  it("Value field = first measure column")
     // total_quantity → valueField

describe("pickSankeyFields — cardinality hints absent")
  it("No cardinality → schema order preserved (no sort)")

describe("pickSankeyFields — ID column filtering")
  it("ID columns are skipped as source/target candidates")
     // With table schema, OrderID should be filtered out

describe("pickSankeyFields — high-card target guard")
  it("Target with cardinality > 200 still picked as fallback")
     // SANKEY_MAX_TARGET_CARDINALITY = 200

describe("pickSankeyFields — no measures")
  it("No measure columns → valueField undefined")
```

---

### File 5: Additions to `sales-over-time.tests.ts`

**Additional edge-case tests for `pickTrendFields()`**

```
describe("pickTrendFields — edge cases")
  it("Multiple temporal columns → picks first temporal")
  it("No temporal column → dateField undefined")
  it("No measure column → valueField undefined")
```

---

## Test Count Summary

| New File | New Tests |
|---|---|
| `axis-assignment.tests.ts` | ~18 |
| `auto-pick-helpers.tests.ts` | ~16 |
| `display-decisions.tests.ts` | ~28 |
| `sankey-auto-pick.tests.ts` | ~5 |
| Additions to `sales-over-time.tests.ts` | ~3 |
| **Total** | **~70 new tests** |

This brings total coverage from 93 → ~163 tests, filling all identified gaps.

---

## Implementation Notes

1. **Follow existing patterns**: Business persona in `describe()`, README row reference in comment above `it()`, import from barrel `@/lib/data-canvas/smart-defaults`
2. **Reuse existing fixtures**: All data shapes already exist in `northwind.fixture.ts` — no new fixtures needed
3. **No async tests**: All functions under test are synchronous (unlike `autoSummarize` which probes the DB). Tests run fast.
4. **Run command**: `cd frend/reporting && npm run custom:test-data-canvas`
5. **CRITICAL — No external product references in code**: The word "Metabase" or "MB" must NOT appear in any test file. The cross-references in this plan document are for internal developer reference only. The actual Jasmine test files must contain only RB-specific assertions with business persona descriptions, matching the existing test pattern.
