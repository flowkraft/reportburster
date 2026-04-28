// Row-2 widget smart-defaults — tests for pickGaugeField(), pickTrendFields(),
// pickProgressField(), pickDetailDefaults(), and pickProgressGoal().
//
// "Row 2" = the second row of the widget palette: Sankey, Gauge, Trend,
// Progress, Detail. Sankey is covered in sankey-auto-pick.tests.ts.
// This file pins the auto-pick contracts for the remaining four.
//
// Reference parity notes (verified against SmartScalar.tsx / Gauge / Progress):
//   MATCH   Trend picks first temporal col as date field        ✓ ref insight-driven
//   MATCH   Gauge/Progress pick first non-ID numeric            ✓ ref isSuitableScalarColumn
//   DIVERGE ref Gauge/Progress includes ALL numerics (even IDs); RB skips IDs.
//           Reason: ProductID is not a useful KPI — users would be confused.
//   MATCH   Detail hides ID columns by default                  ✓ ref object viz hides PKs
//   MATCH   pickProgressGoal derives a "nice" ceiling from value ✓ ref uses tick rounding

import {
  pickGaugeField,
  pickTrendFields,
  pickProgressField,
  pickDetailDefaults,
  pickProgressGoal,
} from "@/lib/explore-data/smart-defaults";

import {
  ordersSchema,
  productsSchema,
  customersSchema,
  orderDetailsSchema,
  salesByMonthColumns,
  totalFreightKpiColumns,
} from "./fixtures/northwind.fixture";

import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

