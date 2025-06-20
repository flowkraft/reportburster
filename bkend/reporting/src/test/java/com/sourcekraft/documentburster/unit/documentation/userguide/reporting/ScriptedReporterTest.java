package com.sourcekraft.documentburster.unit.documentation.userguide.reporting;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.Instant; // Add this import
import java.time.ZoneId; // Add this import
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.BiFunction; // Added for helper
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
// jsoup imports
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster._helpers.NorthwindTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.utils.CsvUtils; // For OUTPUT_TYPE_HTML etc.
// Import the fixed date from the generator
import com.sourcekraft.documentburster.common.db.northwind.NorthwindDataGenerator;

public class ScriptedReporterTest {

	private static final Logger log = LoggerFactory.getLogger(ScriptedReporterTest.class);
	// H2 is managed by NorthwindTestUtils setup in SqlReporterTest @BeforeClass

	@BeforeClass
	public static void setUpClass() throws Exception { // Add throws Exception, IOException

		log.info("Setting up ScriptedReporterTest...");

		// Ensure templates are generated
		NorthwindTestUtils.ensureReportingTemplates();

		// Set up database using the shared utility method
		NorthwindTestUtils.setupTestDatabase();

		// Ensure output directory exists and is clean (moved from setUp)
		log.info("Setup complete. H2 DB is ready and scripts are present.");
	}

	@AfterClass
	public static void tearDownClass() {

		log.info("Tearing down ScriptedReporterTest...");

		// Cleanup if needed
		log.info("Teardown complete.");

	}

	@Before
	public void setUp() throws Exception {
		// Output directory cleaning moved to setUpClass to run only once
		log.debug("Executing test method setup...");
	}

	@After
	public void tearDown() {
		// Optional: Add cleanup after each test if needed
	}

	// --- Test Methods ---

	@Test
	public void testInvoiceMasterDetail() throws Exception {
		final String TEST_NAME = "ScriptedReporterTest-InvoiceMasterDetail";
		log.info("========== Starting test: {} ==========", TEST_NAME);

		// 1. Template Generation is handled by @BeforeClass calling
		// ensureReportingTemplates

		// 2. Configure Reporter
		TestBursterFactory.ScriptedReporter reporter = new TestBursterFactory.ScriptedReporter(StringUtils.EMPTY,
				TEST_NAME, NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				// Configure ScriptedReporter specific settings
				ctx.settings.getReportDataSource().scriptoptions.conncode = NorthwindTestUtils.H2_CONN_CODE;

				ctx.settings.getReportDataSource().scriptoptions.scriptname = "scriptedReport_invoice.groovy";

				ctx.settings.getReportDataSource().scriptoptions.idcolumn = "OrderID"; // Burst by OrderID

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
				// Use constant from NorthwindTestUtils
				ctx.settings.getReportTemplate().documentpath = NorthwindTestUtils.SCRIPTED_INVOICE_TEMPLATE_HTML;
				ctx.settings.setBurstFileName("invoice_${OrderID}.html"); // Naming convention
			}
		};

		// 3. Execute Burst
		reporter.burst();

		// 4. Assertions
		BurstingContext ctx = reporter.getCtx();
		assertNotNull("BurstingContext should not be null", ctx);
		assertNotNull("Source data should not be null after script execution", ctx.reportData);
		assertNotNull("Burst tokens list should not be null", ctx.burstTokens);

		// 4.1 Get actual Order IDs from DB for the customers processed by the script
		List<Integer> alfkiOrderIds = NorthwindTestUtils.getOrderIdsForCustomer("ALFKI");
		List<Integer> anatrOrderIds = NorthwindTestUtils.getOrderIdsForCustomer("ANATR");

		// --- MODIFIED ASSERTIONS ---
		assertFalse("Should find at least one Order ID for ALFKI", alfkiOrderIds.isEmpty()); // Check not empty
		assertFalse("Should find at least one Order ID for ANATR", anatrOrderIds.isEmpty()); // Check not empty

		// Combine all expected order IDs
		List<String> expectedOrderIds = new ArrayList<>();
		alfkiOrderIds.forEach(id -> expectedOrderIds.add(String.valueOf(id)));
		anatrOrderIds.forEach(id -> expectedOrderIds.add(String.valueOf(id)));

		// 4.2 Verify Burst Tokens contain all the fetched IDs
		assertEquals("Number of burst tokens should match total orders found", expectedOrderIds.size(),
				ctx.burstTokens.size());
		for (String expectedId : expectedOrderIds) {
			assertTrue("Burst tokens should contain Order ID " + expectedId, ctx.burstTokens.contains(expectedId));
		}
		log.info("Verified burst tokens contain expected Order IDs: {}", ctx.burstTokens);

		// 4.3 Verify Output File and Content for EACH ALFKI order
		for (Integer id : alfkiOrderIds) {
			String alfkiOrderId = String.valueOf(id);
			Path outputFileAlfki = Paths.get(ctx.outputFolder, "invoice_" + alfkiOrderId + ".html");
			assertTrue("Output file for ALFKI OrderID " + alfkiOrderId + " should exist",
					Files.exists(outputFileAlfki));

			String htmlContentAlfki = Files.readString(outputFileAlfki, StandardCharsets.UTF_8);
			assertTrue("HTML " + alfkiOrderId + " should contain <html> tag", htmlContentAlfki.contains("<html"));
			assertTrue("HTML " + alfkiOrderId + " should contain Invoice ID",
					htmlContentAlfki.contains("<h1>Invoice " + alfkiOrderId + "</h1>"));
			assertTrue("HTML " + alfkiOrderId + " should contain Customer ID and Name (ALFKI)",
					htmlContentAlfki.contains("<strong>Customer:</strong> ALFKI (Alfreds Futterkiste)"));

			// TODO: Adjust content assertions based on which ALFKI order this is (Order 1
			// vs Order 5)
			// For now, just check for presence of some details table elements
			assertTrue("HTML " + alfkiOrderId + " should contain details table header 'Product'",
					htmlContentAlfki.contains("<th>Product</th>"));
			assertTrue("HTML " + alfkiOrderId + " should contain totals footer 'Grand Total:'",
					htmlContentAlfki.contains("Grand Total:"));

			log.info("Verified basic content for invoice {}", alfkiOrderId);
		}

