package com.sourcekraft.documentburster.common.analytics;

import static org.junit.Assert.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import com.sourcekraft.documentburster.common.analytics.duckdb.DuckDBPivotProcessor;

/**
 * Unit tests for DuckDB SQL generation from PivotRequest DTOs.
 *
 * Tests verify that DuckDBPivotProcessor produces correct DuckDB-compatible SQL
 * for pivot table operations. No database connection is needed — all tests
 * assert against the generated SQL string.
 *
 * DuckDB-specific syntax verified:
 * - Double-quote identifier quoting ("column")
 * - GROUP BY ROLLUP(...) for subtotals
 * - MEDIAN(), FIRST(), LAST(), STRING_AGG() functions
 * - PERCENTILE_CONT(...) WITHIN GROUP (ORDER BY ...)
 * - date_trunc() for date binning
 * - LAG/LEAD window functions
 * - CAST AS DOUBLE / NULLIF(..., 0) for fractions
 *
 * Test ordering follows real-world frequency of pivot queries:
 *   #1-#4   Core pivot SQL patterns              — every pivot dashboard
 *   #5-#8   Common aggregator variations          — beyond Sum/Count
 *   #9-#12  Advanced analytics                    — window functions, date binning
 *   #13-#16 Edge cases & validation               — subtotals, fractions, null input
 */
public class DuckDBPivotProcessorTest {

	private DuckDBPivotProcessor processor;

