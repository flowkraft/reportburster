/*
 *
 * 1. This script should be used for copying each individual output burst file
 *    to a remote SCP/SFTP server location.
 *
 * 2. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 3. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 * 4. Ant SCP task is used to upload the reports
 *    - http://ant.apache.org/manual/Tasks/scp.html
 *
 */
 
import com.smartwish.documentburster.variables.Variables

/*
 *		
 *    By default the script is getting the required SCP/SFTP session
 *    information from the following sources:
 *
 *        userName - from the content of $var0$ user variable
 *        password - from the content of $var1$ user variable
 *
 *        hostName - from the content of $var2$ user variable
 *        absolutePath - from the content of $var3$ user variable
 *
 */
def userName = ctx.variables.getUserVariables(ctx.token).get("var0")
def password = ctx.variables.getUserVariables(ctx.token).get("var1")

def hostName = ctx.variables.getUserVariables(ctx.token).get("var2")
def absolutePath = ctx.variables.getUserVariables(ctx.token).get("var3")

ant = new AntBuilder()

ant.scp(file: ctx.extractFilePath,
		todir: "$userName@$hostName:$absolutePath",
		password: "$password",
		trust:'true')