# DuckDB Data Warehouse Pivot Table Example

This example demonstrates server-side pivot table processing using DuckDB's data warehouse with dimensional modeling (Star Schema).

## Data Warehouse Schema

### Fact Table:
- **fact_sales** - Sales transactions (grain: one row per order line item)
  - Measures: quantity, unit_price, gross_revenue, net_revenue, discount_amount
  - Foreign Keys: date_key, customer_key, product_key, employee_key, shipper_key

### Dimension Tables:
- **dim_customer** - Customer master with geography (country, region, continent)
- **dim_product** - Product hierarchy (product → category → supplier)
- **dim_time** - Date dimension with all time attributes (year, quarter, month, week, day)
- **dim_employee** - Employee information
- **dim_shipper** - Shipper lookup

### Convenience Views:
- **vw_sales_detail** - Pre-joined denormalized view (ready for analytics)
- **vw_monthly_sales** - Time-series aggregation

## How to Use

### Option 1: Use the Denormalized View (Easiest)

```javascript
<rb-pivottable
  engine="duckdb"
  connectionCode="northwind-duckdb"
  tableName="vw_sales_detail"
  rows='["continent", "category_name"]'
  cols='["year_quarter"]'
  vals='["net_revenue"]'
  aggregatorName="Sum"
  rendererName="Table"
></rb-pivottable>
```

### Option 2: Use the Fact Table Directly (Best Performance)

```javascript
<rb-pivottable
  engine="duckdb"
  connectionCode="northwind-duckdb"
  tableName="fact_sales"
  rows='["customer_key"]'
  cols='["date_key"]'
  vals='["net_revenue"]'
  aggregatorName="Sum"
></rb-pivottable>
```

### Option 3: Use Server API Directly

```javascript
fetch('/api/analytics/pivot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connectionCode: 'northwind-duckdb',
    tableName: 'vw_sales_detail',
    rows: ['continent', 'category_name'],
    cols: ['year_quarter'],
    vals: ['net_revenue'],
    aggregatorName: 'Sum',
    filters: {
      continent: ['North America', 'Europe']
    },
    limit: 1000
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Common Queries

### Sales by Region and Quarter
```json
{
  "tableName": "vw_sales_detail",
  "rows": ["continent"],
  "cols": ["year_quarter"],
  "vals": ["net_revenue"],
  "aggregatorName": "Sum"
}
```

### Top Products by Category
```json
{
  "tableName": "vw_sales_detail",
  "rows": ["category_name", "product_name"],
  "cols": [],
  "vals": ["net_revenue"],
  "aggregatorName": "Sum",
  "rowOrder": "value_z_to_a",
  "limit": 20
}
```

### Monthly Sales Trend
```json
{
  "tableName": "vw_sales_detail",
  "rows": ["year_month"],
  "cols": [],
  "vals": ["net_revenue"],
  "aggregatorName": "Sum",
  "rowOrder": "key_a_to_z"
}
```

### Customer Segmentation
```json
{
  "tableName": "vw_sales_detail",
  "rows": ["continent", "customer_country"],
  "cols": [],
  "vals": ["net_revenue"],
  "aggregatorName": "Sum",
  "rowOrder": "value_z_to_a"
}
```

## Performance Notes

- The fact_sales table contains ~4,150 transactions (830 original orders × 5 years)
- Queries on fact_sales are fastest (star schema optimized)
- vw_sales_detail is convenient but slightly slower (joins at query time)
- Use filters to reduce dataset size for interactive dashboards
- Server-side caching improves repeat query performance (5 min TTL)

## Data Warehouse vs OLTP

### ❌ Old Approach (OLTP - Bad for Analytics)
```sql
SELECT
  c.Region,
  CONCAT('Q', QUARTER(o.OrderDate)) AS Quarter,
  SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Revenue
FROM orders o
JOIN customers c ON o.CustomerID = c.CustomerID
JOIN order_details od ON o.OrderID = od.OrderID
GROUP BY c.Region, CONCAT('Q', QUARTER(o.OrderDate))
```
Complex joins every time, slow, error-prone.

### ✅ New Approach (Data Warehouse - Optimized for Analytics)
```sql
SELECT
  dc.continent,
  dt.year_quarter,
  SUM(fs.net_revenue) AS revenue
FROM fact_sales fs
JOIN dim_customer dc ON fs.customer_key = dc.customer_key
JOIN dim_time dt ON fs.date_key = dt.date_key
GROUP BY dc.continent, dt.year_quarter
```
Pre-joined, indexed, optimized. This is what DuckDB is designed for!
