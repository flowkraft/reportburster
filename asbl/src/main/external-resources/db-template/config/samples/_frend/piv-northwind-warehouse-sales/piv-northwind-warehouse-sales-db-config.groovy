/*
 * Pivot Table Configuration - Northwind Data Warehouse
 * Connects to northwind.duckdb and queries the vw_sales_detail denormalized view
 */

// Database connection settings
dbConnection {
    // Connection name (must match a configured connection)
    name = 'northwind-duckdb'

    // Database vendor
    vendor = 'duckdb'

    // Database file path (relative to config directory)
    database = '../db/sample-northwind-duckdb/northwind.duckdb'

    // SQL query to fetch data from the Star Schema view
    query = '''
        SELECT
            sales_key,
            year,
            quarter,
            year_quarter,
            month_name,
            customer_name,
            customer_country,
            continent,
            category_name,
            product_name,
            employee_name,
            quantity,
            unit_price,
            net_revenue,
            gross_revenue
        FROM vw_sales_detail
        ORDER BY year, quarter, customer_country, category_name
    '''
}
