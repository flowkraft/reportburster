package com.sourcekraft.documentburster.common.db;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.SQLException; // Import SQLException

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.model.ServerDatabaseSettings;

/**
 * Utility class to test database connections defined by ServerDatabaseSettings.
 * Designed to be used by CliJob and potentially other services.
 */
public class DatabaseConnectionTester {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionTester.class);

    /**
     * Tests the database connection based on the provided settings.
     * Logs detailed information about the test steps and outcome.
     * Throws an exception if the connection test fails, otherwise completes normally.
     *
     * @param settings The server database settings containing connection details.
     * @throws Exception If the connection test fails for any reason.
     */
    public void testConnection(ServerDatabaseSettings settings) throws Exception {
        if (settings == null || StringUtils.isBlank(settings.type)) {
            throw new IllegalArgumentException("Database settings or type cannot be null or blank.");
        }

        String dbType = settings.type.toLowerCase();
        log.info("Attempting to test connection for database type: {}", dbType);

        boolean success = false;
        try {
            switch (dbType) {
                case "sqlite":
                    success = testSqliteConnection(settings);
                    break;
                // --- Extensibility Point: Add cases for other DB types ---
                case "oracle":
                    // success = testOracleConnection(settings); // Future implementation
                    log.warn("Testing for database type '{}' is not yet implemented.", dbType);
                    throw new UnsupportedOperationException("Testing for Oracle is not yet implemented.");
                case "sqlserver":
                    // success = testSqlServerConnection(settings); // Future implementation
                    log.warn("Testing for database type '{}' is not yet implemented.", dbType);
                    throw new UnsupportedOperationException("Testing for SQL Server is not yet implemented.");
                case "postgresql":
                    // success = testPostgresqlConnection(settings); // Future implementation
                    log.warn("Testing for database type '{}' is not yet implemented.", dbType);
                    throw new UnsupportedOperationException("Testing for PostgreSQL is not yet implemented.");
                case "mysql":
                    // success = testMysqlConnection(settings); // Future implementation
                    log.warn("Testing for database type '{}' is not yet implemented.", dbType);
                    throw new UnsupportedOperationException("Testing for MySQL is not yet implemented.");
                case "mariadb":
                    // success = testMariaDbConnection(settings); // Future implementation
                    log.warn("Testing for database type '{}' is not yet implemented.", dbType);
                    throw new UnsupportedOperationException("Testing for MariaDB is not yet implemented.");
                case "ibmdb2":
                    // success = testIbmDb2Connection(settings); // Future implementation
                    log.warn("Testing for database type '{}' is not yet implemented.", dbType);
                    throw new UnsupportedOperationException("Testing for IBM Db2 is not yet implemented.");
                // ---------------------------------------------------------
                default:
                    log.error("Unsupported database type for testing: {}", dbType);
                    throw new UnsupportedOperationException("Unsupported database type: " + dbType);
            }
        } catch (Exception e) {
            // Log the exception here before re-throwing if needed, or let the caller handle logging
            log.error("Database connection test failed for type '{}'. Reason: {}", dbType, e.getMessage());
            throw e; // Re-throw the exception to signal failure to CliJob/MainProgram
        }

        // If we reach here and success is true (or no exception was thrown by the specific test method)
        log.info("Database connection test successful for type '{}'!", dbType);
        // No need to return boolean if success is indicated by lack of exception
    }

    /**
     * Specific implementation for testing SQLite connections.
     *
     * @param settings The server database settings.
     * @return true if successful (though throwing exception on failure is preferred).
     * @throws Exception if any check or connection step fails.
     */
    private boolean testSqliteConnection(ServerDatabaseSettings settings) throws Exception {
        String dbFilePath = settings.database; // Using 'database' field for SQLite path
        if (StringUtils.isBlank(dbFilePath)) {
            throw new IllegalArgumentException("SQLite database file path is not defined in the connection settings.");
        }
        log.info("SQLite File Path: {}", dbFilePath);

        Path path = Paths.get(dbFilePath);

        // Check 1: File Existence
        log.debug("Checking file existence...");
        if (!Files.exists(path)) {
            throw new Exception("SQLite database file does not exist: " + dbFilePath);
        }
        log.info("File exists.");

        // Check 2: Read Permissions
        log.debug("Checking file readability...");
        if (!Files.isReadable(path)) {
            throw new SecurityException("Cannot read SQLite database file (check permissions): " + dbFilePath);
        }
        log.info("File is readable.");

        // Check 3: Attempt Connection and Basic Query
        String jdbcUrl = "jdbc:sqlite:" + dbFilePath;
        log.debug("Constructed JDBC URL: {}", jdbcUrl);

        // Load the driver (optional for modern JDBC, but good practice for clarity)
        try {
            log.debug("Loading SQLite JDBC driver...");
            Class.forName("org.sqlite.JDBC");
            log.info("SQLite JDBC driver loaded successfully.");
        } catch (ClassNotFoundException e) {
            log.error("SQLite JDBC Driver (org.sqlite.JDBC) not found. Ensure it's in the classpath.", e);
            throw new RuntimeException("SQLite JDBC Driver not found.", e);
        }

        // Use try-with-resources for automatic resource management
        log.debug("Attempting to establish connection...");
        try (Connection connection = DriverManager.getConnection(jdbcUrl);
             Statement statement = connection.createStatement()) {

            log.info("Successfully connected to the SQLite database.");

            log.debug("Executing test query (SELECT 1)...");
            statement.executeQuery("SELECT 1"); // Simple query to test validity
            log.info("Successfully executed test query.");

            return true; // Indicate success

        } catch (SQLException e) {
            log.error("SQL error during SQLite connection test: {} (SQLState: {}, ErrorCode: {})", e.getMessage(), e.getSQLState(), e.getErrorCode());
            // Provide more specific feedback if possible
            if (e.getMessage().contains("database disk image is malformed")) {
                 throw new Exception("Failed to query SQLite database: File may be corrupted.", e);
            } else if (e.getMessage().contains("unable to open database file")) {
                 throw new Exception("Failed to open SQLite database file: Check file integrity and permissions.", e);
            }
            throw new Exception("Failed to connect or query SQLite database.", e); // General exception for other SQL errors
        } catch (Exception e) {
            // Catch any other unexpected exceptions during connection/query
            log.error("Unexpected error during SQLite connection test: {}", e.getMessage(), e);
            throw new Exception("Unexpected error during SQLite connection test.", e);
        }
    }

    // --- Placeholder methods for other database types (Example) ---
    /*
    private boolean testOracleConnection(ServerDatabaseSettings settings) throws Exception {
        log.info("Testing Oracle connection (Not Implemented)");
        // 1. Load Oracle JDBC Driver (e.g., Class.forName("oracle.jdbc.driver.OracleDriver");)
        // 2. Construct JDBC URL (e.g., "jdbc:oracle:thin:@//<host>:<port>/<service_name_or_sid>")
        // 3. Use DriverManager.getConnection(url, user, password)
        // 4. Execute test query (SELECT 1 FROM DUAL)
        // 5. Handle specific Oracle exceptions
        throw new UnsupportedOperationException("Testing for Oracle is not yet implemented.");
    }

    private boolean testSqlServerConnection(ServerDatabaseSettings settings) throws Exception {
        log.info("Testing SQL Server connection (Not Implemented)");
        // 1. Load SQL Server JDBC Driver (e.g., Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");)
        // 2. Construct JDBC URL (e.g., "jdbc:sqlserver://<host>:<port>;databaseName=<database>;user=<user>;password=<password>;encrypt=true;trustServerCertificate=false;") - handle SSL options
        // 3. Use DriverManager.getConnection(url) or with properties
        // 4. Execute test query (SELECT 1)
        // 5. Handle specific SQL Server exceptions
        throw new UnsupportedOperationException("Testing for SQL Server is not yet implemented.");
    }
    // ... add similar placeholders for postgresql, mysql, mariadb, ibmdb2 ...
    */
    // -------------------------------------------------------------
}