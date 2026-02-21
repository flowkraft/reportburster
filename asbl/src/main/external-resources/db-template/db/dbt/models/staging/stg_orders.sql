select
    OrderID         as order_id,
    CustomerID      as customer_id,
    EmployeeID      as employee_id,
    OrderDate       as order_date,
    RequiredDate    as required_date,
    ShippedDate     as shipped_date,
    ShipVia         as ship_via,
    Freight         as freight,
    ShipName        as ship_name,
    ShipAddress     as ship_address,
    ShipCity        as ship_city,
    ShipRegion      as ship_region,
    ShipPostalCode  as ship_postal_code,
    ShipCountry     as ship_country
from {{ source('northwind_oltp', 'Orders') }}
