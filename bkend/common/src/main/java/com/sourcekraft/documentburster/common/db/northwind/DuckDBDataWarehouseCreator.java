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
 * Creates a DuckDB Northwind Data Warehouse with Star Schema (dimensional model).
 *
 * OLTP tables are copied from SQLite via JDBC (avoids DuckDB SQLite scanner date bugs).
 * Star Schema tables are populated from NorthwindOlapDataGenerator (shared, deterministic).
 * This ensures the OLAP data is identical across Browser (Groovy mock), DuckDB, and ClickHouse.
 *
 * Star Schema:
 * - FACT: fact_sales (~8,000 rows from generator)
 * - DIMENSIONS: dim_customer (30), dim_product (16), dim_time (672), dim_employee (3)
 * - VIEWS: vw_sales_detail (denormalized), vw_monthly_sales (time-series)
 */
public class DuckDBDataWarehouseCreator {

    private static final Logger log = LoggerFactory.getLogger(DuckDBDataWarehouseCreator.class);

    // Default paths for standalone execution (from project root)
    private static final String DEFAULT_DUCKDB_PATH = "./asbl/src/main/external-resources/db-template/db/sample-northwind-duckdb/northwind.duckdb";
    private static final String DEFAULT_SQLITE_PATH = "./asbl/src/main/external-resources/db-template/db/sample-northwind-sqlite/northwind.db";

    /**
     * Create DuckDB data warehouse with specified paths.
     * Called from NorthwindManager during database initialization.
     */
    public static void createDataWarehouse(String duckdbPath, String sqlitePath) throws Exception {
        createDataWarehouseInternal(duckdbPath, sqlitePath);
    }

    /**
     * Main method for standalone execution (from project root).
     * Falls back to default paths if not provided.
     */
    public static void main(String[] args) throws Exception {
        String duckdbPath = args.length > 0 ? args[0] : DEFAULT_DUCKDB_PATH;
        String sqlitePath = args.length > 1 ? args[1] : DEFAULT_SQLITE_PATH;
        createDataWarehouseInternal(duckdbPath, sqlitePath);
    }

    private static void createDataWarehouseInternal(String duckdbPath, String sqlitePath) throws Exception {
        log.info("=== Creating DuckDB Northwind Data Warehouse (Star Schema) ===");
        log.info("Source (OLTP SQLite): {}", sqlitePath);
        log.info("Target (OLAP DuckDB): {}", duckdbPath);

        // Validate SQLite source file exists before attempting import
        File sqliteFile = new File(sqlitePath);
        if (!sqliteFile.exists()) {
            throw new IllegalStateException(
                "SQLite source database not found at: " + sqliteFile.getAbsolutePath() +
                ". Ensure the SQLite Northwind database has been created before creating DuckDB. " +
                "The SQLite database should exist at: db/sample-northwind-sqlite/northwind.db");
        }
        if (sqliteFile.length() == 0) {
            throw new IllegalStateException(
                "SQLite source database is empty at: " + sqliteFile.getAbsolutePath() +
                ". The database file exists but contains no data.");
        }
        log.info("SQLite source validated: {} ({} bytes)", sqliteFile.getAbsolutePath(), sqliteFile.length());

        // Ensure parent directory exists
        File dbFile = new File(duckdbPath);
        if (dbFile.getParentFile() != null) {
            dbFile.getParentFile().mkdirs();
        }

        // Delete existing DuckDB file
        if (dbFile.exists()) {
            log.info("Deleting existing DuckDB file...");
            dbFile.delete();
        }

        // Load JDBC drivers
        Class.forName("org.duckdb.DuckDBDriver");
        Class.forName("org.sqlite.JDBC");

        try (Connection duckConn = DriverManager.getConnection("jdbc:duckdb:" + duckdbPath);
             Connection sqliteConn = DriverManager.getConnection("jdbc:sqlite:" + sqlitePath);
             Statement stmt = duckConn.createStatement()) {

            log.info("Connected to DuckDB and SQLite");

            // Step 1: Create OLTP tables in DuckDB
            log.info("Step 1: Creating OLTP tables...");
            createOLTPTables(stmt);

            // Step 2: Copy OLTP data from SQLite to DuckDB via JDBC
            log.info("Step 2: Copying OLTP data from SQLite...");
            copyOLTPData(duckConn, sqliteConn);

            // Step 3: Create and populate Star Schema from NorthwindOlapDataGenerator
            log.info("Step 3: Creating Star Schema (from NorthwindOlapDataGenerator, seed={})...", NorthwindOlapDataGenerator.SEED);
            createStarSchema(duckConn, stmt);

            // Verify data
            log.info("Verifying data:");
            verifyData(stmt);

            log.info("=== DuckDB Data Warehouse created successfully! ===");
            log.info("OLAP data is IDENTICAL to ClickHouse and Browser mock (NorthwindOlapDataGenerator, seed={})", NorthwindOlapDataGenerator.SEED);
        }
    }

