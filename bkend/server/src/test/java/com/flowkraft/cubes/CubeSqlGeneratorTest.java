package com.flowkraft.cubes;

import static org.junit.jupiter.api.Assertions.*;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.flowkraft.reporting.dsl.cube.CubeOptions;
import com.flowkraft.reporting.dsl.cube.CubeOptionsParser;

/**
 * Tests for CubeSqlGenerator — verifies SQL generation from cube metadata + field selections.
 */
class CubeSqlGeneratorTest {

	@Test
	void testBasicDimensionAndMeasure() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'country'; sql 'country'; type 'string' }\n" +
				"  dimension { name 'region'; sql 'region'; type 'string' }\n" +
				"  measure { name 'total'; sql 'revenue'; type 'sum' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("country", "region"),
				List.of("total", "count"),
				"postgres");

		assertNotNull(sql);
		assertTrue(sql.contains("country"), "SQL should contain country dimension");
		assertTrue(sql.contains("region"), "SQL should contain region dimension");
		assertTrue(sql.toLowerCase().contains("sum"), "SQL should contain SUM aggregation");
		assertTrue(sql.toLowerCase().contains("count"), "SQL should contain COUNT aggregation");
		assertTrue(sql.toLowerCase().contains("group by"), "SQL should contain GROUP BY");
		assertTrue(sql.toLowerCase().contains("order by"), "SQL should contain ORDER BY");

		System.out.println("Generated SQL (postgres):\n" + sql);
	}

	@Test
	void testNoFieldsSelected() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'country'; sql 'country'; type 'string' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube, List.of(), List.of(), "postgres");

		assertTrue(sql.contains("No fields selected"));
	}

	@Test
	void testMeasureOnlyNoGroupBy() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  measure { name 'total_count'; type 'count' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube, List.of(), List.of("total_count"), "postgres");

		assertNotNull(sql);
		assertTrue(sql.toLowerCase().contains("count"), "SQL should contain COUNT");
		assertFalse(sql.toLowerCase().contains("group by"), "No GROUP BY without dimensions");

		System.out.println("Generated SQL (measure only):\n" + sql);
	}

	@Test
	void testAllAggregationTypes() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'sales'\n" +
				"  dimension { name 'channel'; sql 'sales_channel'; type 'string' }\n" +
				"  measure { name 'total_revenue'; sql 'revenue'; type 'sum' }\n" +
				"  measure { name 'avg_revenue'; sql 'revenue'; type 'avg' }\n" +
				"  measure { name 'min_revenue'; sql 'revenue'; type 'min' }\n" +
				"  measure { name 'max_revenue'; sql 'revenue'; type 'max' }\n" +
				"  measure { name 'tx_count'; type 'count' }\n" +
				"  measure { name 'unique_customers'; sql 'customer_id'; type 'count_distinct' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("channel"),
				List.of("total_revenue", "avg_revenue", "min_revenue", "max_revenue", "tx_count", "unique_customers"),
				"postgres");

		assertTrue(sql.toLowerCase().contains("sum("), "Should have SUM");
		assertTrue(sql.toLowerCase().contains("avg("), "Should have AVG");
		assertTrue(sql.toLowerCase().contains("min("), "Should have MIN");
		assertTrue(sql.toLowerCase().contains("max("), "Should have MAX");
		assertTrue(sql.toLowerCase().contains("count("), "Should have COUNT");
		assertTrue(sql.toLowerCase().contains("count(distinct"), "Should have COUNT DISTINCT");

		System.out.println("Generated SQL (all aggregations):\n" + sql);
	}

	@Test
	void testCubeRefPlaceholder() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'status'; sql '${CUBE}.status'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube, List.of("status"), List.of("count"), "postgres");

		// ${CUBE} should be replaced with the dialect-rendered table name (Postgres → "orders")
		assertTrue(sql.contains("\"orders\".status"), "Should replace ${CUBE} with quoted table name (Postgres)");
		assertFalse(sql.contains("${CUBE}"), "Should not contain ${CUBE} placeholder");

		System.out.println("Generated SQL (CUBE placeholder):\n" + sql);
	}

	@Test
	void testMySqlDialect() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'country'; sql 'country'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sqlPostgres = CubeSqlGenerator.generateSql(cube, List.of("country"), List.of("count"), "postgres");
		String sqlMysql = CubeSqlGenerator.generateSql(cube, List.of("country"), List.of("count"), "mysql");

		assertNotNull(sqlPostgres);
		assertNotNull(sqlMysql);

		// Both should produce valid SQL — dialect differences handled by jOOQ
		System.out.println("PostgreSQL:\n" + sqlPostgres);
		System.out.println("MySQL:\n" + sqlMysql);
	}

	@Test
	void testNoCubeTable() throws Exception {
		CubeOptions cube = new CubeOptions(); // empty — no sql_table
		String sql = CubeSqlGenerator.generateSql(cube, List.of("x"), List.of(), "postgres");
		assertTrue(sql.contains("No sql_table"));
	}

	// ── Auto-JOIN tests ──

	@Test
	void testAutoJoinDetection() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'public.orders'\n" +
				"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
				"  dimension { name 'customer_name'; sql 'customers.company_name'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  join { name 'customers'; sql '${CUBE}.customer_id = customers.id'; relationship 'many_to_one' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("customer_name"),
				List.of("count"),
				"postgres");

		assertTrue(sql.contains("JOIN"), "Should contain JOIN when cross-table dimension selected");
		assertTrue(sql.contains("customers"), "Should reference customers table");
		// ${CUBE} now expands to the dialect-quoted form ("public.orders" for Postgres which doesn't split on dot)
		assertTrue(sql.contains(".customer_id = customers.id"),
				"Should have JOIN ON clause with ${CUBE} replaced");
		assertFalse(sql.contains("${CUBE}"), "Should not contain ${CUBE} placeholder");

		System.out.println("Generated SQL (auto-JOIN):\n" + sql);
	}

	@Test
	void testAutoJoinNotAddedWhenNotReferenced() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
				"  dimension { name 'customer_name'; sql 'customers.company_name'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  join { name 'customers'; sql '${CUBE}.customer_id = customers.id'; relationship 'many_to_one' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		// Only select main-table dimension — no cross-table reference
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("status"),
				List.of("count"),
				"postgres");

		assertFalse(sql.contains("JOIN"), "Should NOT contain JOIN when only main-table dimensions selected");

		System.out.println("Generated SQL (no JOIN needed):\n" + sql);
	}

	// ── Segment WHERE clause tests ──

	@Test
	void testSegmentWhereClause() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  segment { name 'recent'; sql \"${CUBE}.created_at >= CURRENT_DATE - INTERVAL '30 days'\" }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("status"),
				List.of("count"),
				List.of("recent"),
				"postgres");

		assertTrue(sql.contains("WHERE"), "Should contain WHERE when segment selected");
		// ${CUBE} now expands to the dialect-quoted form (Postgres → "orders".created_at)
		assertTrue(sql.contains("\"orders\".created_at"), "Should have ${CUBE} replaced in segment SQL");
		assertFalse(sql.contains("${CUBE}"), "Should not contain ${CUBE} placeholder");

		System.out.println("Generated SQL (segment WHERE):\n" + sql);
	}

	@Test
	void testMultipleSegments() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  segment { name 'recent'; sql \"${CUBE}.created_at >= CURRENT_DATE - INTERVAL '30 days'\" }\n" +
				"  segment { name 'high_value'; sql '${CUBE}.amount > 1000' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("status"),
				List.of("count"),
				List.of("recent", "high_value"),
				"postgres");

		assertTrue(sql.contains("WHERE"), "Should contain WHERE");
		assertTrue(sql.contains("AND"), "Multiple segments should be AND-joined");

		System.out.println("Generated SQL (multiple segments):\n" + sql);
	}

	@Test
	void testNoSegmentsNoWhere() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'orders'\n" +
				"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  segment { name 'recent'; sql \"${CUBE}.created_at >= CURRENT_DATE - INTERVAL '30 days'\" }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		// Don't select any segments
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("status"),
				List.of("count"),
				List.of(),
				"postgres");

		assertFalse(sql.contains("WHERE"), "Should NOT contain WHERE when no segments selected");

		System.out.println("Generated SQL (no segments):\n" + sql);
	}

	@Test
	void testJoinPlusSegment() throws Exception {
		String dsl = "cube {\n" +
				"  sql_table 'public.orders'\n" +
				"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
				"  dimension { name 'country'; sql 'customers.country'; type 'string' }\n" +
				"  measure { name 'revenue'; sql 'amount'; type 'sum' }\n" +
				"  join { name 'customers'; sql '${CUBE}.customer_id = customers.id'; relationship 'many_to_one' }\n" +
				"  segment { name 'recent'; sql \"${CUBE}.created_at >= CURRENT_DATE - INTERVAL '30 days'\" }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("country"),
				List.of("revenue"),
				List.of("recent"),
				"postgres");

		assertTrue(sql.contains("JOIN"), "Should contain JOIN for cross-table dimension");
		assertTrue(sql.contains("WHERE"), "Should contain WHERE for segment");
		assertTrue(sql.toLowerCase().contains("sum("), "Should contain SUM aggregation");

		System.out.println("Generated SQL (JOIN + segment):\n" + sql);
	}

	// ── Phase 8.A: Transitive join resolution + jOOQ-quoted FROM/JOIN tests ──

	@Test
	void testTransitiveJoinResolution() throws Exception {
		// Cube source = Orders. Chain: Orders → "Order Details" → Products → Categories.
		// User picks ONE dimension from Categories (the deepest table). Expected: the
		// generator walks the parent chain and emits ALL three joins in dependency order.
		String dsl = "cube {\n" +
				"  sql_table 'Orders'\n" +
				"  dimension { name 'CategoryName'; sql 'Categories.CategoryName'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  join { name 'Order Details'; parent 'CUBE';          sql '${CUBE}.OrderID = \"Order Details\".OrderID'; relationship 'one_to_many' }\n" +
				"  join { name 'Products';      parent 'Order Details'; sql '\"Order Details\".ProductID = Products.ProductID'; relationship 'many_to_one' }\n" +
				"  join { name 'Categories';    parent 'Products';      sql 'Products.CategoryID = Categories.CategoryID'; relationship 'many_to_one' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("CategoryName"),
				List.of("count"),
				"sqlite");

		// All three joined tables must appear in the SQL — Order Details + Products + Categories
		assertTrue(sql.contains("\"Order Details\""), "Should JOIN \"Order Details\" (transitive ancestor)");
		assertTrue(sql.contains("Products"), "Should JOIN Products (transitive ancestor)");
		assertTrue(sql.contains("Categories"), "Should JOIN Categories (directly referenced)");

		// Verify the order: Order Details before Products before Categories
		int posOrderDetails = sql.indexOf("\"Order Details\"");
		int posProducts = sql.indexOf("JOIN Products") >= 0 ? sql.indexOf("JOIN Products") : sql.indexOf("\"Products\"");
		int posCategories = sql.indexOf("JOIN Categories") >= 0 ? sql.indexOf("JOIN Categories") : sql.indexOf("\"Categories\"");
		assertTrue(posOrderDetails > 0, "Order Details JOIN must be present");
		assertTrue(posProducts > posOrderDetails, "Products JOIN must come AFTER Order Details JOIN");
		assertTrue(posCategories > posProducts, "Categories JOIN must come AFTER Products JOIN");

		System.out.println("Generated SQL (transitive 3-level chain):\n" + sql);
	}

	@Test
	void testL1JoinUnchangedBackwardCompat() throws Exception {
		// Existing single-level cube WITHOUT the new `parent` field should work exactly
		// as before — `parent` defaults to 'CUBE' (L1 join from cube source).
		String dsl = "cube {\n" +
				"  sql_table 'Orders'\n" +
				"  dimension { name 'CustomerName'; sql 'Customers.CompanyName'; type 'string' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  join { name 'Customers'; sql '${CUBE}.CustomerID = Customers.CustomerID'; relationship 'many_to_one' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerName"),
				List.of("count"),
				"sqlite");

		assertTrue(sql.contains("Customers"), "Should JOIN Customers");
		assertTrue(sql.contains("JOIN"), "Should have JOIN clause");
		// Only ONE join should be present (no transitive chain)
		assertEquals(1, sql.split("JOIN ").length - 1, "Should have exactly one JOIN clause");

		System.out.println("Generated SQL (L1 backward compat):\n" + sql);
	}

	@Test
	void testJoinTableNameQuotedForSqlite() throws Exception {
		// SQLite requires double-quoting for spaced identifiers like "Order Details".
		// jOOQ's DSL.name() handles this for the FROM/JOIN clauses.
		String dsl = "cube {\n" +
				"  sql_table 'Orders'\n" +
				"  dimension { name 'Quantity'; sql '\"Order Details\".Quantity'; type 'number' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  join { name 'Order Details'; parent 'CUBE'; sql '${CUBE}.OrderID = \"Order Details\".OrderID'; relationship 'one_to_many' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("Quantity"),
				List.of("count"),
				"sqlite");

		// The FROM/JOIN clause must use the double-quoted form so SQLite parses
		// "Order Details" as a single identifier (not "Order" with alias "Details").
		assertTrue(sql.contains("\"Order Details\""), "Should double-quote spaced table name in JOIN clause");
		// Make sure we don't have unquoted "JOIN Order Details ON" (which SQLite would reject)
		assertFalse(sql.contains("JOIN Order Details "),
				"Should NOT contain unquoted 'JOIN Order Details' (SQLite would parse as table+alias)");

		System.out.println("Generated SQL (SQLite quoting for spaced table):\n" + sql);
	}

	@Test
	void testMultipleDimensionsFromSameDeepJoinNoDuplicates() throws Exception {
		// User picks 3 dimensions all reachable through the same chain.
		// Each intermediate join must appear exactly ONCE in the SQL, not duplicated per dimension.
		String dsl = "cube {\n" +
				"  sql_table 'Orders'\n" +
				"  dimension { name 'CategoryName'; sql 'Categories.CategoryName'; type 'string' }\n" +
				"  dimension { name 'ProductName'; sql 'Products.ProductName'; type 'string' }\n" +
				"  dimension { name 'Quantity'; sql '\"Order Details\".Quantity'; type 'number' }\n" +
				"  measure { name 'count'; type 'count' }\n" +
				"  join { name 'Order Details'; parent 'CUBE';          sql '${CUBE}.OrderID = \"Order Details\".OrderID'; relationship 'one_to_many' }\n" +
				"  join { name 'Products';      parent 'Order Details'; sql '\"Order Details\".ProductID = Products.ProductID'; relationship 'many_to_one' }\n" +
				"  join { name 'Categories';    parent 'Products';      sql 'Products.CategoryID = Categories.CategoryID'; relationship 'many_to_one' }\n" +
				"}";

		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("CategoryName", "ProductName", "Quantity"),
				List.of("count"),
				"sqlite");

		// Each table should appear in exactly ONE JOIN clause
		// "JOIN \"Order Details\"" should appear once (the join clause itself)
		int orderDetailsJoinCount = countOccurrences(sql, "JOIN \"Order Details\"");
		int productsJoinCount = countOccurrences(sql, "JOIN Products") + countOccurrences(sql, "JOIN \"Products\"");
		int categoriesJoinCount = countOccurrences(sql, "JOIN Categories") + countOccurrences(sql, "JOIN \"Categories\"");

		assertEquals(1, orderDetailsJoinCount, "Order Details should be JOINed exactly once");
		assertEquals(1, productsJoinCount, "Products should be JOINed exactly once");
		assertEquals(1, categoriesJoinCount, "Categories should be JOINed exactly once");

		System.out.println("Generated SQL (no duplicate joins):\n" + sql);
	}

	private static int countOccurrences(String haystack, String needle) {
		if (haystack == null || needle == null || needle.isEmpty()) return 0;
		int count = 0;
		int idx = 0;
		while ((idx = haystack.indexOf(needle, idx)) != -1) {
			count++;
			idx += needle.length();
		}
		return count;
	}

	// ── Phase 8.B: Smoke test for the bundled sample cube DSL files ─────────
	//
	// Parses each of the 5 sample cube DSL files from samples-cubes/ and
	// generates SQL for a representative dimension+measure combination.
	// This catches DSL syntax errors and ensures the cubes compile against
	// the actual Northwind schema before they ship.

	private static String SAMPLES_CUBES_DIR =
			"../../frend/reporting/testground/e2e/config/samples-cubes";

	private static String readCubeDsl(String folderName) throws Exception {
		File f = new File(SAMPLES_CUBES_DIR + "/" + folderName + "/" + folderName + "-cube-config.groovy");
		if (!f.exists()) {
			fail("Sample cube DSL file not found: " + f.getAbsolutePath());
		}
		return Files.readString(f.toPath());
	}

	@Test
	void testSampleCube_NorthwindSales_parsesAndGeneratesSql() throws Exception {
		String dsl = readCubeDsl("northwind-sales");
		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertNotNull(cube);
		assertEquals("Orders", cube.getSqlTable());
		assertNotNull(cube.getDimensions());
		assertNotNull(cube.getMeasures());
		assertNotNull(cube.getJoins());
		assertEquals(7, cube.getJoins().size(), "Sales cube should have 7 joins");

		// Test 1: pick a CategoryName (3-level transitive: Order Details → Products → Categories)
		String sql1 = CubeSqlGenerator.generateSql(cube,
				List.of("CategoryName"), List.of("Revenue"), "sqlite");
		assertNotNull(sql1);
		assertTrue(sql1.contains("JOIN \"Order Details\""), "Should JOIN \"Order Details\"");
		assertTrue(sql1.contains("JOIN Products"), "Should JOIN Products (transitive)");
		assertTrue(sql1.contains("JOIN Categories"), "Should JOIN Categories");

		// Test 2: pick a SupplierName (also 3-level: Order Details → Products → Suppliers)
		String sql2 = CubeSqlGenerator.generateSql(cube,
				List.of("SupplierName"), List.of("Revenue"), "sqlite");
		assertTrue(sql2.contains("JOIN \"Order Details\""));
		assertTrue(sql2.contains("JOIN Products"));
		assertTrue(sql2.contains("JOIN Suppliers"));

		// Test 3: pick a CustomerCompanyName (L1 join — Customers)
		String sql3 = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerCompanyName"), List.of("OrderCount"), "sqlite");
		assertTrue(sql3.contains("JOIN Customers"));
		assertFalse(sql3.contains("JOIN Products"), "Should NOT join Products when only Customer is selected");

		// Test 4: with segment
		String sql4 = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerCountry"), List.of("OrderCount"), List.of("unshipped"), "sqlite");
		assertTrue(sql4.contains("WHERE"));
		assertTrue(sql4.contains("ShippedDate IS NULL"));

		// Test 5: per-order browsing — pick OrderID + OrderDate + OrderValue → invoice ledger
		// OrderValue uses the same SQL as Revenue but is the semantically honest label
		// when grouping at order grain.
		String sql5 = CubeSqlGenerator.generateSql(cube,
				List.of("OrderID", "OrderDate"), List.of("OrderValue"), "sqlite");
		assertTrue(sql5.contains("JOIN \"Order Details\""), "Per-order: should join Order Details for the line totals");
		assertTrue(sql5.toLowerCase().contains("group by"), "Per-order: should GROUP BY");

		System.out.println("[northwind-sales] All 5 SQL gen tests passed");
	}

	@Test
	void testSampleCube_NorthwindInventory_parsesAndGeneratesSql() throws Exception {
		String dsl = readCubeDsl("northwind-inventory");
		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("Products", cube.getSqlTable());
		assertEquals(2, cube.getJoins().size(), "Inventory cube should have 2 joins");

		// Pick CategoryName + SupplierCountry → both joins activated
		String sql = CubeSqlGenerator.generateSql(cube,
				List.of("CategoryName", "SupplierCountry"),
				List.of("AvgUnitPrice"),
				List.of("active"),
				"sqlite");
		assertTrue(sql.contains("JOIN Categories"));
		assertTrue(sql.contains("JOIN Suppliers"));
		assertTrue(sql.contains("WHERE"));
		assertTrue(sql.contains("Discontinued = 0"));

		System.out.println("[northwind-inventory] SQL gen passed");
	}

	@Test
	void testSampleCube_NorthwindCustomers_parsesAndGeneratesSql() throws Exception {
		String dsl = readCubeDsl("northwind-customers");
		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("Customers", cube.getSqlTable());
		assertEquals(2, cube.getJoins().size(), "Customer cube should have 2 joins (Orders + Order Details for revenue)");

		// Test 1: customer-only query (no join needed)
		String sql1 = CubeSqlGenerator.generateSql(cube,
				List.of("Country"), List.of("CustomerCount"), "sqlite");
		assertFalse(sql1.contains("JOIN"), "Should NOT have JOIN when only Customers fields selected");

		// Test 2: L1 join-activated by selecting Orders measure (no Order Details)
		String sql2 = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerCompanyName"), List.of("OrderCount"), "sqlite");
		assertTrue(sql2.contains("JOIN Orders"));
		assertFalse(sql2.contains("JOIN \"Order Details\""), "Should NOT join Order Details when only Orders fields selected");

		// Test 3: decision_makers segment
		String sql3 = CubeSqlGenerator.generateSql(cube,
				List.of("ContactTitle"),
				List.of("CustomerCount"),
				List.of("decision_makers"),
				"sqlite");
		assertTrue(sql3.contains("WHERE"));
		assertTrue(sql3.contains("ContactTitle LIKE"));

		// Test 4: L2 transitive join — CustomerLifetimeValue requires Customers → Orders → Order Details
		// THE entire point of CRM analysis: "who are our biggest customers by revenue"
		String sql4 = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerCompanyName"), List.of("CustomerLifetimeValue"), "sqlite");
		assertTrue(sql4.contains("JOIN Orders"), "L2: should join Orders (transitive)");
		assertTrue(sql4.contains("JOIN \"Order Details\""), "L2: should join Order Details");
		assertTrue(sql4.toLowerCase().contains("sum("), "Should aggregate revenue");

		// Test 5: AvgOrderValue also goes through L2 chain
		String sql5 = CubeSqlGenerator.generateSql(cube,
				List.of("Country"), List.of("AvgOrderValue"), "sqlite");
		assertTrue(sql5.contains("JOIN Orders"));
		assertTrue(sql5.contains("JOIN \"Order Details\""));

		// Test 6: shipped_orders segment + Orders.ShippedDate
		String sql6 = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerCompanyName"),
				List.of("OrderCount"),
				List.of("unshipped_orders"),
				"sqlite");
		assertTrue(sql6.contains("JOIN Orders"));
		assertTrue(sql6.contains("WHERE"));
		assertTrue(sql6.contains("ShippedDate IS NULL"));

		// Test 7: per-order browsing — pick OrderID + OrderDate + OrderValue → invoice ledger view
		// OrderValue uses the same SQL as CustomerLifetimeValue but is the semantically honest
		// label when grouping at order grain.
		String sql7 = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerCompanyName", "OrderID", "OrderDate"),
				List.of("OrderValue"), "sqlite");
		assertTrue(sql7.contains("JOIN Orders"), "Per-order browsing: should join Orders");
		assertTrue(sql7.contains("JOIN \"Order Details\""), "Per-order browsing: should join Order Details");
		assertTrue(sql7.contains("Orders.OrderID"), "Per-order browsing: should select Orders.OrderID");
		assertTrue(sql7.toLowerCase().contains("group by"), "Per-order browsing: should GROUP BY");

		System.out.println("[northwind-customers] All 7 SQL gen tests passed (CLV + OrderValue grain split)");
	}

	@Test
	void testSampleCube_NorthwindHr_parsesAndGeneratesSql() throws Exception {
		String dsl = readCubeDsl("northwind-hr");
		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("Employees", cube.getSqlTable());
		assertEquals(3, cube.getJoins().size(), "HR cube should have 3 joins (3-level chain)");

		// Test 1: simple Employees-only query
		String sql1 = CubeSqlGenerator.generateSql(cube,
				List.of("Country"), List.of("EmployeeCount"), "sqlite");
		assertFalse(sql1.contains("JOIN"), "Should NOT have JOIN when only Employees fields selected");

		// Test 2: L2 join — TerritoryDescription requires EmployeeTerritories + Territories
		String sql2 = CubeSqlGenerator.generateSql(cube,
				List.of("TerritoryDescription"), List.of("EmployeeCount"), "sqlite");
		assertTrue(sql2.contains("JOIN EmployeeTerritories"), "L2: should join EmployeeTerritories");
		assertTrue(sql2.contains("JOIN Territories"), "L2: should join Territories");
		assertFalse(sql2.contains("JOIN Region"), "Should NOT join Region for L2-only query");

		// Test 3: L3 join — RegionDescription requires the FULL 3-level chain
		// (EmployeeTerritories → Territories → Region)
		String sql3 = CubeSqlGenerator.generateSql(cube,
				List.of("RegionDescription"), List.of("EmployeeCount"), "sqlite");
		assertTrue(sql3.contains("JOIN EmployeeTerritories"), "L3: should join EmployeeTerritories (transitive)");
		assertTrue(sql3.contains("JOIN Territories"), "L3: should join Territories (transitive)");
		assertTrue(sql3.contains("JOIN Region"), "L3: should join Region");

		// Test 4: executives segment
		String sql4 = CubeSqlGenerator.generateSql(cube,
				List.of("Title"), List.of("EmployeeCount"), List.of("executives"), "sqlite");
		assertTrue(sql4.contains("WHERE"));
		assertTrue(sql4.contains("ReportsTo IS NULL"));

		System.out.println("[northwind-hr] All 4 SQL gen tests passed (including L3 transitive chain)");
	}

	@Test
	void testSampleCube_NorthwindWarehouse_parsesAndGeneratesSql() throws Exception {
		String dsl = readCubeDsl("northwind-warehouse");
		CubeOptions cube = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("vw_sales_detail", cube.getSqlTable());
		assertTrue(cube.getJoins() == null || cube.getJoins().isEmpty(),
				"Warehouse cube should have no joins (denormalized view)");

		// Test 1: replicate the existing Sales PivotTable sample (sample 19)
		// Rows = customer_country + category_name, vals = net_revenue
		String sql1 = CubeSqlGenerator.generateSql(cube,
				List.of("CustomerCountry", "CategoryName"),
				List.of("NetRevenue"),
				"duckdb");
		assertNotNull(sql1);
		assertFalse(sql1.contains("JOIN"), "Should be a flat SELECT — no joins");
		assertTrue(sql1.toLowerCase().contains("sum("), "Should aggregate net_revenue");
		assertTrue(sql1.toLowerCase().contains("group by"), "Should GROUP BY dimensions");

		// Test 2: time + segment
		String sql2 = CubeSqlGenerator.generateSql(cube,
				List.of("Year", "MonthName"),
				List.of("NetRevenue"),
				List.of("north_america"),
				"duckdb");
		assertTrue(sql2.contains("WHERE"));
		assertTrue(sql2.contains("North America"));

		System.out.println("[northwind-warehouse] All 2 SQL gen tests passed");
	}
}
