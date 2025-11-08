package com.sourcekraft.documentburster.common.db.northwind;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.ProcessResult;
import com.sourcekraft.documentburster.utils.Utils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.RetryPolicy;

/**
 * Manages database containers for the Northwind sample database using a
 * docker-compose file. Supports PostgreSQL, MySQL, SQLite, SQL Server, Oracle,
 * MariaDB, and IBM DB2. Data is persisted in external volumes. Initialization
 * occurs only if data is not present.
 */
public class NorthwindManager implements AutoCloseable {

	private static final Logger log = LoggerFactory.getLogger(NorthwindManager.class);

	private static final String DOCKER_COMPOSE_FILENAME = "docker-compose.yml";
	private static final String MARKER_FILENAME = ".northwind_initialized";

	// State-tracking maps
	private final Map<DatabaseVendor, Boolean> runningDatabases = new HashMap<>();
	private final Map<DatabaseVendor, Path> activeDataPaths = new HashMap<>();
	private final Map<DatabaseVendor, Integer> activeHostPorts = new HashMap<>();

	private final String baseDataPath;
	private final String dockerComposeFilePath;
	private File sqliteDbFile;

	/**
	 * Defines the supported database vendors with their default connection
	 * properties.
	 */
	public enum DatabaseVendor {
		POSTGRES(5432, "postgres", "postgres", "Northwind", Duration.ofMinutes(30)),
		MYSQL(3306, "root", "password", "Northwind", Duration.ofMinutes(30)),
		MARIADB(3307, "root", "password", "Northwind", Duration.ofMinutes(30)), // Use 3307 to avoid conflict
		SQLITE(0, null, null, "Northwind", Duration.ofMinutes(10)),
		SQLSERVER(1433, "sa", "Password123!", "Northwind", Duration.ofMinutes(60)),
		ORACLE(1521, "oracle", "oracle", "XEPDB1", Duration.ofMinutes(60)), // DB name is XE for Oracle XE
		DB2(50000, "db2inst1", "password", "NORTHWND", Duration.ofMinutes(60));

		private final int containerPort;
		private final String defaultUser;
		private final String defaultPassword;
		private final String defaultDbName;
		private final Duration defaultTimeout;

		DatabaseVendor(int containerPort, String defaultUser, String defaultPassword, String defaultDbName,
				Duration defaultTimeout) {
			this.containerPort = containerPort;
			this.defaultUser = defaultUser;
			this.defaultPassword = defaultPassword;
			this.defaultDbName = defaultDbName;
			this.defaultTimeout = defaultTimeout;
		}

		public int getContainerPort() {
			return containerPort;
		}

		public String getDefaultUser() {
			return defaultUser;
		}

		public String getDefaultPassword() {
			return defaultPassword;
		}

		public String getDefaultDbName() {
			return defaultDbName;
		}

		public Duration getDefaultTimeout() {
			return defaultTimeout;
		}

		public String getDockerComposeServiceName() {
			if (this == SQLSERVER) {
				return "sqlserver"; // docker-compose service names cannot contain uppercase
			}
			return this.name().toLowerCase();
		}
	}

	/**
	 * Initializes the manager, locates the docker-compose file, and sets up the
	 * base data path.
	 */
	public NorthwindManager() throws Exception {
		this.baseDataPath = Utils.getDbFolderPath();
		Path dbTemplatePath = Paths.get(baseDataPath);
		this.dockerComposeFilePath = dbTemplatePath.resolve(DOCKER_COMPOSE_FILENAME).toString();

		for (DatabaseVendor vendor : DatabaseVendor.values()) {
			runningDatabases.put(vendor, false);
		}
	}

