package com.sourcekraft.documentburster.common.db.northwind;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Creates a ClickHouse Northwind Data Warehouse with Star Schema (dimensional model).
 *
 * ClickHouse is a columnar OLAP database optimized for analytics.
 * Creates both OLTP tables (for compatibility) and Star Schema tables (for analytics).
 *
 * CRITICAL: Data is imported from SQLite (same source as DuckDB) with IDENTICAL
 * transformations to ensure both OLAP databases have exactly the same data.
 *
 * Star Schema (same as DuckDB):
 * - FACT: fact_sales (grain: order line item with all measures)
 * - DIMENSIONS: dim_customer, dim_product, dim_time, dim_employee, dim_shipper
 * - VIEWS: vw_sales_detail (denormalized), vw_monthly_sales (time-series)
 */
public class ClickHouseDataWarehouseCreator {

    private static final Logger log = LoggerFactory.getLogger(ClickHouseDataWarehouseCreator.class);

    /**
     * Creates the ClickHouse data warehouse with data imported from SQLite.
     * Uses the SAME source and transformations as DuckDB for consistency.
     *
     * @param clickHouseJdbcUrl ClickHouse JDBC URL
     * @param clickHouseUser ClickHouse username
     * @param clickHousePassword ClickHouse password
     * @param sqlitePath Path to SQLite northwind.db file
     */
    public static void createDataWarehouse(String clickHouseJdbcUrl, String clickHouseUser, 
            String clickHousePassword, String sqlitePath) throws Exception {
        
        log.info("=== Creating ClickHouse Northwind Data Warehouse (Star Schema) ===");
        log.info("Source (OLTP SQLite): {}", sqlitePath);
        log.info("Target (OLAP ClickHouse): {}", clickHouseJdbcUrl);

        // Load JDBC drivers
        Class.forName("com.clickhouse.jdbc.ClickHouseDriver");
        Class.forName("org.sqlite.JDBC");

        try (Connection chConn = DriverManager.getConnection(clickHouseJdbcUrl, clickHouseUser, clickHousePassword);
             Connection sqliteConn = DriverManager.getConnection("jdbc:sqlite:" + sqlitePath);
             Statement chStmt = chConn.createStatement();
             Statement sqliteStmt = sqliteConn.createStatement()) {

            log.info("Connected to ClickHouse and SQLite");

            // Step 1: Create OLTP tables in ClickHouse
            log.info("Step 1: Creating OLTP tables...");
            createOLTPTables(chStmt);

            // Step 2: Copy OLTP data from SQLite to ClickHouse
            log.info("Step 2: Copying OLTP data from SQLite...");
            copyOLTPData(chConn, sqliteConn);

            // Step 3: Create Star Schema tables
            log.info("Step 3: Creating Star Schema tables...");
            createStarSchemaTables(chStmt);

            // Step 4: Populate Star Schema (same transformations as DuckDB)
            log.info("Step 4: Populating Star Schema (same as DuckDB)...");
            populateStarSchema(chStmt);

            // Step 5: Create analytical views
            log.info("Step 5: Creating analytical views...");
            createViews(chStmt);

            // Verify data
            log.info("Verifying data:");
            verifyData(chStmt);

            log.info("=== ClickHouse Data Warehouse created successfully! ===");
            log.info("Data is IDENTICAL to northwind.duckdb");
        }
    }

    private static void createOLTPTables(Statement stmt) throws Exception {
        // Categories Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Categories (" +
            "CategoryID UInt32, " +
            "CategoryName String, " +
            "Description Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY CategoryID");

