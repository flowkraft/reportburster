package com.sourcekraft.documentburster.common.db.northwind;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.ResultSet;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
// Removed Optional import as it's not used

import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.Db2Container;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

// Docker-Java imports for port binding
import com.github.dockerjava.api.model.ExposedPort;
import com.github.dockerjava.api.model.Ports;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

/**
 * Manages database containers for Northwind database testing with multiple
 * vendors. Supports PostgreSQL, MySQL, SQLite, SQL Server, Oracle, MariaDB, and
 * IBM DB2. Data is persisted in external volumes. Initialization occurs only if
 * data is not present. Allows specifying custom data paths and host ports.
 */
public class NorthwindManager implements AutoCloseable {

	// --- Default Docker Image Tags ---
	private static final String POSTGRES_TAG = "postgres:16.2";
	private static final String MYSQL_TAG = "mysql:8.3.0";
	private static final String MARIADB_TAG = "mariadb:11.3.2";
	private static final String SQLSERVER_TAG = "mcr.microsoft.com/mssql/server:2022-latest";
	private static final String ORACLE_TAG = "gvenzl/oracle-xe:21-slim-faststart";
	private static final String DB2_TAG = "ibmcom/db2:11.5.9.0";
	// --- End Default Docker Image Tags ---

	// Container instances using wildcards where appropriate
	private PostgreSQLContainer<?> postgresContainer;
	private MySQLContainer<?> mysqlContainer;
	private MariaDBContainer<?> mariaDbContainer;
	private MSSQLServerContainer<?> sqlServerContainer;
	private OracleContainer oracleContainer; // No wildcard needed/available
	private Db2Container db2Container; // No wildcard needed/available
	private File sqliteDbFile; // Represents the persistent file path

	// Track running containers, data paths, and ports
	private final Map<DatabaseVendor, Boolean> runningDatabases = new HashMap<>();
	private final Map<DatabaseVendor, Path> activeDataPaths = new HashMap<>();
	private final Map<DatabaseVendor, Integer> activeHostPorts = new HashMap<>(); // Store active host port
	private final String baseDataPath;
	private static final String MARKER_FILENAME = ".northwind_initialized";

	/**
	 * Supported database vendors
	 */
	public enum DatabaseVendor {
		POSTGRESQL(5432), MYSQL(3306), MARIADB(3306), // Internal container port
		SQLITE(0), // No port
		SQLSERVER(1433), ORACLE(1521), DB2(50000);

		private final int containerPort;

		DatabaseVendor(int containerPort) {
			this.containerPort = containerPort;
		}

		public int getContainerPort() {
			return containerPort;
		}
	}

	/**
	 * Create a new database manager, determining the base path for data volumes.
	 */
	public NorthwindManager() {
		// Determine base path: Env Var > System Prop > Default
		String rbFolderPath = System.getenv("RB_FOLDER_PATH");
		if (rbFolderPath == null || rbFolderPath.trim().isEmpty()) {
			rbFolderPath = System.getProperty("rb.folder.path");
		}
		if (rbFolderPath == null || rbFolderPath.trim().isEmpty()) {
			// Default to a 'data/db' subdirectory in the project dir or user home
			rbFolderPath = Paths.get(System.getProperty("user.dir", "."), "data", "db").toString();
			System.out
					.println("WARNING: RB_FOLDER_PATH environment variable or rb.folder.path system property not set.");
			System.out.println("Defaulting database data path base to: " + rbFolderPath);
		}
		this.baseDataPath = rbFolderPath;
		System.out.println("Using database data path base: " + this.baseDataPath);

		// Ensure base directory exists
		try {
			Files.createDirectories(Paths.get(this.baseDataPath));
		} catch (IOException e) {
			System.err.println("Error creating base data directory: " + this.baseDataPath + " - " + e.getMessage());
			// Consider if this should be fatal
		}

		for (DatabaseVendor vendor : DatabaseVendor.values()) {
			runningDatabases.put(vendor, false);
		}
	}

	/**
	 * Gets the base path where database volume data is stored on the host.
	 * 
	 * @return The base data path string.
	 */
	public String getBaseDataPath() {
		return baseDataPath;
	}

	/**
	 * Get the default host path for the database volume based on convention.
	 */
	private Path getDefaultHostDataPath(DatabaseVendor vendor) {
		String subDirName = "sample-northwind-" + vendor.name().toLowerCase().replace("_", "-");
		return Paths.get(this.baseDataPath, subDirName);
	}

