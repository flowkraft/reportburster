package com.sourcekraft.documentburster.externallibraries;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.csv.CsvReporter;

public class Docx4jTests {

	@Test
	public final void generatePDFTemplateDocxWordPadSimple() throws Exception {

		CsvReporter burster = new CsvReporter(StringUtils.EMPTY);
		Map<String, String> variablesData = new HashMap<String, String>();

		variablesData.put("var0", "data0");
		variablesData.put("var1", "data1");
		variablesData.put("var2", "data2");

		final String TEMPLATE_DOCX_WORDPAD_PATH = "src/test/resources/input/external-libraries/template-wordpad-var0var1var2-simple.docx";

		String outputDocxFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxWordPadSimple/output.docx";

		burster.generateDocxFromDocxTemplateUsingDocx4j(outputDocxFilePath, TEMPLATE_DOCX_WORDPAD_PATH, variablesData);

		String outputDocx4jPdfFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxWordPadSimple/output-docx4j.pdf";
		burster.convertDocxToPDFUsingDocx4j(outputDocxFilePath, outputDocx4jPdfFilePath);

		String outputXDocReportPdfFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxWordPadSimple/output-xdocreport.pdf";

		//burster.docxToPDFUsingXDocReportConvertor(outputDocxFilePath, outputXDocReportPdfFilePath);

	}

	@Test
	public final void generatePDFTemplateDocxWordPadTable() throws Exception {

		CsvReporter burster = new CsvReporter(StringUtils.EMPTY);
		Map<String, String> variablesData = new HashMap<String, String>();

		variablesData.put("col0", "data0");
		variablesData.put("col1", "data1");

		final String TEMPLATE_DOCX_WORDPAD_PATH = "src/test/resources/input/external-libraries/template-wordpad-col0col1-table.docx";

		String outputDocxFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxWordPadTable/output.docx";

		burster.generateDocxFromDocxTemplateUsingDocx4j(outputDocxFilePath, TEMPLATE_DOCX_WORDPAD_PATH, variablesData);

		String outputDocx4jPdfFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxWordPadTable/output-docx4j.pdf";
		
		//fails with Caused by: java.lang.NullPointerException: Cannot invoke "org.docx4j.wml.Style.getPPr()" because "expressStyle" is null
		//burster.convertDocxToPDFUsingDocx4j(outputDocxFilePath, outputDocx4jPdfFilePath);

		String outputXDocReportPdfFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxWordPadTable/output-xdocreport.pdf";

		//burster.docxToPDFUsingXDocReportConvertor(outputDocxFilePath, outputXDocReportPdfFilePath);


	}

	@Test
	public final void generatePDFTemplateDocxGoogleDocsTable() throws Exception {

		CsvReporter burster = new CsvReporter(StringUtils.EMPTY);
		Map<String, String> variablesData = new HashMap<String, String>();

		variablesData.put("col0", "data0");
		variablesData.put("col1", "data1");
		variablesData.put("col2", "data2");
		variablesData.put("col3", "data3");

		final String TEMPLATE_DOCX_WORDPAD_PATH = "src/test/resources/input/external-libraries/template-gdocs-col0col1col2col3-table.docx";

		String outputDocxFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxGoogleDocsTable/output.docx";

		burster.generateDocxFromDocxTemplateUsingDocx4j(outputDocxFilePath, TEMPLATE_DOCX_WORDPAD_PATH, variablesData);

		String outputDocx4jPdfFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxGoogleDocsTable/output-docx4j.pdf";

		burster.convertDocxToPDFUsingDocx4j(outputDocxFilePath, outputDocx4jPdfFilePath);

		String outputXDocReportPdfFilePath = TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/Docx4jTests/generatePDFTemplateDocxGoogleDocsTable/output-xdocreport.pdf";

		burster.convertDocxToPDFUsingXDocReport(outputDocxFilePath, outputXDocReportPdfFilePath);

	}
}