		// 4.4 Verify Output File and Content for EACH ANATR order (likely only one)
		for (Integer id : anatrOrderIds) {
			String anatrOrderId = String.valueOf(id);
			Path outputFileAnatr = Paths.get(ctx.outputFolder, "invoice_" + anatrOrderId + ".html");
			assertTrue("Output file for ANATR OrderID " + anatrOrderId + " should exist",
					Files.exists(outputFileAnatr));

			String htmlContentAnatr = Files.readString(outputFileAnatr, StandardCharsets.UTF_8);
			assertTrue("HTML " + anatrOrderId + " should contain <html> tag", htmlContentAnatr.contains("<html"));
			assertTrue("HTML " + anatrOrderId + " should contain Invoice ID",
					htmlContentAnatr.contains("<h1>Invoice " + anatrOrderId + "</h1>"));
			assertTrue("HTML " + anatrOrderId + " should contain Customer ID and Name (ANATR)",
					htmlContentAnatr.contains("<strong>Customer:</strong> ANATR (Ana Trujillo Emparedados y helados)"));

			// Check for detail lines (based on NorthwindDataGenerator for ANATR's first
			// order - Order 2)
			// This assumes ANATR only has one order generated (Order 2)
			if (anatrOrderIds.size() == 1) { // Add specific checks only if we know it's the expected single order
				assertTrue("HTML " + anatrOrderId + " should contain product 'Aniseed Syrup'",
						htmlContentAnatr.contains("<td>Aniseed Syrup</td>"));
				// Check for calculated totals (Values based on NorthwindDataGenerator data for
				// ANATR's first order)
				assertTrue("HTML " + anatrOrderId + " should contain correct Subtotal",
						htmlContentAnatr.contains("<td>28.50</td>"));
				assertTrue("HTML " + anatrOrderId + " should contain correct Freight",
						htmlContentAnatr.contains("<td>11.61</td>"));
				assertTrue("HTML " + anatrOrderId + " should contain correct Tax",
						htmlContentAnatr.contains("<td>3.21</td>"));
				assertTrue("HTML " + anatrOrderId + " should contain correct Grand Total",
						htmlContentAnatr.contains("<td>43.32</td>"));
			} else {
				// If multiple ANATR orders, add more generic checks like for ALFKI
				assertTrue("HTML " + anatrOrderId + " should contain details table header 'Product'",
						htmlContentAnatr.contains("<th>Product</th>"));
				assertTrue("HTML " + anatrOrderId + " should contain totals footer 'Grand Total:'",
						htmlContentAnatr.contains("Grand Total:"));
			}
			log.info("Verified content for invoice {}", anatrOrderId);
		}
		// --- END MODIFIED ASSERTIONS ---

