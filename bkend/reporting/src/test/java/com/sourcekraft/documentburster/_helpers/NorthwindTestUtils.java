package com.sourcekraft.documentburster._helpers;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.db.northwind.NorthwindDataGenerator;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.utils.CsvUtils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

public class NorthwindTestUtils {

	private static final Logger log = LoggerFactory.getLogger(NorthwindTestUtils.class);

	public static final String H2_URL = "jdbc:h2:mem:sqlreporter_test;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=FALSE;MODE=LEGACY";
	public static final String H2_USER = "sa";
	public static final String H2_PASS = "";
	public static final String H2_CONN_CODE = "H2_TEST_CONN"; // Still useful for logging/context

	// Template paths
	public static final String TEMPLATES_DIR = "src/test/resources/templates/northwind/";
	public static final String CUSTOMER_SUMMARY_TEMPLATE_DOCX = TEMPLATES_DIR + "customer_summary_template.docx";
	public static final String CUSTOMER_SUMMARY_TEMPLATE_HTML = TEMPLATES_DIR + "customer_summary_template.html";

	// Add new template paths
	public static final String CUSTOMER_STATEMENT_TEMPLATE_HTML = TEMPLATES_DIR + "customer_statement_template.html"; // New
																														// name
	public static final String TRANSFORMED_SUMMARY_TEMPLATE_DOCX = TEMPLATES_DIR + "transformed_summary_template.docx";

	// Scripted Reporter Template Paths (Moved from ScriptedReporterTest)
	public static final String SCRIPTED_INVOICE_TEMPLATE_HTML = TEMPLATES_DIR + "scriptedReport_invoice_template.html";
	public static final String SCRIPTED_CROSSTAB_TEMPLATE_HTML = TEMPLATES_DIR
			+ "scriptedReport_crosstab_template.html";
	public static final String SCRIPTED_TREND_TEMPLATE_HTML = TEMPLATES_DIR + "scriptedReport_trend_template.html";
	public static final String SCRIPTED_SCORECARD_TEMPLATE_HTML = TEMPLATES_DIR
			+ "scriptedReport_scorecard_template.html";

	public static void ensureTemplateDirectoryExists(String dirPath) {
		File dir = new File(dirPath);
		if (!dir.exists()) {
			log.info("Creating template directory: {}", dirPath);
			dir.mkdirs();
		}
	}

	public static void setupTestDatabase() throws Exception {
		log.info("Setting up test database via NorthwindTestUtils...");

		// Use the correct persistence unit name from persistence.xml
		EntityManagerFactory emf = Persistence.createEntityManagerFactory("northwind-h2-test");
		EntityManager em = null;
		try {
			em = emf.createEntityManager();

			// hibernate.hbm2ddl.auto=create handles schema creation automatically
			// No need for explicit schema creation steps here

			new NorthwindDataGenerator(em).generateAll();

			log.info("Database setup completed successfully via NorthwindTestUtils.");

		} catch (Exception e) {
			log.error("Database setup failed", e);
			if (em != null && em.getTransaction().isActive()) {
				em.getTransaction().rollback();
			}
			// Re-throw as a runtime exception to fail the test setup clearly
			throw new RuntimeException("Database setup failed", e);
		} finally {
			if (em != null && em.isOpen()) {
				em.close();
			}
			if (emf != null && emf.isOpen()) {
				emf.close();
			}
		}
	}

	public static List<Integer> getOrderIdsForCustomer(String customerId) throws Exception {
		List<Integer> orderIds = new ArrayList<>();
		String sql = "SELECT \"OrderID\" FROM \"Orders\" WHERE \"CustomerID\" = ?";
		// Use try-with-resources for automatic connection closing
		try (Connection conn = DriverManager.getConnection(NorthwindTestUtils.H2_URL, NorthwindTestUtils.H2_USER,
				NorthwindTestUtils.H2_PASS); PreparedStatement pstmt = conn.prepareStatement(sql)) {

			pstmt.setString(1, customerId);
			try (ResultSet rs = pstmt.executeQuery()) {
				while (rs.next()) {
					orderIds.add(rs.getInt("OrderID"));
				}
			}
		}
		log.debug("Fetched Order IDs for Customer {}: {}", customerId, orderIds);
		return orderIds;
	}

