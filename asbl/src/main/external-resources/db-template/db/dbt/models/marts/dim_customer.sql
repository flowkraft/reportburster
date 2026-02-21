{{
    config(
        engine='MergeTree()',
        order_by='customer_key'
    )
}}

select
    row_number() over (order by customer_id) as customer_key,
    customer_id,
    company_name,
    country,
    case
        when country in ('USA', 'Canada', 'Mexico')             then 'North America'
        when country in ('Brazil', 'Argentina', 'Venezuela')    then 'South America'
        when country in (
            'UK', 'Germany', 'France', 'Italy', 'Spain', 'Portugal',
            'Belgium', 'Switzerland', 'Austria', 'Ireland', 'Denmark',
            'Finland', 'Norway', 'Poland', 'Sweden'
        )                                                       then 'Europe'
        else 'Other'
    end as continent
from {{ ref('stg_customers') }}
