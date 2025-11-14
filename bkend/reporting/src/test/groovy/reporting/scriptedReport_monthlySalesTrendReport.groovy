import groovy.sql.Sql
import java.math.BigDecimal
import java.time.format.DateTimeFormatter

// Use the Sql instance provided by ScriptedReporter
def dbSql = ctx.dbSql

log.info("Starting scriptedReport_monthlySalesTrendReport.groovy...")

// --- 1. Define SQL Query to Aggregate Sales and Orders by Month ---

// This query calculates total sales and counts distinct orders for each month.
// It uses H2's FORMATDATETIME function to get 'YYYY-MM' format for grouping.
// LineSalesAmount = UnitPrice * Quantity * (1 - Discount)
def monthlyDataSql = """
SELECT
    FORMATDATETIME(O."OrderDate", 'yyyy-MM') AS YearMonth,
    SUM(OD."UnitPrice" * OD."Quantity" * (1 - OD."Discount")) AS MonthlySales,
    COUNT(DISTINCT O."OrderID") AS OrderCount
FROM "Orders" O
JOIN "Order Details" OD ON O."OrderID" = OD."OrderID"
WHERE O."OrderDate" IS NOT NULL
GROUP BY FORMATDATETIME(O."OrderDate", 'yyyy-MM')
ORDER BY YearMonth ASC -- Ensure chronological order for the chart
"""

// --- 2. Fetch Aggregated Data ---

try {
    log.debug("Executing monthly aggregation query...")
    // dbSql.rows() returns a List<GroovyRowResult>, which is already a list of map-like objects
    def aggregatedData = dbSql.rows(monthlyDataSql)
    log.info("Fetched {} aggregated monthly data points.", aggregatedData.size())

    // The structure returned by dbSql.rows() matches what the template expects:
    // [{YearMonth=2025-01, MonthlySales=143.30..., OrderCount=1}, {YearMonth=2025-02, ...}]
    // We just need to ensure the BigDecimal values are handled correctly if needed,
    // but Freemarker/Chart.js usually handle numbers well.

    // --- 3. Set Context Variable for Template ---

    ctx.reportData = aggregatedData.collect { new java.util.LinkedHashMap(it) }
    
    if (aggregatedData.isEmpty()) {
        log.warn("No monthly sales data was found or generated.")
    }

    log.info("Finished scriptedReport_monthlySalesTrendReport.groovy successfully.")

} catch (Exception e) {
    log.error("Error during script execution: {}", e.message, e)
    // Ensure context variables are empty lists in case of error
    ctx.reportData = [] // Also clear reportData just in case
    ctx.reportColumnNames = []
    throw e // Re-throw the exception to indicate failure
} finally {
    // dbSql connection is managed by the calling ScriptedReporter (closed in its finally block)
    log.debug("Script execution finished (dbSql closure handled by Java).")
}