// Sankey auto-pick scenarios — tests for pickSankeyFields().
//
// pickSankeyFields() selects source, target, and value fields for the Sankey
// widget. It sorts non-ID dims by cardinality (ascending), picks the lowest-card
// as source and next as target (with a SANKEY_MAX_TARGET_CARDINALITY guard),
// and uses autoPickMeasure() for the value field.

import {
  pickSankeyFields,
} from "@/lib/explore-data/smart-defaults";

import {
  customerProductFlowColumns,
  customerProductFlowCardinality,
  salesByCountryAndMonthColumns,
  ordersSchema,
} from "./fixtures/northwind.fixture";

describe("Sankey field auto-pick — Customer → Product flow", () => {
  it("Source = lower-cardinality dim, target = higher-cardinality dim", () => {
    // customerProductFlowColumns: [CustomerID(VARCHAR), ProductName(VARCHAR), total_quantity(DOUBLE)]
    // Cardinality: CustomerID=25, ProductName=20
    // Sorted ascending: ProductName(20), CustomerID(25)
    // Source = ProductName (lowest card), Target = CustomerID
    const result = pickSankeyFields(customerProductFlowColumns, {
      cardinality: customerProductFlowCardinality,
    });
    expect(result.sourceField).toBe("ProductName");
    expect(result.targetField).toBe("CustomerID");
  });

  it("Value field = first measure column (total_quantity)", () => {
    const result = pickSankeyFields(customerProductFlowColumns, {
      cardinality: customerProductFlowCardinality,
    });
    expect(result.valueField).toBe("total_quantity");
  });
});

describe("Sankey field auto-pick — no cardinality hints", () => {
  it("Without cardinality, dims stay in schema order", () => {
    // No cardinality → sort is a no-op → schema order preserved
    const result = pickSankeyFields(customerProductFlowColumns);
    // Source = first dim in schema order = CustomerID
    expect(result.sourceField).toBe("CustomerID");
    expect(result.targetField).toBe("ProductName");
  });
});

describe("Sankey field auto-pick — ID column filtering", () => {
  it("With table schema, ID columns are filtered out of source/target candidates", () => {
    // ordersSchema: OrderID is PK, CustomerID/EmployeeID/ShipVia are FKs
    // Only non-ID dims: CustomerID(VARCHAR), ShipName(VARCHAR), ShipAddress(VARCHAR),
    //   ShipCity(VARCHAR), ShipRegion(VARCHAR), ShipPostalCode(VARCHAR), ShipCountry(VARCHAR)
    // OrderDate/RequiredDate/ShippedDate are temporal → dims but not ID
    // Freight is measure
    const result = pickSankeyFields(ordersSchema.columns, {
      tableSchema: ordersSchema,
    });
    // OrderID (PK) should NOT be source or target
    expect(result.sourceField).not.toBe("OrderID");
    expect(result.targetField).not.toBe("OrderID");
    // Value should be Freight (first non-ID measure)
    expect(result.valueField).toBe("Freight");
  });
});

describe("Sankey field auto-pick — high-cardinality target guard", () => {
  // | Max dimension cardinality for Sankey = 100 |
  // | High-card columns are excluded from pool entirely — no fallback |
  // | When no valid target remains, targetField=undefined → isSensible=false |
  it("Target with cardinality > SANKEY_MAX (100) is excluded — no fallback (prevents meltdown)", () => {
    // customerProductFlowColumns: [CustomerID(VARCHAR), ProductName(VARCHAR), total_quantity(DOUBLE)]
    // cardinality: CustomerID=25, ProductName=300
    // Sorted: CustomerID(25) → source, ProductName(300) → fails targetOk (300>100)
    // No fallback → targetField=undefined → Sankey not sensible for this data
    const result = pickSankeyFields(customerProductFlowColumns, {
      cardinality: { CustomerID: 25, ProductName: 300 },
    });
    expect(result.sourceField).toBe("CustomerID");
    // ProductName=300 > 100 → excluded from target pool, no fallback
    expect(result.targetField).toBeUndefined();
  });
});

describe("Sankey field auto-pick — no measure columns", () => {
  it("No measure columns → valueField is undefined", () => {
    // salesByCountryAndMonthColumns has ShipCountry(VARCHAR), order_month(DATE), total_freight(DOUBLE)
    // Remove the measure to test the no-measure case
    const noMeasureCols = salesByCountryAndMonthColumns.filter(
      (c) => c.typeName !== "DOUBLE",
    );
    const result = pickSankeyFields(noMeasureCols);
    expect(result.valueField).toBeUndefined();
  });
});
