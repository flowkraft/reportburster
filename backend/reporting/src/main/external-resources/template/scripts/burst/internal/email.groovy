import java.io.File

import org.apache.commons.lang3.StringUtils

import org.apache.commons.mail.MultiPartEmail
import org.apache.commons.mail.ImageHtmlEmail
import org.apache.commons.mail.EmailAttachment
import org.apache.commons.mail.resolver.DataSourceFileResolver
import org.apache.commons.mail.resolver.DataSourceUrlResolver

import com.sourcekraft.documentburster.mail.SimpleJavaMailDecorator
import com.sourcekraft.documentburster.utils.Utils

if (StringUtils.isEmpty(message.htmlMessage))
	message.isHtmlEmail = false
else
	message.isHtmlEmail = true

def commonsEmail

if (message.isHtmlEmail)
	commonsEmail = new ImageHtmlEmail()
else
	commonsEmail = new MultiPartEmail()

if (message.isAuthentication)
	commonsEmail.setAuthentication(message.authuser, message.authpwd)
 
commonsEmail.setHostName(message.hostName)
commonsEmail.setSmtpPort(message.smtpPort)

commonsEmail.setFrom(message.fromAddress, message.fromName)

commonsEmail.setTLS(message.isTls)
commonsEmail.setSSL(message.isSsl)
commonsEmail.setDebug(message.isDebug)

for (path in message.attachments){
	
	EmailAttachment attachment = new EmailAttachment()
	attachment.setPath(path)
	attachment.setDisposition(EmailAttachment.ATTACHMENT)
	commonsEmail.attach(attachment)

}

commonsEmail.setSubject(message.subject)

if (StringUtils.isNotBlank(message.textMessage)) {

	if (!message.isHtmlEmail)
		commonsEmail.setMsg(message.textMessage)
	else
		((ImageHtmlEmail) commonsEmail).setTextMsg(message.textMessage)

}

if (message.isHtmlEmail) {

	//in HTML you'll define an image from the web like this src="http://barefoot5k.com/wp-content/uploads/2014/12/pepsi-logo-300x204.png"
	//for images pointing to the web un-comment following line and change the URL (https not supported)
	//((ImageHtmlEmail) commonsEmail).setDataSourceResolver(new DataSourceUrlResolver(new URL("http://barefoot5k.com")))
	
	//for images pointing to the web comment following line
	((ImageHtmlEmail) commonsEmail).setDataSourceResolver(new DataSourceFileResolver(new File("./templates")))
	
	if (StringUtils.isNotBlank(message.htmlMessage)) 
		((ImageHtmlEmail) commonsEmail).setHtmlMsg(message.htmlMessage)
	
}

for (address in message.tos)
	commonsEmail.addTo(address)

for (address in message.ccs)
	commonsEmail.addCc(address)

for (address in message.bccs)
	commonsEmail.addBcc(address)

if ((!message.sjm) || (!message.sjm.active))
	commonsEmail.send()
else if (message.sjm.active) {	//SimpleJavaMail starts here
	
	commonsEmail.buildMimeMessage()

	def mimeMessage = commonsEmail.getMimeMessage()

	def sjmMailerBuilder = SimpleJavaMailDecorator.getMailerBuilder(mimeMessage)

	// start SimpleJavaMail MailerBuilder configuration
	// see http://www.simplejavamail.org/configuration.html for more details

	if (StringUtils.isNotBlank(message.sjm.customsessionproperties))
		sjmMailerBuilder.withProperties(Utils.loadHeadersPropertiesFromText(message.sjm.customsessionproperties))
	
	if (message.sjm.javaxmaildebug)
		sjmMailerBuilder.withDebugLogging()
	if (message.sjm.transportmodeloggingonly)
		sjmMailerBuilder.withTransportModeLoggingOnly()
	
	if (StringUtils.isNotBlank(message.sjm.proxy.host))
		sjmMailerBuilder.withProxyHost(message.sjm.proxy.host)
	if (message.sjm.proxy.port > 0)
		sjmMailerBuilder.withProxyPort(message.sjm.proxy.port)
	if (StringUtils.isNotBlank(message.sjm.proxy.username))
		sjmMailerBuilder.withProxyUsername(message.sjm.proxy.username)
	if (StringUtils.isNotBlank(message.sjm.proxy.password))
		sjmMailerBuilder.withProxyPassword(message.sjm.proxy.password)
	if (message.sjm.proxy.socks5bridgeport > 0)
		sjmMailerBuilder.withProxyBridgePort(message.sjm.proxy.socks5bridgeport)
	
	// end SimpleJavaMail MailerBuilder configuration

	def sjmEmailBuilder = SimpleJavaMailDecorator.getEmailBuilder(mimeMessage)

	// start SimpleJavaMail EmailBuilder configuration
	// see http://www.simplejavamail.org/features.html for more details

	if (StringUtils.isNotBlank(message.sjm.replytoaddress))
		sjmEmailBuilder.withReplyTo(message.sjm.replytoname, message.sjm.replytoaddress)
	
	if (StringUtils.isNotBlank(message.sjm.bouncetoaddress))
		sjmEmailBuilder.withBounceTo(message.sjm.bouncetoname, message.sjm.bouncetoaddress)
	
	if (StringUtils.isNotBlank(message.sjm.receipttoaddress))
		sjmEmailBuilder.withReturnReceiptTo(message.sjm.receipttoname, message.sjm.receipttoaddress)
	
	if (StringUtils.isNotBlank(message.sjm.dispositionnotificationtoaddress))
		sjmEmailBuilder.withDispositionNotificationTo(message.sjm.dispositionnotificationtoname, message.sjm.dispositionnotificationtoaddress)
	
	if (StringUtils.isNotBlank(message.sjm.customemailheaders))
		sjmEmailBuilder.withHeaders(Utils.loadHeadersPropertiesFromText(message.sjm.customemailheaders))
	
	// end SimpleJavaMail EmailBuilder configuration

	def sjmMailer = sjmMailerBuilder.buildMailer()
	def sjmEmail = sjmEmailBuilder.buildEmail()

	sjmMailer.sendMail(sjmEmail)
	
}