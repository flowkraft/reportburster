/*
 *
 * 1. This script should be used for zipping the output burst files
 *    in a single file.
 *
 * 2. The script should be executed during the endBursting report
 *    bursting lifecycle phase.
 *
 * 3. Please copy and paste the content
 *    of this script into the existing 
 *    scripts/burst/endBursting.groovy script.
 *
 * 4. The script is doing basic archiving of all the output
 *    PDF files in a single zip file. 
 *    Running multiple times the same input report will
 *    override the output zip file between the consecutive runs.
 *    
 * 5. More complex archiving requirements can be achieved
 *    by modifying this starting script. 
 *   
 */

import com.sourcekraft.documentburster.variables.Variables

//zipFilePath variable keeps the name of the zip file. 
//When bursting a report burst.pdf 
//the output zip file will be named burst.pdf.zip and will
//contain inside all the generated reports
def zipFilePath = ctx.outputFolder+"/"+\
ctx.variables.get(Variables.INPUT_DOCUMENT_NAME)+".zip"

def ant = new AntBuilder()

//zip together all the individual burst reports
ant.zip(destfile: zipFilePath, 
        basedir: ctx.outputFolder,
        includes: "**/*.pdf, **/*.xls, **/*.xlsx")

//finally, delete the individual burst reports
ant.delete {
		fileset(dir:ctx.outputFolder,
		includes: "**/*.pdf, **/*.xls, **/*.xlsx")
		}