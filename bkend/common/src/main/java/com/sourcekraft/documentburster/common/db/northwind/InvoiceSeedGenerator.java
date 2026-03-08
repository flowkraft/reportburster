package com.sourcekraft.documentburster.common.db.northwind;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.db.northwind.NorthwindManager.DatabaseVendor;

import net.datafaker.Faker;

/**
 * Deterministic large-volume invoice data generator for ad-hoc testing.
 *
 * Creates and populates 4 tables (seed_inv_customer, seed_inv_product,
 * seed_inv_invoice, seed_inv_invoice_line) completely separate from the
 * existing Northwind schema.
 *
 * Uses Datafaker with a fixed seed (42) for deterministic, realistic data.
 * Customer and product counts scale with N for realistic distributions.
 *
 * Idempotent: TRUNCATE + re-insert on every run. Same N always produces
 * identical data.
 *
 * Supported vendors: PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, DB2, Supabase.
 * NOT supported: SQLite, DuckDB (file-based), ClickHouse (OLAP-only).
 */
public class InvoiceSeedGenerator {

	private static final Logger log = LoggerFactory.getLogger(InvoiceSeedGenerator.class);

	public static final long SEED = 42;
	private static final int BATCH_SIZE = 5000;
	private static final LocalDate BASE_DATE = LocalDate.of(2024, 1, 1);

	private static final String[] STATUSES = { "PAID", "PAID", "PAID", "PENDING", "PENDING", "OVERDUE" };
	// 50% PAID, 33% PENDING, 17% OVERDUE

	private static final String[] CATEGORIES = {
			"Beverages", "Condiments", "Confections", "Dairy Products",
			"Grains/Cereals", "Meat/Poultry", "Produce", "Seafood", "Oils", "Spices"
	};

	// Base prices per category (min, max) for realistic product pricing
	private static final double[][] CATEGORY_PRICE_RANGES = {
			{ 3.50, 28.00 },  // Beverages
			{ 8.00, 45.00 },  // Condiments
			{ 10.00, 30.00 }, // Confections
			{ 6.00, 45.00 },  // Dairy Products
			{ 5.00, 15.00 },  // Grains/Cereals
			{ 15.00, 50.00 }, // Meat/Poultry
			{ 3.00, 12.00 },  // Produce
			{ 18.00, 55.00 }, // Seafood
			{ 8.00, 20.00 },  // Oils
			{ 5.00, 25.00 }   // Spices
	};

	// ─── PUBLIC API ──────────────────────────────────────────────────────

	/**
	 * Seeds N invoices (master-detail) into the seed_inv_* tables.
	 * Idempotent: creates tables if needed, truncates, then re-inserts.
	 *
	 * Customer count = clamp(N/10, 100, 100_000)
	 * Product count  = clamp(N/20, 50, 10_000)
	 */
	public static void seedInvoices(Connection conn, DatabaseVendor vendor, int invoiceCount) throws Exception {
		long startTime = System.currentTimeMillis();
		log.info("=== Invoice Seed: Starting for {}, N={} ===", vendor, invoiceCount);

		int customerCount = clamp(invoiceCount / 10, 100, 100_000);
		int productCount = clamp(invoiceCount / 20, 50, 10_000);

		log.info("Scaling: {} customers, {} products for {} invoices", customerCount, productCount, invoiceCount);

		boolean origAutoCommit = conn.getAutoCommit();
		try {
			conn.setAutoCommit(false);

			try (Statement stmt = conn.createStatement()) {
				createTablesIfNotExist(stmt, vendor);
				conn.commit();
				log.info("Tables ready: seed_inv_customer, seed_inv_product, seed_inv_invoice, seed_inv_invoice_line");

				truncateAllTables(stmt, vendor);
				conn.commit();
				log.info("Truncated existing data (child-first order)");
			}

			// Disable FK constraints for bulk insert performance
			disableForeignKeyChecks(conn, vendor);

			Faker faker = new Faker(new Random(SEED));

			insertCustomers(conn, faker, customerCount);
			conn.commit();
			log.info("Inserted reference data: {} customers", customerCount);

			insertProducts(conn, faker, productCount);
			conn.commit();
			log.info("Inserted reference data: {} products", productCount);

			Random rand = new Random(SEED + 100); // Separate stream for invoices
			int totalLines = insertInvoicesAndLines(conn, invoiceCount, customerCount, productCount, rand);
			conn.commit();

			// Re-enable FK constraints
			enableForeignKeyChecks(conn, vendor);

			long elapsed = System.currentTimeMillis() - startTime;
			log.info("=== Invoice Seed: COMPLETED ===");
			log.info("  Tables: seed_inv_customer({}), seed_inv_product({}), seed_inv_invoice({}), seed_inv_invoice_line({})",
					customerCount, productCount, invoiceCount, totalLines);
			log.info("  Duration: {} seconds", String.format("%.1f", elapsed / 1000.0));

		} catch (Exception e) {
			try {
				conn.rollback();
			} catch (Exception ignored) {
			}
			throw e;
		} finally {
			conn.setAutoCommit(origAutoCommit);
		}
	}

