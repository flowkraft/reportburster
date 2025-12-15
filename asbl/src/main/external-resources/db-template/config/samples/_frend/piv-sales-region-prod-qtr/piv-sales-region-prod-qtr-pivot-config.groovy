/*
 * Pivot Table DSL - Sales Analysis
 * Analyze sales by Region and Product across Quarters
 */
pivotTable {
  // Row grouping: Region → Product hierarchy
  rows 'Region', 'Product'
  
  // Column grouping: Quarters across the top
  cols 'Quarter'
  
  // Value to aggregate
  vals 'Revenue'
  
  // Aggregation method
  aggregatorName 'Sum'
  
  // Display as table
  rendererName 'Table'
  
  // Sort alphabetically
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'
}