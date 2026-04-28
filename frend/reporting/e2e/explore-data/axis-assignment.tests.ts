// Axis-assignment scenarios — tests for pickDefaultAxes(), splitDimsAndMeasures(),
// and canReuseAxisPicks().
//
// These functions decide which columns land on X, Y, and series-split when a
// chart widget is first configured. The cascade mirrors the logic in
// axis-assignment.ts: scatter/bubble branches → date-first reorder →
// cardinality-first reorder → MAX_SERIES cap.

import {
  pickDefaultAxes,
  splitDimsAndMeasures,
  canReuseAxisPicks,
  MAX_SERIES,
} from "@/lib/explore-data/smart-defaults";

import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

import {
  ordersSchema,
  customersSchema,
  orderDetailsSchema,
  productsSchema,
  salesByMonthColumns,
  salesByCountryAndMonthColumns,
  customerProductFlowColumns,
  customerProductFlowCardinality,
} from "./fixtures/northwind.fixture";

// ═══════════════════════════════════════════════════════════════════════════════
// pickDefaultAxes — scatter branch
// ═══════════════════════════════════════════════════════════════════════════════

describe("Scatter chart — price vs stock correlation (2 measures, no dim)", () => {
  const unitPrice: ColumnSchema = { columnName: "UnitPrice", typeName: "DOUBLE", isNullable: true };
  const unitsInStock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };

  it("X = first measure, Y = second measure — scatter puts both axes on metrics", () => {
    const result = pickDefaultAxes([], [unitPrice, unitsInStock], "scatter");
    expect(result.xFields).toEqual(["UnitPrice"]);
    expect(result.yFields).toEqual(["UnitsInStock"]);
  });

  it("No bubbleSizeField for scatter — only X and Y", () => {
    const result = pickDefaultAxes([], [unitPrice, unitsInStock], "scatter");
    expect(result.bubbleSizeField).toBeUndefined();
  });
});

describe("Scatter chart — degenerate single-measure case", () => {
  const revenue: ColumnSchema = { columnName: "revenue", typeName: "DOUBLE", isNullable: true };

  it("Only 1 measure → X empty, Y has the measure (widget will nag user)", () => {
    const result = pickDefaultAxes([], [revenue], "scatter");
    expect(result.xFields).toEqual([]);
    expect(result.yFields).toEqual(["revenue"]);
  });
});