// ═══════════════════════════════════════════════════════════════════════════════
// pickGaugeField — first non-ID numeric → the field the Gauge widget displays
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickGaugeField — first non-ID numeric for KPI display", () => {
  it("Single measure column → returns it as the gauge field", () => {
    const result = pickGaugeField(totalFreightKpiColumns);
    expect(result.field).toBe("total_freight");
  });

  it("Orders schema → picks Freight (DECIMAL), skips OrderID/EmployeeID/ShipVia", () => {
    // OrderID is PK, EmployeeID+ShipVia are FKs → classified as 'id', not 'measure'.
    // Freight is the first non-ID numeric → correct gauge field.
    const result = pickGaugeField(ordersSchema.columns, ordersSchema);
    expect(result.field).toBe("Freight");
  });

  it("Products schema → picks UnitPrice, skips ProductID/SupplierID/CategoryID", () => {
    const result = pickGaugeField(productsSchema.columns, productsSchema);
    expect(result.field).toBe("UnitPrice");
  });

  it("No numeric columns → field is undefined (widget shows placeholder)", () => {
    const result = pickGaugeField(customersSchema.columns);
    expect(result.field).toBeUndefined();
  });

  it("Order Details (all numeric) without table schema → picks first column", () => {
    // Without table schema, no ID-skipping → OrderID is first numeric → first pick.
    const result = pickGaugeField(orderDetailsSchema.columns);
    expect(result.field).toBe("OrderID");
  });

  it("Order Details with table schema → skips OrderID+ProductID (compound PK)", () => {
    // OrderID and ProductID are PKs → 'id' kind → skipped.
    // UnitPrice (DECIMAL) is first non-PK numeric.
    const result = pickGaugeField(orderDetailsSchema.columns, orderDetailsSchema);
    expect(result.field).toBe("UnitPrice");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickProgressField — same measure-selection logic as Gauge
// (both are scalar KPI displays; the difference is Goal vs Min/Max UI)
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickProgressField — same non-ID measure selection as Gauge", () => {
  it("Single measure → returns it as the progress field", () => {
    const result = pickProgressField(totalFreightKpiColumns);
    expect(result.field).toBe("total_freight");
  });

  it("Orders schema → picks Freight, skips ID/FK columns", () => {
    const result = pickProgressField(ordersSchema.columns, ordersSchema);
    expect(result.field).toBe("Freight");
  });

  it("No numeric columns → field is undefined", () => {
    const result = pickProgressField(customersSchema.columns);
    expect(result.field).toBeUndefined();
  });

  it("Gauge and Progress pick the SAME field for the same schema (they share logic)", () => {
    const gauge    = pickGaugeField(ordersSchema.columns, ordersSchema);
    const progress = pickProgressField(ordersSchema.columns, ordersSchema);
    expect(gauge.field).toBe(progress.field);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickTrendFields — first temporal + first non-ID measure
// The Trend widget shows period-over-period change using two query runs.
// ref: SmartScalar uses insights (requires exactly 1 temporal dim).
// RB: same intent — first temporal is the date axis, first measure is the KPI.
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickTrendFields — first temporal column + first non-ID measure", () => {
  it("salesByMonthColumns → dateField=order_month, valueField=total_freight", () => {
    const result = pickTrendFields(salesByMonthColumns);
    expect(result.dateField).toBe("order_month");
    expect(result.valueField).toBe("total_freight");
  });

  it("Orders schema → dateField=OrderDate (first TIMESTAMP), valueField=Freight", () => {
    // Orders columns order: OrderID, CustomerID, EmployeeID, OrderDate(TIMESTAMP),
    // RequiredDate(TIMESTAMP), ShippedDate(TIMESTAMP), ShipVia, Freight(DECIMAL), ...
    // First temporal = OrderDate. First non-ID measure = Freight.
    const result = pickTrendFields(ordersSchema.columns, ordersSchema);
    expect(result.dateField).toBe("OrderDate");
    expect(result.valueField).toBe("Freight");
  });

  it("Products schema (no temporal column) → dateField is undefined", () => {
    // Products has no DATE/TIMESTAMP column. A Trend widget with no date
    // will show a placeholder until the user selects a date dimension.
    const result = pickTrendFields(productsSchema.columns, productsSchema);
    expect(result.dateField).toBeUndefined();
    expect(result.valueField).toBe("UnitPrice");
  });

  it("Customers schema (no numeric at all) → dateField and valueField both undefined", () => {
    const result = pickTrendFields(customersSchema.columns);
    expect(result.dateField).toBeUndefined();
    expect(result.valueField).toBeUndefined();
  });

  it("Single measure + no temporal → dateField undefined, valueField set", () => {
    const result = pickTrendFields(totalFreightKpiColumns);
    expect(result.dateField).toBeUndefined();
    expect(result.valueField).toBe("total_freight");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickDetailDefaults — hide ID columns, show everything else
// ref: object/detail viz hides PK columns by default — MATCH
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickDetailDefaults — ID columns hidden, non-ID columns visible", () => {
  it("Orders schema → OrderID (PK) + EmployeeID + ShipVia (FKs) all hidden", () => {
    const result = pickDetailDefaults(ordersSchema.columns, ordersSchema);
    expect(result.hiddenColumns).toContain("OrderID");
    expect(result.hiddenColumns).toContain("EmployeeID");
    expect(result.hiddenColumns).toContain("ShipVia");
  });

  it("Orders schema → CustomerID (FK varchar) is hidden", () => {
    // CustomerID is a VARCHAR FK — still classified as id → hidden.
    const result = pickDetailDefaults(ordersSchema.columns, ordersSchema);
    expect(result.hiddenColumns).toContain("CustomerID");
  });

  it("Orders schema → Freight and ShipCountry are NOT hidden", () => {
    const result = pickDetailDefaults(ordersSchema.columns, ordersSchema);
    expect(result.hiddenColumns).not.toContain("Freight");
    expect(result.hiddenColumns).not.toContain("ShipCountry");
  });

  it("Products schema → ProductID (PK) + SupplierID + CategoryID (FKs) hidden", () => {
    const result = pickDetailDefaults(productsSchema.columns, productsSchema);
    expect(result.hiddenColumns).toContain("ProductID");
    expect(result.hiddenColumns).toContain("SupplierID");
    expect(result.hiddenColumns).toContain("CategoryID");
  });

  it("Products schema → ProductName and UnitPrice are NOT hidden", () => {
    const result = pickDetailDefaults(productsSchema.columns, productsSchema);
    expect(result.hiddenColumns).not.toContain("ProductName");
    expect(result.hiddenColumns).not.toContain("UnitPrice");
  });

  it("Customers schema (all VARCHAR, no PK schema) → nothing hidden without table schema", () => {
    // Without table schema, isIdColumn can't detect PKs/FKs → nothing hidden.
    const result = pickDetailDefaults(customersSchema.columns);
    expect(result.hiddenColumns).toEqual([]);
  });

  it("Customers schema WITH table schema → CustomerID (PK) hidden", () => {
    const result = pickDetailDefaults(customersSchema.columns, customersSchema);
    expect(result.hiddenColumns).toContain("CustomerID");
    expect(result.hiddenColumns).not.toContain("CompanyName");
  });

  it("Order Details → OrderID + ProductID (compound PK) both hidden", () => {
    const result = pickDetailDefaults(orderDetailsSchema.columns, orderDetailsSchema);
    expect(result.hiddenColumns).toContain("OrderID");
    expect(result.hiddenColumns).toContain("ProductID");
    expect(result.hiddenColumns).not.toContain("UnitPrice");
    expect(result.hiddenColumns).not.toContain("Quantity");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickProgressGoal — derives a "nice ceiling" from the current KPI value
//
// Algorithm: target = value × 1.25; round up to {1,2,2.5,5,10} × 10^n
// ref: tick rounding is the standard approach for Progress goal derivation.
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickProgressGoal — derives a nice ceiling from the current KPI value", () => {
  // | value | target (×1.25) | magnitude | normalised | nice | result |
  // |-------|----------------|-----------|------------|------|--------|
  // |  80   |   100          |   100     |   1.0      |  1   |  100   |
  // | 160   |   200          |   100     |   2.0      |  2   |  200   |
  // | 200   |   250          |   100     |   2.5      | 2.5  |  250   |
  // | 400   |   500          |   100     |   5.0      |  5   |  500   |
  // | 800   |  1000          |  1000     |   1.0      |  1   | 1000   |
  // |4237   |  5296.25       |  1000     |   5.296    |  10  |10000   |

  it("80 → goal 100 (target 100 → normalised 1.0 → nice 1 × 100)", () => {
    expect(pickProgressGoal(80)).toBe(100);
  });

  it("160 → goal 200 (target 200 → normalised 2.0 → nice 2 × 100)", () => {
    expect(pickProgressGoal(160)).toBe(200);
  });

  it("200 → goal 250 (target 250 → normalised 2.5 → nice 2.5 × 100)", () => {
    expect(pickProgressGoal(200)).toBe(250);
  });

  it("400 → goal 500 (target 500 → normalised 5.0 → nice 5 × 100)", () => {
    expect(pickProgressGoal(400)).toBe(500);
  });

  it("800 → goal 1000 (target 1000 → normalised 1.0 × 1000)", () => {
    expect(pickProgressGoal(800)).toBe(1000);
  });

  it("4237.82 (Northwind total_freight) → goal is a clean round number above current value", () => {
    const goal = pickProgressGoal(4237.82);
    expect(goal).toBeGreaterThan(4237.82);
    // Goal should be a nice round number, not a raw floating-point multiply
    expect(goal % 1).toBe(0); // integer or half-integer (2.5× works for 1000s range)
  });

  it("value=0 → goal 100 (fallback for zero-value KPI)", () => {
    expect(pickProgressGoal(0)).toBe(100);
  });

  it("negative value → goal 100 (fallback for invalid/negative KPI)", () => {
    expect(pickProgressGoal(-500)).toBe(100);
  });

  it("NaN → goal 100 (fallback for missing data)", () => {
    expect(pickProgressGoal(NaN)).toBe(100);
  });

  it("goal is always strictly greater than the input value", () => {
    const values = [1, 10, 50, 100, 500, 1000, 5000, 28942.15];
    for (const v of values) {
      expect(pickProgressGoal(v)).toBeGreaterThan(v);
    }
  });

  it("goal grows proportionally — larger values produce proportionally larger goals", () => {
    const g10   = pickProgressGoal(10);
    const g1000 = pickProgressGoal(1000);
    expect(g1000).toBeGreaterThan(g10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cross-widget: measure-picking invariants
// ═══════════════════════════════════════════════════════════════════════════════

describe("Cross-widget invariant — Gauge, Progress, and Trend all skip ID columns", () => {
  it("All three pick the same non-ID field from Orders (Freight)", () => {
    const gauge    = pickGaugeField(ordersSchema.columns, ordersSchema);
    const progress = pickProgressField(ordersSchema.columns, ordersSchema);
    const trend    = pickTrendFields(ordersSchema.columns, ordersSchema);
    expect(gauge.field).toBe("Freight");
    expect(progress.field).toBe("Freight");
    expect(trend.valueField).toBe("Freight");
  });

  it("None of them ever return an ID column name as their primary field", () => {
    const idColumns = new Set(["OrderID", "EmployeeID", "ShipVia", "CustomerID"]);
    const gauge    = pickGaugeField(ordersSchema.columns, ordersSchema);
    const progress = pickProgressField(ordersSchema.columns, ordersSchema);
    const trend    = pickTrendFields(ordersSchema.columns, ordersSchema);
    expect(idColumns.has(gauge.field!)).toBe(false);
    expect(idColumns.has(progress.field!)).toBe(false);
    expect(idColumns.has(trend.valueField!)).toBe(false);
  });
});
