/*
 * Northwind Warehouse Pivot - DuckDB Engine
 * Analyze ~8,000 sales transactions across countries, categories, quarters
 */
pivotTable {
  // Row grouping: Country → Category hierarchy
  rows 'customer_country', 'category_name'

  // Column grouping: Year-Quarter across the top
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

  // Explicit table/view name in DuckDB
  tableName 'vw_sales_detail'

  // Hide internal key from the UI (not useful for OLAP analysis)
  hiddenAttributes 'sales_key'

  // Hide non-aggregatable text fields from the value dropdown
  hiddenFromAggregators 'sales_key', 'customer_country', 'customer_name', 'continent', 'category_name', 'product_name', 'employee_name', 'month_name', 'year_quarter', 'year', 'quarter'
}