	public static void generateSimpleDocxTemplate(String filePath, String... placeholders) throws Exception {
		File file = new File(filePath);
		if (file.exists()) {
			log.debug("Template file already exists: {}", filePath);
			return;
		}
		log.info("Generating basic DOCX template: {}", filePath);
		try (XWPFDocument document = new XWPFDocument(); FileOutputStream out = new FileOutputStream(filePath)) {

			XWPFParagraph title = document.createParagraph();
			XWPFRun titleRun = title.createRun();
			titleRun.setText("Report for ${burst_token}"); // Example title
			titleRun.setBold(true);
			titleRun.setFontSize(16);
			titleRun.addBreak();

			for (String placeholder : placeholders) {
				XWPFParagraph p = document.createParagraph();
				XWPFRun run = p.createRun();
				// Use Freemarker syntax for placeholders
				run.setText(placeholder + ": ${" + placeholder + "}");
			}
			document.write(out);
			log.info("Successfully generated DOCX template: {}", filePath);
		}
	}

	public static void generateSimpleHtmlTemplate(String filePath, String... placeholders) throws Exception {
		File file = new File(filePath);
		if (file.exists()) {
			log.debug("Template file already exists: {}", filePath);
			return;
		}
		log.info("Generating basic HTML template: {}", filePath);
		// Use StringBuilder for Java 11 compatibility
		StringBuilder html = new StringBuilder();
		html.append("<!DOCTYPE html>\n");
		html.append("<html>\n");
		html.append("<head><title>Report for ${burst_token}</title></head>\n");
		html.append("<body>\n");
		html.append("<h1>Report for ${burst_token}</h1>\n");
		html.append("<ul>\n");
		for (String placeholder : placeholders) {
			// Use Freemarker syntax for placeholders
			html.append("  <li>").append(placeholder).append(": ${").append(placeholder).append("}</li>\n");
		}
		html.append("</ul>\n");
		html.append("</body>\n");
		html.append("</html>");

		Files.write(Paths.get(filePath), html.toString().getBytes(StandardCharsets.UTF_8));
		log.info("Successfully generated HTML template: {}", filePath);
	}

	/**
	 * Generates a simple HTML template for Customer Statement. Compatible with Java
	 * <= 11 (no text blocks).
	 * 
	 * @param filePath Path to save the template file.
	 * @throws Exception If file writing fails.
	 */
	public static void generateCustomerStatementTemplateHtml(String filePath) throws Exception {
		File file = new File(filePath);
		if (file.exists()) {
			log.debug("Template file already exists: {}", filePath);
			return;
		}
		log.info("Generating Customer Statement HTML template: {}", filePath);
		// Use StringBuilder for Java 11 compatibility
		StringBuilder html = new StringBuilder();
		html.append("<!DOCTYPE html>\n");
		html.append("<html>\n");
		html.append("<head>\n");
		html.append("  <meta charset=\"UTF-8\">\n");
		html.append("  <title>Customer Statement - ${CustomerID}</title>\n");
		html.append("  <style>\n");
		html.append("    body { font-family: 'Arial', sans-serif; margin: 20px; }\n");
		html.append(
				"    .statement { border: 1px solid #eee; padding: 20px; max-width: 800px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }\n");
		html.append("    h1, h2 { color: #333; }\n");
		html.append("    table { width: 100%; border-collapse: collapse; margin-top: 20px; }\n");
		html.append("    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n");
		html.append("    th { background-color: #f2f2f2; }\n");
		html.append("    .total { font-weight: bold; text-align: right; }\n");
		html.append("  </style>\n");
		html.append("</head>\n");
		html.append("<body>\n");
		html.append("  <div class=\"statement\">\n");
		html.append("    <h1>Customer Statement</h1>\n");
		html.append("    <h2>${CompanyName} (${CustomerID})</h2>\n");
		html.append("    <p>Statement Date: ${StatementDate!.now?string('yyyy-MM-dd')}</p>\n"); // Example placeholder
		html.append("    <hr>\n");
		html.append("    <h3>Account Summary</h3>\n");
		html.append("    <p>Previous Balance: ${PreviousBalance!'0.00'}</p>\n"); // Example placeholder
		html.append("    <p>Total Payments: ${TotalPayments!'0.00'}</p>\n"); // Example placeholder
		html.append("    <p>Total New Charges: ${TotalNewCharges!'0.00'}</p>\n"); // Example placeholder
		html.append("    <p><strong>Current Balance Due: ${CurrentBalance!'0.00'}</strong></p>\n"); // Example
																									// placeholder
		html.append("    <hr>\n");
		html.append("    <h3>Transaction Details</h3>\n");
		html.append("    <table>\n");
		html.append("      <thead>\n");
		html.append("        <tr><th>Date</th><th>Description</th><th>Amount</th></tr>\n");
		html.append("      </thead>\n");
		html.append("      <tbody>\n");
		html.append("        <!-- Freemarker list iteration example -->\n");
		html.append("        <#if transactions??>\n"); // Check if transactions list exists
		html.append("          <#list transactions as tx>\n");
		html.append("            <tr>\n");
		html.append("              <td>${tx.Date?string('yyyy-MM-dd')}</td>\n"); // Example date formatting
		html.append("              <td>${tx.Description}</td>\n");
		html.append("              <td>${tx.Amount?string(',##0.00')}</td>\n"); // Example number formatting
		html.append("            </tr>\n");
		html.append("          </#list>\n");
		html.append("        <#else>\n");
		html.append("          <tr><td colspan=\"3\">No transactions for this period.</td></tr>\n");
		html.append("        </#if>\n");
		html.append("      </tbody>\n");
		html.append("    </table>\n");
		html.append("  </div>\n");
		html.append("</body>\n");
		html.append("</html>");

		Files.write(Paths.get(filePath), html.toString().getBytes(StandardCharsets.UTF_8));
		log.info("Successfully generated Customer Statement HTML template: {}", filePath);
	}

