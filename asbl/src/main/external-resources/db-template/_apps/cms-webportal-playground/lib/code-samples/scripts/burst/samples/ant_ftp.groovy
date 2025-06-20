/*
 *
 * 1. This script should be used for copying all the output burst 
 *    files at once to a remote FTP server location.
 *
 * 2. The script should be executed during the endBursting report
 *    bursting lifecycle phase.
 *
 * 3. Please copy and paste the content of this script into the 
 *    existing scripts/burst/endBursting.groovy script.
 * 
 * 4. The scope of this script is to copy all the *.pdf files 
 *    generated in the last burst session. 
 *    Thus, in order for this script to really upload only 
 *    the last generated files, it is	required that each burst 
 *    session will generate a new and unique burst output folder.
 * 
 * 5. Ant FTP task is used to upload the reports
 *    - http://ant.apache.org/manual/Tasks/ftp.html
 *
 */
 
import com.sourcekraft.documentburster.variables.Variables

/*
 *    By default the script is getting the required FTP session information
 *    from the following sources:
 *
 *        userName - from the content of ${var0} user variable
 *        password - from the content of ${var1} user variable
 *
 *        hostName - from the content of ${var2} user variable
 *
 */
def userName = ctx.variables.getUserVariables(ctx.token).get("var0")
def password = ctx.variables.getUserVariables(ctx.token).get("var1")

def hostName = ctx.variables.getUserVariables(ctx.token).get("var2")

ant = new AntBuilder()

/*
 *    Copy all the *.pdf files generated in the last burst session.
 *    Thus, in order for this script to really upload only
 *    the last generated files, it is	required that each burst
 *    session will generate a new and unique burst output folder.
 *
 */
ant.ftp(server: "${hostName}",
		userid: "${userName}",
		password: "${password}",
		passive: 'yes',
		verbose: 'yes',
		binary: 'yes' ) {
			fileset(dir:ctx.outputFolder,includes: '**/*.pdf')
		}