	/**
	 * Starts a database service using Docker Compose, then initializes it with data
	 * if it's the first run.
	 */
	public void startDatabase(DatabaseVendor vendor, String customHostPath, Integer customHostPort) throws Exception {
		// --- Path and Port Determination ---
		Path hostDataPath = (customHostPath != null && !customHostPath.trim().isEmpty())
				? Paths.get(customHostPath).toAbsolutePath()
				: getDefaultHostDataPath(vendor);

		Integer hostPortToUse = (customHostPort != null) ? customHostPort : getDefaultHostPort(vendor);

		log.info("[SQL_SERVER_DEBUG] Starting database: vendor={}, hostPort={}, hostDataPath={}",
				vendor, hostPortToUse, hostDataPath);

		// --- Initialization Check ---
		boolean needsInitialization;
		if (vendor == DatabaseVendor.SQLITE) {
			sqliteDbFile = hostDataPath.resolve("northwind.db").toFile();
			needsInitialization = !sqliteDbFile.exists() || sqliteDbFile.length() == 0;
		} else {
			Path markerFile = hostDataPath.resolve(MARKER_FILENAME);
			needsInitialization = !Files.exists(markerFile);
		}

		activeDataPaths.put(vendor, hostDataPath);
		if (hostPortToUse != null) {
			activeHostPorts.put(vendor, hostPortToUse);
		}

		// --- Start Service ---
		if (vendor != DatabaseVendor.SQLITE) {
			startDatabaseWithDockerCompose(vendor, hostPortToUse);
		} else {
			setupSQLite(hostDataPath);
		}

		// --- Update State ---
		runningDatabases.put(vendor, true);

		// --- Initialize Data (if needed) ---
		if (needsInitialization) {
			initializeDatabaseWithGenerator(vendor, hostDataPath);
		}

		log.info("Northwind DB Started: {} | Data Path: {} | JDBC URL: {}", vendor, getActualDataPath(vendor),
				getJdbcUrl(vendor));
	}

	/**
	 * Overloaded version of startDatabase for backward compatibility.
	 */
	public void startDatabase(DatabaseVendor vendor, String customHostPath) throws Exception {
		startDatabase(vendor, customHostPath, null);
	}

	/**
	 * Executes `docker-compose up` for a specific service.
	 */
	private void startDatabaseWithDockerCompose(DatabaseVendor vendor, Integer hostPort) throws Exception {
		String serviceName = vendor.getDockerComposeServiceName();
		Path workingDir = Paths.get(this.dockerComposeFilePath).getParent();

		List<String> command = new ArrayList<>();
		command.add("docker");
		command.add("compose");
		command.add("-f");
		command.add(DOCKER_COMPOSE_FILENAME);
		command.add("up");
		command.add("-d");
		command.add("--remove-orphans"); // Clean up any old containers
		command.add(serviceName);

		ProcessExecutor executor = new ProcessExecutor().command(command).directory(workingDir.toFile())
				// .redirectOutput(Slf4jStream.of(getClass()).asInfo())
				// .redirectError(Slf4jStream.of(getClass()).asError())
				.readOutput(true)
				.timeout(vendor.getDefaultTimeout().toSeconds(), TimeUnit.SECONDS);

		// If a custom port is provided, set it as an environment variable for the
		// process
		if (hostPort != null) {
			Map<String, String> environment = new HashMap<>(System.getenv());
			String portEnvVar = vendor.name();
			portEnvVar += "_PORT";
			environment.put(portEnvVar, hostPort.toString());
			executor.environment(environment);
		}

		log.debug("Executing: {}", String.join(" ", command));

		log.info("[SQL_SERVER_DEBUG] Executing docker-compose command: {}", String.join(" ", command));
		log.info("[SQL_SERVER_DEBUG] Working directory: {}", workingDir);
		if (hostPort != null) {
			log.info("[SQL_SERVER_DEBUG] Environment variable {}={}", vendor.name() + "_PORT", hostPort);
		}

		ProcessResult result = executor.execute();

		log.info("[SQL_SERVER_DEBUG] Docker compose exit code: {}, output: {}",
				result.getExitValue(), result.outputUTF8());

		if (result.getExitValue() != 0) {
			throw new IOException("Docker Compose command failed with exit code " + result.getExitValue()
					+ " for service " + serviceName);
		}

		// ✅ ADD THIS: For SQL Server, create database before normal wait
		if (vendor == DatabaseVendor.SQLSERVER) {
			log.info("[SQL_SERVER_DEBUG] SQL Server started, creating Northwind database...");
			ensureSqlServerDatabaseExists(vendor, hostPort);
		}

		waitForDatabaseToBeReady(vendor, hostPort);
	}

	/**
	 * Stops a specific database service using `docker-compose stop`.
	 */
	public void stopDatabase(DatabaseVendor vendor) throws Exception {
		if (vendor == DatabaseVendor.SQLITE) {
			sqliteDbFile = null; // Just clear the reference
		} else {
			String serviceName = vendor.getDockerComposeServiceName();
			Path workingDir = Paths.get(this.dockerComposeFilePath).getParent();

			// Use the same command structure as startDatabaseWithDockerCompose for
			// consistency
			List<String> command = new ArrayList<>();
			command.add("docker");
			command.add("compose");
			command.add("-f");
			command.add(DOCKER_COMPOSE_FILENAME); // Use relative path like start method
			command.add("stop");
			command.add(serviceName);

			new ProcessExecutor().command(command).directory(workingDir.toFile())
					// .redirectOutput(Slf4jStream.of(getClass()).asInfo())
					// .redirectError(Slf4jStream.of(getClass()).asError())
					.execute();
		}

		// --- Update State ---
		runningDatabases.put(vendor, false);
		activeDataPaths.remove(vendor);
		activeHostPorts.remove(vendor);
		log.info("Service {} stopped.", vendor);
	}

