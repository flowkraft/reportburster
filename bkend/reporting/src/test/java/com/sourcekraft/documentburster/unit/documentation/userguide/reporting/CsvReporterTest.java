package com.sourcekraft.documentburster.unit.documentation.userguide.reporting;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.apache.commons.lang3.StringUtils;
import org.assertj.core.api.Assertions;
import org.junit.Before;
import org.junit.Test;

import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.ICSVParser;
import com.opencsv.enums.CSVReaderNullFieldIndicator;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.reporting.CsvReporter;
import com.sourcekraft.documentburster.unit.documentation.userguide.qualityassurance.QualityAssuranceTest;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.utils.CsvUtils;
import com.sourcekraft.documentburster._helpers.TestsUtils;

public class CsvReporterTest {

	// get ideas from
	// https://sourceforge.net/p/opencsv/source/ci/master/tree/src/test/java/com/opencsv/CSVParserTest.java

	private static final String PAYSLIPS_DOCX_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.docx";
	private static final String PAYSLIPS_HTML_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.html";
	private static final String PAYSLIPS_HTML_EXCEL_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template-excel.html";

	private static final String CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/separator-comma-standard.csv";
	private static final String CSV_INPUT_SEPARATOR_CUSTOM_PIPE_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/separator-custom-pipe.csv";
	private static final String CSV_INPUT_SEPARATOR_CUSTOM_TAB_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/separator-custom-tab.csv";
	private static final String CSV_INPUT_SEPARATOR_CUSTOM_TAB_QUOTE_DEFINED_QUOTE_CHAR_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/separator-custom-tab-quote-defined-quote-char.csv";

	private static final String CSV_INPUT_HEADER_FIRSTLINE_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/header-firstline.csv";
	private static final String CSV_INPUT_HEADER_MULTILINE_2_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/header-multiline-2.csv";
	private static final String CSV_INPUT_HEADER_MULTILINE_8_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/header-multiline-8.csv";

	private static final String CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-simple-quoted-strings.csv";
	private static final String CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_WITH_SPACES_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-simple-quoted-strings-with-spaces.csv";
	private static final String CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_WITH_COMMAS_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-simple-quoted-strings-with-commas.csv";
	private static final String CSV_INPUT_INTERNAL_WHITESPACE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-with-internal-leading-whitespace.csv";

	private static final String CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_WITH_DEFINED_SEPARATOR_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-simple-quoted-strings-with-defined-separator.csv";

	private static final String CSV_INPUT_QUOTE_INTERNAL_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-internal.csv";

	private static final String CSV_INPUT_QUOTE_DEFINED_QUOTE_CHAR_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-defined-quote-char.csv";
	private static final String CSV_INPUT_QUOTE_DEFINED_QUOTE_ESCAPE_CHARS_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quote-defined-quote-escape-chars.csv";
	private static final String CSV_INPUT_QUOTE_IGNORE_QUOTATIONS = "src/test/resources/input/unit/reporting/csvreporter/quote-ignore-quotations.csv";
	private static final String CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH = "src/test/resources/input/unit/reporting/csvreporter/quality-assurance.csv";

	private static final String ESCAPE_TEST_STRING = "\\\\1\\2\\\"3\\"; // \\1\2\"\

	CSVParser csvParser;

	@Before
	public void setUp() {
		csvParser = new CSVParser();
	}

