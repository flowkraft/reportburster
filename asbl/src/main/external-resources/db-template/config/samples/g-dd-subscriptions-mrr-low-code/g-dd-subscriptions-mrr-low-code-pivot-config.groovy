pivotTable('pivot_dd15-pivot-subscriber-cohorts') {
  aggregatorName 'Average'
  rendererName 'Table Heatmap'
  rows([
    'cohort'
  ])
  cols([
    'month'
  ])
  vals([
    'retained_pct'
  ])
  rowTotals false
  colTotals false
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'
}
