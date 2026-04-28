// Northwind test fixture.
//
// Mirrors what the Java NorthwindDataGenerator at
// bkend/common/src/main/java/com/sourcekraft/documentburster/common/db/northwind/NorthwindDataGenerator.java
// produces when it populates the SQLite Northwind database.
//
// Every test file in this folder imports named variables from here and feeds
// them into the smart-defaults library. The names match business artifacts
// (`customersSchema`, `salesByMonthResult`) not library types. A failing test
// reads like "Map no longer recommended for Nancy's customer list", not a
// technical symbol soup.
//
// If NorthwindDataGenerator.java changes (new column, new row), update the
// corresponding constant here. The shape + sample data are the contract
// between backend and smart-defaults.

import type { ColumnSchema, TableSchema, QueryResult } from "../../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";
import type { WidgetType } from "../../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/stores/canvas-store";
import { ALL_WIDGETS } from "../../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/smart-defaults/widget-sensibility";

// ═══════════════════════════════════════════════════════════════════════════
// TABLE SCHEMAS — what the user sees when they click a table in the left panel
// ═══════════════════════════════════════════════════════════════════════════

export const categoriesSchema: TableSchema = {
  tableName: "Categories",
  tableType: "TABLE",
  primaryKeyColumns: ["CategoryID"],
  columns: [
    { columnName: "CategoryID",   typeName: "INTEGER", isNullable: false },
    { columnName: "CategoryName", typeName: "VARCHAR", isNullable: false },
    { columnName: "Description",  typeName: "CLOB",    isNullable: true  },
  ],
};

export const customersSchema: TableSchema = {
  tableName: "Customers",
  tableType: "TABLE",
  primaryKeyColumns: ["CustomerID"],
  columns: [
    { columnName: "CustomerID",   typeName: "VARCHAR", isNullable: false },
    { columnName: "CompanyName",  typeName: "VARCHAR", isNullable: false },
    { columnName: "ContactName",  typeName: "VARCHAR", isNullable: true  },
    { columnName: "ContactTitle", typeName: "VARCHAR", isNullable: true  },
    { columnName: "Address",      typeName: "VARCHAR", isNullable: true  },
    { columnName: "City",         typeName: "VARCHAR", isNullable: true  },
    { columnName: "Region",       typeName: "VARCHAR", isNullable: true  },
    { columnName: "PostalCode",   typeName: "VARCHAR", isNullable: true  },
    { columnName: "Country",      typeName: "VARCHAR", isNullable: true  },
    { columnName: "Phone",        typeName: "VARCHAR", isNullable: true  },
    { columnName: "Fax",          typeName: "VARCHAR", isNullable: true  },
    { columnName: "Email",        typeName: "VARCHAR", isNullable: true  },
  ],
};

export const employeesSchema: TableSchema = {
  tableName: "Employees",
  tableType: "TABLE",
  primaryKeyColumns: ["EmployeeID"],
  foreignKeys: [
    { fkColumnName: "ReportsTo", pkTableName: "Employees", pkColumnName: "EmployeeID" },
  ],
  columns: [
    { columnName: "EmployeeID",      typeName: "INTEGER",  isNullable: false },
    { columnName: "LastName",        typeName: "VARCHAR",  isNullable: false },
    { columnName: "FirstName",       typeName: "VARCHAR",  isNullable: false },
    { columnName: "Title",           typeName: "VARCHAR",  isNullable: true  },
    { columnName: "TitleOfCourtesy", typeName: "VARCHAR",  isNullable: true  },
    { columnName: "BirthDate",       typeName: "DATE",     isNullable: true  },
    { columnName: "HireDate",        typeName: "DATE",     isNullable: true  },
    { columnName: "Address",         typeName: "VARCHAR",  isNullable: true  },
    { columnName: "City",            typeName: "VARCHAR",  isNullable: true  },
    { columnName: "Region",          typeName: "VARCHAR",  isNullable: true  },
    { columnName: "PostalCode",      typeName: "VARCHAR",  isNullable: true  },
    { columnName: "Country",         typeName: "VARCHAR",  isNullable: true  },
    { columnName: "HomePhone",       typeName: "VARCHAR",  isNullable: true  },
    { columnName: "Email",           typeName: "VARCHAR",  isNullable: true  },
    { columnName: "ReportsTo",       typeName: "INTEGER",  isNullable: true  },
  ],
};

