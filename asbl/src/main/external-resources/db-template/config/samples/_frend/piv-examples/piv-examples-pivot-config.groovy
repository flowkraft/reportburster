/*
 * Pivot Table Examples Showcase
 *
 * All 15 examples use named pivotTable('id') { ... } blocks because they are
 * packed into a SINGLE report file so they can all be previewed in one place.
 *
 * In real-world usage, the typical case is ONE pivot table per report.
 * Use the UNNAMED syntax:
 *
 *   pivotTable {            <- no name, no quotes, no parentheses
 *     rows 'region'
 *     vals 'revenue'
 *     aggregatorName 'Sum'
 *     rendererName 'Table'
 *   }
 *
 * And in the data script: ctx.reportData(rows)  <- no name argument
 *
 * Use named blocks ONLY when a single report needs multiple components together.
 * See: https://datapallas.com/docs/bi-analytics/dashboards#multi-component-reports
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Fundamentals
// ═══════════════════════════════════════════════════════════════════════════════

// Revenue by Region — Sum Pivot Table
pivotTable('salesByRegionSum') {
  rows 'region'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
}

// Order Count by Product x Quarter — Cross-Tab Pivot
pivotTable('orderCountByProductQuarter') {
  rows 'product'
  cols 'quarter'
  aggregatorName 'Count'
  rendererName 'Table'
}

// Revenue by Region + Country, Product Line — Multi-Dimension Pivot
pivotTable('revenueMultiDimension') {
  rows 'region', 'country'
  cols 'productLine'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
}

// Average Order Value by Sales Channel — Average Aggregator
pivotTable('avgOrderValueByChannel') {
  rows 'salesChannel'
  vals 'orderValue'
  aggregatorName 'Average'
  rendererName 'Table'
}

// ═══════════════════════════════════════════════════════════════════════════════
// Filtering & Sorting
// ═══════════════════════════════════════════════════════════════════════════════

// Revenue by Category with Status Filter — ValueFilter Pivot
pivotTable('filteredByStatus') {
  rows 'category'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
  valueFilter {
    status exclude: ['Inactive', 'Pending']
  }
}

// Revenue Sorted Descending — Value-Based Row/Col Ordering
pivotTable('sortedRevenue') {
  rows 'region'
  cols 'year'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
  rowOrder 'value_z_to_a'
  colOrder 'key_a_to_z'
}

// Custom Sort Order for Regions — sorters
pivotTable('customSorters') {
  rows 'region'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
  sorters region: ['West', 'Central', 'East', 'International']
}

// ═══════════════════════════════════════════════════════════════════════════════
// Renderers
// ═══════════════════════════════════════════════════════════════════════════════

// Pipeline Value Heatmap — Table Heatmap Renderer (full)
pivotTable('pipelineHeatmap') {
  rows 'dealStage'
  cols 'salesRep'
  vals 'dealValue'
  aggregatorName 'Sum'
  rendererName 'Table Heatmap'
}

// Pipeline Grouped Bar Chart — side-by-side bars per rep
pivotTable('pipelineGroupedBar') {
  rows 'dealStage'
  cols 'salesRep'
  vals 'dealValue'
  aggregatorName 'Sum'
  rendererName 'Grouped Bar Chart'
}

// Pipeline Line Chart — lines per rep across deal stages
pivotTable('pipelineLineChart') {
  rows 'dealStage'
  cols 'salesRep'
  vals 'dealValue'
  aggregatorName 'Sum'
  rendererName 'Line Chart'
}

// ═══════════════════════════════════════════════════════════════════════════════
// Aggregators
// ═══════════════════════════════════════════════════════════════════════════════

// Revenue per Unit — Sum over Sum Ratio
pivotTable('revenuePerUnit') {
  rows 'product'
  cols 'quarter'
  vals 'revenue', 'quantity'
  aggregatorName 'Sum over Sum'
  rendererName 'Table'
}

// Revenue as Percentage of Grand Total — Sum as Fraction of Total
pivotTable('fractionOfTotal') {
  rows 'region'
  cols 'productLine'
  vals 'revenue'
  aggregatorName 'Sum as Fraction of Total'
  rendererName 'Table'
}

// Unique Product Count per Region/Quarter — Count Unique Values
pivotTable('countUniqueValues') {
  rows 'region'
  cols 'quarter'
  vals 'product'
  aggregatorName 'Count Unique Values'
  rendererName 'Table'
}

// ═══════════════════════════════════════════════════════════════════════════════
// Advanced
// ═══════════════════════════════════════════════════════════════════════════════

// Derived Year Column from Date — derivedAttributes
pivotTable('derivedAttributes') {
  rows 'region'
  cols 'year'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
  derivedAttributes year: 'dateFormat(orderDate, "%y")', quarter: 'dateFormat(orderDate, "Q%q")'
}

// Field Visibility Controls — all three restriction levels
pivotTable('fieldVisibility') {
  rows 'department'
  vals 'salary'
  aggregatorName 'Average'
  rendererName 'Table'
  hiddenAttributes 'employee_id', 'manager_id', 'created_at'
  hiddenFromAggregators 'employeeName', 'notes'
  hiddenFromDragDrop 'department'
}

// ═══════════════════════════════════════════════════════════════════════════════
// Putting It All Together
// ═══════════════════════════════════════════════════════════════════════════════

// Sales Overview — Region x Product hierarchy across Quarters
pivotTable('salesOverview') {
  rows 'Region', 'Product'
  cols 'Quarter'
  vals 'Revenue'
  aggregatorName 'Sum'
  rendererName 'Table'
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'
}
