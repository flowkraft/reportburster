/*
 * Pivot Table Examples - Sample Data Generator
 *
 * This script provides IN-MEMORY SAMPLE DATA for the 15 pivot table examples.
 * Each dataset is carefully crafted to demonstrate the specific pivot table
 * feature's strengths: aggregation for sum/count, cross-tabulation for
 * multi-dimension analysis, filtering for status exclusion, etc.
 *
 * In real-world reports, this script would typically fetch data from:
 *   - A database (or multiple databases)
 *   - REST APIs or web services
 *   - CSV/Excel files or other data sources
 * The inline data here is just for demonstration purposes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Performance: componentId guardrail
//
// When served inside a dashboard, each visualization component triggers a
// separate HTTP request with ?componentId=<id>.  Without the guard below,
// every request would execute ALL data-fetching blocks — producing N × M
// database calls (N components × M queries).  The guard ensures only the
// block matching the requested componentId runs.
// ─────────────────────────────────────────────────────────────────────────────
def componentId = ctx.variables?.get('componentId')

log.info("Starting piv-examples data generation... componentId=${componentId ?: '(all)'}")

// ─────────────────────────────────────────────────────────────────────────────
// salesByRegionSum — Revenue by Region (Sum)
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'salesByRegionSum') {
    def salesByRegionData = [
        [region: 'North America', revenue: 342000],
        [region: 'North America', revenue: 285000],
        [region: 'Europe',        revenue: 289000],
        [region: 'Europe',        revenue: 198000],
        [region: 'Asia Pacific',  revenue: 198000],
        [region: 'Asia Pacific',  revenue: 156000],
        [region: 'Latin America', revenue: 134000],
        [region: 'Middle East',   revenue: 87000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('salesByRegionSum', salesByRegionData)
}

// ─────────────────────────────────────────────────────────────────────────────
// orderCountByProductQuarter — Order Count Cross-Tab
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'orderCountByProductQuarter') {
    def orderCountData = [
        [product: 'Widget A', quarter: 'Q1'],
        [product: 'Widget A', quarter: 'Q1'],
        [product: 'Widget A', quarter: 'Q2'],
        [product: 'Widget A', quarter: 'Q3'],
        [product: 'Widget A', quarter: 'Q3'],
        [product: 'Widget A', quarter: 'Q4'],
        [product: 'Widget B', quarter: 'Q1'],
        [product: 'Widget B', quarter: 'Q2'],
        [product: 'Widget B', quarter: 'Q2'],
        [product: 'Widget B', quarter: 'Q3'],
        [product: 'Widget B', quarter: 'Q4'],
        [product: 'Widget B', quarter: 'Q4'],
        [product: 'Gadget X', quarter: 'Q1'],
        [product: 'Gadget X', quarter: 'Q2'],
        [product: 'Gadget X', quarter: 'Q3'],
        [product: 'Gadget X', quarter: 'Q3'],
        [product: 'Gadget X', quarter: 'Q4']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('orderCountByProductQuarter', orderCountData)
}

// ─────────────────────────────────────────────────────────────────────────────
// revenueMultiDimension — Multi-Dimension Pivot
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'revenueMultiDimension') {
    def multiDimData = [
        [region: 'North America', country: 'USA',     productLine: 'Software',  revenue: 245000],
        [region: 'North America', country: 'USA',     productLine: 'Services',  revenue: 98000],
        [region: 'North America', country: 'Canada',  productLine: 'Software',  revenue: 87000],
        [region: 'North America', country: 'Canada',  productLine: 'Services',  revenue: 42000],
        [region: 'Europe',        country: 'Germany', productLine: 'Software',  revenue: 156000],
        [region: 'Europe',        country: 'Germany', productLine: 'Services',  revenue: 67000],
        [region: 'Europe',        country: 'UK',      productLine: 'Software',  revenue: 134000],
        [region: 'Europe',        country: 'UK',      productLine: 'Services',  revenue: 58000],
        [region: 'Asia Pacific',  country: 'Japan',   productLine: 'Software',  revenue: 112000],
        [region: 'Asia Pacific',  country: 'Japan',   productLine: 'Services',  revenue: 45000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('revenueMultiDimension', multiDimData)
}

// ─────────────────────────────────────────────────────────────────────────────
// avgOrderValueByChannel — Average Aggregator
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'avgOrderValueByChannel') {
    def avgOrderData = [
        [salesChannel: 'Direct',      orderValue: 450],
        [salesChannel: 'Direct',      orderValue: 520],
        [salesChannel: 'Direct',      orderValue: 380],
        [salesChannel: 'Partner',     orderValue: 310],
        [salesChannel: 'Partner',     orderValue: 280],
        [salesChannel: 'Partner',     orderValue: 340],
        [salesChannel: 'Marketplace', orderValue: 125],
        [salesChannel: 'Marketplace', orderValue: 95],
        [salesChannel: 'Marketplace', orderValue: 180],
        [salesChannel: 'Enterprise',  orderValue: 2800],
        [salesChannel: 'Enterprise',  orderValue: 3500],
        [salesChannel: 'Enterprise',  orderValue: 4200]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('avgOrderValueByChannel', avgOrderData)
}

// ─────────────────────────────────────────────────────────────────────────────
// filteredByStatus — Value Filter
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'filteredByStatus') {
    def filteredData = [
        [category: 'Electronics', revenue: 185000, status: 'Active'],
        [category: 'Electronics', revenue: 12000,  status: 'Inactive'],
        [category: 'Clothing',    revenue: 134000, status: 'Active'],
        [category: 'Clothing',    revenue: 5000,   status: 'Pending'],
        [category: 'Food',        revenue: 98000,  status: 'Active'],
        [category: 'Food',        revenue: 8000,   status: 'Inactive'],
        [category: 'Furniture',   revenue: 76000,  status: 'Active'],
        [category: 'Furniture',   revenue: 3500,   status: 'Pending']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('filteredByStatus', filteredData)
}

// ─────────────────────────────────────────────────────────────────────────────
// sortedRevenue — Sorted by Value Descending
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'sortedRevenue') {
    def sortedRevenueData = [
        [region: 'West',    year: '2023', revenue: 198000],
        [region: 'West',    year: '2024', revenue: 245000],
        [region: 'West',    year: '2025', revenue: 278000],
        [region: 'Central', year: '2023', revenue: 156000],
        [region: 'Central', year: '2024', revenue: 167000],
        [region: 'Central', year: '2025', revenue: 189000],
        [region: 'East',    year: '2023', revenue: 312000],
        [region: 'East',    year: '2024', revenue: 345000],
        [region: 'East',    year: '2025', revenue: 398000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('sortedRevenue', sortedRevenueData)
}

// ─────────────────────────────────────────────────────────────────────────────
// customSorters — Custom Sort Order
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'customSorters') {
    def sortersData = [
        [region: 'East',          revenue: 312000],
        [region: 'Central',       revenue: 178000],
        [region: 'West',          revenue: 245000],
        [region: 'International', revenue: 89000],
        [region: 'East',          revenue: 287000],
        [region: 'Central',       revenue: 156000],
        [region: 'West',          revenue: 198000],
        [region: 'International', revenue: 67000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('customSorters', sortersData)
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline renderers — separate datasets optimized per visualization
// ─────────────────────────────────────────────────────────────────────────────

// Heatmap — wide value range for dramatic color gradient
if (!componentId || componentId == 'pipelineHeatmap') {
    def heatmapData = [
        [dealStage: 'Prospecting',   salesRep: 'Nora',  dealValue: 85000],
        [dealStage: 'Prospecting',   salesRep: 'Marco', dealValue: 65000],
        [dealStage: 'Prospecting',   salesRep: 'Priya', dealValue: 55000],
        [dealStage: 'Qualification', salesRep: 'Nora',  dealValue: 145000],
        [dealStage: 'Qualification', salesRep: 'Marco', dealValue: 115000],
        [dealStage: 'Qualification', salesRep: 'Priya', dealValue: 175000],
        [dealStage: 'Proposal',      salesRep: 'Nora',  dealValue: 240000],
        [dealStage: 'Proposal',      salesRep: 'Marco', dealValue: 180000],
        [dealStage: 'Proposal',      salesRep: 'Priya', dealValue: 150000],
        [dealStage: 'Negotiation',   salesRep: 'Nora',  dealValue: 310000],
        [dealStage: 'Negotiation',   salesRep: 'Marco', dealValue: 215000],
        [dealStage: 'Negotiation',   salesRep: 'Priya', dealValue: 265000],
        [dealStage: 'Closed Won',    salesRep: 'Nora',  dealValue: 155000],
        [dealStage: 'Closed Won',    salesRep: 'Marco', dealValue: 190000],
        [dealStage: 'Closed Won',    salesRep: 'Priya', dealValue: 130000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('pipelineHeatmap', heatmapData)
}

// Grouped bar — larger individual values so side-by-side bars are clearly visible
if (!componentId || componentId == 'pipelineGroupedBar') {
    def groupedBarData = [
        [dealStage: 'Prospecting',   salesRep: 'Nora',  dealValue: 120000],
        [dealStage: 'Prospecting',   salesRep: 'Marco', dealValue: 85000],
        [dealStage: 'Prospecting',   salesRep: 'Priya', dealValue: 95000],
        [dealStage: 'Qualification', salesRep: 'Nora',  dealValue: 195000],
        [dealStage: 'Qualification', salesRep: 'Marco', dealValue: 160000],
        [dealStage: 'Qualification', salesRep: 'Priya', dealValue: 230000],
        [dealStage: 'Proposal',      salesRep: 'Nora',  dealValue: 310000],
        [dealStage: 'Proposal',      salesRep: 'Marco', dealValue: 240000],
        [dealStage: 'Proposal',      salesRep: 'Priya', dealValue: 195000],
        [dealStage: 'Negotiation',   salesRep: 'Nora',  dealValue: 380000],
        [dealStage: 'Negotiation',   salesRep: 'Marco', dealValue: 270000],
        [dealStage: 'Negotiation',   salesRep: 'Priya', dealValue: 340000],
        [dealStage: 'Closed Won',    salesRep: 'Nora',  dealValue: 210000],
        [dealStage: 'Closed Won',    salesRep: 'Marco', dealValue: 255000],
        [dealStage: 'Closed Won',    salesRep: 'Priya', dealValue: 175000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('pipelineGroupedBar', groupedBarData)
}

// Line chart — values rise through pipeline stages then drop at close
if (!componentId || componentId == 'pipelineLineChart') {
    def lineChartData = [
        [dealStage: 'Prospecting',   salesRep: 'Nora',  dealValue: 75000],
        [dealStage: 'Prospecting',   salesRep: 'Marco', dealValue: 55000],
        [dealStage: 'Prospecting',   salesRep: 'Priya', dealValue: 60000],
        [dealStage: 'Qualification', salesRep: 'Nora',  dealValue: 130000],
        [dealStage: 'Qualification', salesRep: 'Marco', dealValue: 100000],
        [dealStage: 'Qualification', salesRep: 'Priya', dealValue: 145000],
        [dealStage: 'Proposal',      salesRep: 'Nora',  dealValue: 210000],
        [dealStage: 'Proposal',      salesRep: 'Marco', dealValue: 165000],
        [dealStage: 'Proposal',      salesRep: 'Priya', dealValue: 175000],
        [dealStage: 'Negotiation',   salesRep: 'Nora',  dealValue: 280000],
        [dealStage: 'Negotiation',   salesRep: 'Marco', dealValue: 195000],
        [dealStage: 'Negotiation',   salesRep: 'Priya', dealValue: 240000],
        [dealStage: 'Closed Won',    salesRep: 'Nora',  dealValue: 160000],
        [dealStage: 'Closed Won',    salesRep: 'Marco', dealValue: 200000],
        [dealStage: 'Closed Won',    salesRep: 'Priya', dealValue: 135000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('pipelineLineChart', lineChartData)
}

// ─────────────────────────────────────────────────────────────────────────────
// revenuePerUnit — Revenue per Unit (Sum over Sum Ratio)
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'revenuePerUnit') {
    def multiValueData = [
        [product: 'Widget A', quarter: 'Q1', revenue: 45000, quantity: 150],
        [product: 'Widget A', quarter: 'Q2', revenue: 52000, quantity: 173],
        [product: 'Widget A', quarter: 'Q3', revenue: 48000, quantity: 160],
        [product: 'Widget B', quarter: 'Q1', revenue: 78000, quantity: 95],
        [product: 'Widget B', quarter: 'Q2', revenue: 85000, quantity: 104],
        [product: 'Widget B', quarter: 'Q3', revenue: 92000, quantity: 118],
        [product: 'Gadget X', quarter: 'Q1', revenue: 34000, quantity: 210],
        [product: 'Gadget X', quarter: 'Q2', revenue: 38000, quantity: 245],
        [product: 'Gadget X', quarter: 'Q3', revenue: 41000, quantity: 268]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('revenuePerUnit', multiValueData)
}

// ─────────────────────────────────────────────────────────────────────────────
// fractionOfTotal — Revenue as Percentage of Grand Total
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'fractionOfTotal') {
    def fractionData = [
        [region: 'North America', productLine: 'Software',  revenue: 332000],
        [region: 'North America', productLine: 'Services',  revenue: 140000],
        [region: 'Europe',        productLine: 'Software',  revenue: 290000],
        [region: 'Europe',        productLine: 'Services',  revenue: 125000],
        [region: 'Asia Pacific',  productLine: 'Software',  revenue: 112000],
        [region: 'Asia Pacific',  productLine: 'Services',  revenue: 45000],
        [region: 'Latin America', productLine: 'Software',  revenue: 78000],
        [region: 'Latin America', productLine: 'Services',  revenue: 56000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('fractionOfTotal', fractionData)
}

// ─────────────────────────────────────────────────────────────────────────────
// countUniqueValues — Unique Product Count per Region/Quarter
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'countUniqueValues') {
    def countUniqueData = [
        [region: 'North America', quarter: 'Q1', product: 'Widget A'],
        [region: 'North America', quarter: 'Q1', product: 'Widget B'],
        [region: 'North America', quarter: 'Q1', product: 'Widget A'],
        [region: 'North America', quarter: 'Q2', product: 'Gadget X'],
        [region: 'North America', quarter: 'Q2', product: 'Widget A'],
        [region: 'North America', quarter: 'Q2', product: 'Gadget X'],
        [region: 'Europe',        quarter: 'Q1', product: 'Widget B'],
        [region: 'Europe',        quarter: 'Q1', product: 'Widget B'],
        [region: 'Europe',        quarter: 'Q1', product: 'Gadget X'],
        [region: 'Europe',        quarter: 'Q2', product: 'Widget A'],
        [region: 'Europe',        quarter: 'Q2', product: 'Widget B'],
        [region: 'Europe',        quarter: 'Q2', product: 'Gadget X'],
        [region: 'Asia Pacific',  quarter: 'Q1', product: 'Widget A'],
        [region: 'Asia Pacific',  quarter: 'Q1', product: 'Widget A'],
        [region: 'Asia Pacific',  quarter: 'Q2', product: 'Widget B'],
        [region: 'Asia Pacific',  quarter: 'Q2', product: 'Gadget X'],
        [region: 'Asia Pacific',  quarter: 'Q2', product: 'Widget B']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('countUniqueValues', countUniqueData)
}

// ─────────────────────────────────────────────────────────────────────────────
// derivedAttributes — Derived Year from Date
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'derivedAttributes') {
    def derivedData = [
        [region: 'West',    revenue: 45000, orderDate: '2023-01-15'],
        [region: 'West',    revenue: 52000, orderDate: '2023-06-20'],
        [region: 'West',    revenue: 67000, orderDate: '2024-03-10'],
        [region: 'Central', revenue: 38000, orderDate: '2023-04-05'],
        [region: 'Central', revenue: 44000, orderDate: '2024-01-22'],
        [region: 'Central', revenue: 56000, orderDate: '2024-09-15'],
        [region: 'East',    revenue: 78000, orderDate: '2023-11-30'],
        [region: 'East',    revenue: 89000, orderDate: '2024-05-18'],
        [region: 'East',    revenue: 95000, orderDate: '2024-12-01']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('derivedAttributes', derivedData)
}

// ─────────────────────────────────────────────────────────────────────────────
// fieldVisibility — All three restriction levels
// Merged from old hiddenAttributes + hiddenFromControls examples
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'fieldVisibility') {
    def fieldVisibilityData = [
        [employee_id: 1001, manager_id: 500, department: 'Engineering', employeeName: 'Nora Keane',    salary: 95000,  notes: 'Team lead',    created_at: '2020-03-15'],
        [employee_id: 1002, manager_id: 500, department: 'Engineering', employeeName: 'Marco Vidal',   salary: 102000, notes: 'Senior dev',   created_at: '2019-07-22'],
        [employee_id: 1003, manager_id: 501, department: 'Marketing',   employeeName: 'Priya Sharma',  salary: 78000,  notes: '',             created_at: '2021-01-10'],
        [employee_id: 1004, manager_id: 501, department: 'Marketing',   employeeName: 'Leo Tanaka',    salary: 85000,  notes: 'New hire',     created_at: '2020-11-05'],
        [employee_id: 1005, manager_id: 502, department: 'Sales',       employeeName: 'Clara Jensen',  salary: 72000,  notes: 'Transferred',  created_at: '2022-06-18'],
        [employee_id: 1006, manager_id: 502, department: 'Sales',       employeeName: 'Dmitri Novak',  salary: 88000,  notes: 'Key account',  created_at: '2021-09-01'],
        [employee_id: 1007, manager_id: 500, department: 'Engineering', employeeName: 'Suki Hayashi',  salary: 110000, notes: 'Architect',    created_at: '2018-04-30'],
        [employee_id: 1008, manager_id: 503, department: 'Finance',     employeeName: 'Amara Osei',    salary: 92000,  notes: '',             created_at: '2020-08-12']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('fieldVisibility', fieldVisibilityData)
}

// ─────────────────────────────────────────────────────────────────────────────
// salesOverview — 64 rows (4 regions × 4 products × 4 quarters)
// Same data structure as the standalone piv-sales-region-prod-qtr report
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'salesOverview') {
    def salesOverviewData = []
    def soRegions = ['North', 'South', 'East', 'West']
    def soProducts = ['Laptop', 'Phone', 'Tablet', 'Monitor']
    def soQuarters = ['Q1', 'Q2', 'Q3', 'Q4']
    def soReps = ['Alice', 'Bob', 'Carol', 'David']
    def soPrices = [Laptop: 1200, Phone: 800, Tablet: 500, Monitor: 350]
    def soRandom = new Random(42)

    soRegions.each { region ->
        soProducts.each { product ->
            soQuarters.each { quarter ->
                def rep = soReps[soRandom.nextInt(soReps.size())]
                def quantity = soRandom.nextInt(20) + 5
                def revenue = soPrices[product] * quantity
                def cost = (revenue * (0.6 + soRandom.nextDouble() * 0.15)).round(2)
                def profit = (revenue - cost).round(2)
                salesOverviewData << new LinkedHashMap([
                    Region: region, Product: product, Quarter: quarter, SalesRep: rep,
                    Quantity: quantity, Revenue: revenue, Cost: cost, Profit: profit
                ])
            }
        }
    }
    ctx.reportData('salesOverview', salesOverviewData)
}

log.info("Finished piv-examples data generation — componentId=${componentId ?: '(all)'}.")