	/**
	 * Generates HTML template for the ScriptedReporter Invoice Master-Detail test
	 * and writes it to a file. Compatible with Java 11 (no text blocks).
	 * 
	 * @param filePath Path to save the template file.
	 * @throws Exception If file writing fails.
	 */
	public static void generateScriptedInvoiceTemplateFile(String filePath) throws Exception {
		File file = new File(filePath);
		if (file.exists()) {
			log.debug("Template file already exists: {}", filePath);
			return;
		}
		log.info("Generating Scripted Invoice HTML template: {}", filePath);
		String html = generateScriptedInvoiceTemplateHtml(); // Use existing method for content
		Files.write(Paths.get(filePath), html.getBytes(StandardCharsets.UTF_8));
		log.info("Successfully generated Scripted Invoice HTML template: {}", filePath);
	}

	private static String generateScriptedInvoiceTemplateHtml() {
		// Using actual newline characters (\n)
		return "<!DOCTYPE html>\n" + "<html>\n" + "<head>\n" + "  <meta charset=\"UTF-8\">\n"
				+ "  <title>Invoice ${OrderID}</title>\n" + "  <style>\n" + "    body { font-family: sans-serif; }\n"
				+ "    table { border-collapse: collapse; width: 100%; margin-top: 15px; }\n"
				+ "    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n"
				+ "    th { background-color: #f2f2f2; }\n"
				+ "    .total-row td { font-weight: bold; text-align: right; }\n" + "  </style>\n" + "</head>\n"
				+ "<body>\n" + "  <h1>Invoice ${OrderID}</h1>\n" + "  <p>\n" + // Keep the <p> tag structure
				"    <strong>Date:</strong> ${OrderDate} <br>\n"
				+ "    <strong>Customer:</strong> ${CustomerID} (${CompanyName!'N/A'})\n" + "  </p>\n" + // Removed the
																											// extra
																											// blank
																											// line here
				"  <h2>Details</h2>\n" + "  <table>\n" + "    <thead>\n" + "      <tr>\n" + "        <th>Product</th>\n"
				+ "        <th>Quantity</th>\n" + "        <th>Unit Price</th>\n" + "        <th>Discount</th>\n"
				+ "        <th>Line Total</th>\n" + "      </tr>\n" + "    </thead>\n" + "    <tbody>\n"
				+ "      <#assign subtotal = 0>\n" + "      <#if details??>\n" + "      <#list details as item>\n"
				+ "        <#-- Handle potential nulls in item map -->\n"
				+ "        <#assign qty = (item.Quantity!0)>\n" + "        <#assign price = (item.UnitPrice!0)>\n"
				+ "        <#assign discount = (item.Discount!0)>\n"
				+ "        <#assign lineTotal = (qty * price * (1 - discount)) >\n"
				+ "        <#assign subtotal = subtotal + lineTotal>\n" + "        <tr>\n"
				+ "          <td>${item.ProductName!'N/A'}</td>\n" + "          <td>${qty}</td>\n"
				+ "          <td>${price?string(\"0.00\")}</td>\n" + "          <td>${discount?string(\"0%\")}</td>\n"
				+ "          <td style=\"text-align: right;\">${lineTotal?string(\"0.00\")}</td>\n" + "        </tr>\n"
				+ "      </#list>\n" + "      </#if>\n" + "    </tbody>\n" + "    <tfoot>\n"
				+ "      <tr class=\"total-row\">\n" + "        <td colspan=\"4\">Subtotal:</td>\n"
				+ "        <td>${subtotal?string(\"0.00\")}</td>\n" + "      </tr>\n"
				+ "      <tr class=\"total-row\">\n" + "        <td colspan=\"4\">Freight:</td>\n"
				+ "        <td>${(Freight!0)?string(\"0.00\")}</td>\n" + "      </tr>\n"
				+ "      <#-- Assuming Tax is calculated or provided -->\n"
				+ "      <#assign freightVal = (Freight!0)>\n"
				+ "      <#assign tax = (subtotal + freightVal) * 0.08 > <#-- Example Tax Calc -->\n"
				+ "      <tr class=\"total-row\">\n" + "        <td colspan=\"4\">Tax (8%):</td>\n"
				+ "        <td>${tax?string(\"0.00\")}</td>\n" + "      </tr>\n" + "      <tr class=\"total-row\">\n"
				+ "        <td colspan=\"4\">Grand Total:</td>\n"
				+ "        <td>${(subtotal + freightVal + tax)?string(\"0.00\")}</td>\n" + "      </tr>\n"
				+ "    </tfoot>\n" + "  </table>\n" + "</body>\n" + "</html>\n"; // Final newline is fine
	}

