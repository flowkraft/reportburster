{{
    config(
        engine='MergeTree()',
        order_by='date_key'
    )
}}

-- Date dimension: days 1-28 for each month of 2023-2024 (672 rows)
-- Matches NorthwindOlapDataGenerator pattern

with date_spine as (
    select
        toDate('2023-01-01') + toIntervalDay(number) as date_key
    from numbers(
        toUInt64(dateDiff('day', toDate('2023-01-01'), toDate('2024-12-31')) + 1)
    )
    where toDayOfMonth(toDate('2023-01-01') + toIntervalDay(number)) <= 28
)

select
    date_key,
    toYear(date_key)        as year,
    toQuarter(date_key)     as quarter,
    concat(toString(toYear(date_key)), '-Q', toString(toQuarter(date_key))) as year_quarter,
    toMonth(date_key)       as month,
    dateName('month', date_key) as month_name
from date_spine
order by date_key
