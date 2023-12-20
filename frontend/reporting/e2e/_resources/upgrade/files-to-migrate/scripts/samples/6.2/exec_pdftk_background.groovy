/*
 *
 * 1. This script should be used:
 * 		
 *      1.1 - As a sample script to call an external executable
 *      during the report bursting life cycle.
 *      1.2 - As a sample for applying a PDF watermark to the
 *      background of the burst reports. 
 *
 * 2. The external program to be demonstrated is pdftk 
 * 	  http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
 * 
 * 3. pdftk or the pdf toolkit is a cross-platform tool for
 *    manipulating PDF documents. pdftk is basically a front
 *    end to the iText library (compiled to Native code using GCJ),
 *    capable of splitting, merging, encrypting, decrypting, 
 *    uncompressing, recompressing, and repairing PDFs. 
 *    It can also be used to manipulate watermarks, metadata, 
 *    and to fill PDF Forms with FDF Data (Forms Data Format)
 *    or XFDF Data (XML Form Data Format).
 *    
 * 4. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 5. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 * 6. For a full documentation of the PDF background capability
 *    please see
 *    http://www.pdflabs.com/docs/pdftk-man-page/#dest-op-background
 *
 */

import com.smartwish.documentburster.variables.Variables

def extractFilePath = ctx.extractFilePath
def stampedFilePath = ctx.extractFilePath + "_stamped.pdf"

//apply the samples/Stamp.pdf as a background
//to the extracted report
def execOptions =  "\"$extractFilePath\" background samples/Stamp.pdf "
execOptions += "output \"$stampedFilePath\""

/*
 *
 * 1. Please download and install pdftk from this location
 *    http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
 *
 * 2. Make sure to download the binaries which are
 * 	  specific to the target operating system.
 *
 * 3. Move the pdftk.exe and libiconv2.dll in the folder
 *    where DocumentBurster was installed, next 
 *    to DocumentBurster.exe file.
 * 
 */

def ant = new AntBuilder()

log.info("Executing pdftk.exe $execOptions")

//http://groovy.codehaus.org/Executing%20External%20Processes%20From%20Groovy
ant.exec(append: "true",
		failonerror: "true",
		output:"logs/pdftk.log",
		executable: 'pdftk.exe') {
			arg(line:"$execOptions")
		}

ant.move(file:"$stampedFilePath", tofile:"$extractFilePath")