	/**
	 * Generates HTML template for the ScriptedReporter Crosstab test and writes it
	 * to a file. Compatible with Java 11 (no text blocks).
	 * 
	 * @param filePath Path to save the template file.
	 * @throws Exception If file writing fails.
	 */
	public static void generateScriptedCrosstabTemplateFile(String filePath) throws Exception {
		File file = new File(filePath);
		if (file.exists()) {
			log.debug("Template file already exists: {}", filePath);
			return;
		}
		log.info("Generating Scripted Crosstab HTML template: {}", filePath);
		String html = generateScriptedCrosstabTemplateHtml(); // Use existing method for content
		Files.write(Paths.get(filePath), html.getBytes(StandardCharsets.UTF_8));
		log.info("Successfully generated Scripted Crosstab HTML template: {}", filePath);
	}

	/**
	 * Generates HTML template content for the ScriptedReporter Crosstab test.
	 * Compatible with Java 11 (no text blocks).
	 * 
	 * @return HTML template string.
	 */
	private static String generateScriptedCrosstabTemplateHtml() { // Made private
		// Using actual newline characters (\n)
		return "<!DOCTYPE html>\n" + "<html>\n" + "<head>\n" + "  <meta charset=\"UTF-8\">\n"
				+ "  <title>Category Sales by Region</title>\n" + "  <style>\n"
				+ "    body { font-family: sans-serif; }\n"
				+ "    table { border-collapse: collapse; width: 80%; margin-top: 15px; }\n"
				+ "    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }\n"
				+ "    th { background-color: #f2f2f2; text-align: center; }\n"
				+ "    td:first-child { text-align: left; font-weight: bold; }\n"
				+ "    tfoot td { font-weight: bold; background-color: #f9f9f9; }\n" + // Style for footer
				"  </style>\n" + "</head>\n" + "<body>\n" + "  <h1>Category Sales by Region</h1>\n" + "\n" + // Keep
																												// intentional
																												// blank
																												// line
																												// if
																												// desired
				"  <#-- Assume reportData is the list passed from the script -->\n"
				+ "  <#if reportData?? && reportData?has_content>\n"
				+ "    <#-- Dynamically determine region columns (excluding CategoryName and TotalSales) -->\n"
				+ "    <#assign firstRow = reportData[0]>\n"
				+ "    <#assign regions = firstRow?keys?filter(k -> k != 'CategoryName' && k != 'TotalSales')?sort>\n"
				+ "\n" + "    <#-- Initialize column totals -->\n" + "    <#assign regionTotals = {} >\n"
				+ "    <#list regions as region>\n" + "        <#assign regionTotals = regionTotals + {region: 0} >\n"
				+ "    </#list>\n" + "    <#assign grandTotal = 0>\n" + "\n" + "    <table>\n" + "      <thead>\n"
				+ "        <tr>\n" + "          <th>Category</th>\n" + "          <#list regions as region>\n"
				+ "            <th>${region}</th>\n" + "          </#list>\n" + "          <th>Total Sales</th>\n"
				+ "        </tr>\n" + "      </thead>\n" + "      <tbody>\n" + "        <#list reportData as row>\n"
				+ "          <tr>\n" + "            <td>${row.CategoryName!'N/A'}</td>\n"
				+ "            <#list regions as region>\n" + "              <#assign cellValue = (row[region]!0)>\n"
				+ "              <td>${cellValue?string(\"0.00\")}</td>\n"
				+ "              <#-- Update region total -->\n"
				+ "              <#assign regionTotals = regionTotals + {region: regionTotals[region] + cellValue} >\n"
				+ "            </#list>\n" + "            <#assign rowTotal = (row.TotalSales!0)>\n"
				+ "            <td>${rowTotal?string(\"0.00\")}</td>\n" + "            <#-- Update grand total -->\n"
				+ "            <#assign grandTotal = grandTotal + rowTotal>\n" + "          </tr>\n"
				+ "        </#list>\n" + "      </tbody>\n" + "      <tfoot>\n" + // Added footer section
				"        <tr>\n" + "          <td><strong>Total</strong></td>\n"
				+ "          <#list regions as region>\n"
				+ "            <td>${(regionTotals[region])?string(\"0.00\")}</td>\n" + // Display region total
				"          </#list>\n" + "          <td>${grandTotal?string(\"0.00\")}</td>\n" + // Display grand total
				"        </tr>\n" + "      </tfoot>\n" + "    </table>\n" + "  <#else>\n"
				+ "    <p>No crosstab data available.</p>\n" + "  </#if>\n" + "</body>\n" + "</html>\n"; // Final
																											// newline
																											// is fine
	}

