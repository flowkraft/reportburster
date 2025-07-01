import com.sourcekraft.documentburster.sender.factory.EmailMessageFactory

import java.io.File

import org.apache.commons.lang3.StringUtils

import org.apache.commons.mail.MultiPartEmail
import org.apache.commons.mail.ImageHtmlEmail
import org.apache.commons.mail.EmailAttachment
import org.apache.commons.mail.resolver.DataSourceFileResolver

//where to send the failed reports
def to = "your.address@here.com"

def failJobIfAnyDistributionFails = ctx.settings.isFailJobIfAnyDistributionFails()

if (!failJobIfAnyDistributionFails)
{
    log.error("Error happened for burst token: " + 
        ctx.token +", file path: '" + ctx.extractedFilePath + "'. " +
        "Processing will continue since 'failJobIfAnyDistributionFails' " +
        "configuration is 'false'.", ctx.getLastException())
        
    /*
    def msg = (new EmailMessageFactory()).createEmailMessage(ctx)

    def email

    if (msg.isHtmlEmail)
	    email = new ImageHtmlEmail()
    else
	    email = new MultiPartEmail()

    if (msg.isAuthentication)
	    email.setAuthentication(msg.authuser, msg.authpwd)
 
    email.setHostName(msg.hostName)
    email.setSmtpPort(msg.smtpPort)

    email.setFrom(msg.fromAddress, msg.fromName)

    email.setTLS(msg.isTls)
    email.setSSL(msg.isSsl)
    email.setDebug(msg.isDebug)

    for (path in msg.attachments){
	    EmailAttachment attachment = new EmailAttachment()
	    attachment.setPath(path)
	    attachment.setDisposition(EmailAttachment.ATTACHMENT)
	    email.attach(attachment)
    }

    email.setSubject(msg.subject)

    if (StringUtils.isNotEmpty(msg.textMessage)) {

	    if (!msg.isHtmlEmail)
		    email.setMsg(msg.textMessage)
	    else
		    ((ImageHtmlEmail) email).setTextMsg(msg.textMessage)

    }

    if (msg.isHtmlEmail) {

	    ((ImageHtmlEmail) email).setDataSourceResolver(new DataSourceFileResolver(((new File("./templates")).toURI()).toURL()))

	    if (StringUtils.isNotEmpty(msg.htmlMessage)) 
		    ((ImageHtmlEmail) email).setHtmlMsg(msg.htmlMessage)

    }
	
	email.addTo(to)

    email.send()
    */	
}
else
    throw ctx.getLastException()