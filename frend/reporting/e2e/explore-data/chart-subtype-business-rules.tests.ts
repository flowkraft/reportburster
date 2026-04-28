// Chart-subtype business rules — each of the 12 chart subtypes has its own
// sensibility rule. These tests pin those rules to real business scenarios
// so a future refactor can't silently kill (say) the Waterfall that Finance
// depends on.
//
// Comment above each `it(...)` is the matching row from README.md.

import {
  isSensibleChartSubtype,
} from "@/lib/explore-data/smart-defaults";

import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

const productName: ColumnSchema = { columnName: "ProductName", typeName: "VARCHAR", isNullable: true };
const category:    ColumnSchema = { columnName: "CategoryName", typeName: "VARCHAR", isNullable: true };
const orderDate:   ColumnSchema = { columnName: "OrderDate",   typeName: "DATE",    isNullable: true };
const revenue:     ColumnSchema = { columnName: "revenue",     typeName: "DOUBLE",  isNullable: true };
const unitPrice:   ColumnSchema = { columnName: "UnitPrice",   typeName: "DOUBLE",  isNullable: true };

describe("Bar chart — the Swiss army knife: 1 dim + 1 measure", () => {
  // | 151 | Bar — "top products by revenue" (1 dim + 1 measure) | `[productName], [revenue]` | `sensible: true` |
  // | ref `CartesianChart.isSensible` → true (rows>1, cols≥2, dim+measure ≥1 each) ✓ |
  it("Sensible for 'top products by revenue' (1 dim + 1 measure)", () => {
    const result = isSensibleChartSubtype("bar", [productName], [revenue]);
    expect(result.sensible).toBe(true);
  });

  // | 152 | Bar NOT sensible with 0 dims | `[], [revenue]` | `sensible: false` |
  // | ref same (dim count check) ✓ |
  it("NOT sensible with zero dimensions — nothing to put on the X axis", () => {
    const result = isSensibleChartSubtype("bar", [], [revenue]);
    expect(result.sensible).toBe(false);
  });
});

describe("rowCount > 1 gate — cartesian charts require more than one row", () => {
  // Reference rule: `rows.length > 1` required for all cartesian charts.
  // A single-row result produces a degenerate single-bar/point with no
  // comparative meaning — the gate matches the reference system's behaviour.

  // | 151a | Bar with rowCount=1 NOT sensible | `[productName], [revenue], rowCount=1` | `sensible: false` |
  it("Bar NOT sensible when rowCount=1 — a single bar conveys nothing", () => {
    const result = isSensibleChartSubtype("bar", [productName], [revenue], 1);
    expect(result.sensible).toBe(false);
  });

  // | 153a | Line with rowCount=1 NOT sensible | `[orderDate], [revenue], rowCount=1` | `sensible: false` |
  it("Line NOT sensible when rowCount=1 — a single point is not a trend", () => {
    const result = isSensibleChartSubtype("line", [orderDate], [revenue], 1);
    expect(result.sensible).toBe(false);
  });

  // | 156a | Pie with rowCount=1 NOT sensible | `[productName], [revenue], rowCount=1` | `sensible: false` |
  it("Pie NOT sensible when rowCount=1 — a single slice is a meaningless circle", () => {
    const result = isSensibleChartSubtype("pie", [productName], [revenue], 1);
    expect(result.sensible).toBe(false);
  });

  // | 151b | Bar with rowCount=2 still sensible | `[productName], [revenue], rowCount=2` | `sensible: true` |
  it("Bar IS sensible when rowCount=2 — two bars are the minimum comparative view", () => {
    const result = isSensibleChartSubtype("bar", [productName], [revenue], 2);
    expect(result.sensible).toBe(true);
  });

  // | 163a | Waterfall with rowCount=1 NOT sensible | `[orderDate], [revenue], rowCount=1` | `sensible: false` |
  it("Waterfall NOT sensible when rowCount=1 — a single step is not a progression", () => {
    const result = isSensibleChartSubtype("waterfall", [orderDate], [revenue], 1);
    expect(result.sensible).toBe(false);
  });
});

