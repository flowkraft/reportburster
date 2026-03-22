pivotTable('orderExplorer') {
  rows 'country'
  cols 'year'
  vals 'revenue'
  aggregatorName 'Sum'
  rendererName 'Table Heatmap'
  rowOrder 'value_z_to_a'
}