export const ordersSchema: TableSchema = {
  tableName: "Orders",
  tableType: "TABLE",
  primaryKeyColumns: ["OrderID"],
  foreignKeys: [
    { fkColumnName: "CustomerID", pkTableName: "Customers", pkColumnName: "CustomerID" },
    { fkColumnName: "EmployeeID", pkTableName: "Employees", pkColumnName: "EmployeeID" },
    { fkColumnName: "ShipVia",    pkTableName: "Shippers",  pkColumnName: "ShipperID"  },
  ],
  columns: [
    { columnName: "OrderID",        typeName: "INTEGER",   isNullable: false },
    { columnName: "CustomerID",     typeName: "VARCHAR",   isNullable: true  },
    { columnName: "EmployeeID",     typeName: "INTEGER",   isNullable: true  },
    { columnName: "OrderDate",      typeName: "TIMESTAMP", isNullable: true  },
    { columnName: "RequiredDate",   typeName: "TIMESTAMP", isNullable: true  },
    { columnName: "ShippedDate",    typeName: "TIMESTAMP", isNullable: true  },
    { columnName: "ShipVia",        typeName: "INTEGER",   isNullable: true  },
    { columnName: "Freight",        typeName: "DECIMAL",   isNullable: true  },
    { columnName: "ShipName",       typeName: "VARCHAR",   isNullable: true  },
    { columnName: "ShipAddress",    typeName: "VARCHAR",   isNullable: true  },
    { columnName: "ShipCity",       typeName: "VARCHAR",   isNullable: true  },
    { columnName: "ShipRegion",     typeName: "VARCHAR",   isNullable: true  },
    { columnName: "ShipPostalCode", typeName: "VARCHAR",   isNullable: true  },
    { columnName: "ShipCountry",    typeName: "VARCHAR",   isNullable: true  },
  ],
};

export const productsSchema: TableSchema = {
  tableName: "Products",
  tableType: "TABLE",
  primaryKeyColumns: ["ProductID"],
  foreignKeys: [
    { fkColumnName: "SupplierID", pkTableName: "Suppliers",  pkColumnName: "SupplierID" },
    { fkColumnName: "CategoryID", pkTableName: "Categories", pkColumnName: "CategoryID" },
  ],
  columns: [
    { columnName: "ProductID",       typeName: "INTEGER",  isNullable: false },
    { columnName: "ProductName",     typeName: "VARCHAR",  isNullable: false },
    { columnName: "SupplierID",      typeName: "INTEGER",  isNullable: true  },
    { columnName: "CategoryID",      typeName: "INTEGER",  isNullable: true  },
    { columnName: "QuantityPerUnit", typeName: "VARCHAR",  isNullable: true  },
    { columnName: "UnitPrice",       typeName: "DECIMAL",  isNullable: true  },
    { columnName: "UnitsInStock",    typeName: "SMALLINT", isNullable: true  },
    { columnName: "UnitsOnOrder",    typeName: "SMALLINT", isNullable: true  },
    { columnName: "ReorderLevel",    typeName: "SMALLINT", isNullable: true  },
    { columnName: "Discontinued",    typeName: "BOOLEAN",  isNullable: false },
  ],
};

export const shippersSchema: TableSchema = {
  tableName: "Shippers",
  tableType: "TABLE",
  primaryKeyColumns: ["ShipperID"],
  columns: [
    { columnName: "ShipperID",   typeName: "INTEGER", isNullable: false },
    { columnName: "CompanyName", typeName: "VARCHAR", isNullable: false },
    { columnName: "Phone",       typeName: "VARCHAR", isNullable: true  },
  ],
};

export const suppliersSchema: TableSchema = {
  tableName: "Suppliers",
  tableType: "TABLE",
  primaryKeyColumns: ["SupplierID"],
  columns: [
    { columnName: "SupplierID",   typeName: "INTEGER", isNullable: false },
    { columnName: "CompanyName",  typeName: "VARCHAR", isNullable: false },
    { columnName: "ContactName",  typeName: "VARCHAR", isNullable: true  },
    { columnName: "ContactTitle", typeName: "VARCHAR", isNullable: true  },
    { columnName: "Address",      typeName: "VARCHAR", isNullable: true  },
    { columnName: "City",         typeName: "VARCHAR", isNullable: true  },
    { columnName: "Region",       typeName: "VARCHAR", isNullable: true  },
    { columnName: "PostalCode",   typeName: "VARCHAR", isNullable: true  },
    { columnName: "Country",      typeName: "VARCHAR", isNullable: true  },
    { columnName: "Phone",        typeName: "VARCHAR", isNullable: true  },
  ],
};