describe("Line chart — time-series default: temporal dim + 1 measure", () => {
  // | 153 | Line — "monthly sales" (temporal dim + measure) | `[orderDate], [revenue]` | `sensible: true` |
  // | ref Line shares `getCartesianChartDefinition` — same rule ✓ |
  it("Sensible for 'monthly sales' (1 temporal dim + 1 measure)", () => {
    const result = isSensibleChartSubtype("line", [orderDate], [revenue]);
    expect(result.sensible).toBe(true);
  });
});

describe("Area chart — stacked volume over time (accumulation feel)", () => {
  // | 154 | Area — "cumulative monthly revenue" | `[orderDate], [revenue]` | `sensible: true` |
  // | ref Area same cartesian rule ✓ |
  it("Sensible for 'cumulative monthly revenue'", () => {
    const result = isSensibleChartSubtype("area", [orderDate], [revenue]);
    expect(result.sensible).toBe(true);
  });
});

describe("Row chart — horizontal bar when category names are long", () => {
  // | 155 | Row — "long supplier names by volume" | `[SupplierCompanyName], [revenue]` | `sensible: true` |
  // | ref Row same cartesian rule ✓ |
  it("Sensible for 'long supplier names by purchase volume'", () => {
    const supplierName: ColumnSchema = { columnName: "SupplierCompanyName", typeName: "VARCHAR", isNullable: true };
    const result = isSensibleChartSubtype("row", [supplierName], [revenue]);
    expect(result.sensible).toBe(true);
  });
});

describe("Pie chart — proportional breakdown: 1 dim + 1 measure", () => {
  // | 156 | Pie — "orders by shipper" (3 slices) | `[CompanyName], [order_count]` | `sensible: true` |
  // | ref `PieChart.isSensible` → rows≥2 & cols≥2 & dim+measure ✓ |
  it("Sensible for 'orders by shipper' (3 slices — readable pie)", () => {
    const shipperName: ColumnSchema = { columnName: "CompanyName",  typeName: "VARCHAR", isNullable: true };
    const orderCount:  ColumnSchema = { columnName: "order_count",  typeName: "DOUBLE",  isNullable: true };
    const result = isSensibleChartSubtype("pie", [shipperName], [orderCount]);
    expect(result.sensible).toBe(true);
  });

  // | 157 | Pie NOT sensible with 0 dims | `[], [revenue]` | `sensible: false` |
  // | ref same — dim required ✓ |
  it("NOT sensible with zero dimensions — nothing to split the pie BY", () => {
    const result = isSensibleChartSubtype("pie", [], [revenue]);
    expect(result.sensible).toBe(false);
  });
});

describe("Doughnut chart — pie variant with same sensibility rules", () => {
  // | 158 | Doughnut — same rule as pie | `[category], [revenue]` | `sensible: true` |
  // | ref: Doughnut shares Pie's isSensible ✓ |
  it("Sensible for 'product breakdown' (same rule as pie)", () => {
    const result = isSensibleChartSubtype("doughnut", [category], [revenue]);
    expect(result.sensible).toBe(true);
  });
});

describe("Scatter chart — marketing wants to see price-vs-stock correlation", () => {
  // | 159 | Scatter — price-vs-stock correlation (2 measures) | `[], [price, stock]` | `sensible: true` |
  // | ref Scatter needs ≥2 measures — same ✓ |
  it("Sensible with 2 measures (UnitPrice vs UnitsInStock)", () => {
    const unitsInStock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };
    const result = isSensibleChartSubtype("scatter", [], [unitPrice, unitsInStock]);
    expect(result.sensible).toBe(true);
  });

  // | 160 | Scatter NOT sensible with only 1 measure | `[productName], [revenue]` | `sensible: false` |
  // | ref same — needs 2 measures on axes ✓ |
  it("NOT sensible with only 1 measure — scatter needs X AND Y both as measures", () => {
    const result = isSensibleChartSubtype("scatter", [productName], [revenue]);
    expect(result.sensible).toBe(false);
  });
});