	/**
	 * Get the default host port mapping for a vendor. Returns null if no default.
	 */
	public Integer getDefaultHostPort(DatabaseVendor vendor) {
		switch (vendor) {
		case POSTGRESQL:
			return 5432;
		case MYSQL:
			return 3306;
		case MARIADB:
			return 3307; // Avoid conflict with default MySQL
		case SQLSERVER:
			return 1433;
		case ORACLE:
			return 1521;
		case DB2:
			return 50000;
		case SQLITE:
		default:
			return null; // No port or undefined
		}
	}

	/**
	 * Gets the actual host data path being used by a running database vendor.
	 * Returns null if the database is not running or the path is not set.
	 */
	public Path getActualDataPath(DatabaseVendor vendor) {
		return activeDataPaths.get(vendor);
	}

	/**
	 * Gets the actual host port being used by a running database vendor. Returns
	 * null if the database is not running or not applicable (SQLite).
	 */
	public Integer getActualHostPort(DatabaseVendor vendor) {
		return activeHostPorts.get(vendor);
	}

	/**
	 * Start a database container for the specified vendor, optionally using a
	 * custom data path and host port. Initializes schema and data only if the
	 * marker file is not present in the volume.
	 *
	 * @param vendor         Database vendor to start
	 * @param customHostPath Optional custom path on the host for data volume. If
	 *                       null or empty, uses default path.
	 * @param customHostPort Optional fixed host port to map. If null, uses a
	 *                       default fixed port. If default is also null, uses
	 *                       random port.
	 * @return true if successful, false otherwise
	 */
	public boolean startDatabase(DatabaseVendor vendor, String customHostPath, Integer customHostPort) {
		if (isRunning(vendor)) {
			System.out.println(vendor + " is already running at " + getActualDataPath(vendor) + " on host port "
					+ getActualHostPort(vendor));
			return true; // Already running
		}

		// --- Path Determination ---
		Path hostDataPath;
		boolean useCustomPath = customHostPath != null && !customHostPath.trim().isEmpty();
		if (useCustomPath) {
			try {
				hostDataPath = Paths.get(customHostPath).toAbsolutePath();
				System.out.println("Using custom data path for " + vendor + ": " + hostDataPath);
			} catch (InvalidPathException e) {
				System.err.println("Error: Invalid custom path provided for " + vendor + ": " + customHostPath + " - "
						+ e.getMessage());
				return false;
			}
		} else {
			hostDataPath = getDefaultHostDataPath(vendor);
			System.out.println("Using default data path for " + vendor + ": " + hostDataPath);
		}

		// --- Port Determination ---
		Integer hostPortToUse = null; // This will be the port we attempt to fix
		Integer defaultHostPort = getDefaultHostPort(vendor); // Get the default for logging/fallback

		if (vendor != DatabaseVendor.SQLITE) { // SQLite doesn't use ports
			if (customHostPort != null) {
				hostPortToUse = customHostPort;
				System.out.println("Using custom host port for " + vendor + ": " + hostPortToUse);
			} else if (defaultHostPort != null) {
				hostPortToUse = defaultHostPort;
				System.out.println("Using default host port for " + vendor + ": " + hostPortToUse);
			} else {
				System.out.println("Using random host port for " + vendor + " (no default or custom specified).");
			}
		}

		boolean needsInitialization = false;

		try {
			// Ensure host directory exists before starting container or checking files
			Files.createDirectories(hostDataPath);

			// Check if initialization is needed based on the determined hostDataPath
			if (vendor == DatabaseVendor.SQLITE) {
				sqliteDbFile = hostDataPath.resolve("northwind.db").toFile();
				needsInitialization = !sqliteDbFile.exists() || sqliteDbFile.length() == 0;
			} else {
				Path markerFile = hostDataPath.resolve(MARKER_FILENAME);
				needsInitialization = !Files.exists(markerFile);
			}

			System.out.println("Starting " + vendor + " database container/setup...");
			switch (vendor) {
			case POSTGRESQL:
				startPostgreSQL(hostDataPath, hostPortToUse);
				break;
			case MYSQL:
				startMySQL(hostDataPath, hostPortToUse);
				break;
			case MARIADB:
				startMariaDB(hostDataPath, hostPortToUse);
				break;
			case SQLITE:
				if (!setupSQLite(hostDataPath))
					return false;
				break;
			case SQLSERVER:
				startSQLServer(hostDataPath, hostPortToUse);
				break;
			case ORACLE:
				startOracle(hostDataPath, hostPortToUse);
				break;
			case DB2:
				startDB2(hostDataPath, hostPortToUse);
				break;
			default:
				System.err.println("Unsupported database vendor: " + vendor);
				return false;
			}

			// Mark as running and store the path
			runningDatabases.put(vendor, true);
			activeDataPaths.put(vendor, hostDataPath);

			// Store the actual port used (fixed or random) after container starts
			Integer actualPort = null;
			if (vendor != DatabaseVendor.SQLITE) {
				GenericContainer<?> container = getContainer(vendor);
				if (container != null && container.isRunning()) {
					try {
						// Use the vendor's defined container port
						actualPort = container.getMappedPort(vendor.getContainerPort());
						activeHostPorts.put(vendor, actualPort);
						System.out.println(vendor + " is mapped to host port: " + actualPort);
					} catch (Exception e) {
						System.err.println("Warning: Could not get mapped port for " + vendor + ": " + e.getMessage());
					}
				} else {
					System.err.println(
							"Warning: Container for " + vendor + " is null or not running after start attempt.");
				}
			}

			if (vendor != DatabaseVendor.SQLITE) {
				System.out.println(vendor + " container started.");
			} else {
				System.out.println(vendor + " setup complete.");
			}

			// Initialize database with schema and data using JPA Generator if needed
			if (needsInitialization) {
				System.out.println(
						"Database volume/file appears empty or marker file not found. Initializing schema and data for "
								+ vendor + " at " + hostDataPath + "...");
				boolean initSuccess = initializeDatabaseWithGenerator(vendor, hostDataPath);
				if (initSuccess) {
					if (vendor != DatabaseVendor.SQLITE) {
						Files.createFile(hostDataPath.resolve(MARKER_FILENAME));
						System.out.println("Initialization marker created for " + vendor + " at " + hostDataPath);
					} else {
						System.out.println(
								"SQLite database file created/initialized at: " + sqliteDbFile.getAbsolutePath());
					}
					System.out.println("✓ Database initialization successful for " + vendor);
				} else {
					System.err.println("✗ Database initialization failed for " + vendor
							+ ". Container/File is present but may be empty or incomplete.");
					// Optionally stop the container here if init failure is critical
					// stopDatabase(vendor);
					// return false;
				}
			} else {
				System.out.println(
						"Existing data found for " + vendor + " at " + hostDataPath + ". Skipping initialization.");
			}

			return true;
		} catch (Exception e) {
			System.err.println("Error starting or initializing " + vendor + " at " + hostDataPath
					+ (hostPortToUse != null ? " on port " + hostPortToUse : "") + ": " + e.getMessage());
			e.printStackTrace();
			// Ensure state is marked as not running if start failed critically
			runningDatabases.put(vendor, false);
			activeDataPaths.remove(vendor);
			activeHostPorts.remove(vendor);
			// Clean up container if partially started
			if (vendor != DatabaseVendor.SQLITE)
				stopDatabase(vendor);
			else
				sqliteDbFile = null;
			return false;
		}
	}

