/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.sender.factory;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
//import org.perf4j.aop.Profiled;

import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.sender.EmailSender;
import com.sourcekraft.documentburster.sender.SmsSender;
import com.sourcekraft.documentburster.sender.UploadSender;
import com.sourcekraft.documentburster.sender.WebUploadSender;
import com.sourcekraft.documentburster.settings.model.EmailSettings;
import com.sourcekraft.documentburster.settings.model.SmsSettings;
import com.sourcekraft.documentburster.settings.model.UploadSettings;
import com.sourcekraft.documentburster.settings.model.WebUploadSettings;
import com.sourcekraft.documentburster.sender.AbstractSender;
import com.sourcekraft.documentburster.utils.Utils;

public class SendersFactory {

	private static Logger log = LoggerFactory.getLogger(SendersFactory.class);

	//@Profiled
	public static List<AbstractSender> makeSenders(BurstingContext ctx, boolean execute) throws Exception {

		log.debug("getSenders(BurstingContext context, String testName, boolean execute) : context=[" + ctx
				+ "]; testName=" + ctx.testName + "; execute=" + execute);

		List<AbstractSender> senders = new ArrayList<AbstractSender>();

		EmailSettings emailSettings = ctx.settings.getEmailSettings();

		UploadSettings uploadSettings = ctx.settings.getUploadSettings();
		WebUploadSettings webUploadSettings = ctx.settings.getWebUploadSettings();

		SmsSettings smsSettings = ctx.settings.getSmsSettings();

		// email sender
		boolean isValidEmailMessage = Utils.isValidEmailMessage(ctx, emailSettings);

		// upload senders
		boolean isValidFtpCommand = Utils.isValidFtpCommand(ctx, uploadSettings);
		boolean isValidFileShareCommand = Utils.isValidFileShareCommand(ctx, uploadSettings);
		boolean isValidFtpsCommand = Utils.isValidFtpsCommand(ctx, uploadSettings);
		boolean isValidSftpCommand = Utils.isValidSftpCommand(ctx, uploadSettings);
		boolean isValidHttpCommand = Utils.isValidHttpCommand(ctx, uploadSettings);
		boolean isValidCloudUploadCommand = Utils.isValidCloudUploadCommand(ctx, uploadSettings);

		// web upload senders
		boolean isValidDocumentBursterWebCommand = Utils.isValidDocumentBursterWebCommand(ctx, webUploadSettings);
		boolean isValidMSSharePointCommand = Utils.isValidMSSharePointCommand(ctx, webUploadSettings);
		boolean isValidWordPressCommand = Utils.isValidWordPressCommand(ctx, webUploadSettings);
		boolean isValidDrupalCommand = Utils.isValidDrupalCommand(ctx, webUploadSettings);
		boolean isValidJoomlaCommand = Utils.isValidJoomlaCommand(ctx, webUploadSettings);
		boolean isValidOtherWebCommand = Utils.isValidOtherWebCommand(ctx, webUploadSettings);

		// sms senders
		boolean isValidTwilioMessage = Utils.isValidTwilioMessage(ctx, smsSettings);
		boolean isValidSmsMessage = Utils.isValidSmsMessage(ctx, smsSettings);

		// send files configurations
		boolean isSendFilesEmail = ctx.settings.getSendFiles().email;
		boolean isSendFilesUpload = ctx.settings.getSendFiles().upload;
		boolean isSendFilesWeb = ctx.settings.getSendFiles().web;
		boolean isSendFilesSms = ctx.settings.getSendFiles().sms;

		if (isSendFilesEmail && isValidEmailMessage) {

			AbstractSender sender = new EmailSender(execute, ctx);

			senders.add(sender);

			log.debug("Following email destination was matched for the token : " + ctx.token + ", destination : "
					+ emailSettings);

		}

		if (isSendFilesUpload) {

			if (isValidFtpCommand) {

				AbstractSender sender = new UploadSender(execute, ctx);
				((UploadSender) sender).setType(UploadSender.UploadType.FTP);

				senders.add(sender);

				log.debug("Following FTP upload destination was matched for the token : " + ctx.token
						+ ", destination : " + uploadSettings);
			}

			if (isValidFileShareCommand) {

				AbstractSender sender = new UploadSender(execute, ctx);
				((UploadSender) sender).setType(UploadSender.UploadType.FILESHARE);

				senders.add(sender);

				log.debug("Following File Share upload destination was matched for the token : " + ctx.token
						+ ", destination : " + uploadSettings);
			}

			if (isValidFtpsCommand) {

				AbstractSender sender = new UploadSender(execute, ctx);
				((UploadSender) sender).setType(UploadSender.UploadType.FTPS);

				senders.add(sender);

				log.debug("Following FTPS upload destination was matched for the token : " + ctx.token
						+ ", destination : " + uploadSettings);
			}

			if (isValidSftpCommand) {

				AbstractSender sender = new UploadSender(execute, ctx);
				((UploadSender) sender).setType(UploadSender.UploadType.SFTP);

				senders.add(sender);

				log.debug("Following SFTP upload destination was matched for the token : " + ctx.token
						+ ", destination : " + uploadSettings);
			}

			if (isValidHttpCommand) {

				AbstractSender sender = new UploadSender(execute, ctx);
				((UploadSender) sender).setType(UploadSender.UploadType.HTTP);

				senders.add(sender);

				log.debug("Following HTTP upload destination was matched for the token : " + ctx.token
						+ ", destination : " + uploadSettings);
			}

			if (isValidCloudUploadCommand) {

				AbstractSender sender = new UploadSender(execute, ctx);
				((UploadSender) sender).setType(UploadSender.UploadType.CLOUD);

				senders.add(sender);

				log.debug("Following CLOUD upload destination was matched for the token : " + ctx.token
						+ ", destination : " + uploadSettings);
			}

		}

		if (isSendFilesWeb) {

			if (isValidDocumentBursterWebCommand) {

				AbstractSender sender = new WebUploadSender(execute, ctx);
				((WebUploadSender) sender).setType(WebUploadSender.UploadType.DOCUMENTBURSTERWEB);

				senders.add(sender);

				log.debug("Following DocumentBursterWeb upload destination was matched for the token : " + ctx.token
						+ ", destination : " + webUploadSettings);
			}

			if (isValidMSSharePointCommand) {

				AbstractSender sender = new WebUploadSender(execute, ctx);
				((WebUploadSender) sender).setType(WebUploadSender.UploadType.MSSHAREPOINT);

				senders.add(sender);

				log.debug("Following Microsoft SharePoint upload destination was matched for the token : " + ctx.token
						+ ", destination : " + webUploadSettings);
			}

			if (isValidWordPressCommand) {

				AbstractSender sender = new WebUploadSender(execute, ctx);
				((WebUploadSender) sender).setType(WebUploadSender.UploadType.WORDPRESS);

				senders.add(sender);

				log.debug("Following WordPress upload destination was matched for the token : " + ctx.token
						+ ", destination : " + webUploadSettings);
			}

			if (isValidDrupalCommand) {

				AbstractSender sender = new WebUploadSender(execute, ctx);
				((WebUploadSender) sender).setType(WebUploadSender.UploadType.DRUPAL);

				senders.add(sender);

				log.debug("Following Drupal upload destination was matched for the token : " + ctx.token
						+ ", destination : " + webUploadSettings);
			}

			if (isValidJoomlaCommand) {

				AbstractSender sender = new WebUploadSender(execute, ctx);
				((WebUploadSender) sender).setType(WebUploadSender.UploadType.JOOMLA);

				senders.add(sender);

				log.debug("Following Joomla upload destination was matched for the token : " + ctx.token
						+ ", destination : " + webUploadSettings);
			}

			if (isValidOtherWebCommand) {

				AbstractSender sender = new WebUploadSender(execute, ctx);
				((WebUploadSender) sender).setType(WebUploadSender.UploadType.OTHERWEB);

				senders.add(sender);

				log.debug("Following OtherWeb upload destination was matched for the token : " + ctx.token
						+ ", destination : " + webUploadSettings);
			}

		}

		if (isSendFilesSms) {

			if (isValidTwilioMessage) {

				AbstractSender sender = new SmsSender(execute, ctx);
				((SmsSender) sender).setType(SmsSender.SmsType.TWILIO);

				senders.add(sender);

				log.debug("Following Twilio SMS destination was matched for the token : " + ctx.token
						+ ", destination : " + smsSettings);
			} else if (isValidSmsMessage) {

				AbstractSender sender = new SmsSender(execute, ctx);
				((SmsSender) sender).setType(SmsSender.SmsType.SMS);

				senders.add(sender);

				log.debug("Following SMS destination was matched for the token : " + ctx.token + ", destination : "
						+ smsSettings);
			}

		}

		if (isSendFilesEmail && !isValidEmailMessage)
			throw new IllegalArgumentException("Missing EMAIL configuration for the token : " + ctx.token + "!");

		if (isSendFilesUpload && !isValidFtpCommand && !isValidFileShareCommand && !isValidFtpsCommand
				&& !isValidSftpCommand && !isValidHttpCommand && !isValidCloudUploadCommand)
			throw new IllegalArgumentException("Missing UPLOAD configuration for the token : " + ctx.token + "!");

		if (isSendFilesWeb && !isValidDocumentBursterWebCommand && !isValidMSSharePointCommand
				&& !isValidWordPressCommand && !isValidDrupalCommand && !isValidJoomlaCommand
				&& !isValidOtherWebCommand)
			throw new IllegalArgumentException("Missing Web Upload configuration for the token : " + ctx.token + "!");

		if (isSendFilesSms && !isValidTwilioMessage && !isValidSmsMessage)
			throw new IllegalArgumentException("Missing SMS configuration for the token : " + ctx.token + "!");

		return senders;

	}

}
