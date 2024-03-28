/*
 *
 * 1. This script can be used for sending HTML 
 *    emails using CID Embedded Images (Inline Images)
 *
 * 2. Out of the box HTML emails can refer to images 
 *    locally available in DocumentBurster's /templates folder. This script, using the http protocol,
 *    can embed images available on the web. https is not supported.
 *
 * 3. The script can be used instead of the scripts/internal/email.groovy which is the
 *    out of the box emailing mechanism of DocumentBurster (controller.groovy needs to be modified)
 *
 * 4. In the HTML code the image should be defined having this syntax src="cid:%cid%"
 *    where the %cid% variable will be replaced by the script with the correct ID of the embedded image
 *
 * 5. Change the URL from line String cid = email.embed(new URL ... to point to an http:// image from the web.
 *    https is not supported.
 *
 */
 
import java.io.File
import java.net.URL

import org.apache.commons.lang3.StringUtils

import org.apache.commons.mail.MultiPartEmail
import org.apache.commons.mail.ImageHtmlEmail
import org.apache.commons.mail.EmailAttachment

import org.apache.commons.mail.resolver.DataSourceUrlResolver

def msg = message
def email

if (msg.isHtmlEmail)
	email = new ImageHtmlEmail()
else
	email = new MultiPartEmail()

if (msg.isAuthentication)
	email.setAuthentication(msg.authuser, msg.authpwd)
 
email.setHostName(msg.hostName)
email.setSmtpPort(Integer.parseInt(msg.smtpPort))

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

	if (StringUtils.isNotEmpty(msg.htmlMessage))
	{
		email.setDataSourceResolver(new DataSourceUrlResolver(null))
		String cid = email.embed(new URL("http://barefoot5k.com/wp-content/uploads/2014/12/pepsi-logo-300x204.png"), "Logo")
	    msg.htmlMessage = StringUtils.replace(msg.htmlMessage, "%cid%",cid)
		((ImageHtmlEmail) email).setHtmlMsg(msg.htmlMessage)
	}
}

for (address in msg.tos){
	email.addTo(address)
}

for (address in msg.ccs){
	email.addCc(address)
}

for (address in msg.bccs){
	email.addBcc(address)
}

email.send()