	/** Overload for path only */
	public boolean startDatabase(DatabaseVendor vendor, String customHostPath) {
		return startDatabase(vendor, customHostPath, null); // Pass null for port
	}

	/** Overload for vendor only */
	public boolean startDatabase(DatabaseVendor vendor) {
		return startDatabase(vendor, null, null); // Pass null for path and port
	}

	/**
	 * Stop a running database container without removing the host volume data.
	 */
	public void stopDatabase(DatabaseVendor vendor) {
		if (!isRunning(vendor)) {
			System.out.println(vendor + " is not running.");
			return; // Not running
		}

		System.out.println("Stopping " + vendor + " container/releasing file lock...");
		Path stoppedPath = getActualDataPath(vendor);
		Integer stoppedPort = getActualHostPort(vendor);
		try {
			switch (vendor) {
			case POSTGRESQL:
				if (postgresContainer != null)
					postgresContainer.stop();
				postgresContainer = null;
				break;
			case MYSQL:
				if (mysqlContainer != null)
					mysqlContainer.stop();
				mysqlContainer = null;
				break;
			case MARIADB:
				if (mariaDbContainer != null)
					mariaDbContainer.stop();
				mariaDbContainer = null;
				break;
			case SQLITE:
				sqliteDbFile = null;
				break; // Clear the reference
			case SQLSERVER:
				if (sqlServerContainer != null)
					sqlServerContainer.stop();
				sqlServerContainer = null;
				break;
			case ORACLE:
				if (oracleContainer != null)
					oracleContainer.stop();
				oracleContainer = null;
				break;
			case DB2:
				if (db2Container != null)
					db2Container.stop();
				db2Container = null;
				break;
			}
			System.out.println(vendor + " stopped. Data remains at " + stoppedPath
					+ (stoppedPort != null ? " (was running on host port " + stoppedPort + ")" : ""));
		} catch (Exception e) {
			System.err.println("Error stopping " + vendor + " container: " + e.getMessage());
		} finally {
			// Always mark as not running and remove path/port tracking
			runningDatabases.put(vendor, false);
			activeDataPaths.remove(vendor);
			activeHostPorts.remove(vendor);
		}
	}

