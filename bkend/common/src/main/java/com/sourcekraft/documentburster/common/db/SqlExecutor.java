package com.sourcekraft.documentburster.common.db;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.apache.commons.lang3.StringUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.statement.StatementCustomizer;
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
		String primaryCode = dbManager.getSettings().getReportingPrimaryDatabaseConnectionCode(); // Throws IllegalStateException
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
		String primaryCode = dbManager.getSettings().getReportingPrimaryDatabaseConnectionCode(); // Throws IllegalStateException
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
	 * Executes a SELECT on a specific database connection and reads at most {@code maxRows} rows.
	 *
	 * <p>For SQL somebody else wrote, whose result the caller only needs the first rows of: an
	 * author's {@code filter_options} list, for instance. The cap is set on the statement, so the
	 * driver stops fetching instead of this code reading a whole table and throwing most of it
	 * away. A {@code maxRows} of 0 or less means no cap, exactly like
	 * {@link #queryOn(String, String, Map)}.
	 *
	 * @param connectionCode The code identifying the target database connection.
	 * @param sql            The SQL query string. Use named parameters like :paramName.
	 * @param params         A Map containing parameter names and their values (optional).
	 * @param maxRows        The greatest number of rows to read, or 0 for all of them.
	 * @return A List of Maps representing the rows.
	 * @throws Exception if the connection code is blank, getting the connection fails, or
	 *                   executing the query fails.
	 */
	public List<Map<String, Object>> queryOn(String connectionCode, String sql, Map<String, Object> params,
			int maxRows) throws Exception {
		log.debug("Executing query on '{}' for at most {} rows: {}", connectionCode, maxRows, sql);
		if (StringUtils.isBlank(connectionCode)) {
			throw new IllegalArgumentException("Connection code cannot be blank for queryOn.");
		}
		Jdbi jdbi = dbManager.getJdbi(connectionCode);
		return jdbi.withHandle(handle -> executeQuery(handle, sql, params, maxRows));
	}

	/**
	 * Executes a SELECT query on a specific database connection inside a transaction that is
	 * always rolled back, with the JDBC connection flagged read-only for the duration.
	 *
	 * <p>For ad-hoc SQL that a person or an AI Hub agent typed (see
	 * {@code QueriesService.executeAdHocQuery}), where the statement is not trusted the way a
	 * report's own SQL is. The rows are read fully before the rollback, so the caller gets its
	 * result either way, and anything the statement managed to change is undone.
	 *
	 * <p>A driver that refuses transactions or the read-only flag (SQLite once open, ClickHouse)
	 * is logged at DEBUG and the query runs anyway: the guard in front of this path is what
	 * refuses writes, and the transaction is the second line of defence, not the only one.
	 *
	 * @param connectionCode The code identifying the target database connection.
	 * @param sql            The SQL query string. Use named parameters like :paramName.
	 * @param params         A Map containing parameter names and their values (optional).
	 * @return A List of Maps representing the rows.
	 * @throws Exception if the connection code is blank, getting the connection fails, or
	 *                   executing the query fails.
	 */
	public List<Map<String, Object>> queryOnReadOnly(String connectionCode, String sql, Map<String, Object> params)
			throws Exception {
		return queryOnReadOnly(connectionCode, sql, params, 0, 0);
	}

	/**
	 * The same, reading at most {@code maxRows} rows (0 reads them all) and stopping the statement
	 * once it has run {@code timeoutSeconds} (0 lets it run). A statement stopped that way fails with
	 * {@link #ranTooLong(int)} as its message.
	 */
	public List<Map<String, Object>> queryOnReadOnly(String connectionCode, String sql, Map<String, Object> params,
			int maxRows, int timeoutSeconds) throws Exception {
		log.debug("Executing read-only query on '{}': {}", connectionCode, sql);
		if (StringUtils.isBlank(connectionCode)) {
			throw new IllegalArgumentException("Connection code cannot be blank for queryOnReadOnly.");
		}
		Jdbi jdbi = dbManager.getJdbi(connectionCode); // Throws Exception if fails
		return jdbi.withHandle(handle -> {

			boolean readOnlyRestore = false;
			boolean readOnlyWas = false;
			boolean inTransaction = false;

			try {
				// Before begin(): several drivers refuse setReadOnly() once a transaction is open.
				try {
					readOnlyWas = handle.getConnection().isReadOnly();
					handle.getConnection().setReadOnly(true);
					readOnlyRestore = true;
				} catch (Exception e) {
					log.debug("Connection '{}' would not go read-only: {}", connectionCode, e.getMessage());
				}

				try {
					handle.begin();
					inTransaction = true;
				} catch (Exception e) {
					log.debug("Connection '{}' would not open a transaction: {}", connectionCode, e.getMessage());
				}

				return executeQuery(handle, sql, params, maxRows, timeoutSeconds);

			} finally {
				if (inTransaction) {
					try {
						handle.rollback(); // also restores the handle's autocommit setting
					} catch (Exception e) {
						log.debug("Rollback failed on '{}': {}", connectionCode, e.getMessage());
					}
				}
				if (readOnlyRestore) {
					try {
						handle.getConnection().setReadOnly(readOnlyWas);
					} catch (Exception e) {
						log.debug("Could not restore the read-only flag on '{}': {}", connectionCode, e.getMessage());
					}
				}
			}
		});
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
		return executeQuery(handle, sql, params, 0);
	}

	/** The same, reading at most {@code maxRows} rows; 0 reads them all. */
	private List<Map<String, Object>> executeQuery(Handle handle, String sql, Map<String, Object> params,
			int maxRows) {
		return executeQuery(handle, sql, params, maxRows, 0);
	}

	/** The same, stopping the statement once it has run {@code timeoutSeconds}; 0 lets it run. */
	private List<Map<String, Object>> executeQuery(Handle handle, String sql, Map<String, Object> params,
			int maxRows, int timeoutSeconds) {
		org.jdbi.v3.core.statement.Query query = handle.createQuery(sql);
		if (maxRows > 0) {
			query.setMaxRows(maxRows);
		}
		Deadline deadline = new Deadline(timeoutSeconds);
		query.addCustomizer(deadline);
		if (params != null && !params.isEmpty()) {
			Map<String, Object> scalarParams = new java.util.LinkedHashMap<>();
			for (Map.Entry<String, Object> e : params.entrySet()) {
				if (e.getValue() instanceof java.util.List) {
					query.bindList(e.getKey(), (java.util.List<?>) e.getValue());
				} else {
					scalarParams.put(e.getKey(), e.getValue());
				}
			}
			if (!scalarParams.isEmpty()) query.bindMap(scalarParams);
		}
		// Use getColumnLabel() directly so aliases like AS "Revenue" are preserved
		// as-is, matching the case the published Groovy script returns via JDBC.
		// JDBI's default mapToMap() lowercases all keys, which breaks rb-value/rb-chart
		// field lookups in published dashboards.
		try {
			return query.map((rs, ctx) -> {
				java.sql.ResultSetMetaData meta = rs.getMetaData();
				Map<String, Object> row = new java.util.LinkedHashMap<>();
				for (int i = 1; i <= meta.getColumnCount(); i++) {
					row.put(meta.getColumnLabel(i), rs.getObject(i));
				}
				return row;
			}).list();
		} catch (RuntimeException failed) {
			throw deadline.explain(failed);
		} finally {
			deadline.disarm();
		}
	}

	/** What a statement stopped for running too long fails with: words a widget can show. */
	public static String ranTooLong(int timeoutSeconds) {
		return "The query ran longer than " + timeoutSeconds + " seconds and was stopped.";
	}

	/** Whether this failure is a statement stopped by its timeout, anywhere in its causes. */
	public static boolean timedOut(Throwable failure) {
		for (Throwable cause = failure; cause != null; cause = cause.getCause())
			if (cause instanceof SQLTimeoutException)
				return true;
		return false;
	}

	/**
	 * Holds every statement of this Groovy {@code Sql} to {@code timeoutSeconds}, through the driver's
	 * own query timeout; 0 leaves them as they are.
	 */
	public static void timeLimit(groovy.sql.Sql sql, int timeoutSeconds) {
		if (sql == null || timeoutSeconds <= 0)
			return;
		sql.withStatement(new groovy.lang.Closure<Void>(null) {
			@SuppressWarnings("unused")
			public void doCall(java.sql.Statement statement) {
				try {
					statement.setQueryTimeout(timeoutSeconds);
				} catch (SQLException unsupported) {
					log.debug("The driver takes no query timeout: {}", unsupported.getMessage());
				}
			}
		});
	}

	/**
	 * Stops a statement that runs past its time, two ways at once because drivers differ: the JDBC
	 * query timeout, which DuckDB, PostgreSQL and the other servers honour while the query runs, and a
	 * cancel() when the time is up, for a driver whose timeout means something else (SQLite's only
	 * bounds a wait for a lock). With 0 seconds it does nothing.
	 */
	private static final class Deadline implements StatementCustomizer {

		private static final ScheduledExecutorService TIMER = Executors.newSingleThreadScheduledExecutor(r -> {
			Thread thread = new Thread(r, "statement-deadline");
			thread.setDaemon(true);
			return thread;
		});

		private final int seconds;

		private volatile ScheduledFuture<?> cancel;

		private volatile boolean passed;

		Deadline(int seconds) {
			this.seconds = seconds;
		}

		@Override
		public void beforeExecution(PreparedStatement statement, StatementContext ctx) {
			if (seconds <= 0)
				return;
			try {
				statement.setQueryTimeout(seconds);
			} catch (SQLException unsupported) {
				log.debug("The driver takes no query timeout: {}", unsupported.getMessage());
			}
			cancel = TIMER.schedule(() -> {
				passed = true;
				try {
					statement.cancel();
				} catch (SQLException alreadyDone) {
					log.debug("Cancel after {} s: {}", seconds, alreadyDone.getMessage());
				}
			}, seconds, TimeUnit.SECONDS);
		}

		void disarm() {
			if (cancel != null)
				cancel.cancel(false);
		}

		RuntimeException explain(RuntimeException failed) {
			if (seconds > 0 && (passed || timedOut(failed)))
				return new IllegalStateException(ranTooLong(seconds), failed);
			return failed;
		}
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