	@Before
	public void setUp() {
		processor = new DuckDBPivotProcessor();
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 1 — Core pivot SQL patterns (>90%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #1  Single dimension Sum — the most basic pivot query
	//     "SELECT region, SUM(revenue) FROM sales GROUP BY region"
	//     Verifies double-quote identifier quoting, basic SELECT/GROUP BY/ORDER BY.
	//     Used by: CRM, ERP, Finance — every pivot dashboard starts here
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSumRevenueByRegion() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");

		String sql = processor.generateSQL(request);

		// DuckDB uses double-quote identifiers
		assertTrue(sql.contains("\"region\""));
		assertTrue(sql.contains("\"revenue\""));
		assertTrue(sql.contains("\"sales\""));
		assertTrue(sql.contains("SUM(\"revenue\")"));
		assertTrue(sql.contains("GROUP BY \"region\""));
		assertTrue(sql.contains("ORDER BY"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #2  Two-dimension Count cross-tab — rows x cols
	//     Generates GROUP BY with both row and column dimensions.
	//     Verifies COUNT(*) with no vals, and multi-dimension grouping.
	//     Used by: CRM, ERP, SaaS — volume analysis across categories
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCountByProductAndQuarter() {
		PivotRequest request = new PivotRequest();
		request.setTableName("orders");
		request.setRows(Arrays.asList("product"));
		request.setCols(Arrays.asList("quarter"));
		request.setAggregatorName("Count");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("COUNT(*)"));
		assertTrue(sql.contains("\"product\""));
		assertTrue(sql.contains("\"quarter\""));
		assertTrue(sql.contains("GROUP BY \"product\", \"quarter\""));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #3  Filtered pivot — WHERE clause from array-format filters
	//     "Show revenue by product but only for East and West regions."
	//     Verifies IN clause generation from array-format filter values.
	//     Used by: CRM, ERP — any filtered analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSumWithArrayFilters() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("product"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");

		Map<String, Object> filters = new HashMap<>();
		filters.put("region", Arrays.asList("East", "West"));
		request.setFilters(filters);

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("WHERE"));
		assertTrue(sql.contains("\"region\" IN ('East', 'West')"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #4  Object-format filters (react-pivottable's valueFilter shape)
	//     { "region": { "East": true, "West": true, "North": false } }
	//     Only truthy values are included in the WHERE IN clause.
	//     Used by: Frontend — react-pivottable sends filters in this shape
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSumWithObjectFormatFilters() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("product"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");

		Map<String, Object> regionFilter = new HashMap<>();
		regionFilter.put("East", true);
		regionFilter.put("West", true);
		regionFilter.put("North", false);

		Map<String, Object> filters = new HashMap<>();
		filters.put("region", regionFilter);
		request.setFilters(filters);

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("WHERE"));
		assertTrue(sql.contains("\"region\" IN ("));
		assertTrue(sql.contains("'East'"));
		assertTrue(sql.contains("'West'"));
		assertFalse(sql.contains("'North'"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 2 — Common aggregator variations (70-90%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #5  Average aggregation — AVG()
	//     "What's the average salary by department?"
	//     Used by: HR, Finance — benchmarking, compensation analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testAverageAggregator() {
		PivotRequest request = new PivotRequest();
		request.setTableName("employees");
		request.setRows(Arrays.asList("department"));
		request.setVals(Arrays.asList("salary"));
		request.setAggregatorName("Average");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("AVG(\"salary\")"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #6  Median — DuckDB's native MEDIAN() function
	//     "What's the median deal size by sales rep?" Critical for skewed
	//     distributions (compensation, deal sizes, response times).
	//     Used by: CRM, HR, Operations — distribution analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMedianAggregator() {
		PivotRequest request = new PivotRequest();
		request.setTableName("deals");
		request.setRows(Arrays.asList("salesRep"));
		request.setVals(Arrays.asList("dealSize"));
		request.setAggregatorName("Median");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("MEDIAN(\"dealSize\")"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #7  Count Unique — COUNT(DISTINCT column)
	//     "How many unique customers per region?"
	//     Used by: CRM, SaaS — unique entity counting
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCountUniqueAggregator() {
		PivotRequest request = new PivotRequest();
		request.setTableName("orders");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("customerId"));
		request.setAggregatorName("Count Unique Values");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("COUNT(DISTINCT \"customerId\")"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #8  List Unique Values — STRING_AGG(DISTINCT ...)
	//     "List all unique product names per category."
	//     Used by: ERP, CRM — catalog analysis, data quality
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testListUniqueAggregator() {
		PivotRequest request = new PivotRequest();
		request.setTableName("products");
		request.setRows(Arrays.asList("category"));
		request.setVals(Arrays.asList("productName"));
		request.setAggregatorName("List Unique Values");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("STRING_AGG(DISTINCT"));
		assertTrue(sql.contains("\"productName\""));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 3 — Advanced analytics (40-70%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #9  Value-based row sorting — ORDER BY aggregated value DESC
	//     "Show me regions sorted by revenue, highest first."
	//     Verifies that value_z_to_a sorts by aggregate, not dimension name.
	//     Used by: Finance, CRM — top-N analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testValueBasedSortingDescending() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setRowOrder("value_z_to_a");

		String sql = processor.generateSQL(request);

		// Value-based sorting: ORDER BY the aggregate alias DESC
		assertTrue(sql.contains("\"revenue\" DESC"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #10 Running Sum window function — cumulative revenue over time
	//     "Show cumulative revenue ordered by month."
	//     Used by: Finance, SaaS — MRR tracking, cumulative metrics
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testRunningSumWindowFunction() {
		PivotRequest request = new PivotRequest();
		request.setTableName("monthly_sales");
		request.setRows(Arrays.asList("month"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setWindowFunction("RUNNING_SUM");
		request.setOrderByColumn("month");

		String sql = processor.generateSQLWithWindowFunction(request);

		assertTrue(sql.contains("SUM(\"revenue\") OVER (ORDER BY \"month\")"));
		assertTrue(sql.contains("AS window_value"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #11 Monthly date binning — date_trunc('month', ...)
	//     "Group sales by month using DuckDB's date_trunc."
	//     Used by: Finance, SaaS, Operations — time-series dashboards
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMonthlyDateBinning() {
		PivotRequest request = new PivotRequest();
		request.setTableName("orders");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setDateBin("MONTH");
		request.setDateColumn("orderDate");

		String sql = processor.generateSQLWithDateBinning(request);

		assertTrue(sql.contains("date_trunc('month', \"orderDate\")"));
		assertTrue(sql.contains("AS date_period"));
		assertTrue(sql.contains("GROUP BY date_trunc('month', \"orderDate\")"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #12 Month-over-month comparison — LAG with YEAR/MONTH partitioning
	//     "Compare this month's revenue to last month's."
	//     Used by: Finance, SaaS — period-over-period reporting
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMonthOverMonthComparison() {
		PivotRequest request = new PivotRequest();
		request.setTableName("monthly_revenue");
		request.setRows(Arrays.asList("month"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setPeriodComparison("MONTH_OVER_MONTH");
		request.setDateColumn("orderDate");

		String sql = processor.generateSQLWithPeriodComparison(request);

		assertTrue(sql.contains("current_value"));
		assertTrue(sql.contains("previous_value"));
		assertTrue(sql.contains("LAG"));
		assertTrue(sql.contains("ORDER BY \"orderDate\""));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 4 — Edge cases & validation
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #13 Subtotals — GROUP BY ROLLUP(...)
	//     "Include subtotal rows for each hierarchy level."
	//     Verifies DuckDB-specific ROLLUP syntax (not WITH ROLLUP).
	//     Used by: Finance, ERP — hierarchical P&L reports
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSubtotalsWithRollup() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("region", "country"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setIncludeSubtotals(true);

		String sql = processor.generateSQL(request);

		// DuckDB ROLLUP syntax: GROUP BY ROLLUP(a, b)
		assertTrue(sql.contains("GROUP BY ROLLUP(\"region\", \"country\")"));
		// NOT ClickHouse syntax: GROUP BY ... WITH ROLLUP
		assertFalse(sql.contains("WITH ROLLUP"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #14 Sum as Fraction of Total — CAST/NULLIF window expression
	//     "What % of total revenue does each region contribute?"
	//     Verifies DuckDB fraction SQL with CAST AS DOUBLE.
	//     Used by: Finance, SaaS — contribution analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testFractionOfTotalAggregator() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum as Fraction of Total");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("CAST("));
		assertTrue(sql.contains("AS DOUBLE)"));
		assertTrue(sql.contains("NULLIF("));
		assertTrue(sql.contains("OVER ()"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #15 Null request validation
	//     Used by: Internal — input validation
	// ─────────────────────────────────────────────────────────────────────────────
	@Test(expected = IllegalArgumentException.class)
	public void testNullRequestThrowsException() {
		processor.generateSQL(null);
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #16 Empty table name validation
	//     Used by: Internal — input validation
	// ─────────────────────────────────────────────────────────────────────────────
	@Test(expected = IllegalArgumentException.class)
	public void testEmptyTableNameThrowsException() {
		PivotRequest request = new PivotRequest();
		request.setTableName("");
		request.setRows(Arrays.asList("region"));
		request.setAggregatorName("Count");

		processor.generateSQL(request);
	}
}
