package com.sourcekraft.documentburster.sender.factory;

import java.util.Objects;

import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.settings.EmailConnection;
import com.sourcekraft.documentburster.settings.Settings;
import com.sourcekraft.documentburster.settings.model.EmailSettings;
import com.sourcekraft.documentburster.utils.Utils;

public class EmailMessageFactory {

	public EmailMessage createEmailMessage(BurstingContext ctx, boolean useTestServer) throws Exception {

		EmailMessage message = new EmailMessage();

		message.token = ctx.token;
		message.ctx = ctx;

		// setEmailServerSettings(message, ctx, useTestServer);

		processAttachments(message, ctx);

		EmailSettings messageSettings = ctx.settings.getEmailSettings();

		setEmailSubject(message, messageSettings.subject, ctx);
		setEmailMessage(message, messageSettings.text, messageSettings.html, ctx);

		addEmailAddresses("to", messageSettings.to, (EmailMessage) message, ctx);
		addEmailAddresses("cc", messageSettings.cc, (EmailMessage) message, ctx);
		addEmailAddresses("bcc", messageSettings.bcc, (EmailMessage) message, ctx);

		setEmailServerSettings(message, ctx, useTestServer);
		setSimpleJavaMailSettings(message, ctx);

		return message;

	}

	private void setSimpleJavaMailSettings(EmailMessage msg, BurstingContext ctx) throws Exception {

		msg.sjm = ctx.settings.getSimpleJavaMail();

	}

