/*
 *
 * 1. This script should be used as a sample to silently batch 
 *    print the burst (PDF) reports.
 *
 * 2. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 3. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 * 4. This script is using Foxit Reader in order to print the reports. 
 *    Foxit Reader should be installed on your machine in order for 
 *    this script to work properly.
 *
 *	  - http://www.foxitsoftware.com/
 *
 * 5. Foxit Reader - Command Line Switches
 * 
 *      5.1 Print a PDF file silently to the default printer:
 *   	
 *          "Foxit Reader.exe" /p <PDF Path>
 *
 *      5.2 Print a PDF file silently to an alternative printer:
 *
 *          "Foxit Reader.exe" /t <PDF Path> [Printer]	
 *
 */
import java.io.File
 
def extractFilePath = (new File(ctx.extractedFilePath)).getCanonicalPath()

def execOptions = "/p \"$extractFilePath\""

def ant = new AntBuilder()

log.info("Executing 'Foxit Reader.exe $execOptions'")

//If required, change the path to point to your installation of Foxit Reader
ant.exec(append: "true",
		failonerror: "true",
		output:"logs/foxit.log",
		executable: "C:/Program Files (x86)/Foxit Software/Foxit Reader/Foxit Reader.exe") {
			arg(line:"$execOptions")
		}