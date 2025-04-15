package com.sourcekraft.documentburster.unit.documentation.userguide.qualityassurance;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class QualityAssuranceTest {

	private static final String FAIL_JOB_IF_ANY_DISTRIBUTION_FAILS_PATH = "src/test/resources/input/unit/pdf/fail-job-if-any-distribution-fails.pdf";
	private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org", "token2",
			"kyle.butford@northridgehealth.org");

	@Test
	public final void allTokensDistributeReportsTruefailJobIfanyDistributionFailsTrue() throws Exception {

		_allTokens(true, true);

	};

	@Test
	public final void allTokensDistributeReportsFalsefailJobIfanyDistributionFailsFalse() throws Exception {

		_allTokens(false, false);

	};

	@Test
	public final void allTokensDistributeReportsTruefailJobIfanyDistributionFailsFalse() throws Exception {

		_allTokens(true, false);

	};

	@Test
	public final void allTokensDistributeReportsFalsefailJobIfanyDistributionFailsTrue() throws Exception {

		_allTokens(false, true);

	};

	@Test
	public final void listOfTokensDistributeReportsTruefailJobIfanyDistributionFailsTrue() throws Exception {

		_listOfTokens(true, true);

	};

	@Test
	public final void listOfTokensDistributeReportsFalsefailJobIfanyDistributionFailsFalse() throws Exception {

		_listOfTokens(false, false);

	};

	@Test
	public final void listOfTokensDistributeReportsTruefailJobIfanyDistributionFailsFalse() throws Exception {

		_listOfTokens(true, false);

	};

	@Test
	public final void listOfTokensDistributeReportsFalsefailJobIfanyDistributionFailsTrue() throws Exception {

		_listOfTokens(false, true);

	};

	@Test
	public final void randomTokensDistributeReportsTruefailJobIfanyDistributionFailsTrue() throws Exception {

		_randomTokens(true, true);

	};

	@Test
	public final void randomTokensDistributeReportsFalsefailJobIfanyDistributionFailsFalse() throws Exception {

		_randomTokens(false, false);

	};

	@Test
	public final void randomTokensDistributeReportsTruefailJobIfanyDistributionFailsFalse() throws Exception {

		_randomTokens(true, false);

	};

	@Test
	public final void randomTokensDistributeReportsFalsefailJobIfanyDistributionFailsTrue() throws Exception {

		_randomTokens(false, true);

	};

	private void _allTokens(final boolean distributeReports, final boolean failJobIfanyDistributionFails)
			throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"QualityAssuranceTestPDF-allTokens-distributeReports-" + distributeReports
						+ "-failJobIfanyDistributionFails-" + failJobIfanyDistributionFails) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setFailJobIfAnyDistributionFails(failJobIfanyDistributionFails);

				ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		burster.burst(FAIL_JOB_IF_ANY_DISTRIBUTION_FAILS_PATH, true, StringUtils.EMPTY, -1);

		// assert number of emails in /quality-assurance if email is enabled
		// and 0 email files if email is disabled
		if (distributeReports)

			assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		else
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		// assert individual quality-assurance files
		for (String token : tokens) {

			if (!token.equals("token2"))
				assertEquals(distributeReports,
						new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
								.exists());
			else
				assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
						.exists());

		}

		// assert 3 output files are generated
		assertEquals(3, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		PdfTestUtils.assertDefaultResults(burster, tokens);

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);

		if (distributeReports)
			assertEquals(2, burster.getCtx().numberOfDistributedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);

		if (distributeReports)
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	}

	private void _listOfTokens(final boolean distributeReports, final boolean failJobIfanyDistributionFails)
			throws Exception {
		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"QualityAssuranceTest-listOfTokens-distributeReports-" + distributeReports
						+ "-failJobIfanyDistributionFails-" + failJobIfanyDistributionFails) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setFailJobIfAnyDistributionFails(failJobIfanyDistributionFails);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_qualityassurance.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};

		};

		int howMany = randomNumberInRange(1, 3);

		String testTokens = pickSample(tokens, howMany).toString();
		testTokens = testTokens.substring(1, (testTokens.length() - 1));
		testTokens = testTokens.replaceAll(", ", ",");

		burster.burst(FAIL_JOB_IF_ANY_DISTRIBUTION_FAILS_PATH, false, testTokens, -1);

		List<String> listOfTestTokens = Arrays.asList(testTokens.split(","));

		// assert individual quality-assurance files
		for (String token : listOfTestTokens) {

			if (!token.equals("token2"))
				assertEquals(distributeReports,
						new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
								.exists());
			else
				assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
						.exists());

		}

		PdfTestUtils.assertDefaultResults(burster, listOfTestTokens);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);

		if ((listOfTestTokens.contains("token2")) && (distributeReports))
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	}

	private void _randomTokens(final boolean distributeReports, final boolean failJobIfanyDistributionFails)
			throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"QualityAssuranceTest-randomTokens-distributeReports-" + distributeReports
						+ "-failJobIfanyDistributionFails-" + failJobIfanyDistributionFails) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setFailJobIfAnyDistributionFails(failJobIfanyDistributionFails);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_qualityassurance.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		int howMany = randomNumberInRange(1, 3);

		burster.burst(FAIL_JOB_IF_ANY_DISTRIBUTION_FAILS_PATH, false, StringUtils.EMPTY, howMany);

		// assert correct number (2) email QA files if distribute
		// corresponding quality-assurance files
		// are generated
		if (!distributeReports)
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		// assert only howMany output files are generated
		assertEquals(howMany, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

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

		assertEquals(howMany, burster.getCtx().numberOfExtractedFiles);

		if (!distributeReports)
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);

	};

	public static <T> List<T> pickSample(List<T> population, int nSamplesNeeded) {

		List<T> ret = new ArrayList<T>();

		int i = 0, nLeft = population.size();

		Random r = new Random();
		
		while (nSamplesNeeded > 0) {
			int rand = r.nextInt(nLeft);
			if (rand < nSamplesNeeded) {
				ret.add(population.get(i));
				nSamplesNeeded--;
			}
			nLeft--;
			i++;
		}

		return ret;

	}

	public static int randomNumberInRange(int min, int max) {

		Random r = new Random();

		return r.nextInt((max - min) + 1) + min;

	}

}