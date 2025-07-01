/*
 * 
 * 1. This script should be used for achieving PDF report 
 *    encryption capabilities.
 * 
 * 2. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 * 
 * 3. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 * 
 * 4. Following PDF encryption scenarios are possible:
 *  	
 *      4.1 -  Set the owner and user PDF passwords. Default is none.
 *      4.2 -  Digitally sign the report with a X.509 cert file. 
 *      Default is none.
 *      4.3 -  Set the assemble permission. Default is true.  
 *      4.4 -  Set the extraction permission. Default is true.   
 *      4.5 -  Set the fill in form permission. Default is true.
 *      4.6 -  Set the modify permission. Default is true.
 *      4.7 -  Set the modify annots permission. Default is true.
 *      4.8 -  Set the print permission. Default is true.
 *      4.9 -  Set the print degraded permission. Default is true.
 *      4.10 - Sets the number of bits for the encryption key. 
 *      Default is 40. 
 *      
 * 5. For a full list and documentation of the various PDF encryption
 *    capabilities please see
 *    http://pdfbox.apache.org/commandlineutilities/Encrypt.html 
 *
 */

import com.smartwish.documentburster.variables.Variables

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

def pdfBoxClassPath="lib/burst/pdfbox-1.0.0.jar"
pdfBoxClassPath+=";lib/burst/commons-logging-1.1.1.jar"
pdfBoxClassPath+=";lib/burst/jempbox-1.0.0.jar"
pdfBoxClassPath+=";lib/burst/fontbox-1.0.0.jar"
pdfBoxClassPath+=";lib/burst/bcmail-jdk15-1.44.jar"
pdfBoxClassPath+=";lib/burst/bcprov-jdk15-1.44.jar"

/*
 * 
 * 1. encryptOptions are the arguments which are passed for 
 *    PDF encryption.
 * 
 * 2. By default the encryptOptions is defining the
 *    owner (-O) and user (-U) passwords having the same
 *    value of the $burst_token$ system variable.
 * 
 * 3. You can customize for different user and owner
 *    passwords which can be fetched from the values 
 *    of any user variable such as $var0$, $var1$, etc. 
 * 
 */

def burstToken = ctx.token

/*
 *
 *  Following is an example to access the value of the first 
 *  user defined variable $var0$.
 *
 *  def password = ctx.variables.getUserVariables(ctx.token).get("var0")
 *
 */

def password = burstToken

def inputFile = ctx.extractFilePath

/*
 *
 * 1. By changing the encryptOptions arguments you can 
 *    achieve more PDF encryption features such as applying 
 *    certification files, modifying the permissions on the report
 *    and modifying the length of the key which is used 
 *    during encryption.
 *
 * 2. For a full list and documentation of the various
 *    PDF encryption capabilities please see
 *    http://pdfbox.apache.org/commandlineutilities/Encrypt.html
 *    
 * 3. Gotchas: Take care if you want to pass an argument 
 *    that contains white space since it will be split into 
 *    multiple arguments. This is the reason why
 *    in encryptOptions all the string arguments are 
 *    surrounded with the \" character. 
 *    
 *    For more details please read
 *    http://groovy.codehaus.org/Executing+External+Processes+From+Groovy   
 *
 */

def encryptOptions =  "-O \"$password\" -U \"$password\" \"$inputFile\""

log.info("encryptOptions = $encryptOptions")

def ant = new AntBuilder()

ant.exec(outputproperty:"cmdOut",
		errorproperty: "cmdErr",
		resultproperty:"cmdExit",
		failonerror: "false",
		executable: 'java') {
			arg(line:"-cp $pdfBoxClassPath org.apache.pdfbox.Encrypt $encryptOptions")
		}

println "return code:  ${ant.project.properties.cmdExit}"
println "stderr:       ${ant.project.properties.cmdErr}"
println "stdout:       ${ant.project.properties.cmdOut}"