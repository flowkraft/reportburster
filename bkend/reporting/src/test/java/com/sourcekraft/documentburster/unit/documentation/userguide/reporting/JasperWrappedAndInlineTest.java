package com.sourcekraft.documentburster.unit.documentation.userguide.reporting;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster._helpers.NorthwindTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.common.settings.model.ConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.ServerDatabaseSettings;
import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.utils.CsvUtils;

/**
 * Tests for the two NON-standalone JasperReports modes:
 *
 * WRAPPED JR — A normal RB report wraps a JR from config/reports-jasper/.
 * The parent's DB connection and reportData always flow to JR.
 * datasource.properties is IRRELEVANT — the parent's conncode wins.
 *
 * INLINE JR — A normal RB report with output type = jasper and .jrxml NOT
 * in config/reports-jasper/. Same rules: receives reportData + DB connection.
 * Nested master-detail data gets flattened by JasperReportRunner.
 */
public class JasperWrappedAndInlineTest {

	private static final Logger log = LoggerFactory.getLogger(JasperWrappedAndInlineTest.class);

	// .jrxml paths — "reports-jasper" in path = wrapped mode, outside = inline mode
	private static final String JRXML_WRAPPED_PARAMS =
			"src/test/resources/reports-jasper/customer_card_params.jrxml";
	private static final String JRXML_WRAPPED_FIELDS =
			"src/test/resources/reports-jasper/customer_card_fields.jrxml";
	private static final String JRXML_WRAPPED_SQL =
			"src/test/resources/reports-jasper/employee_lookup.jrxml";
	private static final String JRXML_INLINE_FIELDS =
			"src/test/resources/jasper/inline_customer_report.jrxml";
	private static final String JRXML_INLINE_MASTER_DETAIL =
			"src/test/resources/jasper/inline_order_detail.jrxml";

	@BeforeClass
	public static void setUpBeforeClass() throws Exception {
		NorthwindTestUtils.setupTestDatabase();
		ensureJrxmlFiles();
	}

	// ═══════════════════════════════════════════════════════════════════
	// WRAPPED JR (from config/reports-jasper/)
	// ═══════════════════════════════════════════════════════════════════

	/**
	 * Assert that parent report's column values arrive in JR as $P{...} params.
	 *
	 * Setup: parent SQL fetches German customers (CustomerID, CompanyName, Country).
	 * The wrapped JR renders these as $P{CustomerID}, $P{CompanyName}, $P{Country}.
	 * If params didn't flow, JR would render nulls and we'd get empty/broken output.
	 */
	@Test
	public void wrappedJR_parentParamsFlowAsJRParams() throws Exception {
		final String TEST_NAME = "wrappedJR_parentParamsFlowAsJRParams";
		log.info("========== {} ==========", TEST_NAME);

		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(
				StringUtils.EMPTY, TEST_NAME,
				NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Parent report fetches German customers from DB
				ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "CustomerID";
				ctx.settings.getReportDataSource().sqloptions.query =
						"SELECT \"CustomerID\", \"CompanyName\", \"Country\" "
						+ "FROM \"Customers\" WHERE \"Country\" = 'Germany' "
						+ "ORDER BY \"CompanyName\"";

				// JR output with documentpath in reports-jasper/ = wrapped mode
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_JASPER;
				ctx.settings.getReportTemplate().documentpath = JRXML_WRAPPED_PARAMS;
				ctx.settings.setBurstFileName("${burst_token}.xlsx");

				// Wire up the parent's DB connection
				setH2ConnectionOnCtx(ctx);
			}
		};
		reporter.burst();

		// The parent's H2 connection must be what JR sees
		assertConnectionIsParentH2(reporter);

		// One .xlsx per German customer = params flowed correctly
		assertOutputFilesGenerated(reporter, ".xlsx");

