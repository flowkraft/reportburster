package com.sourcekraft.documentburster.common.analytics;

import static org.junit.Assert.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import com.sourcekraft.documentburster.common.analytics.clickhouse.ClickHousePivotProcessor;

/**
 * Unit tests for ClickHouse SQL generation from PivotRequest DTOs.
 *
 * Tests verify that ClickHousePivotProcessor produces correct ClickHouse-compatible
 * SQL for pivot table operations. No database connection is needed — all tests
 * assert against the generated SQL string.
 *
 * ClickHouse-specific syntax verified (contrasted with DuckDB):
 * - Backtick identifier quoting (`column` not "column")
 * - GROUP BY ... WITH ROLLUP (not GROUP BY ROLLUP(...))
 * - quantile(0.5)(`col`) for median (not MEDIAN())
 * - uniq(`col`) for count unique (not COUNT(DISTINCT))
 * - any()/anyLast() for first/last (not FIRST()/LAST())
 * - arrayStringConcat(groupUniqArray(...)) for list unique (not STRING_AGG)
 * - lagInFrame/leadInFrame instead of LAG/LEAD
 * - toStartOfMonth() instead of date_trunc('month', ...)
 * - CAST AS Float64 / nullIf(..., 0) for fractions
 * - Backslash string escaping (not single-quote doubling)
 *
 * Test ordering mirrors DuckDBPivotProcessorTest for easy comparison:
 *   #1-#4   Core pivot SQL patterns              — every pivot dashboard
 *   #5-#8   Common aggregator variations          — ClickHouse-specific functions
 *   #9-#12  Advanced analytics                    — ClickHouse window/date syntax
 *   #13-#16 Edge cases & validation               — subtotals, fractions, nulls
 */
public class ClickHousePivotProcessorTest {

	private ClickHousePivotProcessor processor;

