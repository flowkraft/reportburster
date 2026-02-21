select
    p.ProductID     as product_id,
    p.ProductName   as product_name,
    c.CategoryName  as category_name,
    p.UnitPrice     as unit_price,
    p.SupplierID    as supplier_id,
    p.UnitsInStock  as units_in_stock,
    p.Discontinued  as discontinued
from {{ source('northwind_oltp', 'Products') }} p
left join {{ source('northwind_oltp', 'Categories') }} c
    on p.CategoryID = c.CategoryID
