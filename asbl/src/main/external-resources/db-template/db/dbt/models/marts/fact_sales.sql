{{
    config(
        engine='MergeTree()',
        order_by='(date_key, sales_key)'
    )
}}

-- fact_sales: one row per order line item with dimension surrogate keys
-- Derives from OLTP Orders + OrderDetails, joined to dimensions via natural keys

with order_lines as (
    select
        od.order_id,
        od.product_id,
        od.unit_price,
        od.quantity,
        od.discount         as discount_rate,
        o.customer_id,
        o.employee_id,
        toDate(o.order_date) as order_date
    from {{ ref('stg_order_details') }} od
    inner join {{ ref('stg_orders') }} o
        on od.order_id = o.order_id
    where o.order_date is not null
),

with_keys as (
    select
        ol.order_id,
        ol.order_date,
        ol.unit_price,
        ol.quantity,
        ol.discount_rate,
        dc.customer_key,
        dp.product_key,
        de.employee_key
    from order_lines ol
    left join {{ ref('dim_customer') }} dc
        on ol.customer_id = dc.customer_id
    left join {{ ref('dim_product') }} dp
        on ol.product_id = dp.product_id
    left join {{ ref('dim_employee') }} de
        on ol.employee_id = de.employee_id
)

select
    row_number() over (order by order_date, order_id, product_key) as sales_key,
    order_date                                          as date_key,
    coalesce(customer_key, 0)                           as customer_key,
    coalesce(product_key, 0)                            as product_key,
    coalesce(employee_key, 0)                           as employee_key,
    toUInt16(quantity)                                   as quantity,
    toDecimal64(unit_price, 4)                          as unit_price,
    toFloat32(discount_rate)                            as discount_rate,
    toDecimal128(quantity * unit_price, 4)               as gross_revenue,
    toDecimal128(quantity * unit_price * (1 - discount_rate), 4) as net_revenue
from with_keys
