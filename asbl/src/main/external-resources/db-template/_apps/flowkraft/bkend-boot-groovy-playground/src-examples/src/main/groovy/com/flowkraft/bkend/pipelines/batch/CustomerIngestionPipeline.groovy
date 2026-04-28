package com.flowkraft.bkend.pipelines.batch

import com.flowkraft.bkend.pipelines.io.JdbcConfig
import org.apache.beam.sdk.Pipeline
import org.apache.beam.sdk.io.TextIO
import org.apache.beam.sdk.io.jdbc.JdbcIO
import org.apache.beam.sdk.options.PipelineOptionsFactory
import org.apache.beam.sdk.transforms.DoFn
import org.apache.beam.sdk.transforms.ParDo
import groovy.util.logging.Slf4j

/**
 * Apache Beam batch pipeline: ingest customers from CSV into a database.
 *
 * Reads a CSV file, parses each row, and inserts into a JDBC database.
 * Uses the Direct Runner (single JVM, no external infrastructure needed).
 *
 * HOW TO USE:
 *   1. Copy the pipelines/ folder into src/main/groovy/com/flowkraft/bkend/
 *   2. Edit the inputCsvPath, JDBC connection (in JdbcConfig), and SQL statement
 *   3. Call CustomerIngestionPipeline.run() from a cron job, REST endpoint, etc.
 *   4. Rebuild the app
 *
 * The 3 core Apache Beam JARs are already in pom.xml:
 *   - beam-sdks-java-core (Pipeline, transforms)
 *   - beam-runners-direct-java (local execution, no cluster needed)
 *   - beam-sdks-java-io-jdbc (database read/write)
 *
 * For additional I/O connectors, use @Grab in your script:
 *   @Grab('org.apache.beam:beam-sdks-java-io-kafka:2.72.0')   // Kafka
 *   @Grab('org.apache.beam:beam-sdks-java-io-parquet:2.72.0') // Parquet files
 *   @Grab('org.apache.beam:beam-sdks-java-io-mongodb:2.72.0') // MongoDB
 *
 * WHAT IS APACHE BEAM?
 *   A unified model for batch and streaming data processing.
 *   Write your pipeline once, run it locally (Direct Runner) or scale it
 *   to Apache Flink, Spark, or Google Dataflow — same code, swap the runner.
 *   For most DataPallas use cases, the Direct Runner is all you need.
 */
@Slf4j
class CustomerIngestionPipeline {

    /**
     * Run the customer ingestion pipeline.
     *
     * @param inputCsvPath  Path to the input CSV file
     */
    static void run(String inputCsvPath = '/datapallas/data/customers.csv') {
        log.info("=== Customer ingestion pipeline starting: {} ===", inputCsvPath)

        def options = PipelineOptionsFactory.create()
        def pipeline = Pipeline.create(options)

        pipeline
            // ── READ ──────────────────────────────────────────────
            .apply("ReadCSV", TextIO.read().from(inputCsvPath))

            // ── TRANSFORM ─────────────────────────────────────────
            // Parse CSV lines — customize for your CSV format
            .apply("ParseRows", ParDo.of(new DoFn<String, String[]>() {
                @DoFn.ProcessElement
                void processElement(DoFn<String, String[]>.ProcessContext c) {
                    def line = c.element()

                    // Skip header row
                    if (line.startsWith("id,") || line.startsWith("ID,")) return

                    def fields = line.split(",", -1)
                    c.output(fields)
                }
            }))

            // ── WRITE ─────────────────────────────────────────────
            // Insert into database — customize the SQL and connection
            .apply("WriteToDB", JdbcIO.<String[]>write()
                .withDataSourceConfiguration(JdbcConfig.defaultConfig())
                .withStatement("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)")
                .withPreparedStatementSetter({ fields, ps ->
                    ps.setString(1, fields[0])
                    ps.setString(2, fields[1])
                    ps.setString(3, fields.length > 2 ? fields[2] : "")
                } as JdbcIO.PreparedStatementSetter<String[]>)
            )

        pipeline.run().waitUntilFinish()

        log.info("=== Customer ingestion pipeline completed ===")
    }
}
