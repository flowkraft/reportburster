{{
    config(
        engine='MergeTree()',
        order_by='employee_key'
    )
}}

select
    row_number() over (order by employee_id) as employee_key,
    employee_id,
    full_name,
    title
from {{ ref('stg_employees') }}
