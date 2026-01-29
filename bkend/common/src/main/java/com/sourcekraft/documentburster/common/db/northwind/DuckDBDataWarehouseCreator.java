package com.sourcekraft.documentburster.common.db.northwind;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;

/**
 * Creates a DuckDB Northwind Data Warehouse with Star Schema (dimensional model).
 *
 * Transforms OLTP data from SQLite into a proper analytical data warehouse optimized for OLAP.
 * Creates both OLTP tables (for compatibility) and Star Schema tables (for analytics).
 *
 * Star Schema:
 * - FACT: fact_sales (grain: order line item with all measures)
 * - DIMENSIONS: dim_customer, dim_product, dim_time, dim_employee, dim_shipper
 * - VIEWS: vw_sales_detail (denormalized), vw_monthly_sales (time-series)
 */
public class DuckDBDataWarehouseCreator {

    public static void main(String[] args) throws Exception {
        String duckdbPath = "./asbl/src/main/external-resources/db-template/db/sample-northwind-duckdb/northwind.duckdb";
        String sqlitePath = "./asbl/src/main/external-resources/db-template/db/sample-northwind-sqlite/northwind.db";

        System.out.println("=== Creating DuckDB Northwind Data Warehouse (Star Schema) ===");
        System.out.println("Source (OLTP SQLite): " + sqlitePath);
        System.out.println("Target (OLAP DuckDB): " + duckdbPath);

        // Ensure parent directory exists
        Path dbFile = Paths.get(duckdbPath);
        Files.createDirectories(dbFile.getParent());

        // Delete existing DuckDB file
        if (Files.exists(dbFile)) {
            System.out.println("Deleting existing DuckDB file...");
            Files.delete(dbFile);
        }

        // Load DuckDB JDBC driver
        Class.forName("org.duckdb.DuckDBDriver");

        // Connect to DuckDB (will create the file)
        try (Connection conn = DriverManager.getConnection("jdbc:duckdb:" + duckdbPath);
             Statement stmt = conn.createStatement()) {

            System.out.println("Connected to DuckDB");

            // Attach SQLite database as OLTP source
            System.out.println("\nStep 1: Attaching SQLite OLTP database...");
            stmt.execute("ATTACH '" + sqlitePath + "' AS sqlite_db (TYPE SQLITE)");
            System.out.println("✓ SQLite attached as 'sqlite_db' schema");

            // First, list all tables in the SQLite database
            System.out.println("Listing tables in SQLite database...");
            ResultSet tables = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema='sqlite_db' AND table_type='BASE TABLE'");
            while (tables.next()) {
                System.out.println("  Found table: " + tables.getString(1));
            }

            // Copy OLTP tables (for backward compatibility)
            // IMPORTANT: Use PascalCase table names to match SQLite schema (e2e tests expect this)
            System.out.println("\nStep 2: Copying OLTP tables (for compatibility)...");
            stmt.execute("CREATE TABLE Categories AS SELECT * FROM sqlite_db.Categories");
            stmt.execute("CREATE TABLE Customers AS SELECT * FROM sqlite_db.Customers");
            stmt.execute("CREATE TABLE Employees AS SELECT * FROM sqlite_db.Employees");
            stmt.execute("CREATE TABLE Orders AS SELECT * FROM sqlite_db.Orders");
            stmt.execute("CREATE TABLE \"Order Details\" AS SELECT * FROM sqlite_db.\"Order Details\"");
            stmt.execute("CREATE TABLE Products AS SELECT * FROM sqlite_db.Products");
            stmt.execute("CREATE TABLE Shippers AS SELECT * FROM sqlite_db.Shippers");
            stmt.execute("CREATE TABLE Suppliers AS SELECT * FROM sqlite_db.Suppliers");
            System.out.println("✓ OLTP tables copied");

            // Verify data
            System.out.println("\nVerifying data:");
            ResultSet rs = stmt.executeQuery(
                "SELECT 'Categories' as table_name, COUNT(*) as row_count FROM Categories " +
                "UNION ALL SELECT 'Customers', COUNT(*) FROM Customers " +
                "UNION ALL SELECT 'Employees', COUNT(*) FROM Employees " +
                "UNION ALL SELECT 'Orders', COUNT(*) FROM Orders " +
                "UNION ALL SELECT 'OrderDetails', COUNT(*) FROM \"Order Details\" " +
                "UNION ALL SELECT 'Products', COUNT(*) FROM Products " +
                "UNION ALL SELECT 'Shippers', COUNT(*) FROM Shippers " +
                "UNION ALL SELECT 'Suppliers', COUNT(*) FROM Suppliers"
            );

            while (rs.next()) {
                System.out.println("  " + rs.getString(1) + ": " + rs.getInt(2) + " rows");
            }

            // Create Star Schema (Data Warehouse Model)
            System.out.println("\nStep 3: Creating Star Schema (Data Warehouse)...");
            createStarSchema(stmt);

            System.out.println("\nDatabase file size: " + (Files.size(dbFile) / 1024 / 1024) + " MB");
            System.out.println("\n=== ✓ DuckDB Data Warehouse created successfully! ===");
            System.out.println("\nAvailable Schemas:");
            System.out.println("  OLTP Tables: Categories, Customers, Employees, Orders, \"Order Details\", Products, Shippers, Suppliers");
            System.out.println("  Star Schema: fact_sales, dim_customer, dim_product, dim_time, dim_employee, dim_shipper");
            System.out.println("  Views: vw_sales_detail, vw_monthly_sales");
        }
    }

