// ═══════════════════════════════════════════════════════════════════════════
// Demo Delivery — the orders, from placed to delivered or sent back
// ═══════════════════════════════════════════════════════════════════════════
//
// What it holds: one row per order, with the customer who placed it, the city
// it went to and the warehouse it left from.
//
// Grain: one order. Orders counts every order placed, the cancelled ones too,
// because a return rate is a share of what was ordered; the sales cube, which
// counts money, leaves the cancelled orders out instead. Delivered counts the
// orders that arrived, and Late the ones that arrived after their promised day.
//
// Joins, all many_to_one, so no measure is multiplied: dash_demo.customers on
// customer_id, dash_demo.geo_cities on city_id, dash_demo.warehouses on
// warehouse_id. The generator writes them as LEFT joins.
//
// The two rates are measures of measures (type 'number'), so they follow every
// filter and every split: On-Time % is the delivered orders that were not late,
// as a share of the delivered orders; Return Rate is the returned orders as a
// share of the orders placed. Both are the demo data's own definitions.
//
// What it can answer: which carrier keeps its promise, which channel sends the
// most back, how many orders each warehouse ships, by month, quarter or year.
//
// Data: dash_demo.orders (24,000 orders placed between 2024-01-01 and
// 2026-09-30): 23,355 delivered, 1,557 of them late, so 93.33% on time; 1,432
// returned, so a return rate of 5.97%.
// ═══════════════════════════════════════════════════════════════════════════

cube {
  sql_table 'dash_demo.orders'
  title 'Demo Delivery'
  description 'Orders placed, delivered on time or late, and sent back, by carrier, channel, warehouse and month'
  currency 'EUR'

  join {
    name 'dash_demo.customers'
    title 'Customers'
    description 'The customer who placed the order'
    sql '${CUBE}.customer_id = dash_demo.customers.customer_id'
    relationship 'many_to_one'
  }
  join {
    name 'dash_demo.geo_cities'
    title 'Cities'
    description 'The city the order was shipped to, and the country it is in'
    sql '${CUBE}.city_id = dash_demo.geo_cities.city_id'
    relationship 'many_to_one'
  }
  join {
    name 'dash_demo.warehouses'
    title 'Warehouses'
    description 'The warehouse the order was shipped from'
    sql '${CUBE}.warehouse_id = dash_demo.warehouses.warehouse_id'
    relationship 'many_to_one'
  }

  dimension {
    name 'OrderId'
    title 'Order'
    description 'The order number'
    sql '${CUBE}.order_id'
    type 'number'
    primary_key true
  }
  dimension {
    name 'OrderedAt'
    title 'Ordered'
    description 'When the order was placed. Group it by month, quarter or year'
    sql '${CUBE}.order_ts'
    type 'time'
  }
  dimension {
    name 'DeliveredAt'
    title 'Delivered'
    description 'When the order arrived. Empty while it is on its way, and for a cancelled order'
    sql '${CUBE}.delivered_ts'
    type 'time'
  }
  dimension {
    name 'Status'
    title 'Status'
    description 'completed, returned or cancelled'
    sql '${CUBE}.status'
    type 'string'
  }
  dimension {
    name 'Channel'
    title 'Channel'
    description 'Where the order came from: web, mobile_app, marketplace or sales_rep'
    sql '${CUBE}.channel'
    type 'string'
  }
  dimension {
    name 'Carrier'
    title 'Carrier'
    description 'Who carried the order: EuroParcel, NordFreight or SwiftPost'
    sql '${CUBE}.carrier'
    type 'string'
  }
  dimension {
    name 'Warehouse'
    title 'Warehouse'
    description 'The warehouse the order left from'
    sql 'dash_demo.warehouses.name'
    type 'string'
  }
  dimension {
    name 'Country'
    title 'Country'
    description 'The country the order was shipped to'
    sql 'dash_demo.geo_cities.country'
    type 'string'
  }
  dimension {
    name 'Segment'
    title 'Segment'
    description 'The segment the customer is in: Consumer, SMB or Enterprise'
    sql 'dash_demo.customers.segment'
    type 'string'
  }

  measure {
    name 'Orders'
    title 'Orders'
    description 'How many orders were placed, the cancelled ones included'
    type 'count'
  }
  measure {
    name 'Delivered'
    title 'Delivered'
    description 'How many orders arrived'
    type 'count'
    filters {
      filter sql: '${CUBE}.delivered_ts IS NOT NULL'
    }
  }
  measure {
    name 'Late'
    title 'Late'
    description 'How many orders arrived after the day they were promised for'
    type 'count'
    filters {
      filter sql: 'CAST(${CUBE}.delivered_ts AS DATE) > ${CUBE}.promised_date'
    }
  }
  measure {
    name 'OnTimePct'
    title 'On-Time %'
    description 'The delivered orders that arrived by their promised day, as a share of the delivered orders, a fraction from 0.0 to 1.0 shown as a percentage. PICK THIS WHEN: comparing carriers or warehouses that do not ship the same amount'
    sql '1.0 * (${Delivered} - ${Late}) / NULLIF(${Delivered}, 0)'
    type 'number'
    format 'percent'
  }
  measure {
    name 'Returned'
    title 'Returned'
    description 'How many orders were sent back'
    type 'count'
    filters {
      filter sql: "\${CUBE}.status = 'returned'"
    }
  }
  measure {
    name 'ReturnRatePct'
    title 'Return Rate'
    description 'The returned orders as a share of the orders placed, a fraction from 0.0 to 1.0 shown as a percentage. PICK THIS WHEN: comparing channels or segments that do not order the same amount'
    sql '1.0 * ${Returned} / NULLIF(${Orders}, 0)'
    type 'number'
    format 'percent'
  }

  segment {
    name 'arrived_late'
    title 'Arrived late'
    description 'Orders that arrived after their promised day'
    sql 'CAST(${CUBE}.delivered_ts AS DATE) > ${CUBE}.promised_date'
  }
  segment {
    name 'sent_back'
    title 'Sent back'
    description 'Orders that were sent back'
    sql "\${CUBE}.status = 'returned'"
  }
}
