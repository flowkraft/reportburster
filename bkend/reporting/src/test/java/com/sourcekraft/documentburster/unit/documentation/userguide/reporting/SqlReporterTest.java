package com.sourcekraft.documentburster.unit.documentation.userguide.reporting;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster._helpers.NorthwindTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.utils.CsvUtils;

/**
 * Tests for the SQL reporter functionality.
 */
public class SqlReporterTest {

	private static final Logger log = LoggerFactory.getLogger(SqlReporterTest.class);

	@BeforeClass
	public static void setUpBeforeClass() throws Exception {

		// Create test templates using the enhanced utility method
		NorthwindTestUtils.ensureReportingTemplates();

		// Set up database
		NorthwindTestUtils.setupTestDatabase();
	}

	@AfterClass
	public static void tearDownAfterClass() throws Exception {
		// Clean up - can be uncommented to preserve test output for inspection
		// File outputFolder = new File(TEST_OUTPUT_PATH);
		// if (outputFolder.exists())
		// FileUtils.deleteDirectory(outputFolder);
	}

	@Before
	public void setUp() throws Exception {
	}

	@After
	public void tearDown() throws Exception {
	}

	/**
	 * Tests basic SQL reporting with H2 database.
	 */
	@Test
	public void testBasicSqlReporting() throws Exception {
		final String TEST_NAME = "SqlReporterTest-Basic";
		log.info("========== Starting test: {} ==========", TEST_NAME);

		// Create reporter
		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(StringUtils.EMPTY, TEST_NAME,
				NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure SQL
				ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "CustomerID";
				ctx.settings
						.getReportDataSource().sqloptions.query = "SELECT \"CustomerID\", \"CompanyName\", \"Country\" FROM \"Customers\" WHERE \"Country\" = 'Germany'";

				// Configure output
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				ctx.settings.getReportTemplate().documentpath = NorthwindTestUtils.CUSTOMER_SUMMARY_TEMPLATE_DOCX;
				ctx.settings.setBurstFileName("${burst_token}.docx");
			}
		};

		// Execute the burst process
		reporter.burst();

		// Verify results
		List<String[]> parsedLines = TestsUtils.toArrayRows(reporter.getCtx().reportData);

		assertNotNull("Parsed lines should not be null", parsedLines);
		assertFalse("Parsed lines should not be empty", parsedLines.isEmpty());

		// Check that reportColumnNames contains expected headers
		assertNotNull("Column names should not be null", reporter.getCtx().reportColumnNames);
		assertTrue("Should have at least 3 columns", reporter.getCtx().reportColumnNames.size() >= 3);
		assertEquals("CustomerID", reporter.getCtx().reportColumnNames.get(0));
		assertEquals("CompanyName", reporter.getCtx().reportColumnNames.get(1));
		assertEquals("Country", reporter.getCtx().reportColumnNames.get(2));

		// Verify a specific German customer
		boolean foundAlfreds = false;
		for (int i = 0; i < parsedLines.size(); i++) {
			String[] row = parsedLines.get(i);
			if ("ALFKI".equals(row[0])) {
				foundAlfreds = true;
				assertEquals("Alfreds Futterkiste", row[1]);
				assertEquals("Germany", row[2]);
				break;
			}
		}
		assertTrue("ALFKI customer should be found in results", foundAlfreds);

		// Verify document generation
		assertTrue("ALFKI document should exist", new File(reporter.getCtx().outputFolder + "/ALFKI.docx").exists());

		// Verify row count and tokens
		assertEquals("Unexpected number of rows", 11, parsedLines.size());
		assertEquals("Unexpected number of tokens", 11, reporter.getCtx().burstTokens.size());
		// Verify variable parsing for ALFKI
		Map<String, Object> userVars = reporter.getCtx().variables.getUserVariables("ALFKI");
		assertEquals("var0 should match", "ALFKI", userVars.get("var0"));
		assertEquals("col0 should match", "ALFKI", userVars.get("col0"));
		assertEquals("col1 should match", "Alfreds Futterkiste", userVars.get("col1"));
		assertEquals("col2 should match", "Germany", userVars.get("col2"));
		// Verify named variables (case might depend on DB/JDBC driver, H2 seems to
		// return uppercase)
		assertEquals("CustomerID should match", "ALFKI", userVars.get("CustomerID"));
		assertEquals("CompanyName should match", "Alfreds Futterkiste", userVars.get("CompanyName"));
		assertEquals("Country should match", "Germany", userVars.get("Country"));

		log.info("Test completed successfully: {}", TEST_NAME);
	}

	@Test
	public void testSqlReportingWithJava8StreamTransformation() throws Exception {
		NorthwindTestUtils.runDataTransformationTest("java8stream");
	}

	@Test
	public void testSqlReportingWithCalciteTransformation() throws Exception {
		NorthwindTestUtils.runDataTransformationTest("calcite");
	}

	@Test
	public void testSqlReportingWithDflibTransformation() throws Exception {
		NorthwindTestUtils.runDataTransformationTest("dflib");
	}

	@Test
	public void testCustomerStatementReport() throws Exception {
		final String TEST_NAME = "SqlReporterTest-CustomerStatement";
		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(StringUtils.EMPTY, TEST_NAME,
				NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure SQL for single-customer statement
				ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "CustomerID";
				ctx.settings
						.getReportDataSource().sqloptions.query = "SELECT c.CustomerID AS CustomerID, c.CompanyName AS CompanyName,"
								+ " COUNT(o.OrderID) AS TotalOrders," + " SUM(o.Freight) AS TotalFreight,"
								+ " SUM(CASE WHEN o.ShippedDate IS NULL THEN o.Freight ELSE 0 END) AS OutstandingBalance"
								+ " FROM Customers c" + " LEFT JOIN Orders o ON c.CustomerID=o.CustomerID"
								+ " WHERE c.CustomerID='ALFKI'" + " GROUP BY c.CustomerID, c.CompanyName";

				// ctx.scripts.transformFetchedData =
				// "transformFetchedData_removeheader.groovy";

				// Use statement HTML template
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
				ctx.settings.getReportTemplate().documentpath = NorthwindTestUtils.CUSTOMER_STATEMENT_TEMPLATE_HTML;
				ctx.settings.setBurstFileName("${burst_token}.html");
			}
		};
		// Execute report
		reporter.burst();
		// Verify parsed data
		List<String[]> parsed = TestsUtils.toArrayRows(reporter.getCtx().reportData);
		assertEquals(1, parsed.size());
		// String[] header = parsed.get(0);
		// assertArrayEquals(
		// new String[] { "CustomerID", "CompanyName", "TotalOrders", "TotalFreight",
		// "OutstandingBalance" },
		// header);
		String[] row = parsed.get(0);
		assertEquals("ALFKI", row[0]);
		assertEquals("Alfreds Futterkiste", row[1]);
		assertTrue(Integer.parseInt(row[2]) > 0);
		assertTrue(Double.parseDouble(row[3]) >= 0.0);
		assertTrue(Double.parseDouble(row[4]) >= 0.0);
		// Verify HTML output file
		assertTrue(new File(reporter.getCtx().outputFolder + "/ALFKI.html").exists());
	}

}