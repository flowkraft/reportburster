// Cross-dimensional scenarios — 2 dims + 1 measure. Pivot becomes sensible.
// Sankey surfaces when dims are low-cardinality flow-shaped.

import {
  groupWidgetsBySensibility,
  isSensibleWidget,
  pickSankeyFields,
  autoPivotLayout,
  SANKEY_MAX_TARGET_CARDINALITY,
  defaultDisplay,
  shapeFromResult,
} from "@/lib/explore-data/smart-defaults";

import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

import {
  salesByCountryAndMonthColumns,
  salesByCountryAndMonthResult,
  customerProductFlowColumns,
  customerProductFlowResult,
  customerProductFlowCardinality,
  customerCountryFlowColumns,
  customerCountryFlowResult,
  customerCountryFlowCardinality,
  employeePerformanceByMonthColumns,
  employeePerformanceByMonthResult,
  SHAPE_DATE_CAT_MEASURE_2DIMS_RB,
  SHAPE_TWO_CAT_DIMS_MEASURE_RB,
  REFERENCE_SHAPE_DATE_CAT_MEASURE_2DIMS,
  REFERENCE_SHAPE_TWO_CAT_DIMS_MEASURE,
} from "./fixtures/northwind.fixture";

import { canonicalize } from "./helpers/canonicalize";

describe("Regional mgr: 'sales by country × month' — 2 dims + 1 measure (one is date)", () => {
  const palette = groupWidgetsBySensibility(salesByCountryAndMonthColumns, {
    isAggregated: true,
    rowCount: salesByCountryAndMonthResult.rowCount,
  });

  // | 84 | Country × month × freight | D2a: 2 dims (1 date) + measure + geo |
  // | RB: `[chart, trend, tabulator, pivot]` (RB drops Map when date is present) |
  // | ref: `[map, line, area, bar, combo, smartscalar, row, waterfall, scatter, pie]` (10 items;
  //   ref shows Map; RB doesn't — defensible either way.) |
  it("Regional mgr sees — in order — Chart, Trend, Table, Pivot", () => {
    expect(palette.recommended).toEqual(SHAPE_DATE_CAT_MEASURE_2DIMS_RB);
    // Reference parity — intentional divergence:
    //   ref canonical (sorted) = [chart, map, trend]
    //   RB canonical  (sorted) = [chart, pivot, tabulator, trend]
    //   RB drops map (date is primary breakout intent); RB adds pivot + tabulator
    const refFamilies = canonicalize(REFERENCE_SHAPE_DATE_CAT_MEASURE_2DIMS).sort();
    expect(refFamilies).toEqual(["chart", "map", "trend"]);
    // Shared core: chart and trend present in both
    expect(palette.recommended).toContain("chart");
    expect(palette.recommended).toContain("trend");
  });
});

describe("BI analyst: Customer → Product flow (2 low-card cat dims + measure)", () => {
  const palette = groupWidgetsBySensibility(customerProductFlowColumns, {
    isAggregated: true,
    rowCount: customerProductFlowResult.rowCount,
    cardinality: customerProductFlowCardinality,
  });

  // | 85 | Customer → Product flow | S1: 2 non-date cat dims + measure |
  // | RB: `[chart, pivot, sankey, tabulator]` |
  // | ref: `[bar, row, pie, line, area, combo, scatter, boxplot, table, pivot, sankey]` (11 items;
  //   waterfall fails — 2 dims, needs exactly 1). Sankey present in both — good parity. |
  it("BI analyst sees — in order — Chart, Pivot, Sankey, Table", () => {
    expect(palette.recommended).toEqual(SHAPE_TWO_CAT_DIMS_MEASURE_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, pivot, sankey, tabulator]
    //   RB canonical  (sorted) = [chart, pivot, sankey, tabulator]
    const rbFamilies: string[]  = [...palette.recommended].sort();
    const refFamilies = canonicalize(REFERENCE_SHAPE_TWO_CAT_DIMS_MEASURE).sort();
    expect(rbFamilies).toEqual(refFamilies);
  });

  // | 86 | Sankey picks source+target+value | 2 dims + measure | all three fields defined |
  it("Sankey auto-picks source + target + value fields", () => {
    const picks = pickSankeyFields(customerProductFlowColumns, {
      cardinality: customerProductFlowCardinality,
    });
    expect(picks.sourceField).toBeDefined();
    expect(picks.targetField).toBeDefined();
    expect(picks.valueField).toBe("total_quantity");
  });
});

describe("2 cat dims + measure where one dim is geo (no date)", () => {
  const palette = groupWidgetsBySensibility(customerCountryFlowColumns, {
    isAggregated: true,
    rowCount: customerCountryFlowResult.rowCount,
    cardinality: customerCountryFlowCardinality,
  });

  it("recommends multi-dim viz, not a single-geo choropleth", () => {
    expect(palette.recommended).toEqual(SHAPE_TWO_CAT_DIMS_MEASURE_RB);
  });

  it("does not recommend 'map' — it would collapse the non-geo dim", () => {
    expect(palette.recommended).not.toContain("map");
  });

  it("matches the expected reference (map absent from both)", () => {
    const refFamilies = canonicalize(REFERENCE_SHAPE_TWO_CAT_DIMS_MEASURE).sort();
    expect(refFamilies).not.toContain("map");
    const rbFamilies: string[] = [...palette.recommended].sort();
    expect(rbFamilies).toEqual(refFamilies);
  });
});

