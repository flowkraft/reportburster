package com.flowkraft.reporting.dsl;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.flowkraft.reporting.dsl.cube.CubeOptions;
import com.flowkraft.reporting.dsl.cube.CubeOptionsParser;

/**
 * Business use-case tests for the Cube Groovy DSL.
 *
 * Each test is a real-world scenario that a DataPallas user would configure
 * in their {reportCode}-cube-config.groovy file:
 *
 *   GETTING STARTED — first cubes a new user creates
 *     #1   CRM Customer List             — simplest useful cube
 *     #2   E-Commerce Revenue Dashboard  — KPI measures with drill-down
 *     #3   Completed Orders Report       — custom SQL + filtered measures
 *
 *   JOINS — connecting related tables
 *     #4   Customer 360 with Order Stats — sub_query dimension for nested aggregation
 *     #5   Product Sales Star Schema     — fact table joining two dimension tables
 *
 *   RICH DIMENSIONS — beyond simple columns
 *     #6   Clothing Store Size Labels    — case_ for conditional value mapping
 *     #7   Delivery Fleet Tracker        — geo dimensions for map visualization
 *     #8   Retail Chain Store Locator    — hierarchies for geographic drill-down
 *
 *   GOVERNANCE & REUSE
 *     #9   Finance Internal Staging Cube — hidden cube with sql_alias
 *     #10  Regional Orders (extends)     — inherit from base cube
 *
 *   MULTI-CUBE & KITCHEN SINK
 *     #11  Multi-Department Dashboard    — two named cubes in one config
 *     #12  Sales Pipeline Full Model     — every feature combined
 *     #13  Empty Config Fallback         — graceful defaults
 */
public class CubeOptionsParserTest {

	// ═════════════════════════════════════════════════════════════════════════════
	// GETTING STARTED — First cubes a new user would create
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #1  CRM Customer List
	//     A sales rep wants to explore their customer table — just list who's in
	//     the database with name, country, and a count. The simplest useful cube.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCrmCustomerList() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'public.customers'\n" +
			"  title 'Customers'\n" +
			"  description 'All registered customers'\n" +
			"\n" +
			"  dimension { name 'customer_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'name'; sql 'name'; type 'string' }\n" +
			"  dimension { name 'country'; sql 'country'; type 'string'; order 'asc' }\n" +
			"\n" +
			"  measure { name 'count'; type 'count' }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("public.customers", result.getSqlTable());
		assertEquals("Customers", result.getTitle());
		assertEquals("All registered customers", result.getDescription());

		List<Map<String, Object>> dims = result.getDimensions();
		assertEquals(3, dims.size());
		assertEquals(true, dims.get(0).get("primary_key"));
		assertEquals("string", dims.get(1).get("type"));
		// Default sort on country dimension
		assertEquals("asc", dims.get(2).get("order"));

		assertEquals(1, result.getMeasures().size());
		assertEquals("count", result.getMeasures().get(0).get("type"));

		assertTrue(result.getJoins().isEmpty());
		assertTrue(result.getSegments().isEmpty());
		assertTrue(result.getHierarchies().isEmpty());
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #2  E-Commerce Revenue Dashboard
	//     The dashboard every online store has: how many orders, total revenue,
	//     average order value. The count measure has drill_members so the user
	//     can click on the number and see the underlying orders.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	@SuppressWarnings("unchecked")
	public void testEcommerceRevenueDashboard() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'public.orders'\n" +
			"  title 'Orders'\n" +
			"  meta icon: 'shopping-cart', category: 'sales'\n" +
			"\n" +
			"  dimension { name 'order_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
			"  dimension { name 'created_at'; sql 'created_at'; type 'time'; order 'desc' }\n" +
			"\n" +
			"  measure {\n" +
			"    name 'total_orders'; type 'count'\n" +
			"    drill_members 'order_id', 'status', 'created_at'\n" +
			"  }\n" +
			"  measure { name 'revenue'; sql 'amount'; type 'sum'; format 'currency' }\n" +
			"  measure { name 'avg_order_value'; sql 'amount'; type 'avg'; format 'currency' }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("Orders", result.getTitle());
		assertEquals("shopping-cart", result.getMeta().get("icon"));

