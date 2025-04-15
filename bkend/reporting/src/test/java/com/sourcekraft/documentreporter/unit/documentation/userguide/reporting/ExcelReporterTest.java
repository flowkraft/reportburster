package com.sourcekraft.documentreporter.unit.documentation.userguide.reporting;

import static org.junit.Assert.*;

import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.junit.Before;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.ExcelTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestBursterFactory.ExcelReporter;
import com.sourcekraft.documentburster.utils.CsvUtils;

public class ExcelReporterTest {

	private static final String PAYSLIPS_DOCX_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.docx";
	private static final String PAYSLIPS_HTML_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.html";
	private static final String PAYSLIPS_HTML_EXCEL_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template-excel.html";

	private static final String EXCEL_INPUT_STANDARD_PATH = "src/test/resources/input/unit/reporting/excelreporter/standard-data.xlsx";
	private static final String EXCEL_INPUT_HEADER_PATH = "src/test/resources/input/unit/reporting/excelreporter/header-test.xlsx";
	private static final String EXCEL_INPUT_FORMULA_PATH = "src/test/resources/input/unit/reporting/excelreporter/formula-test.xlsx";
	private static final String EXCEL_INPUT_MULTISHEET_PATH = "src/test/resources/input/unit/reporting/excelreporter/multisheet-test.xlsx";
	private static final String EXCEL_INPUT_WHITESPACE_PATH = "src/test/resources/input/unit/reporting/excelreporter/whitespace-test.xlsx";

	private static final String EXCEL_INPUT_MERGED_CELLS_COMPLEX_PATH = "src/test/resources/input/unit/reporting/excelreporter/complex-merged-cells.xlsx";
	private static final String EXCEL_INPUT_TABLES_COMPLEX_PATH = "src/test/resources/input/unit/reporting/excelreporter/complex-tables.xlsx";

	private static final String EXCEL_FORMULA_ID_TEST_PATH = "src/test/resources/input/unit/reporting/excelreporter/formula-id-test.xlsx";

	@Before
	public void setUp() {
		// Create test directories if they don't exist
		new File("src/test/resources/input/unit/reporting/excelreporter").mkdirs();

		// Generate test files if they don't exist
		if (!new File(EXCEL_INPUT_STANDARD_PATH).exists()) {
			ExcelTestUtils.generateTestExcelFile(EXCEL_INPUT_STANDARD_PATH, false, false, false);
		}
		if (!new File(EXCEL_INPUT_HEADER_PATH).exists()) {
			ExcelTestUtils.generateTestExcelFile(EXCEL_INPUT_HEADER_PATH, true, false, false);
		}
		if (!new File(EXCEL_INPUT_FORMULA_PATH).exists()) {
			ExcelTestUtils.generateTestExcelFile(EXCEL_INPUT_FORMULA_PATH, false, true, false);
		}
		if (!new File(EXCEL_INPUT_MULTISHEET_PATH).exists()) {
			ExcelTestUtils.generateTestExcelFile(EXCEL_INPUT_MULTISHEET_PATH, false, false, true);
		}
		if (!new File(EXCEL_INPUT_WHITESPACE_PATH).exists()) {
			ExcelTestUtils.generateTestExcelFile(EXCEL_INPUT_WHITESPACE_PATH, false, false, false, true);
		}
		if (!new File(EXCEL_FORMULA_ID_TEST_PATH).exists()) {
			ExcelTestUtils.generateFormulaIdExcelFile(EXCEL_FORMULA_ID_TEST_PATH);
		}
		if (!new File(EXCEL_INPUT_MERGED_CELLS_COMPLEX_PATH).exists()) {
			ExcelTestUtils.generateComplexExcelFile(EXCEL_INPUT_MERGED_CELLS_COMPLEX_PATH, true, // with merged cells
					false, // no tables
					false // no data validation
			);
		}
	}

