pivotTable('pivot_dd12-pivot-sessions-weekday-hour') {
  aggregatorName 'Sum'
  rendererName 'Table Heatmap'
  rows([
    'weekday'
  ])
  cols([
    'hour_of_day'
  ])
  vals([
    'sessions'
  ])
  rowTotals true
  colTotals false
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'
}