		// Time dimension with default sort descending (newest first)
		assertEquals("desc", result.getDimensions().get(2).get("order"));

		// Drill-down on count measure — click to see underlying orders
		List<Map<String, Object>> meas = result.getMeasures();
		assertEquals(3, meas.size());
		List<String> drillMembers = (List<String>) meas.get(0).get("drill_members");
		assertNotNull(drillMembers);
		assertEquals(3, drillMembers.size());
		assertEquals("order_id", drillMembers.get(0));
		assertEquals("status", drillMembers.get(1));
		assertEquals("created_at", drillMembers.get(2));

		// Revenue measures with currency format
		assertEquals("currency", meas.get(1).get("format"));
		assertEquals("avg", meas.get(2).get("type"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #3  Completed Orders Report
	//     Accounting needs total orders AND completed orders side by side.
	//     The completed_count measure uses a filter — only counts rows where
	//     status = 'completed'. This is the most common measure filter pattern.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	@SuppressWarnings("unchecked")
	public void testCompletedOrdersFilteredKpis() throws Exception {
		String dsl = "cube {\n" +
			"  sql 'SELECT * FROM orders WHERE created_at >= \\'2024-01-01\\''\n" +
			"  title 'Orders 2024+'\n" +
			"\n" +
			"  dimension { name 'order_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
			"  dimension { name 'created_at'; sql 'created_at'; type 'time' }\n" +
			"\n" +
			"  measure { name 'total_orders'; type 'count' }\n" +
			"  measure {\n" +
			"    name 'completed_count'\n" +
			"    type 'count'\n" +
			"    sql 'id'\n" +
			"    filters {\n" +
			"      filter sql: \"${CUBE}.status = 'completed'\"\n" +
			"    }\n" +
			"  }\n" +
			"  measure {\n" +
			"    name 'high_value_revenue'\n" +
			"    type 'sum'\n" +
			"    sql 'amount'\n" +
			"    format 'currency'\n" +
			"    filters {\n" +
			"      filter sql: '${CUBE}.amount > 500'\n" +
			"    }\n" +
			"  }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertNull(result.getSqlTable());
		assertTrue(result.getSql().contains("2024-01-01"));
		assertEquals("Orders 2024+", result.getTitle());

		List<Map<String, Object>> meas = result.getMeasures();
		assertEquals(3, meas.size());

		// Unfiltered total
		assertEquals("total_orders", meas.get(0).get("name"));
		assertNull(meas.get(0).get("filters"));

		// Filtered: only completed
		assertEquals("completed_count", meas.get(1).get("name"));
		List<Map<String, Object>> filters1 = (List<Map<String, Object>>) meas.get(1).get("filters");
		assertNotNull(filters1);
		assertEquals(1, filters1.size());
		assertTrue(((String) filters1.get(0).get("sql")).contains("completed"));

		// Filtered: only high-value
		List<Map<String, Object>> filters2 = (List<Map<String, Object>>) meas.get(2).get("filters");
		assertEquals(1, filters2.size());
		assertTrue(((String) filters2.get(0).get("sql")).contains("500"));
		assertEquals("currency", meas.get(2).get("format"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// JOINS — Connecting related tables
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #4  Customer 360 with Order Stats
	//     Support team wants each customer with their order count displayed as
	//     a dimension (not a measure). The sub_query dimension pulls the count
	//     from the orders cube — enabling "avg orders per customer" in pivots.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCustomer360WithOrderStats() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'public.customers'\n" +
			"  title 'Customer 360'\n" +
			"  description 'Customer profiles with order history'\n" +
			"\n" +
			"  dimension { name 'customer_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'name'; sql 'name'; type 'string' }\n" +
			"  dimension { name 'email'; sql 'email'; type 'string' }\n" +
			"  dimension { name 'signed_up_at'; sql 'created_at'; type 'time' }\n" +
			"  dimension {\n" +
			"    name 'order_count'\n" +
			"    sql '${orders.count}'\n" +
			"    type 'number'\n" +
			"    sub_query true\n" +
			"    description 'Total orders placed by this customer'\n" +
			"  }\n" +
			"\n" +
			"  measure { name 'count'; type 'count' }\n" +
			"\n" +
			"  join {\n" +
			"    name 'orders'\n" +
			"    sql '${CUBE}.id = orders.customer_id'\n" +
			"    relationship 'one_to_many'\n" +
			"  }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("Customer 360", result.getTitle());

		// Sub-query dimension: order count as a customer attribute
		Map<String, Object> orderCountDim = result.getDimensions().get(4);
		assertEquals("order_count", orderCountDim.get("name"));
		assertEquals("number", orderCountDim.get("type"));
		assertEquals(true, orderCountDim.get("sub_query"));
		assertTrue(((String) orderCountDim.get("sql")).contains("orders.count"));

		// Join
		assertEquals(1, result.getJoins().size());
		assertEquals("one_to_many", result.getJoins().get(0).get("relationship"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #5  Product Sales Star Schema
	//     Product manager wants revenue per product. The order_items fact table
	//     joins to both orders and products. All six standard measure types.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	@SuppressWarnings("unchecked")
	public void testProductSalesStarSchema() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'public.order_items'\n" +
			"  title 'Product Sales'\n" +
			"\n" +
			"  dimension { name 'id'; sql 'id'; type 'number'; primary_key true }\n" +
			"\n" +
			"  measure {\n" +
			"    name 'items_sold'; type 'count'\n" +
			"    drill_members 'id'\n" +
			"  }\n" +
			"  measure { name 'revenue'; sql 'quantity * unit_price'; type 'sum'; format 'currency' }\n" +
			"  measure { name 'unique_products'; sql 'product_id'; type 'count_distinct' }\n" +
			"  measure { name 'avg_unit_price'; sql 'unit_price'; type 'avg' }\n" +
			"  measure { name 'cheapest_item'; sql 'unit_price'; type 'min' }\n" +
			"  measure { name 'most_expensive'; sql 'unit_price'; type 'max' }\n" +
			"\n" +
			"  join {\n" +
			"    name 'orders'\n" +
			"    sql '${CUBE}.order_id = orders.id'\n" +
			"    relationship 'many_to_one'\n" +
			"  }\n" +
			"  join {\n" +
			"    name 'products'\n" +
			"    sql '${CUBE}.product_id = products.id'\n" +
			"    relationship 'many_to_one'\n" +
			"  }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		// Computed SQL in measure
		assertEquals("quantity * unit_price", result.getMeasures().get(1).get("sql"));

		// All six measure types
		List<Map<String, Object>> meas = result.getMeasures();
		assertEquals(6, meas.size());
		assertEquals("count", meas.get(0).get("type"));
		assertEquals("sum", meas.get(1).get("type"));
		assertEquals("count_distinct", meas.get(2).get("type"));
		assertEquals("avg", meas.get(3).get("type"));
		assertEquals("min", meas.get(4).get("type"));
		assertEquals("max", meas.get(5).get("type"));

		// Drill-down on items_sold
		List<String> drill = (List<String>) meas.get(0).get("drill_members");
		assertEquals(1, drill.size());
		assertEquals("id", drill.get(0));

		// Two joins
		assertEquals(2, result.getJoins().size());
		for (Map<String, Object> j : result.getJoins()) {
			assertEquals("many_to_one", j.get("relationship"));
		}
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// RICH DIMENSIONS — Beyond simple columns
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #6  Clothing Store Size Labels
	//     The database stores sizes as codes ('xs', 'sm', 'md', 'lg', 'xl').
	//     The report needs human-readable labels. The case_ dimension maps
	//     raw codes to display names — no SQL CASE statement needed in the query.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	@SuppressWarnings("unchecked")
	public void testClothingStoreSizeLabels() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'retail.products'\n" +
			"  title 'Product Catalog'\n" +
			"\n" +
			"  dimension { name 'product_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'name'; sql 'name'; type 'string' }\n" +
			"  dimension {\n" +
			"    name 'size_label'\n" +
			"    type 'string'\n" +
			"    case_ {\n" +
			"      when sql: \"${CUBE}.size_code = 'xs'\", label: 'Extra Small'\n" +
			"      when sql: \"${CUBE}.size_code = 'sm'\", label: 'Small'\n" +
			"      when sql: \"${CUBE}.size_code = 'md'\", label: 'Medium'\n" +
			"      when sql: \"${CUBE}.size_code = 'lg'\", label: 'Large'\n" +
			"      when sql: \"${CUBE}.size_code = 'xl'\", label: 'Extra Large'\n" +
			"      else_ label: 'Unknown'\n" +
			"    }\n" +
			"  }\n" +
			"  dimension {\n" +
			"    name 'price_tier'\n" +
			"    type 'string'\n" +
			"    case_ {\n" +
			"      when sql: '${CUBE}.price < 25', label: 'Budget'\n" +
			"      when sql: '${CUBE}.price < 100', label: 'Mid-Range'\n" +
			"      when sql: '${CUBE}.price >= 100', label: 'Premium'\n" +
			"    }\n" +
			"  }\n" +
			"\n" +
			"  measure { name 'product_count'; type 'count' }\n" +
			"  measure { name 'avg_price'; sql 'price'; type 'avg'; format 'currency' }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		// Size label dimension with case_
		Map<String, Object> sizeDim = result.getDimensions().get(2);
		assertEquals("size_label", sizeDim.get("name"));
		Map<String, Object> sizeCase = (Map<String, Object>) sizeDim.get("case");
		assertNotNull(sizeCase);

		List<Map<String, Object>> sizeWhens = (List<Map<String, Object>>) sizeCase.get("when");
		assertEquals(5, sizeWhens.size());
		assertTrue(((String) sizeWhens.get(0).get("sql")).contains("xs"));
		assertEquals("Extra Small", sizeWhens.get(0).get("label"));
		assertEquals("Extra Large", sizeWhens.get(4).get("label"));

		Map<String, Object> sizeElse = (Map<String, Object>) sizeCase.get("else");
		assertEquals("Unknown", sizeElse.get("label"));

		// Price tier dimension — case_ without else
		Map<String, Object> priceDim = result.getDimensions().get(3);
		Map<String, Object> priceCase = (Map<String, Object>) priceDim.get("case");
		List<Map<String, Object>> priceWhens = (List<Map<String, Object>>) priceCase.get("when");
		assertEquals(3, priceWhens.size());
		assertEquals("Budget", priceWhens.get(0).get("label"));
		assertEquals("Premium", priceWhens.get(2).get("label"));
		assertNull(priceCase.get("else")); // no else clause
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #7  Delivery Fleet Tracker
	//     Logistics team needs to see delivery trucks on a map. The geo dimension
	//     type combines latitude and longitude into a single plottable field.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	@SuppressWarnings("unchecked")
	public void testDeliveryFleetTracker() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'logistics.deliveries'\n" +
			"  title 'Delivery Fleet'\n" +
			"\n" +
			"  dimension { name 'delivery_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'driver_name'; sql 'driver'; type 'string' }\n" +
			"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
			"  dimension {\n" +
			"    name 'current_location'\n" +
			"    type 'geo'\n" +
			"    latitude { sql '${CUBE}.lat' }\n" +
			"    longitude { sql '${CUBE}.lng' }\n" +
			"  }\n" +
			"  dimension {\n" +
			"    name 'destination'\n" +
			"    type 'geo'\n" +
			"    latitude { sql '${CUBE}.dest_lat' }\n" +
			"    longitude { sql '${CUBE}.dest_lng' }\n" +
			"  }\n" +
			"\n" +
			"  measure { name 'active_deliveries'; type 'count' }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("Delivery Fleet", result.getTitle());

		// Current location — geo dimension with lat/lng
		Map<String, Object> location = result.getDimensions().get(3);
		assertEquals("current_location", location.get("name"));
		assertEquals("geo", location.get("type"));
		Map<String, Object> lat = (Map<String, Object>) location.get("latitude");
		Map<String, Object> lng = (Map<String, Object>) location.get("longitude");
		assertNotNull(lat);
		assertNotNull(lng);
		assertEquals("${CUBE}.lat", lat.get("sql"));
		assertEquals("${CUBE}.lng", lng.get("sql"));

		// Destination — second geo dimension
		Map<String, Object> dest = result.getDimensions().get(4);
		assertEquals("geo", dest.get("type"));
		Map<String, Object> destLat = (Map<String, Object>) dest.get("latitude");
		assertEquals("${CUBE}.dest_lat", destLat.get("sql"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #8  Retail Chain Store Locator
	//     Operations team needs to drill down: Country → Region → City to find
	//     stores. Segments provide quick filters for new vs established stores.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	@SuppressWarnings("unchecked")
	public void testRetailChainStoreLocator() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'public.stores'\n" +
			"  title 'Store Directory'\n" +
			"\n" +
			"  dimension { name 'store_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'store_name'; sql 'name'; type 'string' }\n" +
			"  dimension { name 'country'; sql 'country'; type 'string' }\n" +
			"  dimension { name 'region'; sql 'region'; type 'string' }\n" +
			"  dimension { name 'city'; sql 'city'; type 'string' }\n" +
			"  dimension {\n" +
			"    name 'opened_at'; sql 'opened_at'; type 'time'\n" +
			"    title 'Opening Date'\n" +
			"    description 'Date the store first opened'\n" +
			"  }\n" +
			"\n" +
			"  measure { name 'store_count'; type 'count' }\n" +
			"\n" +
			"  segment {\n" +
			"    name 'new_stores'\n" +
			"    sql \"${CUBE}.opened_at >= CURRENT_DATE - INTERVAL '1 year'\"\n" +
			"    description 'Opened within the last year'\n" +
			"  }\n" +
			"\n" +
			"  hierarchy {\n" +
			"    name 'geography'\n" +
			"    title 'Location'\n" +
			"    levels 'country', 'region', 'city'\n" +
			"  }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		// Dimension with extra metadata
		Map<String, Object> openedDim = result.getDimensions().get(5);
		assertEquals("Opening Date", openedDim.get("title"));
		assertEquals("Date the store first opened", openedDim.get("description"));

		// Segment
		assertEquals(1, result.getSegments().size());
		assertEquals("new_stores", result.getSegments().get(0).get("name"));
		assertEquals("Opened within the last year", result.getSegments().get(0).get("description"));

		// Hierarchy
		assertEquals(1, result.getHierarchies().size());
		List<String> levels = (List<String>) result.getHierarchies().get(0).get("levels");
		assertEquals(3, levels.size());
		assertEquals("country", levels.get(0));
		assertEquals("region", levels.get(1));
		assertEquals("city", levels.get(2));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// GOVERNANCE & REUSE
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #9  Finance Internal Staging Cube
	//     The finance team has a staging table for reconciliation. Hidden from
	//     the dashboard picker (public_ false) but joinable from other cubes.
	//     Uses sql_alias because the table name exceeds Postgres' 63-char limit.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testFinanceInternalStagingCube() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'finance.staging_quarterly_reconciliation_transactions_v2'\n" +
			"  sql_alias 'fin_recon'\n" +
			"  title 'Reconciliation (staging)'\n" +
			"  public_ false\n" +
			"\n" +
			"  dimension { name 'txn_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'account'; sql 'gl_account'; type 'string' }\n" +
			"  dimension { name 'posted_at'; sql 'posted_at'; type 'time' }\n" +
			"\n" +
			"  measure { name 'count'; type 'count' }\n" +
			"  measure { name 'net_amount'; sql 'debit - credit'; type 'sum'; format 'currency' }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		assertEquals("fin_recon", result.getSqlAlias());
		assertEquals(false, result.getPublic_());
		assertEquals("Reconciliation (staging)", result.getTitle());
		assertEquals("debit - credit", result.getMeasures().get(1).get("sql"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #10  Regional Orders (extends base)
	//     The company has orders_us and orders_eu tables with identical structure.
	//     A base cube defines the common dimensions/measures, then each regional
	//     cube extends it and only overrides the table name. DRY principle.
	//     (Actual inheritance resolution happens in the backend, not the parser —
	//     the parser just captures the extends_ reference as a string.)
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testRegionalOrdersExtends() throws Exception {
		String dsl = "cube('base_orders') {\n" +
			"  sql_table 'public.orders'\n" +
			"  dimension { name 'order_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'status'; sql 'status'; type 'string' }\n" +
			"  dimension { name 'created_at'; sql 'created_at'; type 'time' }\n" +
			"  measure { name 'count'; type 'count' }\n" +
			"  measure { name 'revenue'; sql 'amount'; type 'sum'; format 'currency' }\n" +
			"}\n" +
			"cube('orders_us') {\n" +
			"  extends_ 'base_orders'\n" +
			"  sql_table 'public.orders_us'\n" +
			"  dimension { name 'us_state'; sql 'state'; type 'string' }\n" +
			"}\n" +
			"cube('orders_eu') {\n" +
			"  extends_ 'base_orders'\n" +
			"  sql_table 'public.orders_eu'\n" +
			"  dimension { name 'eu_country'; sql 'country'; type 'string' }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		Map<String, CubeOptions> named = result.getNamedOptions();
		assertEquals(3, named.size());

		// Base cube — no extends
		CubeOptions base = named.get("base_orders");
		assertNotNull(base);
		assertNull(base.getExtends_());
		assertEquals("public.orders", base.getSqlTable());
		assertEquals(3, base.getDimensions().size());
		assertEquals(2, base.getMeasures().size());

		// US cube — extends base, adds state dimension
		CubeOptions us = named.get("orders_us");
		assertNotNull(us);
		assertEquals("base_orders", us.getExtends_());
		assertEquals("public.orders_us", us.getSqlTable());
		assertEquals(1, us.getDimensions().size());
		assertEquals("us_state", us.getDimensions().get(0).get("name"));

		// EU cube — extends base, adds country dimension
		CubeOptions eu = named.get("orders_eu");
		assertEquals("base_orders", eu.getExtends_());
		assertEquals("public.orders_eu", eu.getSqlTable());
		assertEquals("eu_country", eu.getDimensions().get(0).get("name"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// MULTI-CUBE & KITCHEN SINK
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #11  Multi-Department Dashboard
	//     The CEO's dashboard shows HR headcount alongside Sales revenue.
	//     Two named cubes in one config file — one for each department.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMultiDepartmentDashboard() throws Exception {
		String dsl = "cube('hr_headcount') {\n" +
			"  sql_table 'hr.employees'\n" +
			"  title 'Headcount'\n" +
			"  dimension { name 'emp_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'department'; sql 'department'; type 'string' }\n" +
			"  dimension { name 'hire_date'; sql 'hire_date'; type 'time' }\n" +
			"  measure { name 'headcount'; type 'count' }\n" +
			"}\n" +
			"cube('sales_revenue') {\n" +
			"  sql_table 'sales.orders'\n" +
			"  title 'Revenue'\n" +
			"  dimension { name 'order_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"  dimension { name 'region'; sql 'region'; type 'string' }\n" +
			"  measure { name 'total_orders'; type 'count' }\n" +
			"  measure { name 'revenue'; sql 'amount'; type 'sum'; format 'currency' }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		// Unnamed default is empty
		assertNull(result.getSqlTable());

		Map<String, CubeOptions> named = result.getNamedOptions();
		assertEquals(2, named.size());

		CubeOptions hr = named.get("hr_headcount");
		assertEquals("hr.employees", hr.getSqlTable());
		assertEquals("Headcount", hr.getTitle());
		assertEquals("time", hr.getDimensions().get(2).get("type"));

		CubeOptions sales = named.get("sales_revenue");
		assertEquals("Revenue", sales.getTitle());
		assertEquals("currency", sales.getMeasures().get(1).get("format"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #12  Sales Pipeline Full Model
	//     A complete, realistic cube that a BI analyst would build: the sales
	//     fact table with every feature — metadata, KPI measures with drill-down
	//     and filters, joins, segments, hierarchy, and a geo dimension.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	@SuppressWarnings("unchecked")
	public void testSalesPipelineFullModel() throws Exception {
		String dsl = "cube {\n" +
			"  sql_table 'public.sales'\n" +
			"  sql_alias 'sales'\n" +
			"  title 'Sales Transactions'\n" +
			"  description 'Point-of-sale transactions across all channels'\n" +
			"  public_ true\n" +
			"  meta icon: 'dollar-sign', color: '#28a745', priority: 1\n" +
			"\n" +
			"  // Primary key\n" +
			"  dimension { name 'sale_id'; sql 'id'; type 'number'; primary_key true }\n" +
			"\n" +
			"  // Categorical\n" +
			"  dimension { name 'channel'; sql 'sales_channel'; type 'string'; title 'Sales Channel' }\n" +
			"  dimension { name 'country'; sql 'country'; type 'string' }\n" +
			"  dimension { name 'region'; sql 'region'; type 'string' }\n" +
			"  dimension { name 'city'; sql 'city'; type 'string' }\n" +
			"\n" +
			"  // Conditional — map channel codes to labels\n" +
			"  dimension {\n" +
			"    name 'channel_label'\n" +
			"    type 'string'\n" +
			"    case_ {\n" +
			"      when sql: \"${CUBE}.sales_channel = 'web'\", label: 'Website'\n" +
			"      when sql: \"${CUBE}.sales_channel = 'pos'\", label: 'In-Store'\n" +
			"      else_ label: 'Other'\n" +
			"    }\n" +
			"  }\n" +
			"\n" +
			"  // Time\n" +
			"  dimension { name 'sold_at'; sql 'sold_at'; type 'time'; order 'desc' }\n" +
			"\n" +
			"  // Geo — for map visualization\n" +
			"  dimension {\n" +
			"    name 'store_location'\n" +
			"    type 'geo'\n" +
			"    latitude { sql '${CUBE}.store_lat' }\n" +
			"    longitude { sql '${CUBE}.store_lng' }\n" +
			"  }\n" +
			"\n" +
			"  // KPI measures with drill-down\n" +
			"  measure {\n" +
			"    name 'total_transactions'; type 'count'\n" +
			"    drill_members 'sale_id', 'channel', 'sold_at'\n" +
			"  }\n" +
			"  measure { name 'revenue'; sql 'revenue'; type 'sum'; format 'currency' }\n" +
			"  measure { name 'avg_sale'; sql 'revenue'; type 'avg'; format 'currency' }\n" +
			"\n" +
			"  // Filtered measure — only online revenue\n" +
			"  measure {\n" +
			"    name 'online_revenue'\n" +
			"    sql 'revenue'\n" +
			"    type 'sum'\n" +
			"    format 'currency'\n" +
			"    filters {\n" +
			"      filter sql: \"${CUBE}.sales_channel = 'web'\"\n" +
			"    }\n" +
			"  }\n" +
			"\n" +
			"  // Star schema joins\n" +
			"  join {\n" +
			"    name 'customers'\n" +
			"    sql '${CUBE}.customer_id = customers.id'\n" +
			"    relationship 'many_to_one'\n" +
			"  }\n" +
			"  join {\n" +
			"    name 'products'\n" +
			"    sql '${CUBE}.product_id = products.id'\n" +
			"    relationship 'many_to_one'\n" +
			"  }\n" +
			"\n" +
			"  // Quick filters\n" +
			"  segment {\n" +
			"    name 'high_value'\n" +
			"    sql '${CUBE}.revenue > 1000'\n" +
			"    description 'Transactions above $1,000'\n" +
			"  }\n" +
			"  segment {\n" +
			"    name 'last_30_days'\n" +
			"    sql \"${CUBE}.sold_at >= CURRENT_DATE - INTERVAL '30 days'\"\n" +
			"  }\n" +
			"\n" +
			"  // Drill-down\n" +
			"  hierarchy {\n" +
			"    name 'geography'\n" +
			"    title 'Geography'\n" +
			"    levels 'country', 'region', 'city'\n" +
			"  }\n" +
			"}";

		CubeOptions result = CubeOptionsParser.parseGroovyCubeDslCode(dsl);

		// ── Cube-level metadata ──
		assertEquals("public.sales", result.getSqlTable());
		assertEquals("sales", result.getSqlAlias());
		assertEquals("Sales Transactions", result.getTitle());
		assertEquals("Point-of-sale transactions across all channels", result.getDescription());
		assertEquals(true, result.getPublic_());
		assertEquals("dollar-sign", result.getMeta().get("icon"));
		assertEquals(1, result.getMeta().get("priority"));

		// ── Dimensions ──
		assertEquals(8, result.getDimensions().size());

		// Primary key
		assertEquals(true, result.getDimensions().get(0).get("primary_key"));

		// Case dimension
		Map<String, Object> channelLabel = result.getDimensions().get(5);
		assertEquals("channel_label", channelLabel.get("name"));
		Map<String, Object> caseBlock = (Map<String, Object>) channelLabel.get("case");
		List<Map<String, Object>> whens = (List<Map<String, Object>>) caseBlock.get("when");
		assertEquals(2, whens.size());
		assertEquals("Website", whens.get(0).get("label"));
		assertEquals("Other", ((Map<String, Object>) caseBlock.get("else")).get("label"));

		// Time dimension with sort
		assertEquals("desc", result.getDimensions().get(6).get("order"));

		// Geo dimension
		Map<String, Object> geo = result.getDimensions().get(7);
		assertEquals("geo", geo.get("type"));
		assertEquals("${CUBE}.store_lat", ((Map<String, Object>) geo.get("latitude")).get("sql"));

		// ── Measures ──
		List<Map<String, Object>> meas = result.getMeasures();
		assertEquals(4, meas.size());

		// Drill-down on count
		List<String> drill = (List<String>) meas.get(0).get("drill_members");
		assertEquals(3, drill.size());

		// Filtered measure
		List<Map<String, Object>> filters = (List<Map<String, Object>>) meas.get(3).get("filters");
		assertEquals(1, filters.size());
		assertTrue(((String) filters.get(0).get("sql")).contains("web"));

		// ── Joins ──
		assertEquals(2, result.getJoins().size());

		// ── Segments ──
		assertEquals(2, result.getSegments().size());
		assertEquals("high_value", result.getSegments().get(0).get("name"));

		// ── Hierarchies ──
		assertEquals(1, result.getHierarchies().size());
		List<String> levels = (List<String>) result.getHierarchies().get(0).get("levels");
		assertEquals(3, levels.size());
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #13  Empty Config Fallback
	//      User hasn't created a cube config yet, or the file is blank.
	//      Must return a valid empty CubeOptions, never throw.
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testEmptyConfigFallback() throws Exception {
		CubeOptions result1 = CubeOptionsParser.parseGroovyCubeDslCode(null);
		assertNotNull(result1);
		assertNull(result1.getSqlTable());
		assertNull(result1.getTitle());
		assertNull(result1.getExtends_());
		assertTrue(result1.getDimensions().isEmpty());
		assertTrue(result1.getMeasures().isEmpty());
		assertTrue(result1.getJoins().isEmpty());
		assertTrue(result1.getSegments().isEmpty());
		assertTrue(result1.getHierarchies().isEmpty());

		CubeOptions result2 = CubeOptionsParser.parseGroovyCubeDslCode("");
		assertNotNull(result2);

		CubeOptions result3 = CubeOptionsParser.parseGroovyCubeDslCode("   ");
		assertNotNull(result3);
	}
}
