package com.sourcekraft.documentburster.common;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.ProcessResult;
import org.zeroturnaround.exec.stream.slf4j.Slf4jStream;

import com.sourcekraft.documentburster.utils.Utils;

import com.sourcekraft.documentburster.common.db.northwind.NorthwindManager;
import com.sourcekraft.documentburster.common.db.northwind.NorthwindManager.DatabaseVendor;

/**
 * Command-line interface for managing different families of "services".
 * Currently supports the 'database' family using NorthwindManager.
 */
public class ServicesManager {

	private static final Logger log = LoggerFactory.getLogger(ServicesManager.class);

	// Keep direct manager for now, assuming 'database' family uses NorthwindManager
	private static final NorthwindManager dbManager;
	static {
		try {
			dbManager = new NorthwindManager();
		} catch (Exception e) {
			throw new RuntimeException("Failed to initialize NorthwindManager", e);
		}
	}

	private static final List<String> FLOWKRAFT_APPS = List.of(
		"admin-grails-playground",
		"bkend-boot-groovy-playground",
		"frend-grails-playground"
	);

	// Define the family name this CLI currently handles primarily
	private static final String DB_FAMILY = "database";
	private static final String APP_FAMILY = "app";
	private static final String NORTHWIND_PACK = "northwind"; // Specific pack name within the database family

	// Command constants
	private static final String CMD_START = "start";
	private static final String CMD_STOP = "stop";
	private static final String CMD_LIST = "list";
	private static final String CMD_INFO = "info";
	private static final String CMD_QUERY = "query"; // Keep Northwind query capability
	
	// Programmatic API: Result and execute() entrypoint
	public static class Result {
		public final String status;
		public final String output;

		public Result(String status, String output) {
			this.status = status;
			this.output = output;
		}
	}

	/**
	 * Unified command executor used by both main() and external callers. Supports
	 * global commands (help, exit) and database family commands (start, stop, list,
	 * info, query, help).
	 */
	public static Result execute(String commandLine) throws Exception {
		String[] tokens = commandLine.trim().split("\\s+");

		// Family: database
		if (tokens[0].equalsIgnoreCase(DB_FAMILY)) {
			String subCmd = tokens[1].toLowerCase();

			String packName = tokens[2].toLowerCase();
			if (!packName.equals(NORTHWIND_PACK)) {
				return new Result("error", "Unknown pack name '" + packName + "' in family '" + DB_FAMILY + "'.");
			}
			String managerArgsString = tokens.length > 3
					? String.join(" ", java.util.Arrays.copyOfRange(tokens, 3, tokens.length))
					: "";

			switch (subCmd) {
			case CMD_START: {
				String out = captureOutput(() -> handleNorthwindStart(managerArgsString));
				String status = (out.contains("✓ Northwind") || out.contains("database is running")) ? "running"
						: (out.contains("✗") ? "error" : "running");
				return new Result(status, out);
			}
			case CMD_STOP: {
				String out = captureOutput(() -> handleNorthwindStop(managerArgsString));
				return new Result("stopped", out);
			}
			case CMD_LIST: {
				String out = captureOutput(() -> handleNorthwindList());
				return new Result("ok", out);
			}
			case CMD_INFO: {
				String out = captureOutput(() -> handleNorthwindInfo(managerArgsString));
				String status = out.contains("Status:    RUNNING") ? "running"
						: (out.contains("is not running") ? "stopped" : "ok");
				return new Result(status, out);
			}
			case CMD_QUERY: {
				String out = captureOutput(() -> handleNorthwindQuery(managerArgsString));
				String status = out.toLowerCase().contains("error") ? "error" : "ok";
				return new Result(status, out);
			}
			default:
				return new Result("error", "Unknown database command: " + subCmd);
			}
		}

		// Family: app
		else if (tokens[0].equalsIgnoreCase(APP_FAMILY)) {
			String subCmd = tokens[1].toLowerCase();

			String serviceName = tokens[2];
			String args = tokens.length > 3
					? String.join(" ", java.util.Arrays.copyOfRange(tokens, 3, tokens.length))
					: "";

			switch (subCmd) {
			case CMD_START: {
				String out = captureOutput(() -> handleAppStart(serviceName, args));
				String status = out.contains("✓") ? "running" : (out.contains("✗") ? "error" : "running");
				return new Result(status, out);
			}
			case CMD_STOP: {
				String out = captureOutput(() -> handleAppStop(serviceName, args));
				return new Result("stopped", out);
			}
			default:
				return new Result("error", "Unknown app command: " + subCmd);
			}
		}

		return new Result("error", "Unknown family or command: " + tokens[0]);
	}

