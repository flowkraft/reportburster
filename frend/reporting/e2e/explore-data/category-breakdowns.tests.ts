// Category-breakdown scenarios — low-cardinality dim breakdowns where Pie
// genuinely works. Full recommended = [chart, tabulator, pivot].

import {
  groupWidgetsBySensibility,
  defaultDisplay,
  shapeFromResult,
  autoFilterPaneField,
  classifyColumn,
  looksLikeBoolean,
  rankChartSubtypes,
} from "@/lib/explore-data/smart-defaults";

import {
  productsPerCategoryColumns,
  productsPerCategoryResult,
  ordersByShipperColumns,
  ordersByShipperResult,
  productsSchema,
  productsCardinality,
  categoriesSchema,
  SHAPE_CAT_MEASURE_1DIM_RB,
  REFERENCE_SHAPE_CAT_MEASURE_1DIM,
} from "./fixtures/northwind.fixture";

import { canonicalize } from "./helpers/canonicalize";

describe("Marketing asks 'how many products per category?' — 8 categories", () => {
  const palette = groupWidgetsBySensibility(productsPerCategoryColumns, {
    isAggregated: true,
    rowCount: productsPerCategoryResult.rowCount,
  });

  // | 73 | Products per category | 1 cat dim + 1 measure, 8 rows |
  // | RB: `[chart, tabulator, pivot]` |
  // | ref: `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` |
  it("Marketing sees — in order — Chart, Table, Pivot", () => {
    expect(palette.recommended).toEqual(SHAPE_CAT_MEASURE_1DIM_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, pivot, tabulator]
    //   RB canonical  (sorted) = [chart, pivot, tabulator]
    const refFamilies = canonicalize(REFERENCE_SHAPE_CAT_MEASURE_1DIM).sort();
    expect(refFamilies).toEqual(["chart", "pivot", "tabulator"]);
    expect(palette.recommended).toContain("chart");
    expect(palette.recommended).toContain("tabulator");
  });

  // | 73b | Number NOT recommended for multi-row GROUP BY — only in More Widgets drawer |
  it("Number is NOT recommended for grouped categorical results — moves to More Widgets drawer", () => {
    expect(palette.recommended).not.toContain("number");
    expect(palette.sensible).toContain("number");
  });

  // | 74 | Pie promoted for 8 low-card | cardinality=8 | `ranked.indexOf("pie") < 5` |
  // | ref: Pie at #3 for low-card |
  it("Inside Chart, pie ranks in the top 5 for 8 categories (readable slice count)", () => {
    const ranked = rankChartSubtypes(
      [{ columnName: "CategoryName", typeName: "VARCHAR", isNullable: true }],
      [{ columnName: "product_count", typeName: "DOUBLE", isNullable: true }],
      { cardinality: { CategoryName: 8 } },
    );
    expect(ranked.indexOf("pie")).toBeLessThan(5);
  });
});

describe("Ops asks 'which shipper handles most orders?' — 3 slices (Speedy/United/Federal)", () => {
  const palette = groupWidgetsBySensibility(ordersByShipperColumns, {
    isAggregated: true,
    rowCount: ordersByShipperResult.rowCount,
  });

  // | 75 | Orders by shipper | 1 cat dim + 1 measure, 3 rows |
  // | RB: `[chart, tabulator, pivot]` |
  // | ref: `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` |
  it("Ops sees — in order — Chart, Table, Pivot", () => {
    expect(palette.recommended).toEqual(SHAPE_CAT_MEASURE_1DIM_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, pivot, tabulator]
    //   RB canonical  (sorted) = [chart, pivot, tabulator]
    expect(canonicalize(REFERENCE_SHAPE_CAT_MEASURE_1DIM).sort()).toEqual(["chart", "pivot", "tabulator"]);
  });

  // | 76 | defaultDisplay bar/row/pie | cols | chartType ∈ [bar, row, pie] |
  // | ref: Pie viable for 3 |
  it("defaultDisplay picks bar/row/pie subtype", () => {
    const shape = shapeFromResult(
      ordersByShipperColumns.map((c) => c.columnName),
      ["CompanyName"],
      {},
      ["order_count"],
      undefined,
      undefined,
    );
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(["bar", "row", "pie"]).toContain(decision.chartType);
  });
});

describe("Procurement wants 'filter by category' on Products", () => {
  // | 77 | Filter-by-category skips IDs | Products schema | result not in `[ProductID, CategoryID, SupplierID]` |
  it("autoFilterPaneField skips all ID/FK columns in Products", () => {
    const suggested = autoFilterPaneField(
      productsSchema,
      productsCardinality,
    );
    expect(suggested).not.toBe("ProductID");
    expect(suggested).not.toBe("CategoryID");
    expect(suggested).not.toBe("SupplierID");
  });
});

describe("Column classification", () => {
  // | 78 | Discontinued = boolean | Products.Discontinued (2 distinct) | `classifyColumn === "boolean"` |
  it("'Discontinued' is classified as boolean", () => {
    const discontinuedCol = productsSchema.columns.find((c) => c.columnName === "Discontinued")!;
    expect(classifyColumn(discontinuedCol, productsSchema)).toBe("boolean");
  });

  // | 79 | UnitPrice = measure | Products.UnitPrice | `classifyColumn === "measure"` |
  it("'UnitPrice' is classified as measure", () => {
    const priceCol = productsSchema.columns.find((c) => c.columnName === "UnitPrice")!;
    expect(classifyColumn(priceCol, productsSchema)).toBe("measure");
  });

  // | 80 | CategoryName = category-low | Categories.CategoryName (8 distinct) | `classifyColumn === "category-low"` |
  it("'CategoryName' classified as category-low (8 distinct values)", () => {
    const categoryNameCol = categoriesSchema.columns.find((c) => c.columnName === "CategoryName")!;
    const kind = classifyColumn(categoryNameCol, categoriesSchema, { CategoryName: 8 });
    expect(kind).toBe("category-low");
  });
});

describe("looksLikeBoolean — Y/N detection", () => {
  // | 81 | ['Y','N','Y','Y','N'] = boolean | values | returns true |
  it("['Y','N','Y','Y','N'] is recognized as boolean", () => {
    expect(looksLikeBoolean([{ v: "Y" }, { v: "N" }, { v: "Y" }, { v: "Y" }, { v: "N" }], "v")).toBe(true);
  });

  // | 82 | 3 distinct strings NOT boolean | values | returns false |
  it("3 distinct strings are NOT boolean", () => {
    expect(looksLikeBoolean([{ v: "A" }, { v: "B" }, { v: "C" }, { v: "A" }, { v: "B" }], "v")).toBe(false);
  });

  // | 83 | 'true'/'false' = boolean | values | returns true |
  it("'true'/'false' values are boolean", () => {
    expect(looksLikeBoolean([{ v: "true" }, { v: "false" }, { v: "true" }, { v: "true" }], "v")).toBe(true);
  });
});
