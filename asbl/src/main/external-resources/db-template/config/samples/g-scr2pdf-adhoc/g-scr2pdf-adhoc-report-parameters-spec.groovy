/*
 * Ad-hoc Report - Parameter Specification
 *
 * Defines the parameters that the user fills in before generating
 * the report. No database connection is needed - the parameter
 * values become the report data.
 */

reportParameters {
    parameter(
        id:           'EmployeeID',
        type:         String,
        label:        'Employee ID',
        description:  'Unique identifier for the employee',
        defaultValue: 'E001'
    ) {
        constraints(
            required: true
        )
    }

    parameter(
        id:           'FirstName',
        type:         String,
        label:        'First Name',
        description:  'Employee first name',
        defaultValue: 'John'
    ) {
        constraints(
            required: true
        )
    }

    parameter(
        id:           'LastName',
        type:         String,
        label:        'Last Name',
        description:  'Employee last name',
        defaultValue: 'Doe'
    ) {
        constraints(
            required: true
        )
    }
}
