tabulator('tabulator_orders_orders') {
  layout 'fitColumns'
  autoColumns true
  autoColumnsDefinitions([
    [
      field: 'total_amount',
      title: 'Total'
    ]
  ])
}


tabulator('tabulator_support_tickets_tickets') {
  layout 'fitColumns'
  autoColumns true
  autoColumnsDefinitions([
    [
      field: 'sla_breached',
      title: 'SLA breached'
    ],
    [
      field: 'csat',
      title: 'CSAT'
    ]
  ])
}
