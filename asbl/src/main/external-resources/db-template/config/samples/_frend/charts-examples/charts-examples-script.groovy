/*
 * Chart Examples - Sample Data Generator
 *
 * This script provides IN-MEMORY SAMPLE DATA for the 11 chart examples.
 * Each dataset is carefully crafted to demonstrate the specific chart type's
 * strengths: trends for line charts, comparisons for bar charts, proportions
 * for pie/doughnut, etc.
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

log.info("Starting charts-examples data generation... componentId=${componentId ?: '(all)'}")

// ─────────────────────────────────────────────────────────────────────────────
// #1 Monthly Sales Trend — LINE CHART
// Purpose: Show a metric evolving over time. Data includes a seasonal dip
// in summer and a strong Q4 holiday spike to demonstrate trend visualization.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'monthlySalesTrend') {
    def monthlySalesData = [
        [Month: 'Jan', Revenue: 48200],
        [Month: 'Feb', Revenue: 51800],
        [Month: 'Mar', Revenue: 58400],
        [Month: 'Apr', Revenue: 55100],
        [Month: 'May', Revenue: 52300],   // seasonal dip
        [Month: 'Jun', Revenue: 49800],   // seasonal dip
        [Month: 'Jul', Revenue: 53600],
        [Month: 'Aug', Revenue: 57200],   // recovery
        [Month: 'Sep', Revenue: 62400],
        [Month: 'Oct', Revenue: 68900],   // Q4 ramp
        [Month: 'Nov', Revenue: 78500],   // holiday spike
        [Month: 'Dec', Revenue: 84200]    // peak
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('monthlySalesTrend', monthlySalesData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #2 Sales by Region — BAR CHART
// Purpose: Compare a single metric across categories. Clear differences
// between regions make the bar comparisons immediately meaningful.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'salesByRegion') {
    def salesByRegionData = [
        [Region: 'North America', Sales: 342000],
        [Region: 'Europe',        Sales: 289000],
        [Region: 'Asia Pacific',  Sales: 198000],
        [Region: 'Latin America', Sales: 134000],
        [Region: 'Middle East',   Sales: 87000],
        [Region: 'Africa',        Sales: 52000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('salesByRegion', salesByRegionData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #3 Revenue vs Expenses — GROUPED BAR CHART
// Purpose: Side-by-side comparison of two metrics. Revenue grows each quarter
// but expenses grow faster in Q3 (investment) then normalize — the visual gap
// tells the P&L story at a glance.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'revenueVsExpenses') {
    def revenueExpenseData = [
        [Quarter: 'Q1 2025', Revenue: 185000, Expenses: 112000],
        [Quarter: 'Q2 2025', Revenue: 210000, Expenses: 128000],
        [Quarter: 'Q3 2025', Revenue: 238000, Expenses: 175000],  // expenses spike
        [Quarter: 'Q4 2025', Revenue: 295000, Expenses: 158000]   // normalizes
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('revenueVsExpenses', revenueExpenseData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #4 Expense Breakdown — PIE CHART
// Purpose: Show proportions of a whole. Salaries dominate (as they do in
// reality), with clear visual wedge differences between categories.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'expenseBreakdown') {
    def expenseData = [
        [Category: 'Salaries',       Amount: 245000],
        [Category: 'Marketing',      Amount: 89000],
        [Category: 'R&D',            Amount: 112000],
        [Category: 'Infrastructure', Amount: 67000],
        [Category: 'Operations',     Amount: 54000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('expenseBreakdown', expenseData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #5 Revenue and Profit Margin — DUAL Y-AXIS MIXED CHART
// Purpose: Correlate a dollar amount (bars) with a percentage (line) on
// separate axes. Revenue grows but margin compresses in Q3 (investment
// quarter), then recovers — the inverse relationship tells the story.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'revenueAndProfitMargin') {
    def dualAxisData = [
        [Quarter: 'Q1 2024', Revenue: 152000, ProfitMargin: 32],
        [Quarter: 'Q2 2024', Revenue: 178000, ProfitMargin: 35],
        [Quarter: 'Q3 2024', Revenue: 195000, ProfitMargin: 28],   // margin dip
        [Quarter: 'Q4 2024', Revenue: 224000, ProfitMargin: 31],
        [Quarter: 'Q1 2025', Revenue: 198000, ProfitMargin: 34],
        [Quarter: 'Q2 2025', Revenue: 241000, ProfitMargin: 37]    // recovery
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('revenueAndProfitMargin', dualAxisData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #6 Quarterly Revenue by Product Line — STACKED BAR CHART
// Purpose: Show composition of revenue over time. Software is the largest
// segment and growing, Services is stable, Support grows modestly.
// The stacked view shows total AND composition at once.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'quarterlyRevenueByProduct') {
    def productQuarterData = [
        [Quarter: 'Q1 2025', Software: 82000,  Services: 45000, Support: 21000],
        [Quarter: 'Q2 2025', Software: 95000,  Services: 48000, Support: 24000],
        [Quarter: 'Q3 2025', Software: 108000, Services: 42000, Support: 27000],
        [Quarter: 'Q4 2025', Software: 125000, Services: 51000, Support: 30000]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('quarterlyRevenueByProduct', productQuarterData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #7 Portfolio Allocation — DOUGHNUT CHART
// Purpose: Show how a whole is divided into weighted segments. Classic
// 60/40 portfolio skew — equities dominate, bonds buffer, alternatives
// are a small slice. The cutout center can display the total.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'portfolioAllocation') {
    def portfolioData = [
        [AssetClass: 'US Equities',    Allocation: 35],
        [AssetClass: 'Intl Equities',  Allocation: 20],
        [AssetClass: 'Fixed Income',   Allocation: 25],
        [AssetClass: 'Real Estate',    Allocation: 12],
        [AssetClass: 'Alternatives',   Allocation: 8]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('portfolioAllocation', portfolioData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #8 Budget vs Actual Spending — AREA CHART
// Purpose: Budget as a filled baseline area, actual as a dashed line.
// January-March: under budget (good). April-May: over budget (warning).
// June-August: back on track. This pattern makes the overlay meaningful.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'budgetVsActual') {
    def budgetData = [
        [Month: 'Jan', Budget: 50000, Actual: 47200],   // under
        [Month: 'Feb', Budget: 52000, Actual: 48800],   // under
        [Month: 'Mar', Budget: 55000, Actual: 53100],   // under
        [Month: 'Apr', Budget: 58000, Actual: 63500],   // over!
        [Month: 'May', Budget: 60000, Actual: 67200],   // over!
        [Month: 'Jun', Budget: 62000, Actual: 61800],   // back on track
        [Month: 'Jul', Budget: 64000, Actual: 62100],   // under
        [Month: 'Aug', Budget: 66000, Actual: 64500]    // under
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('budgetVsActual', budgetData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #9 Top Customers by Revenue — HORIZONTAL BAR CHART
// Purpose: Ranked list with long names — horizontal bars are the natural
// choice. Sorted descending so the biggest customer is on top.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'topCustomersByRevenue') {
    def customerRevenueData = [
        [Customer: 'Save-a-lot Markets',    Revenue: 89340],
        [Customer: 'Ernst Handel',          Revenue: 76890],
        [Customer: 'QUICK-Stop',            Revenue: 68450],
        [Customer: 'Hungry Owl All-Night',  Revenue: 62120],
        [Customer: 'Rattlesnake Canyon',    Revenue: 55800],
        [Customer: 'Chop-suey Chinese',     Revenue: 51200],
        [Customer: 'Mre Paillarde',         Revenue: 47600],
        [Customer: 'Folk och f HB',        Revenue: 43100],
        [Customer: 'Blondel pre et fils',  Revenue: 38900],
        [Customer: 'Lehmanns Marktstand',   Revenue: 35200]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('topCustomersByRevenue', customerRevenueData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #10 Employee Performance — RADAR CHART
// Purpose: Compare multi-dimensional scores. This employee excels at
// Technical Skills and Problem Solving but falls below team average on
// Communication and Time Management — a realistic review profile.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'employeePerformance') {
    def performanceData = [
        [Skill: 'Communication',    EmployeeScore: 5, TeamAverage: 7],   // weakness
        [Skill: 'Technical Skills', EmployeeScore: 9, TeamAverage: 6],   // strength
        [Skill: 'Leadership',       EmployeeScore: 6, TeamAverage: 6],   // average
        [Skill: 'Problem Solving',  EmployeeScore: 9, TeamAverage: 7],   // strength
        [Skill: 'Teamwork',         EmployeeScore: 7, TeamAverage: 7],   // average
        [Skill: 'Time Management',  EmployeeScore: 4, TeamAverage: 6],   // weakness
        [Skill: 'Creativity',       EmployeeScore: 8, TeamAverage: 5]    // strength
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('employeePerformance', performanceData)
}

// ─────────────────────────────────────────────────────────────────────────────
// #11 Customer Satisfaction — POLAR AREA CHART
// Purpose: Each wedge's radius shows an independent score (not parts of a
// whole). Live Chat scores highest, Social Media lowest — typical CSAT
// pattern where newer channels still lag traditional support.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'customerSatisfaction') {
    def satisfactionData = [
        [Channel: 'Phone',        SatisfactionScore: 78],
        [Channel: 'Email',        SatisfactionScore: 72],
        [Channel: 'Live Chat',    SatisfactionScore: 91],   // highest
        [Channel: 'In-Person',    SatisfactionScore: 85],
        [Channel: 'Social Media', SatisfactionScore: 58]    // lowest
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('customerSatisfaction', satisfactionData)
}

log.info("Finished charts-examples data generation — componentId=${componentId ?: '(all)'}.")
