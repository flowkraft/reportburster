import groovy.sql.Sql

def dbSql = ctx.dbSql
def componentId = ctx.variables?.get('componentId')

// Get filter parameters from ctx.variables (the correct API for accessing report parameters)
// Note: ctx.token may be null during data fetch, so use empty string as fallback
def userVars = ctx.variables.getUserVariables(ctx.token ?: '')
def country = userVars?.get('country')?.toString()
def filterByCountry = country && country != 'null' && country != 'All' && country != '-- All --' && country.trim() != ''

log.info("Dashboard params - componentId: {}, country: {}, filterByCountry: {}", componentId, country, filterByCountry)

// KPI base query (shared WHERE clause)
def kpiBase = """
    FROM Orders o
    JOIN "Order Details" od ON o.OrderID = od.OrderID
"""
if (filterByCountry) kpiBase += " WHERE o.ShipCountry = '${country}'"

// Component: atomicValues — single query returning all 4 KPI values as columns
if (!componentId || componentId == 'atomicValues') {
    def data = dbSql.rows("""
        SELECT
            ROUND(SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)), 0) AS revenue,
            COUNT(DISTINCT o.OrderID) AS orders,
            ROUND(SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) / COUNT(DISTINCT o.OrderID), 0) AS avgOrderValue,
            COUNT(DISTINCT o.CustomerID) AS customers
    """ + kpiBase)
    ctx.reportData('atomicValues', data)
}

// Component: revenueTrend (Chart — monthly revenue)
if (!componentId || componentId == 'revenueTrend') {
    def sql = """
        SELECT
            STRFTIME('%Y-%m', o.OrderDate / 1000, 'unixepoch') AS month,
            ROUND(SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)), 0) AS revenue
        FROM Orders o
        JOIN "Order Details" od ON o.OrderID = od.OrderID
        WHERE o.OrderDate IS NOT NULL
    """
    if (filterByCountry) sql += " AND o.ShipCountry = '${country}'"
    sql += " GROUP BY STRFTIME('%Y-%m', o.OrderDate / 1000, 'unixepoch') ORDER BY month"
    def data = dbSql.rows(sql)
    ctx.reportData('revenueTrend', data)
}

// Component: revenueByCategory (Chart — revenue per product category)
if (!componentId || componentId == 'revenueByCategory') {
    def sql = """
        SELECT
            c.CategoryName AS category,
            ROUND(SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)), 0) AS revenue
        FROM "Order Details" od
        JOIN Products p ON od.ProductID = p.ProductID
        JOIN Categories c ON p.CategoryID = c.CategoryID
        JOIN Orders o ON od.OrderID = o.OrderID
    """
    if (filterByCountry) sql += " WHERE o.ShipCountry = '${country}'"
    sql += " GROUP BY c.CategoryName ORDER BY revenue DESC"
    def data = dbSql.rows(sql)
    ctx.reportData('revenueByCategory', data)
}

// Component: topCustomers (Tabulator — top 10 by revenue)
if (!componentId || componentId == 'topCustomers') {
    def sql = """
        SELECT
            cu.CompanyName AS company,
            cu.Country AS country,
            cu.ContactName AS contact,
            COUNT(DISTINCT o.OrderID) AS orders,
            ROUND(SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)), 2) AS revenue
        FROM Customers cu
        JOIN Orders o ON cu.CustomerID = o.CustomerID
        JOIN "Order Details" od ON o.OrderID = od.OrderID
    """
    if (filterByCountry) sql += " WHERE o.ShipCountry = '${country}'"
    sql += " GROUP BY cu.CustomerID, cu.CompanyName, cu.Country, cu.ContactName ORDER BY revenue DESC LIMIT 10"
    def data = dbSql.rows(sql)
    ctx.reportData('topCustomers', data)
}

// Component: orderExplorer (Pivot Table — orders by country, category, year)
if (!componentId || componentId == 'orderExplorer') {
    def sql = """
        SELECT
            o.ShipCountry AS country,
            c.CategoryName AS category,
            STRFTIME('%Y', o.OrderDate / 1000, 'unixepoch') AS year,
            ROUND(SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)), 2) AS revenue,
            SUM(od.Quantity) AS quantity
        FROM Orders o
        JOIN "Order Details" od ON o.OrderID = od.OrderID
        JOIN Products p ON od.ProductID = p.ProductID
        JOIN Categories c ON p.CategoryID = c.CategoryID
        WHERE o.OrderDate IS NOT NULL
    """
    if (filterByCountry) sql += " AND o.ShipCountry = '${country}'"
    sql += " GROUP BY o.ShipCountry, c.CategoryName, STRFTIME('%Y', o.OrderDate / 1000, 'unixepoch') ORDER BY country, category, year"
    def data = dbSql.rows(sql)
    ctx.reportData('orderExplorer', data)
}
