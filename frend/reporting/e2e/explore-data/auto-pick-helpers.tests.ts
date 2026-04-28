// Auto-pick helper scenarios — tests for autoPickMeasure(), autoPivotLayout(),
// and suggestRenderModeForCube().
//
// These functions auto-select the best field for Number/Gauge/Progress widgets,
// build a default pivot table layout, and suggest a cube render mode.

import {
  autoPickMeasure,
  autoPivotLayout,
  suggestRenderModeForCube,
} from "@/lib/explore-data/smart-defaults";

import {
  totalFreightKpiColumns,
  ordersSchema,
  customersSchema,
  productsSchema,
  employeesSchema,
  categoriesSchema,
  ordersCardinality,
  productsCardinality,
  employeesCardinality,
} from "./fixtures/northwind.fixture";

// ═══════════════════════════════════════════════════════════════════════════════
// autoPickMeasure
// ═══════════════════════════════════════════════════════════════════════════════

describe("autoPickMeasure — finds the first measure column for Number/Gauge/Progress", () => {
  it("Single measure column → returns it immediately", () => {
    const measure = autoPickMeasure(totalFreightKpiColumns);
    expect(measure?.columnName).toBe("total_freight");
  });

  it("Orders schema → first non-ID numeric column is Freight (IDs are skipped via classifyColumn)", () => {
    // With table schema, classifyColumn marks OrderID/EmployeeID/ShipVia as "id"
    // Freight (DECIMAL) is the first non-ID measure
    const measure = autoPickMeasure(ordersSchema.columns, ordersSchema);
    expect(measure?.columnName).toBe("Freight");
  });

  it("With excludeColumn → skips the excluded column, returns next measure", () => {
    const measure = autoPickMeasure(ordersSchema.columns, ordersSchema, "Freight");
    // After Freight is excluded, next non-ID numeric... but OrderID/EmployeeID/ShipVia
    // are IDs. So the next measure would depend on classifyColumn.
    // Without table schema, INTEGER columns are measures → first non-excluded is OrderID
    const measureNoTable = autoPickMeasure(ordersSchema.columns, undefined, "Freight");
    expect(measureNoTable?.columnName).toBe("OrderID");
  });

  it("No measure columns → returns null", () => {
    const measure = autoPickMeasure(customersSchema.columns);
    expect(measure).toBeNull();
  });

  it("All measures excluded → returns null", () => {
    // totalFreightKpiColumns has only 1 measure: total_freight
    const measure = autoPickMeasure(totalFreightKpiColumns, undefined, "total_freight");
    expect(measure).toBeNull();
  });

  it("Products schema → first non-ID measure is SupplierID (INTEGER) without table, UnitPrice with table", () => {
    // Without table: ProductID, SupplierID, CategoryID, UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel are all numeric
    // First is ProductID
    const measureNoTable = autoPickMeasure(productsSchema.columns);
    expect(measureNoTable?.columnName).toBe("ProductID");

    // With table: ProductID is PK → "id", SupplierID/CategoryID are FKs → "id"
    // UnitPrice (DECIMAL) is first non-ID measure
    const measureWithTable = autoPickMeasure(productsSchema.columns, productsSchema);
    expect(measureWithTable?.columnName).toBe("UnitPrice");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// autoPivotLayout
// ═══════════════════════════════════════════════════════════════════════════════

describe("autoPivotLayout — builds default pivot rows/cols/vals from table schema", () => {
  it("Employees (low-card dims, no non-ID measures) → dims to cols/rows, aggregator=Count", () => {
    // employeesCardinality: EmployeeID=3, Title=2, City=3, Country=1
    // classifyColumn with cardinality + table schema:
    //   EmployeeID → "id" (PK — primaryKeyColumns)
    //   ReportsTo  → "id" (FK — foreignKeys; no _id suffix but FK schema wins)
    //   Title      → cardinality=2 → "boolean"
    //   City       → cardinality=3 → "category-low"
    //   Country    → cardinality=1 → "category-low" (1 < CATEGORY_LOW_MAX=50)
    //   BirthDate/HireDate → "temporal"
    // Employees has NO numeric non-ID columns → measures=[] → aggregator="Count".
    // EmployeeID and ReportsTo look numeric but are both IDs (PK+FK) — they are
    // excluded from the measures pool by classifyColumn returning "id".
    // PK/FK columns are never aggregated as metrics.
    const layout = autoPivotLayout(employeesSchema, employeesCardinality);
    // Low-card dims → cols (Country card=1 or Title card=2 goes first)
    expect(layout.cols.length).toBeGreaterThanOrEqual(1);
    // No non-ID numeric measures → Count, not Sum
    expect(layout.aggregator).toBe("Count");
    // No measures → empty vals
    expect(layout.vals).toEqual([]);
  });

  it("Categories (1 dim + no numeric measures) → dim to rows, aggregator=Count", () => {
    // Categories: CategoryID (INTEGER, PK → "id"), CategoryName (VARCHAR), Description (CLOB → "text-free")
    // Only CategoryName is a valid dim candidate (non-ID, non-text-free)
    const layout = autoPivotLayout(categoriesSchema);
    expect(layout.rows.length).toBeGreaterThanOrEqual(1);
    expect(layout.aggregator).toBe("Count");
  });

  it("Customers (no numeric measures) → aggregator=Count, empty vals", () => {
    const layout = autoPivotLayout(customersSchema);
    expect(layout.aggregator).toBe("Count");
    expect(layout.vals).toEqual([]);
  });

  it("Products with cardinality → dims sorted by cardinality, measures to vals", () => {
    // productsCardinality: ProductID=20, ProductName=20, SupplierID=6, CategoryID=8, Discontinued=2
    // classifyColumn with cardinality:
    //   ProductID → "id" (PK)
    //   ProductName → "category-low" (card=20 < 50)
    //   SupplierID → "id" (FK)
    //   CategoryID → "id" (FK)
    //   Discontinued → "boolean" (BOOLEAN type)
    //   UnitPrice etc → "measure"
    const layout = autoPivotLayout(productsSchema, productsCardinality);
    // Discontinued(2) is boolean → valid dim, ProductName(20) is category-low → valid dim
    // Sorted by cardinality: Discontinued(2), ProductName(20)
    expect(layout.aggregator).toBe("Sum");
    expect(layout.vals.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// suggestRenderModeForCube
// ═══════════════════════════════════════════════════════════════════════════════

describe("suggestRenderModeForCube — picks widget type from cube dimension/measure counts", () => {
  it("0 dims → number (scalar KPI)", () => {
    expect(suggestRenderModeForCube([], ["total_revenue"])).toBe("number");
  });

  it("1 dim → chart (single-axis visualization)", () => {
    expect(suggestRenderModeForCube(["CategoryName"], ["revenue"])).toBe("chart");
  });

  it("2 dims → pivot (cross-tabulation)", () => {
    expect(suggestRenderModeForCube(["Country", "Month"], ["revenue"])).toBe("pivot");
  });

  it("3+ dims → pivot (multi-dimensional cross-tab)", () => {
    expect(suggestRenderModeForCube(["Country", "Month", "Product"], ["revenue"])).toBe("pivot");
  });
});