	/**
	 * Waits for a database to become available by checking its port and attempting
	 * a JDBC connection.
	 */
	private void waitForDatabaseToBeReady(DatabaseVendor vendor, Integer hostPort) throws Exception {
		final int port = (hostPort != null) ? hostPort : getDefaultHostPort(vendor);
		final String host = "localhost";

		log.info("[SQL_SERVER_DEBUG] waitForDatabaseToBeReady: vendor={}, port={}", vendor, port);

		// Failsafe retry policy for the connection attempt
		RetryPolicy<Object> retryPolicy = new RetryPolicy<>().handle(Throwable.class) // Handle any exception
				.withDelay(Duration.ofSeconds(5)).withMaxDuration(vendor.getDefaultTimeout()).withMaxRetries(-1)
				.onRetry(e -> log.debug("Connection to {} on port {} failed, retrying...", vendor, port))
				.onFailure(e -> log.error("Failed to connect to {} after multiple retries.", vendor));

		Failsafe.with(retryPolicy).run(() -> {

			log.info("[SQL_SERVER_DEBUG] Retry attempt starting for {}:{}", vendor, port);

			// First, check if the port is open to avoid immediate JDBC timeout
			if (!Utils.isPortOpen(host, port, 2000)) {
				throw new IOException("Port " + port + " is not open.");
			}

			log.info("[SQL_SERVER_DEBUG] Port {} is open, attempting JDBC connection", port);

			// Print classpath for debugging
			// String classpath = System.getProperty("java.class.path");
			// log.info("Current Java classpath: {}", classpath);

			// Print JDBC URL for debugging
			String jdbcUrl = getJdbcUrl(vendor);
			log.info("Attempting JDBC connection with URL: {}", jdbcUrl);

			log.info("[SQL_SERVER_DEBUG] DriverManager.getConnection(url={}, user={}, pass=***)",
					jdbcUrl, getUsername(vendor));

			DriverManager.setLoginTimeout(5);

			// Attempt a full JDBC connection
			try (Connection connection = DriverManager.getConnection(jdbcUrl, getUsername(vendor),
					getPassword(vendor))) {

				log.info("[SQL_SERVER_DEBUG] Connection established, checking validity");

				if (!connection.isValid(5)) {
					log.info("[SQL_SERVER_DEBUG] Connection is NOT valid");
					throw new IOException("JDBC connection is not valid.");
				}

				log.info("[SQL_SERVER_DEBUG] Connection is valid, database is ready");

			}
		});

		log.info("[SQL_SERVER_DEBUG] waitForDatabaseToBeReady completed successfully");
	}

	/**
	 * SQL Server-specific: Create Northwind database if it doesn't exist.
	 * Must connect to 'master' first since Northwind doesn't exist yet.
	 */
	private void ensureSqlServerDatabaseExists(DatabaseVendor vendor, Integer hostPort) throws Exception {
		final int port = (hostPort != null) ? hostPort : getDefaultHostPort(vendor);
		final String masterUrl = "jdbc:sqlserver://localhost:" + port
				+ ";databaseName=master;encrypt=false;trustServerCertificate=true";
		final String dbName = vendor.getDefaultDbName();

		log.info("[SQL_SERVER_DEBUG] Waiting for SQL Server to accept connections on master DB...");

		// Wait for SQL Server to be ready (connect to master)
		RetryPolicy<Object> retryPolicy = new RetryPolicy<>()
				.handle(Throwable.class)
				.withDelay(Duration.ofSeconds(5))
				.withMaxDuration(Duration.ofMinutes(5))
				.withMaxRetries(-1)
				.onRetry(e -> {
					Throwable cause = e.getLastFailure();
					log.debug("[SQL_SERVER_DEBUG] Waiting for SQL Server (attempt #{}): {}",
							e.getAttemptCount(),
							cause != null ? cause.getMessage() : "unknown");
				})
				.onFailure(e -> log.error("[SQL_SERVER_DEBUG] Failed to connect to SQL Server master", e.getFailure()));

		Failsafe.with(retryPolicy).run(() -> {
			if (!Utils.isPortOpen("localhost", port, 2000)) {
				throw new IOException("Port " + port + " not open");
			}

			log.debug("[SQL_SERVER_DEBUG] Port {} open, attempting connection to master", port);
			DriverManager.setLoginTimeout(5);

			try (Connection conn = DriverManager.getConnection(masterUrl, getUsername(vendor), getPassword(vendor))) {
				if (!conn.isValid(5)) {
					throw new IOException("Connection to master not valid");
				}

				log.info("[SQL_SERVER_DEBUG] Connected to master DB, checking if {} exists", dbName);

				try (Statement stmt = conn.createStatement()) {
					// Check if database exists
					ResultSet rs = stmt.executeQuery(
							"SELECT database_id FROM sys.databases WHERE name = '" + dbName + "'");

					if (!rs.next()) {
						log.info("[SQL_SERVER_DEBUG] Database {} does not exist, creating it...", dbName);
						stmt.execute("CREATE DATABASE [" + dbName + "]");

						// Wait a moment for creation to complete
						Thread.sleep(2000);

						log.info("[SQL_SERVER_DEBUG] Database {} created successfully", dbName);
					} else {
						log.info("[SQL_SERVER_DEBUG] Database {} already exists", dbName);
					}
				}
			}
		});

		log.info("[SQL_SERVER_DEBUG] ensureSqlServerDatabaseExists() completed");
	}

