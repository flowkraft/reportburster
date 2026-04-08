package com.flowkraft.bkend.crons

import com.flowkraft.bkend.helpers.ExcelHelper
import com.flowkraft.bkend.helpers.DbtHelper
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import groovy.util.logging.Slf4j

/**
 * Scheduled tasks for ReportBurster.
 *
 * Both schedules below are INACTIVE by default (commented out).
 * To activate, uncomment the @Scheduled annotation and adjust the cron expression.
 *
 * Cron format: second minute hour day-of-month month day-of-week
 * Examples:
 *   "0 0 6 * * MON-FRI"   → 6:00 AM every weekday
 *   "0 30 * * * *"         → every hour at :30
 *   "0 0 2 * * *"          → 2:00 AM every day (nightly)
 *   "0 0 0 * * *"          → midnight every night
 *   "0 0/15 * * * *"       → every 15 minutes
 */
@Slf4j
@Component
class Crons {

    // ─────────────────────────────────────────────────────────────────
    // EXCEL REFRESH — Refresh Power Queries in Excel workbooks
    //
    // Requires: Windows + Microsoft Excel installed
    //
    // IMPORTANT: This feature uses COM automation (JACOB) which only
    // works on Windows. If this app is running in Docker (Linux),
    // the Excel refresh will fail. You must run the Groovy playground
    // natively on Windows for this feature:
    //
    //   cd _apps/flowkraft/bkend-boot-groovy-playground
    //   mvnw.cmd spring-boot:run ^
    //     -Dspring-boot.run.jvmArguments="-Djava.library.path=lib"
    //
    // See ExcelHelper.groovy and the blog post for full setup details.
    //
    // Common use case: refresh 50-100 Excel dashboards with live
    // database connections every morning before the team arrives.
    //
    // To activate: uncomment the @Scheduled line below.
    // To customize: change the file path, folder, or cron expression.
    // ─────────────────────────────────────────────────────────────────

    // @Scheduled(cron = "0 0 5 * * MON-FRI")  // 5:00 AM every weekday
    void refreshExcelReports() {
        log.info("=== Scheduled Excel refresh starting ===")

        try {
            // Option 1: Refresh a single workbook
            ExcelHelper.refreshAndSave('C:/reports/sales-dashboard.xlsx')

            // Option 2: Refresh ALL Excel files in a folder
            // ExcelHelper.refreshFolder('C:/reports/daily-refreshes')

            // Option 3: Refresh multiple specific files
            // ExcelHelper.refreshAndSave('C:/reports/finance/budget-vs-actual.xlsx')
            // ExcelHelper.refreshAndSave('C:/reports/ops/inventory-tracker.xlsx', 'workbook-password')

            log.info("=== Scheduled Excel refresh completed ===")
        } catch (Exception e) {
            log.error("=== Scheduled Excel refresh FAILED: {} ===", e.message)
            // The error is logged — add email/Slack notification here if needed
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // DBT TRANSFORM — Run ETL transforms (OLTP → OLAP star schema)
    //
    // Runs: docker compose run dbt-transform run
    // Requires: Docker running, dbt-transform service configured in db/docker-compose.yml
    //
    // Common use case: refresh your ClickHouse data warehouse hourly
    // so dashboards always show current data.
    //
    // To activate: uncomment the @Scheduled line below.
    // See db/CONFIGURE_ETL.md for full setup instructions.
    //
    // You have full control over this file. Edit it however you want.
    // DbtHelper.run(extraArgs) passes whatever string you provide
    // directly to: docker compose run dbt-transform run {extraArgs}
    //
    // Examples you can use in the method body below:
    //   DbtHelper.run()                                    // Run all models
    //   DbtHelper.run('--select dim_customer fact_sales')  // Run specific models
    //   DbtHelper.run('--select tag:hourly')               // Run models tagged 'hourly'
    //   DbtHelper.run('--full-refresh')                    // Drop + recreate all tables
    //   DbtHelper.run('--target production')               // Use a specific dbt profile target
    //   DbtHelper.run('--select +fact_sales')              // Run fact_sales and all upstream deps
    //
    // Any argument you'd normally pass to `dbt run` works here.
    // ─────────────────────────────────────────────────────────────────

    // @Scheduled(cron = "0 30 * * * *")  // Every hour at :30
    void runDbtTransforms() {
        log.info("=== Scheduled dbt transform starting ===")

        try {
            // Run all dbt models (dimensions + facts + views)
            DbtHelper.run()

            // Or run specific models:
            // DbtHelper.run('--select dim_customer fact_sales')

            // Or force full refresh (drop + recreate):
            // DbtHelper.run('--full-refresh')

            log.info("=== Scheduled dbt transform completed ===")
        } catch (Exception e) {
            log.error("=== Scheduled dbt transform FAILED: {} ===", e.message)
            // The error is logged — add email/Slack notification here if needed
        }
    }
}
