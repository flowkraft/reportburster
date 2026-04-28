// Browsing-raw-tables scenarios — the most common first action a Northwind
// user takes: click a table in the left panel, see the rows.
//
// Each test asserts the FULL ordered recommendation list (what the user
// actually sees in the "Visualize as" panel, positions 0..N-1), not just
// the #0 pick. Comment above each `it(...)` = matching row from README.md.

import {
  groupWidgetsBySensibility,
  autoFilterPaneField,
} from "@/lib/explore-data/smart-defaults";

import {
  customersSchema,
  customersCardinality,
  ordersSchema,
  ordersCardinality,
  employeesSchema,
  productsSchema,
  categoriesSchema,
  suppliersSchema,
  shippersSchema,
  orderDetailsSchema,
  SHAPE_RAW_GEO_NO_MEASURE_RB,
  SHAPE_RAW_GEO_WITH_MEASURE_RB,
  SHAPE_RAW_NO_GEO_NO_MEASURE_RB,
  SHAPE_RAW_NO_GEO_WITH_MEASURE_RB,
  REFERENCE_SHAPE_RAW_GEO_NO_MEASURE,
  REFERENCE_SHAPE_RAW_GEO_WITH_MEASURE,
  REFERENCE_SHAPE_RAW_NO_GEO_NO_MEASURE,
  REFERENCE_SHAPE_RAW_NO_GEO_WITH_MEASURE,
  BRANCH_SHAPE_RAW_GEO,
  BRANCH_SHAPE_RAW_NO_GEO,
} from "./fixtures/northwind.fixture";

import { ALL_WIDGETS } from "@/lib/explore-data/smart-defaults/widget-sensibility";
import { canonicalize } from "./helpers/canonicalize";

/** Returns sensible+nonsensible in ALL_WIDGETS order — mirrors the "More widgets" UI section. */
function moreWidgetsFor(palette: { sensible: string[]; nonsensible: string[] }): string[] {
  return [...palette.sensible, ...palette.nonsensible].sort(
    (a, b) => ALL_WIDGETS.indexOf(a as any) - ALL_WIDGETS.indexOf(b as any),
  );
}

describe("Nancy (sales rep) opens the Customers list to phone her German accounts", () => {
  const palette = groupWidgetsBySensibility(customersSchema.columns, {
    isAggregated: false,
    tableSchema: customersSchema,
  });

  // | 1 | Nancy opens Customers list | Customers (R2: raw, geo, no measure) |
  // | RB: `[tabulator, map, detail]` |
  // | ref: `[table, pivot]` (no metric → map/scatter fail sensibility; no detail equivalent) |
  it("Nancy sees — in order — Table, Map, Detail as her recommended widgets", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_GEO_NO_MEASURE_RB);
    // Reference parity — intentional divergence:
    //   ref canonical = [tabulator, pivot] (map requires a metric; no detail widget)
    //   RB canonical  = [tabulator, map, detail] — adds map for geo browsing + detail for single-row inspection
    // Assert the reference is what we expect it to be (proves this is a real cross-check):
    expect(canonicalize(REFERENCE_SHAPE_RAW_GEO_NO_MEASURE).sort()).toEqual(["pivot", "tabulator"]);
    // Shared element: tabulator present in both
    expect(palette.recommended).toContain("tabulator");
  });

  // | 2 | Nancy — Chart pushed to 'More widgets' | Customers raw |
  // | RB: `nonsensible` contains chart | ref: no bar/line/pie in recommended (no aggregation, no metric) |
  it("Chart is pushed to 'More widgets' — graphing 25 unaggregated customers is noise", () => {
    expect(palette.nonsensible).toContain("chart");
  });

  // | 3 | Nancy — Trend pushed to 'More widgets' | Customers raw |
  // | RB: `nonsensible` contains trend | ref: smartscalar absent too |
  it("Trend is pushed to 'More widgets' — no temporal dim, no meaningful delta", () => {
    expect(palette.nonsensible).toContain("trend");
  });

  // | 4 | Nancy — Number/Gauge/Progress pushed to 'More widgets' | Customers raw |
  // | RB: all 3 nonsensible | ref: scalar/gauge/progress need 1-row result, we have 25 |
  it("Number, Gauge, Progress are all 'More widgets' — none handle 25-row tables", () => {
    expect(palette.nonsensible).toContain("number");
    expect(palette.nonsensible).toContain("gauge");
    expect(palette.nonsensible).toContain("progress");
  });

  it("'More widgets' section matches BRANCH_SHAPE_RAW_GEO ordering (reference DEFAULT_VIZ_ORDER)", () => {
    expect(moreWidgetsFor(palette)).toEqual(BRANCH_SHAPE_RAW_GEO.moreWidgets);
  });
});