	/**
	 * Generates HTML template for the ScriptedReporter Trend Chart test and writes
	 * it to a file. Compatible with Java 11 (no text blocks).
	 * 
	 * @param filePath Path to save the template file.
	 * @throws Exception If file writing fails.
	 */
	public static void generateScriptedTrendTemplateFile(String filePath) throws Exception {
		File file = new File(filePath);
		if (file.exists()) {
			log.debug("Template file already exists: {}", filePath);
			return;
		}
		log.info("Generating Scripted Trend HTML template: {}", filePath);
		String html = generateScriptedTrendTemplateHtml(); // Use existing method for content
		Files.write(Paths.get(filePath), html.getBytes(StandardCharsets.UTF_8));
		log.info("Successfully generated Scripted Trend HTML template: {}", filePath);
	}

	/**
	 * Generates HTML template content for the ScriptedReporter Trend Chart test.
	 * Compatible with Java 11 (no text blocks).
	 * 
	 * @return HTML template string.
	 */
	private static String generateScriptedTrendTemplateHtml() { // Made private
		// Using actual newline characters (\n)
		return "<!DOCTYPE html>\n" + "<html>\n" + "<head>\n" + "  <meta charset=\"UTF-8\">\n"
				+ "  <title>Monthly Sales Trend</title>\n"
				+ "  <script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script> <#-- Include Chart.js -->\n"
				+ "  <style>\n" + "    body { font-family: sans-serif; }\n"
				+ "    .chart-container { width: 80%; margin: auto; }\n" + "  </style>\n" + "</head>\n" + "<body>\n"
				+ "  <h1>Monthly Sales Trend</h1>\n" + "\n" + "  <div class=\"chart-container\">\n"
				+ "    <canvas id=\"salesChart\"></canvas>\n" + "  </div>\n" + "\n"
				+ "  <#-- Assume reportData is the list passed from the script -->\n" + "  <script>\n"
				+ "    // Build JS arrays directly using Freemarker\n"
				+ "    const labels = [<#if reportData??><#list reportData as row>'${row.YearMonth!''}'<#sep>, </#list></#if>];\n"
				+ "    const salesData = [<#if reportData??><#list reportData as row>${row.MonthlySales!0}<#sep>, </#list></#if>];\n"
				+ "    const orderCountData = [<#if reportData??><#list reportData as row>${row.OrderCount!0}<#sep>, </#list></#if>];\n"
				+ "\n" + "    const ctx = document.getElementById('salesChart').getContext('2d');\n"
				+ "    const salesChart = new Chart(ctx, {\n" + "      type: 'line',\n" + "      data: {\n"
				+ "        labels: labels,\n" + "        datasets: [\n" + "          {\n"
				+ "            label: 'Monthly Sales',\n" + "            data: salesData,\n"
				+ "            borderColor: 'rgb(75, 192, 192)',\n" + "            tension: 0.1,\n"
				+ "            yAxisID: 'ySales'\n" + "          },\n" + "          {\n"
				+ "            label: 'Order Count',\n" + "            data: orderCountData,\n"
				+ "            borderColor: 'rgb(255, 99, 132)',\n" + "            tension: 0.1,\n"
				+ "            yAxisID: 'yOrders'\n" + "          }\n" + "        ]\n" + "      },\n"
				+ "      options: {\n" + "        scales: {\n" + "          ySales: {\n"
				+ "            type: 'linear',\n" + "            display: true,\n" + "            position: 'left',\n"
				+ "            title: { display: true, text: 'Sales ($)' }\n" + "          },\n"
				+ "          yOrders: {\n" + "            type: 'linear',\n" + "            display: true,\n"
				+ "            position: 'right',\n" + "            title: { display: true, text: 'Orders' },\n"
				+ "            grid: { drawOnChartArea: false } // only want the grid lines for one axis to show up\n"
				+ "          }\n" + "        }\n" + "      }\n" + "    });\n" + "  </script>\n" + "</body>\n"
				+ "</html>\n";
	}

