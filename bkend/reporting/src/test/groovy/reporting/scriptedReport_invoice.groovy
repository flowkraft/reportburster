// ... imports ...
import java.math.BigDecimal
import java.math.RoundingMode

def dbSql = ctx.dbSql

log.info("Starting scriptedReport_invoice.groovy...")

// --- 1. Define SQL Queries ---

// Master query: Fetch Order header info for specific Customers ('ALFKI', 'ANATR')
// Ordering by OrderID is still good practice for consistency within the script's loop
def masterSql = """
SELECT
    O."OrderID",
    O."OrderDate",
    O."CustomerID",
    C."CompanyName",
    O."Freight"
FROM "Orders" O
JOIN "Customers" C ON O."CustomerID" = C."CustomerID"
WHERE O."CustomerID" IN ('ALFKI', 'ANATR')  
ORDER BY O."OrderID" 
""" 

def detailSql = """
SELECT
    OD."Quantity",
    OD."UnitPrice",
    OD."Discount",
    P."ProductName"
FROM "Order Details" OD
JOIN "Products" P ON OD."ProductID" = P."ProductID"
WHERE OD."OrderID" = ?
ORDER BY P."ProductName"
"""

// --- 2. Fetch Data and Structure It ---

def allInvoicesData = [] 

try {
    log.debug("Executing master query for customers ALFKI, ANATR...")
    def masterRows = dbSql.rows(masterSql) 
    log.info("Fetched {} master order rows.", masterRows.size())

    masterRows.each { masterRow ->
        def invoiceData = new LinkedHashMap<String, Object>()
        // Copy master data (OrderID, OrderDate, CustomerID, CompanyName, Freight)
        invoiceData.putAll(masterRow) // GroovyRowResult is Map-like

        def orderId = masterRow.OrderID // Get the actual OrderID
        log.debug("Fetching details for OrderID: {}", orderId)

        // Fetch detail rows for this specific orderId
        def detailRows = dbSql.rows(detailSql, orderId) // Pass orderId as parameter
        log.debug("Fetched {} detail rows for OrderID: {}", detailRows.size(), orderId)

        // Add details as a nested list of maps
        def detailsList = []
        detailRows.each { detailRow ->
            def detailMap = new LinkedHashMap<String, Object>()
            detailMap.putAll(detailRow) // Copy detail data
            detailsList.add(detailMap)
        }
        invoiceData.put("details", detailsList) // Add the list of details to the invoice map

        // Add calculated fields (Subtotal, Tax, GrandTotal) - reusing logic from template/test
        BigDecimal subtotal = BigDecimal.ZERO
        detailsList.each { detail ->
            BigDecimal price = detail.UnitPrice instanceof BigDecimal ? detail.UnitPrice : new BigDecimal(detail.UnitPrice.toString())
            BigDecimal qty = new BigDecimal(detail.Quantity.toString())
            BigDecimal discount = detail.Discount instanceof BigDecimal ? detail.Discount : new BigDecimal(detail.Discount.toString())
            BigDecimal lineTotal = price.multiply(qty).multiply(BigDecimal.ONE.subtract(discount))
            subtotal = subtotal.add(lineTotal)
        }
        BigDecimal freight = masterRow.Freight instanceof BigDecimal ? masterRow.Freight : new BigDecimal(masterRow.Freight.toString())
        BigDecimal taxRate = new BigDecimal("0.08") // Assuming 8% tax
        BigDecimal taxableAmount = subtotal.add(freight)
        BigDecimal tax = taxableAmount.multiply(taxRate)
        BigDecimal grandTotal = taxableAmount.add(tax)

        // Add calculated values, formatted as strings for the template
        invoiceData.put("Subtotal", subtotal.setScale(2, RoundingMode.HALF_UP).toString())
        invoiceData.put("Tax", tax.setScale(2, RoundingMode.HALF_UP).toString())
        invoiceData.put("GrandTotal", grandTotal.setScale(2, RoundingMode.HALF_UP).toString())


        allInvoicesData.add(invoiceData) // Add the complete invoice map to the main list
    }

    // --- 3. Set Context Variables ---
    ctx.reportData = allInvoicesData

    if (!allInvoicesData.isEmpty()) {
        // Extract column names from the first row's keys (excluding nested 'details')
        ctx.reportColumnNames = new ArrayList<>(allInvoicesData.get(0).keySet().findAll { it != 'details' })
        log.debug("Explicitly set column names: {}", ctx.reportColumnNames)
    } else {
        log.warn("No invoice data was generated.")
        ctx.reportColumnNames = [] // Ensure it's an empty list if no data
    }

    log.info("Finished scriptedReport_invoice.groovy. Prepared data for {} invoices.", ctx.reportData.size())

} catch (Exception e) {
    log.error("Error during script execution: {}", e.getMessage(), e) // Log full exception
    throw e // Re-throw to fail the process
} finally {
    // dbSql connection is managed by ScriptedReporter, no need to close here
}