	// Capture System.out for programmatic use without changing existing handlers
	@FunctionalInterface
	private interface ThrowableRunnable {
		void run() throws Exception;
	}

	private static String captureOutput(ThrowableRunnable action) throws Exception {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		PrintStream original = System.out;
		PrintStream ps = new PrintStream(baos);
		try {
			System.setOut(ps);
			action.run();
		} finally {
			System.setOut(original);
			ps.close();
		}
		return baos.toString();
	}

	/**
	 * Handle the 'database start northwind' command. Parses managerArgsString for
	 * vendor, path, port.
	 */
	private static void handleNorthwindStart(String managerArgsString) throws Exception {

		// Parse vendor, path, port from managerArgsString
		String[] parts = managerArgsString.split("\\s+");
		String vendorName = parts[0].toUpperCase();
		String customPath = null;
		Integer customPort = null;

		// Determine path and port based on number of arguments (same logic as before)
		if (parts.length > 1) {
			// If second argument is numeric, treat as port; otherwise as path
			boolean isNumeric = parts[1].matches("\\d+");
			if (isNumeric) {
				customPort = Integer.parseInt(parts[1]);
			} else {
				customPath = parts[1];
				if (parts.length > 2) {
					customPort = Integer.parseInt(parts[2]);
				}
			}
		}

		DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
		// ... (rest of the start logic, printing messages, calling
		// dbManager.startDatabase) ...
		dbManager.startDatabase(vendor, customPath, customPort); // Call manager
	}

	/** Handle 'database stop northwind <vendor>' 
	 * @throws Exception */
	private static void handleNorthwindStop(String managerArgsString) throws Exception {

		String vendorName = managerArgsString.split("\\s+")[0].toUpperCase();
		DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
		dbManager.stopDatabase(vendor); // Call manager
	}

	/**
	 * Handle 'database list northwind'
	 * 
	 * @throws Exception
	 */
	private static void handleNorthwindList() throws Exception {
		// Specific header
		for (DatabaseVendor vendor : DatabaseVendor.values()) {
			boolean running = dbManager.isRunning(vendor);
			if (running) {
				dbManager.getDatabaseVersion(vendor); // Use dbManager method for consistency
			}
		}
	}

	/** Handle 'database info northwind <vendor>' */
	private static void handleNorthwindInfo(String managerArgsString) throws Exception {

		String vendorName = managerArgsString.split("\\s+")[0].toUpperCase();
		DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
		if (!dbManager.isRunning(vendor)) {
			return;
		}

		dbManager.getActualDataPath(vendor);
		dbManager.getActualHostPort(vendor);
		dbManager.getJdbcUrl(vendor);
		dbManager.getUsername(vendor);
		dbManager.getPassword(vendor);
		dbManager.getDatabaseVersion(vendor);
		Map<String, String> jpaProps = dbManager.getJpaProperties(vendor, false);
		for (Map.Entry<String, String> entry : jpaProps.entrySet()) {
			if (entry.getKey().startsWith("jakarta.persistence.jdbc")
					|| entry.getKey().startsWith("hibernate.dialect")) {
				// Process entry but don't print
			}
		}
		// Print table count (using existing helper)
		try (Connection conn = dbManager.getConnection(vendor)) {
			if (conn != null) {
				try (Statement stmt = conn.createStatement()) {
					printDatabaseStats(vendor, conn, stmt); // Keep helper
				}
			}
		}
	}

