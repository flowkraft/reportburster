package com.sourcekraft.documentburster.utils;

import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Helper class providing simplified SQL execution methods for scripts. Manages
 * Jdbi Handle lifecycle automatically. Methods throw Exception on failure.
 */
public class SqlExecutor {

	private static final Logger log = LoggerFactory.getLogger(SqlExecutor.class);
	private final DatabaseConnectionManager dbManager;

	/**
	 * Constructor requiring the DatabaseConnectionManager.
	 *
	 * @param dbManager The manager instance used to obtain Jdbi connections.
	 */
	public SqlExecutor(DatabaseConnectionManager dbManager) {
		if (dbManager == null) {
			throw new IllegalArgumentException("DatabaseConnectionManager cannot be null for SqlExecutor.");
		}
		this.dbManager = dbManager;
		log.debug("SqlExecutor initialized.");
	}

	// --- Primary Connection Methods ---

	/**
	 * Executes a SELECT query on the primary database connection.
	 *
	 * @param sql    The SQL query string. Use named parameters like :paramName.
	 * @param params A Map containing parameter names and their values (optional,
	 *               can be null or empty).
	 * @return A List of Maps, where each Map represents a row (column name ->
	 *         value).
	 * @throws Exception if getting the connection or executing the query fails.
	 */
	public List<Map<String, Object>> query(String sql, Map<String, Object> params) throws Exception {
		log.debug("Executing primary query: {}", sql);
		String primaryCode = dbManager.ctx.settings.getPrimaryDatabaseConnectionCode(); // Throws IllegalStateException
																						// if not found
		Jdbi jdbi = dbManager.getJdbi(primaryCode); // Throws Exception if fails
		// Exceptions within withHandle (like SQL errors) will propagate
		return jdbi.withHandle(handle -> executeQuery(handle, sql, params));
	}

	/**
	 * Executes a SELECT query on the primary database connection (no parameters).
	 *
	 * @param sql The SQL query string.
	 * @return A List of Maps representing the rows.
	 * @throws Exception if getting the connection or executing the query fails.
	 */
	public List<Map<String, Object>> query(String sql) throws Exception {
		return query(sql, null);
	}

	/**
	 * Executes an INSERT, UPDATE, or DELETE statement on the primary database
	 * connection.
	 *
	 * @param sql    The SQL statement string. Use named parameters like :paramName.
	 * @param params A Map containing parameter names and their values (optional,
	 *               can be null or empty).
	 * @return The number of rows affected.
	 * @throws Exception if getting the connection or executing the statement fails.
	 */
	public int update(String sql, Map<String, Object> params) throws Exception {
		log.debug("Executing primary update: {}", sql);
		String primaryCode = dbManager.ctx.settings.getPrimaryDatabaseConnectionCode(); // Throws IllegalStateException
																						// if not found
		Jdbi jdbi = dbManager.getJdbi(primaryCode); // Throws Exception if fails
		// Exceptions within withHandle (like SQL errors) will propagate
		return jdbi.withHandle(handle -> executeUpdate(handle, sql, params));
	}

	/**
	 * Executes an INSERT, UPDATE, or DELETE statement on the primary database
	 * connection (no parameters).
	 *
	 * @param sql The SQL statement string.
	 * @return The number of rows affected.
	 * @throws Exception if getting the connection or executing the statement fails.
	 */
	public int update(String sql) throws Exception {
		return update(sql, null);
	}

	// --- Explicit Connection Methods ---

	/**
	 * Executes a SELECT query on a specific database connection identified by code.
	 *
	 * @param connectionCode The code identifying the target database connection.
	 * @param sql            The SQL query string. Use named parameters like
	 *                       :paramName.
	 * @param params         A Map containing parameter names and their values
	 *                       (optional, can be null or empty).
	 * @return A List of Maps, where each Map represents a row (column name ->
	 *         value).
	 * @throws Exception if the connection code is blank, getting the connection
	 *                   fails, or executing the query fails.
	 */
	public List<Map<String, Object>> queryOn(String connectionCode, String sql, Map<String, Object> params)
			throws Exception {
		log.debug("Executing query on '{}': {}", connectionCode, sql);
		if (StringUtils.isBlank(connectionCode)) {
			// Throw exception instead of returning empty list
			throw new IllegalArgumentException("Connection code cannot be blank for queryOn.");
		}
		Jdbi jdbi = dbManager.getJdbi(connectionCode); // Throws Exception if fails
		// Exceptions within withHandle (like SQL errors) will propagate
		return jdbi.withHandle(handle -> executeQuery(handle, sql, params));
	}

	/**
	 * Executes a SELECT query on a specific database connection (no parameters).
	 *
	 * @param connectionCode The code identifying the target database connection.
	 * @param sql            The SQL query string.
	 * @return A List of Maps representing the rows.
	 * @throws Exception if the connection code is blank, getting the connection
	 *                   fails, or executing the query fails.
	 */
	public List<Map<String, Object>> queryOn(String connectionCode, String sql) throws Exception {
		return queryOn(connectionCode, sql, null);
	}

	/**
	 * Executes an INSERT, UPDATE, or DELETE statement on a specific database
	 * connection.
	 *
	 * @param connectionCode The code identifying the target database connection.
	 * @param sql            The SQL statement string. Use named parameters like
	 *                       :paramName.
	 * @param params         A Map containing parameter names and their values
	 *                       (optional, can be null or empty).
	 * @return The number of rows affected.
	 * @throws Exception if the connection code is blank, getting the connection
	 *                   fails, or executing the statement fails.
	 */
	public int updateOn(String connectionCode, String sql, Map<String, Object> params) throws Exception {
		log.debug("Executing update on '{}': {}", connectionCode, sql);
		if (StringUtils.isBlank(connectionCode)) {
			// Throw exception instead of returning -1
			throw new IllegalArgumentException("Connection code cannot be blank for updateOn.");
		}
		Jdbi jdbi = dbManager.getJdbi(connectionCode); // Throws Exception if fails
		// Exceptions within withHandle (like SQL errors) will propagate
		return jdbi.withHandle(handle -> executeUpdate(handle, sql, params));
	}

	/**
	 * Executes an INSERT, UPDATE, or DELETE statement on a specific database
	 * connection (no parameters).
	 *
	 * @param connectionCode The code identifying the target database connection.
	 * @param sql            The SQL statement string.
	 * @return The number of rows affected.
	 * @throws Exception if the connection code is blank, getting the connection
	 *                   fails, or executing the statement fails.
	 */
	public int updateOn(String connectionCode, String sql) throws Exception {
		return updateOn(connectionCode, sql, null);
	}

	// --- Private Helper Methods ---

	/**
	 * Executes a query using a given handle. Internal JDBI exceptions will
	 * propagate.
	 */
	private List<Map<String, Object>> executeQuery(Handle handle, String sql, Map<String, Object> params) {
		// Change ResultBearing to Query
		org.jdbi.v3.core.statement.Query query = handle.createQuery(sql);
		if (params != null && !params.isEmpty()) {
			// Now bindMap can be called on the Query object
			query.bindMap(params);
		}
		// mapToMap().list() is available on Query
		return query.mapToMap().list();
	}

	/**
	 * Executes an update using a given handle. Internal JDBI exceptions will
	 * propagate.
	 */
	private int executeUpdate(Handle handle, String sql, Map<String, Object> params) {
		org.jdbi.v3.core.statement.Update updateStmt = handle.createUpdate(sql);
		if (params != null && !params.isEmpty()) {
			updateStmt.bindMap(params);
		}
		return updateStmt.execute();
	}

}