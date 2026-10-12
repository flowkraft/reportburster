// ═══════════════════════════════════════════════════════════════════════════
// Demo Inventory — what is on the shelves, where, and what it is worth
// ═══════════════════════════════════════════════════════════════════════════
//
// What it holds: one row per product per warehouse, the stock as it stands
// (dash_demo.stock_levels with the product's unit cost), with the product and
// the warehouse.
//
// Grain: one product in one warehouse, so the key is the two together (Stock
// Line). Stock Lines counts those rows, On Hand sums the units on the shelves,
// Stock Value prices them at the product's unit cost, and Below Reorder counts
// the rows whose units fell under the level that should trigger a new order.
//
// Joins, both many_to_one, so no measure is multiplied: dash_demo.products on
// product_id and dash_demo.warehouses on warehouse_id. The generator writes
// them as LEFT joins. A warehouse's capacity lives on the warehouse, so it is
// not a measure here: summed at this grain it would be counted once per row.
//
// The product's unit cost is brought onto each row by the cube's own SQL, so
// Stock Value is a measure of the cube's rows: units times unit cost, once per
// stock line. Read from the joined products table instead, the engine would
// refuse it, since a measure there counts once per product, not per stock line.
//
// Below Reorder % is a measure of measures (type 'number'): the rows below
// their reorder level as a share of all rows. The day-by-day stock movements
// (dash_demo.stock_movements) are another grain and are not mixed in here.
//
// What it can answer: what each warehouse holds and what it is worth, which
// category or brand needs reordering, which products sit unsold.
//
// Data: dash_demo.stock_levels (1,000 rows: 200 products in 5 warehouses):
// 279,650 units worth 77,966,532.24 at cost; 14 rows below their reorder level.
// ═══════════════════════════════════════════════════════════════════════════

cube {
  sql '''SELECT l.*, p.unit_cost
  FROM dash_demo.stock_levels l
  LEFT JOIN dash_demo.products p ON p.product_id = l.product_id'''
  sql_alias 'stock'
  title 'Demo Inventory'
  description 'Units on hand, stock value and what needs reordering, by warehouse, category, brand and product'
  currency 'EUR'

  join {
    name 'dash_demo.products'
    title 'Products'
    description 'The product on the shelf'
    sql '${CUBE}.product_id = dash_demo.products.product_id'
    relationship 'many_to_one'
  }
  join {
    name 'dash_demo.warehouses'
    title 'Warehouses'
    description 'The warehouse the shelf is in'
    sql '${CUBE}.warehouse_id = dash_demo.warehouses.warehouse_id'
    relationship 'many_to_one'
  }

  dimension {
    name 'StockLineId'
    title 'Stock Line'
    description 'The product and the warehouse together, the one thing that names a stock line'
    sql "CAST(\${CUBE}.product_id AS VARCHAR) || '-' || CAST(\${CUBE}.warehouse_id AS VARCHAR)"
    type 'string'
    primary_key true
  }
  dimension {
    name 'Warehouse'
    title 'Warehouse'
    description 'The warehouse the stock is in'
    sql 'dash_demo.warehouses.name'
    type 'string'
  }
  dimension {
    name 'Category'
    title 'Category'
    description 'The category the product is in'
    sql 'dash_demo.products.category'
    type 'string'
  }
  dimension {
    name 'Brand'
    title 'Brand'
    description 'The brand the product is sold under'
    sql 'dash_demo.products.brand'
    type 'string'
  }
  dimension {
    name 'Product'
    title 'Product'
    description 'The product on the shelf'
    sql 'dash_demo.products.name'
    type 'string'
  }
  dimension {
    name 'LastSoldAt'
    title 'Last Sold'
    description 'The last day the product sold from this warehouse. Group it by month, quarter or year'
    sql '${CUBE}.last_sold_date'
    type 'time'
  }
  dimension {
    name 'LastReceivedAt'
    title 'Last Received'
    description 'The last day new units of the product arrived in this warehouse'
    sql '${CUBE}.last_received_date'
    type 'time'
  }

  measure {
    name 'StockLines'
    title 'Stock Lines'
    description 'How many products-in-a-warehouse there are: a product kept in three warehouses is three lines'
    type 'count'
  }
  measure {
    name 'OnHand'
    title 'On Hand'
    description 'How many units are on the shelves'
    sql '${CUBE}.qty_on_hand'
    type 'sum'
    format 'number'
  }
  measure {
    name 'StockValue'
    title 'Stock Value'
    description 'What the units on the shelves cost us: units times the product unit cost'
    sql '${CUBE}.qty_on_hand * ${CUBE}.unit_cost'
    type 'sum'
    format 'currency'
  }
  measure {
    name 'BelowReorder'
    title 'Below Reorder'
    description 'How many stock lines have fewer units than their reorder level. PICK THIS WHEN: the question is what to order now'
    type 'count'
    filters {
      filter sql: '${CUBE}.qty_on_hand < ${CUBE}.reorder_level'
    }
  }
  measure {
    name 'BelowReorderPct'
    title 'Below Reorder %'
    description 'The stock lines below their reorder level as a share of all stock lines, a fraction from 0.0 to 1.0 shown as a percentage'
    sql '1.0 * ${BelowReorder} / NULLIF(${StockLines}, 0)'
    type 'number'
    format 'percent'
  }

  segment {
    name 'below_reorder'
    title 'Below reorder level'
    description 'Stock lines with fewer units than their reorder level'
    sql '${CUBE}.qty_on_hand < ${CUBE}.reorder_level'
  }
}