	/** Handle 'database query northwind <vendor> <sql>' */
	private static void handleNorthwindQuery(String managerArgsString) throws Exception {
		String[] parts = managerArgsString.split("\\s+", 2); // Split vendor from SQL

		String vendorName = parts[0].toUpperCase();
		String sql = parts[1].trim();

		DatabaseVendor vendor = DatabaseVendor.valueOf(vendorName);
		if (!dbManager.isRunning(vendor)) {
			return;
		}

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
					stmt.getUpdateCount();
				}
			}
		}
	}

	/** Print database statistics (Keep for Northwind info) */
	private static void printDatabaseStats(DatabaseVendor vendor, Connection conn, Statement stmt) throws Exception {
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
		case POSTGRES:
			tableQuery = "SELECT tablename AS table_name, COALESCE(n_live_tup, 0) AS num_rows FROM pg_stat_user_tables WHERE schemaname = current_schema() ORDER BY tablename";
			break;
		case MYSQL:
		case MARIADB:
			tableQuery = "SELECT table_name, table_rows AS num_rows FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name";
			break;
		case SQLITE:
			try (ResultSet rs = stmt.executeQuery(
					"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")) {
				while (rs.next()) {
					String tableName = rs.getString(1);
					try (Statement countStmt = conn.createStatement();
							ResultSet countRs = countStmt.executeQuery("SELECT COUNT(*) FROM \"" + tableName + "\"")) {
						if (countRs.next())
							countRs.getLong(1);
					}
				}
			}
			return; // Exit after handling SQLite
		default:
			return;
		}
		// Execute query for other databases
		try (ResultSet rs = stmt.executeQuery(tableQuery)) {
			while (rs.next()) {
				rs.getString("table_name");
				rs.getLong("num_rows");
				if (rs.wasNull()) {
					// Handle null case
				}
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
		for (int i = 1; i <= columnCount; i++) {
			// Process column headers but don't print
		}
		if (rows.isEmpty()) {
			// Process empty result but don't print
		} else {
			for (String[] row : rows) {
				for (int i = 0; i < columnCount; i++) {
					String value = row[i];
					if (value.length() > columnWidths[i])
						value = value.substring(0, columnWidths[i] - 3) + "...";
				}
			}
		}
	}

	/** Check if provisioning is complete by looking for provisioned indicator */
	private static boolean checkProvisioned(Path workingDir, String serviceName) {
		if (serviceName.equals("cms-webportal-playground")) {
			// Check for composer.lock or composer.json in wp-themes/reportburster-sage
			Path composerLock = workingDir.resolve("wp-themes").resolve("reportburster-sage").resolve("composer.lock");
			Path composerJson = workingDir.resolve("wp-themes").resolve("reportburster-sage").resolve("composer.json");
			return Files.exists(composerLock) && Files.exists(composerJson);
		}
		// For other services, assume not provisioned (run full compose)
		return false;
	}

	/** Handle 'app start <serviceName> [args]' */
	private static void handleAppStart(String serviceName, String args) throws Exception {
		//System.out.println("Starting app '" + serviceName + "'...");

		String composePath = getComposePath(serviceName);

		// Log the compose file path and JVM working directory for diagnostics
		log.info("handleAppStart: composePath='{}' | jvm.cwd='{}'", composePath, System.getProperty("user.dir"));

		// Set working directory to the compose file's parent (like NorthwindManager)
		Path composeFilePath = Paths.get(composePath);
		Path workingDir = composeFilePath.getParent();
		String composeFileName = composeFilePath.getFileName().toString();

		// Parse flags and port from args
		String customPort = null;
		boolean shouldBuild = false;
		boolean noCache = false;
		boolean enableLiquibase = false;
		
		if (args != null && !args.trim().isEmpty()) {
			String[] argParts = args.trim().split("\\s+");
			for (String part : argParts) {
				if (part.matches("\\d+")) {
					customPort = part;
				} else if (part.equalsIgnoreCase("--build")) {
					shouldBuild = true;
				} else if (part.equalsIgnoreCase("--no-cache")) {
					noCache = true;
				} else if (part.equalsIgnoreCase("--liquibase")) {
					enableLiquibase = true;
				}
			}
		}
		
		// Prepare environment variables map (shared between build and up commands)
		java.util.Map<String, String> env = new java.util.HashMap<>(System.getenv());
		if (customPort != null) {
			env.put("HOST_PORT", customPort);
			log.info("Using custom HOST_PORT={}", customPort);
		}
		if (enableLiquibase) {
			env.put("ENABLE_LIQUIBASE_GROOVY_MIGRATIONS", "true");
			env.put("DB_CREATE", "none");  // Disable GORM auto-schema when Liquibase manages migrations (Grails)
			env.put("DDL_AUTO", "none");   // Disable Hibernate ddl-auto when Liquibase manages migrations (Spring Boot)
			log.info("Enabling Liquibase Groovy migrations: ENABLE_LIQUIBASE_GROOVY_MIGRATIONS=true, DB_CREATE=none, DDL_AUTO=none");
		}

		List<String> command = new ArrayList<>();
		command.add("docker");
		command.add("compose");
		command.add("-f");
		command.add(composeFileName);  // Relative to workingDir
		command.add("up");
		
		// Add --build flag if requested (rebuilds image from Dockerfile)
		if (shouldBuild) {
			command.add("--build");
			log.info("Using --build flag to rebuild image");
		}
		
		// Add --no-cache flag if requested (requires --build, forces fresh build without cache)
		// Note: --no-cache is a docker build flag, for compose we need to use docker compose build --no-cache first
		// Actually for docker compose up, we can pass --build, but --no-cache needs docker compose build
		
		command.add("-d");
		command.add("--remove-orphans");

		// For cms-webportal-playground, conditionally run only main service if provisioned
		if (serviceName.equals("cms-webportal-playground")) {
			boolean provisioned = checkProvisioned(workingDir, serviceName);
			if (provisioned) {
				command.add(serviceName);
			}
		}else
			command.add(serviceName);
	
		// If --no-cache is requested, run docker compose build --no-cache first
		if (noCache) {
			log.info("Running docker compose build --no-cache first");
			List<String> buildCommand = new ArrayList<>();
			buildCommand.add("docker");
			buildCommand.add("compose");
			buildCommand.add("-f");
			buildCommand.add(composeFileName);
			buildCommand.add("build");
			buildCommand.add("--no-cache");
			buildCommand.add(serviceName);
			
			ProcessExecutor buildExecutor = new ProcessExecutor().command(buildCommand).directory(workingDir.toFile())
				.redirectOutput(Slf4jStream.of(log).asInfo())
				.redirectError(Slf4jStream.of(log).asInfo())
				.timeout(7200, TimeUnit.SECONDS)
				.environment(env);
			
			log.info("Executing build command: {} in directory: {}", buildCommand, workingDir);
			ProcessResult buildResult = buildExecutor.execute();
			if (buildResult.getExitValue() != 0) {
				System.out.println("✗ Failed to build app '" + serviceName + "' with --no-cache. Exit code: " + buildResult.getExitValue());
				return;
			}
		}

		log.info("Executing command: {} in directory: {}", command, workingDir);

		// Use ProcessExecutor like NorthwindManager for better output handling
		ProcessExecutor executor = new ProcessExecutor().command(command).directory(workingDir.toFile())
			.redirectOutput(Slf4jStream.of(log).asInfo())  // Capture stdout to log
			.redirectError(Slf4jStream.of(log).asInfo())  // Capture stderr to log
			.timeout(7200, TimeUnit.SECONDS)  // Add timeout to prevent hanging
			.environment(env);  // Pass environment variables including HOST_PORT and ENABLE_LIQUIBASE_GROOVY_MIGRATIONS

		ProcessResult result = executor.execute();

		log.info("Command exit code: {}", result.getExitValue());
		if (result.getExitValue() == 0) {
			System.out.println("✓ App '" + serviceName + "' started successfully.");
		} else {
			System.out.println("✗ Failed to start app '" + serviceName + "'. Exit code: " + result.getExitValue());
		}
	}

	/** Handle 'app stop <serviceName> [args]' */
	private static void handleAppStop(String serviceName, String args) throws Exception {
		//System.out.println("Stopping app '" + serviceName + "'...");

		String composePath = getComposePath(serviceName);

		// Log the compose file path and JVM working directory for diagnostics
		log.info("handleAppStop: composePath='{}' | jvm.cwd='{}'", composePath, System.getProperty("user.dir"));

		// Set working directory to the compose file's parent (like NorthwindManager)
		Path composeFilePath = Paths.get(composePath);
		Path workingDir = composeFilePath.getParent();
		String composeFileName = composeFilePath.getFileName().toString();

		// Use 'docker compose down' to stop ALL containers in the compose file
		// This prevents orphaned containers (e.g., matomo-fpm, matomo-db when stopping matomo)
		List<String> command = new ArrayList<>();
		command.add("docker");
		command.add("compose");
		command.add("-f");
		command.add(composeFileName);
		command.add("down");
		command.add("--remove-orphans");
		// Note: Not using -v to preserve volumes/data between restarts
		// Add --volumes flag in args if user wants to purge data

		ProcessExecutor executor = new ProcessExecutor().command(command).directory(workingDir.toFile()).redirectOutput(Slf4jStream.of(log).asInfo()).redirectError(Slf4jStream.of(log).asInfo()).timeout(300, TimeUnit.SECONDS);

		ProcessResult result = executor.execute();

		log.info("Command exit code: {}", result.getExitValue());
		if (result.getExitValue() == 0) {
			System.out.println("✓ App '" + serviceName + "' stopped successfully.");
		} else {
			System.out.println("✗ Failed to stop app '" + serviceName + "'. Exit code: " + result.getExitValue());
		}
	}

	/** Get the docker-compose.yml path for the service */
	private static String getComposePath(String serviceName) {
		String appsFolderPath = Utils.getAppsFolderPath();
		if (FLOWKRAFT_APPS.contains(serviceName)) {
			return appsFolderPath + "flowkraft/docker-compose.yml";
		}
		return appsFolderPath + serviceName + "/docker-compose.yml";
	}

}