describe("Scatter chart — 3 measures (extras ignored)", () => {
  const m1: ColumnSchema = { columnName: "price", typeName: "DOUBLE", isNullable: true };
  const m2: ColumnSchema = { columnName: "stock", typeName: "SMALLINT", isNullable: true };
  const m3: ColumnSchema = { columnName: "reorder", typeName: "SMALLINT", isNullable: true };

  it("3 measures → X = first, Y = second, third is NOT bubbleSize (scatter ≠ bubble)", () => {
    const result = pickDefaultAxes([], [m1, m2, m3], "scatter");
    expect(result.xFields).toEqual(["price"]);
    expect(result.yFields).toEqual(["stock"]);
    expect(result.bubbleSizeField).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickDefaultAxes — bubble branch
// ═══════════════════════════════════════════════════════════════════════════════

describe("Bubble chart — 3 measures (x, y, size)", () => {
  const price: ColumnSchema = { columnName: "UnitPrice", typeName: "DOUBLE", isNullable: true };
  const stock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };
  const reorder: ColumnSchema = { columnName: "ReorderLevel", typeName: "SMALLINT", isNullable: true };

  it("X = first, Y = second, bubbleSizeField = third", () => {
    const result = pickDefaultAxes([], [price, stock, reorder], "bubble");
    expect(result.xFields).toEqual(["UnitPrice"]);
    expect(result.yFields).toEqual(["UnitsInStock"]);
    expect(result.bubbleSizeField).toBe("ReorderLevel");
  });
});

describe("Bubble chart — only 2 measures (no size dimension)", () => {
  const price: ColumnSchema = { columnName: "UnitPrice", typeName: "DOUBLE", isNullable: true };
  const stock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };

  it("X = first, Y = second, no bubbleSizeField", () => {
    const result = pickDefaultAxes([], [price, stock], "bubble");
    expect(result.xFields).toEqual(["UnitPrice"]);
    expect(result.yFields).toEqual(["UnitsInStock"]);
    expect(result.bubbleSizeField).toBeUndefined();
  });
});

describe("Bubble chart — degenerate single measure", () => {
  const revenue: ColumnSchema = { columnName: "revenue", typeName: "DOUBLE", isNullable: true };

  it("1 measure → X empty, Y has the measure", () => {
    const result = pickDefaultAxes([], [revenue], "bubble");
    expect(result.xFields).toEqual([]);
    expect(result.yFields).toEqual(["revenue"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickDefaultAxes — normal charts (bar/line/area/pie/doughnut/waterfall/funnel)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Monthly sales bar chart — 1 temporal dim + 1 measure", () => {
  const { dims, measures } = splitDimsAndMeasures(salesByMonthColumns);

  it("order_month on X (the only dim), total_freight on Y (the only measure)", () => {
    const result = pickDefaultAxes(dims, measures, "bar");
    expect(result.xFields).toEqual(["order_month"]);
    expect(result.yFields).toEqual(["total_freight"]);
  });
});

describe("Sales by country AND month — 2 dims (cat + date) → date-first reorder", () => {
  const { dims, measures } = splitDimsAndMeasures(salesByCountryAndMonthColumns);

  it("Date dim swaps to X position — timelines belong on the horizontal axis", () => {
    // salesByCountryAndMonthColumns: [ShipCountry(VARCHAR), order_month(DATE), total_freight(DOUBLE)]
    // dims = [ShipCountry, order_month]
    // Rule 3: order_month is temporal, ShipCountry is not → swap → [order_month, ShipCountry]
    const result = pickDefaultAxes(dims, measures, "line");
    expect(result.xFields[0]).toBe("order_month");
    // ShipCountry becomes series-split (position 1)
    expect(result.xFields[1]).toBe("ShipCountry");
  });
});

describe("Customer → Product flow — 2 cat dims → cardinality-first reorder", () => {
  const { dims, measures } = splitDimsAndMeasures(customerProductFlowColumns);

  it("Lower-cardinality dim goes to X — fewer series = more readable chart", () => {
    // customerProductFlowColumns: [CustomerID(VARCHAR), ProductName(VARCHAR), total_quantity(DOUBLE)]
    // dims = [CustomerID, ProductName]
    // Cardinality: CustomerID=25, ProductName=20 → ProductName(20) < CustomerID(25)
    // Rule 4: cardinality-first → swap → [ProductName, CustomerID]
    const result = pickDefaultAxes(dims, measures, "bar", {
      cardinality: customerProductFlowCardinality,
    });
    expect(result.xFields[0]).toBe("ProductName");
    expect(result.xFields[1]).toBe("CustomerID");
  });
});

describe("High-cardinality series dim → MAX_SERIES cap drops it", () => {
  const cat: ColumnSchema = { columnName: "Category", typeName: "VARCHAR", isNullable: true };
  const highCard: ColumnSchema = { columnName: "ProductName", typeName: "VARCHAR", isNullable: true };
  const revenue: ColumnSchema = { columnName: "revenue", typeName: "DOUBLE", isNullable: true };

  it("Series dim with > 100 distinct values is dropped to prevent unreadable chart", () => {
    const result = pickDefaultAxes([cat, highCard], [revenue], "bar", {
      cardinality: { Category: 8, ProductName: 200 },
    });
    // ProductName (200) > MAX_SERIES (100) → dropped
    expect(result.xFields).toEqual(["Category"]);
    expect(result.yFields).toEqual(["revenue"]);
  });
});

describe("No dims, only measures → empty X, all measures on Y", () => {
  const { dims, measures } = splitDimsAndMeasures(orderDetailsSchema.columns);

  it("Order Details (all numeric) → X empty, Y gets all 5 measure columns", () => {
    const result = pickDefaultAxes(dims, measures, "bar");
    expect(result.xFields).toEqual([]);
    expect(result.yFields.length).toBe(5);
  });
});

describe("No cardinality hints → cardinality-first skipped; date-first still fires", () => {
  const { dims, measures } = splitDimsAndMeasures(salesByCountryAndMonthColumns);

  it("Without cardinality, date-first rule still puts order_month at position 0", () => {
    // No hints.cardinality → Rule 4 (cardinality-first) is skipped.
    // But Rule 3 (date-first) is independent of cardinality: if one dim is temporal
    // and the other is not, the temporal dim always goes to the X position.
    // salesByCountryAndMonthColumns: [ShipCountry(VARCHAR), order_month(DATE)] →
    // date-first swap → [order_month, ShipCountry]
    const result = pickDefaultAxes(dims, measures, "bar");
    expect(result.xFields[0]).toBe("order_month");
    expect(result.xFields[1]).toBe("ShipCountry");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// splitDimsAndMeasures
// ═══════════════════════════════════════════════════════════════════════════════

describe("splitDimsAndMeasures — classifies columns by numeric vs non-numeric", () => {
  it("Orders → 7 dims (VARCHAR + TIMESTAMP) + 4 measures (INTEGER + DECIMAL)", () => {
    const { dims, measures } = splitDimsAndMeasures(ordersSchema.columns);
    // dims: CustomerID, OrderDate, RequiredDate, ShippedDate, ShipName, ShipCity, ShipRegion, ShipPostalCode, ShipCountry = 9 VARCHAR/TIMESTAMP
    // measures: OrderID, EmployeeID, ShipVia, Freight = 4 INTEGER/DECIMAL
    const dimNames = dims.map((d) => d.columnName);
    const measureNames = measures.map((m) => m.columnName);
    expect(dimNames).toContain("CustomerID");
    expect(dimNames).toContain("OrderDate");
    expect(dimNames).toContain("ShipCountry");
    expect(measureNames).toContain("OrderID");
    expect(measureNames).toContain("Freight");
  });

  it("Customers → all dims (all VARCHAR), 0 measures", () => {
    const { dims, measures } = splitDimsAndMeasures(customersSchema.columns);
    expect(dims.length).toBe(customersSchema.columns.length);
    expect(measures.length).toBe(0);
  });

  it("Order Details → 0 dims (all numeric), 5 measures", () => {
    const { dims, measures } = splitDimsAndMeasures(orderDetailsSchema.columns);
    expect(dims.length).toBe(0);
    expect(measures.length).toBe(5);
  });

  it("Products → mixed: dims include ProductName, QuantityPerUnit, Discontinued; measures include UnitPrice etc.", () => {
    const { dims, measures } = splitDimsAndMeasures(productsSchema.columns);
    const dimNames = dims.map((d) => d.columnName);
    const measureNames = measures.map((m) => m.columnName);
    expect(dimNames).toContain("ProductName");
    expect(dimNames).toContain("Discontinued"); // BOOLEAN → not numeric → dimension
    expect(measureNames).toContain("UnitPrice");
    expect(measureNames).toContain("UnitsInStock");
  });

  it("salesByMonthColumns → 1 dim (DATE) + 1 measure (DOUBLE)", () => {
    const { dims, measures } = splitDimsAndMeasures(salesByMonthColumns);
    expect(dims.length).toBe(1);
    expect(dims[0].columnName).toBe("order_month");
    expect(measures.length).toBe(1);
    expect(measures[0].columnName).toBe("total_freight");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Universal property invariants
// ═══════════════════════════════════════════════════════════════════════════════
// These tests assert properties that MUST hold for any input, not just the
// specific cases tested above. A refactor that accidentally places a measure
// name on the X axis (or a dim name on Y) would fail these tests immediately.
//
// Ref parity: the same invariants apply in single-series axis assignment —
// dimensions → X/series-split, metrics → Y. MATCH.

describe("pickDefaultAxes — invariant: xFields ⊆ dim column names (normal charts)", () => {
  // jasmine.arrayContaining(subset) checks that the left array contains all
  // elements of `subset` — i.e. xFields ⊆ dimNames.

  it("bar (1D+1M): xFields drawn from dims only", () => {
    const { dims, measures } = splitDimsAndMeasures(salesByMonthColumns);
    const result = pickDefaultAxes(dims, measures, "bar");
    const dimNames = dims.map((d: ColumnSchema) => d.columnName);
    expect(dimNames).toEqual(jasmine.arrayContaining(result.xFields));
  });

  it("line (1D+1M): xFields drawn from dims only", () => {
    const { dims, measures } = splitDimsAndMeasures(salesByMonthColumns);
    const result = pickDefaultAxes(dims, measures, "line");
    const dimNames = dims.map((d: ColumnSchema) => d.columnName);
    expect(dimNames).toEqual(jasmine.arrayContaining(result.xFields));
  });

  it("bar (2D+1M, date-first reorder): xFields still drawn from dims only", () => {
    const { dims, measures } = splitDimsAndMeasures(salesByCountryAndMonthColumns);
    const result = pickDefaultAxes(dims, measures, "bar");
    const dimNames = dims.map((d: ColumnSchema) => d.columnName);
    expect(dimNames).toEqual(jasmine.arrayContaining(result.xFields));
  });

  it("bar (2D+1M, cardinality-first reorder): xFields still drawn from dims only", () => {
    const { dims, measures } = splitDimsAndMeasures(customerProductFlowColumns);
    const result = pickDefaultAxes(dims, measures, "bar", {
      cardinality: customerProductFlowCardinality,
    });
    const dimNames = dims.map((d: ColumnSchema) => d.columnName);
    expect(dimNames).toEqual(jasmine.arrayContaining(result.xFields));
  });
});

describe("pickDefaultAxes — invariant: yFields ⊆ measure column names (normal charts)", () => {
  it("bar (1D+1M): yFields drawn from measures only", () => {
    const { dims, measures } = splitDimsAndMeasures(salesByMonthColumns);
    const result = pickDefaultAxes(dims, measures, "bar");
    const measureNames = measures.map((m: ColumnSchema) => m.columnName);
    expect(measureNames).toEqual(jasmine.arrayContaining(result.yFields));
  });

  it("line (1D+1M): yFields drawn from measures only", () => {
    const { dims, measures } = splitDimsAndMeasures(salesByMonthColumns);
    const result = pickDefaultAxes(dims, measures, "line");
    const measureNames = measures.map((m: ColumnSchema) => m.columnName);
    expect(measureNames).toEqual(jasmine.arrayContaining(result.yFields));
  });

  it("bar (2D+1M): no measure name appears on X axis (even after date-first swap)", () => {
    const { dims, measures } = splitDimsAndMeasures(salesByCountryAndMonthColumns);
    const result = pickDefaultAxes(dims, measures, "bar");
    const measureNames = measures.map((m: ColumnSchema) => m.columnName);
    result.xFields.forEach((x: string) => expect(measureNames).not.toContain(x));
  });
});

describe("pickDefaultAxes — scatter: xFields and yFields are BOTH from measures (not dims)", () => {
  // Scatter is the intentional exception — both axes are metrics, no dim on X.
  // Ref parity: scatter also puts both metrics on axes. MATCH.
  it("scatter: xField is a measure, not a dim", () => {
    const price: ColumnSchema = { columnName: "UnitPrice",    typeName: "DOUBLE",   isNullable: true };
    const stock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };
    const result = pickDefaultAxes([], [price, stock], "scatter");
    expect(result.xFields).toEqual(["UnitPrice"]);
    expect(result.yFields).toEqual(["UnitsInStock"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// canReuseAxisPicks
// ═══════════════════════════════════════════════════════════════════════════════

describe("canReuseAxisPicks — keep user's previous picks when columns still exist", () => {
  const currentColumns = ordersSchema.columns;

  it("All previous fields present in current schema → true (keep user picks)", () => {
    expect(canReuseAxisPicks(["OrderDate", "Freight"], currentColumns)).toBe(true);
  });

  it("One field missing from current schema → false (re-auto-pick)", () => {
    expect(canReuseAxisPicks(["OrderDate", "NonExistentColumn"], currentColumns)).toBe(false);
  });

  it("Empty previous array → false (nothing to reuse)", () => {
    expect(canReuseAxisPicks([], currentColumns)).toBe(false);
  });

  it("Undefined previous → false (first time, no picks yet)", () => {
    expect(canReuseAxisPicks(undefined, currentColumns)).toBe(false);
  });
});
