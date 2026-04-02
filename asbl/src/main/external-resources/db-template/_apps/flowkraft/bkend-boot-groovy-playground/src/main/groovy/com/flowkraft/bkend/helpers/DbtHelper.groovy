package com.flowkraft.bkend.helpers

import groovy.util.logging.Slf4j

/**
 * Runs dbt transforms via Docker Compose.
 *
 * dbt reads raw OLTP tables from ClickHouse and builds an OLAP star schema
 * (dimensions, facts, analytical views). See db/CONFIGURE_ETL.md for details.
 *
 * The dbt models (SQL) live in db/dbt-transform/models/ — edit those to change
 * what gets transformed. This helper just runs them on schedule.
 *
 * Usage:
 *   DbtHelper.run()                               // Run all models
 *   DbtHelper.run('--select dim_customer')         // Run specific model
 *   DbtHelper.run('--full-refresh')                // Drop + recreate all tables
 */
@Slf4j
class DbtHelper {

    /** Path to the db/ directory containing docker-compose.yml with the dbt-transform service */
    static String dbDirectory = '/reportburster/db'

    /**
     * Run dbt transforms via docker compose.
     *
     * @param extraArgs  Optional dbt arguments (e.g., '--select dim_customer', '--full-refresh')
     * @return true if dbt completed successfully, false otherwise
     */
    static boolean run(String extraArgs = '') {
        def command = "docker compose run --rm dbt-transform run ${extraArgs}".trim()

        log.info("dbt transform starting: {}", command)
        log.info("Working directory: {}", dbDirectory)

        try {
            def process = command.execute(null, new File(dbDirectory))

            // Stream stdout and stderr to the log
            def stdout = new StringBuilder()
            def stderr = new StringBuilder()
            process.consumeProcessOutput(stdout, stderr)

            def exitCode = process.waitFor()

            if (stdout) log.info("dbt output:\n{}", stdout)
            if (stderr) log.warn("dbt stderr:\n{}", stderr)

            if (exitCode == 0) {
                log.info("dbt transform completed successfully")
                return true
            } else {
                log.error("dbt transform FAILED with exit code {}", exitCode)
                throw new RuntimeException("dbt transform failed (exit code ${exitCode}). Check logs above.")
            }

        } catch (Exception e) {
            log.error("dbt transform error: {}", e.message)
            throw new RuntimeException("dbt transform failed: ${e.message}", e)
        }
    }
}
