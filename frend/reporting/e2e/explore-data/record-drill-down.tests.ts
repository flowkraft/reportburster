// Record-drill-down scenarios — "show me one customer / one order in detail
// view". The Detail widget hides PK/FK columns by default (they're noise to
// business users) and surfaces everything else as key/value pairs.
//
// Comment above each `it(...)` is the matching row from README.md.

import {
  pickDetailDefaults,
  isIdColumn,
  isPK,
  isFK,
  isSensibleWidget,
} from "@/lib/explore-data/smart-defaults";

import {
  customersSchema,
  ordersSchema,
  productsSchema,
} from "./fixtures/northwind.fixture";

describe("Account manager clicks 'view details' on ALFKI (Alfreds Futterkiste) — Customer 360 view", () => {
  const { hiddenColumns } = pickDetailDefaults(customersSchema.columns, customersSchema);

  // | 123 | Account mgr opens ALFKI — CustomerID hidden | Customers | `hiddenColumns` contains `"CustomerID"` | ref "Object" view shows all; user hides manually. We auto-hide PKs by default |
  it("CustomerID is hidden by default — account managers care about the company name, not the internal key", () => {
    expect(hiddenColumns).toContain("CustomerID");
  });

  // | 124 | CompanyName NOT hidden | Same | `hiddenColumns` doesn't contain `"CompanyName"` | ref Object shows all columns ✓ |
  it("CompanyName is NOT hidden — it's the headline business identifier", () => {
    expect(hiddenColumns).not.toContain("CompanyName");
  });

  // | 125 | Country/City/Phone shown | Same | all three NOT hidden | Same — ref shows all |
  it("Country / City / Phone are NOT hidden — those are the useful contact fields", () => {
    expect(hiddenColumns).not.toContain("Country");
    expect(hiddenColumns).not.toContain("City");
    expect(hiddenColumns).not.toContain("Phone");
  });
});

describe("Shipping coordinator clicks 'view details' on Order 10248 — Order receipt view", () => {
  const { hiddenColumns } = pickDetailDefaults(ordersSchema.columns, ordersSchema);

  // | 126 | Shipping coord opens Order 10248 — OrderID hidden (PK) | Orders | `hiddenColumns` contains `"OrderID"` | ref: shows all by default; we hide PKs |
  it("OrderID (PK) is hidden — internal key, not a business value", () => {
    expect(hiddenColumns).toContain("OrderID");
  });

  // | 127 | CustomerID hidden (FK) | Same | `hiddenColumns` contains `"CustomerID"` | ref: shows all; we hide FKs |
  it("CustomerID (FK) is hidden — shippers want the customer NAME, not the code", () => {
    expect(hiddenColumns).toContain("CustomerID");
  });

  // | 128 | EmployeeID hidden (FK) | Same | `hiddenColumns` contains `"EmployeeID"` | Same |
  it("EmployeeID (FK) is hidden — same reason, the name is in the joined result", () => {
    expect(hiddenColumns).toContain("EmployeeID");
  });

  // | 129 | ShipVia hidden (FK, name has no `_id` suffix — regression guard) | Same | `hiddenColumns` contains `"ShipVia"` | ref detects via `fk_target_field_id` metadata — we use schema.foreignKeys |
  it("ShipVia (FK, but named without '_id' suffix) is HIDDEN — FK detection via the schema, not a name regex", () => {
    expect(hiddenColumns).toContain("ShipVia");
  });

  // | 130 | ShipCountry shown | Same | `hiddenColumns` doesn't contain `"ShipCountry"` | Same |
  it("ShipCountry is NOT hidden — geographic info matters to shipping ops", () => {
    expect(hiddenColumns).not.toContain("ShipCountry");
  });

  // | 131 | Freight shown | Same | `hiddenColumns` doesn't contain `"Freight"` | Same |
  it("Freight is NOT hidden — the shipping cost is exactly what a coordinator looks at", () => {
    expect(hiddenColumns).not.toContain("Freight");
  });
});

describe("Regression guard — ShipVia is correctly detected as an ID column (FK without '_id' suffix)", () => {
  // | 132 | `isIdColumn("ShipVia", ordersSchema) === true` | FK name | returns `true` | ref has `isPK` / `isFK` predicates via `semantic_type` |
  it("isIdColumn('ShipVia', ordersSchema) returns true — FK detection uses schema metadata", () => {
    expect(isIdColumn("ShipVia", ordersSchema)).toBe(true);
  });

  // | 133 | `isIdColumn("ShipCountry")` === false | non-ID col | returns `false` | Same ✓ |
  it("isIdColumn('ShipCountry', ordersSchema) returns false — not an ID or FK", () => {
    expect(isIdColumn("ShipCountry", ordersSchema)).toBe(false);
  });
});

