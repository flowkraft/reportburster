package com.flowkraft.bkend.helpers

// @Grab downloads the JACOB JAR from Maven Central at runtime — no pom.xml needed.
// JACOB also requires a native DLL on the system:
//   1. Download jacob-1.18-x64.dll from https://github.com/freemansoft/jacob-project/releases
//   2. Place it in a folder on your PATH (e.g., C:\Windows\System32 or your app's lib/ folder)
//   3. Or set -Djava.library.path=/path/to/dll when starting the JVM
@Grab('com.hynnet:jacob:1.18')
import com.jacob.activeX.ActiveXComponent
import com.jacob.com.ComThread
import com.jacob.com.Dispatch
import com.jacob.com.Variant
import groovy.util.logging.Slf4j

/**
 * Refreshes all embedded queries (Power Query, Power Pivot, ODBC, OLE DB, etc.)
 * in an Excel workbook using COM automation via JACOB.
 *
 * IMPORTANT - WINDOWS-NATIVE ONLY:
 *   This helper uses COM (Component Object Model) which is a Windows-only technology.
 *   It CANNOT run inside a Linux Docker container. If bkend-boot-groovy-playground
 *   is running in Docker (the default), you must run it natively on Windows instead:
 *
 *     cd _apps/flowkraft/bkend-boot-groovy-playground
 *     mvnw.cmd spring-boot:run ^
 *       -Dspring-boot.run.jvmArguments="-Djava.library.path=lib"
 *
 *   Place jacob-1.18-x64.dll in the lib/ folder (or any folder on your PATH).
 *   Download from: https://github.com/freemansoft/jacob-project/releases
 *
 * Requirements:
 *   - Windows OS (NOT Docker / NOT Linux)
 *   - Microsoft Excel installed (desktop, not online)
 *   - JACOB native DLL (jacob-1.18-x64.dll) on the PATH or java.library.path
 *   - bkend-boot-groovy-playground running natively on Windows (not in Docker)
 *
 * This is the DataPallas equivalent of what PowerUpdate did:
 * open workbook -> refresh all connections -> wait -> save -> close.
 *
 * Usage:
 *   ExcelHelper.refreshAndSave('C:/reports/sales-dashboard.xlsx')
 *   ExcelHelper.refreshAndSave('C:/reports/financial-model.xlsx', 'optional-password')
 */
@Slf4j
class ExcelHelper {

    /**
     * Open an Excel workbook, refresh ALL embedded queries, wait for completion,
     * save, and close. Throws on any failure so the caller knows the refresh did not succeed.
     *
     * @param filePath       Absolute path to the .xlsx/.xlsm file
     * @param excelPassword  Workbook password (null or empty if none)
     */
    static void refreshAndSave(String filePath, String excelPassword = null) {
        log.info("Excel refresh starting: {}", filePath)

        ActiveXComponent excelApp = null
        Dispatch workbooks = null
        Dispatch workbook = null

        ComThread.InitSTA()

        try {
            excelApp = new ActiveXComponent("Excel.Application")

            // Run invisibly with no prompts
            excelApp.setProperty("Visible", new Variant(false))
            excelApp.setProperty("DisplayAlerts", new Variant(false))
            excelApp.setProperty("AskToUpdateLinks", new Variant(false))
            excelApp.setProperty("EnableEvents", new Variant(false))

            workbooks = excelApp.getProperty("Workbooks").toDispatch()

            // Open workbook (with or without password)
            if (excelPassword) {
                workbook = Dispatch.call(
                    workbooks, "Open",
                    filePath,
                    new Variant(false),          // UpdateLinks
                    new Variant(false),          // ReadOnly
                    new Variant(5),              // Format
                    new Variant(excelPassword)
                ).toDispatch()
            } else {
                workbook = Dispatch.call(
                    workbooks, "Open",
                    filePath,
                    new Variant(false),
                    new Variant(false)
                ).toDispatch()
            }

            // Refresh ALL connections, queries, pivot caches
            Dispatch.call(workbook, "RefreshAll")

            // Wait until Excel finishes all async refresh operations
            waitForRefresh(excelApp)

            // Save the refreshed workbook
            Dispatch.call(workbook, "Save")

            log.info("Excel refresh completed successfully: {}", filePath)

        } catch (Exception e) {
            log.error("Excel refresh FAILED for {}: {}", filePath, e.message)
            throw new RuntimeException("Excel refresh failed for ${filePath}: ${e.message}", e)
        } finally {
            try { if (workbook) Dispatch.call(workbook, "Close", new Variant(false)) } catch (ignored) {}
            try { if (workbooks) Dispatch.call(workbooks, "Close") } catch (ignored) {}
            try { if (excelApp) excelApp.invoke("Quit", new Variant[0]) } catch (ignored) {}
            ComThread.Release()
        }
    }

    /**
     * Refresh all Excel files in a folder.
     *
     * @param folderPath  Folder containing .xlsx/.xlsm files
     * @param password    Optional workbook password (applied to all files)
     */
    static void refreshFolder(String folderPath, String password = null) {
        def folder = new File(folderPath)
        if (!folder.isDirectory()) {
            throw new IllegalArgumentException("Not a directory: ${folderPath}")
        }

        def excelFiles = folder.listFiles({ File f ->
            f.name.endsWith('.xlsx') || f.name.endsWith('.xlsm')
        } as FileFilter)

        log.info("Found {} Excel files in {}", excelFiles?.length ?: 0, folderPath)

        def failures = []

        excelFiles?.each { File file ->
            try {
                refreshAndSave(file.absolutePath, password)
            } catch (Exception e) {
                log.error("Failed: {}", file.name)
                failures << [file: file.name, error: e.message]
            }
        }

        if (failures) {
            def msg = failures.collect { "${it.file}: ${it.error}" }.join('\n')
            throw new RuntimeException("${failures.size()} of ${excelFiles.length} files failed:\n${msg}")
        }

        log.info("All {} files refreshed successfully", excelFiles.length)
    }

    /**
     * Wait for Excel to finish all async refresh operations (Power Query, ODBC, etc.).
     */
    private static void waitForRefresh(ActiveXComponent excelApp) {
        int maxWaitSeconds = 300  // 5 minutes max
        int waited = 0

        while (waited < maxWaitSeconds) {
            try {
                Variant state = excelApp.getProperty("CalculationState")
                // 0 = xlDone, 1 = xlCalculating, 2 = xlPending
                if (state != null && state.getInt() == 0) {
                    break
                }
            } catch (Exception e) {
                // If CalculationState is unavailable, fall back to a fixed wait
                Thread.sleep(2000)
                return
            }
            Thread.sleep(500)
            waited++
        }

        // Extra safety delay for background Power Query operations
        Thread.sleep(3000)
    }
}
