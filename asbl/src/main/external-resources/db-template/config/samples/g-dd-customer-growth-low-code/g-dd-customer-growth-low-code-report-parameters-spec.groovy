reportParameters {
  parameter(id: 'segment', type: 'String', label: 'Segment') {
    ui(control: 'radio', options: 'SELECT \'\' AS value, \'-- All segments --\' AS label UNION ALL SELECT DISTINCT segment AS value, segment AS label FROM dash_demo.customers ORDER BY label')
  }
  parameter(id: 'acquisitionChannel', type: 'String', label: 'Acquisition channel', defaultValue: []) {
    ui(control: 'multiselect', options: 'SELECT DISTINCT acquisition_channel AS value, acquisition_channel AS label FROM dash_demo.customers ORDER BY label')
  }
}
