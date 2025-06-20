/*
 *
 * 1. This script can be used for sending various ad-hoc 
 *    emails during the report bursting flow.
 *
 * 2. Based on your needs, the script can be executed in any of the existing
 *    report bursting lifecycle phases (e.g. endBursting, endExtractDocument etc).
 *
 * 3. For example, this script can be used almost out of the box for sending
 *    an email notification when bursting is successfully finished. 
 *    To achieve this, please copy and paste the content of this sample script
 *    into the existing scripts/burst/endBursting.groovy
 *    script.
 *
 * 4. How to customize the script
 *
 *        4.1. Please change the first uncommented line of the script 
 *        (def to = "your.address@here.com") with the email address where 
 *        you need the email to be sent.
 *    
 *        4.2. Optionally you can change the subject and the message of the 
 *        email.
 *
 * 5. Ant Mail task is used
 *    - http://ant.apache.org/manual/Tasks/mail.html
 *
 */

//give a valid email address
def to = "your.address@here.com"

def host = ctx.settings.getEmailServerHost()
def port = ctx.settings.getEmailServerPort()

def user = ctx.settings.getEmailServerUserId()
def password = ctx.settings.getEmailServerUserPassword()

def from = ctx.settings.getEmailServerFrom()

//Optionally the subject can be changed
def subject = "DocumentBurster finished"

//The message can be also changed
def message = "Input file: " + ctx.inputDocumentFilePath +"\n\n"

message = message + "Number of pages: " +ctx.numberOfPages + "\n\n"

message = message + "Number of files extracted: "
message = message + ctx.numberOfExtractedFiles+"\n"

message = message + "Output folder: " + ctx.outputFolder+"\n\n"

message = message + "Number of files distributed: " 
message = message + ctx.numberOfDistributedFiles+"\n\n"

message = message + "Number of files skipped from distribution: "
message = message  + ctx.numberOfSkippedFiles+"\n"

message = message + "Number of files quarantined: "
message = message + ctx.numberOfQuarantinedFiles+"\n"

message = message + "Quarantine folder: " + ctx.quarantineFolder+"\n\n"

def ssl="no"

if (ctx.settings.isEmailServerUseSSL())
	ssl="yes"

def enableStartTLS="no"

if (ctx.settings.isEmailServerUseTLS())
	enableStartTLS="yes"

ant = new AntBuilder()

ant.mail(mailhost:"${host}",
         mailport:"${port}",
         user:"${user}",
         password:"${password}",
         subject:"${subject}",
         from:"${from}",
         tolist:"${to}",
         message:"${message}",
         ssl:"${ssl}",
         enableStartTLS:"${enableStartTLS}")
		
log.info("Notification email sent successfully to email address ${to} ...")