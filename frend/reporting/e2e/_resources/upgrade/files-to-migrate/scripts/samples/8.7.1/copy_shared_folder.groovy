/*
 *
 * 1. This script should be used for copying each individual 
 *    output burst file to a shared folder
 *    (as long as the shared drive is mounted).
 *
 * 2. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 3. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 * 4. Ant copy task is used to upload the reports to the 
 *    shared location
 *    - http://ant.apache.org/manual/Tasks/copy.html
 *
 */

import com.sourcekraft.documentburster.variables.Variables

def ant = new AntBuilder()

/*
 *    By default the script is getting the shared location path
 *    from the content of $var0$ user variable (e.g //VBOXSVR/shareit)
 *      
 */
def sharedLocationPath = ctx.variables.getUserVariables(ctx.token).get("var0")

//ant.copy(file:ctx.extractedFilePath, todir:'//VBOXSVR/shareit', overwrite:true)
ant.copy(file:ctx.extractedFilePath, todir:"$sharedLocationPath", overwrite:true)