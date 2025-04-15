package com.sourcekraft.documentburster.unit.documentation.userguide.reporting;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestBursterFactory.FixedWidthReporter;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.utils.CsvUtils;

public class FixedWidthReporterTest {

	private static final String PAYSLIPS_DOCX_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.docx";
	private static final String PAYSLIPS_HTML_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.html";

	private static final String FIXED_WIDTH_INPUT_BASIC_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/basic.txt";
	private static final String FIXED_WIDTH_INPUT_SKIP_LINES_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/skip-lines.txt";
	private static final String FIXED_WIDTH_INPUT_IGNORE_LEADING_WHITESPACE_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/ignore-leading-whitespace.txt";

	private static final String FIXED_WIDTH_INPUT_ID_COLUMN_NOT_USED_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/fixed-width-id-column-not-used.txt";
	private static final String FIXED_WIDTH_INPUT_ID_COLUMN_FIRST_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/fixed-width-id-column-first.txt";
	private static final String FIXED_WIDTH_INPUT_ID_COLUMN_LAST_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/fixed-width-id-column-last.txt";
	private static final String FIXED_WIDTH_INPUT_ID_COLUMN_INDEX_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/fixed-width-id-column-index.txt";
	private static final String FIXED_WIDTH_INPUT_NOHEADER_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/fixed-width-noheader.txt";
	private static final String FIXED_WIDTH_INPUT_HEADER_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/fixed-width-header.txt";

