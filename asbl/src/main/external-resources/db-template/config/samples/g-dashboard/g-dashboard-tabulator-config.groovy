tabulator('topCustomers') {
  layout "fitColumns"
  columns {
    column { title "Company"; field "company"; headerFilter "input"; widthGrow 2 }
    column { title "Country"; field "country"; headerFilter "list" }
    column { title "Contact"; field "contact" }
    column { title "Orders"; field "orders"; hozAlign "right"; sorter "number" }
    column { title "Revenue"; field "revenue"; hozAlign "right"; sorter "number"; formatter "money"; formatterParams([thousand: ',', symbol: '$', precision: 2]) }
  }
}