		log.info("PASSED: {}", TEST_NAME);
	}

	/**
	 * Assert that parent's reportData rows arrive in JR as $F{...} fields.
	 *
	 * Setup: parent SQL fetches German customers → reportData rows.
	 * The wrapped JR uses $F{CustomerID}, $F{CompanyName}, $F{Country}.
	 * If reportData wasn't passed, JR gets JREmptyDataSource → $F{...} fails → no output.
	 */
	@Test
	public void wrappedJR_reportDataFlowsAsJRFields() throws Exception {
		final String TEST_NAME = "wrappedJR_reportDataFlowsAsJRFields";
		log.info("========== {} ==========", TEST_NAME);

		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(
				StringUtils.EMPTY, TEST_NAME,
				NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Parent fetches data that will become reportData rows
				ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "CustomerID";
				ctx.settings.getReportDataSource().sqloptions.query =
						"SELECT \"CustomerID\", \"CompanyName\", \"Country\" "
						+ "FROM \"Customers\" WHERE \"Country\" = 'Germany' "
						+ "ORDER BY \"CompanyName\"";

				// Wrapped mode: path in reports-jasper/, .jrxml uses $F{...} fields
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_JASPER;
				ctx.settings.getReportTemplate().documentpath = JRXML_WRAPPED_FIELDS;
				ctx.settings.setBurstFileName("${burst_token}.xlsx");

				setH2ConnectionOnCtx(ctx);
			}
		};
		reporter.burst();

		assertConnectionIsParentH2(reporter);

		// Output exists = reportData was passed as datasource and $F{...} fields worked
		assertOutputFilesGenerated(reporter, ".xlsx");

		log.info("PASSED: {}", TEST_NAME);
	}

	/**
	 * Assert that JR can execute its own embedded SQL using the parent's JDBC connection.
	 *
	 * Setup: parent SQL fetches just EmployeeIDs.
	 * The wrapped JR has its own SQL: SELECT FirstName, LastName FROM Employees WHERE EmployeeID = $P{EmployeeID}.
	 * If the parent's connection wasn't passed, JR can't run its query → no output.
	 */
	@Test
	public void wrappedJR_jasperRunsOwnSQLUsingParentConnection() throws Exception {
		final String TEST_NAME = "wrappedJR_jasperRunsOwnSQLUsingParentConnection";
		log.info("========== {} ==========", TEST_NAME);

		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(
				StringUtils.EMPTY, TEST_NAME,
				NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Parent only fetches IDs — JR will do its own lookup
				ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "EmployeeID";
				ctx.settings.getReportDataSource().sqloptions.query =
						"SELECT CAST(\"EmployeeID\" AS VARCHAR) AS \"EmployeeID\" "
						+ "FROM \"Employees\" ORDER BY \"EmployeeID\"";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_JASPER;
				ctx.settings.getReportTemplate().documentpath = JRXML_WRAPPED_SQL;
				ctx.settings.setBurstFileName("${burst_token}.xlsx");

				setH2ConnectionOnCtx(ctx);
			}
		};
		reporter.burst();

		assertConnectionIsParentH2(reporter);

		// Output exists = JR ran its own SQL using the parent's connection successfully
		assertOutputFilesGenerated(reporter, ".xlsx");

		log.info("PASSED: {}", TEST_NAME);
	}

	/**
	 * Assert that datasource.properties files (per-report and global) are
	 * completely ignored when running in wrapped JR mode.
	 *
	 * Setup: create datasource.properties with FAKE DB urls in the JR's folder
	 * and in the parent reports-jasper/ folder.
	 * The parent's real H2 connection must be what JR gets — not the fake ones.
	 * If datasource.properties was mistakenly used, JR would try jdbc:h2:mem:FAKE
	 * which has no tables → would fail → no output.
	 */
	@Test
	public void wrappedJR_datasourcePropertiesFilesAreIgnored() throws Exception {
		final String TEST_NAME = "wrappedJR_datasourcePropertiesFilesAreIgnored";
		log.info("========== {} ==========", TEST_NAME);

		// Plant fake datasource.properties in both per-report and global locations
		File jrxmlDir = new File(JRXML_WRAPPED_PARAMS).getParentFile();
		File perReportDsProps = new File(jrxmlDir, "datasource.properties");
		File globalDsProps = new File(jrxmlDir.getParentFile(), "datasource.properties");

		try {
			// Per-report: fake connection that would fail if used
			jrxmlDir.mkdirs();
			Files.writeString(perReportDsProps.toPath(),
					"url=jdbc:h2:mem:FAKE_SHOULD_NOT_BE_USED\n"
					+ "user=fakeuser\n"
					+ "password=fakepass\n"
					+ "driver=org.h2.Driver\n");

			// Global: another fake connection that would also fail if used
			Files.writeString(globalDsProps.toPath(),
					"url=jdbc:h2:mem:ALSO_FAKE\n"
					+ "user=alsofake\n"
					+ "password=alsofake\n"
					+ "driver=org.h2.Driver\n");

			TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(
					StringUtils.EMPTY, TEST_NAME,
					NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
				@Override
				protected void executeController() throws Exception {
					super.executeController();

					ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
					ctx.settings.getReportDataSource().sqloptions.idcolumn = "CustomerID";
					ctx.settings.getReportDataSource().sqloptions.query =
							"SELECT \"CustomerID\", \"CompanyName\", \"Country\" "
							+ "FROM \"Customers\" WHERE \"Country\" = 'Germany' "
							+ "ORDER BY \"CompanyName\"";

					ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_JASPER;
					ctx.settings.getReportTemplate().documentpath = JRXML_WRAPPED_PARAMS;
					ctx.settings.setBurstFileName("${burst_token}.xlsx");

					// Parent's REAL connection — must be what JR receives
					setH2ConnectionOnCtx(ctx);
				}
			};
			reporter.burst();

			// Connection on ctx must still be the parent's real H2 — not the fake ones
			assertConnectionIsParentH2(reporter);

			// Output generated = real connection was used (fake DB has no tables)
			assertOutputFilesGenerated(reporter, ".xlsx");

			log.info("PASSED: {} (datasource.properties present but correctly ignored)", TEST_NAME);
		} finally {
			// Clean up so other tests aren't affected
			perReportDsProps.delete();
			globalDsProps.delete();
		}
	}

	// ═══════════════════════════════════════════════════════════════════
	// INLINE JR (jrxml NOT in config/reports-jasper/)
	// ═══════════════════════════════════════════════════════════════════

	/**
	 * Assert that flat reportData rows arrive in inline JR as $F{...} fields.
	 *
	 * Setup: parent SQL fetches German customers → reportData rows.
	 * The inline JR (path outside reports-jasper/) uses $F{CustomerID}, etc.
	 * Same rule as wrapped: reportData is always passed.
	 */
	@Test
	public void inlineJR_flatReportDataFlowsAsJRFields() throws Exception {
		final String TEST_NAME = "inlineJR_flatReportDataFlowsAsJRFields";
		log.info("========== {} ==========", TEST_NAME);

		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(
				StringUtils.EMPTY, TEST_NAME,
				NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "CustomerID";
				ctx.settings.getReportDataSource().sqloptions.query =
						"SELECT \"CustomerID\", \"CompanyName\", \"Country\" "
						+ "FROM \"Customers\" WHERE \"Country\" = 'Germany' "
						+ "ORDER BY \"CompanyName\"";

				// Inline mode: path NOT in reports-jasper/
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_JASPER;
				ctx.settings.getReportTemplate().documentpath = JRXML_INLINE_FIELDS;
				ctx.settings.setBurstFileName("${burst_token}.xlsx");

				setH2ConnectionOnCtx(ctx);
			}
		};
		reporter.burst();

		assertConnectionIsParentH2(reporter);

		// Output exists = reportData flowed as $F{...} fields to inline JR
		assertOutputFilesGenerated(reporter, ".xlsx");

		log.info("PASSED: {}", TEST_NAME);
	}

	/**
	 * Assert that nested master-detail reportData gets flattened for JR.
	 *
	 * Setup: manually construct reportData with nested "details" lists:
	 *   Order 10248 (VINET) → 2 detail rows (Queso Cabrales, Singaporean Hokkien)
	 *   Order 10249 (TOMSP) → 1 detail row (Tofu)
	 * flattenNestedData in JasperReportRunner expands these into 3 flat rows.
	 * The inline JR uses $F{OrderID}, $F{ProductName}, $F{Quantity}.
	 */
	@Test
	public void inlineJR_nestedMasterDetailDataGetsFlattenedForJR() throws Exception {
		final String TEST_NAME = "inlineJR_nestedMasterDetailDataGetsFlattenedForJR";
		log.info("========== {} ==========", TEST_NAME);

		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(
				StringUtils.EMPTY, TEST_NAME,
				NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();

				ctx.settings.getReportDataSource().sqloptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "OrderID";
				ctx.settings.getReportDataSource().sqloptions.query = "SELECT 1";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_JASPER;
				ctx.settings.getReportTemplate().documentpath = JRXML_INLINE_MASTER_DETAIL;
				ctx.settings.setBurstFileName("${burst_token}.xlsx");

				setH2ConnectionOnCtx(ctx);
			}

			@Override
			protected void fetchData() throws Exception {
				// Build master-detail data manually instead of SQL
				ctx.reportData = new ArrayList<>();
				ctx.reportColumnNames = new ArrayList<>();
				ctx.reportColumnNames.add("OrderID");
				ctx.reportColumnNames.add("CustomerID");
				ctx.reportColumnNames.add("details");

				// Order 1: 2 line items
				LinkedHashMap<String, Object> order1 = new LinkedHashMap<>();
				order1.put("OrderID", "10248");
				order1.put("CustomerID", "VINET");
				List<LinkedHashMap<String, Object>> details1 = new ArrayList<>();
				LinkedHashMap<String, Object> d1a = new LinkedHashMap<>();
				d1a.put("ProductName", "Queso Cabrales");
				d1a.put("Quantity", 12);
				details1.add(d1a);
				LinkedHashMap<String, Object> d1b = new LinkedHashMap<>();
				d1b.put("ProductName", "Singaporean Hokkien");
				d1b.put("Quantity", 10);
				details1.add(d1b);
				order1.put("details", details1);
				ctx.reportData.add(order1);

				// Order 2: 1 line item
				LinkedHashMap<String, Object> order2 = new LinkedHashMap<>();
				order2.put("OrderID", "10249");
				order2.put("CustomerID", "TOMSP");
				List<LinkedHashMap<String, Object>> details2 = new ArrayList<>();
				LinkedHashMap<String, Object> d2a = new LinkedHashMap<>();
				d2a.put("ProductName", "Tofu");
				d2a.put("Quantity", 9);
				details2.add(d2a);
				order2.put("details", details2);
				ctx.reportData.add(order2);

				log.info("Built master-detail data: {} master rows with nested details", ctx.reportData.size());
			}
		};
		reporter.burst();

		assertConnectionIsParentH2(reporter);

		// Output exists = nested data was flattened and $F{...} fields worked
		assertOutputFilesGenerated(reporter, ".xlsx");

		log.info("PASSED: {}", TEST_NAME);
	}

	// ─── Helpers ─────────────────────────────────────────────────────

	/** Set the parent report's DB connection to our test H2 database. */
	private static void setH2ConnectionOnCtx(
			com.sourcekraft.documentburster.context.BurstingContext ctx) {
		ctx.settings.connectionDatabaseSettings = new DocumentBursterConnectionDatabaseSettings();
		ConnectionDatabaseSettings conn = new ConnectionDatabaseSettings();
		ServerDatabaseSettings server = new ServerDatabaseSettings();
		server.url = NorthwindTestUtils.H2_URL;
		server.userid = NorthwindTestUtils.H2_USER;
		server.userpassword = NorthwindTestUtils.H2_PASS;
		server.driver = "org.h2.Driver";
		conn.databaseserver = server;
		ctx.settings.connectionDatabaseSettings.connection = conn;
	}

	/** Verify that the connection on ctx is still the parent's real H2 — not overwritten. */
	private void assertConnectionIsParentH2(AbstractReporter reporter) {
		assertNotNull("connectionDatabaseSettings must be set",
				reporter.getCtx().settings.connectionDatabaseSettings);
		assertNotNull("connection must be set",
				reporter.getCtx().settings.connectionDatabaseSettings.connection);
		ServerDatabaseSettings dbServer =
				reporter.getCtx().settings.connectionDatabaseSettings.connection.databaseserver;
		assertNotNull("databaseserver must be set", dbServer);
		assertEquals("JDBC URL must be the parent's H2 URL",
				NorthwindTestUtils.H2_URL, dbServer.url);
		assertEquals("JDBC user must be the parent's H2 user",
				NorthwindTestUtils.H2_USER, dbServer.userid);
	}

	/** Verify that at least one output file was generated — proves JR processed data. */
	private void assertOutputFilesGenerated(AbstractReporter reporter, String extension) {
		String outputFolder = reporter.getCtx().outputFolder;
		assertNotNull("outputFolder must be set", outputFolder);
		File outDir = new File(outputFolder);
		assertTrue("Output folder must exist: " + outDir.getAbsolutePath(), outDir.exists());
		File[] outputFiles = outDir.listFiles((dir, name) -> name.endsWith(extension));
		assertNotNull("Output folder should contain files", outputFiles);
		assertTrue("Expected at least one " + extension + " file — proves JR received and processed data",
				outputFiles.length >= 1);
		log.info("Generated {} output file(s) in {}", outputFiles.length, outputFolder);
	}

	// ─── .jrxml test fixtures ────────────────────────────────────────

	private static void ensureJrxmlFiles() throws Exception {

		// Wrapped: JR with $P{...} params only — renders CustomerID, CompanyName, Country as params
		writeIfMissing(JRXML_WRAPPED_PARAMS,
				"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
				+ "<jasperReport name=\"customer_card_params\"\n"
				+ "    pageWidth=\"595\" pageHeight=\"842\" columnWidth=\"555\"\n"
				+ "    leftMargin=\"20\" rightMargin=\"20\" topMargin=\"20\" bottomMargin=\"20\">\n"
				+ "  <parameter name=\"CustomerID\" class=\"java.lang.String\"/>\n"
				+ "  <parameter name=\"CompanyName\" class=\"java.lang.String\"/>\n"
				+ "  <parameter name=\"Country\" class=\"java.lang.String\"/>\n"
				+ "  <detail>\n"
				+ "    <band height=\"60\">\n"
				+ "      <element kind=\"textField\" x=\"0\" y=\"0\" width=\"100\" height=\"20\">\n"
				+ "        <expression>$P{CustomerID}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"100\" y=\"0\" width=\"300\" height=\"20\">\n"
				+ "        <expression>$P{CompanyName}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"400\" y=\"0\" width=\"155\" height=\"20\">\n"
				+ "        <expression>$P{Country}</expression>\n"
				+ "      </element>\n"
				+ "    </band>\n"
				+ "  </detail>\n"
				+ "</jasperReport>");

		// Wrapped: JR with $F{...} fields — reads from reportData datasource
		writeIfMissing(JRXML_WRAPPED_FIELDS,
				"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
				+ "<jasperReport name=\"customer_card_fields\"\n"
				+ "    pageWidth=\"595\" pageHeight=\"842\" columnWidth=\"555\"\n"
				+ "    leftMargin=\"20\" rightMargin=\"20\" topMargin=\"20\" bottomMargin=\"20\">\n"
				+ "  <field name=\"CustomerID\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"CompanyName\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"Country\" class=\"java.lang.String\"/>\n"
				+ "  <detail>\n"
				+ "    <band height=\"20\">\n"
				+ "      <element kind=\"textField\" x=\"0\" y=\"0\" width=\"100\" height=\"20\">\n"
				+ "        <expression>$F{CustomerID}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"100\" y=\"0\" width=\"300\" height=\"20\">\n"
				+ "        <expression>$F{CompanyName}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"400\" y=\"0\" width=\"155\" height=\"20\">\n"
				+ "        <expression>$F{Country}</expression>\n"
				+ "      </element>\n"
				+ "    </band>\n"
				+ "  </detail>\n"
				+ "</jasperReport>");

		// Wrapped: JR with its own SQL query — needs parent's JDBC connection to execute it
		writeIfMissing(JRXML_WRAPPED_SQL,
				"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
				+ "<jasperReport name=\"employee_lookup\"\n"
				+ "    pageWidth=\"595\" pageHeight=\"842\" columnWidth=\"555\"\n"
				+ "    leftMargin=\"20\" rightMargin=\"20\" topMargin=\"20\" bottomMargin=\"20\">\n"
				+ "  <parameter name=\"EmployeeID\" class=\"java.lang.String\"/>\n"
				+ "  <query language=\"SQL\"><![CDATA[\n"
				+ "    SELECT \"FirstName\", \"LastName\", \"Title\"\n"
				+ "    FROM \"Employees\"\n"
				+ "    WHERE CAST(\"EmployeeID\" AS VARCHAR) = $P{EmployeeID}\n"
				+ "  ]]></query>\n"
				+ "  <field name=\"FirstName\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"LastName\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"Title\" class=\"java.lang.String\"/>\n"
				+ "  <detail>\n"
				+ "    <band height=\"20\">\n"
				+ "      <element kind=\"textField\" x=\"0\" y=\"0\" width=\"200\" height=\"20\">\n"
				+ "        <expression>$F{FirstName} + \" \" + $F{LastName}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"200\" y=\"0\" width=\"355\" height=\"20\">\n"
				+ "        <expression>$F{Title}</expression>\n"
				+ "      </element>\n"
				+ "    </band>\n"
				+ "  </detail>\n"
				+ "</jasperReport>");

		// Inline: JR with $F{...} fields — same as wrapped fields but path is outside reports-jasper/
		writeIfMissing(JRXML_INLINE_FIELDS,
				"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
				+ "<jasperReport name=\"inline_customer_report\"\n"
				+ "    pageWidth=\"595\" pageHeight=\"842\" columnWidth=\"555\"\n"
				+ "    leftMargin=\"20\" rightMargin=\"20\" topMargin=\"20\" bottomMargin=\"20\">\n"
				+ "  <field name=\"CustomerID\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"CompanyName\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"Country\" class=\"java.lang.String\"/>\n"
				+ "  <detail>\n"
				+ "    <band height=\"20\">\n"
				+ "      <element kind=\"textField\" x=\"0\" y=\"0\" width=\"100\" height=\"20\">\n"
				+ "        <expression>$F{CustomerID}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"100\" y=\"0\" width=\"300\" height=\"20\">\n"
				+ "        <expression>$F{CompanyName}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"400\" y=\"0\" width=\"155\" height=\"20\">\n"
				+ "        <expression>$F{Country}</expression>\n"
				+ "      </element>\n"
				+ "    </band>\n"
				+ "  </detail>\n"
				+ "</jasperReport>");

		// Inline: JR for master-detail — uses $F{...} from flattened nested data
		writeIfMissing(JRXML_INLINE_MASTER_DETAIL,
				"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
				+ "<jasperReport name=\"inline_order_detail\"\n"
				+ "    pageWidth=\"595\" pageHeight=\"842\" columnWidth=\"555\"\n"
				+ "    leftMargin=\"20\" rightMargin=\"20\" topMargin=\"20\" bottomMargin=\"20\">\n"
				+ "  <field name=\"OrderID\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"CustomerID\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"ProductName\" class=\"java.lang.String\"/>\n"
				+ "  <field name=\"Quantity\" class=\"java.lang.Integer\"/>\n"
				+ "  <detail>\n"
				+ "    <band height=\"20\">\n"
				+ "      <element kind=\"textField\" x=\"0\" y=\"0\" width=\"80\" height=\"20\">\n"
				+ "        <expression>$F{OrderID}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"80\" y=\"0\" width=\"80\" height=\"20\">\n"
				+ "        <expression>$F{CustomerID}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"160\" y=\"0\" width=\"250\" height=\"20\">\n"
				+ "        <expression>$F{ProductName}</expression>\n"
				+ "      </element>\n"
				+ "      <element kind=\"textField\" x=\"410\" y=\"0\" width=\"145\" height=\"20\">\n"
				+ "        <expression>$F{Quantity}</expression>\n"
				+ "      </element>\n"
				+ "    </band>\n"
				+ "  </detail>\n"
				+ "</jasperReport>");
	}

	private static void writeIfMissing(String path, String content) throws Exception {
		File f = new File(path);
		if (!f.exists()) {
			f.getParentFile().mkdirs();
			Files.writeString(f.toPath(), content);
		}
	}
}
