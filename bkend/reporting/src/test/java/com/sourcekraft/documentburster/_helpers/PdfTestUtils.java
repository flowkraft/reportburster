package com.sourcekraft.documentburster._helpers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.List;

import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

public class PdfTestUtils {

	public static AbstractBurster doBurstAndAssertDefaultResults(String filePath, List<String> tokens,
			final String testName) throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, testName);

		burster.burst(filePath, false, StringUtils.EMPTY, -1);

		PdfTestUtils.assertDefaultResults(burster, tokens);

		return burster;
	}

	public static void assertDefaultResults(AbstractBurster burster, List<String> tokens) throws Exception {

		String outputFolder = burster.getCtx().outputFolder + "/";

		assertEquals(tokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		// assert output reports
		for (String token : tokens) {

			String path = outputFolder + token + ".pdf";

			File outputReport = new File(path);
			assertTrue(outputReport.exists());

			DocumentTester tester = new DocumentTester(path);

			// assert number of pages
			tester.assertPageCountEquals(1);

			// assert content
			tester.assertContentContainsTextOnPage(burster.getCtx().settings.getStartBurstTokenDelimiter() + token
					+ burster.getCtx().settings.getEndBurstTokenDelimiter(), 1, TextSearchType.CONTAINS);

			// assert PDF keywords
			tester.assertKeywordsEquals(token);

			tester.close();

		}

		TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
	}

}