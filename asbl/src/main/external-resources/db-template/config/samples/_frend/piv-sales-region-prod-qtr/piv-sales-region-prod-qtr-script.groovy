/*
 * Pivot Table Test Data - Sales by Region/Product/Quarter
 * Creates in-memory data suitable for pivot table analysis
 */

log.info("Starting pivotTable_salesData.groovy - generating in-memory sales data...")

// Generate realistic sales data in memory (no database connection needed)
def salesData = []

// Define dimensions
def regions = ['North', 'South', 'East', 'West']
def products = ['Laptop', 'Phone', 'Tablet', 'Monitor']
def quarters = ['Q1', 'Q2', 'Q3', 'Q4']
def salesReps = ['Alice', 'Bob', 'Carol', 'David']

// Generate sample data - each combination gets a realistic sales figure
def random = new Random(42) // Fixed seed for reproducibility

regions.each { region ->
    products.each { product ->
        quarters.each { quarter ->
            // Pick a random sales rep
            def rep = salesReps[random.nextInt(salesReps.size())]
            
            // Generate realistic values based on product type
            def basePrice = [Laptop: 1200, Phone: 800, Tablet: 500, Monitor: 350][product]
            def quantity = random.nextInt(20) + 5  // 5-24 units
            def revenue = basePrice * quantity
            def cost = (revenue * (0.6 + random.nextDouble() * 0.15)).round(2)  // 60-75% of revenue
            def profit = revenue - cost
            
            salesData << new LinkedHashMap([
                Region: region,
                Product: product,
                Quarter: quarter,
                SalesRep: rep,
                Quantity: quantity,
                Revenue: revenue,
                Cost: cost.round(2),
                Profit: profit.round(2)
            ])
        }
    }
}

// Set the context variables as expected by ReportBurster
ctx.reportData = salesData
ctx.reportColumnNames = ['Region', 'Product', 'Quarter', 'SalesRep', 'Quantity', 'Revenue', 'Cost', 'Profit']

log.info("Generated {} sales records for pivot table testing.", ctx.reportData.size())
log.debug("Sample row: {}", ctx.reportData[0])
log.info("Finished pivotTable_salesData.groovy successfully.")