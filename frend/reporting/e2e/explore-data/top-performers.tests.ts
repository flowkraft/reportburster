// Top-N / rankings — "who are our best X?" Queries with 1 cat dim + 1 measure.
// Full recommended = [chart, tabulator, pivot].

import {
  groupWidgetsBySensibility,
  defaultDisplay,
  shapeFromResult,
  pickDefaultAxes,
  splitDimsAndMeasures,
  rankChartSubtypes,
  isSensibleChartSubtype,
  enforceChartTypeLimits,
} from "@/lib/explore-data/smart-defaults";

import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

import {
  top10ProductsByRevenueColumns,
  top10ProductsByRevenueResult,
  topCustomersByOrderCountColumns,
  topCustomersByOrderCountResult,
  SHAPE_CAT_MEASURE_1DIM_RB,
  REFERENCE_SHAPE_CAT_MEASURE_1DIM,
} from "./fixtures/northwind.fixture";

import { canonicalize } from "./helpers/canonicalize";

describe("Sales director asks 'top 10 products by revenue?'", () => {
  const palette = groupWidgetsBySensibility(top10ProductsByRevenueColumns, {
    isAggregated: true,
    rowCount: top10ProductsByRevenueResult.rowCount,
  });

  // | 62 | Top 10 products | 1 cat dim + 1 measure |
  // | RB: `[chart, tabulator, pivot]` (full ordered) |
  // | ref: `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` |
  it("Director sees — in order — Chart, Table, Pivot", () => {
    expect(palette.recommended).toEqual(SHAPE_CAT_MEASURE_1DIM_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, pivot, tabulator]
    //   RB canonical  (sorted) = [chart, pivot, tabulator]
    const refFamilies = canonicalize(REFERENCE_SHAPE_CAT_MEASURE_1DIM).sort();
    expect(refFamilies).toEqual(["chart", "pivot", "tabulator"]);
    expect(palette.recommended).toContain("chart");
    expect(palette.recommended).toContain("tabulator");
  });
});

describe("Chart subtype for top-10 — BAR (categorical dim, no time)", () => {
  // | 63 | Chart subtype bar/row | cols | `decision.chartType ∈ [bar, row]` |
  // | ref picks Bar for cat+measure |
  it("defaultDisplay picks chartType='bar' or 'row' for 1 categorical dim + 1 measure", () => {
    const shape = shapeFromResult(
      top10ProductsByRevenueColumns.map((c) => c.columnName),
      ["ProductName"],
      {},
      ["revenue"],
      undefined,
      undefined,
    );
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(["bar", "row"]).toContain(decision.chartType);
  });
});

describe("Axis assignment", () => {
  const { dims, measures } = splitDimsAndMeasures(top10ProductsByRevenueColumns);

  // | 64 | ProductName on X | Same | xFields contains "ProductName" |
  it("ProductName lands on X axis", () => {
    const assignment = pickDefaultAxes(dims, measures, "bar");
    expect(assignment.xFields).toContain("ProductName");
  });

  // | 65 | Revenue on Y | Same | yFields contains "revenue" |
  it("Revenue lands on Y axis", () => {
    const assignment = pickDefaultAxes(dims, measures, "bar");
    expect(assignment.yFields).toContain("revenue");
  });
});

describe("Sales manager compares customers — 25 customers too many for a pie", () => {
  // | 66 | Pie demoted for high-card dim | cardinality=25 | `rank.bar < rank.pie` |
  it("rankChartSubtypes demotes 'pie' when cardinality >20", () => {
    const highCardDim: ColumnSchema[] = [{ columnName: "CompanyName", typeName: "VARCHAR", isNullable: true }];
    const measure: ColumnSchema[]    = [{ columnName: "order_count", typeName: "DOUBLE",  isNullable: true }];
    const ranked = rankChartSubtypes(highCardDim, measure, {
      cardinality: { CompanyName: 25 },
    });
    const barIndex = ranked.indexOf("bar");
    const pieIndex = ranked.indexOf("pie");
    expect(barIndex).toBeLessThan(pieIndex);
  });

  // | 67 | Pie promoted for low-card dim | cardinality=3 | `rank.indexOf("pie") < 5` |
  it("Pie is PROMOTED when cardinality ≤5", () => {
    const lowCardDim: ColumnSchema[] = [{ columnName: "CompanyName", typeName: "VARCHAR", isNullable: true }];
    const measure: ColumnSchema[]   = [{ columnName: "order_count", typeName: "DOUBLE",  isNullable: true }];
    const ranked = rankChartSubtypes(lowCardDim, measure, {
      cardinality: { CompanyName: 3 },
    });
    expect(ranked.indexOf("pie")).toBeLessThan(5);
  });
});

describe("Hard rendering cap — pie >5 slices auto-downgrades", () => {
  // | 68 | Pie 8 slices → bar | pie, 8 | returns "bar" |
  // | ref warns but doesn't auto-downgrade |
  it("enforceChartTypeLimits: pie with 8 slices forced to 'bar'", () => {
    expect(enforceChartTypeLimits("pie", 8)).toBe("bar");
  });

  // | 69 | Pie 4 slices stays | pie, 4 | returns "pie" |
  it("enforceChartTypeLimits: pie with 4 slices stays as 'pie'", () => {
    expect(enforceChartTypeLimits("pie", 4)).toBe("pie");
  });
});

describe("Chart subtype sensibility — pie needs at least 1 dim + 1 measure", () => {
  // | 70 | Pie 0 dims NOT sensible | `[], [revenue]` | sensible:false |
  it("Pie is NOT sensible with 0 dims", () => {
    const result = isSensibleChartSubtype(
      "pie",
      [],
      [{ columnName: "revenue", typeName: "DOUBLE", isNullable: true }],
    );
    expect(result.sensible).toBe(false);
  });

  // | 71 | Pie 1 dim + 1 measure sensible | `[prodName], [revenue]` | sensible:true |
  it("Pie IS sensible with 1 dim + 1 measure", () => {
    const result = isSensibleChartSubtype(
      "pie",
      [{ columnName: "ProductName", typeName: "VARCHAR", isNullable: true }],
      [{ columnName: "revenue",     typeName: "DOUBLE",  isNullable: true }],
    );
    expect(result.sensible).toBe(true);
  });
});

describe("Janet opens 'Top 15 customers by order count'", () => {
  const palette = groupWidgetsBySensibility(topCustomersByOrderCountColumns, {
    isAggregated: true,
    rowCount: topCustomersByOrderCountResult.rowCount,
  });

  // | 72 | Top 15 customers | same cat-measure shape |
  // | RB: `[chart, tabulator, pivot]` | ref: `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` |
  it("Janet sees — in order — Chart, Table, Pivot (15 customers → bar chart readable)", () => {
    expect(palette.recommended).toEqual(SHAPE_CAT_MEASURE_1DIM_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, pivot, tabulator]
    //   RB canonical  (sorted) = [chart, pivot, tabulator]
    const refFamilies = canonicalize(REFERENCE_SHAPE_CAT_MEASURE_1DIM).sort();
    expect(refFamilies).toEqual(["chart", "pivot", "tabulator"]);
  });
});
