package com.sourcekraft.documentburster.common.db;

import java.sql.Connection;
import java.sql.Statement;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;

/**
 * Utility class to test database connections defined by ServerDatabaseSettings.
 * Designed to be used by CliJob and potentially other services.
 */
public class DatabaseConnectionTester {

	private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionTester.class);

	/**
	 * Tests the database connection based on the provided settings. Logs detailed
	 * information about the test steps and outcome. Throws an exception if the
	 * connection test fails, otherwise completes normally.
	 *
	 * @param settings The server database settings containing connection details.
	 * @throws Exception If the connection test fails for any reason.
	 */
	public void testConnection(String connectionFilePath) throws Exception {
		Settings settings = new Settings(StringUtils.EMPTY);
		DocumentBursterConnectionDatabaseSettings dbSettings = settings
				.loadSettingsConnectionDatabaseByPath(connectionFilePath);

		DatabaseConnectionManager dbManager = new DatabaseConnectionManager(settings);

		try (Connection connection = dbManager.getJdbcConnection(dbSettings.connection.code)) {
			try (Statement stmt = connection.createStatement()) {
				// ✅ Oracle-compatible test query
				String testSql = getTestQueryForDatabase(dbSettings.connection.databaseserver.type);
				stmt.executeQuery(testSql);
			}
		}
	}

	// Add this helper method
	private String getTestQueryForDatabase(String dbType) {
		String type = (dbType != null) ? dbType.toLowerCase() : "";

		switch (type) {
			case "oracle":
				return "SELECT 1 FROM DUAL"; // ✅ Oracle requires FROM DUAL

			case "db2":
			case "ibmdb2":
				return "SELECT 1 FROM SYSIBM.SYSDUMMY1"; // DB2 equivalent

			default:
				return "SELECT 1"; // Works for PostgreSQL, MySQL, MariaDB, SQL Server, SQLite
		}
	}

}