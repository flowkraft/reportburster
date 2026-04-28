package com.flowkraft.bkend.pipelines.streaming

import org.apache.beam.sdk.Pipeline
import org.apache.beam.sdk.io.TextIO
import org.apache.beam.sdk.options.PipelineOptionsFactory
import org.apache.beam.sdk.transforms.DoFn
import org.apache.beam.sdk.transforms.ParDo
import org.apache.beam.sdk.transforms.windowing.FixedWindows
import org.apache.beam.sdk.transforms.windowing.Window
import org.joda.time.Duration
import groovy.util.logging.Slf4j

/**
 * Apache Beam streaming pipeline: process events as they arrive.
 *
 * This is a general-purpose streaming template. It reads from a continuously
 * growing source, windows the data into time-based batches, and writes results.
 *
 * BATCH vs STREAMING:
 *   - Batch: runs once, processes a fixed input, finishes
 *   - Streaming: runs forever, watches for new data, processes as it arrives
 *
 * HOW TO USE:
 *   1. Copy the pipelines/ folder into src/main/groovy/com/flowkraft/bkend/
 *   2. Replace the source with your event source (file watcher, Kafka, etc.)
 *   3. Call EventStreamPipeline.run() — it runs continuously (does not return)
 *   4. Rebuild the app
 *
 * To use Kafka as a source (instead of file watching):
 *   @Grab('org.apache.beam:beam-sdks-java-io-kafka:2.72.0')
 *   @Grab('org.apache.kafka:kafka-clients:3.7.0')
 *   import org.apache.beam.sdk.io.kafka.KafkaIO
 *   // See commented example at the bottom of this file
 */
@Slf4j
class EventStreamPipeline {

    /**
     * Start the event stream pipeline.
     * This method does NOT return — it runs until the process is stopped.
     *
     * @param sourcePattern   Glob pattern for input files
     * @param outputDir       Directory for output files
     * @param windowMinutes   Window size in minutes (default: 1)
     */
    static void run(
        String sourcePattern = '/datapallas/incoming/events-*.json',
        String outputDir = '/datapallas/processed/events',
        int windowMinutes = 1
    ) {
        log.info("=== Event stream pipeline starting ===")
        log.info("Source: {} | Window: {} min", sourcePattern, windowMinutes)

        def options = PipelineOptionsFactory.create()
        def pipeline = Pipeline.create(options)

        pipeline
            // ── SOURCE ────────────────────────────────────────────
            // Watch for new files matching the pattern
            .apply("ReadEvents",
                TextIO.read()
                    .from(sourcePattern)
                    .watchForNewFiles(
                        Duration.standardSeconds(30),
                        org.apache.beam.sdk.transforms.Watch.Growth.never()
                    ))

            // ── WINDOW ────────────────────────────────────────────
            // Group events into time windows for batched processing
            .apply("Window", Window.into(
                FixedWindows.of(Duration.standardMinutes(windowMinutes))))

            // ── TRANSFORM ─────────────────────────────────────────
            // Process each event — customize for your data format
            .apply("ProcessEvents", ParDo.of(new DoFn<String, String>() {
                @DoFn.ProcessElement
                void processElement(DoFn<String, String>.ProcessContext c) {
                    def event = c.element()
                    // Your event processing logic here
                    c.output(event)
                }
            }))

            // ── WRITE ─────────────────────────────────────────────
            .apply("WriteResults", TextIO.write()
                .to(outputDir + "/output")
                .withWindowedWrites()
                .withNumShards(1)
                .withSuffix(".json"))

        log.info("Starting event stream — press Ctrl+C to stop")
        pipeline.run()  // streaming — does not finish
    }

    // ─────────────────────────────────────────────────────────────────
    // KAFKA EXAMPLE — uncomment and adapt:
    //
    // @Grab('org.apache.beam:beam-sdks-java-io-kafka:2.72.0')
    // @Grab('org.apache.kafka:kafka-clients:3.7.0')
    // import org.apache.beam.sdk.io.kafka.KafkaIO
    // import org.apache.kafka.common.serialization.StringDeserializer
    //
    // pipeline.apply("ReadKafka", KafkaIO.<String, String>read()
    //     .withBootstrapServers("localhost:9092")
    //     .withTopic("events")
    //     .withKeyDeserializer(StringDeserializer)
    //     .withValueDeserializer(StringDeserializer)
    //     .withoutMetadata())
    // ─────────────────────────────────────────────────────────────────
}
