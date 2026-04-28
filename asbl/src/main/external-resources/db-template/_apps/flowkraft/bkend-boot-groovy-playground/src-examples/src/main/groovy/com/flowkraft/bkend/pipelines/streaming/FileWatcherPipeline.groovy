package com.flowkraft.bkend.pipelines.streaming

import com.flowkraft.bkend.pipelines.io.JdbcConfig
import org.apache.beam.sdk.Pipeline
import org.apache.beam.sdk.io.TextIO
import org.apache.beam.sdk.io.jdbc.JdbcIO
import org.apache.beam.sdk.options.PipelineOptionsFactory
import org.apache.beam.sdk.transforms.DoFn
import org.apache.beam.sdk.transforms.ParDo
import org.apache.beam.sdk.transforms.Watch
import org.apache.beam.sdk.transforms.windowing.FixedWindows
import org.apache.beam.sdk.transforms.windowing.Window
import org.joda.time.Duration
import groovy.util.logging.Slf4j

/**
 * Apache Beam streaming pipeline: watch a directory for new CSV files
 * and ingest them into a database.
 *
 * Continuously monitors a folder for new CSV files. When a file appears,
 * it reads it, transforms the rows, and writes to a JDBC database.
 * Runs indefinitely until stopped.
 *
 * HOW TO USE:
 *   1. Copy the pipelines/ folder into src/main/groovy/com/flowkraft/bkend/
 *   2. Edit the watchDir, JDBC connection, and SQL below
 *   3. Call FileWatcherPipeline.run() — it runs continuously (does not return)
 *   4. To run from a cron job, start it in a background thread:
 *        Thread.start { FileWatcherPipeline.run() }
 *   5. Rebuild the app
 *
 * The Direct Runner handles streaming by polling the source at the
 * interval you configure (default: every 30 seconds).
 */
@Slf4j
class FileWatcherPipeline {

    /**
     * Start the file watcher pipeline.
     * This method does NOT return — it runs until the process is stopped.
     *
     * @param watchDir      Directory to watch for new .csv files
     * @param pollSeconds   How often to check for new files (default: 30)
     */
    static void run(
        String watchDir = '/datapallas/incoming/',
        int pollSeconds = 30
    ) {
        log.info("=== File watcher pipeline starting ===")
        log.info("Watching: {}*.csv (polling every {}s)", watchDir, pollSeconds)

        def options = PipelineOptionsFactory.create()
        def pipeline = Pipeline.create(options)

        pipeline
            // ── WATCH FOR NEW FILES ───────────────────────────────
            .apply("WatchNewFiles",
                TextIO.read()
                    .from(watchDir + "*.csv")
                    .watchForNewFiles(
                        Duration.standardSeconds(pollSeconds),
                        Watch.Growth.never()
                    ))

            // ── WINDOW ────────────────────────────────────────────
            .apply("Window", Window.into(FixedWindows.of(Duration.standardMinutes(1))))

            // ── TRANSFORM ─────────────────────────────────────────
            .apply("ProcessLines", ParDo.of(new DoFn<String, String>() {
                @DoFn.ProcessElement
                void processElement(DoFn<String, String>.ProcessContext c) {
                    def line = c.element()
                    if (line.startsWith("id,") || line.startsWith("ID,")) return
                    c.output(line)
                }
            }))

            // ── WRITE TO DATABASE ─────────────────────────────────
            .apply("WriteToDB", JdbcIO.<String>write()
                .withDataSourceConfiguration(JdbcConfig.defaultConfig())
                .withStatement("INSERT INTO incoming_data (raw_line, received_at) VALUES (?, datetime('now'))")
                .withPreparedStatementSetter({ line, ps ->
                    ps.setString(1, line)
                } as JdbcIO.PreparedStatementSetter<String>)
            )

            // ── ALTERNATIVE: WRITE TO FILES ───────────────────────
            // .apply("WriteToFiles", TextIO.write()
            //     .to(watchDir + "../processed/output")
            //     .withWindowedWrites()
            //     .withNumShards(1)
            //     .withSuffix(".csv"))

        log.info("Starting file watcher — press Ctrl+C to stop")
        pipeline.run()  // streaming — does not finish
    }
}