	/**
	 * Generates HTML template for the ScriptedReporter Supplier Scorecard test and
	 * writes it to a file. Compatible with Java 11 (no text blocks).
	 * 
	 * @param filePath Path to save the template file.
	 * @throws Exception If file writing fails.
	 */
	public static void generateScriptedScorecardTemplateFile(String filePath) throws Exception {
		File file = new File(filePath);
		if (file.exists()) {
			log.debug("Template file already exists: {}", filePath);
			return;
		}
		log.info("Generating Scripted Scorecard HTML template: {}", filePath);
		String html = generateScriptedScorecardTemplateHtml(); // Use existing method for content
		Files.write(Paths.get(filePath), html.getBytes(StandardCharsets.UTF_8));
		log.info("Successfully generated Scripted Scorecard HTML template: {}", filePath);
	}

	private static String generateScriptedScorecardTemplateHtml() { // Made private
		// Using actual newline characters (\n) for readability in source, removed final
		// \n
		return "<!DOCTYPE html>\n" + "<html>\n" + "<head>\n" + "  <meta charset=\"UTF-8\">\n"
				+ "  <title>Supplier Scorecard - ${SupplierID}</title>\n" + "  <style>\n"
				+ "    body { font-family: sans-serif; margin: 20px; }\n"
				+ "    .scorecard { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; max-width: 600px; background-color: #f9f9f9; }\n"
				+ "    h1, h2, h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; }\n"
				+ "    .kpi-section { margin-bottom: 15px; }\n" + "    .kpi { margin-bottom: 8px; }\n"
				+ "    .kpi-label { font-weight: bold; display: inline-block; width: 180px; color: #555; }\n"
				+ "    .kpi-value { display: inline-block; }\n"
				+ "    .rating-good { color: green; font-weight: bold; }\n"
				+ "    .rating-average { color: orange; font-weight: bold; }\n"
				+ "    .rating-poor { color: red; font-weight: bold; }\n"
				+ "    .rating-na { color: grey; font-style: italic; }\n" // Added style for N/A
				+ "  </style>\n" + "</head>\n" + "<body>\n" + "  <div class=\"scorecard\">\n"
				+ "    <h1>Supplier Scorecard</h1>\n" + "    <h2>${CompanyName!'N/A'} (ID: ${SupplierID})</h2>\n" + "\n"
				+ "    <div class=\"kpi-section\">\n" + "      <h3>Overall</h3>\n" + "      <div class=\"kpi\">\n"
				+ "        <span class=\"kpi-label\">Rating:</span>\n"
				// Add a class based on the rating value for styling, handle N/A explicitly
				+ "        <span class=\"kpi-value rating-${((OverallRating!'N/A') == 'N/A')?then('na', (OverallRating!'average')?lower_case)}\">${OverallRating!'N/A'}</span>\n"
				+ "      </div>\n" + "    </div>\n" + "\n" + "    <div class=\"kpi-section\">\n"
				+ "      <h3>Product Metrics</h3>\n" + "      <div class=\"kpi\">\n"
				+ "        <span class=\"kpi-label\">Product Count:</span>\n"
				+ "        <span class=\"kpi-value\">${(ProductCount!0)?string(\"0\")}</span>\n" // Format as integer
				+ "      </div>\n" + "      <div class=\"kpi\">\n"
				+ "        <span class=\"kpi-label\">Avg. Unit Price:</span>\n"
				+ "        <span class=\"kpi-value\">${(AvgUnitPrice!0)?string(\"$0.00\")}</span>\n" // Currency format
				+ "      </div>\n" + "      <div class=\"kpi\">\n"
				+ "        <span class=\"kpi-label\">Low Stock Products:</span>\n"
				+ "        <span class=\"kpi-value\">${(LowStockCount!0)?string(\"0\")}</span>\n" // Format as integer
				+ "      </div>\n" + "    </div>\n" + "\n" + "    <div class=\"kpi-section\">\n"
				+ "      <h3>Delivery Performance</h3>\n" + "      <div class=\"kpi\">\n"
				+ "        <span class=\"kpi-label\">Avg. Delivery Days:</span>\n"
				// Format with one decimal place, handle N/A if no shipped orders
				+ "        <span class=\"kpi-value\"><#if AvgDeliveryDays??>${AvgDeliveryDays?string(\"0.0\")}<#else>N/A</#if></span>\n"
				+ "      </div>\n" + "      <div class=\"kpi\">\n"
				+ "        <span class=\"kpi-label\">Late Delivery %:</span>\n"
				// Format as percentage, handle N/A if no shipped orders
				+ "        <span class=\"kpi-value\"><#if LateDeliveryPercent??>${LateDeliveryPercent?string(\"0.0%\")}<#else>N/A</#if></span>\n"
				+ "      </div>\n" + "    </div>\n" + "\n" + "    <#-- Placeholder for potential future sections -->\n"
				+ "\n" + "  </div>\n"
				// --- Removed the final \n after </html> ---
				+ "</body>\n" + "</html>";
	}