	/** Stop all running database containers. */
	@Override
	public void close() {
		stopAll();
	}

	public void stopAll() {
		System.out.println("Stopping all running database containers...");
		DatabaseVendor[] vendorsToStop = runningDatabases.keySet().toArray(new DatabaseVendor[0]);
		for (DatabaseVendor vendor : vendorsToStop) {
			if (isRunning(vendor)) {
				stopDatabase(vendor);
			}
		}
		System.out.println("All running containers stopped.");
	}

	// --- Getters for Connection Info ---
	public boolean isRunning(DatabaseVendor vendor) {
		return runningDatabases.getOrDefault(vendor, false);
	}

	// Helper to get the underlying container instance
	private GenericContainer<?> getContainer(DatabaseVendor vendor) {
		switch (vendor) {
		case POSTGRESQL:
			return postgresContainer;
		case MYSQL:
			return mysqlContainer;
		case MARIADB:
			return mariaDbContainer;
		case SQLSERVER:
			return sqlServerContainer;
		case ORACLE:
			return oracleContainer;
		case DB2:
			return db2Container;
		case SQLITE:
		default:
			return null;
		}
	}

	public String getJdbcUrl(DatabaseVendor vendor) {
		// Handle SQLite separately first
		if (vendor == DatabaseVendor.SQLITE) {
			Path path = getActualDataPath(vendor); // Get path even if not "running"
			if (path != null) {
				return "jdbc:sqlite:" + path.resolve("northwind.db").toString();
			} else {
				return null;
			}
		}

		// For containerized DBs, check if running
		if (!isRunning(vendor)) {
			return null;
		}

		GenericContainer<?> container = getContainer(vendor);
		Integer hostPort = getActualHostPort(vendor); // Get the stored actual port

		if (container == null || hostPort == null)
			return null; // Not running or port not mapped

		String host = container.getHost();
		String dbName = "";
		String params = "";

		// Vendor-specific URL construction using the actual host port
		switch (vendor) {
		case POSTGRESQL:
			dbName = ((PostgreSQLContainer<?>) postgresContainer).getDatabaseName();
			return String.format("jdbc:postgresql://%s:%d/%s", host, hostPort, dbName);
		case MYSQL:
			dbName = ((MySQLContainer<?>) mysqlContainer).getDatabaseName();
			params = "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
			return String.format("jdbc:mysql://%s:%d/%s%s", host, hostPort, dbName, params);
		case MARIADB:
			dbName = ((MariaDBContainer<?>) mariaDbContainer).getDatabaseName();
			params = "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
			return String.format("jdbc:mariadb://%s:%d/%s%s", host, hostPort, dbName, params);
		case SQLSERVER:
			dbName = "master"; // Default DB for connection string
			return String.format("jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=false;trustServerCertificate=true",
					host, hostPort, dbName);
		case ORACLE:
			dbName = oracleContainer.getDatabaseName(); // This is the SID/Service Name
			return String.format("jdbc:oracle:thin:@//%s:%d/%s", host, hostPort, dbName);
		case DB2:
			dbName = db2Container.getDatabaseName();
			return String.format("jdbc:db2://%s:%d/%s", host, hostPort, dbName);
		default:
			return null;
		}
	}