        // Suppliers Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Suppliers (" +
            "SupplierID UInt32, " +
            "CompanyName String, " +
            "ContactName Nullable(String), " +
            "ContactTitle Nullable(String), " +
            "Address Nullable(String), " +
            "City Nullable(String), " +
            "Region Nullable(String), " +
            "PostalCode Nullable(String), " +
            "Country Nullable(String), " +
            "Phone Nullable(String), " +
            "Fax Nullable(String), " +
            "HomePage Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY SupplierID");

        // Products Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Products (" +
            "ProductID UInt32, " +
            "ProductName String, " +
            "SupplierID Nullable(UInt32), " +
            "CategoryID Nullable(UInt32), " +
            "QuantityPerUnit Nullable(String), " +
            "UnitPrice Nullable(Decimal(10,4)), " +
            "UnitsInStock Nullable(Int16), " +
            "UnitsOnOrder Nullable(Int16), " +
            "ReorderLevel Nullable(Int16), " +
            "Discontinued UInt8 DEFAULT 0" +
            ") ENGINE = MergeTree() ORDER BY ProductID");

        // Customers Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Customers (" +
            "CustomerID String, " +
            "CompanyName String, " +
            "ContactName Nullable(String), " +
            "ContactTitle Nullable(String), " +
            "Address Nullable(String), " +
            "City Nullable(String), " +
            "Region Nullable(String), " +
            "PostalCode Nullable(String), " +
            "Country Nullable(String), " +
            "Phone Nullable(String), " +
            "Fax Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY CustomerID");

        // Employees Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Employees (" +
            "EmployeeID UInt32, " +
            "LastName String, " +
            "FirstName String, " +
            "Title Nullable(String), " +
            "TitleOfCourtesy Nullable(String), " +
            "BirthDate Nullable(Date), " +
            "HireDate Nullable(Date), " +
            "Address Nullable(String), " +
            "City Nullable(String), " +
            "Region Nullable(String), " +
            "PostalCode Nullable(String), " +
            "Country Nullable(String), " +
            "HomePhone Nullable(String), " +
            "Extension Nullable(String), " +
            "Photo Nullable(String), " +
            "Notes Nullable(String), " +
            "ReportsTo Nullable(UInt32), " +
            "PhotoPath Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY EmployeeID");

        // Shippers Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Shippers (" +
            "ShipperID UInt32, " +
            "CompanyName String, " +
            "Phone Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY ShipperID");

        // Orders Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Orders (" +
            "OrderID UInt32, " +
            "CustomerID Nullable(String), " +
            "EmployeeID Nullable(UInt32), " +
            "OrderDate Nullable(DateTime), " +
            "RequiredDate Nullable(DateTime), " +
            "ShippedDate Nullable(DateTime), " +
            "ShipVia Nullable(UInt32), " +
            "Freight Nullable(Decimal(10,4)), " +
            "ShipName Nullable(String), " +
            "ShipAddress Nullable(String), " +
            "ShipCity Nullable(String), " +
            "ShipRegion Nullable(String), " +
            "ShipPostalCode Nullable(String), " +
            "ShipCountry Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY OrderID");

        // OrderDetails Table (ClickHouse-compatible name)
        stmt.execute("CREATE TABLE IF NOT EXISTS OrderDetails (" +
            "OrderID UInt32, " +
            "ProductID UInt32, " +
            "UnitPrice Decimal(10,4), " +
            "Quantity Int16, " +
            "Discount Float32 DEFAULT 0" +
            ") ENGINE = MergeTree() ORDER BY (OrderID, ProductID)");

        log.info("  OLTP tables created");
    }

    private static void copyOLTPData(Connection chConn, Connection sqliteConn) throws Exception {
        // Copy Categories
        copyTable(chConn, sqliteConn, "Categories", 
            "SELECT CategoryID, CategoryName, Description FROM Categories",
            "INSERT INTO Categories (CategoryID, CategoryName, Description) VALUES (?, ?, ?)",
            3);

        // Copy Suppliers
        copyTable(chConn, sqliteConn, "Suppliers",
            "SELECT SupplierID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax, HomePage FROM Suppliers",
            "INSERT INTO Suppliers (SupplierID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax, HomePage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            12);

        // Copy Products
        copyTable(chConn, sqliteConn, "Products",
            "SELECT ProductID, ProductName, SupplierID, CategoryID, QuantityPerUnit, UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued FROM Products",
            "INSERT INTO Products (ProductID, ProductName, SupplierID, CategoryID, QuantityPerUnit, UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            10);

        // Copy Customers
        copyTable(chConn, sqliteConn, "Customers",
            "SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax FROM Customers",
            "INSERT INTO Customers (CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            11);

        // Copy Employees
        copyTable(chConn, sqliteConn, "Employees",
            "SELECT EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Photo, Notes, ReportsTo, PhotoPath FROM Employees",
            "INSERT INTO Employees (EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Photo, Notes, ReportsTo, PhotoPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            18);

        // Copy Shippers
        copyTable(chConn, sqliteConn, "Shippers",
            "SELECT ShipperID, CompanyName, Phone FROM Shippers",
            "INSERT INTO Shippers (ShipperID, CompanyName, Phone) VALUES (?, ?, ?)",
            3);

        // Copy Orders
        copyTable(chConn, sqliteConn, "Orders",
            "SELECT OrderID, CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipPostalCode, ShipCountry FROM Orders",
            "INSERT INTO Orders (OrderID, CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipPostalCode, ShipCountry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            14);

        // Copy Order Details (note: SQLite table name has space)
        copyTable(chConn, sqliteConn, "OrderDetails",
            "SELECT OrderID, ProductID, UnitPrice, Quantity, Discount FROM \"Order Details\"",
            "INSERT INTO OrderDetails (OrderID, ProductID, UnitPrice, Quantity, Discount) VALUES (?, ?, ?, ?, ?)",
            5);

        log.info("  OLTP data copied from SQLite");
    }

    private static void copyTable(Connection chConn, Connection sqliteConn, String tableName,
            String selectSql, String insertSql, int columnCount) throws Exception {
        
        int rowCount = 0;
        try (Statement sqliteStmt = sqliteConn.createStatement();
             ResultSet rs = sqliteStmt.executeQuery(selectSql);
             PreparedStatement chPs = chConn.prepareStatement(insertSql)) {
            
            while (rs.next()) {
                for (int i = 1; i <= columnCount; i++) {
                    Object value = rs.getObject(i);
                    chPs.setObject(i, value);
                }
                chPs.addBatch();
                rowCount++;
                
                // Execute batch every 1000 rows
                if (rowCount % 1000 == 0) {
                    chPs.executeBatch();
                }
            }
            // Execute remaining
            chPs.executeBatch();
        }
        log.info("    {}: {} rows", tableName, rowCount);
    }

    private static void createStarSchemaTables(Statement stmt) throws Exception {
        // Dimension: Customers (same schema as DuckDB)
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_customer (" +
            "customer_key String, " +
            "company_name String, " +
            "contact_name Nullable(String), " +
            "city Nullable(String), " +
            "region Nullable(String), " +
            "country Nullable(String), " +
            "continent String" +
            ") ENGINE = MergeTree() ORDER BY customer_key");

        // Dimension: Products (same schema as DuckDB)
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_product (" +
            "product_key UInt32, " +
            "product_name String, " +
            "category_name String, " +
            "supplier_name String, " +
            "supplier_country Nullable(String), " +
            "list_price Decimal(10,4)" +
            ") ENGINE = MergeTree() ORDER BY product_key");

        // Dimension: Time (same schema as DuckDB)
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_time (" +
            "date_key Date, " +
            "year UInt16, " +
            "quarter UInt8, " +
            "year_quarter String, " +
            "month UInt8, " +
            "month_name String" +
            ") ENGINE = MergeTree() ORDER BY date_key");

        // Dimension: Employees (same schema as DuckDB)
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_employee (" +
            "employee_key UInt32, " +
            "full_name String, " +
            "title Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY employee_key");

        // Dimension: Shippers (same schema as DuckDB)
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_shipper (" +
            "shipper_key UInt32, " +
            "shipper_name String" +
            ") ENGINE = MergeTree() ORDER BY shipper_key");

        // Fact Table: Sales (same schema as DuckDB)
        stmt.execute("CREATE TABLE IF NOT EXISTS fact_sales (" +
            "sales_key UInt64, " +
            "date_key Date, " +
            "customer_key String, " +
            "product_key UInt32, " +
            "employee_key UInt32, " +
            "shipper_key UInt32, " +
            "order_id UInt32, " +
            "quantity Int16, " +
            "unit_price Decimal(10,4), " +
            "discount_rate Float32, " +
            "gross_revenue Decimal(15,4), " +
            "net_revenue Decimal(15,4)" +
            ") ENGINE = MergeTree() ORDER BY (date_key, sales_key)");

        log.info("  Star Schema tables created");
    }

    private static void populateStarSchema(Statement stmt) throws Exception {
        // Populate dim_customer (IDENTICAL transformation as DuckDB)
        log.info("    Creating dim_customer...");
        stmt.execute(
            "INSERT INTO dim_customer (customer_key, company_name, contact_name, city, region, country, continent) " +
            "SELECT CustomerID, CompanyName, ContactName, City, Region, Country, " +
            "CASE " +
            "  WHEN Country IN ('USA', 'Canada', 'Mexico') THEN 'North America' " +
            "  WHEN Country IN ('Brazil', 'Argentina', 'Venezuela') THEN 'South America' " +
            "  WHEN Country IN ('UK', 'Germany', 'France', 'Spain', 'Italy', 'Sweden', 'Finland', 'Norway', 'Denmark', 'Poland', 'Austria', 'Switzerland', 'Belgium', 'Portugal', 'Ireland') THEN 'Europe' " +
            "  ELSE 'Other' " +
            "END " +
            "FROM Customers"
        );

        // Populate dim_product (IDENTICAL transformation as DuckDB)
        log.info("    Creating dim_product...");
        stmt.execute(
            "INSERT INTO dim_product (product_key, product_name, category_name, supplier_name, supplier_country, list_price) " +
            "SELECT p.ProductID, p.ProductName, c.CategoryName, s.CompanyName, s.Country, p.UnitPrice " +
            "FROM Products p " +
            "JOIN Categories c ON p.CategoryID = c.CategoryID " +
            "JOIN Suppliers s ON p.SupplierID = s.SupplierID"
        );

        // Populate dim_time (IDENTICAL transformation as DuckDB)
        log.info("    Creating dim_time...");
        stmt.execute(
            "INSERT INTO dim_time (date_key, year, quarter, year_quarter, month, month_name) " +
            "SELECT DISTINCT " +
            "  toDate(OrderDate) AS date_key, " +
            "  toYear(OrderDate) AS year, " +
            "  toQuarter(OrderDate) AS quarter, " +
            "  concat(toString(toYear(OrderDate)), '-Q', toString(toQuarter(OrderDate))) AS year_quarter, " +
            "  toMonth(OrderDate) AS month, " +
            "  dateName('month', OrderDate) AS month_name " +
            "FROM Orders " +
            "WHERE OrderDate IS NOT NULL"
        );

        // Populate dim_employee (IDENTICAL transformation as DuckDB)
        log.info("    Creating dim_employee...");
        stmt.execute(
            "INSERT INTO dim_employee (employee_key, full_name, title) " +
            "SELECT EmployeeID, concat(FirstName, ' ', LastName), Title " +
            "FROM Employees"
        );

        // Populate dim_shipper (IDENTICAL transformation as DuckDB)
        log.info("    Creating dim_shipper...");
        stmt.execute(
            "INSERT INTO dim_shipper (shipper_key, shipper_name) " +
            "SELECT ShipperID, CompanyName FROM Shippers"
        );

        // Populate fact_sales (IDENTICAL transformation as DuckDB)
        log.info("    Creating fact_sales...");
        stmt.execute(
            "INSERT INTO fact_sales (sales_key, date_key, customer_key, product_key, employee_key, shipper_key, " +
            "order_id, quantity, unit_price, discount_rate, gross_revenue, net_revenue) " +
            "SELECT " +
            "  rowNumberInAllBlocks() AS sales_key, " +
            "  toDate(o.OrderDate) AS date_key, " +
            "  o.CustomerID AS customer_key, " +
            "  od.ProductID AS product_key, " +
            "  o.EmployeeID AS employee_key, " +
            "  o.ShipVia AS shipper_key, " +
            "  o.OrderID AS order_id, " +
            "  od.Quantity AS quantity, " +
            "  od.UnitPrice AS unit_price, " +
            "  od.Discount AS discount_rate, " +
            "  od.UnitPrice * od.Quantity AS gross_revenue, " +
            "  od.UnitPrice * od.Quantity * (1 - od.Discount) AS net_revenue " +
            "FROM Orders o " +
            "JOIN OrderDetails od ON o.OrderID = od.OrderID"
        );

        log.info("  Star Schema populated");
    }

    private static void createViews(Statement stmt) throws Exception {
        // View: vw_sales_detail (IDENTICAL to DuckDB - denormalized for instant pivots)
        stmt.execute(
            "CREATE VIEW IF NOT EXISTS vw_sales_detail AS " +
            "SELECT " +
            "  fs.sales_key, fs.date_key, fs.customer_key, fs.product_key, fs.employee_key, " +
            "  fs.shipper_key, fs.order_id, fs.quantity, fs.unit_price, fs.discount_rate, " +
            "  fs.gross_revenue, fs.net_revenue, " +
            "  dt.year, dt.quarter, dt.year_quarter, dt.month, dt.month_name, " +
            "  dc.company_name AS customer_name, dc.city AS customer_city, dc.country AS customer_country, dc.continent, " +
            "  dp.product_name, dp.category_name, dp.supplier_name, " +
            "  de.full_name AS employee_name, " +
            "  ds.shipper_name " +
            "FROM fact_sales fs " +
            "LEFT JOIN dim_time dt ON fs.date_key = dt.date_key " +
            "LEFT JOIN dim_customer dc ON fs.customer_key = dc.customer_key " +
            "LEFT JOIN dim_product dp ON fs.product_key = dp.product_key " +
            "LEFT JOIN dim_employee de ON fs.employee_key = de.employee_key " +
            "LEFT JOIN dim_shipper ds ON fs.shipper_key = ds.shipper_key"
        );

        // View: vw_monthly_sales (time-series aggregation)
        stmt.execute(
            "CREATE VIEW IF NOT EXISTS vw_monthly_sales AS " +
            "SELECT " +
            "  dt.year, dt.month, dt.month_name, dt.year_quarter, " +
            "  SUM(fs.gross_revenue) AS total_gross_revenue, " +
            "  SUM(fs.net_revenue) AS total_net_revenue, " +
            "  SUM(fs.quantity) AS total_quantity, " +
            "  COUNT(DISTINCT fs.order_id) AS order_count " +
            "FROM fact_sales fs " +
            "JOIN dim_time dt ON fs.date_key = dt.date_key " +
            "GROUP BY dt.year, dt.month, dt.month_name, dt.year_quarter " +
            "ORDER BY dt.year, dt.month"
        );

        log.info("  Views created");
    }

    private static void verifyData(Statement stmt) throws Exception {
        ResultSet rs = stmt.executeQuery(
            "SELECT 'Categories' as table_name, COUNT(*) as row_count FROM Categories " +
            "UNION ALL SELECT 'Customers', COUNT(*) FROM Customers " +
            "UNION ALL SELECT 'Employees', COUNT(*) FROM Employees " +
            "UNION ALL SELECT 'Orders', COUNT(*) FROM Orders " +
            "UNION ALL SELECT 'OrderDetails', COUNT(*) FROM OrderDetails " +
            "UNION ALL SELECT 'Products', COUNT(*) FROM Products " +
            "UNION ALL SELECT 'Shippers', COUNT(*) FROM Shippers " +
            "UNION ALL SELECT 'Suppliers', COUNT(*) FROM Suppliers " +
            "UNION ALL SELECT 'fact_sales', COUNT(*) FROM fact_sales " +
            "UNION ALL SELECT 'dim_customer', COUNT(*) FROM dim_customer " +
            "UNION ALL SELECT 'dim_product', COUNT(*) FROM dim_product " +
            "UNION ALL SELECT 'dim_time', COUNT(*) FROM dim_time"
        );

        while (rs.next()) {
            log.info("  {}: {} rows", rs.getString(1), rs.getInt(2));
        }
    }
}