	/**
	 * Ensure all HTML templates for reporting are generated.
	 */
	public static void ensureReportingTemplates() throws Exception {
		log.info("Ensuring all reporting templates exist in: {}", TEMPLATES_DIR);
		ensureTemplateDirectoryExists(TEMPLATES_DIR);
		// Basic templates
		generateSimpleDocxTemplate(CUSTOMER_SUMMARY_TEMPLATE_DOCX, "CustomerID", "CompanyName", "Country");
		generateSimpleHtmlTemplate(CUSTOMER_SUMMARY_TEMPLATE_HTML, "CustomerID", "CompanyName", "Country");
		generateCustomerStatementTemplateHtml(CUSTOMER_STATEMENT_TEMPLATE_HTML); // Keep this specific one
		generateSimpleDocxTemplate(TRANSFORMED_SUMMARY_TEMPLATE_DOCX, "Country", "CustomerCount");

		// Scripted reporter templates
		generateScriptedInvoiceTemplateFile(SCRIPTED_INVOICE_TEMPLATE_HTML);
		generateScriptedCrosstabTemplateFile(SCRIPTED_CROSSTAB_TEMPLATE_HTML);
		generateScriptedTrendTemplateFile(SCRIPTED_TREND_TEMPLATE_HTML);
		generateScriptedScorecardTemplateFile(SCRIPTED_SCORECARD_TEMPLATE_HTML);
		log.info("Finished checking/generating reporting templates.");
	}

