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

import com.sourcekraft.documentburster.common.settings.Settings;

public class SettingsTest {

	@Test
	public void defaultSettings() throws Exception {

		Settings settings = new Settings("src/main/external-resources/template/config/burst/settings.xml");

		settings.loadSettings();

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
		assertEquals("25", settings.getEmailServerPort());
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

		assertEquals(Integer.valueOf(1), Integer.valueOf(settings.getAttachments().size()));

		assertEquals("${extracted_file_path}", settings.getAttachments().get(0).path);
		assertEquals(Integer.valueOf(0), settings.getAttachments().get(0).order);

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
		assertEquals(Integer.valueOf(1080), Integer.valueOf(settings.getSimpleJavaMail().proxy.port));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().proxy.username));
		assertTrue(StringUtils.isBlank(settings.getSimpleJavaMail().proxy.password));
		assertEquals(Integer.valueOf(1081), Integer.valueOf(settings.getSimpleJavaMail().proxy.socks5bridgeport));

		assertEquals("en", settings.getLanguage());
        assertEquals("US", settings.getCountry());

        // FreeMarker settings from settings.xml
        assertNotNull("FreeMarker settings must be present", settings.getFreeMarkerSettings());
        assertEquals("MM/dd/yyyy", settings.getFreeMarkerSettings().dateformat);
        assertEquals("HH:mm:ss", settings.getFreeMarkerSettings().timeformat);
        assertEquals("MM/dd/yyyy HH:mm:ss", settings.getFreeMarkerSettings().datetimeformat);
        assertEquals("0.######", settings.getFreeMarkerSettings().numberformat);

		assertEquals(Integer.valueOf(20), Integer.valueOf(settings.getNumberOfUserVariables()));

		assertEquals(0.0, settings.getDelayEachDistributionBy(), 0.0);

		assertFalse(settings.isReuseTokensWhenNotFound());
		assertTrue(settings.isFailJobIfAnyDistributionFails());

		assertEquals(Integer.valueOf(3), Integer.valueOf(settings.getRetryPolicy().delay));
		assertEquals(Integer.valueOf(30), Integer.valueOf(settings.getRetryPolicy().maxdelay));
		assertEquals(Integer.valueOf(3), Integer.valueOf(settings.getRetryPolicy().maxretries));

		assertEquals("{", settings.getStartBurstTokenDelimiter());
		assertEquals("}", settings.getEndBurstTokenDelimiter());

		assertFalse(settings.isSplit2ndTime());
		assertEquals("[", settings.getStartBurstTokenDelimiter2nd());
		assertEquals("]", settings.getEndBurstTokenDelimiter2nd());

	}

	@Test
	public void noAttachments() throws Exception {

		Settings settings = new Settings("src/test/resources/config/no-attachments.xml");

		settings.loadSettings();

		assertEquals(Integer.valueOf(0), Integer.valueOf(settings.getAttachments().size()));

		assertFalse(settings.isArchiveAttachments());
		assertEquals("reports-${burst_token}.zip", settings.getArchiveFileName());

	}

	@Test
	public void twoAttachments() throws Exception {

		Settings settings = new Settings("src/test/resources/config/two-attachments.xml");

		settings.loadSettings();

		assertEquals(Integer.valueOf(2), Integer.valueOf(settings.getAttachments().size()));

		assertEquals("src/main/external-resources/template/samples/burst/Payslips-Distinct-Sheets.xls",
				settings.getAttachments().get(0).path);
		assertEquals(Integer.valueOf(0), settings.getAttachments().get(0).order);

		assertEquals("$extracted_file_path$", settings.getAttachments().get(1).path);
		assertEquals(Integer.valueOf(1), settings.getAttachments().get(1).order);

		assertFalse(settings.isArchiveAttachments());
		assertEquals("reports-${burst_token}.zip", settings.getArchiveFileName());

	}

}
