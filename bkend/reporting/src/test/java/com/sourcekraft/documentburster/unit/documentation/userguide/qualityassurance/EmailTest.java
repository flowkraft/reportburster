package com.sourcekraft.documentburster.unit.documentation.userguide.qualityassurance;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.mail.EmailException;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class EmailTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";
	private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
			"clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

	@Test
	public void allTokensDistributeReportsTrue() throws Exception {
		allTokens(true);
	}

	@Test
	public void allTokensDistributeReportsFalse() throws Exception {
		allTokens(false);
	}

	private void allTokens(final boolean distributeReports) throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailTest-allTokens-distributeReports-" + distributeReports) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setSendFilesEmail(distributeReports);

				ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, true, StringUtils.EMPTY, -1);

		// assert no quality-assurance files are generated; qa files are generated only
		// for email/upload
		// since for alltokens distributeReports=false no reports are emailed then no QA
		// files should be generated
		if (distributeReports)
			assertEquals(3, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		else
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		// assert individual quality-assurance files
		for (String token : tokens) {

			assertEquals(distributeReports,
					new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt").exists());

		}

		// assert 3 output files are generated
		assertEquals(3, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		PdfTestUtils.assertDefaultResults(burster, tokens);

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);

		if (distributeReports)
			assertEquals(3, burster.getCtx().numberOfDistributedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	}

	@Test
	public void listOfTokensDistributeReportsTrue() throws Exception {
		listOfTokens(true);
	}

	@Test
	public void listOfTokensDistributeReportsFalse() throws Exception {
		listOfTokens(false);
	}

	private void listOfTokens(final boolean distributeReports) throws Exception {
		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailTest-listOfTokens-distributeReports-" + distributeReports) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setSendFilesEmail(distributeReports);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_qualityassurance.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};

		};

		String testTokens = "clyde.grew@northridgehealth.org,alfreda.waldback@northridgehealth.org";
		burster.burst(PAYSLIPS_REPORT_PATH, false, testTokens, -1);

		// assert correct number (2) email QA files if distribute
		// corresponding quality-assurance files
		// are generated
		if (distributeReports)
			assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		else
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		List<String> listOfTestTokens = Arrays.asList(testTokens.split(","));
		// assert individual quality-assurance files
		for (String token : listOfTestTokens) {

			assertEquals(distributeReports,
					new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt").exists());

		}

		// assert only 2 output files are generated
		assertEquals(2, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		PdfTestUtils.assertDefaultResults(burster, listOfTestTokens);

		assertEquals(2, burster.getCtx().numberOfExtractedFiles);

		if (distributeReports)
			assertEquals(2, burster.getCtx().numberOfDistributedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	}

	@Test
	public void randomTokensDistributeReportsTrue() throws Exception {
		randomTokens(true);
	}

	@Test
	public void randomTokensDistributeReportsFalse() throws Exception {
		randomTokens(false);
	}

	private void randomTokens(final boolean distributeReports) throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailTest-randomTokens-distributeReports-" + distributeReports) {

			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setSendFilesEmail(distributeReports);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_qualityassurance.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, 2);

		// assert correct number (2) email QA files if distribute
		// corresponding quality-assurance files
		// are generated
		if (distributeReports)
			assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		else
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		// assert only 2 output files are generated
		assertEquals(2, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		Iterator<File> it = FileUtils.iterateFiles(new File(burster.getCtx().outputFolder), new String[] { "pdf" },
				false);

		while (it.hasNext()) {

			File currentFile = (File) it.next();
			String fileName = currentFile.getName();
			String token = FilenameUtils.getBaseName(fileName);

			DocumentTester tester = new DocumentTester(currentFile.getCanonicalPath());

			// assert number of pages
			tester.assertPageCountEquals(1);

			// assert content
			tester.assertContentContainsTextOnPage(burster.getCtx().settings.getStartBurstTokenDelimiter() + token
					+ burster.getCtx().settings.getEndBurstTokenDelimiter(), 1, TextSearchType.CONTAINS);

			// assert PDF keywords
			tester.assertKeywordsEquals(token);

			tester.close();

		}

		assertEquals(2, burster.getCtx().numberOfExtractedFiles);

		if (distributeReports)
			assertEquals(2, burster.getCtx().numberOfDistributedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	};

	public static void assertEmailMessage(EmailMessage message) throws Exception {

		com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest
				.assertCommonEmailStuff(message);

		String filePath = message.attachments.get(0);
		String attachmentFileName = FilenameUtils.getName(filePath);

		// assert testto, to, cc, bcc
		assertTrue(1 == message.tos.size());

		if (!attachmentFileName.endsWith(".docx"))
			assertEquals(message.token, message.tos.get(0));

		assertTrue(0 == message.ccs.size() && 0 == message.bccs.size());

		// assert the correct attachment is there
		for (String path : message.attachments) {
			File attachment = new File(path);
			if (!attachment.exists())
				throw new EmailException("Attachment was not found '" + path + "'");
		}

		String attachmentFileNameExt = FilenameUtils.getExtension(attachmentFileName);

		assertEquals(message.token + "." + attachmentFileNameExt, attachmentFileName);
	}

};