describe("Sankey high-cardinality target guard", () => {
  const lowCardSource: ColumnSchema[] = [
    { columnName: "Country",     typeName: "VARCHAR", isNullable: true },
    { columnName: "ShipAddress", typeName: "VARCHAR", isNullable: true },
    { columnName: "freight_total", typeName: "DOUBLE", isNullable: true },
  ];

  // | 87 | Sankey guard: high-card target | cardinality=580 | targetField !== "ShipAddress" |
  it(`Target with cardinality >${SANKEY_MAX_TARGET_CARDINALITY} is skipped (prevents 580-node meltdown)`, () => {
    const picks = pickSankeyFields(lowCardSource, {
      cardinality: { Country: 10, ShipAddress: 580 },
    });
    expect(picks.targetField).not.toBe("ShipAddress");
  });
});

describe("Sankey sensibility", () => {
  // | 88 | Sankey 1 dim NOT sensible | single-dim cols | `isSensibleWidget === false` |
  // | ref Sankey needs ≥2 dims |
  it("Sankey NOT sensible with only 1 dim", () => {
    const singleDimCols: ColumnSchema[] = [
      { columnName: "CategoryName", typeName: "VARCHAR", isNullable: true },
      { columnName: "count",        typeName: "DOUBLE",  isNullable: true },
    ];
    expect(isSensibleWidget("sankey", singleDimCols, { rowCount: 8 })).toBe(false);
  });
});

describe("autoPivotLayout", () => {
  // | 89 | Pivot layout: low-card=col | year (5) + country (20) + revenue |
  // | cols=["year"], rows=["country"] |
  it("Year (low-card) + Country + Revenue → year on COLUMNS, country on ROWS", () => {
    const cols: ColumnSchema[] = [
      { columnName: "year",    typeName: "INTEGER", isNullable: true },
      { columnName: "country", typeName: "VARCHAR", isNullable: true },
      { columnName: "revenue", typeName: "DECIMAL", isNullable: true },
    ];
    const cardinality = { year: 5, country: 20 };
    const layout = autoPivotLayout({ tableName: "test", tableType: "TABLE", primaryKeyColumns: [], columns: cols }, cardinality);
    expect(layout.cols).toEqual(["year"]);
    expect(layout.rows).toEqual(["country"]);
    expect(layout.vals).toEqual(["revenue"]);
    expect(layout.aggregator).toBe("Sum");
  });

  // | 90 | Pivot 4+ dims | 4 dims + measure | cols.length=2 |
  it("4+ dims → first 2 become columns, rest become rows", () => {
    const cols: ColumnSchema[] = [
      { columnName: "q",       typeName: "VARCHAR", isNullable: true },
      { columnName: "region",  typeName: "VARCHAR", isNullable: true },
      { columnName: "product", typeName: "VARCHAR", isNullable: true },
      { columnName: "channel", typeName: "VARCHAR", isNullable: true },
      { columnName: "revenue", typeName: "DECIMAL", isNullable: true },
    ];
    const layout = autoPivotLayout({ tableName: "test", tableType: "TABLE", primaryKeyColumns: [], columns: cols });
    expect(layout.cols.length).toBe(2);
    expect(layout.rows.length).toBeGreaterThanOrEqual(2);
  });

  // | 91 | Pivot no measures → Count | 2 dim cols | aggregator === "Count" |
  it("No measures → aggregator falls back to 'Count'", () => {
    const cols: ColumnSchema[] = [
      { columnName: "category", typeName: "VARCHAR", isNullable: true },
      { columnName: "sub_cat",  typeName: "VARCHAR", isNullable: true },
    ];
    const layout = autoPivotLayout({ tableName: "test", tableType: "TABLE", primaryKeyColumns: [], columns: cols });
    expect(layout.aggregator).toBe("Count");
  });
});

describe("Sales director: 'employee × month' performance view", () => {
  const palette = groupWidgetsBySensibility(employeePerformanceByMonthColumns, {
    isAggregated: true,
    rowCount: employeePerformanceByMonthResult.rowCount,
  });

  // | 92 | Employee × month × freight | D2b: 2 dims (1 date) + measure, no geo |
  // | RB: `[chart, trend, tabulator, pivot]` |
  // | ref: `[line, area, bar, combo, row, scatter, pie, table, pivot]` (9 items;
  //   smartscalar+waterfall filtered) |
  it("Director sees — in order — Chart, Trend, Table, Pivot", () => {
    expect(palette.recommended).toEqual(SHAPE_DATE_CAT_MEASURE_2DIMS_RB);
    // Reference parity — intentional divergence (same as D2a; gap exists with and without geo):
    //   ref canonical (no map) = [chart, trend]
    //   RB canonical  (sorted) = [chart, pivot, tabulator, trend]
    //   RB adds pivot + tabulator; ref omits them for this shape.
    //   Shared core: chart and trend must be present in both.
    const refFamiliesNoGeo = canonicalize(
      REFERENCE_SHAPE_DATE_CAT_MEASURE_2DIMS.filter((x) => x !== "map"),
    ).sort();
    expect(refFamiliesNoGeo).toEqual(["chart", "trend"]);
    // Shared core: chart and trend present in both
    expect(palette.recommended).toContain("chart");
    expect(palette.recommended).toContain("trend");
  });
});

describe("3+ dims falls back to Tabulator", () => {
  // | 93 | 3+ dims fallback | `[dim1,dim2,dim3,measure]` | `decision.widgetType === "tabulator"` |
  // | ref: no explicit rule, falls to Table |
  it("defaultDisplay returns Tabulator with 3+ dims (no chart handles it well)", () => {
    const shape = shapeFromResult(
      ["dim1", "dim2", "dim3", "measure"],
      ["dim1", "dim2", "dim3"],
      {},
      ["measure"],
      undefined,
      undefined,
    );
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("tabulator");
  });
});
