{{ config(materialized='view') }}

-- Denormalized view joining fact_sales with all dimensions
-- Matches vw_sales_detail from ClickHouseDataWarehouseCreator.java

select
    fs.sales_key,
    fs.date_key,
    fs.customer_key,
    fs.product_key,
    fs.employee_key,
    fs.quantity,
    fs.unit_price,
    fs.discount_rate,
    fs.gross_revenue,
    fs.net_revenue,
    dt.year,
    dt.quarter,
    dt.year_quarter,
    dt.month,
    dt.month_name,
    dc.company_name     as customer_name,
    dc.country          as customer_country,
    dc.continent,
    dp.product_name,
    dp.category_name,
    de.full_name        as employee_name
from {{ ref('fact_sales') }} fs
left join {{ ref('dim_time') }} dt      on fs.date_key = dt.date_key
left join {{ ref('dim_customer') }} dc  on fs.customer_key = dc.customer_key
left join {{ ref('dim_product') }} dp   on fs.product_key = dp.product_key
left join {{ ref('dim_employee') }} de  on fs.employee_key = de.employee_key