	public String getUsername(DatabaseVendor vendor) {
		// Allow getting username even if stopped, based on container type defaults
		switch (vendor) {
		case POSTGRESQL:
			return "postgres";
		case MYSQL:
			return "root";
		case MARIADB:
			return "root";
		case SQLITE:
			return "";
		case SQLSERVER:
			return "sa";
		case ORACLE:
			return "system"; // Default user for Oracle XE image
		case DB2:
			return "db2inst1";
		default:
			return null;
		}
	}

	public String getPassword(DatabaseVendor vendor) {
		// Allow getting password even if stopped, based on container type defaults
		switch (vendor) {
		case POSTGRESQL:
			return "postgres";
		case MYSQL:
			return "password";
		case MARIADB:
			return "password";
		case SQLITE:
			return "";
		case SQLSERVER:
			return "Password123!";
		case ORACLE:
			return "oracle"; // Default password for Oracle XE image
		case DB2:
			return "password";
		default:
			return null;
		}
	}

	public Connection getConnection(DatabaseVendor vendor) {
		if (!isRunning(vendor)) {
			System.err.println("Cannot get connection for " + vendor + ": Database is not running.");
			return null;
		}
		String jdbcUrl = getJdbcUrl(vendor); // Uses the actual port
		String username = getUsername(vendor);
		String password = getPassword(vendor);
		String driverClass = getJpaProperties(vendor, false).get("jakarta.persistence.jdbc.driver");

		if (jdbcUrl == null || driverClass == null) {
			System.err.println("Cannot get connection for " + vendor + ": Missing JDBC URL or Driver Class.");
			return null;
		}

		try {
			Class.forName(driverClass);
			return DriverManager.getConnection(jdbcUrl, username, password);
		} catch (SQLException | ClassNotFoundException e) {
			System.err.println("Failed to get connection for " + vendor + " at " + jdbcUrl + ": " + e.getMessage());
			return null;
		}
	}

	/** Get JPA properties */
	public Map<String, String> getJpaProperties(DatabaseVendor vendor, boolean forInitialization) {
		String jdbcUrl = getJdbcUrl(vendor); // Handles running check, SQLite, and port mapping

		if (jdbcUrl == null && vendor != DatabaseVendor.SQLITE) {
			System.err
					.println("Warning: Requesting JPA properties for non-running or uninitialized database: " + vendor);
			Map<String, String> props = new HashMap<>();
			props.put("jakarta.persistence.jdbc.url", "jdbc:unknown");
			return props;
		}
		// Special handling for SQLite URL if needed during initialization phase before
		// file exists
		if (jdbcUrl == null && vendor == DatabaseVendor.SQLITE) {
			Path path = getActualDataPath(vendor); // Get path even if not "running"
			if (path != null) {
				jdbcUrl = "jdbc:sqlite:" + path.resolve("northwind.db").toString();
			} else {
				System.err.println("Error: Cannot determine SQLite JDBC URL for JPA properties - path not set.");
				return new HashMap<>();
			}
		}

		Map<String, String> props = new HashMap<>();
		props.put("jakarta.persistence.jdbc.url", jdbcUrl);
		props.put("jakarta.persistence.jdbc.user", getUsername(vendor));
		props.put("jakarta.persistence.jdbc.password", getPassword(vendor));

		String driverClass = null;
		switch (vendor) {
		case POSTGRESQL:
			props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
			driverClass = "org.postgresql.Driver";
			break;
		case MYSQL:
			props.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
			driverClass = "com.mysql.cj.jdbc.Driver";
			break;
		case MARIADB:
			props.put("hibernate.dialect", "org.hibernate.dialect.MariaDBDialect");
			driverClass = "org.mariadb.jdbc.Driver";
			break;
		case SQLITE:
			props.put("hibernate.dialect", "org.hibernate.community.dialect.SQLiteDialect");
			driverClass = "org.sqlite.JDBC";
			props.put("hibernate.connection.foreign_keys", "true");
			break;
		case SQLSERVER:
			props.put("hibernate.dialect", "org.hibernate.dialect.SQLServerDialect");
			driverClass = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
			break;
		case ORACLE:
			props.put("hibernate.dialect", "org.hibernate.dialect.OracleDialect");
			driverClass = "oracle.jdbc.OracleDriver";
			break;
		case DB2:
			props.put("hibernate.dialect", "org.hibernate.dialect.Db2Dialect");
			driverClass = "com.ibm.db2.jcc.DB2Driver";
			break;
		}
		if (driverClass != null)
			props.put("jakarta.persistence.jdbc.driver", driverClass);

		props.put("hibernate.hbm2ddl.auto", forInitialization ? "create" : "validate");
		props.put("jakarta.persistence.schema-generation.database.action", forInitialization ? "create" : "validate");
		props.put("hibernate.show_sql", "false");
		props.put("hibernate.format_sql", "false");

		// Add javax properties for compatibility
		props.put("javax.persistence.jdbc.url", jdbcUrl);
		props.put("javax.persistence.jdbc.user", getUsername(vendor));
		props.put("javax.persistence.jdbc.password", getPassword(vendor));
		if (driverClass != null)
			props.put("javax.persistence.jdbc.driver", driverClass);

		return props;
	}