	/**
	 * Wipes all data from the seed_inv_* tables (does NOT touch Northwind tables).
	 */
	public static void wipeInvoices(Connection conn, DatabaseVendor vendor) throws Exception {
		long startTime = System.currentTimeMillis();
		log.info("=== Invoice Wipe: Starting for {} ===", vendor);

		boolean origAutoCommit = conn.getAutoCommit();
		try {
			conn.setAutoCommit(false);
			try (Statement stmt = conn.createStatement()) {
				truncateAllTables(stmt, vendor);
				conn.commit();
			}
			long elapsed = System.currentTimeMillis() - startTime;
			log.info("=== Invoice Wipe: COMPLETED === (Duration: {} ms)", elapsed);
		} catch (Exception e) {
			try {
				conn.rollback();
			} catch (Exception ignored) {
			}
			throw e;
		} finally {
			conn.setAutoCommit(origAutoCommit);
		}
	}

	/**
	 * Checks whether seed_inv_invoice table exists and has any data.
	 * Uses SELECT 1 ... LIMIT 1 (or vendor equivalent) for maximum speed.
	 * Returns true if at least one row exists, false otherwise.
	 */
	public static boolean checkSeedStatus(Connection conn, DatabaseVendor vendor) {
		try (Statement stmt = conn.createStatement()) {
			String sql;
			switch (vendor) {
				case ORACLE:
					sql = "SELECT 1 FROM seed_inv_customer WHERE ROWNUM = 1";
					break;
				case SQLSERVER:
					sql = "SELECT TOP 1 1 FROM seed_inv_customer";
					break;
				case DB2:
					sql = "SELECT 1 FROM seed_inv_customer FETCH FIRST 1 ROWS ONLY";
					break;
				default:
					// PostgreSQL, MySQL, MariaDB, Supabase
					sql = "SELECT 1 FROM seed_inv_customer LIMIT 1";
					break;
			}
			java.sql.ResultSet rs = stmt.executeQuery(sql);
			boolean hasData = rs.next();
			log.debug("Seed status check: seed_inv_customer hasData={}", hasData);
			return hasData;
		} catch (Exception e) {
			// Table doesn't exist or other error — means no seed data
			log.debug("Seed status check: table not found or error ({})", e.getMessage());
			return false;
		}
	}

	// ─── DDL ─────────────────────────────────────────────────────────────

