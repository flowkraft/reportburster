package com.sourcekraft.documentburster.common.db.northwind;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Creates a ClickHouse Northwind Data Warehouse with Star Schema (dimensional model).
 *
 * OLTP tables are copied from SQLite (backward compatibility with existing e2e tests).
 * Star Schema tables are populated from NorthwindOlapDataGenerator (shared, deterministic).
 * This ensures the OLAP data is identical across Browser (Groovy mock), DuckDB, and ClickHouse.
 *
 * Star Schema:
 * - FACT: fact_sales (~8,000 rows from generator)
 * - DIMENSIONS: dim_customer (30), dim_product (16), dim_time (672), dim_employee (3)
 * - VIEWS: vw_sales_detail (denormalized), vw_monthly_sales (time-series)
 */
public class ClickHouseDataWarehouseCreator {

    private static final Logger log = LoggerFactory.getLogger(ClickHouseDataWarehouseCreator.class);

    /**
     * Creates the ClickHouse data warehouse with data imported from SQLite.
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

        // Validate SQLite source file exists before attempting import
        File sqliteFile = new File(sqlitePath);
        if (!sqliteFile.exists()) {
            throw new IllegalStateException(
                "SQLite source database not found at: " + sqliteFile.getAbsolutePath() +
                ". Ensure the SQLite Northwind database has been created before starting ClickHouse. " +
                "The SQLite database should exist at: db/sample-northwind-sqlite/northwind.db");
        }
        if (sqliteFile.length() == 0) {
            throw new IllegalStateException(
                "SQLite source database is empty at: " + sqliteFile.getAbsolutePath() +
                ". The database file exists but contains no data.");
        }
        log.info("SQLite source validated: {} ({} bytes)", sqliteFile.getAbsolutePath(), sqliteFile.length());

        // Load JDBC drivers
        Class.forName("com.clickhouse.jdbc.ClickHouseDriver");
        Class.forName("org.sqlite.JDBC");

        try (Connection chConn = DriverManager.getConnection(clickHouseJdbcUrl, clickHouseUser, clickHousePassword);
             Connection sqliteConn = DriverManager.getConnection("jdbc:sqlite:" + sqlitePath);
             Statement chStmt = chConn.createStatement()) {

            log.info("Connected to ClickHouse and SQLite");

            // Step 1: Create OLTP tables in ClickHouse
            log.info("Step 1: Creating OLTP tables...");
            createOLTPTables(chStmt);

            // Step 1b: Truncate existing data (idempotency — Docker volume may retain old data)
            log.info("Step 1b: Truncating existing OLTP data...");
            truncateOLTPTables(chStmt);

            // Step 2: Copy OLTP data from SQLite to ClickHouse
            log.info("Step 2: Copying OLTP data from SQLite...");
            copyOLTPData(chConn, sqliteConn);

            // Step 3: Create and populate Star Schema from NorthwindOlapDataGenerator
            log.info("Step 3: Creating Star Schema (from NorthwindOlapDataGenerator, seed={})...", NorthwindOlapDataGenerator.SEED);
            createStarSchema(chConn, chStmt);

            // Verify data
            log.info("Verifying data:");
            verifyData(chStmt);

            log.info("=== ClickHouse Data Warehouse created successfully! ===");
            log.info("OLAP data is IDENTICAL to DuckDB and Browser mock (NorthwindOlapDataGenerator, seed={})", NorthwindOlapDataGenerator.SEED);
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

        // Region Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Region (" +
            "RegionID UInt32, " +
            "RegionDescription String" +
            ") ENGINE = MergeTree() ORDER BY RegionID");

        // Territories Table
        stmt.execute("CREATE TABLE IF NOT EXISTS Territories (" +
            "TerritoryID String, " +
            "TerritoryDescription String, " +
            "RegionID UInt32" +
            ") ENGINE = MergeTree() ORDER BY TerritoryID");

        // EmployeeTerritories Table
        stmt.execute("CREATE TABLE IF NOT EXISTS EmployeeTerritories (" +
            "EmployeeID UInt32, " +
            "TerritoryID String" +
            ") ENGINE = MergeTree() ORDER BY (EmployeeID, TerritoryID)");

        // CustomerDemographics Table
        stmt.execute("CREATE TABLE IF NOT EXISTS CustomerDemographics (" +
            "CustomerTypeID String, " +
            "CustomerDesc Nullable(String)" +
            ") ENGINE = MergeTree() ORDER BY CustomerTypeID");

        // CustomerCustomerDemo Table
        stmt.execute("CREATE TABLE IF NOT EXISTS CustomerCustomerDemo (" +
            "CustomerID String, " +
            "CustomerTypeID String" +
            ") ENGINE = MergeTree() ORDER BY (CustomerID, CustomerTypeID)");

        log.info("  OLTP tables created (13 tables)");
    }

    private static void truncateOLTPTables(Statement stmt) throws Exception {
        String[] tables = {"Categories", "Suppliers", "Products", "Customers",
                           "Employees", "Shippers", "Orders", "OrderDetails",
                           "Region", "Territories", "EmployeeTerritories",
                           "CustomerDemographics", "CustomerCustomerDemo"};
        for (String table : tables) {
            stmt.execute("TRUNCATE TABLE IF EXISTS " + table);
        }
        log.info("  OLTP tables truncated (ensuring clean state)");
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

        // Copy Employees (BirthDate=col6, HireDate=col7 are DATE columns stored as epoch_ms in SQLite)
        copyTable(chConn, sqliteConn, "Employees",
            "SELECT EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Photo, Notes, ReportsTo, PhotoPath FROM Employees",
            "INSERT INTO Employees (EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Photo, Notes, ReportsTo, PhotoPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            18, new int[]{6, 7}, null);

        // Copy Shippers
        copyTable(chConn, sqliteConn, "Shippers",
            "SELECT ShipperID, CompanyName, Phone FROM Shippers",
            "INSERT INTO Shippers (ShipperID, CompanyName, Phone) VALUES (?, ?, ?)",
            3);

        // Copy Orders (OrderDate=col4, RequiredDate=col5, ShippedDate=col6 are TIMESTAMP columns stored as epoch_ms in SQLite)
        copyTable(chConn, sqliteConn, "Orders",
            "SELECT OrderID, CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipPostalCode, ShipCountry FROM Orders",
            "INSERT INTO Orders (OrderID, CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipPostalCode, ShipCountry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            14, null, new int[]{4, 5, 6});

        // Copy Order Details (note: SQLite table name has space)
        copyTable(chConn, sqliteConn, "OrderDetails",
            "SELECT OrderID, ProductID, UnitPrice, Quantity, Discount FROM \"Order Details\"",
            "INSERT INTO OrderDetails (OrderID, ProductID, UnitPrice, Quantity, Discount) VALUES (?, ?, ?, ?, ?)",
            5);

        // Copy Region
        copyTable(chConn, sqliteConn, "Region",
            "SELECT RegionID, RegionDescription FROM \"Region\"",
            "INSERT INTO Region (RegionID, RegionDescription) VALUES (?, ?)",
            2);

        // Copy Territories
        copyTable(chConn, sqliteConn, "Territories",
            "SELECT TerritoryID, TerritoryDescription, RegionID FROM \"Territories\"",
            "INSERT INTO Territories (TerritoryID, TerritoryDescription, RegionID) VALUES (?, ?, ?)",
            3);

        // Copy EmployeeTerritories
        copyTable(chConn, sqliteConn, "EmployeeTerritories",
            "SELECT EmployeeID, TerritoryID FROM \"EmployeeTerritories\"",
            "INSERT INTO EmployeeTerritories (EmployeeID, TerritoryID) VALUES (?, ?)",
            2);

        // Copy CustomerDemographics
        copyTable(chConn, sqliteConn, "CustomerDemographics",
            "SELECT CustomerTypeID, CustomerDesc FROM \"CustomerDemographics\"",
            "INSERT INTO CustomerDemographics (CustomerTypeID, CustomerDesc) VALUES (?, ?)",
            2);

        // Copy CustomerCustomerDemo
        copyTable(chConn, sqliteConn, "CustomerCustomerDemo",
            "SELECT CustomerID, CustomerTypeID FROM \"CustomerCustomerDemo\"",
            "INSERT INTO CustomerCustomerDemo (CustomerID, CustomerTypeID) VALUES (?, ?)",
            2);

        log.info("  OLTP data copied from SQLite (13 tables)");
    }

    // Generic overload — for tables without date/timestamp columns
    private static void copyTable(Connection chConn, Connection sqliteConn, String tableName,
            String selectSql, String insertSql, int columnCount) throws Exception {
        copyTable(chConn, sqliteConn, tableName, selectSql, insertSql, columnCount, null, null);
    }

    // Overload with date/timestamp handling — ClickHouse JDBC cannot implicitly convert
    // BIGINT (epoch_ms from SQLite) to DATE/DATETIME
    private static void copyTable(Connection chConn, Connection sqliteConn, String tableName,
            String selectSql, String insertSql, int columnCount,
            int[] dateColumnIndices, int[] timestampColumnIndices) throws Exception {

        int rowCount = 0;
        try (Statement sqliteStmt = sqliteConn.createStatement();
             ResultSet rs = sqliteStmt.executeQuery(selectSql);
             PreparedStatement chPs = chConn.prepareStatement(insertSql)) {

            while (rs.next()) {
                for (int i = 1; i <= columnCount; i++) {
                    if (isInArray(dateColumnIndices, i)) {
                        long epochMs = rs.getLong(i);
                        if (rs.wasNull()) {
                            chPs.setNull(i, java.sql.Types.DATE);
                        } else {
                            chPs.setObject(i, LocalDate.ofInstant(
                                Instant.ofEpochMilli(epochMs), ZoneId.systemDefault()));
                        }
                    } else if (isInArray(timestampColumnIndices, i)) {
                        long epochMs = rs.getLong(i);
                        if (rs.wasNull()) {
                            chPs.setNull(i, java.sql.Types.TIMESTAMP);
                        } else {
                            chPs.setObject(i, LocalDateTime.ofInstant(
                                Instant.ofEpochMilli(epochMs), ZoneId.systemDefault()));
                        }
                    } else {
                        chPs.setObject(i, rs.getObject(i));
                    }
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

    private static boolean isInArray(int[] arr, int val) {
        if (arr == null) return false;
        for (int v : arr) if (v == val) return true;
        return false;
    }

    private static void createStarSchema(Connection conn, Statement stmt) throws Exception {

        // ── dim_customer ──
        log.info("  Creating dim_customer...");
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_customer (" +
            "customer_key UInt32, " +
            "company_name String, " +
            "country String, " +
            "continent String" +
            ") ENGINE = MergeTree() ORDER BY customer_key");
        stmt.execute("TRUNCATE TABLE IF EXISTS dim_customer");
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO dim_customer (customer_key, company_name, country, continent) VALUES (?, ?, ?, ?)")) {
            for (Object[] row : NorthwindOlapDataGenerator.getDimCustomers()) {
                ps.setInt(1, (int) row[0]);
                ps.setString(2, (String) row[1]);
                ps.setString(3, (String) row[2]);
                ps.setString(4, (String) row[3]);
                ps.addBatch();
            }
            ps.executeBatch();
        }
        log.info("    dim_customer: {} rows", NorthwindOlapDataGenerator.getDimCustomers().size());

        // ── dim_product ──
        log.info("  Creating dim_product...");
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_product (" +
            "product_key UInt32, " +
            "product_name String, " +
            "category_name String, " +
            "list_price Decimal(10,4)" +
            ") ENGINE = MergeTree() ORDER BY product_key");
        stmt.execute("TRUNCATE TABLE IF EXISTS dim_product");
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO dim_product (product_key, product_name, category_name, list_price) VALUES (?, ?, ?, ?)")) {
            for (Object[] row : NorthwindOlapDataGenerator.getDimProducts()) {
                ps.setInt(1, (int) row[0]);
                ps.setString(2, (String) row[1]);
                ps.setString(3, (String) row[2]);
                ps.setDouble(4, (double) row[3]);
                ps.addBatch();
            }
            ps.executeBatch();
        }
        log.info("    dim_product: {} rows", NorthwindOlapDataGenerator.getDimProducts().size());

        // ── dim_employee ──
        log.info("  Creating dim_employee...");
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_employee (" +
            "employee_key UInt32, " +
            "full_name String, " +
            "title String" +
            ") ENGINE = MergeTree() ORDER BY employee_key");
        stmt.execute("TRUNCATE TABLE IF EXISTS dim_employee");
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO dim_employee (employee_key, full_name, title) VALUES (?, ?, ?)")) {
            for (Object[] row : NorthwindOlapDataGenerator.getDimEmployees()) {
                ps.setInt(1, (int) row[0]);
                ps.setString(2, (String) row[1]);
                ps.setString(3, (String) row[2]);
                ps.addBatch();
            }
            ps.executeBatch();
        }
        log.info("    dim_employee: {} rows", NorthwindOlapDataGenerator.getDimEmployees().size());

        // ── dim_time ──
        log.info("  Creating dim_time...");
        stmt.execute("CREATE TABLE IF NOT EXISTS dim_time (" +
            "date_key Date, " +
            "year UInt16, " +
            "quarter UInt8, " +
            "year_quarter String, " +
            "month UInt8, " +
            "month_name String" +
            ") ENGINE = MergeTree() ORDER BY date_key");
        stmt.execute("TRUNCATE TABLE IF EXISTS dim_time");
        List<Object[]> timeRows = NorthwindOlapDataGenerator.getDimTime();
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO dim_time (date_key, year, quarter, year_quarter, month, month_name) VALUES (?, ?, ?, ?, ?, ?)")) {
            int batch = 0;
            for (Object[] row : timeRows) {
                ps.setString(1, (String) row[0]); // date_key as string, ClickHouse parses
                ps.setInt(2, (int) row[1]);
                ps.setInt(3, (int) row[2]);
                ps.setString(4, (String) row[3]);
                ps.setInt(5, (int) row[4]);
                ps.setString(6, (String) row[5]);
                ps.addBatch();
                batch++;
                if (batch % 1000 == 0) {
                    ps.executeBatch();
                }
            }
            ps.executeBatch();
        }
        log.info("    dim_time: {} rows", timeRows.size());

        // ── fact_sales ──
        log.info("  Creating fact_sales...");
        stmt.execute("CREATE TABLE IF NOT EXISTS fact_sales (" +
            "sales_key UInt32, " +
            "date_key Date, " +
            "customer_key UInt32, " +
            "product_key UInt32, " +
            "employee_key UInt32, " +
            "quantity UInt16, " +
            "unit_price Decimal(10,4), " +
            "discount_rate Float32, " +
            "gross_revenue Decimal(15,4), " +
            "net_revenue Decimal(15,4)" +
            ") ENGINE = MergeTree() ORDER BY (date_key, sales_key)");
        stmt.execute("TRUNCATE TABLE IF EXISTS fact_sales");

        List<Object[]> factRows = NorthwindOlapDataGenerator.getFactSalesRows();
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO fact_sales (sales_key, date_key, customer_key, product_key, employee_key, " +
                "quantity, unit_price, discount_rate, gross_revenue, net_revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
            int batch = 0;
            for (Object[] row : factRows) {
                ps.setInt(1, (int) row[0]);       // sales_key
                ps.setString(2, (String) row[1]);  // date_key
                ps.setInt(3, (int) row[2]);        // customer_key
                ps.setInt(4, (int) row[3]);        // product_key
                ps.setInt(5, (int) row[4]);        // employee_key
                ps.setInt(6, (int) row[5]);        // quantity
                ps.setDouble(7, (double) row[6]);  // unit_price
                ps.setDouble(8, (double) row[7]);  // discount_rate
                ps.setDouble(9, (double) row[8]);  // gross_revenue
                ps.setDouble(10, (double) row[9]); // net_revenue
                ps.addBatch();
                batch++;
                if (batch % 1000 == 0) {
                    ps.executeBatch();
                }
            }
            ps.executeBatch();
        }
        log.info("    fact_sales: {} rows", factRows.size());

        // ── vw_sales_detail (denormalized view) ──
        log.info("  Creating vw_sales_detail...");
        stmt.execute(
            "CREATE VIEW IF NOT EXISTS vw_sales_detail AS " +
            "SELECT " +
            "  fs.sales_key, fs.date_key, fs.customer_key, fs.product_key, fs.employee_key, " +
            "  fs.quantity, fs.unit_price, fs.discount_rate, fs.gross_revenue, fs.net_revenue, " +
            "  dt.year, dt.quarter, dt.year_quarter, dt.month, dt.month_name, " +
            "  dc.company_name AS customer_name, dc.country AS customer_country, dc.continent, " +
            "  dp.product_name, dp.category_name, " +
            "  de.full_name AS employee_name " +
            "FROM fact_sales fs " +
            "LEFT JOIN dim_time dt ON fs.date_key = dt.date_key " +
            "LEFT JOIN dim_customer dc ON fs.customer_key = dc.customer_key " +
            "LEFT JOIN dim_product dp ON fs.product_key = dp.product_key " +
            "LEFT JOIN dim_employee de ON fs.employee_key = de.employee_key"
        );

        // ── vw_monthly_sales (time-series aggregation) ──
        log.info("  Creating vw_monthly_sales...");
        stmt.execute(
            "CREATE VIEW IF NOT EXISTS vw_monthly_sales AS " +
            "SELECT " +
            "  dt.year, dt.month, dt.month_name, dt.year_quarter, " +
            "  COUNT(DISTINCT fs.sales_key) AS num_transactions, " +
            "  SUM(fs.quantity) AS total_quantity, " +
            "  ROUND(SUM(fs.gross_revenue), 2) AS total_gross_revenue, " +
            "  ROUND(SUM(fs.net_revenue), 2) AS total_net_revenue, " +
            "  ROUND(AVG(fs.net_revenue), 2) AS avg_transaction_value " +
            "FROM fact_sales fs " +
            "LEFT JOIN dim_time dt ON fs.date_key = dt.date_key " +
            "GROUP BY dt.year, dt.month, dt.month_name, dt.year_quarter " +
            "ORDER BY dt.year, dt.month"
        );

        log.info("  Star Schema created (NorthwindOlapDataGenerator, seed={})", NorthwindOlapDataGenerator.SEED);
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
            "UNION ALL SELECT 'Region', COUNT(*) FROM Region " +
            "UNION ALL SELECT 'Territories', COUNT(*) FROM Territories " +
            "UNION ALL SELECT 'EmployeeTerritories', COUNT(*) FROM EmployeeTerritories " +
            "UNION ALL SELECT 'CustomerDemographics', COUNT(*) FROM CustomerDemographics " +
            "UNION ALL SELECT 'CustomerCustomerDemo', COUNT(*) FROM CustomerCustomerDemo " +
            "UNION ALL SELECT 'fact_sales', COUNT(*) FROM fact_sales " +
            "UNION ALL SELECT 'dim_customer', COUNT(*) FROM dim_customer " +
            "UNION ALL SELECT 'dim_product', COUNT(*) FROM dim_product " +
            "UNION ALL SELECT 'dim_time', COUNT(*) FROM dim_time " +
            "UNION ALL SELECT 'dim_employee', COUNT(*) FROM dim_employee"
        );

        while (rs.next()) {
            log.info("  {}: {} rows", rs.getString(1), rs.getInt(2));
        }
    }
}