	@Test
	public final void generateReportsFromExcelWithMergedCellsComplex() throws Exception {

		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromExcelWithMergedCellsComplex") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use first line as header (common with merged cells)
				ctx.settings.getReportDataSource().exceloptions.header = "firstline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 1;

				ctx.settings.getReportDataSource().exceloptions.idcolumn = "firstcolumn";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			};
		};

		reporter.burst(EXCEL_INPUT_MERGED_CELLS_COMPLEX_PATH, false, StringUtils.EMPTY, -1);

		// Verify rows were parsed correctly despite merged cells
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		assertEquals("parsedLines.size() should be 5", 5, parsedLines.size());

		// Verify all rows were processed and have correct content
		// The first row should contain the first data row after the merged header
		assertEquals("First row data column 1", parsedLines.get(0)[0]);

		// Check that content from merged cells is repeated in all affected cells
		boolean foundRepeatedMergedContent = false;
		for (String[] row : parsedLines) {
			// Look for identical consecutive values that would indicate a merged cell
			for (int i = 0; i < row.length - 1; i++) {
				if (row[i] != null && row[i].equals(row[i + 1]) && row[i].contains("Merged")) {
					foundRepeatedMergedContent = true;
					break;
				}
			}
		}

		assertTrue("Should have found content from merged cells", foundRepeatedMergedContent);

		for (String[] row : parsedLines) {
			String expectedToken = row[0]; // Formula result in column 2
			File outputFile = new File(reporter.getCtx().outputFolder + "/" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}

	}

	@Test
	public final void generateReportsFromExcelWithTablesComplex() throws Exception {

		// Create test file with Excel tables
		if (!new File(EXCEL_INPUT_TABLES_COMPLEX_PATH).exists()) {
			ExcelTestUtils.generateComplexExcelFile(EXCEL_INPUT_TABLES_COMPLEX_PATH, false, // no merged cells
					true, // with tables
					false // no data validation
			);
		}

		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromExcelWithTablesComplex") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Excel tables typically have headers
				ctx.settings.getReportDataSource().exceloptions.header = "firstline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 1;

				ctx.settings.getReportDataSource().exceloptions.idcolumn = "firstcolumn";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			};
		};

		reporter.burst(EXCEL_INPUT_TABLES_COMPLEX_PATH, false, StringUtils.EMPTY, -1);

		// Verify Excel table data was parsed correctly
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		assertEquals("parsedLines.size() should be 5", 5, parsedLines.size());

		// Verify all rows in the Excel table were processed
		assertEquals("Data in table should be extracted", "Table Row 1", parsedLines.get(0)[0]);

		for (int i = 0; i < parsedLines.size(); i++) {
			String expectedToken = parsedLines.get(i)[0];
			File outputFile = new File(reporter.getCtx().outputFolder + "/" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsWithCombinedOptions() throws Exception {
		// Define path to test file - we'll use the formula test file since it has
		// formulas
		String EXCEL_INPUT_COMBINED_TEST_PATH = "src/test/resources/input/unit/reporting/excelreporter/combined-options-test.xlsx";

		// Create a test file with headers and formulas if it doesn't exist
		if (!new File(EXCEL_INPUT_COMBINED_TEST_PATH).exists()) {
			ExcelTestUtils.generateTestExcelFile(EXCEL_INPUT_COMBINED_TEST_PATH, true, // with header
					true, // with formulas
					false, // single sheet
					true // with whitespace
			);
		}

		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsWithCombinedOptions") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Set combination of options to test together
				ctx.settings.getReportDataSource().exceloptions.header = "multiline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 2;
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "1";
				ctx.settings.getReportDataSource().exceloptions.useformularesults = true;
				ctx.settings.getReportDataSource().exceloptions.ignoreleadingwhitespace = true;
				ctx.settings.getReportDataSource().exceloptions.sheetindex = 0;

				// Set custom filename to verify ID column usage
				ctx.settings.setBurstFileName("Column1-${burst_token}.${output_type_extension}");

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			};
		};

		reporter.burst(EXCEL_INPUT_COMBINED_TEST_PATH, false, StringUtils.EMPTY, -1);

		// 1. Verify the multiline header was correctly skipped (2 lines + header)
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		assertEquals("parsedLines.size() must be 6", 6, parsedLines.size());

		// First data row should be the 4th row in the file (after header + 2 skipped
		// lines)
		// The exact value will depend on your test file, but it should not be header
		// content
		assertFalse("First parsed row should not be header content",
				parsedLines.get(0)[0].toLowerCase().contains("column"));

		// 2. Verify formulas were interpreted as results (not formula text)
		// Find a cell that would contain a formula and verify it doesn't start with "="
		boolean foundFormulaResult = false;
		for (String[] row : parsedLines) {
			for (String cell : row) {
				if (cell != null && !cell.isEmpty() && !cell.startsWith("=") && cell.matches("\\d+(\\.\\d+)?")) { // Simple
																													// numeric
																													// check
					foundFormulaResult = true;
					break;
				}
			}
		}
		assertTrue("Should have found at least one formula result", foundFormulaResult);

		// 3. Verify the specified ID column (index 1) was used for tokens
		String outputFolder = reporter.getCtx().outputFolder + "/";
		File outputDir = new File(outputFolder);
		File[] generatedFiles = outputDir.listFiles(
				file -> file.isFile() && file.getName().endsWith(".pdf") && file.getName().startsWith("Column1-"));

		assertTrue("Should have generated output files", generatedFiles.length > 0);

		// 4. Verify the ID column values match those in the parsed data
		Set<String> expectedTokens = new HashSet<>();
		for (String[] row : parsedLines) {
			expectedTokens.add(row[1]); // Column index 1 (second column)
		}

		for (File file : generatedFiles) {
			String filename = file.getName();
			// Extract token from "Column1-[token].pdf"
			String token = filename.substring(8, filename.length() - 4);
			assertTrue("File token " + token + " should be from column 1 data", expectedTokens.contains(token));
		}

		// 5. Verify whitespace was trimmed due to ignoreleadingwhitespace=true
		boolean allTrimmed = true;
		for (String[] row : parsedLines) {
			for (String cell : row) {
				if (cell != null && cell.startsWith(" ")) {
					allTrimmed = false;
					break;
				}
			}
		}
		assertTrue("All cells should have leading whitespace removed", allTrimmed);
	}

	@Test
	public final void generateHTMLReports() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateHTMLReports") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Set output type to HTML in settings
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			}
		};

		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(reporter, EXCEL_INPUT_STANDARD_PATH,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_HTML);
	}

	@Test
	public final void generatePDFReports() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generatePDFReports") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			}
		};

		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(reporter, EXCEL_INPUT_STANDARD_PATH,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_PDF);
	}

	@Test
	public final void generateDocxReports() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateDocxReports") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_DOCX_TEMPLATE_PATH;
			}
		};

		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);

		boolean expectAllFilesToBeGenerated = true;
		TestBursterFactory.assertThatCorrectOutputReportsWereGenerated(reporter, EXCEL_INPUT_STANDARD_PATH,
				expectAllFilesToBeGenerated, CsvUtils.OUTPUT_TYPE_DOCX);
	}

	@Test
	public final void generateReportsFromHeaderFirstLine() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromHeaderFirstLine") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use first row as header
				ctx.settings.getReportDataSource().exceloptions.header = "firstline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 1;

			}
		};

		reporter.burst(EXCEL_INPUT_HEADER_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify first data row is actually the second row in the file
		assertNotNull(parsedLines);
		assertEquals("parsedLines.size() should be 5", 5, parsedLines.size());

		// First row should be data (header row was skipped)
		assertEquals("Data Row 1", parsedLines.get(0)[0]);
	}

	@Test
	public final void generateReportsFromHeaderNoHeader() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromHeaderNoHeader") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to not treat any row as header
				ctx.settings.getReportDataSource().exceloptions.header = "noheader";
			}
		};

		reporter.burst(EXCEL_INPUT_HEADER_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify first data row is actually the first row in the file
		assertNotNull(parsedLines);
		assertTrue(parsedLines.size() > 0);

		// First row should be header (since we're not skipping it)
		assertEquals("Column 1", parsedLines.get(0)[0]);
	}

	@Test
	public final void generateReportsFromHeaderMultiLine() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromHeaderMultiLine") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to skip multiple header lines
				ctx.settings.getReportDataSource().exceloptions.header = "multiline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 2;
			}
		};

		reporter.burst(EXCEL_INPUT_HEADER_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify we skipped the first two rows
		assertNotNull(parsedLines);
		assertEquals("parsedLines.size() should be 4", 4, parsedLines.size());

		// First row should be the third row in the file
		assertEquals("Data Row 2", parsedLines.get(0)[0]);
	}

	@Test
	public final void generateReportsFromUsingFirstColumnAsId() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromUsingFirstColumnAsId") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use first column as ID
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "firstcolumn";
				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("FirstColumn-${burst_token}.${output_type_extension}");
				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			}
		};

		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know what values to expect in filenames
		List<String[]> parsedLines = reporter.getParsedExcelLines();
		assertNotNull("Parsed lines should not be null", parsedLines);

		assertEquals(3, parsedLines.size());

		// Verify that output files exist with the expected filenames based on first
		// column
		for (String[] row : parsedLines) {
			String expectedToken = row[0];
			File outputFile = new File(reporter.getCtx().outputFolder + "/FirstColumn-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromUsingLastColumnAsId() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromUsingLastColumnAsId") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use last column as ID
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "lastcolumn";
				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("LastColumn-${burst_token}.${output_type_extension}");

				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			}
		};

		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know what values to expect in filenames
		List<String[]> parsedLines = reporter.getParsedExcelLines();
		assertEquals("parsedLines.size() should be 3", 3, parsedLines.size());

		// Verify that output files exist with the expected filenames based on last
		// column
		for (String[] row : parsedLines) {
			String expectedToken = row[row.length - 1];
			File outputFile = new File(reporter.getCtx().outputFolder + "/LastColumn-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromUsingCustomColumnIndexAsId() throws Exception {
		final int columnIndex = 2; // Use third column (index 2)

		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromUsingCustomColumnIndexAsId") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use specific column index as ID
				ctx.settings.getReportDataSource().exceloptions.idcolumn = String.valueOf(columnIndex);
				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("Column" + columnIndex + "-${burst_token}.${output_type_extension}");
				// Set output type to ensure consistent extension
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			}
		};

		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know what values to expect in filenames
		List<String[]> parsedLines = reporter.getParsedExcelLines();
		assertEquals("Sheet should have 3 rows", 3, parsedLines.size());

		// Verify that output files exist with the expected filenames based on specified
		// column
		for (String[] row : parsedLines) {
			String expectedToken = row[columnIndex];
			File outputFile = new File(
					reporter.getCtx().outputFolder + "/Column" + columnIndex + "-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromUsingIdColumnNotUsed() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromUsingIdColumnNotUsed") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use sequential numbering instead of columns
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "notused";
				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("SequenceNum-${burst_token}.${output_type_extension}");

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;
			}
		};

		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines to know how many files to expect
		List<String[]> parsedLines = reporter.getParsedExcelLines();
		assertEquals("parsedLines.size() should be 3", 3, parsedLines.size());

		// Verify that output files exist with the expected filenames based on sequence
		// number
		for (int i = 0; i < parsedLines.size(); i++) {
			String expectedToken = String.valueOf(i);
			File outputFile = new File(reporter.getCtx().outputFolder + "/SequenceNum-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test
	public final void generateReportsFromFormulasUseResults() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromFormulasUseResults") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use formula results
				ctx.settings.getReportDataSource().exceloptions.useformularesults = true;
			}
		};

		reporter.burst(EXCEL_INPUT_FORMULA_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify formula cells contain results, not formulas
		assertNotNull(parsedLines);
		assertTrue(parsedLines.size() > 0);

		// Check a cell that contains a SUM formula
		// This assumes your test file has a SUM formula in cell C2
		String formulaResult = parsedLines.get(0)[2];
		assertFalse(formulaResult.startsWith("SUM"));

		// The result should be numeric
		try {
			Double.parseDouble(formulaResult);
		} catch (NumberFormatException e) {
			fail("Formula result is not a valid number: " + formulaResult);
		}
	}

	@Test
	public final void generateReportsFromFormulasUseFormulas() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromFormulasUseFormulas") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use formula text instead of results
				ctx.settings.getReportDataSource().exceloptions.useformularesults = false;
			}
		};

		reporter.burst(EXCEL_INPUT_FORMULA_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify formula cells contain formulas, not results
		assertNotNull(parsedLines);
		assertTrue(parsedLines.size() > 0);

		// Check a cell that contains a SUM formula
		// This assumes your test file has a SUM formula in cell C6
		String formulaText = parsedLines.get(5)[2];
		assertTrue("Expected formula to start with SUM but got: " + formulaText, formulaText.startsWith("SUM"));
	}

	@Test
	public final void generateReportsFromCustomSheetIndex() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromCustomSheetIndex") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to use second sheet (index 1)
				ctx.settings.getReportDataSource().exceloptions.sheetindex = 1;
			}
		};

		reporter.burst(EXCEL_INPUT_MULTISHEET_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify we're getting data from the second sheet
		assertNotNull(parsedLines);
		assertTrue(parsedLines.size() > 0);

		// Assuming the second sheet has a cell with "Sheet2" in cell A1
		assertEquals("Sheet2", parsedLines.get(0)[0]);
	}

	@Test
	public final void generateReportsFromIgnoreLeadingWhitespace() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromIgnoreLeadingWhitespace") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to ignore leading whitespace
				ctx.settings.getReportDataSource().exceloptions.ignoreleadingwhitespace = true;
			}
		};

		reporter.burst(EXCEL_INPUT_WHITESPACE_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify whitespace is trimmed
		assertNotNull(parsedLines);
		assertTrue(parsedLines.size() > 0);

		// Assuming there's a cell with leading whitespace in the test file
		for (String[] row : parsedLines) {
			for (String cell : row) {
				if (cell != null && !cell.isEmpty()) {
					assertFalse("Cell value should not have leading whitespace: '" + cell + "'", cell.startsWith(" "));
				}
			}
		}
	}

	@Test
	public final void generateReportsFromPreserveLeadingWhitespace() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromPreserveLeadingWhitespace") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure to preserve leading whitespace
				ctx.settings.getReportDataSource().exceloptions.ignoreleadingwhitespace = false;
			}
		};

		reporter.burst(EXCEL_INPUT_WHITESPACE_PATH, false, StringUtils.EMPTY, -1);

		// Get the parsed lines
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		// Verify whitespace is preserved
		assertNotNull(parsedLines);
		assertTrue(parsedLines.size() > 0);

		// Test assumes cell at index [1][1] has leading whitespace
		assertTrue("Cell should NOT have leading whitespace", !parsedLines.get(4)[1].startsWith(" "));
		assertTrue("Cell should have leading whitespace", parsedLines.get(5)[1].startsWith(" "));
	}

	@Test
	public final void generateReportsFromFormulaBasedIdColumn() throws Exception {

		// Create reporter with configuration for formula-based ID
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromFormulaBasedIdColumn") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use formula results
				ctx.settings.getReportDataSource().exceloptions.useformularesults = true;

				// Configure to use column with formulas (index 2) as ID
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "2";

				// Configure to use first row as header
				ctx.settings.getReportDataSource().exceloptions.header = "firstline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 1;

				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("FormulaID-${burst_token}.${output_type_extension}");

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			}
		};

		// Burst the test file
		reporter.burst(EXCEL_FORMULA_ID_TEST_PATH, false, StringUtils.EMPTY, -1);

		// Get parsed lines for verification
		List<String[]> parsedLines = reporter.getParsedExcelLines();

		assertEquals("parsedLines.size() should be 5", 5, parsedLines.size());

		// Verify that output files exist with the expected filenames based on formula
		// results
		for (String[] row : parsedLines) {
			String expectedToken = row[2]; // Formula result in column 2
			File outputFile = new File(reporter.getCtx().outputFolder + "/FormulaID-" + expectedToken + ".pdf");
			assertTrue("Output file should exist: " + outputFile.getPath(), outputFile.exists());
			assertFalse("Formula token should not contain '=' or 'CONCATENATE'",
					expectedToken.contains("=") || expectedToken.contains("CONCATENATE"));
		}

		// Verify formula results were used instead of formula expressions
		for (String[] row : parsedLines) {
			String formulaResult = row[2];
			// Check that result follows expected pattern (FirstX-LastX)
			assertTrue("Formula result should be properly concatenated", formulaResult.matches("First\\d-Last\\d"));
		}
	}

	@Test
	public final void generateReportsFromMultiSheetWithVaryingWidths() throws Exception {
		// Define path for test file with varying sheet widths
		String EXCEL_VARYING_WIDTHS_PATH = "src/test/resources/input/unit/reporting/excelreporter/varying-widths-test.xlsx";

		// Create the test file if it doesn't exist
		if (!new File(EXCEL_VARYING_WIDTHS_PATH).exists()) {
			ExcelTestUtils.generateVaryingColumnWidthsExcelFile(EXCEL_VARYING_WIDTHS_PATH);
		}

		// Create reporter with configuration to process both sheets
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromMultiSheetWithVaryingWidths-Sheet1") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use last column as ID, regardless of width
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "lastcolumn";

				// Configure to use first row as header
				ctx.settings.getReportDataSource().exceloptions.header = "firstline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 1;

				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("Sheet1-${burst_token}.${output_type_extension}");

				// Set sheet index to first sheet (has 5 columns)
				ctx.settings.getReportDataSource().exceloptions.sheetindex = 0;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;

			}
		};

		// Burst the first sheet
		reporter.burst(EXCEL_VARYING_WIDTHS_PATH, false, StringUtils.EMPTY, -1);

		// Get parsed lines for first sheet
		List<String[]> parsedLinesSheet1 = reporter.getParsedExcelLines();
		assertNotNull("Parsed lines for sheet 1 should not be null", parsedLinesSheet1);
		assertEquals("Sheet 1 should have 3 rows", 3, parsedLinesSheet1.size());

		// Verify column count for first sheet
		assertEquals("Sheet 1 should have 5 columns", 5, parsedLinesSheet1.get(0).length);

		// Verify last column is used as ID for files
		for (String[] row : parsedLinesSheet1) {
			String expectedToken = row[4]; // Last column (index 4) of sheet 1
			File outputFile = new File(reporter.getCtx().outputFolder + "/Sheet1-" + expectedToken + ".pdf");
			assertTrue("Output file from sheet 1 should exist: " + outputFile.getPath(), outputFile.exists());
		}

		// Now test the second sheet with fewer columns
		ExcelReporter reporter2 = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromMultiSheetWithVaryingWidths-Sheet2") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure to use last column as ID, regardless of width
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "lastcolumn";

				// Configure to use first row as header
				ctx.settings.getReportDataSource().exceloptions.header = "firstline";
				ctx.settings.getReportDataSource().exceloptions.skiplines = 1;

				// Set custom filename to clearly show which token is used
				ctx.settings.setBurstFileName("Sheet2-${burst_token}.${output_type_extension}");

				// Set sheet index to second sheet (has 3 columns)
				ctx.settings.getReportDataSource().exceloptions.sheetindex = 1;

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_PDF;
				ctx.settings.getReportTemplate().documentpath = PAYSLIPS_HTML_TEMPLATE_PATH;
			}
		};

		// Burst the second sheet
		reporter2.burst(EXCEL_VARYING_WIDTHS_PATH, false, StringUtils.EMPTY, -1);

		// Get parsed lines for second sheet
		List<String[]> parsedLinesSheet2 = reporter2.getParsedExcelLines();
		assertNotNull("Parsed lines for sheet 2 should not be null", parsedLinesSheet2);
		assertTrue("Should have parsed at least one data row from sheet 2", parsedLinesSheet2.size() > 0);
		assertEquals("Sheet 2 should have 2 rows", 2, parsedLinesSheet2.size());

		// Verify column count for second sheet
		assertEquals("Sheet 2 should have 3 columns", 3, parsedLinesSheet2.get(0).length);

		// Verify last column is used as ID for files, though sheet has fewer columns
		for (String[] row : parsedLinesSheet2) {
			String expectedToken = row[2]; // Last column (index 2) of sheet 2
			File outputFile = new File(reporter2.getCtx().outputFolder + "/Sheet2-" + expectedToken + ".pdf");
			assertTrue("Output file from sheet 2 should exist: " + outputFile.getPath(), outputFile.exists());
		}
	}

	@Test(expected = IllegalArgumentException.class)
	public final void generateReportsFromInvalidIdColumn() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromInvalidIdColumn") {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure with invalid ID column
				ctx.settings.getReportDataSource().exceloptions.idcolumn = "invalid-value";
			}
		};

		// This should throw IllegalArgumentException
		reporter.burst(EXCEL_INPUT_STANDARD_PATH, false, StringUtils.EMPTY, -1);
	}

	@Test(expected = Exception.class)
	public final void generateReportsFromNonExistentFile() throws Exception {
		ExcelReporter reporter = new TestBursterFactory.ExcelReporter(StringUtils.EMPTY,
				"ExcelReporterTest-generateReportsFromNonExistentFile");

		// This should throw Exception
		reporter.burst("non-existent-file.xlsx", false, StringUtils.EMPTY, -1);
	}
}