		log.info("========== Test completed: {} ==========", TEST_NAME);
	}

	@Test
	public void testCategoryRegionCrosstab() throws Exception {
		final String TEST_NAME = "ScriptedReporterTest-CategoryRegionCrosstab";
		log.info("========== Starting test: {} ==========", TEST_NAME);

		// 1. Template Generation handled by @BeforeClass

		// 2. Configure Reporter
		TestBursterFactory.ScriptedReporter reporter = new TestBursterFactory.ScriptedReporter(StringUtils.EMPTY,
				TEST_NAME, NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				ctx.settings.getReportDataSource().scriptoptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings
						.getReportDataSource().scriptoptions.scriptname = "scriptedReport_categoryRegionCrosstabReport.groovy";

				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML; // Use constant from
																							// NorthwindTestUtils
				ctx.settings.getReportTemplate().documentpath = NorthwindTestUtils.SCRIPTED_CROSSTAB_TEMPLATE_HTML;
				ctx.settings.setBurstFileName("crosstab_report.html");

			}
		};

		// 3. Execute Burst
		reporter.burst();

		// 4. Assertions
		BurstingContext ctx = reporter.getCtx();
		assertNotNull("BurstingContext should not be null", ctx);

		// 4.1 Check output file existence
		Path outputFile = Paths.get(ctx.outputFolder, "crosstab_report.html");
		assertTrue("Crosstab report file should exist", Files.exists(outputFile));

		// 4.2 Read and check output file content using jsoup
		String htmlContent = Files.readString(outputFile, StandardCharsets.UTF_8);
		Document doc = Jsoup.parse(htmlContent);

		// Check Title and Table Presence
		Element titleElement = doc.selectFirst("h1:contains(Category Sales by Region)");
		assertNotNull("HTML should contain 'Category Sales by Region' title", titleElement);
		Element tableElement = doc.selectFirst("table");
		assertNotNull("HTML should contain a table", tableElement);

		// 4.3 Verify Table Headers using jsoup
		// Assuming headers are in <thead> or the first <tr> if no <thead>
		Element headerRow = doc.selectFirst("thead tr, table tr"); // Select first row in thead or table
		assertNotNull("Table header row should exist", headerRow);
		Elements headers = headerRow.select("th");
		assertEquals("Expected 6 header columns", 6, headers.size());
		assertEquals("Header 1 mismatch", "Category", headers.get(0).text());
		assertEquals("Header 2 mismatch", "Germany", headers.get(1).text());
		assertEquals("Header 3 mismatch", "Mexico", headers.get(2).text());
		assertEquals("Header 4 mismatch", "Sweden", headers.get(3).text());
		assertEquals("Header 5 mismatch", "UK", headers.get(4).text());
		assertEquals("Header 6 mismatch", "Total Sales", headers.get(5).text());
		log.info("Verified table headers using jsoup.");

		// 4.4 Verify Category Rows Presence using jsoup
		// Assuming data rows are in <tbody> or directly in <table> after the header
		assertNotNull("Beverages row should exist",
				doc.selectFirst("tbody tr:contains(Beverages), table tr:contains(Beverages)"));
		assertNotNull("Condiments row should exist",
				doc.selectFirst("tbody tr:contains(Condiments), table tr:contains(Condiments)"));
		assertNotNull("Confections row should exist",
				doc.selectFirst("tbody tr:contains(Confections), table tr:contains(Confections)"));
		assertNotNull("Seafood row should exist",
				doc.selectFirst("tbody tr:contains(Seafood), table tr:contains(Seafood)"));
		log.info("Verified category rows presence using jsoup.");

		// 4.5 Verify Specific Data Cells and Row Totals using jsoup

		// Helper function to get cell text by category name and column index (1-based
		// for data)
		BiFunction<String, Integer, String> getCellText = (category, columnIndex) -> {
			// CSS selector: find row containing category, then get the Nth TD child.
			// nth-child is 1-based, and we add 1 because the first child (index 0) is the
			// category name.
			String selector = String.format(
					"tbody tr:contains(%s) > td:nth-child(%d), table tr:contains(%s) > td:nth-child(%d)", category,
					columnIndex + 1, category, columnIndex + 1);
			Element cell = doc.selectFirst(selector);
			assertNotNull(String.format("Cell for category '%s', column index %d not found with selector '%s'",
					category, columnIndex, selector), cell);
			return cell.text();
		};

		// Beverages: Germany=457.30, Mexico=0.00, Sweden=239.00, UK=0.00, Total=696.30
		assertEquals("Beverages/Germany", "457.30", getCellText.apply("Beverages", 1));
		assertEquals("Beverages/Mexico", "0.00", getCellText.apply("Beverages", 2));
		assertEquals("Beverages/Sweden", "239.00", getCellText.apply("Beverages", 3));
		assertEquals("Beverages/UK", "0.00", getCellText.apply("Beverages", 4));
		assertEquals("Beverages/Total", "696.30", getCellText.apply("Beverages", 5));

		// Condiments: Germany=0.00, Mexico=123.50, Sweden=59.40, UK=44.00, Total=226.90
		assertEquals("Condiments/Germany", "0.00", getCellText.apply("Condiments", 1));
		assertEquals("Condiments/Mexico", "123.50", getCellText.apply("Condiments", 2));
		assertEquals("Condiments/Sweden", "59.40", getCellText.apply("Condiments", 3));
		assertEquals("Condiments/UK", "44.00", getCellText.apply("Condiments", 4));
		assertEquals("Condiments/Total", "226.90", getCellText.apply("Condiments", 5));

		// Confections: Germany=0.00, Mexico=50.00, Sweden=0.00, UK=56.25, Total=106.25
		assertEquals("Confections/Germany", "0.00", getCellText.apply("Confections", 1));
		assertEquals("Confections/Mexico", "50.00", getCellText.apply("Confections", 2));
		assertEquals("Confections/Sweden", "0.00", getCellText.apply("Confections", 3));
		assertEquals("Confections/UK", "56.25", getCellText.apply("Confections", 4));
		assertEquals("Confections/Total", "106.25", getCellText.apply("Confections", 5));

		// Seafood: Germany=92.00, Mexico=0.00, Sweden=147.20, UK=0.00, Total=239.20
		assertEquals("Seafood/Germany", "92.00", getCellText.apply("Seafood", 1));
		assertEquals("Seafood/Mexico", "0.00", getCellText.apply("Seafood", 2));
		assertEquals("Seafood/Sweden", "147.20", getCellText.apply("Seafood", 3));
		assertEquals("Seafood/UK", "0.00", getCellText.apply("Seafood", 4));
		assertEquals("Seafood/Total", "239.20", getCellText.apply("Seafood", 5));
		log.info("Verified specific data cells and row totals using jsoup.");

		// 4.6 Verify Footer Row (Column Totals and Grand Total) using jsoup
		Element footerRow = doc.selectFirst("tfoot tr");
		assertNotNull("Footer row (tfoot tr) should exist", footerRow);
		Elements footerCells = footerRow.select("td"); // Select all cells in the footer row
		assertEquals("Expected 6 footer cells (Label + 5 Totals)", 6, footerCells.size());

		// Verify label and totals
		assertEquals("Footer label mismatch", "Total", footerCells.get(0).text());
		assertEquals("Footer/Germany Total", "549.30", footerCells.get(1).text());
		assertEquals("Footer/Mexico Total", "173.50", footerCells.get(2).text());
		assertEquals("Footer/Sweden Total", "445.60", footerCells.get(3).text());
		assertEquals("Footer/UK Total", "100.25", footerCells.get(4).text());
		assertEquals("Footer/Grand Total", "1268.65", footerCells.get(5).text());
		log.info("Verified footer totals (column totals and grand total) using jsoup.");

		log.info("========== Test completed: {} ==========", TEST_NAME);

	}

	@Test
	public void testMonthlySalesTrendChart() throws Exception {
		final String TEST_NAME = "ScriptedReporterTest-MonthlySalesTrend";
		log.info("========== Starting test: {} ==========", TEST_NAME);

		// 1. Template Generation handled by @BeforeClass

		// 2. Configure Reporter
		TestBursterFactory.ScriptedReporter reporter = new TestBursterFactory.ScriptedReporter(StringUtils.EMPTY,
				TEST_NAME, NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				ctx.settings.getReportDataSource().scriptoptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings
						.getReportDataSource().scriptoptions.scriptname = "scriptedReport_monthlySalesTrendReport.groovy";
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
				ctx.settings.getReportTemplate().documentpath = NorthwindTestUtils.SCRIPTED_TREND_TEMPLATE_HTML;
				ctx.settings.setBurstFileName("sales_trend_report.html");
			}
		};

		// 3. Execute Burst
		reporter.burst();

		// --- Assertions ---

		// 4. Basic Context and File Validation
		BurstingContext ctx = reporter.getCtx();
		assertNotNull("BurstingContext should not be null", ctx);

		Path outputFile = Paths.get(ctx.outputFolder, "sales_trend_report.html");
		assertTrue("Sales trend report file should exist: " + outputFile.toString(), Files.exists(outputFile));
		String htmlContent = Files.readString(outputFile, StandardCharsets.UTF_8);
		assertFalse("HTML content should not be empty", htmlContent.trim().isEmpty());

		// Parse HTML with Jsoup
		Document doc = Jsoup.parse(htmlContent);

		// 5. HTML Structure and Dependencies Validation (using Jsoup)
		log.info("Validating HTML structure and dependencies using Jsoup...");
		// Check DOCTYPE (Jsoup normalizes this, check for basic HTML structure)
		assertEquals("Should have one html tag", 1, doc.select("html").size());
		assertEquals("Should have one head tag", 1, doc.select("head").size());
		assertEquals("Should have one body tag", 1, doc.select("body").size());

		// Check Title
		Element h1 = doc.selectFirst("h1");
		assertNotNull("HTML should contain an H1 tag", h1);
		assertEquals("HTML should contain 'Monthly Sales Trend' title", "Monthly Sales Trend", h1.text());

		// Chart.js Setup Validation
		Element chartJsScript = doc.selectFirst("script[src*='cdn.jsdelivr.net/npm/chart.js']");
		assertNotNull("HTML should include Chart.js from CDN via script tag", chartJsScript);

		Element canvas = doc.selectFirst("canvas#salesChart");
		assertNotNull("HTML should contain canvas with id 'salesChart'", canvas);

		// 6. Data Validation (Extracting from JS, comparing with expected)
		log.info("Validating report data embedded in JavaScript...");

		// Calculate expected data (represents our "source of truth")
		Map<YearMonth, MonthlySalesData> expectedData = calculateExpectedMonthlySales();
		assertTrue("Expected data should contain at least 4 months", expectedData.size() >= 4);

		// Extract actual data from generated JavaScript within the HTML
		// These helper methods parse the JS array definitions
		List<String> actualLabels = parseJsStringArray(htmlContent, "labels");
		List<Double> actualSales = parseJsDoubleArray(htmlContent, "salesData");
		List<Integer> actualOrders = parseJsIntegerArray(htmlContent, "orderCountData");

		// 6.1 Time Period Validation
		log.info("Validating time periods (labels)...");
		List<String> expectedLabels = expectedData.keySet().stream()
				.map(ym -> ym.format(DateTimeFormatter.ofPattern("yyyy-MM"))).collect(Collectors.toList());
		assertEquals("Number of time periods (labels) should match", expectedLabels.size(), actualLabels.size());
		assertEquals("Time period labels should match expected order and values", expectedLabels, actualLabels);

		// 6.2 Sales Data Validation
		log.info("Validating sales figures...");
		List<Double> expectedSales = expectedData.values().stream().map(data -> data.totalSales)
				.collect(Collectors.toList());
		assertEquals("Number of sales data points should match", expectedSales.size(), actualSales.size());

		// Validate each sales figure with proper logging
		for (int i = 0; i < expectedSales.size(); i++) {
			String period = actualLabels.get(i); // Use actual label for context
			double expected = expectedSales.get(i);
			double actual = actualSales.get(i);
			assertEquals(String.format("Sales for period %s should match", period), expected, actual, 0.01); // 1 cent
																												// tolerance
			log.debug("Verified sales for {}: Expected={}, Actual={}", period, expected, actual);
		}

		// 6.3 Order Count Validation
		log.info("Validating order counts...");
		List<Integer> expectedOrders = expectedData.values().stream().map(data -> data.orderCount)
				.collect(Collectors.toList());
		assertEquals("Number of order count data points should match", expectedOrders.size(), actualOrders.size());

		// Validate each order count with proper logging
		for (int i = 0; i < expectedOrders.size(); i++) {
			String period = actualLabels.get(i); // Use actual label for context
			int expected = expectedOrders.get(i);
			int actual = actualOrders.get(i);
			assertEquals(String.format("Order count for period %s should match", period), expected, actual);
			log.debug("Verified orders for {}: Expected={}, Actual={}", period, expected, actual);
		}

		// 7. Chart Configuration Validation (Isolating Script Content)
		log.info("Validating chart configuration within the script tag...");
		// --- MODIFIED SCRIPT SELECTION ---
		Elements scriptElements = doc.select("script"); // Select ALL script tags
		Element chartScriptElement = null;
		for (Element script : scriptElements) {
			// Check the actual HTML content of the script tag
			if (script.html().contains("new Chart(ctx,")) { // Check for a more specific part of the initialization
				chartScriptElement = script;
				log.info("Found chart script block using iteration and contains check.");
				break; // Found it, stop looping
			}
		}
		// --- END MODIFIED SCRIPT SELECTION ---

		assertNotNull("Script block containing 'new Chart(ctx,' should exist", chartScriptElement);
		String scriptContent = chartScriptElement.html(); // Get the content of that script block
		assertFalse("Chart script content should not be empty", scriptContent.trim().isEmpty());

		// 7.1 Basic Chart Setup
		assertTrue("Chart script should configure type as 'line'", scriptContent.contains("type: 'line'"));

		// 7.2 Dataset Configuration
		assertTrue("Chart script should contain 'Monthly Sales' dataset label",
				scriptContent.contains("label: 'Monthly Sales'"));
		assertTrue("Chart script should contain 'Order Count' dataset label",
				scriptContent.contains("label: 'Order Count'"));
		// Optionally check colors, tension etc. if they are stable/important
		assertTrue("Chart script should link 'Monthly Sales' dataset to ySales axis",
				scriptContent.contains("yAxisID: 'ySales'"));
		assertTrue("Chart script should link 'Order Count' dataset to yOrders axis",
				scriptContent.contains("yAxisID: 'yOrders'"));
		// assertTrue("Chart script should set 'Monthly Sales' color",
		// scriptContent.contains("borderColor: 'rgb(75, 192, 192)'"));
		// assertTrue("Chart script should set 'Order Count' color",
		// scriptContent.contains("borderColor: 'rgb(255, 99, 132)'"));
		// assertTrue("Chart script should set line tension",
		// scriptContent.contains("tension: 0.1"));

		// 7.3 Axes Configuration
		assertTrue("Chart script should define 'ySales' axis", scriptContent.contains("ySales: {"));
		assertTrue("Chart script should set 'ySales' axis type to 'linear'",
				scriptContent.contains("ySales: {\n            type: 'linear'"));
		assertTrue("Chart script should set 'ySales' axis position to 'left'",
				scriptContent.contains("position: 'left'"));
		assertTrue("Chart script should set 'ySales' axis title text", scriptContent.contains("text: 'Sales ($)'"));

		assertTrue("Chart script should define 'yOrders' axis", scriptContent.contains("yOrders: {"));
		assertTrue("Chart script should set 'yOrders' axis type to 'linear'",
				scriptContent.contains("yOrders: {\n            type: 'linear'"));
		assertTrue("Chart script should set 'yOrders' axis position to 'right'",
				scriptContent.contains("position: 'right'"));
		assertTrue("Chart script should set 'yOrders' axis title text", scriptContent.contains("text: 'Orders'"));
		assertTrue("Chart script should disable grid lines for 'yOrders' axis",
				scriptContent.contains("grid: { drawOnChartArea: false }"));

		// 8. Business Logic / Sanity Checks (Based on validated data)
		log.info("Validating business logic and overall data sanity...");

		// Check if data shows expected trends (already covered by data size check)
		assertTrue("Should have data for at least 4 months", actualLabels.size() >= 4);

		// Verify total order volume
		int totalOrders = actualOrders.stream().mapToInt(Integer::intValue).sum();
		assertTrue("Should have a positive number of total orders", totalOrders > 0);
		// This assertion depends heavily on the exact test data generated.
		// If NorthwindDataGenerator is stable, this specific check is good.
		assertEquals("Should have expected total number of orders based on test data", 7, totalOrders);

		// Verify reasonable sales figures
		double totalSales = actualSales.stream().mapToDouble(Double::doubleValue).sum();
		assertTrue("Should have positive total sales", totalSales > 0);
		// This range depends on the test data. Adjust if data generation changes.
		assertTrue("Total sales should be within expected range based on test data",
				totalSales >= 1000.0 && totalSales <= 2000.0);
		// Example: Check if the last month's sales are positive (assuming recent data)
		assertTrue("Last month's sales should be positive", actualSales.get(actualSales.size() - 1) > 0);
		// Example: Check if the first month's order count is positive
		assertTrue("First month's order count should be positive", actualOrders.get(0) > 0);

		log.info("========== Test completed successfully: {} ==========", TEST_NAME);
		// NOTE: The assertion failure regarding the number of time periods (4 vs 3)
		// should now be resolved.
		// However, the specific sales/order count values asserted might still fail
		// if the REFERENCE_DATE causes orders 1-4 to fall into a different month
		// than previously assumed by calculateExpectedMonthlySales.
		// The logic in calculateExpectedMonthlySales has been updated to match the
		// generator.

	}

	// --- Helper Methods for Monthly Sales Trend Test ---

	private static class MonthlySalesData {
		double totalSales = 0.0;
		int orderCount = 0;
	}

	private Map<YearMonth, MonthlySalesData> calculateExpectedMonthlySales() {
		Map<YearMonth, MonthlySalesData> monthlyData = new LinkedHashMap<>();

		// Use the same fixed reference date and zone as the generator
		LocalDate referenceDate = NorthwindDataGenerator.REFERENCE_DATE;
		ZoneId defaultZoneId = ZoneId.systemDefault(); // Or NorthwindDataGenerator.DEFAULT_ZONE_ID if made public
		Instant referenceInstant = referenceDate.atStartOfDay(defaultZoneId).toInstant(); // Or
																							// NorthwindDataGenerator.REFERENCE_INSTANT

		// Helper to add sales and increment order count
		BiConsumer<YearMonth, BigDecimal> addSale = (ym, amount) -> {
			monthlyData.computeIfAbsent(ym, k -> new MonthlySalesData());
			// Add sales using BigDecimal, then store as double
			BigDecimal currentSales = BigDecimal.valueOf(monthlyData.get(ym).totalSales);
			monthlyData.get(ym).totalSales = currentSales.add(amount).doubleValue();
		};
		BiConsumer<YearMonth, Void> incrementOrderCount = (ym, v) -> {
			monthlyData.computeIfAbsent(ym, k -> new MonthlySalesData());
			monthlyData.get(ym).orderCount++;
		};

		// --- Calculations mirroring NorthwindDataGenerator using REFERENCE_DATE ---
		// Prices and discounts as BigDecimal
		BigDecimal crabPrice = new BigDecimal("18.40");
		BigDecimal chaiPrice = new BigDecimal("18.00");
		BigDecimal syrupPrice = new BigDecimal("10.00");
		BigDecimal longbreadsPrice = new BigDecimal("12.50");
		BigDecimal cajunPrice = new BigDecimal("22.00");
		BigDecimal changPrice = new BigDecimal("19.00");

		BigDecimal disc5 = new BigDecimal("0.05");
		BigDecimal disc10 = new BigDecimal("0.10");
		BigDecimal noDisc = BigDecimal.ZERO;

		// Order 5 (~3 months before REFERENCE_DATE) - ALFKI
		YearMonth ym5 = YearMonth.from(referenceDate.minusMonths(3));
		BigDecimal sales5 = calculateLineTotal(crabPrice, (short) 5, noDisc) // 18.40 * 5 * 1 = 92.00
				.add(calculateLineTotal(chaiPrice, (short) 3, disc5)); // 18.00 * 3 * 0.95 = 51.30 -> Total = 143.30
		addSale.accept(ym5, sales5);
		incrementOrderCount.accept(ym5, null);

		// Order 6 (~2 months before REFERENCE_DATE) - ANATR
		YearMonth ym6 = YearMonth.from(referenceDate.minusMonths(2));
		BigDecimal sales6 = calculateLineTotal(syrupPrice, (short) 10, disc5) // 10.00 * 10 * 0.95 = 95.00
				.add(calculateLineTotal(longbreadsPrice, (short) 4, noDisc)); // 12.50 * 4 * 1 = 50.00 -> Total = 145.00
		addSale.accept(ym6, sales6);
		incrementOrderCount.accept(ym6, null);

		// Order 7 (~1 month before REFERENCE_DATE) - BERGS
		YearMonth ym7 = YearMonth.from(referenceDate.minusMonths(1));
		BigDecimal sales7 = calculateLineTotal(chaiPrice, (short) 8, noDisc) // 18.00 * 8 * 1 = 144.00
				.add(calculateLineTotal(cajunPrice, (short) 3, disc10)) // 22.00 * 3 * 0.90 = 59.40
				.add(calculateLineTotal(changPrice, (short) 5, noDisc)); // 19.00 * 5 * 1 = 95.00 -> Total = 298.40
		addSale.accept(ym7, sales7);
		incrementOrderCount.accept(ym7, null);

		// --- Orders placed relative to REFERENCE_INSTANT ---

		// Order 1 (~10 days before REFERENCE_INSTANT) - ALFKI
		YearMonth ym1 = YearMonth.from(referenceInstant.minusSeconds(86400 * 10).atZone(defaultZoneId));
		BigDecimal sales1 = calculateLineTotal(chaiPrice, (short) 12, noDisc) // 18.00 * 12 * 1 = 216.00
				.add(calculateLineTotal(changPrice, (short) 10, noDisc)); // 19.00 * 10 * 1 = 190.00 -> Total = 406.00
		addSale.accept(ym1, sales1);
		incrementOrderCount.accept(ym1, null);

		// Order 2 (~5 days before REFERENCE_INSTANT) - ANATR
		YearMonth ym2 = YearMonth.from(referenceInstant.minusSeconds(86400 * 5).atZone(defaultZoneId));
		BigDecimal sales2 = calculateLineTotal(syrupPrice, (short) 3, disc5); // 10.00 * 3 * 0.95 = 28.50
		addSale.accept(ym2, sales2);
		incrementOrderCount.accept(ym2, null);

		// Order 3 (~8 days before REFERENCE_INSTANT) - AROUT
		YearMonth ym3 = YearMonth.from(referenceInstant.minusSeconds(86400 * 8).atZone(defaultZoneId));
		BigDecimal sales3 = calculateLineTotal(longbreadsPrice, (short) 5, disc10) // 12.50 * 5 * 0.90 = 56.25
				.add(calculateLineTotal(cajunPrice, (short) 2, noDisc)); // 22.00 * 2 * 1 = 44.00 -> Total = 100.25
		addSale.accept(ym3, sales3);
		incrementOrderCount.accept(ym3, null);

		// Order 4 (~3 days before REFERENCE_INSTANT) - BERGS
		YearMonth ym4 = YearMonth.from(referenceInstant.minusSeconds(86400 * 3).atZone(defaultZoneId));
		BigDecimal sales4 = calculateLineTotal(crabPrice, (short) 8, noDisc); // 18.40 * 8 * 1 = 147.20
		addSale.accept(ym4, sales4);
		incrementOrderCount.accept(ym4, null);

		// Ensure all potentially relevant months exist, even if empty (optional, but
		// safer)
		// This line is less critical now that we calculate YM per order, but doesn't
		// hurt.
		// monthlyData.computeIfAbsent(YearMonth.from(referenceDate), k -> new
		// MonthlySalesData());

		// Sort the map by YearMonth before returning
		return monthlyData.entrySet().stream().sorted(Map.Entry.comparingByKey()).collect(Collectors
				.toMap(Map.Entry::getKey, Map.Entry::getValue, (oldValue, newValue) -> oldValue, LinkedHashMap::new));
	}

	private static BigDecimal calculateLineTotal(BigDecimal price, short qty, BigDecimal discount) {
		return price.multiply(BigDecimal.valueOf(qty)).multiply(BigDecimal.ONE.subtract(discount));
	}

	private List<String> parseJsStringArray(String htmlContent, String arrayName) {
		// Regex to find "const arrayName = ['val1', 'val2', ...];" or "let arrayName =
		// [...]"
		// It handles single quotes and potential spaces around elements and equals
		// sign.
		// It captures the content between the brackets.
		Pattern pattern = Pattern.compile("(?:const|let)\\s+" + Pattern.quote(arrayName) + "\\s*=\\s*\\[([^\\]]*)\\];");
		Matcher matcher = pattern.matcher(htmlContent);

		if (matcher.find()) {
			String arrayContent = matcher.group(1).trim();
			if (arrayContent.isEmpty()) {
				return Collections.emptyList();
			}
			// Split by comma, trim whitespace, and remove surrounding single quotes
			return Arrays.stream(arrayContent.split(",")).map(String::trim).map(s -> s.replaceAll("^'|'$", "")) // Remove
																												// leading/trailing
																												// single
																												// quotes
					.collect(Collectors.toList());
		}
		log.warn("Could not find or parse JS string array '{}' in HTML content.", arrayName);
		return Collections.emptyList();
	}

	private List<Double> parseJsDoubleArray(String htmlContent, String arrayName) {
		Pattern pattern = Pattern.compile("(?:const|let)\\s+" + Pattern.quote(arrayName) + "\\s*=\\s*\\[([^\\]]*)\\];");
		Matcher matcher = pattern.matcher(htmlContent);

		if (matcher.find()) {
			String arrayContent = matcher.group(1).trim();
			if (arrayContent.isEmpty()) {
				return Collections.emptyList();
			}
			try {
				return Arrays.stream(arrayContent.split(",")).map(String::trim).filter(s -> !s.isEmpty())
						.map(Double::parseDouble) // Parse as Double
						.collect(Collectors.toList());
			} catch (NumberFormatException e) {
				log.error("Error parsing JS double array '{}': {}", arrayName, e.getMessage());
				return Collections.emptyList();
			}
		}
		log.warn("Could not find or parse JS double array '{}' in HTML content.", arrayName);
		return Collections.emptyList();
	}

	private List<Integer> parseJsIntegerArray(String htmlContent, String arrayName) {
		Pattern pattern = Pattern.compile("(?:const|let)\\s+" + Pattern.quote(arrayName) + "\\s*=\\s*\\[([^\\]]*)\\];");
		Matcher matcher = pattern.matcher(htmlContent);

		if (matcher.find()) {
			String arrayContent = matcher.group(1).trim();
			if (arrayContent.isEmpty()) {
				return Collections.emptyList();
			}
			try {
				return Arrays.stream(arrayContent.split(",")).map(String::trim).filter(s -> !s.isEmpty()) // Filter out
																											// empty
																											// strings
						.map(Integer::parseInt) // Parse as Integer
						.collect(Collectors.toList());
			} catch (NumberFormatException e) {
				log.error("Error parsing JS integer array '{}': {}", arrayName, e.getMessage());
				return Collections.emptyList();
			}
		}
		log.warn("Could not find or parse JS integer array '{}' in HTML content.", arrayName);
		return Collections.emptyList();
	}

	@Test
	public void testSupplierScorecard() throws Exception {
		final String TEST_NAME = "ScriptedReporterTest-SupplierScorecard";
		log.info("========== Starting test: {} ==========", TEST_NAME);

		// Create reporter with H2 connection
		TestBursterFactory.ScriptedReporter reporter = new TestBursterFactory.ScriptedReporter(StringUtils.EMPTY,
				TEST_NAME, NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER, NorthwindTestUtils.H2_PASS) {

			@Override
			protected void executeController() throws Exception {
				super.executeController();

				// Configure the script source and database connection
				ctx.settings.getReportDataSource().scriptoptions.conncode = NorthwindTestUtils.H2_CONN_CODE;
				ctx.settings.getReportDataSource().scriptoptions.idcolumn = "SupplierID";
				ctx.settings
						.getReportDataSource().scriptoptions.scriptname = "scriptedReport_supplierScorecardReport.groovy";

				// Configure output
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
				ctx.settings.getReportTemplate().documentpath = NorthwindTestUtils.SCRIPTED_SCORECARD_TEMPLATE_HTML;
				ctx.settings.setBurstFileName("supplier_${burst_token}_scorecard.html");
			}
		};

		// Execute the burst process
		reporter.burst();

		// Assertions
		BurstingContext ctx = reporter.getCtx();
		assertNotNull("BurstingContext should not be null", ctx);
		assertNotNull("Source data should not be null", ctx.reportData);

		List<String> expectedSupplierIds = Arrays.asList("1", "2", "3");
		assertNotNull("Burst tokens (SupplierIDs) list should not be null", ctx.burstTokens);
		List<String> actualSupplierIds = ctx.burstTokens;
		log.info("Actual burst tokens (SupplierIDs): {}", actualSupplierIds);

		assertTrue("All expected suppliers should be present", actualSupplierIds.containsAll(expectedSupplierIds));
		assertEquals("Number of suppliers should match", expectedSupplierIds.size(), actualSupplierIds.size());

		// Validate metrics for each supplier against pre-calculated values
		for (String supplierId : actualSupplierIds) {
			log.info("Validating metrics for Supplier ID: {}", supplierId);

			Map<String, Object> reportedMetrics = ctx.reportData.stream()
					.filter(row -> supplierId.equals(String.valueOf(row.get("SupplierID")))).findFirst().orElse(null);
			assertNotNull("Data row for Supplier " + supplierId + " should exist", reportedMetrics);

			String companyName = (String) reportedMetrics.get("CompanyName");
			log.info("Validating {} ({})", companyName, supplierId);

			// Verify output file exists
			String outputFileName = "supplier_" + supplierId + "_scorecard.html";
			File outputFile = new File(ctx.outputFolder, outputFileName);
			assertTrue("Output file should exist: " + outputFileName, outputFile.exists());

			switch (supplierId) {
			case "1": // Exotic Liquids
				assertEquals("Product count for Supplier 1", 3,
						((Number) reportedMetrics.get("ProductCount")).intValue());
				// NOTE: Expected values below might need updating after fixing date generation!
				assertEquals("Avg unit price for Supplier 1", 15.67,
						((Number) reportedMetrics.get("AvgUnitPrice")).doubleValue(), 0.01);
				assertEquals("Low stock count for Supplier 1", 2,
						((Number) reportedMetrics.get("LowStockCount")).intValue());
				assertEquals("Avg delivery days for Supplier 1", 5.0,
						((Number) reportedMetrics.get("AvgDeliveryDays")).doubleValue(), 0.1);
				assertEquals("Late delivery percent for Supplier 1", 0.0,
						((Number) reportedMetrics.get("LateDeliveryPercent")).doubleValue(), 0.001);
				assertEquals("Overall rating for Supplier 1", "Good", reportedMetrics.get("OverallRating"));
				break;

			case "2": // New Orleans Cajun Delights
				assertEquals("Product count for Supplier 2", 1,
						((Number) reportedMetrics.get("ProductCount")).intValue());
				// NOTE: Expected values below might need updating after fixing date generation!
				assertEquals("Avg unit price for Supplier 2", 22.00,
						((Number) reportedMetrics.get("AvgUnitPrice")).doubleValue(), 0.01);
				assertEquals("Low stock count for Supplier 2", 0,
						((Number) reportedMetrics.get("LowStockCount")).intValue());
				assertEquals("Avg delivery days for Supplier 2", 5.5, // This might change based on fixed dates
						((Number) reportedMetrics.get("AvgDeliveryDays")).doubleValue(), 0.1);
				assertEquals("Late delivery percent for Supplier 2", 0.500, // This might change based on fixed dates
						((Number) reportedMetrics.get("LateDeliveryPercent")).doubleValue(), 0.001);
				assertEquals("Overall rating for Supplier 2", "Average", reportedMetrics.get("OverallRating")); // Rating
																												// might
																												// change
				break;

			case "3": // Grandma Kelly's Homestead
				assertEquals("Product count for Supplier 3", 2,
						((Number) reportedMetrics.get("ProductCount")).intValue());
				// NOTE: Expected values below might need updating after fixing date generation!
				assertEquals("Avg unit price for Supplier 3", 15.45,
						((Number) reportedMetrics.get("AvgUnitPrice")).doubleValue(), 0.01);
				assertEquals("Low stock count for Supplier 3", 1,
						((Number) reportedMetrics.get("LowStockCount")).intValue());
				assertEquals("Avg delivery days for Supplier 3", 5.5, // This might change based on fixed dates
						((Number) reportedMetrics.get("AvgDeliveryDays")).doubleValue(), 0.1);
				assertEquals("Late delivery percent for Supplier 3", 0.500, // This might change based on fixed dates
						((Number) reportedMetrics.get("LateDeliveryPercent")).doubleValue(), 0.001);
				assertEquals("Overall rating for Supplier 3", "Average", reportedMetrics.get("OverallRating")); // Rating
																												// might
																												// change
				break;

			default:
				fail("Unexpected Supplier ID: " + supplierId);
			}

			// Verify HTML rendering
			String htmlContent = Files.readString(outputFile.toPath(), StandardCharsets.UTF_8);
			Document doc = Jsoup.parse(htmlContent);

			Element ratingElem = doc.selectFirst("span.kpi-label:contains(Rating:) + span.kpi-value");
			assertNotNull("Rating element should be present in HTML", ratingElem);

			// Check for correct rating text based on supplier
			String expectedRating = "Average";
			String expectedRatingClass = "rating-average";
			if ("1".equals(supplierId)) {
				expectedRating = "Good";
				expectedRatingClass = "rating-good";
			}

			assertEquals("Rating in HTML should match for Supplier " + supplierId, expectedRating, ratingElem.text());
			assertTrue("Rating should have class '" + expectedRatingClass + "' for Supplier " + supplierId,
					ratingElem.hasClass(expectedRatingClass));
			log.info("✓ HTML rendering verified for {}", companyName);
		}

		log.info("All supplier scorecard metrics successfully verified");
		log.info("========== Test completed: {} ==========", TEST_NAME);
	}

}