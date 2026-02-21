{{ config(materialized='view') }}

-- Monthly sales aggregation for time-series analysis
-- Matches vw_monthly_sales from ClickHouseDataWarehouseCreator.java

select
    dt.year,
    dt.month,
    dt.month_name,
    dt.year_quarter,
    count(distinct fs.sales_key)        as num_transactions,
    sum(fs.quantity)                     as total_quantity,
    round(sum(fs.gross_revenue), 2)     as total_gross_revenue,
    round(sum(fs.net_revenue), 2)       as total_net_revenue,
    round(avg(fs.net_revenue), 2)       as avg_transaction_value
from {{ ref('fact_sales') }} fs
left join {{ ref('dim_time') }} dt on fs.date_key = dt.date_key
group by dt.year, dt.month, dt.month_name, dt.year_quarter
order by dt.year, dt.month