describe("Nancy wants to add a 'filter by country' control above the customer list", () => {
  // | 5 | Nancy adds filter-by-country | Customers + cardinality |
  // | `autoFilterPaneField` === `"Region"` | ref: manual field-pick |
  // Region (4 distinct values) beats Country (10) on cardinality — lowest-card
  // non-ID column wins.
  it("Region is auto-picked as the filter field — lowest cardinality (4 values vs Country's 10)", () => {
    const suggestedFilterField = autoFilterPaneField(
      customersSchema,
      customersCardinality,
    );
    expect(suggestedFilterField).toBe("Region");
  });

  // | 6 | Filter-pane skips CustomerID (PK) | Customers | result !== `"CustomerID"` |
  it("CustomerID is NOT picked — filter-pane always skips primary keys", () => {
    const suggestedFilterField = autoFilterPaneField(
      customersSchema,
      customersCardinality,
    );
    expect(suggestedFilterField).not.toBe("CustomerID");
  });
});

describe("A new hire drops the Orders table (has OrderDate, Freight measure, ShipCountry)", () => {
  const palette = groupWidgetsBySensibility(ordersSchema.columns, {
    isAggregated: false,
    tableSchema: ordersSchema,
  });

  // | 7 | Orders raw drop | Orders (R3: raw, geo + Freight metric) |
  // | RB: `[tabulator, map, detail]` |
  // | ref: full chart cascade (string dim + metric → cartesian sensible) + map + pivot |
  it("New hire sees — in order — Table, Map, Detail", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_GEO_WITH_MEASURE_RB);
    // Reference parity — intentional divergence:
    //   ref canonical = [chart, map, pivot, tabulator] (raw-drop + metric → cartesian+map sensible)
    //   RB canonical  = [detail, map, tabulator] — raw-drop rule: no chart without aggregation
    expect(canonicalize(REFERENCE_SHAPE_RAW_GEO_WITH_MEASURE).sort())
      .toEqual(["chart", "map", "pivot", "tabulator"]);
    expect(palette.recommended).toContain("tabulator");
    expect(palette.recommended).toContain("map");
  });

  // | 8 | Orders raw — Chart/Trend/Pivot all under More widgets | Orders raw |
  // | RB: `nonsensible` has all 3 | ref: same (no aggregation = no chart recommendation) |
  it("Chart, Trend, Pivot are all under 'More widgets' — raw orders need aggregation first", () => {
    expect(palette.nonsensible).toContain("chart");
    expect(palette.nonsensible).toContain("trend");
    expect(palette.nonsensible).toContain("pivot");
  });

  it("'More widgets' section matches BRANCH_SHAPE_RAW_GEO ordering (reference DEFAULT_VIZ_ORDER)", () => {
    expect(moreWidgetsFor(palette)).toEqual(BRANCH_SHAPE_RAW_GEO.moreWidgets);
  });
});

describe("Shipping coordinator adds a 'filter by country' panel on Orders", () => {
  // | 9 | Orders filter-by-country | Orders + cardinality |
  // | `autoFilterPaneField` === `"ShipRegion"` |
  // ShipRegion (4 distinct values) beats ShipCountry (10) on cardinality.
  it("ShipRegion is auto-picked — 4 regions beats 10 countries, lowest-card non-ID column wins", () => {
    const suggestedFilterField = autoFilterPaneField(
      ordersSchema,
      ordersCardinality,
    );
    expect(suggestedFilterField).toBe("ShipRegion");
  });

  // | 10 | Orders filter skips IDs | Orders | result not in `[OrderID, CustomerID, EmployeeID, ShipVia]` |
  it("OrderID / CustomerID / EmployeeID / ShipVia are all skipped — IDs are poor filter material", () => {
    const suggestedFilterField = autoFilterPaneField(
      ordersSchema,
      ordersCardinality,
    );
    expect(["OrderID", "CustomerID", "EmployeeID", "ShipVia"]).not.toContain(suggestedFilterField);
  });
});

describe("Warehouse manager opens the Products catalog (UnitPrice measure, no geo)", () => {
  const palette = groupWidgetsBySensibility(productsSchema.columns, {
    isAggregated: false,
    tableSchema: productsSchema,
  });

  // | 11 | Products raw | Products (R4: raw, UnitPrice measure, no geo) |
  // | RB: `[tabulator, detail]` (no geo → no map; raw-drop rule: no chart) |
  // | ref: full chart cascade (string dim + metric) minus map |
  it("Warehouse manager sees — in order — Table, Detail (no Map, no Chart at top)", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_NO_GEO_WITH_MEASURE_RB);
    // Reference parity — intentional divergence:
    //   ref canonical = [chart, pivot, tabulator] (string dim + metric → cartesian sensible)
    //   RB canonical  = [detail, tabulator] — raw-drop rule: no chart without aggregation
    expect(canonicalize(REFERENCE_SHAPE_RAW_NO_GEO_WITH_MEASURE).sort())
      .toEqual(["chart", "pivot", "tabulator"]);
    expect(palette.recommended).toContain("tabulator");
  });

  // | 12 | Products — Map is 'More widgets' (no geo col) | Products raw |
  // | RB: `nonsensible` contains map | ref: map filtered too |
  it("Map is under 'More widgets' — Products has no geographic column", () => {
    expect(palette.nonsensible).toContain("map");
  });

  it("'More widgets' section matches BRANCH_SHAPE_RAW_NO_GEO ordering (reference DEFAULT_VIZ_ORDER)", () => {
    expect(moreWidgetsFor(palette)).toEqual(BRANCH_SHAPE_RAW_NO_GEO.moreWidgets);
  });
});