	/**
	 * Returns a direct JDBC connection to the specified database. The caller is
	 * responsible for closing the connection.
	 */
	public Connection getConnection(DatabaseVendor vendor) throws Exception {
		return DriverManager.getConnection(getJdbcUrl(vendor), getUsername(vendor), getPassword(vendor));
	}

	/**
	 * Constructs the JDBC URL for a given database vendor.
	 */
	public String getJdbcUrl(DatabaseVendor vendor) {

		int port = activeHostPorts.getOrDefault(vendor, getDefaultHostPort(vendor));
		String dbName = vendor.getDefaultDbName();

		switch (vendor) {
			case POSTGRES:
				return "jdbc:postgresql://localhost:" + port + "/" + dbName;
			case MYSQL:
				return "jdbc:mysql://localhost:" + port + "/" + dbName + "?useSSL=false&allowPublicKeyRetrieval=true";
			case MARIADB:
				return "jdbc:mariadb://localhost:" + port + "/" + dbName + "?useSSL=false&allowPublicKeyRetrieval=true";
			case SQLITE:
				return "jdbc:sqlite:" + getActualDataPath(vendor).resolve("northwind.db").toString();
			case SQLSERVER:
				String url = "jdbc:sqlserver://localhost:" + port + ";databaseName=" + dbName + ";encrypt=false";
				log.info("[SQL_SERVER_DEBUG] Constructed SQL Server URL: {}", url);
				return url;
			case ORACLE:
				return "jdbc:oracle:thin:@//localhost:" + port + "/" + dbName;
			case DB2:
				return "jdbc:db2://localhost:" + port + "/" + dbName;
			default:
				throw new IllegalArgumentException("Unsupported database vendor: " + vendor);
		}
	}

	// --- Helper, State, and Initialization Methods (Largely Unchanged) ---

	private void setupSQLite(Path hostDataPath) throws IOException {
		this.sqliteDbFile = hostDataPath.resolve("northwind.db").toFile();
		Files.createDirectories(this.sqliteDbFile.getParentFile().toPath());
	}

	public void initializeDatabaseWithGenerator(DatabaseVendor vendor, Path hostDataPath) throws Exception {

        log.info("[SQL_SERVER_DEBUG] Starting JPA initialization for {}", vendor);
        log.info("[SQL_SERVER_DEBUG] Persistence unit: northwind-{}", vendor.name().toLowerCase());

        EntityManagerFactory emf = null;
        EntityManager em = null;
        String persistenceUnitName = "northwind-" + vendor.name().toLowerCase();

        try {
            Map<String, String> props = getJpaProperties(vendor, true);

            // For DB2, set default schema explicitly (optional but safer)
            if (vendor == DatabaseVendor.DB2) {
                props.putIfAbsent("hibernate.default_schema", "DB2INST1");
                // You can also add currentSchema via URL if desired:
                // props.put("jakarta.persistence.jdbc.url", getJdbcUrl(vendor) + ":currentSchema=DB2INST1;");
            }

            log.info("[SQL_SERVER_DEBUG] JPA properties: url={}, user={}",
                    props.get("jakarta.persistence.jdbc.url"),
                    props.get("jakarta.persistence.jdbc.user"));

            log.info("[SQL_SERVER_DEBUG] Creating EntityManagerFactory");

            // Retry EMF creation to ride over transient DB2 readiness (-4499) issues
            RetryPolicy<EntityManagerFactory> emfRetry = new RetryPolicy<EntityManagerFactory>()
                    .handle(Throwable.class)
                    .withDelay(Duration.ofSeconds(5))
                    .withMaxRetries(5)
                    .onFailedAttempt(ev -> {
                        Throwable t = ev.getLastFailure();
                        log.warn("EMF creation failed (attempt {} of {}): {}",
                                ev.getAttemptCount(), 5, t != null ? t.getMessage() : "unknown");
                    });

            emf = Failsafe.with(emfRetry).get(() ->
                    Persistence.createEntityManagerFactory(persistenceUnitName, props)
            );

            log.info("[SQL_SERVER_DEBUG] Creating EntityManager");
            em = emf.createEntityManager();

            log.info("[SQL_SERVER_DEBUG] Running NorthwindDataGenerator");

            NorthwindDataGenerator generator = new NorthwindDataGenerator(em);
            generator.generateAll();

            log.info("[SQL_SERVER_DEBUG] Data generation complete, creating marker file");

            if (vendor != DatabaseVendor.SQLITE) {
                Path markerFilePath = hostDataPath.resolve(MARKER_FILENAME);
                Files.createDirectories(hostDataPath);
                Files.createFile(markerFilePath);
                log.info("[SQL_SERVER_DEBUG] Marker file created: {}", markerFilePath);
            }
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
            if (emf != null && emf.isOpen()) {
                emf.close();
            }
        }
    }
	