	@Before
	public void setUp() {
		processor = new ClickHousePivotProcessor();
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 1 — Core pivot SQL patterns (>90%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #1  Single dimension Sum — backtick quoting
	//     Same business case as DuckDB #1, but verifies ClickHouse uses backticks
	//     instead of double quotes for identifier quoting.
	//     Used by: CRM, ERP, Finance — every pivot dashboard
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSumRevenueByRegion() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");

		String sql = processor.generateSQL(request);

		// ClickHouse uses backtick identifiers (not double quotes)
		assertTrue(sql.contains("`region`"));
		assertTrue(sql.contains("`revenue`"));
		assertTrue(sql.contains("`sales`"));
		assertTrue(sql.contains("sum(`revenue`)"));
		assertTrue(sql.contains("GROUP BY `region`"));
		// Must NOT contain DuckDB-style double quotes
		assertFalse(sql.contains("\"region\""));
		assertFalse(sql.contains("\"revenue\""));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #2  Two-dimension Count cross-tab — count(*) lowercase
	//     ClickHouse uses lowercase count(*) by convention.
	//     Used by: CRM, ERP, SaaS — volume analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCountByProductAndQuarter() {
		PivotRequest request = new PivotRequest();
		request.setTableName("orders");
		request.setRows(Arrays.asList("product"));
		request.setCols(Arrays.asList("quarter"));
		request.setAggregatorName("Count");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("count(*)"));
		assertTrue(sql.contains("`product`"));
		assertTrue(sql.contains("`quarter`"));
		assertTrue(sql.contains("GROUP BY `product`, `quarter`"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #3  Filtered pivot — WHERE clause with backslash-escaped strings
	//     ClickHouse uses backslash escaping for single quotes in string literals
	//     (e.g., 'O\'Brien'), unlike DuckDB which doubles them ('O''Brien').
	//     Used by: CRM, ERP — filtered analysis with special characters
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSumWithFiltersBackslashEscape() {
		PivotRequest request = new PivotRequest();
		request.setTableName("customers");
		request.setRows(Arrays.asList("country"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");

		Map<String, Object> filters = new HashMap<>();
		filters.put("name", Arrays.asList("O'Brien", "McDonald's"));
		request.setFilters(filters);

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("WHERE"));
		// ClickHouse backslash escaping
		assertTrue(sql.contains("'O\\'Brien'"));
		assertTrue(sql.contains("'McDonald\\'s'"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #4  Object-format filters — same as DuckDB but with backtick quoting
	//     Verifies that the truthy/falsy filter logic works with ClickHouse syntax.
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
		assertTrue(sql.contains("`region` IN ("));
		assertTrue(sql.contains("'East'"));
		assertTrue(sql.contains("'West'"));
		assertFalse(sql.contains("'North'"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 2 — ClickHouse-specific aggregator variations (70-90%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #5  Median — quantile(0.5)(`col`) not MEDIAN()
	//     THE key ClickHouse aggregator difference: no MEDIAN() function.
	//     Uses quantile(probability)(column) syntax instead.
	//     Used by: CRM, HR, Operations — distribution analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMedianUsesQuantile() {
		PivotRequest request = new PivotRequest();
		request.setTableName("deals");
		request.setRows(Arrays.asList("salesRep"));
		request.setVals(Arrays.asList("dealSize"));
		request.setAggregatorName("Median");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("quantile(0.5)(`dealSize`)"));
		// Must NOT contain DuckDB-style MEDIAN
		assertFalse(sql.contains("MEDIAN("));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #6  Count Unique — uniq(`col`) not COUNT(DISTINCT)
	//     ClickHouse's uniq() is HyperLogLog-based, approximate but very fast
	//     for large datasets. Different from DuckDB's exact COUNT(DISTINCT).
	//     Used by: CRM, SaaS — unique entity counting at scale
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCountUniqueUsesUniq() {
		PivotRequest request = new PivotRequest();
		request.setTableName("orders");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("customerId"));
		request.setAggregatorName("Count Unique Values");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("uniq(`customerId`)"));
		// Must NOT contain DuckDB-style COUNT(DISTINCT)
		assertFalse(sql.contains("COUNT(DISTINCT"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #7  First/Last — any()/anyLast() not FIRST()/LAST()
	//     ClickHouse does not have FIRST/LAST aggregate functions; uses any()
	//     for first non-null value and anyLast() for last.
	//     Used by: ERP, Operations — first/last observation per group
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testFirstAndLastUseAnyFunctions() {
		PivotRequest request = new PivotRequest();
		request.setTableName("events");
		request.setRows(Arrays.asList("userId"));
		request.setVals(Arrays.asList("eventType"));

		// Test First
		request.setAggregatorName("First");
		String sqlFirst = processor.generateSQL(request);
		assertTrue(sqlFirst.contains("any(`eventType`)"));
		assertFalse(sqlFirst.contains("FIRST("));

		// Test Last
		request.setAggregatorName("Last");
		String sqlLast = processor.generateSQL(request);
		assertTrue(sqlLast.contains("anyLast(`eventType`)"));
		assertFalse(sqlLast.contains("LAST("));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #8  List Unique Values — arrayStringConcat(groupUniqArray(toString(...)))
	//     ClickHouse's equivalent of STRING_AGG(DISTINCT ...). Uses array
	//     functions for string aggregation.
	//     Used by: ERP, CRM — catalog listing, data quality
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testListUniqueUsesGroupUniqArray() {
		PivotRequest request = new PivotRequest();
		request.setTableName("products");
		request.setRows(Arrays.asList("category"));
		request.setVals(Arrays.asList("productName"));
		request.setAggregatorName("List Unique Values");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("arrayStringConcat(groupUniqArray(toString(`productName`))"));
		// Must NOT contain DuckDB-style STRING_AGG
		assertFalse(sql.contains("STRING_AGG"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 3 — Advanced analytics (40-70%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #9  Value-based sorting — unquoted alias in ORDER BY
	//     ClickHouse uses unquoted aliases in ORDER BY for aggregate columns.
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

		// ClickHouse: ORDER BY uses unquoted alias for aggregate value
		assertTrue(sql.contains("revenue DESC"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #10 LAG window function — lagInFrame() not LAG()
	//     ClickHouse uses lagInFrame() for better performance within frame.
	//     This is a key difference from DuckDB's standard LAG().
	//     Used by: Finance, SaaS — period comparison
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testLagWindowUsesLagInFrame() {
		PivotRequest request = new PivotRequest();
		request.setTableName("monthly_sales");
		request.setRows(Arrays.asList("month"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setWindowFunction("LAG_1");
		request.setOrderByColumn("month");

		String sql = processor.generateSQLWithWindowFunction(request);

		assertTrue(sql.contains("lagInFrame(`revenue`, 1) OVER (ORDER BY `month`)"));
		// Must NOT contain DuckDB-style LAG(
		assertFalse(sql.contains("LAG(`revenue`"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #11 Monthly date binning — toStartOfMonth() not date_trunc
	//     ClickHouse uses native date functions (toStartOfMonth, toStartOfYear,
	//     etc.) instead of DuckDB's generic date_trunc().
	//     Used by: Finance, SaaS — time-series dashboards
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMonthlyDateBinUsesToStartOfMonth() {
		PivotRequest request = new PivotRequest();
		request.setTableName("orders");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setDateBin("MONTH");
		request.setDateColumn("orderDate");

		String sql = processor.generateSQLWithDateBinning(request);

		assertTrue(sql.contains("toStartOfMonth(`orderDate`)"));
		assertTrue(sql.contains("AS date_period"));
		// Must NOT contain DuckDB-style date_trunc
		assertFalse(sql.contains("date_trunc"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #12 Month-over-month comparison — lagInFrame with toYear/toMonth
	//     ClickHouse period comparison uses lagInFrame + toYear/toMonth partition
	//     instead of DuckDB's LAG + YEAR/MONTH functions.
	//     Used by: Finance, SaaS — period-over-period reporting
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMonthOverMonthUsesLagInFrame() {
		PivotRequest request = new PivotRequest();
		request.setTableName("monthly_revenue");
		request.setRows(Arrays.asList("month"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setPeriodComparison("MONTH_OVER_MONTH");
		request.setDateColumn("orderDate");

		String sql = processor.generateSQLWithPeriodComparison(request);

		assertTrue(sql.contains("lagInFrame"));
		assertTrue(sql.contains("toYear"));
		assertTrue(sql.contains("toMonth"));
		assertTrue(sql.contains("current_value"));
		assertTrue(sql.contains("previous_value"));
		// Must NOT contain DuckDB-style LAG(
		assertFalse(sql.contains("LAG(`revenue`"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 4 — Edge cases & validation
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #13 Subtotals — GROUP BY ... WITH ROLLUP (not GROUP BY ROLLUP(...))
	//     THE key structural difference from DuckDB: ClickHouse appends
	//     WITH ROLLUP after the column list instead of wrapping in ROLLUP().
	//     Used by: Finance, ERP — hierarchical P&L reports
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSubtotalsWithRollupSyntax() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("region", "country"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum");
		request.setIncludeSubtotals(true);

		String sql = processor.generateSQL(request);

		// ClickHouse ROLLUP syntax: GROUP BY `region`, `country` WITH ROLLUP
		assertTrue(sql.contains("GROUP BY `region`, `country` WITH ROLLUP"));
		// Must NOT contain DuckDB-style GROUP BY ROLLUP(...)
		assertFalse(sql.contains("GROUP BY ROLLUP("));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #14 Fraction of Total — CAST AS Float64 / nullIf (ClickHouse syntax)
	//     ClickHouse uses Float64 (not DOUBLE) and nullIf (not NULLIF uppercase)
	//     for fraction aggregator calculations.
	//     Used by: Finance, SaaS — contribution analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testFractionOfTotalUsesFloat64() {
		PivotRequest request = new PivotRequest();
		request.setTableName("sales");
		request.setRows(Arrays.asList("region"));
		request.setVals(Arrays.asList("revenue"));
		request.setAggregatorName("Sum as Fraction of Total");

		String sql = processor.generateSQL(request);

		assertTrue(sql.contains("CAST("));
		assertTrue(sql.contains("AS Float64)"));
		assertTrue(sql.contains("nullIf("));
		assertTrue(sql.contains("OVER ()"));
		// Must NOT contain DuckDB-style DOUBLE
		assertFalse(sql.contains("AS DOUBLE)"));
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