	/**
	 * Helper method to run transformation tests
	 * 
	 * @param transformationType The transformation library to use
	 * @throws Exception if test fails
	 */
	public static void runDataTransformationTest(String transformationType) throws Exception {
		final String TEST_NAME = "SqlReporterTest-" + transformationType + "Transform";
		log.info("========== Starting test: {} ==========", TEST_NAME);

		// *** Generate the correct template for this test ***
		// Ensure the directory exists first
		ensureTemplateDirectoryExists(TEMPLATES_DIR);
		// Generate the specific template for transformed data (Country, CustomerCount)
		generateSimpleDocxTemplate(TRANSFORMED_SUMMARY_TEMPLATE_DOCX, "Country", "CustomerCount");

		// Create reporter with H2 connection details
		TestBursterFactory.SqlReporter reporter = new TestBursterFactory.SqlReporter(StringUtils.EMPTY, TEST_NAME,
				H2_URL, H2_USER, H2_PASS) {
			@Override
			protected void executeController() throws Exception {
				super.executeController();
				log.debug("Configuring SQL and transformation settings for test...");

				// Configure SQL query for all Customers (not just German ones)
				ctx.settings.getReportDataSource().sqloptions.conncode = H2_CONN_CODE;
				ctx.settings.getReportDataSource().sqloptions.idcolumn = "Country";
				ctx.settings
						.getReportDataSource().sqloptions.query = "SELECT \"CustomerID\" AS \"CustomerID\", \"CompanyName\" AS \"CompanyName\", \"Country\" AS \"Country\" FROM \"Customers\"";

				// Point to the custom transformation script based on the type
				ctx.scripts.transformFetchedData = "transformFetchedData_" + transformationType + ".groovy";
				log.info("Using transformation script: {}", ctx.scripts.transformFetchedData);

				// Configure output settings
				ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
				// *** Use the newly generated template ***
				ctx.settings.getReportTemplate().documentpath = TRANSFORMED_SUMMARY_TEMPLATE_DOCX;
				ctx.settings.setBurstFileName("${burst_token}.docx");
			}

		};

		// Execute the burst process
		reporter.burst();

		// Verify results - note that now we're bursting by Country
		List<String[]> parsedLines = TestsUtils.toArrayRows(reporter.getCtx().reportData);
		BurstingContext ctx = reporter.getCtx();

		// Basic validations
		assertNotNull("Parsed lines should not be null", parsedLines);
		assertFalse("Parsed lines should not be empty", parsedLines.isEmpty());

		// Verify transformed headers - should be Country and CustomerCount
		String[] header = parsedLines.get(0);
		assertArrayEquals("Header row mismatch", new String[] { "Country", "CustomerCount" }, header);

		// Check if the transformed data is present
		boolean foundGermany = false;
		int germanyCount = 0;
		String germanyToken = null; // Store the token for variable check

		for (int i = 1; i < parsedLines.size(); i++) {
			String[] row = parsedLines.get(i);
			if ("Germany".equals(row[0])) {
				foundGermany = true;
				germanyCount = Integer.parseInt(row[1]);
				germanyToken = row[0];
				break;
			}
		}

		assertTrue("Germany should be present in results", foundGermany);
		assertEquals("Germany should have 11 customers", 10, germanyCount);
		assertNotNull("Germany token should have been found", germanyToken); // Ensure we found the token

		// --- Assertions for Parsed Variables ---
		log.info("Verifying variables for token: {}", germanyToken);
		Map<String, Object> germanyVars = ctx.variables.getUserVariables(germanyToken);
		assertNotNull("Variables for token '" + germanyToken + "' should exist", germanyVars);

		// Check variables based on the *transformed* data structure (col0=Country,
		// col1=CustomerCount)
		assertEquals("Variable 'col0' should be the country", germanyToken, germanyVars.get("col0"));
		assertEquals("Variable 'var0' should be the country", germanyToken, germanyVars.get("var0")); // Check numeric
																										// alias
		// too
		assertEquals("Variable 'col1' should be the customer count", String.valueOf(germanyCount),
				germanyVars.get("col1"));
		assertEquals("Variable 'var1' should be the customer count", String.valueOf(germanyCount),
				germanyVars.get("var1")); // Check

		// Check that variables corresponding to columns *not present* in the
		// transformed data are blank
		assertTrue("Variable 'col2' (from original data) should be blank",
				StringUtils.isBlank((String) germanyVars.get("col2")));
		assertTrue("Variable 'var2' (from original data) should be blank",
				StringUtils.isBlank((String) germanyVars.get("var2")));

		log.info("Variable assertions passed for token: {}", germanyToken);
		// --- End Variable Assertions ---

		// Verify document generation
		assertTrue("Germany document should exist", new File(ctx.outputFolder + "/Germany.docx").exists());

		log.info("Test completed successfully: {}", TEST_NAME);
	}

}