	public Map<String, String> getJpaProperties(DatabaseVendor vendor, boolean forDdl) {
		Map<String, String> properties = new HashMap<>();
		properties.put("jakarta.persistence.jdbc.url", getJdbcUrl(vendor));
		properties.put("jakarta.persistence.jdbc.user", getUsername(vendor));
		properties.put("jakarta.persistence.jdbc.password", getPassword(vendor));

		if (forDdl) {
			properties.put("jakarta.persistence.schema-generation.database.action", "drop-and-create");
			properties.put("hibernate.hbm2ddl.auto", "create-drop"); // For Hibernate
		}

		return properties;
	}

	public String getUsername(DatabaseVendor vendor) {
		return vendor.getDefaultUser();
	}

	public String getPassword(DatabaseVendor vendor) {
		return vendor.getDefaultPassword();
	}

	public boolean isRunning(DatabaseVendor vendor) {
		return runningDatabases.getOrDefault(vendor, false);
	}

	public Path getActualDataPath(DatabaseVendor vendor) {
		return activeDataPaths.get(vendor);
	}

	public Integer getActualHostPort(DatabaseVendor vendor) {
		return activeHostPorts.get(vendor);
	}

	private Path getDefaultHostDataPath(DatabaseVendor vendor) {
		String subDirName = "sample-northwind-" + vendor.name().toLowerCase().replace("_", "-");
		return Paths.get(this.baseDataPath, subDirName);
	}

	private Integer getDefaultHostPort(DatabaseVendor vendor) {
		return vendor.getContainerPort();
	}

	@Override
	public void close() throws Exception {
		for (DatabaseVendor vendor : DatabaseVendor.values()) {
			if (isRunning(vendor)) {
				stopDatabase(vendor);
			}
		}
	}

	public String getDatabaseVersion(DatabaseVendor vendor) throws Exception {
		try (Connection conn = DriverManager.getConnection(getJdbcUrl(vendor), getUsername(vendor),
				getPassword(vendor))) {
			return conn.getMetaData().getDatabaseProductVersion();
		}
	}

	public boolean testDatabaseConnection(DatabaseVendor vendor) throws Exception {

		try (Connection conn = DriverManager.getConnection(getJdbcUrl(vendor), getUsername(vendor),
				getPassword(vendor))) {
			return conn.isValid(2); // Timeout in seconds
		}
	}

	public List<String> getTableNames(DatabaseVendor vendor) throws Exception {
		List<String> tableNames = new ArrayList<>();

		try (Connection conn = DriverManager.getConnection(getJdbcUrl(vendor), getUsername(vendor),
				getPassword(vendor))) {
			try (ResultSet rs = conn.getMetaData().getTables(null, null, "%", new String[] { "TABLE" })) {
				while (rs.next()) {
					tableNames.add(rs.getString("TABLE_NAME"));
				}
			}
		}
		return tableNames;
	}

	public int getTableCount(DatabaseVendor vendor, String tableName) throws Exception {

		try (Connection conn = DriverManager.getConnection(getJdbcUrl(vendor), getUsername(vendor),
				getPassword(vendor))) {
			try (Statement stmt = conn.createStatement();
					ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM \"" + tableName + "\"")) {
				if (rs.next()) {
					return rs.getInt(1);
				}
			}
		}
		return 0;
	}
}
