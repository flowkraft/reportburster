/*
 * Employee Hire Dates - Report Parameters Specification
 * Defines startDate and endDate parameters for filtering employees
 */

import java.time.LocalDate

reportParameters {
    parameter(
        id:           'startDate',
        type:         LocalDate,
        label:        'Start Date',
        description:  'Filter employees hired on or after this date',
        defaultValue: LocalDate.of(2024, 1, 1)
    ) {
        constraints(
            required: true,
            min:      LocalDate.of(2020, 1, 1),
            max:      endDate
        )
        ui(
            control: 'date',
            format:  'yyyy-MM-dd'
        )
    }

    parameter(
        id:           'endDate',
        type:         LocalDate,
        label:        'End Date',
        description:  'Filter employees hired on or before this date',
        defaultValue: LocalDate.now()
    ) {
        constraints(
            required: true,
            min:      startDate,
            max:      LocalDate.now().plusYears(1)
        )
        ui(
            control: 'date',
            format:  'yyyy-MM-dd'
        )
    }
}

if (reportParametersProvided) {
    log.info("--- Report Parameter Values ---")
    log.info("startDate: ${startDate ?: 'NOT_SET'}")
    log.info("endDate:   ${endDate ?: 'NOT_SET'}")
}
