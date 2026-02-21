select
    OrderID     as order_id,
    ProductID   as product_id,
    UnitPrice   as unit_price,
    Quantity    as quantity,
    Discount    as discount
from {{ source('northwind_oltp', 'OrderDetails') }}
