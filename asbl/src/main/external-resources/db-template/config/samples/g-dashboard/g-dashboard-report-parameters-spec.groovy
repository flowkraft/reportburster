reportParameters {
    parameter(
        id: 'country',
        type: String,
        label: 'Country',
        defaultValue: '-- All --'
    ) {
        constraints(required: false)
        ui(
            control: 'select',
            options: "SELECT '-- All --' AS ShipCountry UNION ALL SELECT DISTINCT ShipCountry FROM Orders WHERE ShipCountry IS NOT NULL ORDER BY ShipCountry"
        )
    }
}
