package com.sourcekraft.documentburster.common;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.sourcekraft.documentburster.common.db.northwind.NorthwindManager;
import com.sourcekraft.documentburster.common.db.northwind.NorthwindManager.DatabaseVendor;

/**
 * Command-line interface for managing different families of "starter packs".
 * Currently supports the 'database' family using NorthwindManager.
 */
public class StarterPackCLI {

	// Keep direct manager for now, assuming 'database' family uses NorthwindManager
	private static final NorthwindManager dbManager = new NorthwindManager();
	// Define the family name this CLI currently handles primarily
	private static final String DB_FAMILY = "database";
	private static final String NORTHWIND_PACK = "northwind"; // Specific pack name within the database family

	// Command constants
	private static final String CMD_START = "start";
	private static final String CMD_STOP = "stop";
	private static final String CMD_LIST = "list";
	private static final String CMD_INFO = "info";
	private static final String CMD_QUERY = "query"; // Keep Northwind query capability
	private static final String CMD_HELP = "help";
	private static final String CMD_EXIT = "exit";
	// Keep Northwind-specific commands for now, prefixed by family
	// private static final String CMD_STARTALL = "startall"; // Consider if these
	// make sense globally or per-family
	// private static final String CMD_STOPALL = "stopall";

	/**
	 * Main entry point for the CLI
	 */
	public static void main(String[] args) {
		System.out.println("Starter Pack Manager CLI");
		System.out.println("Usage: <family> <command> [pack_name] [args...]");
		System.out.println("Example: database start northwind postgresql");
		System.out.println("Type 'help' for general commands or '<family> help' for specific commands.");

		// Register shutdown hook to ensure containers are stopped
		Runtime.getRuntime().addShutdownHook(new Thread(() -> {
			System.out.println("\nShutdown hook triggered. Stopping known services...");
			// Currently only stops the database manager
			dbManager.close();
			// Add closing logic for other managers if introduced later
			System.out.println("Shutdown complete.");
		}));

		// If args are provided, process as a single command
		if (args.length > 0) {
			processCommand(String.join(" ", args));
			return; // Exit main thread
		}

		// Interactive mode
		try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
			String commandLine;
			boolean running = true;

			while (running) {
				System.out.print("\nstarter> "); // Changed prompt
				commandLine = reader.readLine();
				if (commandLine == null) { // Handle EOF
					commandLine = CMD_EXIT;
				} else {
					commandLine = commandLine.trim();
				}

				if (commandLine.equalsIgnoreCase(CMD_EXIT)) {
					running = false;
				} else if (!commandLine.isEmpty()) {
					processCommand(commandLine);
				}
			}
			System.out.println("Exiting CLI...");

		} catch (Exception e) {
			System.err.println("CLI Error: " + e.getMessage());
			e.printStackTrace();
		}
	}

	/**
	 * Process a command string. Expects format: <family> <command> [args...] Or
	 * global commands: help, exit
	 */
	private static void processCommand(String commandLine) {
		if (commandLine == null || commandLine.trim().isEmpty()) {
			return;
		}

		String[] parts = commandLine.split("\\s+", 2); // Split first word (family or global command)
		String firstWord = parts[0].toLowerCase();

		// Handle global commands first
		if (firstWord.equals(CMD_HELP) || firstWord.equals(CMD_EXIT)) {
			handleGlobalCommand(firstWord, parts.length > 1 ? parts[1] : "");
			return;
		}

		// If not a global command, assume <family> <command> [args...] structure
		if (parts.length < 2) {
			System.out.println(
					"Invalid command structure. Expected: <family> <command> [args...] or a global command (help, exit).");
			System.out.println("Known families: " + DB_FAMILY /* Add others later */);
			return;
		}

		String packFamily = firstWord;
		String remainingArgs = parts[1];
		String[] commandAndArgs = remainingArgs.split("\\s+", 2); // Split command from the rest
		String command = commandAndArgs[0].toLowerCase();
		String packSpecificArgsString = commandAndArgs.length > 1 ? commandAndArgs[1] : "";

		// --- Dispatch based on family ---
		if (packFamily.equals(DB_FAMILY)) {
			handleDatabaseCommand(command, packSpecificArgsString);
		}
		// --- Add else if blocks for other families here ---
		// else if (packFamily.equals("cms")) {
		// handleCmsCommand(command, packSpecificArgsString);
		// }
		else {
			System.out.println("Unknown pack family: " + packFamily);
			System.out.println("Known families: " + DB_FAMILY /* Add others later */);
		}
	}

	/**
	 * Handles global commands that don't require a pack family first.
	 */
	private static void handleGlobalCommand(String command, String arguments) {
		switch (command) {
		case CMD_HELP:
			showHelp(null); // Show general help
			break;
		case CMD_EXIT:
			// Handled in main loop trigger
			break;
		default:
			System.out.println("Unknown global command: " + command);
			showHelp(null);
			break;
		}
	}

	// --- Family Specific Handlers ---

	/**
	 * Handles commands for the 'database' family. Parses packSpecificArgsString to
	 * find pack name (expecting 'northwind') and its args.
	 */
	private static void handleDatabaseCommand(String command, String packSpecificArgsString) {
		// For the database family, we expect the next argument to be the pack name
		// (e.g., "northwind")
		String[] packNameAndTheRest = packSpecificArgsString.split("\\s+", 2);
		String packName = (packNameAndTheRest.length > 0 && !packNameAndTheRest[0].isEmpty())
				? packNameAndTheRest[0].toLowerCase()
				: null;
		String managerArgsString = packNameAndTheRest.length > 1 ? packNameAndTheRest[1] : ""; // These are the args for
																								// NorthwindManager

		if (packName == null) {
			System.out.println(
					"Please specify a pack name for the '" + command + "' command in the '" + DB_FAMILY + "' family.");
			System.out.println("Currently supported: " + NORTHWIND_PACK);
			return;
		}

		// --- Route to the correct manager based on packName ---
		if (packName.equals(NORTHWIND_PACK)) {
			// Delegate to Northwind specific methods
			try {
				switch (command) {
				case CMD_START:
					handleNorthwindStart(managerArgsString);
					break;
				case CMD_STOP:
					handleNorthwindStop(managerArgsString);
					break;
				case CMD_LIST: // List is specific to northwind databases here
					handleNorthwindList();
					break;
				case CMD_INFO:
					handleNorthwindInfo(managerArgsString);
					break;
				case CMD_QUERY:
					handleNorthwindQuery(managerArgsString);
					break;
				case CMD_HELP:
					showHelp(DB_FAMILY); // Show database family help
					break;
				// case CMD_STARTALL: handleNorthwindStartAll(); break; // Add back if needed
				// case CMD_STOPALL: handleNorthwindStopAll(); break; // Add back if needed
				default:
					System.out.println("Unknown command '" + command + "' for pack '" + packName + "' in family '"
							+ DB_FAMILY + "'.");
					showHelp(DB_FAMILY);
				}
			} catch (Exception e) {
				System.err.println(
						"Error executing database command '" + command + " " + packName + "': " + e.getMessage());
				// e.printStackTrace(); // Uncomment for detailed debugging
			}
		}
		// --- Add else if for other database packs here ---
		// else if (packName.equals("other_db_pack")) { ... }
		else {
			System.out.println("Unknown pack name '" + packName + "' in family '" + DB_FAMILY + "'.");
			System.out.println("Currently supported: " + NORTHWIND_PACK);
		}
	}

	// --- Northwind Specific Command Handlers (adapted from original NorthwindCLI)
	// ---

	/**
	 * Handle the 'database start northwind' command. Parses managerArgsString for
	 * vendor, path, port.
	 */
	private static void handleNorthwindStart(String managerArgsString) {
		if (managerArgsString.isEmpty()) {
			System.out.println("Please specify a database vendor to start for the northwind pack.");
			System.out.println("Usage: database start northwind <vendor> [path] [port]");
			listNorthwindVendors();
			return;
		}

		// Parse vendor, path, port from managerArgsString
		String[] parts = managerArgsString.split("\\s+");
		String vendorName = parts[0].toUpperCase();
		String customPath = null;
		Integer customPort = null;

		// Determine path and port based on number of arguments (same logic as before)
		if (parts.length > 1) {
			try {
				customPort = Integer.parseInt(parts[1]);
			} catch (NumberFormatException e) {
				customPath = parts[1];
				if (parts.length > 2) {
					try {
						customPort = Integer.parseInt(parts[2]);
					} catch (NumberFormatException e2) {
						System.out.println("Invalid port number: " + parts[2]);
						System.out.println("Usage: database start northwind <vendor> [path] [port]");
						return;
					}
				}
			}
		}

		try {
			DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
			System.out.println("Attempting to start northwind " + vendor + " database...");
			// ... (rest of the start logic, printing messages, calling
			// dbManager.startDatabase) ...
			if (customPath != null)
				System.out.println("Using custom data path: " + customPath);
			else
				System.out.println("Using default data path.");
			if (customPort != null)
				System.out.println("Using custom host port: " + customPort);
			else
				System.out.println("Using default host port.");

			System.out.println("This may take several minutes...");
			long startTime = System.currentTimeMillis();
			boolean success = dbManager.startDatabase(vendor, customPath, customPort); // Call manager
			long duration = System.currentTimeMillis() - startTime;

			if (success) {
				System.out.println("✓ Northwind " + vendor + " database is running (" + formatDuration(duration) + ")");
				System.out.println("  JDBC URL: " + dbManager.getJdbcUrl(vendor));
				Path actualPath = dbManager.getActualDataPath(vendor);
				if (actualPath != null)
					System.out.println("  Data Path: " + actualPath);
				Integer actualPort = dbManager.getActualHostPort(vendor);
				if (actualPort != null)
					System.out.println("  Host Port: " + actualPort);
			} else {
				System.out.println("✗ Failed to start or initialize northwind " + vendor + " database.");
			}
		} catch (IllegalArgumentException e) {
			System.out.println("Invalid vendor for northwind pack: " + vendorName);
			listNorthwindVendors();
		} catch (Exception e) {
			System.out.println("✗ Error during start process for northwind " + vendorName + ": " + e.getMessage());
		}
	}

	/** Handle 'database stop northwind <vendor>' */
	private static void handleNorthwindStop(String managerArgsString) {
		if (managerArgsString.isEmpty()) {
			System.out.println("Please specify a database vendor to stop for the northwind pack.");
			System.out.println("Usage: database stop northwind <vendor>");
			listNorthwindVendors();
			return;
		}
		String vendorName = managerArgsString.split("\\s+")[0].toUpperCase();
		try {
			DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
			dbManager.stopDatabase(vendor); // Call manager
		} catch (IllegalArgumentException e) {
			System.out.println("Invalid vendor for northwind pack: " + vendorName);
			listNorthwindVendors();
		}
	}

	/** Handle 'database list northwind' */
	private static void handleNorthwindList() {
		System.out.println("=== NORTHWIND DATABASE STATUS ==="); // Specific header
		System.out.println(
				String.format("%-12s %-10s %-10s %-50s %s", "VENDOR", "STATUS", "HOST PORT", "DATA PATH", "VERSION"));
		System.out.println(
				"-----------------------------------------------------------------------------------------------------------");
		for (DatabaseVendor vendor : DatabaseVendor.values()) {
			boolean running = dbManager.isRunning(vendor);
			String status = running ? "RUNNING" : "STOPPED";
			Path dataPath = dbManager.getActualDataPath(vendor);
			String pathStr = dataPath != null ? dataPath.toString() : "-";
			Integer hostPort = dbManager.getActualHostPort(vendor);
			String portStr = hostPort != null ? hostPort.toString() : "-";
			String version = running ? dbManager.getDatabaseVersion(vendor) : "-"; // Use dbManager method
			System.out.println(String.format("%-12s %-10s %-10s %-50s %s", vendor, status, portStr, pathStr, version));
		}
		System.out.println(
				"-----------------------------------------------------------------------------------------------------------");
	}

	/** Handle 'database info northwind <vendor>' */
	private static void handleNorthwindInfo(String managerArgsString) {
		if (managerArgsString.isEmpty()) {
			System.out.println("Please specify a database vendor for info.");
			System.out.println("Usage: database info northwind <vendor>");
			listNorthwindVendors();
			return;
		}
		String vendorName = managerArgsString.split("\\s+")[0].toUpperCase();
		try {
			DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
			if (!dbManager.isRunning(vendor)) {
				System.out.println("The northwind " + vendor + " database is not running.");
				System.out.println(
						"Use 'database start northwind " + vendorName.toLowerCase() + " [path] [port]' to start it.");
				return;
			}

			System.out.println("=== NORTHWIND " + vendor + " CONNECTION INFO ===");
			System.out.println("Status:    " + (dbManager.isRunning(vendor) ? "RUNNING" : "STOPPED"));
			Path actualPath = dbManager.getActualDataPath(vendor);
			if (actualPath != null)
				System.out.println("Data Path: " + actualPath);
			Integer actualPort = dbManager.getActualHostPort(vendor);
			if (actualPort != null)
				System.out.println("Host Port: " + actualPort);
			System.out.println("JDBC URL:  " + dbManager.getJdbcUrl(vendor));
			System.out.println("Username:  " + dbManager.getUsername(vendor));
			System.out.println("Password:  " + dbManager.getPassword(vendor));
			System.out.println("Version:   " + dbManager.getDatabaseVersion(vendor));
			System.out.println("\nJPA Properties (for validation):");
			Map<String, String> jpaProps = dbManager.getJpaProperties(vendor, false);
			for (Map.Entry<String, String> entry : jpaProps.entrySet()) {
				if (entry.getKey().startsWith("jakarta.persistence.jdbc")
						|| entry.getKey().startsWith("hibernate.dialect")) {
					System.out.println("  " + entry.getKey() + " = " + entry.getValue());
				}
			}
			// Print table count (using existing helper)
			try (Connection conn = dbManager.getConnection(vendor)) {
				if (conn != null) {
					try (Statement stmt = conn.createStatement()) {
						printDatabaseStats(vendor, conn, stmt); // Keep helper
					}
				} else {
					System.out.println("\nCould not establish connection to get database statistics.");
				}
			} catch (Exception e) {
				System.out.println("\nFailed to get database statistics: " + e.getMessage());
			}

		} catch (IllegalArgumentException e) {
			System.out.println("Invalid vendor for northwind pack: " + vendorName);
			listNorthwindVendors();
		}
	}

	/** Handle 'database query northwind <vendor> <sql>' */
	private static void handleNorthwindQuery(String managerArgsString) {
		String[] parts = managerArgsString.split("\\s+", 2); // Split vendor from SQL
		if (parts.length < 2 || parts[1].trim().isEmpty()) {
			System.out.println("Please specify a database vendor and SQL query for the northwind pack.");
			System.out.println("Usage: database query northwind <vendor> <sql>");
			listNorthwindVendors();
			return;
		}
		String vendorName = parts[0].toUpperCase();
		String sql = parts[1].trim();

		try {
			DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
			if (!dbManager.isRunning(vendor)) {
				System.out.println("The northwind " + vendor + " database is not running.");
				return;
			}

			System.out.println("Executing query on northwind " + vendor + ": " + sql);
			try (Connection conn = dbManager.getConnection(vendor)) {
				if (conn == null)
					return;
				try (Statement stmt = conn.createStatement()) {
					boolean isQuery = stmt.execute(sql);
					if (isQuery) {
						try (ResultSet rs = stmt.getResultSet()) {
							printResultSet(rs); // Keep helper
						}
					} else {
						int updateCount = stmt.getUpdateCount();
						System.out.println("Query executed successfully. " + updateCount + " row(s) affected.");
					}
				}
			} catch (Exception e) {
				System.out.println("Error executing query: " + e.getMessage());
			}

		} catch (IllegalArgumentException e) {
			System.out.println("Invalid vendor for northwind pack: " + vendorName);
			listNorthwindVendors();
		}
	}

	// --- Helper Methods (Keep relevant ones) ---

	/** List available database vendors for Northwind */
	private static void listNorthwindVendors() {
		System.out.println("Available database vendors for the 'northwind' pack:");
		for (DatabaseVendor vendor : DatabaseVendor.values()) {
			System.out.println("  " + vendor.name().toLowerCase());
		}
	}

	/** Format duration */
	private static String formatDuration(long millis) {
		if (millis < 1000)
			return millis + " ms";
		long seconds = millis / 1000;
		if (seconds < 60)
			return String.format("%.1f sec", millis / 1000.0);
		long minutes = seconds / 60;
		long remainingSeconds = seconds % 60;
		return String.format("%d min %d sec", minutes, remainingSeconds);
	}

	/** Print database statistics (Keep for Northwind info) */
	private static void printDatabaseStats(DatabaseVendor vendor, Connection conn, Statement stmt) throws Exception {
		System.out.println("\nDatabase Statistics:");
		String tableQuery = null;
		// (Keep the switch statement for different vendor queries as before)
		switch (vendor) {
		case ORACLE:
			tableQuery = "SELECT table_name, num_rows FROM user_tables ORDER BY table_name";
			break;
		case SQLSERVER:
			tableQuery = "SELECT t.name AS table_name, p.rows AS num_rows FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id JOIN sys.partitions p ON t.object_id = p.object_id WHERE p.index_id IN (0, 1) AND s.name = SCHEMA_NAME() ORDER BY t.name";
			break;
		case DB2:
			tableQuery = "SELECT tabname AS table_name, card AS num_rows FROM syscat.tables WHERE tabschema = CURRENT SCHEMA ORDER BY tabname";
			break;
		case POSTGRESQL:
			tableQuery = "SELECT tablename AS table_name, COALESCE(n_live_tup, 0) AS num_rows FROM pg_stat_user_tables WHERE schemaname = current_schema() ORDER BY tablename";
			break;
		case MYSQL:
		case MARIADB:
			tableQuery = "SELECT table_name, table_rows AS num_rows FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name";
			break;
		case SQLITE:
			try (ResultSet rs = stmt.executeQuery(
					"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")) {
				System.out.println("Tables in the database:");
				int tableCount = 0;
				while (rs.next()) {
					tableCount++;
					String tableName = rs.getString(1);
					long rowCount = -1;
					try (Statement countStmt = conn.createStatement();
							ResultSet countRs = countStmt.executeQuery("SELECT COUNT(*) FROM \"" + tableName + "\"")) {
						if (countRs.next())
							rowCount = countRs.getLong(1);
					} catch (Exception e) {
						/* Ignore */ }
					System.out.println(String.format("  %-30s : %d rows", tableName, rowCount));
				}
				if (tableCount == 0)
					System.out.println("  (No tables found)");
			}
			return; // Exit after handling SQLite
		default:
			System.out.println("Table statistics not implemented for " + vendor);
			return;
		}
		// Execute query for other databases (Keep the try-catch block as before)
		try (ResultSet rs = stmt.executeQuery(tableQuery)) {
			System.out.println("Tables in the database:");
			int tableCount = 0;
			while (rs.next()) {
				tableCount++;
				String tableName = rs.getString("table_name");
				long rowCount = -1;
				try {
					rowCount = rs.getLong("num_rows");
					if (rs.wasNull())
						rowCount = -1;
				} catch (SQLException e) {
					/* ignore */ }
				System.out.println(String.format("  %-30s : %d rows", tableName, rowCount));
			}
			if (tableCount == 0)
				System.out.println("  (No tables found or statistics unavailable)");
		} catch (Exception e) {
			System.out.println("Warning: Failed to get detailed statistics: " + e.getMessage());
			// (Keep the metadata fallback as before)
			try (ResultSet rs = conn.getMetaData().getTables(null, null, "%", new String[] { "TABLE" })) {
				int tableCount = 0;
				while (rs.next()) {
					String schema = rs.getString("TABLE_SCHEM");
					String tableName = rs.getString("TABLE_NAME");
					if (schema != null && (schema.equalsIgnoreCase("sys")
							|| schema.equalsIgnoreCase("information_schema") || schema.startsWith("pg_")))
						continue;
					tableCount++;
					System.out.println("  " + (schema != null ? schema + "." : "") + tableName);
				}
				if (tableCount == 0)
					System.out.println("  (No tables found)");
			} catch (SQLException metaEx) {
				System.out.println("Error retrieving table metadata: " + metaEx.getMessage());
			}
		}
	}

	/** Print result set (Keep for Northwind query) */
	private static void printResultSet(ResultSet rs) throws Exception {
		ResultSetMetaData metaData = rs.getMetaData();
		int columnCount = metaData.getColumnCount();
		int[] columnWidths = new int[columnCount];
		for (int i = 1; i <= columnCount; i++)
			columnWidths[i - 1] = metaData.getColumnLabel(i).length();
		List<String[]> rows = new java.util.ArrayList<>();
		while (rs.next()) {
			String[] row = new String[columnCount];
			for (int i = 1; i <= columnCount; i++) {
				String value = rs.getString(i);
				value = value == null ? "NULL" : value;
				row[i - 1] = value;
				columnWidths[i - 1] = Math.max(columnWidths[i - 1], value.length());
			}
			rows.add(row);
		}
		final int MAX_COL_WIDTH = 40;
		for (int i = 0; i < columnWidths.length; i++)
			columnWidths[i] = Math.min(columnWidths[i], MAX_COL_WIDTH);
		printSeparator(columnWidths);
		System.out.print("|");
		for (int i = 1; i <= columnCount; i++)
			System.out.print(" " + padRight(metaData.getColumnLabel(i), columnWidths[i - 1]) + " |");
		System.out.println();
		printSeparator(columnWidths);
		if (rows.isEmpty())
			System.out.println("|"
					+ padRight(" (No rows returned)", Arrays.stream(columnWidths).sum() + columnWidths.length * 3 - 1)
					+ "|");
		else {
			for (String[] row : rows) {
				System.out.print("|");
				for (int i = 0; i < columnCount; i++) {
					String value = row[i];
					if (value.length() > columnWidths[i])
						value = value.substring(0, columnWidths[i] - 3) + "...";
					System.out.print(" " + padRight(value, columnWidths[i]) + " |");
				}
				System.out.println();
			}
		}
		printSeparator(columnWidths);
		System.out.println(rows.size() + " row(s) returned.");
	}

	/** Print separator */
	private static void printSeparator(int[] columnWidths) {
		System.out.print("+");
		for (int width : columnWidths)
			System.out.print("-".repeat(width + 2) + "+");
		System.out.println();
	}

	/** Pad string */
	private static String padRight(String s, int width) {
		if (s == null)
			s = "";
		if (s.length() >= width)
			return s.substring(0, width);
		return s + " ".repeat(width - s.length());
	}

	/**
	 * Show help information. If family is provided, show family-specific help.
	 */
	private static void showHelp(String family) {
		if (family == null) {
			// General Help
			System.out.println("\nStarter Pack Manager CLI Help");
			System.out.println("-----------------------------");
			System.out.println("Manages different families of starter packs (databases, services, etc.).");
			System.out.println("\nUsage: <family> <command> [pack_name] [args...]");
			System.out.println("   or: <global_command>");
			System.out.println("\nGlobal Commands:");
			// System.out.println(" list List status summary for all registered packs. (Not
			// implemented globally yet)"); // Add global list later if needed
			System.out.println("  help              Show this general help information.");
			System.out.println("  exit              Exit the application (stops all running components).");
			System.out.println("\nKnown Pack Families:");
			System.out.println("  " + DB_FAMILY + " (use '" + DB_FAMILY + " help' for details)");
			// Add other families here when implemented
			System.out.println("\nExample:");
			System.out.println("  database start northwind postgresql /data/pg 5433");

		} else if (family.equals(DB_FAMILY)) {
			// Database Family Help
			System.out.println("\nHelp for Pack Family: '" + DB_FAMILY + "'");
			System.out.println("-------------------------------------");
			System.out.println("Manages database starter packs.");
			System.out.println("\nUsage: " + DB_FAMILY + " <command> <pack_name> [args...]");
			System.out.println("\nCommands for this family:");
			System.out.println("  start <pack_name> <vendor> [path] [port]  Start a DB vendor for the pack.");
			System.out.println("  stop <pack_name> <vendor>                 Stop a DB vendor for the pack.");
			System.out.println("  list <pack_name>                          List status of DB vendors for the pack.");
			System.out.println("  info <pack_name> <vendor>                 Show info for a DB vendor.");
			System.out.println("  query <pack_name> <vendor> <sql>          Execute SQL on a DB vendor.");
			System.out.println("  help                                      Show this family-specific help.");

			System.out.println("\nAvailable Packs in this family:");
			System.out.println("  " + NORTHWIND_PACK + ":");
			listNorthwindVendors(); // Show vendors for northwind

			System.out.println("\nExamples for '" + DB_FAMILY + "':");
			System.out.println("  database start northwind postgresql");
			System.out.println("  database start northwind mariadb /data/custom/mariadb-northwind 3308");
			System.out.println("  database list northwind");
			System.out.println("  database info northwind sqlite");
			System.out.println("  database query northwind postgresql \"SELECT COUNT(*) FROM Customers\"");
			System.out.println("  database stop northwind postgresql");
		}
		// --- Add else if blocks for help of other families ---
		// else if (family.equals("cms")) { ... }
		else {
			System.out.println("Help not available for unknown family: " + family);
		}
		System.out.println();
	}
}