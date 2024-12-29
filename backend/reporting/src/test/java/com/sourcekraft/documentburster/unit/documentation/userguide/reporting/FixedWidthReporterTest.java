package com.sourcekraft.documentburster.unit.documentation.userguide.reporting;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestBursterFactory.FixedWidthReporter;
import com.sourcekraft.documentburster.utils.CsvUtils;

public class FixedWidthReporterTest {

	private static final String PAYSLIPS_DOCX_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.docx";
	private static final String PAYSLIPS_HTML_TEMPLATE_PATH = "src/main/external-resources/template/samples/reports/payslips/payslips-template.html";

	private static final String FIXED_WIDTH_INPUT_BASIC_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/basic.txt";
	private static final String FIXED_WIDTH_INPUT_SKIP_LINES_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/skip-lines.txt";
	private static final String FIXED_WIDTH_INPUT_IGNORE_LEADING_WHITESPACE_PATH = "src/test/resources/input/unit/reporting/fixedwidthreporter/ignore-leading-whitespace.txt";

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