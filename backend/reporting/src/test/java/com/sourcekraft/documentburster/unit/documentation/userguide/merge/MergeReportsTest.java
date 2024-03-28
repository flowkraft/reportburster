package com.sourcekraft.documentburster.unit.documentation.userguide.merge;

import static org.junit.Assert.*;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.pdf.Merger;
import com.sourcekraft.documentburster.common.settings.Settings;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class MergeReportsTest {

	private static final String[] tokens = { "0011", "0012", "0013", "0014", "0015", "0016", "0017", "0018", "0019" };

	private static final List<String> reportsToMerge = Arrays.asList(
			"src/main/external-resources/template/samples/burst/Invoices-Oct.pdf",
			"src/main/external-resources/template/samples/burst/Invoices-Nov.pdf",
			"src/main/external-resources/template/samples/burst/Invoices-Dec.pdf");

	@Test
	public final void merge() throws Exception {

		Settings settings = new Settings();
		
		settings.loadSettings("src/main/external-resources/template/config/burst/settings.xml");

		settings.setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/output/${input_document_name}/MergeReportsTest-merge/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}");
		settings.setBackupFolder(TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/backup/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}");

		// merge the reports
		Merger merger = new Merger(settings);
		String path = merger.doMerge(reportsToMerge, settings.getMergeFileName());

		// assert output report
		File outputReport = new File(path);
		assertTrue(outputReport.exists());

		// filename should be as per configuration
		String name = FilenameUtils.getName(path);
		assertEquals(settings.getMergeFileName(), name);

		DocumentTester tester = new DocumentTester(path);

		// assert number of pages
		tester.assertPageCountEquals(9);

		// assert content and keywords
		for (int i = 0; i < tokens.length; i++)
			tester.assertContentContainsTextOnPage("{" + tokens[i] + "}", i + 1, TextSearchType.CONTAINS);

		tester.close();

	}
}