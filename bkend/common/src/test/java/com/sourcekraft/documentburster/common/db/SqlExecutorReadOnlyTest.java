package com.sourcekraft.documentburster.common.db;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

import javax.sql.DataSource;

import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

/**
 * {@link SqlExecutor#queryOnReadOnly} on a driver without transactions, behind the product's pool.
 *
 * <p>
 * The Canvas runs its SQL through {@code queryOnReadOnly}, which used to open a transaction on every
 * connection. The ClickHouse driver has none: it answers {@code setAutoCommit(false)} with SQLSTATE
 * 0A000, and HikariCP counts 0A000 as fatal. It marks the connection broken, evicts it and leaves the
 * handle on a closed one, so every ClickHouse query of the Canvas failed (run A: 92 of 92).
 * </p>
 *
 * <p>
 * No ClickHouse server is needed to show it: an SQLite file behind a real HikariCP pool (the product's
 * pool settings), with each connection wrapped so that it answers like ClickHouse does -
 * {@code supportsTransactions()} is false and {@code setAutoCommit(false)} throws with 0A000. Three
 * queries in a row must each return their rows, without ever asking for a transaction and on the one
 * physical connection the pool opened first. A plain SQLite connection, which has transactions, must
 * still get its transaction and the rollback.
 * </p>
 */
class SqlExecutorReadOnlyTest {

	private static final String CODE = "clickhouse-like";

	private static final String SQL = "SELECT n FROM numbers ORDER BY n";

	@Test
	void driverWithoutTransactions_threeQueries_rowsAndTheSameConnection(@TempDir Path temp) throws Exception {
		String url = numbersDatabase(temp);
		List<String> calls = new CopyOnWriteArrayList<>();
		AtomicInteger opened = new AtomicInteger();

		try (HikariDataSource pool = pool(new Connections(url, true, calls, opened))) {
			SqlExecutor executor = new SqlExecutor(managerOf(Jdbi.create(pool)));
			// the pool's start-up check opens (and, with minimumIdle 0, closes) a connection of its own
			int openedBefore = opened.get();

			for (int i = 1; i <= 3; i++) {
				List<Map<String, Object>> rows = executor.queryOnReadOnly(CODE, SQL, null);
				assertEquals(3, rows.size(), "query " + i + " returns its rows");
			}

			assertFalse(calls.contains("setAutoCommit(false)"),
					"a driver without transactions is never asked to open one: " + calls);
			assertEquals(1, opened.get() - openedBefore,
					"the pool evicted nothing: one physical connection served all three");
			assertEquals(1, pool.getHikariPoolMXBean().getTotalConnections(), "the pool still holds that connection");
		}
	}

	@Test
	void driverWithTransactions_stillGetsTheTransactionAndTheRollback(@TempDir Path temp) throws Exception {
		String url = numbersDatabase(temp);
		List<String> calls = new CopyOnWriteArrayList<>();

		try (HikariDataSource pool = pool(new Connections(url, false, calls, new AtomicInteger()))) {
			SqlExecutor executor = new SqlExecutor(managerOf(Jdbi.create(pool)));

			assertEquals(3, executor.queryOnReadOnly(CODE, SQL, null).size());

			assertTrue(calls.contains("setAutoCommit(false)"), "the transaction is opened: " + calls);
			assertTrue(calls.contains("rollback"), "and rolled back: " + calls);
		}
	}

	/** An SQLite file with one table of three rows. */
	private static String numbersDatabase(Path temp) throws Exception {
		String url = "jdbc:sqlite:" + temp.resolve("numbers.db").toAbsolutePath();
		try (Connection connection = DriverManager.getConnection(url);
				Statement statement = connection.createStatement()) {
			statement.execute("CREATE TABLE numbers (n INTEGER)");
			statement.execute("INSERT INTO numbers VALUES (1), (2), (3)");
		}
		return url;
	}

	/** A HikariCP pool with the pool settings of {@link DatabaseConnectionManager#getDataSource}. */
	private static HikariDataSource pool(DataSource connections) {
		HikariConfig config = new HikariConfig();
		config.setDataSource(connections);
		config.setMaximumPoolSize(10);
		config.setMinimumIdle(0);
		config.setPoolName("HikariPool-" + CODE);
		return new HikariDataSource(config);
	}

	/** A manager that hands out the test's pool for any connection code. */
	private static DatabaseConnectionManager managerOf(Jdbi jdbi) {
		return new DatabaseConnectionManager(null) {
			@Override
			public synchronized Jdbi getJdbi(String connectionCode) {
				return jdbi;
			}
		};
	}

	/**
	 * The physical connections behind the pool: SQLite, counted as they are opened, and with
	 * {@code clickHouseLike} answering as the ClickHouse driver does. Every {@code setAutoCommit} and
	 * {@code rollback} is recorded.
	 */
	private static final class Connections implements DataSource {

		private final String url;
		private final boolean clickHouseLike;
		private final List<String> calls;
		private final AtomicInteger opened;

		Connections(String url, boolean clickHouseLike, List<String> calls, AtomicInteger opened) {
			this.url = url;
			this.clickHouseLike = clickHouseLike;
			this.calls = calls;
			this.opened = opened;
		}

		@Override
		public Connection getConnection() throws java.sql.SQLException {
			Connection real = DriverManager.getConnection(url);
			opened.incrementAndGet();
			return (Connection) Proxy.newProxyInstance(SqlExecutorReadOnlyTest.class.getClassLoader(),
					new Class<?>[] { Connection.class }, (proxy, method, arguments) -> {
						String name = method.getName();
						if ("setAutoCommit".equals(name)) {
							calls.add("setAutoCommit(" + arguments[0] + ")");
							if (clickHouseLike && Boolean.FALSE.equals(arguments[0])) {
								throw new SQLFeatureNotSupportedException("setAutoCommit(false) is not supported",
										"0A000");
							}
						}
						if ("rollback".equals(name)) calls.add("rollback");
						if (clickHouseLike && "getMetaData".equals(name)) return noTransactions(real.getMetaData());
						return forward(real, method, arguments);
					});
		}

		@Override
		public Connection getConnection(String username, String password) throws java.sql.SQLException {
			return getConnection();
		}

		@Override
		public PrintWriter getLogWriter() {
			return null;
		}

		@Override
		public void setLogWriter(PrintWriter out) {
		}

		@Override
		public void setLoginTimeout(int seconds) {
		}

		@Override
		public int getLoginTimeout() {
			return 0;
		}

		@Override
		public Logger getParentLogger() throws SQLFeatureNotSupportedException {
			throw new SQLFeatureNotSupportedException();
		}

		@Override
		public <T> T unwrap(Class<T> type) throws java.sql.SQLException {
			throw new java.sql.SQLException("not a wrapper");
		}

		@Override
		public boolean isWrapperFor(Class<?> type) {
			return false;
		}

		/** The driver's metadata, except that it has no transactions. */
		private static DatabaseMetaData noTransactions(DatabaseMetaData real) {
			return (DatabaseMetaData) Proxy.newProxyInstance(SqlExecutorReadOnlyTest.class.getClassLoader(),
					new Class<?>[] { DatabaseMetaData.class }, (proxy, method, arguments) -> {
						if ("supportsTransactions".equals(method.getName())) return false;
						return forward(real, method, arguments);
					});
		}

		private static Object forward(Object target, java.lang.reflect.Method method, Object[] arguments)
				throws Throwable {
			try {
				return method.invoke(target, arguments);
			} catch (InvocationTargetException wrapped) {
				throw wrapped.getCause();
			}
		}
	}
}
