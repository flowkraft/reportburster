package com.flowkraft.bkend.pipelines.transforms

import org.apache.beam.sdk.transforms.DoFn
import groovy.util.logging.Slf4j

/**
 * Reusable Apache Beam DoFn: parse CSV lines into String arrays.
 *
 * Skips header rows (lines starting with common header patterns).
 * Handles quoted fields and empty values.
 *
 * Usage in a pipeline:
 *   pipeline
 *       .apply("ReadCSV", TextIO.read().from(path))
 *       .apply("ParseCSV", ParDo.of(new CsvParserFn()))
 *       .apply("NextStep", ...)
 *
 * Customize:
 *   - Change the delimiter (default: comma)
 *   - Change header detection logic
 *   - Add field trimming or type conversion
 */
@Slf4j
class CsvParserFn extends DoFn<String, String[]> {

    /** CSV delimiter (default: comma) */
    String delimiter = ","

    /** Set of known header prefixes to skip */
    Set<String> headerPrefixes = ["id,", "ID,", "name,", "Name,", "#"]

    @ProcessElement
    void processElement(ProcessContext c) {
        def line = c.element()

        // Skip empty lines
        if (!line?.trim()) return

        // Skip header rows
        if (headerPrefixes.any { line.startsWith(it) }) {
            log.debug("Skipping header: {}", line)
            return
        }

        // Split and trim fields
        def fields = line.split(delimiter, -1).collect { it.trim() } as String[]
        c.output(fields)
    }
}