	private static void createTablesIfNotExist(Statement stmt, DatabaseVendor vendor) throws Exception {
		String varchar = isOracle(vendor) ? "VARCHAR2" : "VARCHAR";

		log.info("Creating tables if not exist: seed_inv_customer, seed_inv_product, seed_inv_invoice, seed_inv_invoice_line");

		createTableSafe(stmt, "CREATE TABLE seed_inv_customer ("
				+ "customer_id INT NOT NULL PRIMARY KEY, "
				+ "company_name " + varchar + "(100) NOT NULL, "
				+ "contact_name " + varchar + "(60), "
				+ "address " + varchar + "(120), "
				+ "city " + varchar + "(40), "
				+ "country " + varchar + "(40), "
				+ "email " + varchar + "(100)"
				+ ")");

		createTableSafe(stmt, "CREATE TABLE seed_inv_product ("
				+ "product_id INT NOT NULL PRIMARY KEY, "
				+ "product_name " + varchar + "(80) NOT NULL, "
				+ "category " + varchar + "(40), "
				+ "unit_price DECIMAL(10,2)"
				+ ")");

		// FK constraints — named for all vendors (needed for disable/enable during bulk insert)
		String invoiceFk = ", CONSTRAINT fk_sinv_inv_cust FOREIGN KEY (customer_id) REFERENCES seed_inv_customer(customer_id)";

		createTableSafe(stmt, "CREATE TABLE seed_inv_invoice ("
				+ "invoice_id INT NOT NULL PRIMARY KEY, "
				+ "customer_id INT NOT NULL, "
				+ "invoice_date DATE, "
				+ "due_date DATE, "
				+ "status " + varchar + "(20), "
				+ "freight DECIMAL(10,2), "
				+ "notes " + varchar + "(200)"
				+ invoiceFk
				+ ")");

		String lineFkInvoice = ", CONSTRAINT fk_sinv_line_inv FOREIGN KEY (invoice_id) REFERENCES seed_inv_invoice(invoice_id)";
		String lineFkProduct = ", CONSTRAINT fk_sinv_line_prod FOREIGN KEY (product_id) REFERENCES seed_inv_product(product_id)";

		createTableSafe(stmt, "CREATE TABLE seed_inv_invoice_line ("
				+ "line_id INT NOT NULL PRIMARY KEY, "
				+ "invoice_id INT NOT NULL, "
				+ "product_id INT NOT NULL, "
				+ "quantity INT, "
				+ "unit_price DECIMAL(10,2), "
				+ "discount DECIMAL(5,2)"
				+ lineFkInvoice
				+ lineFkProduct
				+ ")");

		// Indexes on FK columns (required for join performance + fast truncate/delete)
		createIndexSafe(stmt, "CREATE INDEX idx_sinv_inv_cust ON seed_inv_invoice(customer_id)");
		createIndexSafe(stmt, "CREATE INDEX idx_sinv_line_inv ON seed_inv_invoice_line(invoice_id)");
		createIndexSafe(stmt, "CREATE INDEX idx_sinv_line_prod ON seed_inv_invoice_line(product_id)");

		// Indexes for common reporting query/filter patterns
		createIndexSafe(stmt, "CREATE INDEX idx_sinv_inv_date ON seed_inv_invoice(invoice_date)");
		createIndexSafe(stmt, "CREATE INDEX idx_sinv_inv_status ON seed_inv_invoice(status)");
		createIndexSafe(stmt, "CREATE INDEX idx_sinv_cust_country ON seed_inv_customer(country)");
		createIndexSafe(stmt, "CREATE INDEX idx_sinv_prod_cat ON seed_inv_product(category)");
	}

	/** Silently ignores "table already exists" errors for idempotent DDL. */
	private static void createTableSafe(Statement stmt, String ddl) {
		try {
			stmt.execute(ddl);
		} catch (Exception e) {
			log.debug("Table creation skipped (likely already exists): {}", e.getMessage());
		}
	}

	/** Silently ignores "index already exists" errors for idempotent DDL. */
	private static void createIndexSafe(Statement stmt, String ddl) {
		try {
			stmt.execute(ddl);
		} catch (Exception e) {
			log.debug("Index creation skipped (likely already exists): {}", e.getMessage());
		}
	}

	// ─── FK CONSTRAINT TOGGLE (for bulk insert performance) ─────────────

