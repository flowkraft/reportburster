/*
 * CFO Dashboard - Sample Data Generator
 *
 * This script provides IN-MEMORY SAMPLE DATA for the CFO dashboard components.
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

log.info("Starting dashboard-cfo data generation... componentId=${componentId ?: '(all)'}")

// ─────────────────────────────────────────────────────────────────────────────
// Revenue Trend — LINE CHART (actual vs target)
// Purpose: CFOs track actual revenue against plan. Data shows a realistic pattern:
// Sep-Oct on target, Nov exceeds (holiday pre-orders), Dec strong beat,
// Jan miss (post-holiday slump), Feb recovery. The gap between lines is the story.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'revenueTrend') {
    def trendMonths = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
    def targets =     [600000, 650000, 700000, 800000, 780000, 820000]
    def revenues =    [592000, 668000, 742000, 853000, 724000, 847320]
    //                 miss    beat    beat    beat    miss!   beat

    def revenueTrendData = (0..<trendMonths.size()).collect { i ->
        new LinkedHashMap([Month: trendMonths[i], Revenue: revenues[i], Target: targets[i]])
    }
    ctx.reportData('revenueTrend', revenueTrendData)
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue by Category — DOUGHNUT CHART
// Purpose: Show product mix at a glance. A healthy business has a dominant
// category without dangerous over-concentration. Beverages leads (24%) but
// the top 3 together account for 60% — diversified enough for risk management.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'revenueByCategory') {
    def categoryData = [
        [Category: 'Beverages',   Revenue: 182450],  // 24% — clear leader
        [Category: 'Dairy',       Revenue: 145230],  // 19%
        [Category: 'Confections', Revenue: 128900],  // 17%
        [Category: 'Meat',        Revenue: 118500],  // 15%
        [Category: 'Grains',      Revenue: 98760],   // 13%
        [Category: 'Seafood',     Revenue: 87480]    // 11% — smallest but not trivial
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('revenueByCategory', categoryData)
}

// ─────────────────────────────────────────────────────────────────────────────
// Top 5 Customers — TABULATOR TABLE
// Purpose: Customer concentration risk. The top customer at 10.5% is healthy —
// no single customer can tank the business. Shows clear ranking and each
// customer's share of total. CFOs watch this for dependency risk.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'topCustomers') {
    def totalRevenue = 847320
    def topCustomersData = [
        [name: 'Save-a-lot Markets',   revenue: 89340],  // 10.5%
        [name: 'Ernst Handel',         revenue: 76890],  // 9.1%
        [name: 'QUICK-Stop',           revenue: 68450],  // 8.1%
        [name: 'Hungry Owl All-Night', revenue: 62120],  // 7.3%
        [name: 'Chop-suey Chinese',    revenue: 58780]   // 6.9%
    ].collect {
        def pct = String.format('%.1f%%', (it.revenue / totalRevenue) * 100)
        new LinkedHashMap([name: it.name, revenue: it.revenue, percentage: pct])
    }
    ctx.reportData('topCustomers', topCustomersData)
}

// ─────────────────────────────────────────────────────────────────────────────
// Accounts Receivable Aging — BAR CHART (color-coded risk buckets)
// Purpose: Cash flow health indicator. Green (current) should be largest,
// red (90+) should be smallest. A CFO flags when >60 days grows — here
// the 61-90 + 90+ total $42,300 which is the "alert" threshold.
// Color coding: green=healthy → yellow=watch → orange=concern → red=action.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'arAging') {
    def arAgingData = [
        [Bucket: '0-30 days',  Amount: 58200],   // 45% — healthy majority
        [Bucket: '31-60 days', Amount: 27950],   // 22% — watch zone
        [Bucket: '61-90 days', Amount: 24800],   // 19% — concern
        [Bucket: '90+ days',   Amount: 17500]    // 14% — needs action
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('arAging', arAgingData)
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue by Country — HORIZONTAL BAR CHART
// Purpose: Geographic revenue distribution. Horizontal bars are natural for
// ranked lists with country names. Shows clear #1 market (Germany) and the
// gap to #2 (USA). CFOs use this for market expansion and risk decisions.
// ─────────────────────────────────────────────────────────────────────────────
if (!componentId || componentId == 'revenueByCountry') {
    def countryData = [
        [Country: 'Germany', Revenue: 198520],   // clear #1 — 29% concentration
        [Country: 'USA',     Revenue: 156890],   // strong #2
        [Country: 'France',  Revenue: 128450],   // solid #3
        [Country: 'UK',      Revenue: 98760],    // emerging
        [Country: 'Brazil',  Revenue: 87340]     // growth market
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('revenueByCountry', countryData)
}

log.info("Finished dashboard-cfo data generation — componentId=${componentId ?: '(all)'}.")
