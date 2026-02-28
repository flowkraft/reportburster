/*
 * CFO Dashboard - Tabulator Configurations
 * Top 5 Customers table for the CFO Analytics Dashboard.
 */

tabulator('topCustomers') {
  layout "fitColumns"
  headerVisible true
  columns {
    column {
      title "Customer"
      field "name"
      widthGrow 3
    }
    column {
      title "Revenue"
      field "revenue"
      formatter "money"
      formatterParams([thousand: ",", symbol: '$', precision: 0])
      hozAlign "right"
      widthGrow 2
    }
    column {
      title "% of Total"
      field "percentage"
      hozAlign "center"
      widthGrow 1
    }
  }
}
