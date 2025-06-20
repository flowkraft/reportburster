package com.sourcekraft.documentburster.utils;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.sql.DataSource;

import org.apache.commons.lang3.StringUtils; // Keep StringUtils
import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.model.ConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings; // Import needed
import com.sourcekraft.documentburster.common.settings.model.ServerDatabaseSettings;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

/**
 * Manages database connections using HikariCP connection pooling. Prioritizes
 * using pre-loaded primary connection details from Settings, falling back to
 * file loading for other connection codes. DataSources and Jdbi instances are
 * cached.
 */
public class DatabaseConnectionManager {

	private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionManager.class);

	public final BurstingContext ctx;
	// Cache for DataSource pools (Connection Code -> DataSource)
	private final Map<String, HikariDataSource> dataSourcePools = new ConcurrentHashMap<>();
	// Cache for Jdbi instances (Connection Code -> Jdbi)
	private final Map<String, Jdbi> jdbiInstances = new ConcurrentHashMap<>();
	// Cache for loaded connection details (Connection Code -> Settings)
	private final Map<String, ConnectionDatabaseSettings> loadedConnectionDetails = new ConcurrentHashMap<>();

	public DatabaseConnectionManager(BurstingContext context) {
		this.ctx = context;
		log.debug("DatabaseConnectionManager initialized.");
	}

	/**
	 * Retrieves the connection settings for the given code. Prioritizes pre-loaded
	 * primary connection settings from ctx.settings. Falls back to loading from
	 * file for secondary connections or if primary was not pre-loaded.
	 *
	 * @param connectionCode The unique code identifying the database connection.
	 * @return The ConnectionDatabaseSettings object.
	 * @throws Exception If settings cannot be retrieved.
	 */
	private synchronized ConnectionDatabaseSettings getConnectionSettings(String connectionCode) throws Exception {
		log.trace("Entering getConnectionSettings for code: {}", connectionCode);
		// 0. Check cache first
		if (loadedConnectionDetails.containsKey(connectionCode)) {
			log.debug("Cache hit for connection settings: {}", connectionCode);
			log.trace("Exiting getConnectionSettings (cached) for code: {}", connectionCode);
			return loadedConnectionDetails.get(connectionCode);
		}
		log.debug("Cache miss for connection settings: {}. Attempting retrieval.", connectionCode);

		// 1. Get the primary connection code defined in reporting settings
		String primaryCode = ctx.settings.getPrimaryDatabaseConnectionCode(); // Assumes this method exists and works
		log.trace("Primary connection code from settings: {}", primaryCode);

		// 2. Check if the requested code is the primary one AND if it was pre-loaded by
		// Settings.loadSettings()
		if (StringUtils.isNotEmpty(primaryCode) && primaryCode.equals(connectionCode)
				&& ctx.settings.connectionDatabaseSettings != null) {
			log.debug("Using pre-loaded primary connection settings for code: {}", connectionCode);
			ConnectionDatabaseSettings settings = ctx.settings.connectionDatabaseSettings.connection;
			if (settings == null) {
				log.error(
						"Pre-loaded primary connection settings object (connectionDatabaseSettings.connection) is null for code: {}",
						connectionCode);
				throw new Exception(
						"Pre-loaded primary connection settings object is null for code: " + connectionCode);
			}
			loadedConnectionDetails.put(connectionCode, settings); // Cache it
			log.trace("Exiting getConnectionSettings (pre-loaded) for code: {}", connectionCode);
			return settings;
		} else {
			// 3. Fallback: Load from file for secondary connections OR if primary wasn't
			// pre-loaded
			log.debug("Falling back to file loading for connection code: {}", connectionCode);
			try {
				// Assuming Settings has a static method to load just connection details
				// and ctx provides the base directory for connection files.
				log.trace("Calling ctx.settings.loadSettingsConnectionDatabase for code: {}", connectionCode);
				DocumentBursterConnectionDatabaseSettings dbSettings = ctx.settings
						.loadSettingsConnectionDatabase(connectionCode);
				if (dbSettings == null || dbSettings.connection == null) {
					log.error(
							"Failed to load connection details from file for code: {}. loadSettingsConnectionDatabase returned null or connection object is null.",
							connectionCode);
					throw new Exception("Failed to load connection details from file for code: " + connectionCode);
				}
				log.info("Successfully loaded connection details from file for code: {}", connectionCode);
				ConnectionDatabaseSettings settings = dbSettings.connection;
				loadedConnectionDetails.put(connectionCode, settings); // Cache it
				log.trace("Exiting getConnectionSettings (file loaded) for code: {}", connectionCode);
				return settings;
			} catch (Exception e) {
				log.error("Error loading connection details file for code '{}': {}", connectionCode, e.getMessage(), e); // Log
																															// exception
				throw new Exception("Could not retrieve connection settings for code: " + connectionCode, e);
			}
		}
	}

	/**
	 * Gets a pooled DataSource for the given connection code. If not already
	 * cached, retrieves connection settings (prioritizing pre-loaded primary),
	 * creates and configures the pool, caches it, and returns it.
	 *
	 * @param connectionCode The unique code identifying the database connection.
	 * @return The pooled HikariDataSource instance.
	 * @throws Exception If loading connection details fails or pool creation fails.
	 */
	public synchronized DataSource getDataSource(String connectionCode) throws Exception {
		log.trace("Entering getDataSource for code: {}", connectionCode);
		if (StringUtils.isBlank(connectionCode)) {
			log.error("getDataSource called with blank connection code.");
			throw new IllegalArgumentException("Connection code cannot be blank.");
		}
		// Check cache first
		if (dataSourcePools.containsKey(connectionCode)) {
			log.debug("Cache hit for DataSource: {}", connectionCode);
			log.trace("Exiting getDataSource (cached) for code: {}", connectionCode);
			return dataSourcePools.get(connectionCode);
		}

		log.debug("Cache miss for DataSource: {}. Creating new pool.", connectionCode);
		// Get settings using the new logic
		ConnectionDatabaseSettings connSettings = getConnectionSettings(connectionCode);
		if (connSettings == null || connSettings.databaseserver == null) {
			log.error("Retrieved ConnectionDatabaseSettings or its databaseserver field is null for code: {}",
					connectionCode);
			throw new Exception("Failed to retrieve valid database server settings for code: " + connectionCode);
		}

		// Create DataSource using HikariCP
		log.trace("Creating HikariConfig for code: {}", connectionCode);
		HikariConfig config = new HikariConfig();
		config.setDriverClassName(connSettings.databaseserver.driver);
		config.setJdbcUrl(connSettings.databaseserver.url);
		config.setUsername(connSettings.databaseserver.userid);
		// Log password presence/absence, not the value itself
		config.setPassword(connSettings.databaseserver.userpassword);
		log.trace("HikariConfig: Driver={}, URL={}, User={}, Password provided={}", connSettings.databaseserver.driver,
				connSettings.databaseserver.url, connSettings.databaseserver.userid,
				StringUtils.isNotEmpty(connSettings.databaseserver.userpassword));

		// Add common pool properties (can be customized further)
		config.setMaximumPoolSize(10); // Example size
		config.setMinimumIdle(2); // Example idle
		config.setPoolName("HikariPool-" + connectionCode);
		config.addDataSourceProperty("cachePrepStmts", "true");
		config.addDataSourceProperty("prepStmtCacheSize", "250");
		config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
		log.trace("Hikari pool properties set for code: {}", connectionCode);

		HikariDataSource dataSource = null;
		try {
			log.trace("Creating HikariDataSource instance for code: {}", connectionCode);
			dataSource = new HikariDataSource(config);
			log.debug("HikariDataSource instance created successfully for code: {}", connectionCode);
		} catch (Exception e) {
			log.error("Failed to create HikariDataSource for code '{}': {}", connectionCode, e.getMessage(), e);
			throw new Exception("Failed to create database connection pool for code: " + connectionCode, e);
		}

		// Cache it
		dataSourcePools.put(connectionCode, dataSource);
		log.info("Created and cached new DataSource pool for code: {}", connectionCode);
		log.trace("Exiting getDataSource (created) for code: {}", connectionCode);
		return dataSource;
	}

	/**
	 * Gets a Jdbi instance configured for the given connection code. Uses the
	 * pooled DataSource obtained via getDataSource.
	 *
	 * @param connectionCode The unique code identifying the database connection.
	 * @return The configured Jdbi instance.
	 * @throws Exception If obtaining the DataSource fails.
	 */
	public synchronized Jdbi getJdbi(String connectionCode) throws Exception {
		log.trace("Entering getJdbi for code: {}", connectionCode);
		if (StringUtils.isBlank(connectionCode)) {
			log.error("getJdbi called with blank connection code.");
			throw new IllegalArgumentException("Connection code cannot be blank.");
		}
		// Check cache first
		if (jdbiInstances.containsKey(connectionCode)) {
			log.debug("Cache hit for Jdbi instance: {}", connectionCode);
			log.trace("Exiting getJdbi (cached) for code: {}", connectionCode);
			return jdbiInstances.get(connectionCode);
		}

		log.debug("Cache miss for Jdbi instance: {}. Creating new instance.", connectionCode);
		// Get the DataSource (which handles creation/caching)
		DataSource dataSource = getDataSource(connectionCode);
		if (dataSource == null) {
			log.error("getDataSource returned null for code: {}. Cannot create Jdbi instance.", connectionCode);
			throw new Exception("Failed to obtain DataSource for code: " + connectionCode);
		}

		// Create Jdbi instance
		log.trace("Creating Jdbi instance using DataSource for code: {}", connectionCode);
		Jdbi jdbi = Jdbi.create(dataSource);
		log.debug("Jdbi instance created successfully for code: {}", connectionCode);

		// Cache it
		jdbiInstances.put(connectionCode, jdbi);
		log.info("Created and cached new Jdbi instance for code: {}", connectionCode);
		log.trace("Exiting getJdbi (created) for code: {}", connectionCode);
		return jdbi;
	}

	/**
	 * Closes all managed connection pools. Should be called during application
	 * shutdown.
	 */
	public synchronized void shutdownConnections() {
		log.info("Shutting down all managed database connection pools...");
		dataSourcePools.forEach((code, ds) -> {
			try {
				if (ds != null && !ds.isClosed()) {
					log.debug("Closing DataSource pool for code: {}", code);
					ds.close();
				} else {
					log.trace("DataSource pool for code '{}' was already null or closed.", code);
				}
			} catch (Exception e) {
				log.error("Error closing DataSource pool for code '{}': {}", code, e.getMessage(), e);
			}
		});
		dataSourcePools.clear();
		jdbiInstances.clear(); // Clear Jdbi cache as well
		loadedConnectionDetails.clear(); // Clear connection settings cache
		log.info("All connection pools shut down and caches cleared.");
	}

	// --- Offer lightweight access to server settings for ScriptedReporter ---
	/**
	 * Returns the ServerDatabaseSettings (driver, url, username, password) for the
	 * given connection code.
	 */
	public ServerDatabaseSettings getServerDatabaseSettings(String connectionCode) throws Exception {
		ConnectionDatabaseSettings settings = getConnectionSettings(connectionCode);
		if (settings == null || settings.databaseserver == null) {
			throw new IllegalStateException("No database-server settings found for code: " + connectionCode);
		}
		return settings.databaseserver;
	}

}