describe("HR opens the Employees roster (Country + BirthDate + HireDate, 3 rows)", () => {
  const palette = groupWidgetsBySensibility(employeesSchema.columns, {
    isAggregated: false,
    tableSchema: employeesSchema,
  });

  // | 13 | Employees raw | Employees (R2: geo via Country, no measure) |
  // | RB: `[tabulator, map, detail]` | ref: `[table, pivot]` |
  it("HR sees — in order — Table, Map, Detail", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_GEO_NO_MEASURE_RB);
    expect(canonicalize(REFERENCE_SHAPE_RAW_GEO_NO_MEASURE).sort()).toEqual(["pivot", "tabulator"]);
  });
});

describe("A data analyst opens the Categories lookup table (8 rows, name + description)", () => {
  const palette = groupWidgetsBySensibility(categoriesSchema.columns, {
    isAggregated: false,
    tableSchema: categoriesSchema,
  });

  // | 14 | Categories raw | Categories (R1: no geo, no measure) |
  // | RB: `[tabulator, detail]` | ref: `[table, pivot]` |
  it("Analyst sees — in order — Table, Detail", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_NO_GEO_NO_MEASURE_RB);
    // Reference parity — intentional divergence:
    //   ref canonical = [pivot, tabulator] (0 metrics → only table+pivot sensible)
    //   RB canonical  = [detail, tabulator] — detail instead of pivot for raw browsing
    expect(canonicalize(REFERENCE_SHAPE_RAW_NO_GEO_NO_MEASURE).sort()).toEqual(["pivot", "tabulator"]);
    expect(palette.recommended).toContain("tabulator");
  });

  // | 15 | Categories — Map under 'More widgets' | Categories raw |
  // | RB: `nonsensible` contains map | ref same |
  it("Map is under 'More widgets' — no geo column in Categories", () => {
    expect(palette.nonsensible).toContain("map");
  });

  it("'More widgets' section matches BRANCH_SHAPE_RAW_NO_GEO ordering (reference DEFAULT_VIZ_ORDER)", () => {
    expect(moreWidgetsFor(palette)).toEqual(BRANCH_SHAPE_RAW_NO_GEO.moreWidgets);
  });
});

describe("Procurement opens the Suppliers list (6 rows, 5 countries)", () => {
  const palette = groupWidgetsBySensibility(suppliersSchema.columns, {
    isAggregated: false,
    tableSchema: suppliersSchema,
  });

  // | 16 | Suppliers raw | Suppliers (R2: geo via Country, no measure) |
  // | RB: `[tabulator, map, detail]` | ref: `[table, pivot]` |
  it("Procurement sees — in order — Table, Map, Detail (Suppliers span UK/USA/Japan/Australia/Italy)", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_GEO_NO_MEASURE_RB);
    expect(canonicalize(REFERENCE_SHAPE_RAW_GEO_NO_MEASURE).sort()).toEqual(["pivot", "tabulator"]);
  });
});

describe("Ops opens the Shippers table (Speedy / United / Federal, 3 rows)", () => {
  const palette = groupWidgetsBySensibility(shippersSchema.columns, {
    isAggregated: false,
    tableSchema: shippersSchema,
  });

  // | 17 | Shippers raw | Shippers (R1: no geo, no measure, 3 rows) |
  // | RB: `[tabulator, detail]` | ref: `[table, pivot]` |
  it("Ops sees — in order — Table, Detail (3 shippers, just names + phones)", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_NO_GEO_NO_MEASURE_RB);
    expect(canonicalize(REFERENCE_SHAPE_RAW_NO_GEO_NO_MEASURE).sort()).toEqual(["pivot", "tabulator"]);
  });
});

describe("A report dev opens Order Details (line-item junction table — 5 cols, all IDs or measures)", () => {
  const palette = groupWidgetsBySensibility(orderDetailsSchema.columns, {
    isAggregated: false,
    tableSchema: orderDetailsSchema,
  });

  // | 18 | Order Details raw | Order Details (R4: IDs + measures, no geo) |
  // | RB: `[tabulator, detail]` (raw-drop: no chart without aggregation) |
  // | ref: chart cascade (string dim + metric) minus map |
  it("Report dev sees — in order — Table, Detail (nothing charts well with all-IDs)", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_NO_GEO_WITH_MEASURE_RB);
    expect(canonicalize(REFERENCE_SHAPE_RAW_NO_GEO_WITH_MEASURE).sort())
      .toEqual(["chart", "pivot", "tabulator"]);
    expect(palette.recommended).toContain("tabulator");
  });

  // | 19 | Order Details — Chart NOT recommended | Order Details raw |
  // | RB: chart in sensible (not recommended) OR nonsensible | ref: not in recommended |
  it("Chart is NOT in the top recommendations — raw line items need aggregation", () => {
    expect(palette.recommended).not.toContain("chart");
  });
});
