{{
    config(
        engine='MergeTree()',
        order_by='product_key'
    )
}}

select
    row_number() over (order by product_id) as product_key,
    product_id,
    product_name,
    category_name,
    unit_price as list_price
from {{ ref('stg_products') }}
