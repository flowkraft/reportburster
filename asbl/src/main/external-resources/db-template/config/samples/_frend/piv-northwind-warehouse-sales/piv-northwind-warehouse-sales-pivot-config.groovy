/*
 * Pivot Table DSL - Northwind Warehouse Analysis
 * Analyze real warehouse data with Star Schema dimensions
 */
pivotTable {
  // Row grouping: Country → Category hierarchy
  rows 'customer_country', 'category_name'

  // Column grouping: Time dimension (year_quarter)
  cols 'year_quarter'

  // Value to aggregate
  vals 'net_revenue'

  // Aggregation method
  aggregatorName 'Sum'

  // Display as table
  rendererName 'Table'

  // Sort alphabetically
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'
}