	private static void disableForeignKeyChecks(Connection conn, DatabaseVendor vendor) throws Exception {
		try (Statement stmt = conn.createStatement()) {
			if (isMysqlFamily(vendor)) {
				stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
			} else if (isPostgresFamily(vendor)) {
				stmt.execute("SET session_replication_role = 'replica'");
			} else if (isSqlServer(vendor)) {
				stmt.execute("ALTER TABLE seed_inv_invoice NOCHECK CONSTRAINT ALL");
				stmt.execute("ALTER TABLE seed_inv_invoice_line NOCHECK CONSTRAINT ALL");
			} else if (isOracle(vendor)) {
				safeExecute(stmt, "ALTER TABLE seed_inv_invoice DISABLE CONSTRAINT fk_sinv_inv_cust");
				safeExecute(stmt, "ALTER TABLE seed_inv_invoice_line DISABLE CONSTRAINT fk_sinv_line_inv");
				safeExecute(stmt, "ALTER TABLE seed_inv_invoice_line DISABLE CONSTRAINT fk_sinv_line_prod");
			} else if (isDb2(vendor)) {
				stmt.execute("ALTER TABLE seed_inv_invoice ALTER FOREIGN KEY fk_sinv_inv_cust NOT ENFORCED");
				stmt.execute("ALTER TABLE seed_inv_invoice_line ALTER FOREIGN KEY fk_sinv_line_inv NOT ENFORCED");
				stmt.execute("ALTER TABLE seed_inv_invoice_line ALTER FOREIGN KEY fk_sinv_line_prod NOT ENFORCED");
			}
			conn.commit();
			log.info("Disabled FK constraints for bulk insert");
		}
	}

	private static void enableForeignKeyChecks(Connection conn, DatabaseVendor vendor) throws Exception {
		try (Statement stmt = conn.createStatement()) {
			if (isMysqlFamily(vendor)) {
				stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
			} else if (isPostgresFamily(vendor)) {
				stmt.execute("SET session_replication_role = 'origin'");
			} else if (isSqlServer(vendor)) {
				stmt.execute("ALTER TABLE seed_inv_invoice_line WITH CHECK CHECK CONSTRAINT ALL");
				stmt.execute("ALTER TABLE seed_inv_invoice WITH CHECK CHECK CONSTRAINT ALL");
			} else if (isOracle(vendor)) {
				safeExecute(stmt, "ALTER TABLE seed_inv_invoice ENABLE CONSTRAINT fk_sinv_inv_cust");
				safeExecute(stmt, "ALTER TABLE seed_inv_invoice_line ENABLE CONSTRAINT fk_sinv_line_inv");
				safeExecute(stmt, "ALTER TABLE seed_inv_invoice_line ENABLE CONSTRAINT fk_sinv_line_prod");
			} else if (isDb2(vendor)) {
				stmt.execute("ALTER TABLE seed_inv_invoice ALTER FOREIGN KEY fk_sinv_inv_cust ENFORCED");
				stmt.execute("ALTER TABLE seed_inv_invoice_line ALTER FOREIGN KEY fk_sinv_line_inv ENFORCED");
				stmt.execute("ALTER TABLE seed_inv_invoice_line ALTER FOREIGN KEY fk_sinv_line_prod ENFORCED");
			}
			conn.commit();
			log.info("Re-enabled FK constraints");
		}
	}

	private static void safeExecute(Statement stmt, String sql) {
		try {
			stmt.execute(sql);
		} catch (Exception e) {
			log.debug("Safe execute skipped: {}", e.getMessage());
		}
	}

	// ─── TRUNCATE ────────────────────────────────────────────────────────