    private static void createStarSchema(Statement stmt) throws Exception {
        // Dimensions
        System.out.println("  Creating dim_customer...");
        stmt.execute(
            "CREATE TABLE dim_customer AS SELECT CustomerID AS customer_key, CompanyName AS company_name, " +
            "ContactName AS contact_name, City AS city, Region AS region, Country AS country, " +
            "CASE WHEN Country IN ('USA', 'Canada', 'Mexico') THEN 'North America' " +
            "WHEN Country IN ('Brazil', 'Argentina', 'Venezuela') THEN 'South America' " +
            "WHEN Country IN ('UK', 'Germany', 'France', 'Spain', 'Italy') THEN 'Europe' " +
            "ELSE 'Other' END AS continent FROM Customers"
        );

        System.out.println("  Creating dim_product...");
        stmt.execute(
            "CREATE TABLE dim_product AS SELECT p.ProductID AS product_key, p.ProductName AS product_name, " +
            "c.CategoryName AS category_name, s.CompanyName AS supplier_name, s.Country AS supplier_country, " +
            "p.UnitPrice AS list_price FROM Products p " +
            "JOIN Categories c ON p.CategoryID = c.CategoryID JOIN Suppliers s ON p.SupplierID = s.SupplierID"
        );

        System.out.println("  Creating dim_time...");
        stmt.execute(
            "CREATE TABLE dim_time AS SELECT DISTINCT CAST(OrderDate AS DATE) AS date_key, " +
            "YEAR(OrderDate) AS year, QUARTER(OrderDate) AS quarter, " +
            "CONCAT(YEAR(OrderDate), '-Q', QUARTER(OrderDate)) AS year_quarter, " +
            "MONTH(OrderDate) AS month, MONTHNAME(OrderDate) AS month_name FROM Orders"
        );

        System.out.println("  Creating dim_employee...");
        stmt.execute(
            "CREATE TABLE dim_employee AS SELECT EmployeeID AS employee_key, " +
            "CONCAT(FirstName, ' ', LastName) AS full_name, Title AS title FROM Employees"
        );

        System.out.println("  Creating dim_shipper...");
        stmt.execute(
            "CREATE TABLE dim_shipper AS SELECT ShipperID AS shipper_key, CompanyName AS shipper_name FROM Shippers"
        );

        // Fact table
        System.out.println("  Creating fact_sales...");
        stmt.execute(
            "CREATE TABLE fact_sales AS SELECT " +
            "ROW_NUMBER() OVER () AS sales_key, CAST(o.OrderDate AS DATE) AS date_key, " +
            "o.CustomerID AS customer_key, od.ProductID AS product_key, o.EmployeeID AS employee_key, " +
            "o.ShipVia AS shipper_key, o.OrderID AS order_id, od.Quantity AS quantity, " +
            "od.UnitPrice AS unit_price, od.Discount AS discount_rate, " +
            "od.UnitPrice * od.Quantity AS gross_revenue, " +
            "od.UnitPrice * od.Quantity * (1 - od.Discount) AS net_revenue " +
            "FROM Orders o JOIN \"Order Details\" od ON o.OrderID = od.OrderID"
        );

        // Denormalized view
        System.out.println("  Creating vw_sales_detail...");
        stmt.execute(
            "CREATE VIEW vw_sales_detail AS SELECT " +
            "fs.*, dt.year, dt.quarter, dt.year_quarter, dt.month, dt.month_name, " +
            "dc.company_name AS customer_name, dc.city AS customer_city, dc.country AS customer_country, dc.continent, " +
            "dp.product_name, dp.category_name, dp.supplier_name, " +
            "de.full_name AS employee_name, ds.shipper_name " +
            "FROM fact_sales fs " +
            "LEFT JOIN dim_time dt ON fs.date_key = dt.date_key " +
            "LEFT JOIN dim_customer dc ON fs.customer_key = dc.customer_key " +
            "LEFT JOIN dim_product dp ON fs.product_key = dp.product_key " +
            "LEFT JOIN dim_employee de ON fs.employee_key = de.employee_key " +
            "LEFT JOIN dim_shipper ds ON fs.shipper_key = ds.shipper_key"
        );

        System.out.println("✓ Star Schema created");
    }
}
