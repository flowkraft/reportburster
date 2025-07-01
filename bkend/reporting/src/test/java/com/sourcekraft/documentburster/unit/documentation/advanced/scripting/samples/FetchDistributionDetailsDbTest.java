package com.sourcekraft.documentburster.unit.documentation.advanced.scripting.samples;

import static org.junit.Assert.*;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
// Removed HSQLDB Server imports
// import org.hsqldb.server.Server;
// import org.hsqldb.server.ServerConstants;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster._helpers.DocumentTester;

public class FetchDistributionDetailsDbTest {

	private static final String LEGACY_NO_BURST_TOKENS_PATH = "src/test/resources/input/unit/pdf/legacy-no-burst-tokens.pdf";

	private static final List<String> tokens = Arrays.asList("1", "2", "3", "4");

	// H2 Database file path and URL
	private static final String H2_DB_PATH = "./target/fetch_details_testdb"; // Store in target directory
	private static final String H2_URL = "jdbc:h2:file:" + H2_DB_PATH + ";DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE"; // Keep
																												// DB
																												// open,
																												// allow
																												// multiple
																												// connections
																												// if
																												// needed
	private static final String H2_USER = "sa";
	private static final String H2_PASS = "";

	@Test
	public void burst() throws Exception {

		// Server dbServer = null; // Removed HSQLDB server instance

		try {

			// dbServer = startDbServer(); // Removed HSQLDB server start

			// Removed wait loop for HSQLDB server
			// while (dbServer.getState() == ServerConstants.SERVER_STATE_OPENING) {
			// Thread.sleep(500);
			// }

			createDbConnectionAndTestData(); // This now uses H2

			AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
					"FetchDistributionDetailsDbTest-burst") {
				protected void executeController() throws Exception {

					super.executeController();

					ctx.settings.setBurstFileName("${var0}_${var1}_${var2}.${input_document_extension}");
					ctx.scripts.startExtractDocument = "fetch_distribution_details_from_database.groovy";

				};
			};

			burster.burst(LEGACY_NO_BURST_TOKENS_PATH, false, StringUtils.EMPTY, -1);

			String outputFolder = burster.getCtx().outputFolder + "/";

			assertEquals(tokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

			// assert output reports
			for (String token : tokens) {

				String path = burster.getCtx().outputFolder + "/email" + token + "@address" + token + ".com_firstName"
						+ token + "_lastName" + token + ".pdf";

				File outputReport = new File(path);
				assertTrue(outputReport.exists());

				DocumentTester tester = new DocumentTester(path);

				// assert number of pages
				tester.assertPageCountEquals(1);

				tester.close();
			}

		} finally {

			// Closing the server - No longer needed for embedded H2
			// if (dbServer != null) {
			// dbServer.stop();
			// }

			// Optional: Clean up H2 database files after test if desired
			deleteDatabaseFiles();

		}

	}

	// Removed startDbServer() method as it's HSQLDB specific

	private void createDbConnectionAndTestData() throws Exception {

		// Load H2 Driver
		Class.forName("org.h2.Driver");

		// Getting a connection to the H2 database file
		Connection connection = null;
		try {

			// Use H2 URL, user, and password
			connection = DriverManager.getConnection(H2_URL, H2_USER, H2_PASS);

			// Create test data (SQL remains the same)

			try {
				// Use standard SQL DROP TABLE IF EXISTS for better compatibility
				connection.prepareStatement("DROP TABLE IF EXISTS employees;").execute();
			} catch (Exception e) {
				// Log or ignore if drop fails (e.g., table didn't exist)
				System.err.println("Ignoring error during table drop (likely didn't exist): " + e.getMessage());
			}

			connection.prepareStatement("create table employees (employee_id VARCHAR(50), "
					+ "email_address VARCHAR(50), first_name VARCHAR(50), last_name VARCHAR(50));").execute();

			connection.prepareStatement("insert into employees(employee_id, email_address, first_name, last_name) "
					+ "values ('1','email1@address1.com','firstName1','lastName1');").execute();

			connection.prepareStatement("insert into employees(employee_id, email_address, first_name, last_name) "
					+ "values ('2','email2@address2.com','firstName2','lastName2');").execute();

			connection.prepareStatement("insert into employees(employee_id, email_address, first_name, last_name) "
					+ "values ('3','email3@address3.com','firstName3','lastName3');").execute();

			connection.prepareStatement("insert into employees(employee_id, email_address, first_name, last_name) "
					+ "values ('4','email4@address4.com','firstName4','lastName4');").execute();

		} finally {

			// Closing the connection
			if (connection != null) {
				connection.close();
			}

		}

	}

	// Optional helper method to delete H2 files after test run
	private void deleteDatabaseFiles() {
		File dbFile = new File(H2_DB_PATH + ".mv.db");
		File traceFile = new File(H2_DB_PATH + ".trace.db");
		if (dbFile.exists()) {
			dbFile.delete();
		}
		if (traceFile.exists()) {
			traceFile.delete();
		}
	}

};