	private void setEmailServerSettings(EmailMessage msg, BurstingContext ctx, boolean useTestServer) throws Exception {

		boolean authentication = false;

		if (useTestServer) {

			String authuser = Utils.getStringFromTemplate(ctx.settings.getTestEmailServerUserId(), ctx.variables,
					ctx.token);

			if (StringUtils.isNotEmpty(authuser))
				authentication = true;

			String authpwd = StringUtils.EMPTY;

			if (StringUtils.isNotEmpty(ctx.settings.getTestEmailServerUserPassword())) {
				// if (ctx.settings.getTestEmailServerUserPassword().indexOf("$") == -1)
				authpwd = Utils.getStringFromTemplate(ctx.settings.getTestEmailServerUserPassword(), ctx.variables,
						ctx.token);
				// else
				// authpwd = ctx.settings.getTestEmailServerUserPassword();
			}

			if (StringUtils.isNotEmpty(authpwd))
				authentication = true;

			msg.isAuthentication = authentication;

			if (authentication) {
				msg.authuser = authuser;
				msg.authpwd = authpwd;
			}

			msg.hostName = Utils.getStringFromTemplate(ctx.settings.getTestEmailServerHost(), ctx.variables, ctx.token);
			msg.smtpPort = Integer.parseInt((Utils.getStringFromTemplate(
					Integer.valueOf(ctx.settings.getTestEmailServerPort()).toString(), ctx.variables, ctx.token)));

			msg.fromAddress = Utils.getStringFromTemplate(ctx.settings.getTestEmailServerFrom(), ctx.variables,
					ctx.token);
			msg.fromName = Utils.getStringFromTemplate(ctx.settings.getTestEmailServerName(), ctx.variables, ctx.token);

			// Very Important, Don't use email.setAuthentication()
			msg.isTls = ctx.settings.isTestEmailServerUseTLS();
			msg.isSsl = ctx.settings.isTestEmailServerUseSSL();

		} else {

			if (!ctx.settings.getEmailServerUseConn()) {

				String authuser = Utils.getStringFromTemplate(ctx.settings.getEmailServerUserId(), ctx.variables,
						ctx.token);

				if (StringUtils.isNotEmpty(authuser))
					authentication = true;

				String authpwd = StringUtils.EMPTY;

				if (StringUtils.isNotEmpty(ctx.settings.getEmailServerUserPassword())) {
					// if (ctx.settings.getEmailServerUserPassword().indexOf("$") == -1)
					authpwd = Utils.getStringFromTemplate(ctx.settings.getEmailServerUserPassword(), ctx.variables,
							ctx.token);
					// else
					// authpwd = ctx.settings.getEmailServerUserPassword();
				}

				if (StringUtils.isNotEmpty(authpwd))
					authentication = true;

				msg.isAuthentication = authentication;

				if (authentication) {
					msg.authuser = authuser;
					msg.authpwd = authpwd;
				}

				msg.hostName = Utils.getStringFromTemplate(ctx.settings.getEmailServerHost(), ctx.variables, ctx.token);
				msg.smtpPort = Integer.parseInt(Utils.getStringFromTemplate(
						Integer.valueOf(ctx.settings.getEmailServerPort()).toString(), ctx.variables, ctx.token));

				msg.fromAddress = Utils.getStringFromTemplate(ctx.settings.getEmailServerFrom(), ctx.variables,
						ctx.token);
				msg.fromName = Utils.getStringFromTemplate(ctx.settings.getEmailServerName(), ctx.variables, ctx.token);

				// Very Important, Don't use email.setAuthentication()
				msg.isTls = ctx.settings.isEmailServerUseTLS();
				msg.isSsl = ctx.settings.isEmailServerUseSSL();
			} else { // ctx.settings.getEmailServerUseConn()

				String connCode = ctx.settings.getEmailServerConnCode();

				if (Objects.isNull(ctx.emailConnection)) {
					EmailConnection emailConnection = new EmailConnection();
					emailConnection.loadDetailsUsingCode(connCode, ctx.settings.getConfigurationFilePath());

					ctx.emailConnection = emailConnection;
				}

				String authuser = Utils.getStringFromTemplate(
						ctx.emailConnection.getDetails().connection.emailserver.userid, ctx.variables, ctx.token);

				if (StringUtils.isNotEmpty(authuser))
					authentication = true;

				String authpwd = StringUtils.EMPTY;

				if (StringUtils.isNotEmpty(ctx.emailConnection.getDetails().connection.emailserver.userpassword)) {
					// if
					// (emailConnection.getDetails().connection.emailserver.userpassword.indexOf("$")
					// == -1)
					authpwd = Utils.getStringFromTemplate(
							ctx.emailConnection.getDetails().connection.emailserver.userpassword, ctx.variables,
							ctx.token);
					// else
					// authpwd = emailConnection.getDetails().connection.emailserver.userpassword;
				}

				if (StringUtils.isNotEmpty(authpwd))
					authentication = true;

				msg.isAuthentication = authentication;

				if (authentication) {
					msg.authuser = authuser;
					msg.authpwd = authpwd;
				}

				msg.hostName = Utils.getStringFromTemplate(ctx.emailConnection.getDetails().connection.emailserver.host,
						ctx.variables, ctx.token);
				msg.smtpPort = Integer.parseInt(Utils.getStringFromTemplate(
						Integer.valueOf(ctx.emailConnection.getDetails().connection.emailserver.port).toString(),
						ctx.variables, ctx.token));

				msg.fromAddress = Utils.getStringFromTemplate(
						ctx.emailConnection.getDetails().connection.emailserver.fromaddress, ctx.variables, ctx.token);
				msg.fromName = Utils.getStringFromTemplate(ctx.emailConnection.getDetails().connection.emailserver.name,
						ctx.variables, ctx.token);

				// Very Important, Don't use email.setAuthentication()
				msg.isTls = ctx.emailConnection.getDetails().connection.emailserver.usetls;
				msg.isSsl = ctx.emailConnection.getDetails().connection.emailserver.usessl;

			}
		}

	}

	private void processAttachments(EmailMessage msg, BurstingContext ctx) {

		if (ctx.settings.isArchiveAttachments()) {
			msg.attachments.add(ctx.archiveFilePath);
		} else
			for (String path : ctx.attachments) {
				
				
				msg.attachments.add(path);
			}

	}

	private void setEmailSubject(EmailMessage msg, String subject, BurstingContext ctx) throws Exception {

		msg.subject = Utils.getStringFromTemplate(subject, ctx.variables, ctx.token);

	}