    private static void createOLTPTables(Statement stmt) throws Exception {
        // Categories Table
        stmt.execute("CREATE TABLE Categories (" +
            "CategoryID INTEGER, " +
            "CategoryName VARCHAR, " +
            "Description VARCHAR)");

        // Suppliers Table
        stmt.execute("CREATE TABLE Suppliers (" +
            "SupplierID INTEGER, " +
            "CompanyName VARCHAR, " +
            "ContactName VARCHAR, " +
            "ContactTitle VARCHAR, " +
            "Address VARCHAR, " +
            "City VARCHAR, " +
            "Region VARCHAR, " +
            "PostalCode VARCHAR, " +
            "Country VARCHAR, " +
            "Phone VARCHAR, " +
            "Fax VARCHAR, " +
            "HomePage VARCHAR)");

        // Products Table
        stmt.execute("CREATE TABLE Products (" +
            "ProductID INTEGER, " +
            "ProductName VARCHAR, " +
            "SupplierID INTEGER, " +
            "CategoryID INTEGER, " +
            "QuantityPerUnit VARCHAR, " +
            "UnitPrice DECIMAL(10,4), " +
            "UnitsInStock SMALLINT, " +
            "UnitsOnOrder SMALLINT, " +
            "ReorderLevel SMALLINT, " +
            "Discontinued SMALLINT DEFAULT 0)");

        // Customers Table
        stmt.execute("CREATE TABLE Customers (" +
            "CustomerID VARCHAR, " +
            "CompanyName VARCHAR, " +
            "ContactName VARCHAR, " +
            "ContactTitle VARCHAR, " +
            "Address VARCHAR, " +
            "City VARCHAR, " +
            "Region VARCHAR, " +
            "PostalCode VARCHAR, " +
            "Country VARCHAR, " +
            "Phone VARCHAR, " +
            "Fax VARCHAR)");

        // Employees Table
        stmt.execute("CREATE TABLE Employees (" +
            "EmployeeID INTEGER, " +
            "LastName VARCHAR, " +
            "FirstName VARCHAR, " +
            "Title VARCHAR, " +
            "TitleOfCourtesy VARCHAR, " +
            "BirthDate DATE, " +
            "HireDate DATE, " +
            "Address VARCHAR, " +
            "City VARCHAR, " +
            "Region VARCHAR, " +
            "PostalCode VARCHAR, " +
            "Country VARCHAR, " +
            "HomePhone VARCHAR, " +
            "Extension VARCHAR, " +
            "Photo VARCHAR, " +
            "Notes VARCHAR, " +
            "ReportsTo INTEGER, " +
            "PhotoPath VARCHAR)");

        // Shippers Table
        stmt.execute("CREATE TABLE Shippers (" +
            "ShipperID INTEGER, " +
            "CompanyName VARCHAR, " +
            "Phone VARCHAR)");

        // Orders Table
        stmt.execute("CREATE TABLE Orders (" +
            "OrderID INTEGER, " +
            "CustomerID VARCHAR, " +
            "EmployeeID INTEGER, " +
            "OrderDate TIMESTAMP, " +
            "RequiredDate TIMESTAMP, " +
            "ShippedDate TIMESTAMP, " +
            "ShipVia INTEGER, " +
            "Freight DECIMAL(10,4), " +
            "ShipName VARCHAR, " +
            "ShipAddress VARCHAR, " +
            "ShipCity VARCHAR, " +
            "ShipRegion VARCHAR, " +
            "ShipPostalCode VARCHAR, " +
            "ShipCountry VARCHAR)");

        // Order Details Table (DuckDB keeps the space in the name, quoted)
        stmt.execute("CREATE TABLE \"Order Details\" (" +
            "OrderID INTEGER, " +
            "ProductID INTEGER, " +
            "UnitPrice DECIMAL(10,4), " +
            "Quantity SMALLINT, " +
            "Discount FLOAT DEFAULT 0)");

        // Region Table
        stmt.execute("CREATE TABLE Region (" +
            "RegionID INTEGER, " +
            "RegionDescription VARCHAR)");

        // Territories Table
        stmt.execute("CREATE TABLE Territories (" +
            "TerritoryID VARCHAR, " +
            "TerritoryDescription VARCHAR, " +
            "RegionID INTEGER)");

        // EmployeeTerritories Table
        stmt.execute("CREATE TABLE EmployeeTerritories (" +
            "EmployeeID INTEGER, " +
            "TerritoryID VARCHAR)");

        // CustomerDemographics Table
        stmt.execute("CREATE TABLE CustomerDemographics (" +
            "CustomerTypeID VARCHAR, " +
            "CustomerDesc VARCHAR)");

        // CustomerCustomerDemo Table
        stmt.execute("CREATE TABLE CustomerCustomerDemo (" +
            "CustomerID VARCHAR, " +
            "CustomerTypeID VARCHAR)");

        log.info("  OLTP tables created (13 tables)");
    }

