package com.flowkraft.bkend.pipelines.transforms

import org.apache.beam.sdk.transforms.DoFn
import groovy.util.logging.Slf4j

/**
 * Reusable Apache Beam DoFn: validate parsed rows.
 *
 * Checks that rows have enough fields and that required fields are not empty.
 * Invalid rows are logged and dropped (not passed downstream).
 *
 * Usage in a pipeline:
 *   pipeline
 *       .apply("ParseCSV", ParDo.of(new CsvParserFn()))
 *       .apply("Validate", ParDo.of(new ValidationFn(
 *           requiredFields: [0, 1, 3],   // field indices that must not be empty
 *           minFields: 5                 // minimum number of fields per row
 *       )))
 *       .apply("NextStep", ...)
 *
 * Customize:
 *   - Set requiredFields to the indices of mandatory columns
 *   - Set minFields to the expected number of columns
 *   - Override the validation logic for more complex rules
 */
@Slf4j
class ValidationFn extends DoFn<String[], String[]> {

    /** Indices of fields that must not be empty */
    List<Integer> requiredFields = []

    /** Minimum number of fields expected per row */
    int minFields = 1

    @ProcessElement
    void processElement(ProcessContext c) {
        def fields = c.element()

        // Check minimum field count
        if (fields.length < minFields) {
            log.warn("Row dropped — too few fields ({}/{}): {}",
                fields.length, minFields, fields.join(","))
            return
        }

        // Check required fields are not empty
        for (int idx : requiredFields) {
            if (idx >= fields.length || !fields[idx]?.trim()) {
                log.warn("Row dropped — required field [{}] is empty: {}",
                    idx, fields.join(","))
                return
            }
        }

        c.output(fields)
    }
}