	private void setEmailMessage(EmailMessage msg, String text, String html, BurstingContext ctx) throws Exception {

		msg.textMessage = Utils.getStringFromTemplate(text, ctx.variables, ctx.token);

		msg.isHtmlEmail = ctx.settings.isHtmlEmail();
		msg.htmlMessage = Utils.getStringFromTemplate(html, ctx.variables, ctx.token);

	}

	private void addEmailAddresses(String which, String addressesTemplates, EmailMessage msg, BurstingContext ctx)
			throws Exception {

		String addresses = Utils.getStringFromTemplate(addressesTemplates, ctx.variables, ctx.token);

		if (StringUtils.isNotEmpty(addresses)) {

			String separator = ";";

			if (addresses.contains(","))
				separator = ",";

			String[] ads = addresses.split(separator);

			for (String address : ads) {

				if (which.equals("to"))
					msg.tos.add(address);
				else if (which.equals("cc"))
					msg.ccs.add(address);
				else if (which.equals("bcc"))
					msg.bccs.add(address);

			}
		}

	}

	public EmailMessage createCheckEmailMessageFromSettings(Settings settings) throws Exception {

		EmailMessage msg = new EmailMessage();

		if (!settings.getEmailServerUseConn()) {

			boolean authentication = false;

			String authuser = settings.getEmailServerUserId();
			if (StringUtils.isNotEmpty(authuser))
				authentication = true;

			String authpwd = settings.getEmailServerUserPassword();
			if (StringUtils.isNotEmpty(authpwd))
				authentication = true;

			msg.isAuthentication = authentication;

			if (authentication) {
				msg.authuser = authuser;
				msg.authpwd = authpwd;
			}

			msg.hostName = settings.getEmailServerHost();
			msg.smtpPort = settings.getEmailServerPort();

			msg.fromAddress = settings.getEmailServerFrom();
			msg.fromName = settings.getEmailServerName();

			// Very Important, Don't use email.setAuthentication()
			msg.isTls = settings.isEmailServerUseTLS();
			msg.isSsl = settings.isEmailServerUseSSL();

			msg.subject = "Great. You Got It!";

			msg.textMessage = "It worked. You are now ready to start distributing your emails. As a best practice always test that the generated emails are as you intend to be. You can do that using the provided Email Tester (Quality Assurance) tool.";

			msg.tos.add(msg.fromAddress);

		} else {

			String connCode = settings.getEmailServerConnCode();
			EmailConnection emailConnection = new EmailConnection();
			emailConnection.loadDetailsUsingCode(connCode, settings.getConfigurationFilePath());
			msg = (new EmailMessageFactory()).createCheckEmailMessageFromConnection(emailConnection);
		}

		msg.sjm = settings.getSimpleJavaMail();

		return msg;

	}

	public EmailMessage createCheckEmailMessageFromConnection(EmailConnection emailConnection) {

		EmailMessage msg = new EmailMessage();

		boolean authentication = false;

		String authuser = emailConnection.getDetails().connection.emailserver.userid;
		if (StringUtils.isNotEmpty(authuser))
			authentication = true;

		String authpwd = emailConnection.getDetails().connection.emailserver.userpassword;
		if (StringUtils.isNotEmpty(authpwd))
			authentication = true;

		msg.isAuthentication = authentication;

		if (authentication) {
			msg.authuser = authuser;
			msg.authpwd = authpwd;
		}

		msg.hostName = emailConnection.getDetails().connection.emailserver.host;
		msg.smtpPort = Integer.parseInt(emailConnection.getDetails().connection.emailserver.port);

		msg.fromAddress = emailConnection.getDetails().connection.emailserver.fromaddress;
		msg.fromName = emailConnection.getDetails().connection.emailserver.name;

		// Very Important, Don't use email.setAuthentication()
		msg.isTls = emailConnection.getDetails().connection.emailserver.usetls;
		msg.isSsl = emailConnection.getDetails().connection.emailserver.usessl;

		msg.subject = "Great. You Got It!";

		msg.textMessage = "It worked. You are now ready to start distributing your emails. As a best practice always test that the generated emails are as you intend to be. You can do that using the provided Email Tester (Quality Assurance) tool.";

		msg.tos.add(msg.fromAddress);

		return msg;

	}

}
