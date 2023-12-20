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
package com.sourcekraft.documentburster.unit.further.settings;

import static org.junit.Assert.*;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster.settings.Settings;

public class SettingsTest {

	@Test
	public void defaultSettings() throws Exception {

		Settings settings = new Settings();

		settings.loadSettings("src/main/external-resources/template/config/burst/settings.xml");

		// assertEquals("5.5.6", settings.getVersion());

		assertEquals("${burst_token}.${output_type_extension}", settings.getBurstFileName().trim());

		assertEquals("merged.pdf", settings.getMergeFileName());

		assertEquals("output/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}",
				settings.getOutputFolder().trim());
		assertEquals("backup/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}",
				settings.getBackupFolder().trim());
		assertEquals("quarantine/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}",
				settings.getQuarantineFolder().trim());

		assertEquals("logs/archives/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}",
				settings.getLogsArchivesFolder().trim());
		assertEquals("_stats-${stats_info}.log", settings.getStatsFileName().trim());

		assertTrue(settings.getCapabilities().reportdistribution);
		assertFalse(settings.getCapabilities().reportgenerationmailmerge);

		assertTrue(settings.isQuarantineFiles());

		assertFalse(settings.getSendFiles().email);
		assertFalse(settings.getSendFiles().upload);
		assertFalse(settings.getSendFiles().web);
		assertFalse(settings.getSendFiles().sms);

		assertFalse(settings.isDeleteFiles());

		assertTrue(settings.isHtmlEmail());
		assertFalse(settings.isHtmlEmailEditCode());

		// PDF parsing options
		assertFalse(settings.isSortByPosition());
		assertFalse(settings.isSuppressDuplicateOverlappingText());
		assertTrue(settings.isShouldSeparateByBeads());

		assertTrue(settings.getAverageCharTolerance() <= 0);
		assertTrue(settings.getSpacingTolerance() <= 0);
		// END PDF parsing options

		assertEquals("Email Server Host", settings.getEmailServerHost());
		assertEquals(25, settings.getEmailServerPort());
		assertEquals("From Email User ID", settings.getEmailServerUserId());
		assertEquals("From Email Password", settings.getEmailServerUserPassword());

		assertFalse(settings.isEmailServerUseSSL());
		assertFalse(settings.isEmailServerUseTLS());

		assertEquals("from@emailaddress.com", settings.getEmailServerFrom());
		assertEquals("From Name", settings.getEmailServerName());

		assertEquals("${burst_token}", settings.getEmailSettings().to);
		assertTrue(StringUtils.isBlank(settings.getEmailSettings().cc));
		assertTrue(StringUtils.isBlank(settings.getEmailSettings().bcc));
		assertTrue(StringUtils.isBlank(settings.getEmailSettings().subject));
		assertTrue(StringUtils.isBlank(settings.getEmailSettings().text));
		assertTrue(StringUtils.isBlank(settings.getEmailSettings().html));

		// upload
		assertTrue(StringUtils.isBlank(settings.getUploadSettings().ftpcommand));
		assertTrue(StringUtils.isBlank(settings.getUploadSettings().filesharecommand));
		assertTrue(StringUtils.isBlank(settings.getUploadSettings().ftpscommand));
		assertTrue(StringUtils.isBlank(settings.getUploadSettings().sftpcommand));
		assertTrue(StringUtils.isBlank(settings.getUploadSettings().httpcommand));
		assertTrue(StringUtils.isBlank(settings.getUploadSettings().cloudcommand));

		assertTrue(StringUtils.isBlank(settings.getWebUploadSettings().documentbursterwebcommand));
		assertTrue(StringUtils.isBlank(settings.getWebUploadSettings().mssharepointcommand));
		assertTrue(StringUtils.isBlank(settings.getWebUploadSettings().wordpresscommand));
		assertTrue(StringUtils.isBlank(settings.getWebUploadSettings().drupalcommand));
		assertTrue(StringUtils.isBlank(settings.getWebUploadSettings().joomlacommand));
		assertTrue(StringUtils.isBlank(settings.getWebUploadSettings().otherwebcommand));

		assertEquals(1, settings.getAttachments().size());

		assertEquals("${extracted_file_path}", settings.getAttachments().get(0).path);
		assertEquals(0, settings.getAttachments().get(0).order);

		assertFalse(settings.isArchiveAttachments());
		assertEquals("reports-${burst_token}.zip", settings.getArchiveFileName());

		// emailrfc2822validator
		assertTrue(settings.getEmailRfc2822Validator().allowquotedidentifiers);
		assertTrue(settings.getEmailRfc2822Validator().allowparensinlocalpart);
		assertFalse(settings.getEmailRfc2822Validator().allowdomainliterals);
		assertFalse(settings.getEmailRfc2822Validator().allowdotinatext);
		assertFalse(settings.getEmailRfc2822Validator().allowsquarebracketsinatext);

		assertTrue(StringUtils.isBlank(settings.getEmailRfc2822Validator().skipvalidationfor));

		// simple java mail
		assertFalse(settings.getSimpleJavaMail().active);

		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().replytoaddress));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().replytoname));

		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().bouncetoaddress));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().bouncetoname));

		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().receipttoaddress));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().receipttoname));

		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().dispositionnotificationtoaddress));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().dispositionnotificationtoname));

		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().customemailheaders));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().customsessionproperties));

		assertFalse(settings.getSimpleJavaMail().javaxmaildebug);
		assertFalse(settings.getSimpleJavaMail().transportmodeloggingonly);

		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().proxy.host));
		assertEquals(1080, settings.getSimpleJavaMail().proxy.port);
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().proxy.username));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().proxy.password));
		assertEquals(1081, settings.getSimpleJavaMail().proxy.socks5bridgeport);

		assertTrue(StringUtils.isBlank(settings.getLanguage()));
		assertTrue(StringUtils.isBlank(settings.getCountry()));

		assertEquals(20, settings.getNumberOfUserVariables());

		assertEquals(0, settings.getDelayEachDistributionBy(), 0);

		assertFalse(settings.isReuseTokensWhenNotFound());
		assertTrue(settings.isFailJobIfAnyDistributionFails());

		assertEquals(3, settings.getRetryPolicy().delay);
		assertEquals(30, settings.getRetryPolicy().maxdelay);
		assertEquals(3, settings.getRetryPolicy().maxretries);

		assertEquals("{", settings.getStartBurstTokenDelimiter());
		assertEquals("}", settings.getEndBurstTokenDelimiter());

		assertFalse(settings.isSplit2ndTime());
		assertEquals("[", settings.getStartBurstTokenDelimiter2nd());
		assertEquals("]", settings.getEndBurstTokenDelimiter2nd());

	}

	@Test
	public void noAttachments() throws Exception {

		Settings settings = new Settings();

		settings.loadSettings("src/test/resources/config/no-attachments.xml");

		assertEquals(0, settings.getAttachments().size());

		assertFalse(settings.isArchiveAttachments());
		assertEquals("reports-${burst_token}.zip", settings.getArchiveFileName());

	}

	@Test
	public void twoAttachments() throws Exception {

		Settings settings = new Settings();

		settings.loadSettings("src/test/resources/config/two-attachments.xml");

		assertEquals(2, settings.getAttachments().size());

		assertEquals("src/main/external-resources/template/samples/burst/Payslips-Distinct-Sheets.xls",
				settings.getAttachments().get(0).path);
		assertEquals(0, settings.getAttachments().get(0).order);

		assertEquals("$extracted_file_path$", settings.getAttachments().get(1).path);
		assertEquals(1, settings.getAttachments().get(1).order);

		assertFalse(settings.isArchiveAttachments());
		assertEquals("reports-${burst_token}.zip", settings.getArchiveFileName());

	}

}