	@Test
	public final void generateHTMLReports() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateHTMLReports") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, expectAllFilesToBeGenerated,
				CsvUtils.OUTPUT_TYPE_HTML);

	}

	@Test
	public final void generatePDFReports() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generatePDFReports") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, expectAllFilesToBeGenerated,
				CsvUtils.OUTPUT_TYPE_PDF);

	}

	@Test
	public final void generateExcelReports() throws Exception {
		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateExcelReports") {
			protected void executeController() throws Exception {
				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_EXCEL;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_EXCEL_TEMPLATE_PATH;

			}
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, expectAllFilesToBeGenerated,
				CsvUtils.OUTPUT_TYPE_EXCEL);
	}

	@Test
	public final void generateReportsFromSeparatorCommaStandard() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromSeparatorCommaStandard") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, expectAllFilesToBeGenerated,
				CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromSeparatorCustomPipe() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromSeparatorCustomPipe") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.separatorchar = "|";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_SEPARATOR_CUSTOM_PIPE_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;

		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_SEPARATOR_CUSTOM_PIPE_DATASOURCE_PATH, expectAllFilesToBeGenerated,
				CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromSeparatorWronglySpecified() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromSeparatorWronglySpecified") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.separatorchar = "%";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		try {
			burster.burst(CSV_INPUT_SEPARATOR_CUSTOM_PIPE_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);
		} catch (IllegalArgumentException ex) {
			assertTrue("Exception is expected",
					ex.toString().contains("Probably the configured separator '%' is incorrect"));
		}

	}

	@Test
	public final void generateReportsFromHeaderFirstLine() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromHeaderFirstLine") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.header = "firstline";
				ctx.settings.getReportDataSource().csvoptions.skiplines = 1;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_HEADER_FIRSTLINE_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;

		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_HEADER_FIRSTLINE_DATASOURCE_PATH, expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromHeaderMultiLine2() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromHeaderMultiLine2") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.header = "multiline";
				ctx.settings.getReportDataSource().csvoptions.skiplines = 2;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_HEADER_MULTILINE_2_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;

		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_HEADER_MULTILINE_2_DATASOURCE_PATH, expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromHeaderMultiLine8() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromHeaderMultiLine8") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.header = "multiline";
				ctx.settings.getReportDataSource().csvoptions.skiplines = 8;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_HEADER_MULTILINE_8_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;

		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_HEADER_MULTILINE_8_DATASOURCE_PATH, expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromIdColumnWithMultiLineHeader() throws Exception {
		// This test verifies that ID column selection works correctly when combined
		// with multi-line headers and skip lines configuration

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromIdColumnWithMultiLineHeader") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure multi-line header with skip lines
				ctx.settings.getReportDataSource().csvoptions.header = "multiline";
				ctx.settings.getReportDataSource().csvoptions.skiplines = 8; // Skip first 2 rows

				// Use last column as ID
				ctx.settings.getReportDataSource().csvoptions.idcolumn = "lastcolumn";

				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			}
		};

		burster.burst(CSV_INPUT_HEADER_MULTILINE_8_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		// Get parsed lines to verify correct token extraction
		List<String[]> arrayData = TestsUtils.toArrayRows(burster.getCtx().reportData);
		assertEquals("Should be 3 lines of data", 3, arrayData.size());

		assertNotNull("Parsed lines should not be null", arrayData);

		// Verify the header rows were properly skipped
		// Since first 2 rows are skipped and header is set to "multiline",
		// the parse should start from line 3

		// Verify that output files exist with the correct name based on last column
		for (String[] row : arrayData) {
			String expectedToken = row[row.length - 1]; // Last column
			File outputFile = new File(burster.getCtx().outputFolder + "/" + expectedToken + ".docx");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromQuoteSimpleQuotedStrings() throws Exception {

		ICSVParser parser = new CSVParserBuilder().build();

		String[] nextLine = parser.parseLine("\"a\",\"b\",\"c\"");
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("b", nextLine[1]);
		assertEquals("c", nextLine[2]);

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteSimpleQuotedStrings") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;

		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_DATASOURCE_PATH, expectAllFilesToBeGenerated,
				CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromQuoteDefinedQuoteChar() throws Exception {

		ICSVParser parser = new CSVParserBuilder().withQuoteChar('\'').build();

		String[] nextLine = parser.parseLine("'Today I',' go to',' sports'");
		assertEquals(3, nextLine.length);
		assertEquals("Today I", nextLine[0]);
		assertEquals(" go to", nextLine[1]);
		assertEquals(" sports", nextLine[2]);

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteDefinedQuoteChar") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.quotationchar = "'";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_QUOTE_DEFINED_QUOTE_CHAR_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(burster.getCtx().reportData);

		// assert 3 rows are parsed
		assertEquals(3, arrayData.size());

		// assert 17 columns are parsed
		assertEquals(17, arrayData.get(0).length);

		assertEquals("Kyle Butford's birthday", arrayData.get(1)[0]);
		assertEquals("2890", arrayData.get(1)[16]);

	}

	@Test
	public final void generateReportsFromQuoteDefinedQuoteEscapeChars() throws Exception {

		ICSVParser parser = new CSVParserBuilder().withQuoteChar('\'').withEscapeChar('#').build();

		String[] nextLine = parser.parseLine("'John#'s birthday ','is ','tomorrow'");
		assertEquals(3, nextLine.length);
		assertEquals("John's birthday ", nextLine[0]);
		assertEquals("is ", nextLine[1]);
		assertEquals("tomorrow", nextLine[2]);

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteDefinedQuoteEscapeChars") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.quotationchar = "'";
				ctx.settings.getReportDataSource().csvoptions.escapechar = "#";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_QUOTE_DEFINED_QUOTE_ESCAPE_CHARS_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(burster.getCtx().reportData);

		// assert 3 rows are parsed
		assertEquals(3, arrayData.size());

		// assert 17 columns are parsed
		assertEquals(17, arrayData.get(0).length);

		assertEquals("Kyle Butford's birthday", arrayData.get(1)[0]);
		assertEquals("2890", arrayData.get(1)[16]);

	}

	@Test
	public final void generateReportsFromQuoteSimpleQuotedStringsWithSpaces() throws Exception {

		ICSVParser parser = new CSVParserBuilder().withStrictQuotes(true).build();

		String[] nextLine = parser.parseLine(" \"a\" , \"b\" , \"c\" ");
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("b", nextLine[1]);
		assertEquals("c", nextLine[2]);

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteSimpleQuotedStringsWithSpaces") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.strictquotations = true;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_WITH_SPACES_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(burster.getCtx().reportData);

		assertEquals(2, arrayData.size());

		assertEquals(3, arrayData.get(0).length);

		assertEquals("a", arrayData.get(0)[0]);
		assertEquals("b", arrayData.get(0)[1]);
		assertEquals("c", arrayData.get(0)[2]);

		assertEquals("a", arrayData.get(1)[0]);
		assertEquals("b", arrayData.get(1)[1]);
		assertEquals("c", arrayData.get(1)[2]);

	}

	@Test
	public final void generateReportsFromQuoteIgnoreQuotations() throws Exception {
		// Test with ignorequotations = false (default behavior)
		CsvReporter bursterRespectQuotes = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteIgnoreQuotations-false") {
			protected void executeController() throws Exception {
				super.executeController();
				ctx.settings.getReportDataSource().csvoptions.ignorequotations = false;
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		try {
			bursterRespectQuotes.burst(CSV_INPUT_QUOTE_IGNORE_QUOTATIONS, false, StringUtils.EMPTY, -1);
			// If we get here, the test should fail because we expected an exception
			fail("Expected exception was not thrown");
		} catch (Exception e) {
			// Expected exception with malformed CSV - this is normal behavior
			assertTrue("Expected error message about unterminated quoted field",
					e.toString().contains("Unterminated quoted field at end of CSV line"));
		}

		// Test with ignorequotations = true
		CsvReporter bursterIgnoreQuotes = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteIgnoreQuotations-true") {
			protected void executeController() throws Exception {
				super.executeController();
				ctx.settings.getReportDataSource().csvoptions.ignoreleadingwhitespace = false;
				ctx.settings.getReportDataSource().csvoptions.ignorequotations = true;
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		bursterIgnoreQuotes.burst(CSV_INPUT_QUOTE_IGNORE_QUOTATIONS, false, StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(bursterIgnoreQuotes.getCtx().reportData);

		// Verify quotes are processed with ignorequotations=true
		// First line - quotes are still recognized as quotes in well-formed fields
		assertEquals("simple quoted", arrayData.get(0)[0]);
		assertEquals("not ignored", arrayData.get(0)[1]);
		assertEquals("third", arrayData.get(0)[2]);

		// Second line - internal quotes remain unchanged
		assertEquals("field with \"quotes\" inside", arrayData.get(1)[0]);
		assertEquals("normal", arrayData.get(1)[1]);
		assertEquals("quoted", arrayData.get(1)[2]);
		
		// Third line - with ignorequotations=true, quotes don't prevent splitting on
		// commas
		// and both opening and closing quotes are removed at field boundaries
		assertEquals("fully", arrayData.get(2)[0]);
		assertEquals("quoted", arrayData.get(2)[1]); // No trailing quote
		assertEquals("test", arrayData.get(2)[2]);

		// Fourth line - escaped quotes are now treated as separate quotes
		assertEquals("quote with \"escaped\" quotes", arrayData.get(3)[0]);
		assertEquals("regular", arrayData.get(3)[1]);
		assertEquals("data", arrayData.get(3)[2]);
	}

	@Test
	public final void generateReportsFromMixedQuotationStylesWithIdColumn() throws Exception {
		// Create test file with mixed quotation styles if needed
		String MIXED_QUOTES_CSV_PATH = "src/test/resources/input/unit/reporting/csvreporter/mixed-quotation-styles.csv";

		if (!new File(MIXED_QUOTES_CSV_PATH).exists()) {
			FileWriter writer = new FileWriter(MIXED_QUOTES_CSV_PATH);
			writer.write("UnquotedID,\"Quoted Column\",\"Some, comma\",Unquoted Text\n");
			writer.write("ID001,\"Normal quotes\",\"Data, with comma\",Plain text\n");
			writer.write("\"ID002\",Text with \"internal\" quotes,\"More, data\",More text\n");
			writer.write("ID003,\"Special \"\"double\"\" quotes\",\"Final, row\",End\n");
			writer.close();
		}

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromMixedQuotationStylesWithIdColumn") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use first column as ID with mixed quotation handling
				ctx.settings.getReportDataSource().csvoptions.idcolumn = "firstcolumn";
				ctx.settings.getReportDataSource().csvoptions.header = "firstline";

				// Handle mixed quotation styles
				ctx.settings.getReportDataSource().csvoptions.strictquotations = false;

				// Set output type
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			}
		};

		burster.burst(MIXED_QUOTES_CSV_PATH, false, StringUtils.EMPTY, -1);

		// Verify correct handling of mixed quotation styles
		List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
		assertNotNull("Parsed lines should not be null", parsedLines);

		// Verify proper ID extraction despite mixed quoting styles
		assertEquals("ID001", parsedLines.get(0)[0]);
		assertEquals("ID002", parsedLines.get(1)[0]);
		assertEquals("ID003", parsedLines.get(2)[0]);

		// Verify file generation with correct IDs
		for (int i = 1; i < parsedLines.size(); i++) {
			String expectedToken = parsedLines.get(i)[0];
			File outputFile = new File(burster.getCtx().outputFolder + "/" + expectedToken + ".docx");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromQuoteWithInternalLeadingWhitespace() throws Exception {
		// Test with ignoreleadingwhitespace = false - spaces should be preserved
		CsvReporter bursterPreserveSpaces = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteWithInternalLeadingWhitespace-false") {
			protected void executeController() throws Exception {
				super.executeController();
				ctx.settings.getReportDataSource().csvoptions.ignoreleadingwhitespace = false;
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			}
		};

		bursterPreserveSpaces.burst(CSV_INPUT_INTERNAL_WHITESPACE_PATH, false, StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(bursterPreserveSpaces.getCtx().reportData);

		// Verify whitespace is preserved when ignoreleadingwhitespace = false
		assertEquals(2, arrayData.size());
		assertEquals(3, arrayData.get(0).length);

		// First line should preserve leading spaces
		assertEquals("  a", arrayData.get(0)[0]);
		assertEquals("   b", arrayData.get(0)[1]);
		assertEquals("    c", arrayData.get(0)[2]);

		// Second line should also preserve spaces
		assertEquals("x", arrayData.get(1)[0]);
		assertEquals("  y  ", arrayData.get(1)[1]); // Full spaces preserved
		assertEquals("   z", arrayData.get(1)[2]);

		// Test with ignoreleadingwhitespace = true - leading spaces should be trimmed
		// but note that OpenCSV's behavior may vary depending on quotes and field
		// structure
		CsvReporter bursterTrimSpaces = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteWithInternalLeadingWhitespace-true") {
			protected void executeController() throws Exception {
				super.executeController();
				ctx.settings.getReportDataSource().csvoptions.ignoreleadingwhitespace = true;
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			}
		};

		bursterTrimSpaces.burst(CSV_INPUT_INTERNAL_WHITESPACE_PATH, false, StringUtils.EMPTY, -1);

		arrayData = TestsUtils.toArrayRows(bursterTrimSpaces.getCtx().reportData);

		// Verify results match actual behavior of OpenCSV
		assertEquals(2, arrayData.size());
		assertEquals(3, arrayData.get(0).length);

		// First line - asserting actual behavior (spaces may remain if fields are
		// quoted)
		assertEquals("a", arrayData.get(0)[0]);
		assertEquals("b", arrayData.get(0)[1]);
		assertEquals("c", arrayData.get(0)[2]);

		// Second line - asserting actual behavior
		assertEquals("x", arrayData.get(1)[0]);
		assertEquals("y", arrayData.get(1)[1]);
		assertEquals("z", arrayData.get(1)[2]);
	}

	@Test
	public final void generateReportsFromQuoteInternal() throws Exception {

		ICSVParser parser = new CSVParserBuilder().build();

		String[] nextLine = parser.parseLine("a,123\"4\"567,c");
		assertEquals(3, nextLine.length);

		assertEquals("123\"4\"567", nextLine[1]);

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteInternal") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_QUOTE_INTERNAL_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(burster.getCtx().reportData);

		assertEquals(3, arrayData.size());

		assertEquals(17, arrayData.get(0).length);

		assertEquals("Kyle \"Butford\"", arrayData.get(1)[0]);
		assertEquals("2890", arrayData.get(1)[16]);

	}

	@Test
	public final void generateReportsFromQuoteSimpleQuotedStringsWithCommas() throws Exception {

		ICSVParser parser = new CSVParserBuilder().build();

		String[] nextLine = parser.parseLine("a,\"b,b,b\",c");
		assertEquals("a", nextLine[0]);
		assertEquals("b,b,b", nextLine[1]);
		assertEquals("c", nextLine[2]);
		assertEquals(3, nextLine.length);

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteSimpleQuotedStringsWithCommas") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_WITH_COMMAS_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(burster.getCtx().reportData);

		assertEquals(2, arrayData.size());

		assertEquals(3, arrayData.get(0).length);

		assertEquals("a", arrayData.get(0)[0]);
		assertEquals("b", arrayData.get(0)[1]);
		assertEquals("c", arrayData.get(0)[2]);

		assertEquals("a", arrayData.get(1)[0]);
		assertEquals("b,b,b", arrayData.get(1)[1]);
		assertEquals("c", arrayData.get(1)[2]);

	}

	@Test
	public final void generateReportsFromQuoteSimpleQuotedStringsWithDefinedSeparator() throws Exception {

		ICSVParser parser = new CSVParserBuilder().withSeparator(':').build();

		String[] nextLine = parser.parseLine("a:\"b:b:b\":c");
		assertEquals("a", nextLine[0]);
		assertEquals("b:b:b", nextLine[1]);
		assertEquals("c", nextLine[2]);
		assertEquals(3, nextLine.length);

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromQuoteSimpleQuotedStringsWithDefinedSeparator") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.separatorchar = ":";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_QUOTE_SIMPLE_QUOTED_STRINGS_WITH_DEFINED_SEPARATOR_DATASOURCE_PATH, false,
				StringUtils.EMPTY, -1);

		List<String[]> arrayData = TestsUtils.toArrayRows(burster.getCtx().reportData);

		assertEquals(2, arrayData.size());

		assertEquals(3, arrayData.get(0).length);

		assertEquals("a", arrayData.get(0)[0]);
		assertEquals("b", arrayData.get(0)[1]);
		assertEquals("c", arrayData.get(0)[2]);

		assertEquals("a", arrayData.get(1)[0]);
		assertEquals("b:b:b", arrayData.get(1)[1]);
		assertEquals("c", arrayData.get(1)[2]);

	}

	@Test
	public final void generateReportsFromUsingFirstColumnAsId() throws Exception {
		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromUsingFirstColumnAsId") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use first column as ID
				ctx.settings.getReportDataSource().csvoptions.idcolumn = "firstcolumn";

				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("FirstColumn-${burst_token}.${output_type_extension}");

				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;
			}
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know what values to expect in filenames
		List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
		assertNotNull("Parsed lines should not be null", parsedLines);

		// Verify that output files exist with the expected filenames based on first
		// column
		for (String[] row : parsedLines) {
			String expectedToken = row[0];
			File outputFile = new File(burster.getCtx().outputFolder + "/FirstColumn-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromUsingLastColumnAsId() throws Exception {
		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromUsingLastColumnAsId") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use last column as ID
				ctx.settings.getReportDataSource().csvoptions.idcolumn = "lastcolumn";

				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("LastColumn-${burst_token}.${output_type_extension}");

				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;
			}
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know what values to expect in filenames
		List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
		assertNotNull("Parsed lines should not be null", parsedLines);

		// Verify that output files exist with the expected filenames based on last
		// column
		for (String[] row : parsedLines) {
			String expectedToken = row[row.length - 1];
			File outputFile = new File(burster.getCtx().outputFolder + "/LastColumn-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromUsingCustomColumnIndexAsId() throws Exception {
		final int columnIndex = 2; // Use third column (index 2)

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromUsingCustomColumnIndexAsId") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use specific column index as ID
				ctx.settings.getReportDataSource().csvoptions.idcolumn = String.valueOf(columnIndex);

				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("Column" + columnIndex + "-${burst_token}.${output_type_extension}");

				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;
			}
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know what values to expect in filenames
		List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
		assertNotNull("Parsed lines should not be null", parsedLines);

		// Verify that output files exist with the expected filenames based on specified
		// column
		for (String[] row : parsedLines) {
			String expectedToken = row[columnIndex];
			File outputFile = new File(
					burster.getCtx().outputFolder + "/Column" + columnIndex + "-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromUsingNoIdColumn() throws Exception {
		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromUsingNoIdColumn") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use sequential numbering instead of columns
				ctx.settings.getReportDataSource().csvoptions.idcolumn = "notused";

				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("SequenceNum-${burst_token}.${output_type_extension}");

				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;
			}
		};

		burster.burst(CSV_INPUT_SEPARATOR_COMMA_STANDARD_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know how many files to expect
		List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
		assertNotNull("Parsed lines should not be null", parsedLines);

		// Verify that output files exist with the expected filenames based on sequence
		// number
		for (int i = 0; i < parsedLines.size(); i++) {
			String expectedToken = String.valueOf(i);
			File outputFile = new File(burster.getCtx().outputFolder + "/SequenceNum-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void qualityAssuranceAllTokensDistributeReportsTrueFailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaAllTokens(true, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceAllTokensDistributeReportsFalsefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaAllTokens(false, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceAllTokensDistributeReportsTruefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaAllTokens(true, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceAllTokensDistributeReportsFalsefailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaAllTokens(false, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceListOfTokensDistributeReportsTruefailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaListOfTokens(true, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceListOfTokensDistributeReportsFalsefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaListOfTokens(false, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceListOfTokensDistributeReportsTruefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaListOfTokens(true, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceListOfTokensDistributeReportsFalsefailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaListOfTokens(false, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceRandomTokensDistributeReportsTruefailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaRandomTokens(true, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceRandomTokensDistributeReportsFalsefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaRandomTokens(false, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceRandomTokensDistributeReportsTruefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaRandomTokens(true, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceRandomTokensDistributeReportsFalsefailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaRandomTokens(false, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceNewsletterDistributeReportsTrueFailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaNewsletter(true, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceNewsletterDistributeReportsFalsefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaNewsletter(false, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceNewsletterDistributeReportsTruefailJobIfanyDistributionFailsFalse()
			throws Exception {

		_qaNewsletter(true, false, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void qualityAssuranceNewsletterDistributeReportsFalsefailJobIfanyDistributionFailsTrue()
			throws Exception {

		_qaNewsletter(false, true, CSV_INPUT_QUALITY_ASSURANCE_DATASOURCE_PATH);

	};

	@Test
	public final void generateReportsFromSeparatorCustomTab() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromSeparatorCustomTab") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.separatorchar = "→ [tab character]";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_SEPARATOR_CUSTOM_TAB_DATASOURCE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;

		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				CSV_INPUT_SEPARATOR_CUSTOM_TAB_DATASOURCE_PATH, expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromTabSeparatedQuoteDefinedQuoteCharInputFile() throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-generateReportsFromTabSeparatedQuoteDefinedQuoteCharInputFile") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().csvoptions.separatorchar = "\t";
				ctx.settings.getReportDataSource().csvoptions.quotationchar = "'";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(CSV_INPUT_SEPARATOR_CUSTOM_TAB_QUOTE_DEFINED_QUOTE_CHAR_DATASOURCE_PATH, false, StringUtils.EMPTY,
				-1);

		// assert 3 rows are parsed
		assertEquals(3, burster.getCtx().reportData.size());

		// assert 17 columns are parsed
		assertEquals(17, burster.getCtx().reportData.get(0).size());

		assertEquals("Kyle Butford's birthday", TestsUtils.toArrayRows(burster.getCtx().reportData).get(1)[0]);
		assertEquals("2890", TestsUtils.toArrayRows(burster.getCtx().reportData).get(1)[16]);

	}

	@Test
	public void libOpenCsvParseQuotedStringWithDefinedSeparatorAndQuote() throws IOException {
		csvParser = new CSVParserBuilder().withSeparator(':').withQuoteChar('\'').build();

		String[] nextLine = csvParser.parseLine("a:'b:b:b':c");
		assertEquals("a", nextLine[0]);
		assertEquals("b:b:b", nextLine[1]);
		assertEquals("c", nextLine[2]);
		assertEquals(3, nextLine.length);
	}

	@Test
	public void libOpenCsvParseEmptyElements() throws IOException {
		String[] nextLine = csvParser.parseLine(",,");
		assertEquals(3, nextLine.length);
		assertEquals("", nextLine[0]);
		assertEquals("", nextLine[1]);
		assertEquals("", nextLine[2]);
	}

	@Test
	public void libOpenCsvParseMultiLinedQuoted() throws IOException {
		String[] nextLine = csvParser.parseLine("a,\"PO Box 123,\nKippax,ACT. 2615.\nAustralia\",d.\n");
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("PO Box 123,\nKippax,ACT. 2615.\nAustralia", nextLine[1]);
		assertEquals("d.\n", nextLine[2]);
	}

	@Test
	public void libOpenCsvParseMultiLinedQuotedWithCarriageReturns() throws IOException {
		String[] nextLine = csvParser.parseLine("a,\"PO Box 123,\r\nKippax,ACT. 2615.\r\nAustralia\",d.\n");
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("PO Box 123,\r\nKippax,ACT. 2615.\r\nAustralia", nextLine[1]);
		assertEquals("d.\n", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestADoubleQuoteAsDataElement() throws IOException {

		String[] nextLine = csvParser.parseLine("a,\"\"\"\",c");// a,"""",c

		assertEquals(3, nextLine.length);

		assertEquals("a", nextLine[0]);
		assertEquals(1, nextLine[1].length());
		assertEquals("\"", nextLine[1]);
		assertEquals("c", nextLine[2]);

	}

	@Test
	public void libOpenCsvTestEscapedDoubleQuoteAsDataElement() throws IOException {

		String[] nextLine = csvParser.parseLine("\"test\",\"this,test,is,good\",\"\\\"test\\\"\",\"\\\"quote\\\"\""); // "test","this,test,is,good","\"test\",\"quote\""

		assertEquals(4, nextLine.length);

		assertEquals("test", nextLine[0]);
		assertEquals("this,test,is,good", nextLine[1]);
		assertEquals("\"test\"", nextLine[2]);
		assertEquals("\"quote\"", nextLine[3]);

	}

	@Test
	public void libOpenCsvParseQuotedQuoteCharacters() throws IOException {
		String[] nextLine = csvParser.parseLineMulti("\"Glen \"\"The Man\"\" Smith\",Athlete,Developer\n");
		assertEquals(3, nextLine.length);
		assertEquals("Glen \"The Man\" Smith", nextLine[0]);
		assertEquals("Athlete", nextLine[1]);
		assertEquals("Developer\n", nextLine[2]);
	}

	@Test
	public void libOpenCsvParseMultipleQuotes() throws IOException {
		String[] nextLine = csvParser.parseLine("\"\"\"\"\"\",\"test\"\n"); // """""","test" representing: "", test
		assertEquals("\"\"", nextLine[0]); // check the tricky situation
		assertEquals("test\"\n", nextLine[1]); // make sure we didn't ruin the next field..
		assertEquals(2, nextLine.length);
	}

	@Test
	public void libOpenCsvParseTrickyString() throws IOException {
		String[] nextLine = csvParser.parseLine("\"a\nb\",b,\"\nd\",e\n");
		assertEquals(4, nextLine.length);
		assertEquals("a\nb", nextLine[0]);
		assertEquals("b", nextLine[1]);
		assertEquals("\nd", nextLine[2]);
		assertEquals("e\n", nextLine[3]);
	}

	@Test
	public void libOpenCsvTestAMultiLineInsideQuotes() throws IOException {

		StringBuilder sb = new StringBuilder(ICSVParser.INITIAL_READ_SIZE);

		String testString = sb.append("Small test,\"This is a test across \ntwo lines.\"").toString();

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(2, nextLine.length);
		assertEquals("Small test", nextLine[0]);
		assertEquals("This is a test across \ntwo lines.", nextLine[1]);
	}

	@Test
	public void libOpenCsvTestStrictQuoteSimple() throws IOException {
		csvParser = new CSVParserBuilder().withStrictQuotes(true).build();
		String testString = "\"a\",\"b\",\"c\"";

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("b", nextLine[1]);
		assertEquals("c", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestNotStrictQuoteSimple() throws IOException {
		csvParser = new CSVParserBuilder().build();
		String testString = "\"a\",\"b\",\"c\"";

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("b", nextLine[1]);
		assertEquals("c", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestStrictQuoteWithSpacesAndTabs() throws IOException {
		csvParser = new CSVParserBuilder().withStrictQuotes(true).build();
		String testString = " \t      \"a\",\"b\"      \t       ,   \"c\"   ";

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("b", nextLine[1]);
		assertEquals("c", nextLine[2]);
	}

	/**
	 * Shows that without the strict quotes opencsv will read until the separator or
	 * the end of the line.
	 *
	 * @throws IOException But not really
	 */
	@Test
	public void libOpenCsvTestNotStrictQuoteWithSpacesAndTabs() throws IOException {
		csvParser = new CSVParserBuilder().build();
		String testString = " \t      \"a\",\"b\"      \t       ,   \"c\"   ";

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(3, nextLine.length);
		assertEquals("a", nextLine[0]);
		assertEquals("b\"      \t       ", nextLine[1]);
		assertEquals("c\"   ", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestStrictQuoteWithGarbage() throws IOException {
		csvParser = new CSVParserBuilder().withStrictQuotes(true).build();
		String testString = "abc',!@#\",\\\"\"   xyz,";

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(3, nextLine.length);
		assertEquals("", nextLine[0]);
		assertEquals(",\"", nextLine[1]);
		assertEquals("", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestCanIgnoreQuotations() throws IOException {
		csvParser = new CSVParserBuilder().withIgnoreQuotations(true).build();
		String testString = "Bob,test\",Beaumont,TX";

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(4, nextLine.length);
		assertEquals("Bob", nextLine[0]);
		assertEquals("test", nextLine[1]);
		assertEquals("Beaumont", nextLine[2]);
		assertEquals("TX", nextLine[3]);
	}

	@Test
	public void libOpenCsvTestFalseIgnoreQuotations() {
		csvParser = new CSVParserBuilder().withIgnoreQuotations(false).build();
		String testString = "Bob,test\",Beaumont,TX";

		Assertions.assertThatExceptionOfType(IOException.class).isThrownBy(() -> csvParser.parseLine(testString));
	}

	/**
	 * This is an interesting issue where the data does not use quotes but IS using
	 * a quote within the field as an inch symbol.
	 * <p>
	 * So we want to keep that quote as part of the field and not as the start or
	 * end of a field.
	 * </p>
	 * <p>
	 * Test data are as follows. {@code
	 * RPO;2012;P; ; ; ;SDX;ACCESSORY WHEEL, 16", ALUMINUM, DESIGN 1
	 * RPO;2012;P; ; ; ;SDZ;ACCESSORY WHEEL - 17" - ALLOY - DESIGN 1}
	 * </p>
	 *
	 * @throws IOException But not really
	 */
	@Test
	public void libOpenCsvTestIssue3314579() throws IOException {
		csvParser = new CSVParserBuilder().withSeparator(';').withIgnoreQuotations(true).build();
		String testString = "RPO;2012;P; ; ; ;SDX;ACCESSORY WHEEL, 16\", ALUMINUM, DESIGN 1";

		String[] nextLine = csvParser.parseLine(testString);
		assertEquals(8, nextLine.length);
		assertEquals("RPO", nextLine[0]);
		assertEquals("2012", nextLine[1]);
		assertEquals("P", nextLine[2]);
		assertEquals(" ", nextLine[3]);
		assertEquals(" ", nextLine[4]);
		assertEquals(" ", nextLine[5]);
		assertEquals("SDX", nextLine[6]);
		assertEquals("ACCESSORY WHEEL, 16\", ALUMINUM, DESIGN 1", nextLine[7]);
	}

	/**
	 * Test issue 2263439 where an escaped quote was causing the parse to fail.
	 * Special thanks to Chris Morris for fixing this (id 1979054)
	 *
	 * @throws IOException But not really
	 */
	@Test
	public void libOpenCsvTestIssue2263439() throws IOException {
		csvParser = new CSVParserBuilder().withSeparator(',').withQuoteChar('\'').build();

		String[] nextLine = csvParser.parseLine(
				"865,0,'America\\'s_Most_Wanted','',294,0,0,0.734338696798625,'20081002052147',242429208,18448");

		assertEquals(11, nextLine.length);

		assertEquals("865", nextLine[0]);
		assertEquals("0", nextLine[1]);
		assertEquals("America's_Most_Wanted", nextLine[2]);
		assertEquals("", nextLine[3]);
		assertEquals("18448", nextLine[10]);

	}

	/**
	 * Test issue 2859181 where an escaped character before a character that did not
	 * need escaping was causing the parse to fail.
	 *
	 * @throws IOException But not really
	 */
	@Test
	public void libOpenCsvTestIssue2859181() throws IOException {
		csvParser = new CSVParserBuilder().withSeparator(';').build();
		String[] nextLine = csvParser.parseLine("field1;\\=field2;\"\"\"field3\"\"\""); // field1;\=field2;"""field3"""

		assertEquals(3, nextLine.length);

		assertEquals("field1", nextLine[0]);
		assertEquals("=field2", nextLine[1]);
		assertEquals("\"field3\"", nextLine[2]);

	}

	/**
	 * Test issue 2726363.
	 * <p>
	 * Data given: {@code
	 * "804503689","London",""London""shop","address","116.453182","39.918884"
	 * "453074125","NewYork","brief","address"","121.514683","31.228511"
	 * }
	 * </p>
	 * 
	 * @throws IOException But not really
	 */
	@Test
	public void libOpenCsvTestIssue2726363() throws IOException {

		String[] nextLine = csvParser
				.parseLine("\"804503689\",\"London\",\"\"London\"shop\",\"address\",\"116.453182\",\"39.918884\"");

		assertEquals(6, nextLine.length);

		assertEquals("804503689", nextLine[0]);
		assertEquals("London", nextLine[1]);
		assertEquals("\"London\"shop", nextLine[2]);
		assertEquals("address", nextLine[3]);
		assertEquals("116.453182", nextLine[4]);
		assertEquals("39.918884", nextLine[5]);

	}

	@Test
	public void libOpenCsvAnIOExceptionThrownIfStringEndsInsideAQuotedString() {
		final String part1 = "This,is a \"";
		final String part2 = "bad line to parse.";
		try {
			csvParser.parseLine(part1 + part2);
			fail("Exception should have been thrown.");
		} catch (IOException e) {
			assertTrue(e.getMessage().contains(part2));
		}
	}

	@Test
	public void libOpenCsvParseLineMultiAllowsQuotesAcrossMultipleLines() throws IOException {
		String[] nextLine = csvParser.parseLineMulti("This,\"is a \"good\" line\\\\ to parse");

		assertEquals(1, nextLine.length);
		assertEquals("This", nextLine[0]);
		assertTrue(csvParser.isPending());

		nextLine = csvParser.parseLineMulti("because we are using parseLineMulti.\"");

		assertEquals(1, nextLine.length);
		assertEquals("is a \"good\" line\\ to parse\nbecause we are using parseLineMulti.", nextLine[0]);
	}

	@Test
	public void libOpenCsvPendingIsClearedAfterCallToParseLine() throws IOException {
		String[] nextLine = csvParser.parseLineMulti("This,\"is a \"good\" line\\\\ to parse");

		assertEquals(1, nextLine.length);
		assertEquals("This", nextLine[0]);
		assertTrue(csvParser.isPending());

		nextLine = csvParser.parseLine("because we are using parseLineMulti.");

		assertEquals(1, nextLine.length);
		assertEquals("because we are using parseLineMulti.", nextLine[0]);
	}

	@Test
	public void libOpenCsvReturnPendingIfNullIsPassedIntoParseLineMulti() throws IOException {
		String[] nextLine = csvParser.parseLineMulti("This,\"is a \"goo\\d\" line\\\\ to parse\\");

		assertEquals(1, nextLine.length);
		assertEquals("This", nextLine[0]);
		assertTrue(csvParser.isPending());

		nextLine = csvParser.parseLineMulti(null);

		assertEquals(1, nextLine.length);
		assertEquals("is a \"good\" line\\ to parse\n", nextLine[0]);
	}

	@Test
	public void libOpenCsvSpacesAtEndOfQuotedStringDoNotCountIfStrictQuotesIsTrue() throws IOException {
		ICSVParser parser = new CSVParserBuilder().withStrictQuotes(true).build();
		String[] nextLine = parser.parseLine("\"Line with\", \"spaces at end\"  ");

		assertEquals(2, nextLine.length);
		assertEquals("Line with", nextLine[0]);
		assertEquals("spaces at end", nextLine[1]);
	}

	@Test
	public void libOpenCsvReturnNullWhenNullPassedIn() throws IOException {
		String[] nextLine = csvParser.parseLine(null);
		assertNull(nextLine);
	}

	@Test
	public void libOpenCsvValidateEscapeStringBeforeRealTest() {
		assertNotNull(ESCAPE_TEST_STRING);
		assertEquals(9, ESCAPE_TEST_STRING.length());
	}

	@Test
	public void libOpenCsvWhitespaceBeforeEscape() throws IOException {
		String[] nextItem = csvParser.parseLine("\"this\", \"is\",\"a test\""); // "this", "is","a test"
		assertEquals("this", nextItem[0]);
		assertEquals("is", nextItem[1]);
		assertEquals("a test", nextItem[2]);
	}

	@Test
	public void libOpenCsvTestIssue2958242WithoutQuotes() throws IOException {
		ICSVParser testParser = new CSVParserBuilder().withSeparator('\t').build();
		String[] nextItem = testParser.parseLine("zo\"\"har\"\"at\t10-04-1980\t29\tC:\\\\foo.txt");
		assertEquals(4, nextItem.length);
		assertEquals("zo\"har\"at", nextItem[0]);
		assertEquals("10-04-1980", nextItem[1]);
		assertEquals("29", nextItem[2]);
		assertEquals("C:\\foo.txt", nextItem[3]);
	}

	@Test
	public void libOpenCsvQuoteAndEscapeCannotBeTheSame() {

		Assertions.assertThatExceptionOfType(UnsupportedOperationException.class)
				.isThrownBy(() -> new CSVParserBuilder().withQuoteChar(ICSVParser.DEFAULT_QUOTE_CHARACTER)
						.withEscapeChar(ICSVParser.DEFAULT_QUOTE_CHARACTER).build());
	}

	@Test
	public void libOpenCsvQuoteAndEscapeCanBeTheSameIfNull() {
		new CSVParserBuilder().withQuoteChar(ICSVParser.NULL_CHARACTER).withEscapeChar(ICSVParser.NULL_CHARACTER)
				.build();
	}

	@Test
	public void libOpenCsvSeparatorCharacterCannotBeNull() {
		Assertions.assertThatExceptionOfType(UnsupportedOperationException.class)
				.isThrownBy(() -> new CSVParserBuilder().withSeparator(ICSVParser.NULL_CHARACTER).build());
	}

	@Test
	public void libOpenCsvSeparatorAndEscapeCannotBeTheSame() {
		Assertions.assertThatExceptionOfType(UnsupportedOperationException.class)
				.isThrownBy(() -> new CSVParserBuilder().withSeparator(ICSVParser.DEFAULT_SEPARATOR)
						.withEscapeChar(ICSVParser.DEFAULT_SEPARATOR).build());
	}

	@Test
	public void libOpenCsvSeparatorAndQuoteCannotBeTheSame() {
		String englishErrorMessage = null;
		try {
			new CSVParserBuilder().withSeparator(ICSVParser.DEFAULT_SEPARATOR)
					.withQuoteChar(ICSVParser.DEFAULT_SEPARATOR).build();
			fail("UnsupportedOperationException should have been thrown.");
		} catch (UnsupportedOperationException e) {
			englishErrorMessage = e.getLocalizedMessage();
		}

		// Now try with a different locale
		try {
			new CSVParserBuilder().withSeparator(ICSVParser.DEFAULT_SEPARATOR)
					.withQuoteChar(ICSVParser.DEFAULT_SEPARATOR).withErrorLocale(Locale.GERMAN).build();
			fail("UnsupportedOperationException should have been thrown.");
		} catch (UnsupportedOperationException e) {
			assertNotSame(englishErrorMessage, e.getLocalizedMessage());
		}
	}

	@Test
	public void libOpenCsvShouldSupportPortugueseLocale() {

		try {
			new CSVParserBuilder().withSeparator(ICSVParser.DEFAULT_SEPARATOR)
					.withQuoteChar(ICSVParser.DEFAULT_SEPARATOR).withErrorLocale(new Locale("pt", "BR")).build();
			fail("UnsupportedOperationException should have been thrown.");
		} catch (UnsupportedOperationException e) {
			assertEquals("O separador, delimitador de texto e caractere de escape precisam ser diferentes!",
					e.getLocalizedMessage());
		}
	}

	@Test
	public void libOpenCsvParserHandlesNullInString() throws IOException {
		String[] nextLine = csvParser.parseLine("because we are using\0 parseLineMulti.");

		assertEquals(1, nextLine.length);
		assertEquals("because we are using\0 parseLineMulti.", nextLine[0]);
	}

	@Test
	public void libOpenCsvFeatureRequest60ByDefaultEmptyFieldsAreBlank() throws IOException {
		StringBuilder sb = new StringBuilder(ICSVParser.INITIAL_READ_SIZE);

		sb.append(",,,\"\",");

		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.build();

		String[] item = parser.parseLine(sb.toString());

		assertEquals(5, item.length);
		assertEquals("", item[0]);
		assertEquals("", item[1]);
		assertEquals("", item[2]);
		assertEquals("", item[3]);
		assertEquals("", item[4]);
	}

	@Test
	public void libOpenCsvFeatureRequest60TreatEmptyFieldsAsNull() throws IOException {

		StringBuilder sb = new StringBuilder(ICSVParser.INITIAL_READ_SIZE);

		sb.append(", ,,\"\",");

		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withFieldAsNull(CSVReaderNullFieldIndicator.EMPTY_SEPARATORS).build();

		String[] item = parser.parseLine(sb.toString());

		assertEquals(5, item.length);
		assertNull(item[0]);
		assertEquals(" ", item[1]);
		assertNull(item[2]);
		assertEquals("", item[3]);
		assertNull(item[4]);

	}

	@Test
	public void libOpenCsvFeaturRequest60TreatEmptyDelimitedFieldsAsNull() throws IOException {
		StringBuilder sb = new StringBuilder(ICSVParser.INITIAL_READ_SIZE);

		sb.append(",\" \",,\"\",");

		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withFieldAsNull(CSVReaderNullFieldIndicator.EMPTY_QUOTES).build();

		String[] item = parser.parseLine(sb.toString());

		assertEquals(5, item.length);
		assertEquals("", item[0]);
		assertEquals(" ", item[1]);
		assertEquals("", item[2]);
		assertNull(item[3]);
		assertEquals("", item[4]);
	}

	@Test
	public void libOpenCsvFeatureRequest60TreatEmptyFieldsDelimitedOrNotAsNull() throws IOException {

		StringBuilder sb = new StringBuilder(ICSVParser.INITIAL_READ_SIZE);

		sb.append(", ,,\"\",");

		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withFieldAsNull(CSVReaderNullFieldIndicator.BOTH).build();

		String[] item = parser.parseLine(sb.toString());

		assertEquals(5, item.length);
		assertNull(item[0]);
		assertEquals(" ", item[1]);
		assertNull(item[2]);
		assertNull(item[3]);
		assertNull(item[4]);

	}

	@Test
	public void libOpenCsvTestStrictQuotesEndsFieldAtQuote() throws IOException {
		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withStrictQuotes(true).build();
		// "one","t"wo,"three"
		String[] nextLine = parser.parseLineMulti("\"one\",\"t\"wo,\"three\"");

		assertEquals(3, nextLine.length);

		assertEquals("one", nextLine[0]);
		assertEquals("t", nextLine[1]);
		assertEquals("three", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestStrictQuotesEndsFieldAtQuoteWithEscapedQuoteInMiddle() throws IOException {
		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withStrictQuotes(true).build();
		// "one","t""w"o,"three"
		String[] nextLine = parser.parseLineMulti("\"one\",\"t\"\"w\"o,\"three\"");

		assertEquals(3, nextLine.length);

		assertEquals("one", nextLine[0]);
		assertEquals("t\"w", nextLine[1]);
		assertEquals("three", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestNotStrictQuotesAllowsEmbeddedEscapedQuote() throws IOException {
		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withStrictQuotes(false).build();
		// "one","t"wo","three"
		String[] nextLine = parser.parseLineMulti("\"one\",\"t\"\"wo\",\"three\"");

		assertEquals(3, nextLine.length);

		assertEquals("one", nextLine[0]);
		assertEquals("t\"wo", nextLine[1]);
		assertEquals("three", nextLine[2]);
	}

	@Test
	public void libOpenCsvTestNotStrictQuotesAllowsEmbeddedQuote() throws IOException {
		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withStrictQuotes(false).build();
		// "one",t""wo,"three"
		String[] nextLine = parser.parseLineMulti("\"one\",t\"\"wo,\"three\"");

		assertEquals(3, nextLine.length);

		assertEquals("one", nextLine[0]);
		assertEquals("t\"wo", nextLine[1]);
		assertEquals("three", nextLine[2]);
	}

	@Test
	public void libOpenCsvIssue93ParsingEmptyDoubleQuoteField() throws IOException {
		CSVParserBuilder builder = new CSVParserBuilder();
		ICSVParser parser = builder.withStrictQuotes(false).build();
		// "",2
		String[] nextLine = parser.parseLineMulti("\"\",2");

		assertEquals(2, nextLine.length);

		assertTrue(nextLine[0].isEmpty());
		assertEquals("2", nextLine[1]);
	}

	@Test
	public void libOpenCsvParseToLineApplyQuotesToAllIsFalse() {
		String[] items = { "This", " is", " a", " test." };
		assertEquals("This, is, a, test.", csvParser.parseToLine(items, false));
	}

	@Test
	public void libOpenCsvParseToLineApplyQuotesToAllIsTrue() {
		String[] items = { "This", " is", " a", " test." };
		assertEquals("\"This\",\" is\",\" a\",\" test.\"", csvParser.parseToLine(items, true));
	}

	private static void _qaAllTokens(final boolean distributeReports, final boolean failJobIfanyDistributionFails,
			final String inputFilePath) throws Exception {

		List<String> tokens = Arrays.asList("0", "1", "2");

		// if (inputFilePath.endsWith(".csv"))
		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-qa-allTokens-distributeReports-" + distributeReports
						+ "-failJobIfanyDistributionFails-" + failJobIfanyDistributionFails) {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

				super.setUpMockEmail();

				ctx.settings.setEmailTo("${var17}");

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setFailJobIfAnyDistributionFails(failJobIfanyDistributionFails);

				ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		burster.burst(inputFilePath, true, StringUtils.EMPTY, -1);

		// assert number of emails in /quality-assurance if email is enabled
		// and 0 email files if email is disabled
		if (distributeReports)
			assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		else
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		// assert individual quality-assurance files
		for (String token : tokens) {

			if (!token.equals("1"))
				assertEquals(distributeReports,
						new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
								.exists());
			else
				assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
						.exists());

		}

		// assert 3 output files are generated
		assertEquals(3, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		boolean expectAllFilesToBeGenerated = true;
		// PdfTestUtils.assertDefaultResults(burster, tokens);
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, inputFilePath,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

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

	private static void _qaNewsletter(final boolean distributeReports, final boolean failJobIfanyDistributionFails,
			final String inputFilePath) throws Exception {

		List<String> tokens = Arrays.asList("0", "1", "2");

		// if (inputFilePath.endsWith(".csv"))
		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-qa-newsletter-distributeReports-" + distributeReports
						+ "-failJobIfanyDistributionFails-" + failJobIfanyDistributionFails) {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_NONE;

				super.setUpMockEmail();

				ctx.settings.setEmailTo("${var17}");

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setFailJobIfAnyDistributionFails(failJobIfanyDistributionFails);

				ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		burster.burst(inputFilePath, true, StringUtils.EMPTY, -1);

		// assert number of emails in /quality-assurance if email is enabled
		// and 0 email files if email is disabled
		if (distributeReports) {
			assertEquals(2, burster.getCtx().numberOfMessagesSent);
			assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		} else {
			assertEquals(0, burster.getCtx().numberOfMessagesSent);
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		}

		// assert individual quality-assurance files
		for (String token : tokens) {

			if (!token.equals("1"))
				assertEquals(distributeReports,
						new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
								.exists());
			else
				assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
						.exists());

		}

		// no output files => numberOfExtractedFiles should be 0
		assertEquals(0, burster.getCtx().numberOfExtractedFiles);

		// no output files => no attachments => numberOfDistributedFiles should be 0
		assertEquals(0, burster.getCtx().numberOfDistributedFiles);

		// no output files => no attachments => numberOfQuarantinedFiles should be 0
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);

	}

	private static void _qaListOfTokens(final boolean distributeReports, final boolean failJobIfanyDistributionFails,
			final String inputFilePath) throws Exception {

		List<String> tokens = Arrays.asList("0", "1", "2");

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-qa-listOfTokens-distributeReports-" + distributeReports
						+ "-failJobIfanyDistributionFails-" + failJobIfanyDistributionFails) {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

				super.setUpMockEmail();

				ctx.settings.setEmailTo("${col17}");

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setFailJobIfAnyDistributionFails(failJobIfanyDistributionFails);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_qualityassurance.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};

		};

		int howMany = QualityAssuranceTest.randomNumberInRange(1, 3);

		String testTokens = QualityAssuranceTest.pickSample(tokens, howMany).toString();

		testTokens = testTokens.substring(1, (testTokens.length() - 1));
		testTokens = testTokens.replaceAll(", ", ",");

		burster.burst(inputFilePath, false, testTokens, -1);

		List<String> listOfTestTokens = Arrays.asList(testTokens.split(","));

		// assert individual quality-assurance files
		for (String token : listOfTestTokens) {

			if (!token.equals("1"))
				assertEquals(distributeReports,
						new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
								.exists());
			else
				assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt")
						.exists());

		}

		boolean expectAllFilesToBeGenerated = false;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, inputFilePath,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);

		if ((listOfTestTokens.contains("1")) && (distributeReports))
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	}

	private static void _qaRandomTokens(final boolean distributeReports, final boolean failJobIfanyDistributionFails,
			String inputFilePath) throws Exception {

		CsvReporter burster = new TestBursterFactory.CsvReporter(StringUtils.EMPTY,
				"CsvReporterTest-qa-randomTokens-distributeReports-" + distributeReports
						+ "-failJobIfanyDistributionFails-" + failJobIfanyDistributionFails) {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

				super.setUpMockEmail();

				ctx.settings.setEmailTo("${var17}");

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setFailJobIfAnyDistributionFails(failJobIfanyDistributionFails);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_qualityassurance.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

			};
		};

		int howMany = QualityAssuranceTest.randomNumberInRange(1, 3);

		burster.burst(inputFilePath, false, StringUtils.EMPTY, howMany);

		// assert correct number (2) email QA files if distribute
		// corresponding quality-assurance files
		// are generated
		if (!distributeReports)
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		// assert only howMany output files are generated
		assertEquals(howMany, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		boolean expectAllFilesToBeGenerated = false;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, inputFilePath,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

		assertEquals(howMany, burster.getCtx().numberOfExtractedFiles);
		assertEquals(howMany, burster.getCtx().burstTokens.size());

		if (!distributeReports)
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);
		else
			assertEquals(burster.getCtx().burstTokens.size(),
					burster.getCtx().numberOfDistributedFiles + burster.getCtx().numberOfQuarantinedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);

	};

}
