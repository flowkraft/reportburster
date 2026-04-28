package com.flowkraft.bkend.controllers

import com.flowkraft.bkend.pipelines.batch.CustomerIngestionPipeline
import com.flowkraft.bkend.pipelines.batch.InvoiceReportPipeline
import com.flowkraft.bkend.pipelines.streaming.FileWatcherPipeline
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import groovy.util.logging.Slf4j

/**
 * REST controller to trigger data pipelines on demand.
 *
 * Provides HTTP endpoints to run batch pipelines and start/stop streaming pipelines.
 * This is an alternative to scheduled execution via crons.groovy — use whichever
 * fits your workflow better (or both).
 *
 * HOW TO USE:
 *   1. Copy the controllers/ and pipelines/ folders into src/main/groovy/com/flowkraft/bkend/
 *   2. Rebuild the app
 *   3. Call the endpoints:
 *
 *      # Run customer ingestion
 *      curl -X POST http://localhost:8080/api/pipelines/customer-ingestion \
 *           -H "Content-Type: application/json" \
 *           -d '{"inputPath": "/data/customers.csv"}'
 *
 *      # Run invoice report
 *      curl -X POST http://localhost:8080/api/pipelines/invoice-report
 *
 *      # Start file watcher (runs in background)
 *      curl -X POST http://localhost:8080/api/pipelines/file-watcher/start
 */
@Slf4j
@RestController
@RequestMapping('/api/pipelines')
class PipelineController {

    // ── BATCH PIPELINES ─────────────────────────────────────────

    @PostMapping('/customer-ingestion')
    ResponseEntity<?> runCustomerIngestion(@RequestBody(required = false) Map<String, Object> params) {
        def inputPath = params?.inputPath ?: '/datapallas/data/customers.csv'

        try {
            CustomerIngestionPipeline.run(inputPath)
            return ResponseEntity.ok([status: 'success', pipeline: 'customer-ingestion'])
        } catch (Exception e) {
            log.error("Customer ingestion pipeline failed: {}", e.message, e)
            return ResponseEntity.internalServerError().body([
                status: 'error',
                pipeline: 'customer-ingestion',
                error: e.message
            ])
        }
    }

    @PostMapping('/invoice-report')
    ResponseEntity<?> runInvoiceReport(@RequestBody(required = false) Map<String, Object> params) {
        def inputPath = params?.inputPath ?: '/datapallas/data/invoices.csv'

        try {
            InvoiceReportPipeline.run(inputPath)
            return ResponseEntity.ok([status: 'success', pipeline: 'invoice-report'])
        } catch (Exception e) {
            log.error("Invoice report pipeline failed: {}", e.message, e)
            return ResponseEntity.internalServerError().body([
                status: 'error',
                pipeline: 'invoice-report',
                error: e.message
            ])
        }
    }

    // ── STREAMING PIPELINES ─────────────────────────────────────

    private Thread fileWatcherThread = null

    @PostMapping('/file-watcher/start')
    ResponseEntity<?> startFileWatcher(@RequestBody(required = false) Map<String, Object> params) {
        if (fileWatcherThread?.alive) {
            return ResponseEntity.badRequest().body([
                status: 'already-running',
                pipeline: 'file-watcher'
            ])
        }

        def watchDir = params?.watchDir ?: '/datapallas/incoming/'
        def pollSeconds = (params?.pollSeconds ?: 30) as int

        fileWatcherThread = Thread.start {
            FileWatcherPipeline.run(watchDir, pollSeconds)
        }

        return ResponseEntity.ok([
            status: 'started',
            pipeline: 'file-watcher',
            watchDir: watchDir,
            pollSeconds: pollSeconds
        ])
    }

    @PostMapping('/file-watcher/stop')
    ResponseEntity<?> stopFileWatcher() {
        if (!fileWatcherThread?.alive) {
            return ResponseEntity.ok([status: 'not-running', pipeline: 'file-watcher'])
        }

        fileWatcherThread.interrupt()
        return ResponseEntity.ok([status: 'stopping', pipeline: 'file-watcher'])
    }
}