	private static void truncateAllTables(Statement stmt, DatabaseVendor vendor) throws Exception {
		log.info("Truncating: seed_inv_invoice_line, seed_inv_invoice, seed_inv_product, seed_inv_customer");

		if (isMysqlFamily(vendor)) {
			stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
			stmt.execute("TRUNCATE TABLE seed_inv_invoice_line");
			stmt.execute("TRUNCATE TABLE seed_inv_invoice");
			stmt.execute("TRUNCATE TABLE seed_inv_product");
			stmt.execute("TRUNCATE TABLE seed_inv_customer");
			stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
		} else if (isSqlServer(vendor)) {
			// SQL Server cannot TRUNCATE tables referenced by FK — use DELETE in child-first order
			stmt.execute("DELETE FROM seed_inv_invoice_line");
			stmt.execute("DELETE FROM seed_inv_invoice");
			stmt.execute("DELETE FROM seed_inv_product");
			stmt.execute("DELETE FROM seed_inv_customer");
		} else if (isDb2(vendor)) {
			// DB2: TRUNCATE not allowed inside a transaction — use DELETE
			stmt.execute("DELETE FROM seed_inv_invoice_line");
			stmt.execute("DELETE FROM seed_inv_invoice");
			stmt.execute("DELETE FROM seed_inv_product");
			stmt.execute("DELETE FROM seed_inv_customer");
		} else if (isPostgresFamily(vendor)) {
			// PostgreSQL / Supabase: CASCADE handles FK
			stmt.execute("TRUNCATE TABLE seed_inv_customer, seed_inv_product, seed_inv_invoice, seed_inv_invoice_line CASCADE");
		} else if (isOracle(vendor)) {
			// Oracle: child-first, no CASCADE on TRUNCATE
			stmt.execute("TRUNCATE TABLE seed_inv_invoice_line");
			stmt.execute("TRUNCATE TABLE seed_inv_invoice");
			stmt.execute("TRUNCATE TABLE seed_inv_product");
			stmt.execute("TRUNCATE TABLE seed_inv_customer");
		} else {
			// Fallback: child-first DELETE
			stmt.execute("DELETE FROM seed_inv_invoice_line");
			stmt.execute("DELETE FROM seed_inv_invoice");
			stmt.execute("DELETE FROM seed_inv_product");
			stmt.execute("DELETE FROM seed_inv_customer");
		}
	}

	// ─── INSERT REFERENCE DATA (Datafaker) ───────────────────────────────

	private static void insertCustomers(Connection conn, Faker faker, int count) throws Exception {
		String sql = "INSERT INTO seed_inv_customer (customer_id, company_name, contact_name, address, city, country, email) "
				+ "VALUES (?, ?, ?, ?, ?, ?, ?)";

		try (PreparedStatement ps = conn.prepareStatement(sql)) {
			for (int i = 1; i <= count; i++) {
				String companyName = truncate(faker.company().name(), 100);
				String contactName = truncate(faker.name().fullName(), 60);
				String address = truncate(faker.address().streetAddress(), 120);
				String city = truncate(faker.address().city(), 40);
				String country = truncate(faker.address().country(), 40);
				String email = truncate(faker.internet().emailAddress(), 100);

				ps.setInt(1, i);
				ps.setString(2, companyName);
				ps.setString(3, contactName);
				ps.setString(4, address);
				ps.setString(5, city);
				ps.setString(6, country);
				ps.setString(7, email);
				ps.addBatch();

				if (i % BATCH_SIZE == 0) {
					ps.executeBatch();
					conn.commit();
				}
			}
			ps.executeBatch();
		}
	}

	private static void insertProducts(Connection conn, Faker faker, int count) throws Exception {
		String sql = "INSERT INTO seed_inv_product (product_id, product_name, category, unit_price) "
				+ "VALUES (?, ?, ?, ?)";

		Random priceRand = new Random(SEED + 50);

		try (PreparedStatement ps = conn.prepareStatement(sql)) {
			for (int i = 1; i <= count; i++) {
				int catIdx = (i - 1) % CATEGORIES.length;
				String category = CATEGORIES[catIdx];
				String productName = truncate(faker.commerce().productName(), 80);
				double minPrice = CATEGORY_PRICE_RANGES[catIdx][0];
				double maxPrice = CATEGORY_PRICE_RANGES[catIdx][1];
				double unitPrice = round2(minPrice + priceRand.nextDouble() * (maxPrice - minPrice));

				ps.setInt(1, i);
				ps.setString(2, productName);
				ps.setString(3, category);
				ps.setDouble(4, unitPrice);
				ps.addBatch();

				if (i % BATCH_SIZE == 0) {
					ps.executeBatch();
					conn.commit();
				}
			}
			ps.executeBatch();
		}
	}

	// ─── INSERT INVOICES + LINES ─────────────────────────────────────────

