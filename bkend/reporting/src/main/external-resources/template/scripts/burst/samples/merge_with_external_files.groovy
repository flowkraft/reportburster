/*
 *
 * 1. This script can be used for merging the output PDF burst files
 *    with other external reports.
 *    
 *    The script can:
 * 		
 *      1.1 - Merge each of the output burst files with other 
 *      external and configurable report.
 *      1.2 - By default the external report is merged first
 *      and the burst report is appended second.
 *      1.3 - The merge order can be changed. Please see the
 *      inline code comments for further details.
 *      1.4 - Once the reports are merged, DocumentBurster
 *      flow will continue as normal  
 *
 * 2. By default the script is merging as an external report
 *    the hard-coded samples/Invoices-Dec.pdf.
 *     
 * 3. By using user variables it is possible to define a 
 *    configurable and dynamic external report to merge with.
 *    For example, the external report to merge with can be 
 *    dynamically defined with the help of the ${var0} user variable.
 *
 *    Please check the inline code comments for further details.
 * 
 * 4. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 5. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 */

import com.sourcekraft.documentburster.engine.pdf.Merger;
import org.apache.commons.io.FilenameUtils;

def mergedFileName = FilenameUtils.getBaseName(ctx.extractedFilePath)+"_merged.pdf"

/*
 *    External report to merge with. The default external report is
 *    defined to be "samples/Invoices-Dec.pdf"
 *
 *    The external report can be dynamically defined with the help
 *    of user variables. 
 *
 *    For example
 *  
 * def externalFilePath = ctx.variables.getUserVariables(ctx.token).get("var0")
 *
*/

def externalFilePath = "samples/Invoices-Dec.pdf"

//array with the two files to merge
def filePaths = []

//by default the external file is merged first
filePaths << externalFilePath
//and the burst report is merged second
filePaths << ctx.extractedFilePath

def merger = new Merger(ctx.settings)

merger.doMerge(filePaths, mergedFileName)

def ant = new AntBuilder()

//replace the original burst report
//with the merged one
ant.delete(file:ctx.extractedFilePath)
ant.copy(file: merger.getOutputFolder() + "/${mergedFileName}", 
         tofile:ctx.extractedFilePath)

//clean the temporary folders/files
//this code assumes that the default program output/backup location
//is not changed
ant.delete(dir: "output/${mergedFileName}",failonerror:false)
ant.delete(dir: "backup/${mergedFileName}",failonerror:false)