	// ---------- PRIVATE CONTAINER START/SETUP METHODS ----------

	private void startPostgreSQL(Path hostDataPath, Integer hostPort) {
		// 1) build container, always expose the container port
		PostgreSQLContainer<?> container = new PostgreSQLContainer<>(DockerImageName.parse(POSTGRES_TAG))
				.withDatabaseName("northwind").withUsername("postgres").withPassword("postgres")
				.withFileSystemBind(hostDataPath.toString(), "/var/lib/postgresql/data", BindMode.READ_WRITE)
				.withStartupTimeout(Duration.ofMinutes(2))
				.withExposedPorts(DatabaseVendor.POSTGRESQL.getContainerPort()); // Expose internal port

		// 2) if fixed host port requested, add Docker-Java port-binding
		if (hostPort != null) {
			int cPort = DatabaseVendor.POSTGRESQL.getContainerPort();
			container = container.withCreateContainerCmdModifier(cmd -> {
				Ports portBindings = cmd.getHostConfig().getPortBindings();
				if (portBindings == null) {
					portBindings = new Ports();
				}
				Ports.Binding hostBinding = Ports.Binding.bindPort(hostPort);
				portBindings.bind(ExposedPort.tcp(cPort), hostBinding); // Use first binding
				cmd.getHostConfig().withPortBindings(portBindings);
			});
		}

		// 3) assign & start
		this.postgresContainer = container;
		this.postgresContainer.start();
	}

	private void startMySQL(Path hostDataPath, Integer hostPort) {
		// 1) build container, always expose the container port
		MySQLContainer<?> container = new MySQLContainer<>(DockerImageName.parse(MYSQL_TAG))
				.withDatabaseName("northwind").withUsername("root").withPassword("password")
				.withFileSystemBind(hostDataPath.toString(), "/var/lib/mysql", BindMode.READ_WRITE)
				.withStartupTimeout(Duration.ofMinutes(2)).withExposedPorts(DatabaseVendor.MYSQL.getContainerPort()); // Expose
																														// internal
																														// port

		// 2) if fixed host port requested, add Docker-Java port-binding
		if (hostPort != null) {
			int cPort = DatabaseVendor.MYSQL.getContainerPort();
			container = container.withCreateContainerCmdModifier(cmd -> {
				Ports portBindings = cmd.getHostConfig().getPortBindings();
				if (portBindings == null) {
					portBindings = new Ports();
				}
				Ports.Binding hostBinding = Ports.Binding.bindPort(hostPort);
				portBindings.bind(ExposedPort.tcp(cPort), hostBinding); // Use first binding
				cmd.getHostConfig().withPortBindings(portBindings);
			});
		}

		// 3) assign & start
		this.mysqlContainer = container;
		this.mysqlContainer.start();
	}