	private static int insertInvoicesAndLines(Connection conn, int invoiceCount,
			int customerCount, int productCount, Random rand) throws Exception {

		String invoiceSql = "INSERT INTO seed_inv_invoice "
				+ "(invoice_id, customer_id, invoice_date, due_date, status, freight, notes) "
				+ "VALUES (?, ?, ?, ?, ?, ?, ?)";
		String lineSql = "INSERT INTO seed_inv_invoice_line "
				+ "(line_id, invoice_id, product_id, quantity, unit_price, discount) "
				+ "VALUES (?, ?, ?, ?, ?, ?)";

		int totalLines = 0;
		int lineId = 0;
		int tenPercent = Math.max(1, invoiceCount / 10);

		try (PreparedStatement invoicePs = conn.prepareStatement(invoiceSql);
				PreparedStatement linePs = conn.prepareStatement(lineSql)) {

			for (int i = 1; i <= invoiceCount; i++) {
				// Master: invoice
				int customerId = rand.nextInt(customerCount) + 1;
				int daysOffset = rand.nextInt(730); // 2 years range
				LocalDate invoiceDate = BASE_DATE.plusDays(daysOffset);
				LocalDate dueDate = invoiceDate.plusDays(30);
				String status = STATUSES[rand.nextInt(STATUSES.length)];
				double freight = round2(5.0 + rand.nextDouble() * 95.0); // 5-100
				String notes = "Invoice #" + i;

				invoicePs.setInt(1, i);
				invoicePs.setInt(2, customerId);
				invoicePs.setDate(3, Date.valueOf(invoiceDate));
				invoicePs.setDate(4, Date.valueOf(dueDate));
				invoicePs.setString(5, status);
				invoicePs.setDouble(6, freight);
				invoicePs.setString(7, notes);
				invoicePs.addBatch();

				// Detail: 3-5 lines per invoice
				int numLines = 3 + rand.nextInt(3); // 3, 4, or 5
				for (int j = 0; j < numLines; j++) {
					lineId++;
					int productId = rand.nextInt(productCount) + 1;
					int quantity = 1 + rand.nextInt(50); // 1-50
					double unitPrice = round2(5.0 + rand.nextDouble() * 50.0); // 5-55
					double discount = round2(rand.nextInt(4) * 0.05); // 0, 0.05, 0.10, 0.15

					linePs.setInt(1, lineId);
					linePs.setInt(2, i);
					linePs.setInt(3, productId);
					linePs.setInt(4, quantity);
					linePs.setDouble(5, unitPrice);
					linePs.setDouble(6, discount);
					linePs.addBatch();
					totalLines++;
				}

				// Flush batches periodically
				if (i % BATCH_SIZE == 0) {
					invoicePs.executeBatch();
					linePs.executeBatch();
					conn.commit();
				}

				// Progress logging
				if (i % tenPercent == 0) {
					int pct = (int) ((i * 100L) / invoiceCount);
					log.info("Inserting invoices... {}% complete ({}/{})", pct, i, invoiceCount);
				}
			}

			// Flush remaining
			invoicePs.executeBatch();
			linePs.executeBatch();
		}

		return totalLines;
	}

	// ─── HELPERS ─────────────────────────────────────────────────────────

	private static boolean isOracle(DatabaseVendor vendor) {
		return vendor == DatabaseVendor.ORACLE;
	}

	private static boolean isDb2(DatabaseVendor vendor) {
		return vendor == DatabaseVendor.DB2;
	}

	private static boolean isMysqlFamily(DatabaseVendor vendor) {
		return vendor == DatabaseVendor.MYSQL || vendor == DatabaseVendor.MARIADB;
	}

	private static boolean isSqlServer(DatabaseVendor vendor) {
		return vendor == DatabaseVendor.SQLSERVER;
	}

	private static boolean isPostgresFamily(DatabaseVendor vendor) {
		return vendor == DatabaseVendor.POSTGRES || vendor == DatabaseVendor.SUPABASE;
	}

	private static double round2(double value) {
		return Math.round(value * 100.0) / 100.0;
	}

	private static int clamp(int value, int min, int max) {
		return Math.max(min, Math.min(max, value));
	}

	/** Truncate string to maxLen to avoid DB column overflow. */
	private static String truncate(String s, int maxLen) {
		if (s == null) return null;
		return s.length() <= maxLen ? s : s.substring(0, maxLen);
	}
}
