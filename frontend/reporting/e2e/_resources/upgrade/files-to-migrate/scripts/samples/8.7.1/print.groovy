/*
 *
 * 1. This script should be used as a sample to print the burst reports.
 *
 * 2. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 3. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 * 4. For a full documentation of the PDF print capability
 *    please see
 *    http://pdfbox.apache.org/commandline/
 *
 */

import com.sourcekraft.documentburster.variables.Variables

/*
 *
 * Warning:
 *
 * 1. Normally it should not be any need for you to modify
 *    the value of pdfBoxClassPath.
 *
 * 2. You should only double check that the values of
 *    the hard-coded jar paths/versions are still valid.
 * 	  With new releases of new software the jar paths/versions
 *    might become obsolete.
 *
 * 3. If required, modify the paths/versions with care.
 *    Having the pdfBoxClassPath wrong will result in the
 *    following ant.exec/pdfbox call to fail.
 *
 */

def pdfBoxClassPath="lib/burst/pdfbox-2.0.20.jar"
pdfBoxClassPath+=";lib/burst/pdfbox-tools-2.0.20.jar"
pdfBoxClassPath+=";lib/burst/jcl-over-slf4j-1.7.30.jar;lib/burst/slf4j-api-1.7.30.jar"
pdfBoxClassPath+=";lib/burst/xmpbox-2.0.20.jar"
pdfBoxClassPath+=";lib/burst/fontbox-2.0.20.jar"
pdfBoxClassPath+=";lib/burst/bcmail-jdk15-1.46.jar"
pdfBoxClassPath+=";lib/burst/bcprov-jdk15-1.46.jar"

def extractFilePath = ctx.extractedFilePath

//-silentPrint can be used to print the PDF without prompting for a printer.
def printOptions =  "\"$extractFilePath\""

log.info("printOptions = $printOptions")

def ant = new AntBuilder()

ant.exec(outputproperty:"cmdOut",
		errorproperty: "cmdErr",
		resultproperty:"cmdExit",
		failonerror: "false",
		executable: 'java') {
			arg(line:"-cp $pdfBoxClassPath org.apache.pdfbox.tools.PrintPDF $printOptions")
		}

println "return code:  ${ant.project.properties.cmdExit}"
println "stderr:       ${ant.project.properties.cmdErr}"
println "stdout:       ${ant.project.properties.cmdOut}"