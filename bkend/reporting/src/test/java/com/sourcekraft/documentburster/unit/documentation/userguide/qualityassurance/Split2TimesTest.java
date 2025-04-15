package com.sourcekraft.documentburster.unit.documentation.userguide.qualityassurance;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FilenameFilter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.mail.EmailException;
import org.junit.Test;
import org.zeroturnaround.zip.ZipUtil;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.common.settings.model.Attachment;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.utils.Utils;
import com.sourcekraft.documentburster.variables.Variables;

public class Split2TimesTest {

	private static final String SPLIT2TIMES_DOCUMENT_PATH = "src/main/external-resources/template/samples/burst/Split2Times.pdf";
	public static final List<String> SPLIT2TIMES_TOKENS = Arrays.asList("accounting@alphainsurance.biz",
			"accounting@betainsurance.biz", "accounting@gammahealth.biz");

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 0000
		_allTokens(false, false, false, false);

	}

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 0001
		_allTokens(false, false, false, true);

	}

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 0010
		_allTokens(false, false, true, false);

	}

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 0011
		_allTokens(false, false, true, true);

	}

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 0100
		_allTokens(false, true, false, false);
	}

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 0101
		_allTokens(false, true, false, true);
	}

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 0110
		_allTokens(false, true, true, false);
	}

	@Test
	public void allTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 0111
		_allTokens(false, true, true, true);
	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 1000
		_allTokens(true, false, false, false);

	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 1001
		_allTokens(true, false, false, true);

	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 1010
		_allTokens(true, false, true, false);

	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 1011
		_allTokens(true, false, true, true);

	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 1100
		_allTokens(true, true, false, false);

	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 1101
		_allTokens(true, true, false, true);

	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 1110
		_allTokens(true, true, true, false);

	}

	@Test
	public void allTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 1111
		_allTokens(true, true, true, true);

	}

	/*-------------------------------------------------------------*/

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 0000
		_listOfTokens(false, false, false, false);

	}

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 0001
		_listOfTokens(false, false, false, true);

	}

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 0010
		_listOfTokens(false, false, true, false);

	}

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 0011
		_listOfTokens(false, false, true, true);

	}

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 0100
		_listOfTokens(false, true, false, false);
	}

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 0101
		_listOfTokens(false, true, false, true);
	}

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 0110
		_listOfTokens(false, true, true, false);
	
	}

	@Test
	public void listOfTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 0111
		_listOfTokens(false, true, true, true);
	
	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 1000
		_listOfTokens(true, false, false, false);

	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 1001
		_listOfTokens(true, false, false, true);

	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 1010
		_listOfTokens(true, false, true, false);

	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 1011
		_listOfTokens(true, false, true, true);

	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 1100
		_listOfTokens(true, true, false, false);

	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 1101
		_listOfTokens(true, true, false, true);

	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 1110
		_listOfTokens(true, true, true, false);

	}

	@Test
	public void listOfTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 1111
		_listOfTokens(true, true, true, true);

	}

	/*----------------------------------------------------------------------*/

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 0000
		_randomTokens(false, false, false, false);

	}

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 0001
		_randomTokens(false, false, false, true);

	}

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 0010
		_randomTokens(false, false, true, false);

	}

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 0011
		_randomTokens(false, false, true, true);

	}

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 0100
		_randomTokens(false, true, false, false);
	}

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 0101
		_randomTokens(false, true, false, true);
	}

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 0110
		_randomTokens(false, true, true, false);
	}

	@Test
	public void randomTokensSplit2ndTimeFalseReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 0111
		_randomTokens(false, true, true, true);
	}

	@Test
	public void randomSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 1000
		_randomTokens(true, false, false, false);

	}

	@Test
	public void randomTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 1001
		_randomTokens(true, false, false, true);

	}

	@Test
	public void randomTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 1010
		_randomTokens(true, false, true, false);

	}

	@Test
	public void randomTokensSplit2ndTimeTrueReuseTokensWhenNotFoundFalseDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 1011
		_randomTokens(true, false, true, true);

	}

	@Test
	public void randomTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsFalse()
			throws Exception {

		// 1100
		_randomTokens(true, true, false, false);

	}

	@Test
	public void randomTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsFalseArchiveAttachmentsTrue()
			throws Exception {

		// 1101
		_randomTokens(true, true, false, true);

	}

	@Test
	public void randomTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsFalse()
			throws Exception {

		// 1110
		_randomTokens(true, true, true, false);

	}

	@Test
	public void randomTokensSplit2ndTimeTrueReuseTokensWhenNotFoundTrueDistributeReportsTrueArchiveAttachmentsTrue()
			throws Exception {

		// 1111
		_randomTokens(true, true, true, true);

	}

	private void _allTokens(final boolean split2ndTime, final boolean reuseTokensWhenNotFound,
			final boolean distributeReports, final boolean archiveAttachments) throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"cmpl-s-allTokens-split2ndTime-" + split2ndTime + "-reuseTokensWhenNotFound-" + reuseTokensWhenNotFound
						+ "-distributeReports-" + distributeReports + "-archiveAttachments-" + archiveAttachments) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				if (split2ndTime) {

					ctx.settings.setSplit2ndTime(split2ndTime);

					ctx.settings.getAttachments().clear();

					Attachment item0 = new Attachment();

					item0.order = 0;
					item0.path = "$[" + Variables.EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME + "]";

					ctx.settings.addAttachment(item0);

				}

				ctx.settings.setReuseTokensWhenNotFound(reuseTokensWhenNotFound);
				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setArchiveAttachments(archiveAttachments);

				ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		burster.burst(SPLIT2TIMES_DOCUMENT_PATH, true, StringUtils.EMPTY, -1);

		_assertTokensResults(burster, SPLIT2TIMES_TOKENS);

	}

	private void _listOfTokens(final boolean split2ndTime, final boolean reuseTokensWhenNotFound,
			final boolean distributeReports, final boolean archiveAttachments) throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"cmpl-s-listOfTokens-split2ndTime-" + split2ndTime + "-reuseTokensWhenNotFound-"
						+ reuseTokensWhenNotFound + "-distributeReports-" + distributeReports + "-archiveAttachments-"
						+ archiveAttachments) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setEmailSubject("Subject ${var0}, ${var1}");
				ctx.settings.setEmailText("Message ${burst_token}, $${var2}");

				if (split2ndTime) {

					ctx.settings.setSplit2ndTime(split2ndTime);

					ctx.settings.getAttachments().clear();

					Attachment item0 = new Attachment();

					item0.order = 0;
					item0.path = "$[" + Variables.EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME + "]";

					ctx.settings.addAttachment(item0);

				}

				ctx.settings.setReuseTokensWhenNotFound(reuseTokensWhenNotFound);
				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setArchiveAttachments(archiveAttachments);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_complex_scenario.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		String testTokens = "accounting@alphainsurance.biz,accounting@gammahealth.biz";
		burster.burst(SPLIT2TIMES_DOCUMENT_PATH, false, testTokens, -1);

		List<String> listOfTestTokens = Arrays.asList(testTokens.split(","));

		_assertTokensResults(burster, listOfTestTokens);

	}

	private void _randomTokens(final boolean split2ndTime, final boolean reuseTokensWhenNotFound,
			final boolean distributeReports, final boolean archiveAttachments) throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"cmpl-s-randomTokens-split2ndTime-" + split2ndTime + "-reuseTokensWhenNotFound-"
						+ reuseTokensWhenNotFound + "-distributeReports-" + distributeReports + "-archiveAttachments-"
						+ archiveAttachments) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setEmailSubject("Subject ${var0}, ${var1}");
				ctx.settings.setEmailText("Message ${burst_token}, $${var2}");

				if (split2ndTime) {

					ctx.settings.setSplit2ndTime(split2ndTime);

					ctx.settings.getAttachments().clear();

					Attachment item0 = new Attachment();

					item0.order = 0;
					item0.path = "$[" + Variables.EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME + "]";

					ctx.settings.addAttachment(item0);

				}

				ctx.settings.setReuseTokensWhenNotFound(reuseTokensWhenNotFound);
				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setArchiveAttachments(archiveAttachments);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_complex_scenario.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		burster.burst(SPLIT2TIMES_DOCUMENT_PATH, false, StringUtils.EMPTY, 2);

		List<String> listOfRandomTokens = new ArrayList<String>();

		Iterator<File> it = FileUtils.iterateFiles(new File(burster.getCtx().outputFolder), new String[] { "pdf" },
				false);

		while (it.hasNext()) {

			String fileName = ((File) it.next()).getName();
			String token = FilenameUtils.getBaseName(fileName);

			if (SPLIT2TIMES_TOKENS.contains(token))
				listOfRandomTokens.add(token);

		}

		// assert only 2 random output files are generated
		assertEquals(2, listOfRandomTokens.size());

		_assertTokensResults(burster, listOfRandomTokens);

	}

	private static void _assertZipFileContent(String masterToken, List<String> split2ndTimeTokens, BurstingContext ctx)
			throws Exception {

		String tmpFolderName = "tmp";
		String tmpFolderPath = ctx.outputFolder + "/" + tmpFolderName;
		File tmpFolder = new File(tmpFolderPath);

		FileUtils.forceMkdir(tmpFolder);

		ZipUtil.unpack(new File(ctx.outputFolder + "/reports-" + masterToken + ".zip"), tmpFolder);

		_assert2ndTimeSplitterOutputFiles(tmpFolderName, split2ndTimeTokens, ctx);

		FileUtils.deleteQuietly(tmpFolder);

	}

	private static String _getCorrectFilePathEvenIfFileNameSuffixMightBeRandom(String folderPath, String prefixFileName)
			throws Exception {

		String filePath = StringUtils.EMPTY;

		// first try to find directly using token.pdf filename
		File file = new File(folderPath + "/" + prefixFileName + ".pdf");

		if (file.exists())
			filePath = file.getCanonicalPath();
		else {
			File[] files = new File(folderPath).listFiles(new FilenameFilter() {
				public boolean accept(File dir, String name) {
					return name.toLowerCase().startsWith(prefixFileName) && name.toLowerCase().endsWith(".pdf");
				}
			});
			filePath = files[0].getCanonicalPath();

		}

		return filePath;

	}

	private static void _assert2ndTimeSplitterOutputFiles(String folderName, List<String> split2ndTimeTokens,
			BurstingContext ctx) throws Exception {

		String folderPath = ctx.outputFolder + "/" + folderName;

		assertEquals(split2ndTimeTokens.size(), new File(folderPath).listFiles(UtilsTest.outputFilesFilter).length);

		// assert output reports content
		for (String token : split2ndTimeTokens) {

			int numberOfPages = 1;

			if (token.equals("3")) {
				if (ctx.settings.isReuseTokensWhenNotFound()) {
					numberOfPages = 2;
				}
			}

			String path = _getCorrectFilePathEvenIfFileNameSuffixMightBeRandom(folderPath, token);

			File outputReport = new File(path);
			assertTrue(outputReport.exists());

			DocumentTester tester = new DocumentTester(path);

			tester.assertPageCountEquals(numberOfPages);

			for (int i = 1; i <= numberOfPages; i++) {

				// assert content
				try {
					tester.assertContentContainsTextOnPage(ctx.settings.getStartBurstTokenDelimiter2nd() + token
							+ ctx.settings.getEndBurstTokenDelimiter2nd(), i, TextSearchType.CONTAINS);
				} catch (AssertionError e1) {

					// because of this line sometimes the above is not matching and for such
					// cases this should work

					//// https://stackoverflow.com/questions/9057083/remove-all-control-characters-from-a-java-string
					// String token =
					//// Utils.removeControlCharactersFromString(ctx.currentPageTokens[i].trim());
					try {
						tester.assertContentContainsTextOnPage(token, i, TextSearchType.CONTAINS);
					} catch (AssertionError e2) {
						if (!ctx.settings.isReuseTokensWhenNotFound())
							throw e2;
					}
				}

			}

			// assert PDF keywords
			tester.assertKeywordsEquals(token);

			tester.close();

		}

	}

	private void _assertTokensResults(AbstractBurster burster, List<String> tokens) throws Exception {

		// final boolean split2ndTime
		if (burster.getCtx().settings.isSplit2ndTime()) {

			List<String> tokens2nd = new ArrayList<String>();

			String token = "accounting@alphainsurance.biz";
			if (tokens.contains(token)) {
				tokens2nd = Arrays.asList("10", "9", "8", "7");
				_assert2ndTimeSplitterOutputFiles(token, tokens2nd, burster.getCtx());
			}

			token = "accounting@betainsurance.biz";
			if (tokens.contains(token)) {
				tokens2nd = Arrays.asList("6", "5", "4");
				_assert2ndTimeSplitterOutputFiles(token, tokens2nd, burster.getCtx());
			}

			token = "accounting@gammahealth.biz";
			if (tokens.contains(token)) {
				tokens2nd = Arrays.asList("3", "2");
				_assert2ndTimeSplitterOutputFiles(token, tokens2nd, burster.getCtx());
			}

			if (burster.getCtx().settings.isArchiveAttachments()) {

				token = "accounting@alphainsurance.biz";
				if (tokens.contains(token)) {
					tokens2nd = Arrays.asList("10", "9", "8", "7");
					_assertZipFileContent("accounting@alphainsurance.biz", tokens2nd, burster.getCtx());
				}

				token = "accounting@betainsurance.biz";
				if (tokens.contains(token)) {
					tokens2nd = Arrays.asList("6", "5", "4");
					_assertZipFileContent("accounting@betainsurance.biz", tokens2nd, burster.getCtx());
				}

				token = "accounting@gammahealth.biz";
				if (tokens.contains(token)) {
					tokens2nd = Arrays.asList("3", "2");
					_assertZipFileContent("accounting@gammahealth.biz", tokens2nd, burster.getCtx());
				}
			}

		}

		// final boolean reuseTokensWhenNotFound

		// final boolean distributeReports
		boolean distributeReports = burster.getCtx().settings.getSendFiles().email
				|| burster.getCtx().settings.getSendFiles().sms || burster.getCtx().settings.getSendFiles().upload
				|| burster.getCtx().settings.getSendFiles().web;

		// assert no quality-assurance files are generated; qa files are generated only
		// for email/upload
		// since for alltokens distributeReports=false no reports are emailed then no QA
		// files should be generated
		if (distributeReports) {
			assertEquals(tokens.size(),
					new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

			if (burster.getCtx().settings.isArchiveAttachments())
				assertEquals(tokens.size(), burster.getCtx().numberOfDistributedFiles);
			else {

				// if the attachments are not zipped together then all the 9 output PDF files
				// splitted 2nd time
				// will be all attached attached separately
				if (burster.getCtx().settings.isSplit2ndTime()) {

					int numberOfDocumentsAfterSplitting2ndTime = 0;

					if (tokens.contains("accounting@alphainsurance.biz"))
						numberOfDocumentsAfterSplitting2ndTime += 4;
					if (tokens.contains("accounting@betainsurance.biz"))
						numberOfDocumentsAfterSplitting2ndTime += 3;
					if (tokens.contains("accounting@gammahealth.biz"))
						numberOfDocumentsAfterSplitting2ndTime += 2;

					assertEquals(numberOfDocumentsAfterSplitting2ndTime, burster.getCtx().numberOfDistributedFiles);
				} else
					assertEquals(tokens.size(), burster.getCtx().numberOfDistributedFiles);

			}

		} else {
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);
		}

		// final boolean archiveAttachments
		if (burster.getCtx().settings.isArchiveAttachments()) {
			// tokens.size() zip files
			int numberOfDocuments = tokens.size();

			// +tokens.size() output pdf files
			numberOfDocuments += tokens.size();

			if (burster.getCtx().settings.isSplit2ndTime()) {
				// 9 output PDF files generated by the 2nd split by invoice#
				// normally these 9 output PDF files should be in their own sub-folders and
				// should not be counted however the
				// archive.zip files is copying these files to burster.getCtx().outputFolder
				if (tokens.contains("accounting@alphainsurance.biz"))
					numberOfDocuments += 4;
				if (tokens.contains("accounting@betainsurance.biz"))
					numberOfDocuments += 3;
				if (tokens.contains("accounting@gammahealth.biz"))
					numberOfDocuments += 2;
			}

			assertEquals(numberOfDocuments,
					new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);
		} else {
			assertEquals(tokens.size(),
					new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);
		}

		assertEquals(tokens.size(), burster.getCtx().numberOfExtractedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

		// assert output reports content
		for (String token : tokens) {

			assertEquals(distributeReports,
					new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt").exists());

			if (burster.getCtx().settings.isArchiveAttachments()) {
				File outputReport = new File(burster.getCtx().outputFolder + "/reports-" + token + ".zip");
				assertTrue(outputReport.exists());
			}

			int numberOfPages = 0;

			if (token.equals("accounting@alphainsurance.biz")) {
				numberOfPages = 4;
			} else if (token.equals("accounting@betainsurance.biz")) {
				numberOfPages = 3;
			} else if (token.equals("accounting@gammahealth.biz")) {
				if (burster.getCtx().settings.isReuseTokensWhenNotFound()) {
					numberOfPages = 3;
				} else {
					numberOfPages = 2;
				}
			}

			String path = burster.getCtx().outputFolder + "/" + token + ".pdf";

			File outputReport = new File(path);
			assertTrue(outputReport.exists());

			DocumentTester tester = new DocumentTester(path);

			tester.assertPageCountEquals(numberOfPages);

			for (int i = 1; i <= numberOfPages; i++) {

				// assert content
				try {
					tester.assertContentContainsTextOnPage(
							burster.getCtx().settings.getStartBurstTokenDelimiter() + token
									+ burster.getCtx().settings.getEndBurstTokenDelimiter(),
							i, TextSearchType.CONTAINS);
				} catch (AssertionError e1) {

					// because of this line sometimes the above is not matching and for such
					// cases this should work

					//// https://stackoverflow.com/questions/9057083/remove-all-control-characters-from-a-java-string
					// String token =
					//// Utils.removeControlCharactersFromString(ctx.currentPageTokens[i].trim());
					try {
						tester.assertContentContainsTextOnPage(token, i, TextSearchType.CONTAINS);
					} catch (AssertionError e2) {
						if (!burster.getCtx().settings.isReuseTokensWhenNotFound())
							throw e2;
					}
				}

			}

			// assert PDF keywords
			tester.assertKeywordsEquals(token);

			tester.close();

		}

		TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);

	}

	public static void assertEmailMessage(EmailMessage message) throws Exception {

		if (!SPLIT2TIMES_TOKENS.contains(message.token))
			throw new EmailException("Invalid Message Token '" + message.token + "'");

		com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest
				.assertCommonEmailStuff(message);

		// assert testto, to, cc, bcc
		assertTrue(1 == message.tos.size());
		assertEquals(message.token, message.tos.get(0));

		assertTrue(0 == message.ccs.size() && 0 == message.bccs.size());

		if (message.token.equals("accounting@alphainsurance.biz")) {
			assertEquals("Subject Alpha Insurance, 7-Oct-2011".replaceAll("\\s", ""),
					Utils.removeControlCharactersFromString(message.subject.replaceAll("\\s", "")));
			assertEquals("Message accounting@alphainsurance.biz, $700.00USD".replaceAll("\\s", ""),
					message.textMessage.replaceAll("\\s", ""));
		} else if (message.token.equals("accounting@betainsurance.biz")) {
			assertEquals("Subject Beta Insurance, 4-Oct-2011".replaceAll("\\s", ""),
					Utils.removeControlCharactersFromString(message.subject.replaceAll("\\s", "")));
			assertEquals("Message accounting@betainsurance.biz, $400.00USD".replaceAll("\\s", ""),
					message.textMessage.replaceAll("\\s", ""));
		} else if (message.token.contains("accounting@gammahealth.biz")) {
			assertEquals("Subject Gamma Health, 3-Oct-2011".replaceAll("\\s", ""),
					Utils.removeControlCharactersFromString(message.subject.replaceAll("\\s", "")));
			assertEquals("Message accounting@gammahealth.biz, $200.00USD".replaceAll("\\s", ""),
					message.textMessage.replaceAll("\\s", ""));
		}

		// assert the correct attachment is there
		for (String path : message.attachments) {
			File attachment = new File(path);
			if (!attachment.exists())
				throw new EmailException("Attachment was not found '" + path + "'");
		}

		String file0AttachmentPath = message.attachments.get(0);

		if (message.ctx.settings.isSplit2ndTime()) {

			if (message.ctx.settings.isArchiveAttachments()) {

				assertTrue(1 == message.attachments.size());

				assertEquals(message.ctx.outputFolder + "/reports-" + message.token + ".zip", file0AttachmentPath);
				assertEquals("reports-" + message.token + ".zip", FilenameUtils.getName(file0AttachmentPath));

				List<String> tokens2nd = new ArrayList<String>();

				if (message.token.equals("accounting@alphainsurance.biz")) {
					tokens2nd = Arrays.asList("10", "9", "8", "7");
					_assertZipFileContent("accounting@alphainsurance.biz", tokens2nd, message.ctx);
				} else if (message.token.equals("accounting@betainsurance.biz")) {
					tokens2nd = Arrays.asList("6", "5", "4");
					_assertZipFileContent("accounting@betainsurance.biz", tokens2nd, message.ctx);
				} else if (message.token.contains("accounting@gammahealth.biz")) {
					tokens2nd = Arrays.asList("3", "2");
					_assertZipFileContent("accounting@gammahealth.biz", tokens2nd, message.ctx);
				}

			} else {

				if (message.token.equals("accounting@alphainsurance.biz")) {
					assertTrue(4 == message.attachments.size());
				} else if (message.token.equals("accounting@betainsurance.biz")) {
					assertTrue(3 == message.attachments.size());
				} else if (message.token.contains("accounting@gammahealth.biz")) {
					assertTrue(2 == message.attachments.size());
				}

				// assert attachments content
				for (String path : message.attachments) {

					int numberOfPages = 1;

					if (path.endsWith("3.pdf")) {
						if (message.ctx.settings.isReuseTokensWhenNotFound()) {
							numberOfPages = 2;
						}
					}

					File outputReport = new File(path);
					assertTrue(outputReport.exists());

					DocumentTester tester = new DocumentTester(path);

					tester.assertPageCountEquals(numberOfPages);

					tester.close();

				}

			}

		} else {

			assertTrue(1 == message.attachments.size());

			if (message.ctx.settings.isArchiveAttachments()) {
				assertEquals("reports-" + message.token + ".zip", FilenameUtils.getName(file0AttachmentPath));
			} else
				assertEquals(message.token + ".pdf", FilenameUtils.getName(file0AttachmentPath));

		}

	}

};