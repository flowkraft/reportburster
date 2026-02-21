select
    EmployeeID                          as employee_id,
    concat(FirstName, ' ', LastName)    as full_name,
    Title                               as title,
    BirthDate                           as birth_date,
    HireDate                            as hire_date,
    City                                as city,
    Country                             as country
from {{ source('northwind_oltp', 'Employees') }}