describe("PK/FK primitives — detecting the structural roles of columns", () => {
  // | 134 | `isPK("CustomerID", customersSchema) === true` | declared PK | returns `true` | ref `semantic_type === "type/PK"` ✓ |
  it("isPK('CustomerID', customersSchema) returns true — declared in primaryKeyColumns", () => {
    const col = customersSchema.columns.find((c) => c.columnName === "CustomerID")!;
    expect(isPK(col, customersSchema)).toBe(true);
  });

  // | 135 | `isPK("CompanyName")` === false | non-PK | returns `false` | Same ✓ |
  it("isPK('CompanyName', customersSchema) returns false — not a PK", () => {
    const col = customersSchema.columns.find((c) => c.columnName === "CompanyName")!;
    expect(isPK(col, customersSchema)).toBe(false);
  });

  // | 136 | `isFK("CustomerID", ordersSchema) === true` | declared FK | returns `true` | ref `semantic_type === "type/FK"` ✓ |
  it("isFK('CustomerID', ordersSchema) returns true — FK to Customers", () => {
    const col = ordersSchema.columns.find((c) => c.columnName === "CustomerID")!;
    expect(isFK(col, ordersSchema)).toBe(true);
  });

  // | 137 | `isFK("OrderDate")` === false | non-FK | returns `false` | Same ✓ |
  it("isFK('OrderDate', ordersSchema) returns false — regular column", () => {
    const col = ordersSchema.columns.find((c) => c.columnName === "OrderDate")!;
    expect(isFK(col, ordersSchema)).toBe(false);
  });
});

describe("Detail widget sensibility — does it make sense for the current data?", () => {
  // | 138 | Detail sensible with 1 row (drill-down) | any cols, rowCount=1 | `isSensibleWidget(...) === true` | ref Object sensible for single-row ✓ |
  it("Detail is sensible with 1 row (single-record drill-down)", () => {
    const sensible = isSensibleWidget("detail", customersSchema.columns, {
      rowCount: 1,
      tableSchema: customersSchema,
    });
    expect(sensible).toBe(true);
  });

  // | 139 | Detail sensible with many rows (user picks one) | rowCount=25 | `isSensibleWidget(...) === true` | ref Object also sensible — user clicks to drill ✓ |
  it("Detail is sensible with many rows (user picks one to drill into)", () => {
    const sensible = isSensibleWidget("detail", customersSchema.columns, {
      rowCount: 25,
      tableSchema: customersSchema,
    });
    expect(sensible).toBe(true);
  });
});

describe("Warehouse analyst views product detail — Discontinued boolean column should not be hidden", () => {
  const { hiddenColumns } = pickDetailDefaults(productsSchema.columns, productsSchema);

  // | 140 | Warehouse analyst on Products — IDs hidden, rest shown | Products | ProductID/SupplierID/CategoryID hidden; name/price/discontinued/stock NOT | ref: shows all; we auto-hide FKs for cleaner drill-down |
  it("ProductID (PK) is hidden", () => {
    expect(hiddenColumns).toContain("ProductID");
  });

  // | 140 | Warehouse analyst on Products — IDs hidden, rest shown | Products | ProductID/SupplierID/CategoryID hidden; name/price/discontinued/stock NOT | ref: shows all; we auto-hide FKs for cleaner drill-down |
  it("SupplierID (FK) is hidden", () => {
    expect(hiddenColumns).toContain("SupplierID");
  });

  // | 140 | Warehouse analyst on Products — IDs hidden, rest shown | Products | ProductID/SupplierID/CategoryID hidden; name/price/discontinued/stock NOT | ref: shows all; we auto-hide FKs for cleaner drill-down |
  it("CategoryID (FK) is hidden", () => {
    expect(hiddenColumns).toContain("CategoryID");
  });

  // | 140 | Warehouse analyst on Products — IDs hidden, rest shown | Products | ProductID/SupplierID/CategoryID hidden; name/price/discontinued/stock NOT | ref: shows all; we auto-hide FKs for cleaner drill-down |
  it("ProductName / UnitPrice / Discontinued / UnitsInStock are all shown — that's the actionable data", () => {
    expect(hiddenColumns).not.toContain("ProductName");
    expect(hiddenColumns).not.toContain("UnitPrice");
    expect(hiddenColumns).not.toContain("Discontinued");
    expect(hiddenColumns).not.toContain("UnitsInStock");
  });
});