	private void startMariaDB(Path hostDataPath, Integer hostPort) {
		// 1) build container, always expose the container port
		MariaDBContainer<?> container = new MariaDBContainer<>(DockerImageName.parse(MARIADB_TAG))
				.withDatabaseName("northwind").withUsername("root").withPassword("password")
				.withFileSystemBind(hostDataPath.toString(), "/var/lib/mysql", BindMode.READ_WRITE)
				.withStartupTimeout(Duration.ofMinutes(2)).withExposedPorts(DatabaseVendor.MARIADB.getContainerPort()); // Expose
																														// internal
																														// port

		// 2) if fixed host port requested, add Docker-Java port-binding
		if (hostPort != null) {
			int cPort = DatabaseVendor.MARIADB.getContainerPort();
			container = container.withCreateContainerCmdModifier(cmd -> {
				Ports portBindings = cmd.getHostConfig().getPortBindings();
				if (portBindings == null) {
					portBindings = new Ports();
				}
				Ports.Binding hostBinding = Ports.Binding.bindPort(hostPort);
				portBindings.bind(ExposedPort.tcp(cPort), hostBinding); // Use first binding
				cmd.getHostConfig().withPortBindings(portBindings);
			});
		}

		// 3) assign & start
		this.mariaDbContainer = container;
		this.mariaDbContainer.start();
	}

	private boolean setupSQLite(Path hostDataPath) {
		try {
			sqliteDbFile = hostDataPath.resolve("northwind.db").toFile();
			Files.createDirectories(sqliteDbFile.getParentFile().toPath());
			System.out.println("SQLite database file path set to: " + sqliteDbFile.getAbsolutePath());
			return true;
		} catch (IOException e) {
			System.err.println("Error setting up SQLite path at " + hostDataPath + ": " + e.getMessage());
			sqliteDbFile = null;
			return false;
		}
	}

	private void startSQLServer(Path hostDataPath, Integer hostPort) {
		// 1) build container, always expose the container port
		MSSQLServerContainer<?> container = new MSSQLServerContainer<>(DockerImageName.parse(SQLSERVER_TAG))
				.acceptLicense().withPassword("Password123!")
				.withFileSystemBind(hostDataPath.toString(), "/var/opt/mssql", BindMode.READ_WRITE)
				.withStartupTimeout(Duration.ofMinutes(4))
				.withExposedPorts(DatabaseVendor.SQLSERVER.getContainerPort()); // Expose internal port

		// 2) if fixed host port requested, add Docker-Java port-binding
		if (hostPort != null) {
			int cPort = DatabaseVendor.SQLSERVER.getContainerPort();
			container = container.withCreateContainerCmdModifier(cmd -> {
				Ports portBindings = cmd.getHostConfig().getPortBindings();
				if (portBindings == null) {
					portBindings = new Ports();
				}
				Ports.Binding hostBinding = Ports.Binding.bindPort(hostPort);
				portBindings.bind(ExposedPort.tcp(cPort), hostBinding); // Use first binding
				cmd.getHostConfig().withPortBindings(portBindings);
			});
		}

		// 3) assign & start
		this.sqlServerContainer = container;
		this.sqlServerContainer.start();
	}

	private void startOracle(Path hostDataPath, Integer hostPort) {
		// 1) build container, always expose the container port
		OracleContainer container = new OracleContainer(DockerImageName.parse(ORACLE_TAG)).withDatabaseName("XEPDB1")
				.withFileSystemBind(hostDataPath.toString(), "/opt/oracle/oradata", BindMode.READ_WRITE)
				.withStartupTimeout(Duration.ofMinutes(5)).withExposedPorts(DatabaseVendor.ORACLE.getContainerPort()); // Expose
																														// internal
																														// port

		// 2) if fixed host port requested, add Docker-Java port-binding
		if (hostPort != null) {
			int cPort = DatabaseVendor.ORACLE.getContainerPort();
			// Need to cast to GenericContainer to access withCreateContainerCmdModifier
			container = (OracleContainer) ((GenericContainer<?>) container).withCreateContainerCmdModifier(cmd -> {
				Ports portBindings = cmd.getHostConfig().getPortBindings();
				if (portBindings == null) {
					portBindings = new Ports();
				}
				Ports.Binding hostBinding = Ports.Binding.bindPort(hostPort);
				portBindings.bind(ExposedPort.tcp(cPort), hostBinding); // Use first binding
				cmd.getHostConfig().withPortBindings(portBindings);
			});
		}

		// 3) assign & start
		this.oracleContainer = container;
		this.oracleContainer.start();
	}