export const orderDetailsSchema: TableSchema = {
  tableName: "Order Details",
  tableType: "TABLE",
  primaryKeyColumns: ["OrderID", "ProductID"],
  foreignKeys: [
    { fkColumnName: "OrderID",   pkTableName: "Orders",   pkColumnName: "OrderID"   },
    { fkColumnName: "ProductID", pkTableName: "Products", pkColumnName: "ProductID" },
  ],
  columns: [
    { columnName: "OrderID",   typeName: "INTEGER",  isNullable: false },
    { columnName: "ProductID", typeName: "INTEGER",  isNullable: false },
    { columnName: "UnitPrice", typeName: "DECIMAL",  isNullable: false },
    { columnName: "Quantity",  typeName: "SMALLINT", isNullable: false },
    { columnName: "Discount",  typeName: "DECIMAL",  isNullable: false },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CARDINALITY — distinct-value counts a probeCardinality() call would return
// Values computed from the Java generator's full insert set.
// ═══════════════════════════════════════════════════════════════════════════

export const customersCardinality: Record<string, number> = {
  CustomerID:   25,
  CompanyName:  25,
  ContactName:  25,
  ContactTitle: 9,
  City:         24,
  Region:       4,
  PostalCode:   25,
  Country:      10,
};

export const ordersCardinality: Record<string, number> = {
  OrderID:     79,
  CustomerID:  25,
  EmployeeID:  3,
  ShipVia:     3,
  ShipCity:    24,
  ShipRegion:  4,
  ShipCountry: 10,
};

export const productsCardinality: Record<string, number> = {
  ProductID:    20,
  ProductName:  20,
  SupplierID:   6,
  CategoryID:   8,
  Discontinued: 2,
};

export const employeesCardinality: Record<string, number> = {
  EmployeeID: 3,
  Title:      2,
  City:       3,
  Country:    1,
};

// ═══════════════════════════════════════════════════════════════════════════
// PRE-AGGREGATED QUERY RESULTS — what the SQL builder produces for common
// analytical questions. Paired with a `*Columns` ColumnSchema[] mirroring
// what `inferColumnsFromRow` would synthesize from the first result row.
// ═══════════════════════════════════════════════════════════════════════════

// ── "The CFO asks: what did we spend on shipping this year?"
//    SELECT SUM(Freight) AS total_freight FROM Orders
export const totalFreightKpiResult: QueryResult = {
  rowCount: 1,
  data: [{ total_freight: 4237.82 }],
};
export const totalFreightKpiColumns: ColumnSchema[] = [
  { columnName: "total_freight", typeName: "DOUBLE", isNullable: true },
];

// ── "How many orders did we process?"
//    SELECT COUNT(*) AS order_count FROM Orders
export const orderCountKpiResult: QueryResult = {
  rowCount: 1,
  data: [{ order_count: 79 }],
};
export const orderCountKpiColumns: ColumnSchema[] = [
  { columnName: "order_count", typeName: "DOUBLE", isNullable: true },
];

// ── "What's our total revenue?"
//    SELECT SUM(UnitPrice*Quantity) AS total_revenue FROM "Order Details"
export const totalRevenueKpiResult: QueryResult = {
  rowCount: 1,
  data: [{ total_revenue: 28942.15 }],
};
export const totalRevenueKpiColumns: ColumnSchema[] = [
  { columnName: "total_revenue", typeName: "DOUBLE", isNullable: true },
];

// ── "Show me monthly sales" (the classic time-series chart)
//    SELECT MONTH(OrderDate), SUM(Freight) FROM Orders GROUP BY 1 ORDER BY 1
//    ~18 months of generated data.
export const salesByMonthResult: QueryResult = {
  rowCount: 18,
  data: [
    { order_month: "2023-01", total_freight: 185.42 },
    { order_month: "2023-02", total_freight: 212.10 },
    { order_month: "2023-03", total_freight: 238.55 },
    { order_month: "2023-04", total_freight: 264.30 },
    { order_month: "2023-05", total_freight: 221.17 },
    { order_month: "2023-06", total_freight: 189.45 },
    { order_month: "2023-07", total_freight: 201.88 },
    { order_month: "2023-08", total_freight: 267.12 },
    { order_month: "2023-09", total_freight: 298.64 },
    { order_month: "2023-10", total_freight: 315.77 },
    { order_month: "2023-11", total_freight: 288.50 },
    { order_month: "2023-12", total_freight: 276.33 },
    { order_month: "2024-01", total_freight: 242.90 },
    { order_month: "2024-02", total_freight: 258.15 },
    { order_month: "2024-03", total_freight: 280.44 },
    { order_month: "2024-04", total_freight: 195.80 },
    { order_month: "2024-05", total_freight: 245.75 },
    { order_month: "2024-06", total_freight: 359.55 },
  ],
};
export const salesByMonthColumns: ColumnSchema[] = [
  { columnName: "order_month",   typeName: "DATE",   isNullable: true },
  { columnName: "total_freight", typeName: "DOUBLE", isNullable: true },
];

// ── "Sales by country" (choropleth map territory)
//    SELECT ShipCountry, SUM(Freight) FROM Orders GROUP BY 1 ORDER BY 2 DESC
export const salesByCountryResult: QueryResult = {
  rowCount: 10,
  data: [
    { ShipCountry: "Germany",   total_freight: 1845.22 },
    { ShipCountry: "USA",        total_freight:  612.44 },
    { ShipCountry: "Sweden",     total_freight:  395.18 },
    { ShipCountry: "France",     total_freight:  318.75 },
    { ShipCountry: "UK",         total_freight:  298.50 },
    { ShipCountry: "Mexico",     total_freight:  215.33 },
    { ShipCountry: "Austria",    total_freight:  180.22 },
    { ShipCountry: "Argentina",  total_freight:  145.10 },
    { ShipCountry: "Venezuela",  total_freight:  135.60 },
    { ShipCountry: "Italy",      total_freight:   91.48 },
  ],
};
export const salesByCountryColumns: ColumnSchema[] = [
  { columnName: "ShipCountry",   typeName: "VARCHAR", isNullable: true },
  { columnName: "total_freight", typeName: "DOUBLE",  isNullable: true },
];

// ── "Top 10 products by revenue"
//    SELECT p.ProductName, SUM(od.UnitPrice*od.Quantity) FROM "Order Details" od
//    JOIN Products p USING(ProductID) GROUP BY p.ProductName ORDER BY 2 DESC LIMIT 10
export const top10ProductsByRevenueResult: QueryResult = {
  rowCount: 10,
  data: [
    { ProductName: "Thuringer Rostbratwurst",        revenue: 3890.15 },
    { ProductName: "Mishi Kobe Niku",                revenue: 2910.00 },
    { ProductName: "Gnocchi di nonna Alice",         revenue: 2356.80 },
    { ProductName: "Camembert Pierrot",              revenue: 2108.50 },
    { ProductName: "Ikura",                          revenue: 1890.30 },
    { ProductName: "Uncle Bobs Organic Dried Pears", revenue: 1620.00 },
    { ProductName: "Tofu",                           revenue: 1465.25 },
    { ProductName: "Queso Cabrales",                 revenue: 1338.00 },
    { ProductName: "Boston Crab Meat",               revenue: 1214.40 },
    { ProductName: "Ravioli Angelo",                 revenue: 1075.50 },
  ],
};
export const top10ProductsByRevenueColumns: ColumnSchema[] = [
  { columnName: "ProductName", typeName: "VARCHAR", isNullable: true },
  { columnName: "revenue",     typeName: "DOUBLE",  isNullable: true },
];

// ── "Products per category" (low-cardinality pie territory)
//    SELECT c.CategoryName, COUNT(*) FROM Products p JOIN Categories c USING(CategoryID) GROUP BY c.CategoryName
export const productsPerCategoryResult: QueryResult = {
  rowCount: 8,
  data: [
    { CategoryName: "Beverages",     product_count: 3 },
    { CategoryName: "Condiments",    product_count: 3 },
    { CategoryName: "Confections",   product_count: 2 },
    { CategoryName: "Dairy Products", product_count: 3 },
    { CategoryName: "Grains/Cereals", product_count: 3 },
    { CategoryName: "Meat/Poultry",   product_count: 2 },
    { CategoryName: "Produce",        product_count: 2 },
    { CategoryName: "Seafood",        product_count: 2 },
  ],
};
export const productsPerCategoryColumns: ColumnSchema[] = [
  { columnName: "CategoryName",  typeName: "VARCHAR", isNullable: true },
  { columnName: "product_count", typeName: "DOUBLE",  isNullable: true },
];

// ── "Orders by shipper" (3-slice pie — Speedy vs United vs Federal)
export const ordersByShipperResult: QueryResult = {
  rowCount: 3,
  data: [
    { CompanyName: "Speedy Express",   order_count: 28 },
    { CompanyName: "United Package",    order_count: 31 },
    { CompanyName: "Federal Shipping",  order_count: 20 },
  ],
};
export const ordersByShipperColumns: ColumnSchema[] = [
  { columnName: "CompanyName", typeName: "VARCHAR", isNullable: true },
  { columnName: "order_count", typeName: "DOUBLE",  isNullable: true },
];

// ── "Sales by country AND month" (2 dims + 1 measure → pivot territory)
//    SELECT ShipCountry, MONTH(OrderDate), SUM(Freight) FROM Orders GROUP BY 1,2
//    ~100 rows of country × month combinations.
export const salesByCountryAndMonthResult: QueryResult = {
  rowCount: 120,
  data: [
    { ShipCountry: "Germany", order_month: "2024-01", total_freight: 320.15 },
    { ShipCountry: "Germany", order_month: "2024-02", total_freight: 285.40 },
    { ShipCountry: "Germany", order_month: "2024-03", total_freight: 412.22 },
    { ShipCountry: "USA",     order_month: "2024-01", total_freight: 95.10  },
    { ShipCountry: "USA",     order_month: "2024-02", total_freight: 108.75 },
    // ... 115 more rows in the real query; this sample is enough for shape-driven tests
  ],
};
export const salesByCountryAndMonthColumns: ColumnSchema[] = [
  { columnName: "ShipCountry",   typeName: "VARCHAR", isNullable: true },
  { columnName: "order_month",   typeName: "DATE",    isNullable: true },
  { columnName: "total_freight", typeName: "DOUBLE",  isNullable: true },
];

// ── "Customer → Product flow" (Sankey territory)
//    SELECT CustomerID, ProductName, SUM(Quantity) FROM ...
export const customerProductFlowResult: QueryResult = {
  rowCount: 150,
  data: [
    { CustomerID: "ALFKI", ProductName: "Chai",            total_quantity: 12 },
    { CustomerID: "ALFKI", ProductName: "Chang",           total_quantity: 10 },
    { CustomerID: "ANATR", ProductName: "Aniseed Syrup",   total_quantity: 13 },
    { CustomerID: "BERGS", ProductName: "Boston Crab Meat", total_quantity: 8  },
    // ... 146 more rows
  ],
};
export const customerProductFlowColumns: ColumnSchema[] = [
  { columnName: "CustomerID",     typeName: "VARCHAR", isNullable: true },
  { columnName: "ProductName",    typeName: "VARCHAR", isNullable: true },
  { columnName: "total_quantity", typeName: "DOUBLE",  isNullable: true },
];

export const customerProductFlowCardinality: Record<string, number> = {
  CustomerID:  25,
  ProductName: 20,
};

// ── "Customer → Country flow" (2 cat dims + measure; one dim is geo, no date)
//    SELECT CustomerID, ShipCountry, SUM(Freight) FROM Orders GROUP BY ...
// Pins: dims>=2 takes priority over single-geo choropleth.
export const customerCountryFlowResult: QueryResult = {
  rowCount: 120,
  data: [
    { CustomerID: "ALFKI", ShipCountry: "Germany", total_freight: 234.50 },
    { CustomerID: "ANATR", ShipCountry: "Mexico",  total_freight: 156.20 },
    { CustomerID: "BERGS", ShipCountry: "Sweden",  total_freight: 412.80 },
    // ... 117 more rows
  ],
};
export const customerCountryFlowColumns: ColumnSchema[] = [
  { columnName: "CustomerID",    typeName: "VARCHAR", isNullable: true },
  { columnName: "ShipCountry",   typeName: "VARCHAR", isNullable: true },
  { columnName: "total_freight", typeName: "DOUBLE",  isNullable: true },
];
export const customerCountryFlowCardinality: Record<string, number> = {
  CustomerID:  25,
  ShipCountry: 21,
};

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL RECOMMENDED LISTS (what the user sees in the "Visualize as" panel,
// position 0 to N-1). Each constant = the full ordered recommendation array
// that `groupWidgetsBySensibility(...).recommended` should return for a given
// data shape. Tests assert `toEqual(SHAPE_..._RB)` so any reordering is caught.
//
// REFERENCE_SHAPE_* constants capture the equivalent recommendation from the
// reference BI system for the same input. They use the reference system's own
// widget/subtype names (bar, line, scalar, table, …). In parity assertions the
// test calls canonicalize(REFERENCE_SHAPE_*) to fold those names into RB widget
// families and then compares sorted lists. Intentional divergences are documented
// inline with a "Divergence:" comment and asserted explicitly.
// ═══════════════════════════════════════════════════════════════════════════

// Raw table drop, HAS geo (Country/State/lat+lon), NO usable measure.
// Examples: Customers, Employees, Suppliers.
// Divergence: ref returns [table, pivot] (no metric → map/scatter fail sensibility;
//   object/detail has no equivalent isSensible). RB adds map for geo browsing and
//   detail for single-row inspection even without aggregation.
export const SHAPE_RAW_GEO_NO_MEASURE_RB: WidgetType[] = ["tabulator", "map", "detail"];
export const REFERENCE_SHAPE_RAW_GEO_NO_MEASURE = ["table", "pivot"];

// Raw table drop, HAS geo, HAS measure (e.g. Orders has ShipCountry + Freight).
// Same RB output as above — raw-drop rule bypasses the measure check.
// Divergence: ref returns a full chart cascade (string dim + metric → cartesian
//   sensible) plus map. RB keeps the raw-drop rule: table+map+detail only.
export const SHAPE_RAW_GEO_WITH_MEASURE_RB: WidgetType[] = ["tabulator", "map", "detail"];
export const REFERENCE_SHAPE_RAW_GEO_WITH_MEASURE = [
  "table", "line", "area", "bar", "combo", "row", "scatter", "pie", "waterfall", "map", "pivot",
];

// Raw table drop, NO geo, NO usable measure.
// Examples: Categories, Shippers.
// Divergence: ref returns [table, pivot]. RB adds detail.
export const SHAPE_RAW_NO_GEO_NO_MEASURE_RB: WidgetType[] = ["tabulator", "detail"];
export const REFERENCE_SHAPE_RAW_NO_GEO_NO_MEASURE = ["table", "pivot"];

// Raw table drop, NO geo, HAS measure (e.g. Products with UnitPrice).
// Divergence: ref returns a chart cascade (string dim + metric sensible). RB
//   keeps raw-drop rule: table+detail only (no cartesian recommendations for
//   unaggregated data).
export const SHAPE_RAW_NO_GEO_WITH_MEASURE_RB: WidgetType[] = ["tabulator", "detail"];
export const REFERENCE_SHAPE_RAW_NO_GEO_WITH_MEASURE = [
  "table", "line", "area", "bar", "combo", "row", "scatter", "pie", "pivot",
];

// Aggregated single-row scalar, 1 measure (SUM / COUNT / AVG on whole table).
// Divergence: ref includes table in the scalar branch (rows≤1 → all isSensible
//   checks skipped; table always passes). RB omits tabulator from the scalar
//   KPI palette because a grid view of 1 row adds no value. Also: ref returns
//   progress before gauge; RB returns gauge before progress.
export const SHAPE_SCALAR_KPI_RB: WidgetType[] = ["number", "gauge", "progress"];
export const REFERENCE_SHAPE_SCALAR_KPI = ["scalar", "progress", "gauge", "table"];

// Aggregated single-row scalar, 2+ measures (e.g. SELECT SUM(Freight), COUNT(OrderID)).
// number/gauge/progress silently drop extra metrics — tabulator/detail show ALL columns.
// Matches reference: rowCount=1 + cols>1 + dimCount=0 → ["table","object"].
export const SHAPE_SCALAR_KPI_MULTI_RB: WidgetType[] = ["tabulator", "detail"];
export const REFERENCE_SHAPE_SCALAR_KPI_MULTI = ["table", "object"];

// Aggregated temporal + measure, 1 dim (e.g. Sales by month).
// Trend = summary sparkline card. Pivot now recommended (1 dim is enough for cross-tab).
// Match: canonicalize(REFERENCE) sorted = [chart, pivot, tabulator, trend] ✓
export const SHAPE_DATE_MEASURE_1DIM_RB: WidgetType[] = ["chart", "trend", "tabulator", "pivot"];
export const REFERENCE_SHAPE_DATE_MEASURE_1DIM = [
  "line", "area", "bar", "combo", "smartscalar", "row", "waterfall", "scatter", "pie", "table", "pivot",
];

// Aggregated geo + measure, 1 dim (e.g. Sales by country).
// Map = choropleth (primary). Chart = bar-ranking of countries (secondary).
// Pivot now sensible for 1 dim (isSensibleWidget relaxed to dims.length >= 1).
// Match: canonicalize(REFERENCE) = [map, chart, tabulator] ✓
export const SHAPE_GEO_MEASURE_1DIM_RB: WidgetType[] = ["map", "chart", "tabulator"];
export const REFERENCE_SHAPE_GEO_MEASURE_1DIM = [
  "map", "bar", "row", "pie", "line", "area", "combo", "waterfall", "scatter", "table",
];

// Aggregated categorical + measure, 1 non-geo non-date dim (e.g. Top products,
// Products per category, Orders by shipper).
// Match: canonicalize(REFERENCE) sorted = [chart, pivot, tabulator] ✓
export const SHAPE_CAT_MEASURE_1DIM_RB: WidgetType[] = ["chart", "tabulator", "pivot"];
export const REFERENCE_SHAPE_CAT_MEASURE_1DIM = [
  "bar", "row", "pie", "line", "area", "combo", "waterfall", "scatter", "table", "pivot",
];

// 1 categorical dim, 0 measures (e.g. SELECT CategoryName FROM Categories).
// Chart is not sensible (isSensibleWidget requires measureCount >= 1).
// Reference: ["table","pivot"]. We add detail (per-row reader, rowCount >= 1 sensible).
export const SHAPE_DIM_ONLY_1DIM_RB: WidgetType[] = ["tabulator", "pivot", "detail"];
export const REFERENCE_SHAPE_DIM_ONLY_1DIM = ["table", "pivot"];

// Aggregated 2 dims + measure, ONE DIM IS DATE (e.g. Country × Month,
// Employee × Month). Date-branch wins — Pivot is recommended (2 dims ok).
// Divergence: ref shows map when a geo dim is present; RB drops map when date
//   is the primary breakout (date-series is the dominant intent). RB adds
//   pivot and tabulator which ref omits.
export const SHAPE_DATE_CAT_MEASURE_2DIMS_RB: WidgetType[] = ["chart", "trend", "tabulator", "pivot"];
export const REFERENCE_SHAPE_DATE_CAT_MEASURE_2DIMS = [
  "map", "line", "area", "bar", "combo", "smartscalar", "row", "waterfall", "scatter", "pie",
]; // with geo present; without geo, drop "map"

// Aggregated 2 low-card non-date dims + measure (Sankey territory,
// e.g. Customer → Product flow).
// Match: canonicalize(REFERENCE) sorted = [chart, pivot, sankey, tabulator] ✓
export const SHAPE_TWO_CAT_DIMS_MEASURE_RB: WidgetType[] = ["chart", "pivot", "sankey", "tabulator"];
export const REFERENCE_SHAPE_TWO_CAT_DIMS_MEASURE = [
  "bar", "row", "pie", "line", "area", "combo", "scatter", "boxplot", "table", "pivot", "sankey",
]; // waterfall filtered (2 dims, needs exactly 1)

// Empty / pre-data state — palette shows no recommendation.
// Divergence: ref returns ["table"] for 0-column results. RB stays neutral
//   (no recommendation) until data lands so the user isn't surprised by a
//   pre-populated widget.
export const SHAPE_EMPTY_RB: WidgetType[] = [];
export const REFERENCE_SHAPE_EMPTY = ["table"];

// ── "Employee performance by month" (date + cat dim + measure)
//    SELECT LastName, MONTH(OrderDate), SUM(Freight) FROM Orders JOIN Employees
export const employeePerformanceByMonthResult: QueryResult = {
  rowCount: 54,
  data: [
    { LastName: "Davolio",   order_month: "2024-01", total_freight: 145.30 },
    { LastName: "Fuller",    order_month: "2024-01", total_freight: 98.50  },
    { LastName: "Leverling", order_month: "2024-01", total_freight: 172.10 },
    // ... one row per employee per month
  ],
};
export const employeePerformanceByMonthColumns: ColumnSchema[] = [
  { columnName: "LastName",      typeName: "VARCHAR", isNullable: true },
  { columnName: "order_month",   typeName: "DATE",    isNullable: true },
  { columnName: "total_freight", typeName: "DOUBLE",  isNullable: true },
];

// ── "Orders by day-of-week" (extraction, not truncation — categorical!)
//    Bar should beat line here because DOW is not a true timeline.
export const ordersByDayOfWeekResult: QueryResult = {
  rowCount: 7,
  data: [
    { day_of_week: "Monday",    order_count: 12 },
    { day_of_week: "Tuesday",   order_count: 14 },
    { day_of_week: "Wednesday", order_count: 11 },
    { day_of_week: "Thursday",  order_count: 13 },
    { day_of_week: "Friday",    order_count: 15 },
    { day_of_week: "Saturday",  order_count: 8  },
    { day_of_week: "Sunday",    order_count: 6  },
  ],
};
export const ordersByDayOfWeekColumns: ColumnSchema[] = [
  { columnName: "day_of_week", typeName: "VARCHAR", isNullable: true },
  { columnName: "order_count", typeName: "DOUBLE",  isNullable: true },
];

// ── "Top 15 customers by order count" — high-card dim, pie should be demoted
export const topCustomersByOrderCountResult: QueryResult = {
  rowCount: 15,
  data: [
    { CompanyName: "Alfreds Futterkiste", order_count: 6 },
    { CompanyName: "QUICK-Stop",          order_count: 5 },
    { CompanyName: "Königlich Essen",     order_count: 5 },
    { CompanyName: "Frankenversand",      order_count: 4 },
    { CompanyName: "Lehmanns Marktstand", order_count: 4 },
    { CompanyName: "Blauer See Delikatessen", order_count: 4 },
    { CompanyName: "Ernst Handel",        order_count: 4 },
    { CompanyName: "Berglunds snabbköp",  order_count: 3 },
    { CompanyName: "Drachenblut Delikatessen", order_count: 3 },
    { CompanyName: "Around the Horn",     order_count: 3 },
    { CompanyName: "Bon app'",            order_count: 3 },
    { CompanyName: "Ana Trujillo",        order_count: 3 },
    { CompanyName: "Great Lakes Food Market", order_count: 2 },
    { CompanyName: "Magazzini Alimentari", order_count: 2 },
    { CompanyName: "Folk och fä HB",      order_count: 2 },
  ],
};
export const topCustomersByOrderCountColumns: ColumnSchema[] = [
  { columnName: "CompanyName", typeName: "VARCHAR", isNullable: true },
  { columnName: "order_count", typeName: "DOUBLE",  isNullable: true },
];

// ── "Warehouse stock-by-category (lat/lon pin-map territory)"
//    Hypothetical warehouse table with lat/lon — tests point-map detection.
export const warehouseLocationsColumns: ColumnSchema[] = [
  { columnName: "WarehouseID", typeName: "INTEGER", isNullable: false },
  { columnName: "City",        typeName: "VARCHAR", isNullable: true  },
  { columnName: "Latitude",    typeName: "DOUBLE",  isNullable: true  },
  { columnName: "Longitude",   typeName: "DOUBLE",  isNullable: true  },
  { columnName: "StockValue",  typeName: "DECIMAL", isNullable: true  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BRANCH_SHAPE_* — single source of truth for palette expectations.
//
// Each object carries BOTH mainGrid (recommended) and moreWidgets (nonsensible).
// moreWidgets is computed as ALL_WIDGETS minus mainGrid — never hardcoded.
// Import and spread these in E2E specs instead of writing inline arrays.
// ═══════════════════════════════════════════════════════════════════════════

function complement(mainGrid: WidgetType[]): WidgetType[] {
  const set = new Set(mainGrid);
  return ALL_WIDGETS.filter(w => !set.has(w));
}

export const BRANCH_SHAPE_RAW_GEO = {
  mainGrid: SHAPE_RAW_GEO_NO_MEASURE_RB,
  moreWidgets: complement(SHAPE_RAW_GEO_NO_MEASURE_RB),
};

export const BRANCH_SHAPE_RAW_NO_GEO = {
  mainGrid: SHAPE_RAW_NO_GEO_NO_MEASURE_RB,
  moreWidgets: complement(SHAPE_RAW_NO_GEO_NO_MEASURE_RB),
};

export const BRANCH_SHAPE_SCALAR_KPI = {
  mainGrid: SHAPE_SCALAR_KPI_RB,
  moreWidgets: complement(SHAPE_SCALAR_KPI_RB),
};

export const BRANCH_SHAPE_K1_MULTI = {
  mainGrid: SHAPE_SCALAR_KPI_MULTI_RB,
  moreWidgets: complement(SHAPE_SCALAR_KPI_MULTI_RB),
};

export const BRANCH_SHAPE_DATE_MEASURE = {
  mainGrid: SHAPE_DATE_MEASURE_1DIM_RB,
  moreWidgets: complement(SHAPE_DATE_MEASURE_1DIM_RB),
};

export const BRANCH_SHAPE_GEO_MEASURE = {
  mainGrid: SHAPE_GEO_MEASURE_1DIM_RB,
  moreWidgets: complement(SHAPE_GEO_MEASURE_1DIM_RB),
};

export const BRANCH_SHAPE_CAT_MEASURE = {
  mainGrid: SHAPE_CAT_MEASURE_1DIM_RB,
  moreWidgets: complement(SHAPE_CAT_MEASURE_1DIM_RB),
};

export const BRANCH_SHAPE_DATE_CAT_2DIMS = {
  mainGrid: SHAPE_DATE_CAT_MEASURE_2DIMS_RB,
  moreWidgets: complement(SHAPE_DATE_CAT_MEASURE_2DIMS_RB),
};

export const BRANCH_SHAPE_TWO_CAT_DIMS = {
  mainGrid: SHAPE_TWO_CAT_DIMS_MEASURE_RB,
  moreWidgets: complement(SHAPE_TWO_CAT_DIMS_MEASURE_RB),
};
