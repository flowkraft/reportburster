package com.sourcekraft.documentburster.unit.documentation.advanced.scripting.samples;

import static org.junit.Assert.*;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.hsqldb.server.Server;
import org.hsqldb.server.ServerConstants;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster._helpers.DocumentTester;

public class FetchDistributionDetailsDbTest {

    private static final String LEGACY_NO_BURST_TOKENS_PATH =
            "src/test/resources/input/unit/pdf/legacy-no-burst-tokens.pdf";

    private static final List<String> tokens = Arrays.asList("1", "2", "3", "4");

    @Test
    public void burst() throws Exception {

        Server dbServer = null;

        try {

            dbServer = startDbServer();

            while (dbServer.getState() == ServerConstants.SERVER_STATE_OPENING) {
                Thread.sleep(500);
            }

            createDbConnectionAndTestData();

            AbstractBurster burster =
                    new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "FetchDistributionDetailsDbTest-burst") {
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

                String path =
                        burster.getCtx().outputFolder + "/email" + token + "@address" + token + ".com_firstName"
                                + token + "_lastName" + token + ".pdf";

                File outputReport = new File(path);
                assertTrue(outputReport.exists());

                DocumentTester tester = new DocumentTester(path);

                // assert number of pages
                tester.assertPageCountEquals(1);

                tester.close();
            }

        } finally {

            // Closing the server
            if (dbServer != null) {
                dbServer.stop();
            }

        }

    }

    private Server startDbServer() {

        // 'Server' is a class of HSQLDB representing
        // the database server
        Server hsqlServer = new Server();

        // HSQLDB prints out a lot of informations when
        // starting and closing, which we don't need now.
        // Normally you should point the setLogWriter
        // to some Writer object that could store the logs.
        hsqlServer.setLogWriter(null);
        hsqlServer.setSilent(false);

        // The actual database will be named 'xdb' and its
        // settings and data will be stored in files
        // testdb.properties and testdb.script
        hsqlServer.setDatabaseName(0, "xdb");
        hsqlServer.setDatabasePath(0, "file:target/testdb");

        // Start the database!
        hsqlServer.start();

        return hsqlServer;
    }

    private void createDbConnectionAndTestData() throws Exception {

        Class.forName("org.hsqldb.jdbcDriver");

        // Getting a connection to the newly started database
        Connection connection = null;
        try {

            // Default user of the HSQLDB is 'sa'
            // with an empty password
            connection = DriverManager.getConnection("jdbc:hsqldb:hsql://localhost/xdb", "sa", "");

            // Create test data

            try {
                connection.prepareStatement("drop table employees;").execute();
            } catch (Exception e) {
            }

            connection.prepareStatement(
                    "create table employees (employee_id VARCHAR(50), "
                            + "email_address VARCHAR(50), first_name VARCHAR(50), last_name VARCHAR(50));").execute();

            connection.prepareStatement(
                    "insert into employees(employee_id, email_address, first_name, last_name) "
                            + "values ('1','email1@address1.com','firstName1','lastName1');").execute();

            connection.prepareStatement(
                    "insert into employees(employee_id, email_address, first_name, last_name) "
                            + "values ('2','email2@address2.com','firstName2','lastName2');").execute();

            connection.prepareStatement(
                    "insert into employees(employee_id, email_address, first_name, last_name) "
                            + "values ('3','email3@address3.com','firstName3','lastName3');").execute();

            connection.prepareStatement(
                    "insert into employees(employee_id, email_address, first_name, last_name) "
                            + "values ('4','email4@address4.com','firstName4','lastName4');").execute();

        } finally {

            // Closing the connection
            if (connection != null) {
                connection.close();
            }

        }

    }

};