describe("Bubble chart — scatter with size dimension (3 measures)", () => {
  // | 161 | Bubble — 3 measures (x, y, size) | `[], [price, stock, reorder]` | `sensible: true` |
  // | ref: Bubble is Scatter w/ bubble size — same 3-measure rule ✓ |
  it("Sensible with 3 measures (x, y, size)", () => {
    const reorderLevel: ColumnSchema = { columnName: "ReorderLevel", typeName: "SMALLINT", isNullable: true };
    const unitsInStock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };
    const result = isSensibleChartSubtype("bubble", [], [unitPrice, unitsInStock, reorderLevel]);
    expect(result.sensible).toBe(true);
  });

  // | 162 | Bubble NOT sensible with only 2 measures | 2 measures | `sensible: false` |
  // | ref same ✓ |
  it("NOT sensible with only 2 measures — bubble needs the 3rd for sizing", () => {
    const unitsInStock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };
    const result = isSensibleChartSubtype("bubble", [], [unitPrice, unitsInStock]);
    expect(result.sensible).toBe(false);
  });
});

describe("Waterfall chart — Finance wants to see how month-over-month changes accumulate", () => {
  // | 163 | Waterfall — Finance "month-over-month changes" | `[orderDate], [revenue]` | `sensible: true` |
  // | ref `WaterfallChart.isSensible` — exactly 1 dim + 1 metric ✓ |
  it("Sensible with exactly 1 dim + 1 measure (classic waterfall shape)", () => {
    const result = isSensibleChartSubtype("waterfall", [orderDate], [revenue]);
    expect(result.sensible).toBe(true);
  });

  // | 164 | Waterfall NOT sensible with 2 dims | `[orderDate, category], [revenue]` | `sensible: false` |
  // | ref same — waterfall is 1D progression ✓ |
  it("NOT sensible with 2 dimensions — waterfall is a 1-D progression, not a crosstab", () => {
    const result = isSensibleChartSubtype("waterfall", [orderDate, category], [revenue]);
    expect(result.sensible).toBe(false);
  });
});

describe("Funnel chart — sales pipeline visualization (stages in order)", () => {
  // | 165 | Funnel — sales pipeline stages | `[stage], [lead_count]` | `sensible: true` |
  // | ref `FunnelChart.isSensible` — 1 dim + 1 measure ✓ |
  it("Sensible with 1 dim (stage) + 1 measure (count per stage)", () => {
    const stage: ColumnSchema = { columnName: "PipelineStage", typeName: "VARCHAR", isNullable: true };
    const count: ColumnSchema = { columnName: "lead_count",    typeName: "DOUBLE",  isNullable: true };
    const result = isSensibleChartSubtype("funnel", [stage], [count]);
    expect(result.sensible).toBe(true);
  });
});

describe("Combo chart — revenue (bar) + target (line) on the same chart", () => {
  // | 166 | Combo — revenue (bar) + target (line) | `[orderDate], [revenue, target]` | `sensible: true` |
  // | ref Combo needs 1+ dim + ≥1 measure — same ✓ |
  it("Sensible with 1 dim + ≥1 measure (combo needs at least one series)", () => {
    const target: ColumnSchema = { columnName: "target", typeName: "DOUBLE", isNullable: true };
    const result = isSensibleChartSubtype("combo", [orderDate], [revenue, target]);
    expect(result.sensible).toBe(true);
  });
});

describe("Boxplot chart — Q1 revenue distribution across product categories", () => {
  // | 167 | Boxplot — Q1 distribution across categories | `[category, orderDate], [revenue]` | `sensible: true` |
  // | ref has no Boxplot in OSS (Pro only) — we diverge here |
  it("Sensible with 2 dims + 1 measure (one dim groups, the other distributes)", () => {
    const result = isSensibleChartSubtype("boxplot", [category, orderDate], [revenue]);
    expect(result.sensible).toBe(true);
  });
});