	@Test
	public final void generateReportsFromFixedWidthWithHeader() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromFixedWidthWithHeader") {
			protected void executeController() throws Exception {

				super.executeController();

				// Define column widths for the fixed width file
				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,14\n" + // SSN
						"col4,12\n" + // Date
						"col5,10\n" + // Department
						"col6,23\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,7\n" + // Tax
						"col17,4"; // Net

				// Explicitly set header to "firstline" (this is what we're testing)
				ctx.settings.getReportDataSource().fixedwidthoptions.header = "firstline";
				ctx.settings.getReportDataSource().fixedwidthoptions.skiplines = 1;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		burster.burst(FIXED_WIDTH_INPUT_HEADER_PATH, false, StringUtils.EMPTY, -1);

		// Verify basic parsing results - should have 3 data lines, not counting header
		assertEquals(3, burster.getParsedLines().size());
		assertEquals("Kyle Butford", burster.getParsedLines().get(1)[0]);
		assertEquals("2890", burster.getParsedLines().get(1)[16]);

		// Verify first data line is the actual first data line, not the header
		assertEquals("Clyde Grew", burster.getParsedLines().get(0)[0]);
		assertEquals("3790", burster.getParsedLines().get(0)[16]);

		// Verify files were generated only for data rows (not the header)
		String outputFolder = burster.getCtx().outputFolder + "/";
		File outputDir = new File(outputFolder);
		File[] generatedFiles = outputDir.listFiles(UtilsTest.outputFilesFilter);

		// Should have 3 output files (one for each data line, none for header)
		assertEquals(3, generatedFiles.length);

		// Check specific files were generated (using default ID column behavior)
		boolean found0 = false, found1 = false, found2 = false;
		for (File file : generatedFiles) {
			String fileName = file.getName();
			if (fileName.equals("0.docx"))
				found0 = true;
			if (fileName.equals("1.docx"))
				found1 = true;
			if (fileName.equals("2.docx"))
				found2 = true;
		}

		assertTrue("File 0.docx should be generated", found0);
		assertTrue("File 1.docx should be generated", found1);
		assertTrue("File 2.docx should be generated", found2);

		// Use the standard test utility to verify output files content
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_HEADER_PATH, true,
				CsvUtils.OUTPUT_TYPE_DOCX);
	}

	@Test
	public final void generateReportsFromFixedWidthNoHeader() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromFixedWidthNoHeader") {
			protected void executeController() throws Exception {

				super.executeController();

				// Define column widths for the fixed width file
				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,14\n" + // SSN
						"col4,12\n" + // Date
						"col5,10\n" + // Department
						"col6,23\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,7\n" + // Tax
						"col17,4"; // Net

				// Explicitly set header to "noheader" (this is what we're testing)
				ctx.settings.getReportDataSource().fixedwidthoptions.header = "noheader";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		burster.burst(FIXED_WIDTH_INPUT_NOHEADER_PATH, false, StringUtils.EMPTY, -1);

		// Verify basic parsing results
		assertEquals(3, burster.getParsedLines().size());
		assertEquals("Kyle Butford", burster.getParsedLines().get(1)[0]);
		assertEquals("2890", burster.getParsedLines().get(1)[16]);

		// Verify all lines were parsed as data (since there's no header)
		assertEquals("Clyde Grew", burster.getParsedLines().get(0)[0]);
		assertEquals("3790", burster.getParsedLines().get(0)[16]);

		// Verify files were generated for all rows (since none was treated as header)
		String outputFolder = burster.getCtx().outputFolder + "/";
		File outputDir = new File(outputFolder);
		File[] generatedFiles = outputDir.listFiles(UtilsTest.outputFilesFilter);

		// Should have 3 output files (one per input line since no header)
		assertEquals(3, generatedFiles.length);

		// Use the standard test utility to verify output files content
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_NOHEADER_PATH, true,
				CsvUtils.OUTPUT_TYPE_DOCX);
	}

	@Test
	public final void generateReportsFromFixedWidthUsingCustomColumnIndexAsId() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromFixedWidthUsingCustomColumnIndexAsId") {
			protected void executeController() throws Exception {

				super.executeController();

				// Define column widths for the fixed width file
				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,14\n" + // SSN
						"col4,12\n" + // Date
						"col5,10\n" + // Department
						"col6,23\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,7\n" + // Tax
						"col17,4"; // Net

				// Explicitly set ID column to "1" (custom index - second column, 0-based)
				ctx.settings.getReportDataSource().fixedwidthoptions.idcolumn = "1";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		burster.burst(FIXED_WIDTH_INPUT_ID_COLUMN_INDEX_PATH, false, StringUtils.EMPTY, -1);

		// Verify basic parsing results
		assertEquals(3, burster.getParsedLines().size());
		assertEquals("Kyle Butford", burster.getParsedLines().get(1)[0]);
		assertEquals("2890", burster.getParsedLines().get(1)[16]);

		// Verify files were generated using custom column index values as tokens
		String outputFolder = burster.getCtx().outputFolder + "/";
		File outputDir = new File(outputFolder);
		File[] generatedFiles = outputDir.listFiles(UtilsTest.outputFilesFilter);

		// Should have 3 output files (one per input line)
		assertEquals(3, generatedFiles.length);

		// Check that the files are named with ID column values (second column, index 1)
		boolean found1 = false, found2 = false, found3 = false;
		for (File file : generatedFiles) {
			String fileName = file.getName();

			if (fileName.equals("1.docx"))
				found1 = true;
			if (fileName.equals("2.docx"))
				found2 = true;
			if (fileName.equals("3.docx"))
				found3 = true;
		}

		assertTrue("File '1.docx' should be generated", found1);
		assertTrue("File '2.docx' should be generated", found2);
		assertTrue("File '3.docx' should be generated", found3);

		// Use the standard test utility to verify output files content
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_ID_COLUMN_INDEX_PATH,
				true, CsvUtils.OUTPUT_TYPE_DOCX);
	}

	@Test
	public final void generateReportsFromFixedWidthUsingLastColumnAsId() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromFixedWidthUsingLastColumnAsId") {
			protected void executeController() throws Exception {

				super.executeController();

				// Define column widths for the fixed width file
				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,14\n" + // SSN
						"col4,12\n" + // Date
						"col5,10\n" + // Department
						"col6,23\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,7\n" + // Tax
						"col17,4"; // Net

				// Explicitly set ID column to "lastcolumn" (this is what we're testing)
				ctx.settings.getReportDataSource().fixedwidthoptions.idcolumn = "lastcolumn";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		burster.burst(FIXED_WIDTH_INPUT_ID_COLUMN_LAST_PATH, false, StringUtils.EMPTY, -1);

		// Verify basic parsing results
		assertEquals(3, burster.getParsedLines().size());
		assertEquals("Kyle Butford", burster.getParsedLines().get(1)[0]);
		assertEquals("2890", burster.getParsedLines().get(1)[16]);

		// Verify files were generated using last column values as tokens
		String outputFolder = burster.getCtx().outputFolder + "/";
		File outputDir = new File(outputFolder);
		File[] generatedFiles = outputDir.listFiles(UtilsTest.outputFilesFilter);

		// Should have 3 output files (one per input line)
		assertEquals(3, generatedFiles.length);

		// Check that the files are named with last column values (net pay amounts)
		boolean found3790 = false, found2890 = false, found3590 = false;
		for (File file : generatedFiles) {
			String fileName = file.getName();

			if (fileName.equals("3790.docx"))
				found3790 = true;
			if (fileName.equals("2890.docx"))
				found2890 = true;
			if (fileName.equals("3590.docx"))
				found3590 = true;
		}

		assertTrue("File '3790.docx' should be generated", found3790);
		assertTrue("File '2890.docx' should be generated", found2890);
		assertTrue("File '3590.docx' should be generated", found3590);

		// Use the standard test utility to verify output files content
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_ID_COLUMN_LAST_PATH,
				true, CsvUtils.OUTPUT_TYPE_DOCX);
	}

	@Test
	public final void generateReportsFromFixedWidthUsingFirstColumnAsId() throws Exception {

		// Define path to test file

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromFixedWidthUsingFirstColumnAsId") {
			protected void executeController() throws Exception {

				super.executeController();

				// Define column widths for the fixed width file
				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,14\n" + // SSN
						"col4,12\n" + // Date
						"col5,10\n" + // Department
						"col6,23\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,7\n" + // Tax
						"col17,4"; // Net

				// Explicitly set ID column to "firstcolumn" (this is what we're testing)
				ctx.settings.getReportDataSource().fixedwidthoptions.idcolumn = "firstcolumn";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		burster.burst(FIXED_WIDTH_INPUT_ID_COLUMN_FIRST_PATH, false, StringUtils.EMPTY, -1);

		// Verify basic parsing results
		assertEquals(3, burster.getParsedLines().size());
		assertEquals("Kyle Butford", burster.getParsedLines().get(1)[0]);
		assertEquals("2890", burster.getParsedLines().get(1)[16]);

		// Verify files were generated using first column values as tokens
		String outputFolder = burster.getCtx().outputFolder + "/";
		File outputDir = new File(outputFolder);
		File[] generatedFiles = outputDir.listFiles(UtilsTest.outputFilesFilter);

		// Should have 3 output files (one per input line)
		assertEquals(3, generatedFiles.length);

		// Check that the files are named with first column values (with spaces replaced
		// by underscores)
		boolean foundClyde = false, foundKyle = false, foundAlfreda = false;
		for (File file : generatedFiles) {
			String fileName = file.getName();

			if (fileName.equals("Clyde Grew.docx"))
				foundClyde = true;
			if (fileName.equals("Kyle Butford.docx"))
				foundKyle = true;
			if (fileName.equals("Alfreda Waldback.docx"))
				foundAlfreda = true;
		}

		assertTrue("File 'Clyde_Grew.docx' should be generated", foundClyde);
		assertTrue("File 'Kyle_Butford.docx' should be generated", foundKyle);
		assertTrue("File 'Alfreda_Waldback.docx' should be generated", foundAlfreda);

		// Use the standard test utility to verify output files content
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_ID_COLUMN_FIRST_PATH,
				true, CsvUtils.OUTPUT_TYPE_DOCX);
	}

	@Test
	public final void generateReportsFromFixedWidthUsingNoIdColumn() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromFixedWidthUsingNoIdColumn") {
			protected void executeController() throws Exception {

				super.executeController();

				// Define column widths for the fixed width file
				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,14\n" + // SSN
						"col4,12\n" + // Date
						"col5,10\n" + // Department
						"col6,23\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,7\n" + // Tax
						"col17,4"; // Net

				// Explicitly set ID column to "notused" (this is what we're testing)
				ctx.settings.getReportDataSource().fixedwidthoptions.idcolumn = "notused";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			};
		};

		burster.burst(FIXED_WIDTH_INPUT_ID_COLUMN_NOT_USED_PATH, false, StringUtils.EMPTY, -1);

		// Verify basic parsing results
		assertEquals(3, burster.getParsedLines().size());
		assertEquals("Kyle Butford", burster.getParsedLines().get(1)[0]);
		assertEquals("2890", burster.getParsedLines().get(1)[16]);

		// Verify files were generated with sequential numbers as tokens
		String outputFolder = burster.getCtx().outputFolder + "/";
		File outputDir = new File(outputFolder);
		File[] generatedFiles = outputDir.listFiles(UtilsTest.outputFilesFilter);

		// Should have 3 output files (one per input line)
		assertEquals(3, generatedFiles.length);

		// Check that the files are named with sequential numbers (0.docx, 1.docx,
		// 2.docx)
		boolean found0 = false, found1 = false, found2 = false;
		for (File file : generatedFiles) {
			String fileName = file.getName();
			if (fileName.equals("0.docx"))
				found0 = true;
			if (fileName.equals("1.docx"))
				found1 = true;
			if (fileName.equals("2.docx"))
				found2 = true;
		}

		assertTrue("File 0.docx should be generated", found0);
		assertTrue("File 1.docx should be generated", found1);
		assertTrue("File 2.docx should be generated", found2);

		// Use the standard test utility to verify output files content
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				FIXED_WIDTH_INPUT_ID_COLUMN_NOT_USED_PATH, true, CsvUtils.OUTPUT_TYPE_DOCX);
	}

	@Test
	public final void generateHTMLReports() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateHTMLReports") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,13\n" + // SSN
						"col4,11\n" + // Date
						"col5,9\n" + // Department
						"col6,22\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,6\n" + // Tax
						"col17,6"; // No \n after last column

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			};
		};

		burster.burst(FIXED_WIDTH_INPUT_BASIC_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_BASIC_PATH,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_HTML);

	}

	@Test
	public final void generateReportsFromBasicFixedWidth() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromBasicFixedWidth") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2, 3\n" + // ID
						"col3, 13\n" + // SSN
						"col4, 11\n" + // Date
						"col5, 9\n" + // Department
						"col6, 22\n" + // Job Title
						"col7, 7\n" + // Base
						"col8, 7\n" + // Bonus
						"col9, 7\n" + // Commission
						"col10, 7\n" + // Misc1
						"col11, 7\n" + // Misc2
						"col12, 7\n" + // Misc3
						"col13, 7\n" + // Misc4
						"col14, 7\n" + // Misc5
						"col15, 7\n" + // Total
						"col16, 6\n" + // Tax
						"col17, 6"; // No \n after last column

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(FIXED_WIDTH_INPUT_BASIC_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_BASIC_PATH,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromSkipLines() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromSkipLines") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,16\n" + // Name
						"col2,3\n" + // ID
						"col3,13\n" + // SSN
						"col4,11\n" + // Date
						"col5,9\n" + // Department
						"col6,22\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,6\n" + // Tax
						"col17,6"; // No \n after last column

				ctx.settings.getReportDataSource().fixedwidthoptions.skiplines = 2;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(FIXED_WIDTH_INPUT_SKIP_LINES_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster, FIXED_WIDTH_INPUT_SKIP_LINES_PATH,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);

	}

	@Test
	public final void generateReportsFromIgnoreLeadingWhitespace() throws Exception {

		FixedWidthReporter burster = new TestBursterFactory.FixedWidthReporter(StringUtils.EMPTY,
				"FixedWidthReporterTest-generateReportsFromIgnoreLeadingWhitespace") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.settings.getReportDataSource().fixedwidthoptions.columns = "col1,18\n" + // Name
						"col2,3\n" + // ID
						"col3,13\n" + // SSN
						"col4,11\n" + // Date
						"col5,9\n" + // Department
						"col6,22\n" + // Job Title
						"col7,7\n" + // Base
						"col8,7\n" + // Bonus
						"col9,7\n" + // Commission
						"col10,7\n" + // Misc1
						"col11,7\n" + // Misc2
						"col12,7\n" + // Misc3
						"col13,7\n" + // Misc4
						"col14,7\n" + // Misc5
						"col15,7\n" + // Total
						"col16,6\n" + // Tax
						"col17,6"; // No \n after last column

				ctx.settings.getReportDataSource().fixedwidthoptions.ignoreleadingwhitespace = true;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;

			};
		};

		burster.burst(FIXED_WIDTH_INPUT_IGNORE_LEADING_WHITESPACE_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(burster,
				FIXED_WIDTH_INPUT_IGNORE_LEADING_WHITESPACE_PATH, expectAllFilesToBeGenerated,
				CsvUtils.OUTPUT_TYPE_DOCX);

	}

}