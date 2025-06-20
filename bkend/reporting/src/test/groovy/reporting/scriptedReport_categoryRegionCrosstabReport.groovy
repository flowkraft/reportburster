import groovy.sql.Sql
import java.math.BigDecimal
import java.math.RoundingMode // Import RoundingMode
import java.util.LinkedHashMap // To preserve column order
import java.util.HashSet       // To collect unique countries
import java.util.TreeSet       // To sort countries alphabetically

// Use the Sql instance and logger provided by ScriptedReporter
def dbSql = ctx.dbSql 

log.info("Starting scriptedReport_categoryRegionCrosstabReport.groovy...")

// --- 1. Define SQL Query ---
// ... (SQL query remains the same) ...
def rawDataSql = """
SELECT
    C."CategoryName",
    Cust."Country",
    (OD."UnitPrice" * OD."Quantity" * (1 - OD."Discount")) AS LineSalesAmount
FROM "Categories" C
JOIN "Products" P ON C."CategoryID" = P."CategoryID"
JOIN "Order Details" OD ON P."ProductID" = OD."ProductID"
JOIN "Orders" O ON OD."OrderID" = O."OrderID"
JOIN "Customers" Cust ON O."CustomerID" = Cust."CustomerID"
WHERE Cust."Country" IS NOT NULL -- Ensure we have a country for pivoting
"""

// --- 2. Fetch and Process Data ---
def salesByCategoryAndCountry = [:]
def allCountries = new HashSet<String>()
def crosstabData = [] // Define upfront

try {
    log.debug("Executing raw data query...")
    def rawRows = dbSql.rows(rawDataSql)
    log.info("Fetched {} raw sales detail rows.", rawRows.size())

    if (rawRows.isEmpty()) {
        log.warn("No raw sales data found. Crosstab report will be empty.")
    } else {
        // Aggregate sales data
        rawRows.each { row ->
            String category = row.CategoryName
            String country = row.Country
            BigDecimal sales = row.LineSalesAmount instanceof BigDecimal ? row.LineSalesAmount : (row.LineSalesAmount != null ? new BigDecimal(row.LineSalesAmount.toString()) : BigDecimal.ZERO)
            allCountries.add(country)
            if (!salesByCategoryAndCountry.containsKey(category)) { salesByCategoryAndCountry[category] = [:] }
            if (!salesByCategoryAndCountry[category].containsKey(country)) { salesByCategoryAndCountry[category][country] = BigDecimal.ZERO }
            salesByCategoryAndCountry[category][country] += sales
        }
        log.info("Aggregated sales across {} categories and {} countries.", salesByCategoryAndCountry.size(), allCountries.size())

        // --- 3. Structure Data for Crosstab Template ---
        def sortedCountries = new TreeSet<>(allCountries) 
        log.debug("Sorted countries for columns: {}", sortedCountries)

        salesByCategoryAndCountry.keySet().sort().each { categoryName ->
            def categorySales = salesByCategoryAndCountry[categoryName]
            def rowMap = new LinkedHashMap<String, Object>() 
            rowMap.put("CategoryName", categoryName)
            BigDecimal categoryTotalSales = BigDecimal.ZERO
            sortedCountries.each { country ->
                BigDecimal salesInCountry = categorySales.get(country, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP) 
                rowMap.put(country, salesInCountry) 
                categoryTotalSales += salesInCountry
            }
            rowMap.put("TotalSales", categoryTotalSales.setScale(2, RoundingMode.HALF_UP)) 
            crosstabData.add(rowMap)
            // Limit detailed row logging if it gets too verbose
            if (crosstabData.size() <= 5) { // Log first 5 rows only
                 log.debug("Created crosstab row: {}", rowMap)
            } else if (crosstabData.size() == 6) {
                 log.debug("... (further row details omitted for brevity)")
            }
        }
        log.info("Successfully structured data into crosstab format. Total rows: {}", crosstabData.size())
        if (!crosstabData.isEmpty()) {
            log.debug("First row of crosstabData: {}", crosstabData[0])
            log.debug("Keys in first row: {}", crosstabData[0].keySet())
        }
    }

    // --- 4. Set Context Variables ---

    // Set ctx.reportData (used by reporter for iteration/token generation)
    ctx.reportData = crosstabData
    log.info("Set ctx.reportData. Size: {}", (ctx.reportData instanceof List ? ((List)ctx.reportData).size() : 'N/A'))

    // Optionally, set column names
    if (!crosstabData.isEmpty()) {
        ctx.reportColumnNames = new ArrayList<>(crosstabData.get(0).keySet())
        log.debug("Explicitly set column names: {}", ctx.reportColumnNames)
    } else {
        ctx.reportColumnNames = []
        log.warn("No crosstab data was generated, columnNames set to empty.")
    }

    log.info("Finished scriptedReport_categoryRegionCrosstabReport.groovy. Prepared data for {} categories.", ctx.reportData.size())

} catch (Exception e) {
    log.error("FATAL Error during script execution: {}", e.message, e)
    // Ensure context is clean on error
    ctx.reportData = []
    ctx.reportColumnNames = []
    throw e // Re-throw
} finally {
    log.debug("Script execution finished.")
}