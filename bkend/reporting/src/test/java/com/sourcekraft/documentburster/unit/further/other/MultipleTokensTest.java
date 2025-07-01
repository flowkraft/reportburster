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
package com.sourcekraft.documentburster.unit.further.other;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.common.settings.model.Attachment;
import com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest;

public class MultipleTokensTest {

	private static final String MULTIPLE_TOKENS_PATH = "src/test/resources/input/unit/pdf/multiple-burst-tokens.pdf";
	private static final String MULTIPLE_TOKENS_DIRECTORS_MANAGERS_PATH = "src/test/resources/input/unit/pdf/multiple-burst-tokens-directors-managers.pdf";

	public static final List<String> MULTIPLE_TOKENS_TOKENS = Arrays.asList("page1@page1.com", "page2@page2.com",
			"page3@page3.com", "page4@page4.com", "page5@page5.com", "page12@page12.com", "page345@page345.com");

	public static final List<String> MULTIPLE_TOKENS_DIRECTORS_MANAGERS_TOKENS = Arrays.asList("director_id 1",
			"director_id 2", "director_id 3", "manager_id 1", "manager_id 2", "manager_id 3", "manager_id 4",
			"manager_id 5", "manager_id 6", "manager_id 7", "manager_id 8", "manager_id 9", "manager_id 10");

	@Test
	public final void burstMultipleTokensDirectorsManagers() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"MultipleTokensTest-burstMultipleTokensDirectorsManagers");

		burster.burst(MULTIPLE_TOKENS_DIRECTORS_MANAGERS_PATH, false, StringUtils.EMPTY, -1);

		String outputFolder = burster.getCtx().outputFolder + "/";

		assertEquals(13, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		for (String token : MULTIPLE_TOKENS_DIRECTORS_MANAGERS_TOKENS) {

			String path = outputFolder + token + ".pdf";

			File outputReport = new File(path);

			assertTrue(outputReport.exists());

			DocumentTester tester = new DocumentTester(path);

			// assert number of pages
			if (!token.equals("director_id 1") && !token.equals("director_id 2") && !token.equals("director_id 3"))
				tester.assertPageCountEquals(1);
			else if (token.equals("director_id 1"))
				tester.assertPageCountEquals(4);
			else if (token.equals("director_id 1"))
				tester.assertPageCountEquals(3);
			else if (token.equals("director_id 3"))
				tester.assertPageCountEquals(6);

			// assert content
			tester.assertContentContainsTextOnPage("{" + token + "}", 1, TextSearchType.CONTAINS);

			// assert PDF keywords
			tester.assertKeywordsEquals(token);

			tester.close();
		}

	};

	@Test
	public final void burstMultipleTokens() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"MultipleTokensTest-burstMultipleTokens") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.scripts.email = "multiple_tokens_email_test.groovy";

			};
		};

		burster.burst(MULTIPLE_TOKENS_PATH, false, StringUtils.EMPTY, -1);

		String outputFolder = burster.getCtx().outputFolder + "/";

		assertEquals(7, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		_assertOutputReports(outputFolder);
	};

	@Test
	public final void burst2RandomTokens() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"MultipleTokensTest-burst2RandomTokens") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.scripts.email = "multiple_tokens_email_test.groovy";

				ctx.settings.getAttachments().clear();

				Attachment item = new Attachment();

				item.order = 0;
				item.path = "$extracted_file_path$";

				ctx.settings.addAttachment(item);

			};
		};

		burster.burst(MULTIPLE_TOKENS_PATH, false, StringUtils.EMPTY, 2);

		String outputFolder = burster.getCtx().outputFolder + "/";

		assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		_assertOutputReports(outputFolder);

	};

	public static void assertEmailMessage(EmailMessage message) throws Exception {

		EmailTest.assertCommonEmailStuff(message);

		assertTrue(1 == message.tos.size());

		assertEquals(message.token, message.tos.get(0));

		assertEquals("Subject " + message.token, message.subject);
		assertEquals("Message " + message.token, message.textMessage);

		// assert attachment
		assertTrue(1 == message.attachments.size());

		String path = message.attachments.get(0);
		assertTrue(path.contains(message.token));

	}

	private void _assertOutputReports(String outputFolder) throws Exception {
		for (String token : MULTIPLE_TOKENS_TOKENS) {

			String path = outputFolder + token + ".pdf";

			File outputReport = new File(path);
			if (outputReport.exists()) {
				DocumentTester tester = new DocumentTester(path);

				// assert number of pages
				if (!token.equals("page12@page12.com") && !token.equals("page345@page345.com"))
					tester.assertPageCountEquals(1);
				else if (token.equals("page12@page12.com"))
					tester.assertPageCountEquals(2);
				else if (token.equals("page345@page345.com"))
					tester.assertPageCountEquals(3);

				// assert content
				tester.assertContentContainsTextOnPage("{" + token + "}", 1, TextSearchType.CONTAINS);

				// assert PDF keywords
				tester.assertKeywordsEquals(token);

				tester.close();
			}
		}

	}
}
