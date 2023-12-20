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
package com.sourcekraft.documentburster.mail;

import javax.mail.internet.MimeMessage;

import org.simplejavamail.api.email.EmailPopulatingBuilder;
import org.simplejavamail.api.mailer.MailerFromSessionBuilder;
import org.simplejavamail.converter.EmailConverter;
import org.simplejavamail.mailer.MailerBuilder;
import org.simplejavamail.mailer.internal.MailerFromSessionBuilderImpl;

public class SimpleJavaMailDecorator {

	public static MailerFromSessionBuilder<?> getMailerBuilder(MimeMessage builtByCommonsEmailMimeMessage) {

		MailerFromSessionBuilderImpl mailerBuilder = MailerBuilder.usingSession(builtByCommonsEmailMimeMessage.getSession());
		
		
		
		return mailerBuilder;

	}

	public static EmailPopulatingBuilder getEmailBuilder(MimeMessage builtByCommonsEmailMimeMessage) throws Exception {

		EmailPopulatingBuilder emailBuilder = EmailConverter.mimeMessageToEmailBuilder(builtByCommonsEmailMimeMessage);
				
	
		
		return emailBuilder;

	}

}