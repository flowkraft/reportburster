package com.sourcekraft.documentburster.externallibraries;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.reporting.CsvReporter;

public class YargTests {

	@Test
	public final void generatePDFTemplateDocxWordPadSimple() throws Exception {

		CsvReporter burster = new CsvReporter(StringUtils.EMPTY);
		Map<String, Object> variablesData = new HashMap<String, Object>();

		variablesData.put("var0", "data0");
		variablesData.put("var1", "data1");
		variablesData.put("var2", "data2");

		final String TEMPLATE_DOCX_WORDPAD_PATH = "src/test/resources/input/external-libraries/template-wordpad-var0var1var2-simple.docx";

		String outputFilePath = TestsUtils.TESTS_OUTPUT_FOLDER + "/YargTests/generatePDFTemplateDocxWordPadSimple/output.pdf";

		//burster.generatePDFFromDocxTemplateUsingYarg(outputFilePath, TEMPLATE_DOCX_WORDPAD_PATH, variablesData);
	}
	
	@Test
	public final void generatePDFTemplateDocxWordPadTable() throws Exception {

		CsvReporter burster = new CsvReporter(StringUtils.EMPTY);
		Map<String, Object> variablesData = new HashMap<String, Object>();

		variablesData.put("col0", "data0");
		variablesData.put("col1", "data1");
	
		final String TEMPLATE_DOCX_WORDPAD_PATH = "src/test/resources/input/external-libraries/template-wordpad-col0col1-table.docx";

		String outputFilePath = TestsUtils.TESTS_OUTPUT_FOLDER + "/YargTests/generatePDFTemplateDocxWordPadTable/output.pdf";

		//burster.generatePDFFromDocxTemplateUsingYarg(outputFilePath, TEMPLATE_DOCX_WORDPAD_PATH, variablesData);
	}
	
	@Test
	public final void generatePDFTemplateDocxGoogleDocsTable() throws Exception {

		CsvReporter burster = new CsvReporter(StringUtils.EMPTY);
		Map<String, Object> variablesData = new HashMap<String, Object>();

		variablesData.put("col0", "data0");
		variablesData.put("col1", "data1");
		variablesData.put("col2", "data2");
		variablesData.put("col3", "data3");
				
		final String TEMPLATE_DOCX_WORDPAD_PATH = "src/test/resources/input/external-libraries/template-gdocs-col0col1col2col3-table.docx";

		String outputFilePath = TestsUtils.TESTS_OUTPUT_FOLDER + "/YargTests/generatePDFTemplateDocxGoogleDocsTable/output.pdf";

		//burster.generatePDFFromDocxTemplateUsingYarg(outputFilePath, TEMPLATE_DOCX_WORDPAD_PATH, variablesData);
	}
}