	private void startDB2(Path hostDataPath, Integer hostPort) {
		// 1) build container, always expose the container port
		Db2Container container = new Db2Container(DockerImageName.parse(DB2_TAG)).acceptLicense()
				.withUsername("db2inst1").withPassword("password").withDatabaseName("NORTHWIND")
				.withFileSystemBind(hostDataPath.toString(), "/database", BindMode.READ_WRITE).withPrivilegedMode(true) // Often
																														// required
																														// for
																														// DB2
				.withStartupTimeout(Duration.ofMinutes(10)).withExposedPorts(DatabaseVendor.DB2.getContainerPort()); // Expose
																														// internal
																														// port

		// 2) if fixed host port requested, add Docker-Java port-binding
		if (hostPort != null) {
			int cPort = DatabaseVendor.DB2.getContainerPort();
			// Need to cast to GenericContainer to access withCreateContainerCmdModifier
			container = (Db2Container) ((GenericContainer<?>) container).withCreateContainerCmdModifier(cmd -> {
				Ports portBindings = cmd.getHostConfig().getPortBindings();
				if (portBindings == null) {
					portBindings = new Ports();
				}
				Ports.Binding hostBinding = Ports.Binding.bindPort(hostPort);
				portBindings.bind(ExposedPort.tcp(cPort), hostBinding);
				cmd.getHostConfig().withPortBindings(portBindings);
			});
		}

		// 3) assign & start
		this.db2Container = container;
		this.db2Container.start();
	}

	// ---------- INITIALIZATION METHOD ----------
	private boolean initializeDatabaseWithGenerator(DatabaseVendor vendor, Path hostDataPath) {
		EntityManagerFactory emf = null;
		EntityManager em = null;
		String persistenceUnitName = "northwind-" + vendor.name().toLowerCase();

		try {
			System.out.println("Creating EntityManagerFactory for " + persistenceUnitName + " with hbm2ddl=create...");
			Map<String, String> props = getJpaProperties(vendor, true);
			if (props.isEmpty() || props.get("jakarta.persistence.jdbc.url").equals("jdbc:unknown")) {
				System.err.println("Cannot initialize " + vendor
						+ ": Failed to get valid JPA properties (check container start and port mapping).");
				return false;
			}
			// Ensure create action is set for initialization
			props.put("hibernate.hbm2ddl.auto", "create");
			props.put("jakarta.persistence.schema-generation.database.action", "create");

			emf = Persistence.createEntityManagerFactory(persistenceUnitName, props);
			em = emf.createEntityManager();
			System.out.println("EntityManager created. Generating data...");

			// Use the NorthwindDataGenerator
			NorthwindDataGenerator generator = new NorthwindDataGenerator(em);
			generator.generateAll(); // Call the method to generate data

			System.out.println("Data generation complete for " + vendor);
			return true;

		} catch (Exception e) {
			System.err.println("Error during database initialization for " + vendor + " at " + hostDataPath + ": "
					+ e.getMessage());
			e.printStackTrace();
			return false;
		} finally {
			if (em != null && em.isOpen())
				em.close();
			if (emf != null && emf.isOpen())
				emf.close();
			System.out.println("EntityManagerFactory closed for " + persistenceUnitName);
		}
	}

	// --- Get Database Version (Helper) ---
	public String getDatabaseVersion(DatabaseVendor vendor) {
		if (!isRunning(vendor) && vendor != DatabaseVendor.SQLITE) {
			return "Not running";
		}
		if (vendor == DatabaseVendor.SQLITE) {
			Path dbPath = getActualDataPath(vendor);
			if (dbPath == null)
				return "Path not set";
			String url = "jdbc:sqlite:" + dbPath.resolve("northwind.db").toString();
			try {
				Class.forName("org.sqlite.JDBC");
				try (Connection conn = DriverManager.getConnection(url);
						Statement stmt = conn.createStatement();
						ResultSet rs = stmt.executeQuery("SELECT sqlite_version()")) {
					if (rs.next()) {
						return "SQLite " + rs.getString(1);
					} else {
						return "SQLite (version unknown)";
					}
				}
			} catch (Exception e) {
				// Check if file exists before reporting error
				File file = dbPath.resolve("northwind.db").toFile();
				if (!file.exists()) {
					return "SQLite (file not found)";
				}
				return "Error getting SQLite version: " + e.getMessage();
			}
		}

		// For containerized DBs
		try (Connection conn = getConnection(vendor)) {
			if (conn == null)
				return "Connection failed";
			return conn.getMetaData().getDatabaseProductName() + " " + conn.getMetaData().getDatabaseProductVersion();
		} catch (SQLException e) {
			return "Error getting version: " + e.getMessage();
		}
	}
}