    private static void copyOLTPData(Connection duckConn, Connection sqliteConn) throws Exception {
        // Copy Categories
        copyTable(duckConn, sqliteConn, "Categories",
            "SELECT CategoryID, CategoryName, Description FROM Categories",
            "INSERT INTO Categories (CategoryID, CategoryName, Description) VALUES (?, ?, ?)",
            3);

        // Copy Suppliers
        copyTable(duckConn, sqliteConn, "Suppliers",
            "SELECT SupplierID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax, HomePage FROM Suppliers",
            "INSERT INTO Suppliers (SupplierID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax, HomePage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            12);

        // Copy Products
        copyTable(duckConn, sqliteConn, "Products",
            "SELECT ProductID, ProductName, SupplierID, CategoryID, QuantityPerUnit, UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued FROM Products",
            "INSERT INTO Products (ProductID, ProductName, SupplierID, CategoryID, QuantityPerUnit, UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            10);

        // Copy Customers
        copyTable(duckConn, sqliteConn, "Customers",
            "SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax FROM Customers",
            "INSERT INTO Customers (CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            11);

        // Copy Employees (BirthDate=col6, HireDate=col7 are DATE columns stored as epoch_ms in SQLite)
        copyTable(duckConn, sqliteConn, "Employees",
            "SELECT EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Photo, Notes, ReportsTo, PhotoPath FROM Employees",
            "INSERT INTO Employees (EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Photo, Notes, ReportsTo, PhotoPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            18, new int[]{6, 7}, null);

        // Copy Shippers
        copyTable(duckConn, sqliteConn, "Shippers",
            "SELECT ShipperID, CompanyName, Phone FROM Shippers",
            "INSERT INTO Shippers (ShipperID, CompanyName, Phone) VALUES (?, ?, ?)",
            3);

        // Copy Orders (OrderDate=col4, RequiredDate=col5, ShippedDate=col6 are TIMESTAMP columns stored as epoch_ms in SQLite)
        copyTable(duckConn, sqliteConn, "Orders",
            "SELECT OrderID, CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipPostalCode, ShipCountry FROM Orders",
            "INSERT INTO Orders (OrderID, CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipPostalCode, ShipCountry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            14, null, new int[]{4, 5, 6});

        // Copy Order Details (note: SQLite table name has space, DuckDB also keeps the space)
        copyTable(duckConn, sqliteConn, "Order Details",
            "SELECT OrderID, ProductID, UnitPrice, Quantity, Discount FROM \"Order Details\"",
            "INSERT INTO \"Order Details\" (OrderID, ProductID, UnitPrice, Quantity, Discount) VALUES (?, ?, ?, ?, ?)",
            5);

        // Copy Region
        copyTable(duckConn, sqliteConn, "Region",
            "SELECT RegionID, RegionDescription FROM \"Region\"",
            "INSERT INTO Region (RegionID, RegionDescription) VALUES (?, ?)",
            2);

        // Copy Territories
        copyTable(duckConn, sqliteConn, "Territories",
            "SELECT TerritoryID, TerritoryDescription, RegionID FROM \"Territories\"",
            "INSERT INTO Territories (TerritoryID, TerritoryDescription, RegionID) VALUES (?, ?, ?)",
            3);

        // Copy EmployeeTerritories
        copyTable(duckConn, sqliteConn, "EmployeeTerritories",
            "SELECT EmployeeID, TerritoryID FROM \"EmployeeTerritories\"",
            "INSERT INTO EmployeeTerritories (EmployeeID, TerritoryID) VALUES (?, ?)",
            2);

        // Copy CustomerDemographics
        copyTable(duckConn, sqliteConn, "CustomerDemographics",
            "SELECT CustomerTypeID, CustomerDesc FROM \"CustomerDemographics\"",
            "INSERT INTO CustomerDemographics (CustomerTypeID, CustomerDesc) VALUES (?, ?)",
            2);

        // Copy CustomerCustomerDemo
        copyTable(duckConn, sqliteConn, "CustomerCustomerDemo",
            "SELECT CustomerID, CustomerTypeID FROM \"CustomerCustomerDemo\"",
            "INSERT INTO CustomerCustomerDemo (CustomerID, CustomerTypeID) VALUES (?, ?)",
            2);

        log.info("  OLTP data copied from SQLite (13 tables)");
    }

    // Generic overload — for tables without date/timestamp columns (same as ClickHouse)
    private static void copyTable(Connection duckConn, Connection sqliteConn, String tableName,
            String selectSql, String insertSql, int columnCount) throws Exception {
        copyTable(duckConn, sqliteConn, tableName, selectSql, insertSql, columnCount, null, null);
    }

    // Overload with date/timestamp handling — DuckDB JDBC cannot implicitly convert
    // BIGINT (epoch_ms from SQLite) to DATE/TIMESTAMP, unlike ClickHouse JDBC
    private static void copyTable(Connection duckConn, Connection sqliteConn, String tableName,
            String selectSql, String insertSql, int columnCount,
            int[] dateColumnIndices, int[] timestampColumnIndices) throws Exception {

        int rowCount = 0;
        try (Statement sqliteStmt = sqliteConn.createStatement();
             ResultSet rs = sqliteStmt.executeQuery(selectSql);
             PreparedStatement ps = duckConn.prepareStatement(insertSql)) {

            while (rs.next()) {
                for (int i = 1; i <= columnCount; i++) {
                    if (isInArray(dateColumnIndices, i)) {
                        long epochMs = rs.getLong(i);
                        if (rs.wasNull()) {
                            ps.setNull(i, java.sql.Types.DATE);
                        } else {
                            ps.setObject(i, LocalDate.ofInstant(
                                Instant.ofEpochMilli(epochMs), ZoneId.systemDefault()));
                        }
                    } else if (isInArray(timestampColumnIndices, i)) {
                        long epochMs = rs.getLong(i);
                        if (rs.wasNull()) {
                            ps.setNull(i, java.sql.Types.TIMESTAMP);
                        } else {
                            ps.setObject(i, LocalDateTime.ofInstant(
                                Instant.ofEpochMilli(epochMs), ZoneId.systemDefault()));
                        }
                    } else {
                        ps.setObject(i, rs.getObject(i));
                    }
                }
                ps.addBatch();
                rowCount++;

                if (rowCount % 1000 == 0) {
                    ps.executeBatch();
                }
            }
            ps.executeBatch();
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
        stmt.execute("CREATE TABLE dim_customer (" +
            "customer_key INTEGER, " +
            "company_name VARCHAR, " +
            "country VARCHAR, " +
            "continent VARCHAR)");
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
        stmt.execute("CREATE TABLE dim_product (" +
            "product_key INTEGER, " +
            "product_name VARCHAR, " +
            "category_name VARCHAR, " +
            "list_price DECIMAL(10,4))");
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
        stmt.execute("CREATE TABLE dim_employee (" +
            "employee_key INTEGER, " +
            "full_name VARCHAR, " +
            "title VARCHAR)");
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
        stmt.execute("CREATE TABLE dim_time (" +
            "date_key DATE, " +
            "year SMALLINT, " +
            "quarter SMALLINT, " +
            "year_quarter VARCHAR, " +
            "month SMALLINT, " +
            "month_name VARCHAR)");
        List<Object[]> timeRows = NorthwindOlapDataGenerator.getDimTime();
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO dim_time (date_key, year, quarter, year_quarter, month, month_name) VALUES (?, ?, ?, ?, ?, ?)")) {
            int batch = 0;
            for (Object[] row : timeRows) {
                ps.setString(1, (String) row[0]); // date_key as string, DuckDB parses
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
        stmt.execute("CREATE TABLE fact_sales (" +
            "sales_key INTEGER, " +
            "date_key DATE, " +
            "customer_key INTEGER, " +
            "product_key INTEGER, " +
            "employee_key INTEGER, " +
            "quantity SMALLINT, " +
            "unit_price DECIMAL(10,4), " +
            "discount_rate FLOAT, " +
            "gross_revenue DECIMAL(15,4), " +
            "net_revenue DECIMAL(15,4))");

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
            "CREATE VIEW vw_sales_detail AS " +
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
            "CREATE VIEW vw_monthly_sales AS " +
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
            "UNION ALL SELECT 'Order Details', COUNT(*) FROM \"Order Details\" " +
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
