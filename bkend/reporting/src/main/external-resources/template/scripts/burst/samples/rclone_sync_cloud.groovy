/*
 *
 * 1. This script should be used for syncing the output burst files
 *    to cloud storage using rclone.
 *
 * 2. The script should be executed during the endBursting report
 *    bursting lifecycle phase.
 *
 * 3. Please copy and paste the content
 *    of this script into the existing 
 *    scripts/burst/endBursting.groovy script.
 *
 * 4. The script is doing basic syncing of all the output files
 *    (PDF, XLS, XLSX, etc.) to a configured cloud remote using rclone.
 *    Running multiple times the same input report will sync the latest
 *    output files to the cloud, overwriting if necessary.
 *    
 * 5. More complex syncing requirements (e.g., filtering files, 
 *    incremental syncs, or multiple remotes) can be achieved
 *    by modifying this starting script.
 *
 * 6. Prerequisites:
 *    - rclone must be configured with your cloud remote (e.g., via 'rclone config').
 *    - The remote name and path should be provided via user variables.
 *    - For documentation on rclone, see https://rclone.org/docs/
 *
 */

import com.sourcekraft.documentburster.variables.Variables

/*
 *    By default the script is extracting the required rclone 
 *    session information from the following sources:
 *
 *      remoteName - from the content of ${var0} user variable (e.g., "dropbox", "gdrive")
 *      remotePath - from the content of ${var1} user variable (e.g., "/reports" or "myfolder/reports")
 *
 *    The source folder is the output folder where burst files are generated.
 */
def remoteName = ctx.variables.getUserVariables(ctx.token).get("var0")
def remotePath = ctx.variables.getUserVariables(ctx.token).get("var1")

def sourceFolder = ctx.outputFolder

/*
 *    ${execOptions} is the command line to be sent for execution to rclone
 *    - see https://rclone.org/docs/
 *
 *    sync - Make source and dest identical, modifying destination only.
 *           Doesn't transfer unchanged files, testing by size and modification time or MD5SUM.
 *           Destination is updated to match source, including deleting files if necessary.
 *
 *    --log-file - Log all of rclone's output to the specified file.
 *                 This is not quite the same as simply capturing the output of rclone.
 *                 It uses rclone's internal logging infrastructure.
 *
 *    --log-level - Log level DEBUG|INFO|NOTICE|ERROR.
 *
 *    For more details see: https://rclone.org/docs/
 */
def execOptions = "sync \"${sourceFolder}\" \"${remoteName}:${remotePath}\""
execOptions += " --log-file logs/rclone.log"
execOptions += " --log-level INFO"

def ant = new AntBuilder()

/*
 *    The command executed by rclone will be logged in
 *    the logs/DocumentBurster.log file 
 */
log.info("Executing command: tools/rclone/rclone.exe ${execOptions}")

/*
 *    Execute the rclone sync command.
 *    - executable: Path to rclone.exe
 *    - output: Redirect stdout to the log file
 *    - error: Redirect stderr to the log file
 *    - failonerror: Stop if the command fails
 */
ant.exec(
    append: "true",
    failonerror: "true",
    output: "logs/rclone.log",
    error: "logs/rclone.log",
    executable: 'tools/rclone/rclone.exe') {
        arg(line: "$execOptions")
    }