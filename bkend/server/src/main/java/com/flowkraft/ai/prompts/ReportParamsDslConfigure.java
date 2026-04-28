package com.flowkraft.ai.prompts;

import java.util.List;

public final class ReportParamsDslConfigure {

    private ReportParamsDslConfigure() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "REPORT_PARAMS_DSL_CONFIGURE",
            "Configure Report Parameters",
            "Generates a complete Report Parameters DSL configuration script based on user requirements.",
            List.of("dsl", "report-parameters", "configuration"),
            "DSL Configuration",
            """
You are an expert at configuring Report Parameters using the Groovy DSL for DataPallas.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT PARAMETERS HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
import java.time.LocalDate
import java.time.LocalDateTime

reportParameters {
  // Core date range parameters with constraints
  parameter(
    id:           'startDate',
    type:         LocalDate,
    label:        'Start Date',
    description:  'Report start date',
    defaultValue: LocalDate.now().minusDays(30)
  ) {
    constraints(
      required: true,
      min:      LocalDate.now().minusDays(365),
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
    defaultValue: LocalDate.now()
  ) {
    constraints(
      required: true,
      min:      startDate,
      max:      LocalDate.now()
    )
    ui(
      control: 'date',
      format:  'yyyy-MM-dd'
    )
  }

  parameter(
    id:    'customerId',
    type:  String,
    label: 'Customer ID'
  ) {
    constraints(
      required:  true,
      maxLength: 10,
      pattern:   '[A-Z0-9]+'
    )
  }

  parameter(
    id:    'customer',
    type:  String,
    label: 'Customer'
  ) {
    constraints(required: true)
    ui(
      control: 'select',
      options: "SELECT id, name FROM customers WHERE status = 'active'"
    )
  }

  parameter(
    id:           'maxRecords',
    type:         Integer,
    label:        'Max Records',
    defaultValue: 100
  ) {
    constraints(min: 1, max: 1000)
  }

  parameter(
    id:           'includeInactive',
    type:         Boolean,
    label:        'Include Inactive',
    defaultValue: false
  )

  parameter(
    id:           'processingTime',
    type:         LocalDateTime,
    label:        'Processing Time',
    defaultValue: LocalDateTime.now()
  ) {
    ui(
      control: 'datetime',
      format:  "yyyy-MM-dd'T'HH:mm:ss"
    )
  }
}

if (reportParametersProvided) {
  log.info("--- Report Parameter Values ---")
  log.info("startDate          : \\${startDate ?: 'NOT_SET'}")
  log.info("endDate            : \\${endDate   ?: 'NOT_SET'}")
  log.info("customer           : \\${customer ?: 'NOT_SET'}")
  log.info("maxRecords         : \\${maxRecords ?: 'NOT_SET'}")
  log.info("includeInactive    : \\${includeInactive ?: 'false'}")
  log.info("processingTime     : \\${processingTime ?: 'NOT_SET'}")
}
</EXAMPLE_DSL>

Generate a Report Parameters DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax and available options.

IMPORTANT — be minimalistic:
- Return ONLY the parameters the user explicitly asked for — no assumptions, no extras.
- Use the simplest type and fewest constraints that satisfy the requirement.
- Do not add parameters "just in case" or because they seem useful — if the user didn't ask for it, don't include it.

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

Return only the DSL script — no explanations."""
        );
    }
}
