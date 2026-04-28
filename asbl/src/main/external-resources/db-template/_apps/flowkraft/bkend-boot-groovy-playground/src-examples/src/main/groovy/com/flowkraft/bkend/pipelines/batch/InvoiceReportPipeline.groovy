package com.flowkraft.bkend.pipelines.batch

import com.flowkraft.bkend.pipelines.io.JdbcConfig
import com.flowkraft.bkend.pipelines.transforms.CsvParserFn
import com.flowkraft.bkend.pipelines.transforms.ValidationFn
import org.apache.beam.sdk.Pipeline
import org.apache.beam.sdk.io.TextIO
import org.apache.beam.sdk.io.jdbc.JdbcIO
import org.apache.beam.sdk.options.PipelineOptionsFactory
import org.apache.beam.sdk.transforms.ParDo
import groovy.util.logging.Slf4j

/**
 * Apache Beam batch pipeline: process invoice reports from CSV.
 *
 * Reads invoice data, validates rows, and writes valid records to a database.
 * Invalid rows are logged and skipped.
 *
 * This example demonstrates how to compose reusable transforms:
 *   - CsvParserFn (from transforms/) handles CSV parsing
 *   - ValidationFn (from transforms/) handles row validation
 *   - JdbcConfig (from io/) provides database connection config
 *
 * HOW TO USE:
 *   1. Copy the pipelines/ folder into src/main/groovy/com/flowkraft/bkend/
 *   2. Edit the input path and database table/columns below
 *   3. Call InvoiceReportPipeline.run() from a cron job or REST endpoint
 *   4. Rebuild the app
 */
@Slf4j
class InvoiceReportPipeline {

    /**
     * Run the invoice report pipeline.
     *
     * @param inputCsvPath  Path to the invoice CSV file
     */
    static void run(String inputCsvPath = '/datapallas/data/invoices.csv') {
        log.info("=== Invoice report pipeline starting: {} ===", inputCsvPath)

        def options = PipelineOptionsFactory.create()
        def pipeline = Pipeline.create(options)

        pipeline
            // ── READ ──────────────────────────────────────────────
            .apply("ReadCSV", TextIO.read().from(inputCsvPath))

            // ── PARSE ─────────────────────────────────────────────
            // Reusable CSV parser — skip header, split fields
            .apply("ParseCSV", ParDo.of(new CsvParserFn()))

            // ── VALIDATE ──────────────────────────────────────────
            // Reusable validation — checks required fields, logs bad rows
            .apply("Validate", ParDo.of(new ValidationFn(
                requiredFields: [0, 1, 3],      // invoice_id, customer, amount
                minFields: 5
            )))

            // ── WRITE ─────────────────────────────────────────────
            .apply("WriteToDB", JdbcIO.<String[]>write()
                .withDataSourceConfiguration(JdbcConfig.defaultConfig())
                .withStatement(
                    "INSERT INTO invoices (invoice_id, customer, date, amount, status) VALUES (?, ?, ?, ?, ?)"
                )
                .withPreparedStatementSetter({ fields, ps ->
                    ps.setString(1, fields[0])   // invoice_id
                    ps.setString(2, fields[1])   // customer
                    ps.setString(3, fields[2])   // date
                    ps.setString(4, fields[3])   // amount
                    ps.setString(5, fields[4])   // status
                } as JdbcIO.PreparedStatementSetter<String[]>)
            )

        pipeline.run().waitUntilFinish()

        log.info("=== Invoice report pipeline completed ===")
    }
}
