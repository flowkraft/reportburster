package com.sourcekraft.documentburster.common.dsl;

import static org.junit.Assert.*;

import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.sourcekraft.documentburster.common.chart.ChartOptions;
import com.sourcekraft.documentburster.common.chart.ChartOptionsParser;

/**
 * Business use-case tests for the Chart.js Groovy DSL.
 *
 * Tests are ordered top-to-bottom by real-world frequency: the charts that
 * appear most often in CRM, ERP, and financial dashboards come first, with
 * progressively more specialized use cases further down.
 *
 * Frequency reasoning (across Salesforce, SAP, QuickBooks, Bloomberg, etc.):
 *   #1-#3   Every dashboard has these       — line trends, bar comparisons
 *   #4-#6   Most dashboards have one        — pie breakdowns, dual-axis KPIs, stacked composition
 *   #7-#9   Common in specific domains      — doughnut allocation, area forecasts, ranked lists
 *   #10-#11 Specialized but important       — radar reviews, polar area surveys
 *   #12-#14 Syntax shortcuts & edge cases   — compact notation, empty input, future-proofing
 *
 * Each test contains the exact Groovy DSL a user would write in their
 * {reportCode}-chart-config.groovy file. Every assertion validates that the
 * parsed output matches Chart.js's native API structure, confirming the
 * "thin wrapper" design principle.
 */
public class ChartOptionsParserTest {

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 1 — Every single business dashboard has these (>90%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #1  Monthly Sales Trend — Line Chart
	//     THE universal chart. If a dashboard has one chart, it's a line showing
	//     a metric over time — revenue, pipeline, MRR, stock price, traffic.
	//     Used by: CRM, ERP, Finance, SaaS, Operations — every app type
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMonthlySalesTrendLineChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'line'\n" +
			"  labelField 'Month'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Revenue'\n" +
			"      label 'Monthly Revenue ($)'\n" +
			"      borderColor '#4e79a7'\n" +
			"      backgroundColor 'rgba(78, 121, 167, 0.1)'\n" +
			"      tension 0.3\n" +
			"      borderWidth 2\n" +
			"      pointRadius 4\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Monthly Sales Trend' }\n" +
			"      legend { position 'bottom' }\n" +
			"    }\n" +
			"    scales {\n" +
			"      y { beginAtZero true; title { display true; text 'Revenue ($)' } }\n" +
			"      x { title { display true; text 'Month' } }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("line", result.getType());
		assertEquals("Month", result.getLabelField());

		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(1, datasets.size());
		Map<String, Object> ds = datasets.get(0);
		assertEquals("Revenue", ds.get("field"));
		assertEquals("Monthly Revenue ($)", ds.get("label"));
		assertEquals("#4e79a7", ds.get("borderColor"));
		assertEquals(new java.math.BigDecimal("0.3"), ds.get("tension"));
		assertEquals(2, ds.get("borderWidth"));
		assertEquals(4, ds.get("pointRadius"));

		Map<String, Object> opts = result.getOptions();
		assertEquals(true, opts.get("responsive"));

		@SuppressWarnings("unchecked")
		Map<String, Object> plugins = (Map<String, Object>) opts.get("plugins");
		@SuppressWarnings("unchecked")
		Map<String, Object> title = (Map<String, Object>) plugins.get("title");
		assertEquals(true, title.get("display"));
		assertEquals("Monthly Sales Trend", title.get("text"));

		@SuppressWarnings("unchecked")
		Map<String, Object> scales = (Map<String, Object>) opts.get("scales");
		@SuppressWarnings("unchecked")
		Map<String, Object> yAxis = (Map<String, Object>) scales.get("y");
		assertEquals(true, yAxis.get("beginAtZero"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #2  Sales by Region — Bar Chart
	//     A single metric compared across categories — the simplest bar chart
	//     users reach for. "Sales by region", "output by plant", "income by source".
	//     Used by: CRM, ERP, Finance, SaaS — every app type
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testSalesByRegionBarChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'bar'\n" +
			"  labelField 'Region'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Sales'\n" +
			"      label 'Total Sales ($)'\n" +
			"      backgroundColor 'rgba(78, 121, 167, 0.7)'\n" +
			"      borderColor '#4e79a7'\n" +
			"      borderWidth 1\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Sales by Region' }\n" +
			"      legend { display false }\n" +
			"    }\n" +
			"    scales {\n" +
			"      y { beginAtZero true; title { display true; text 'Sales ($)' } }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("bar", result.getType());
		assertEquals("Region", result.getLabelField());

		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(1, datasets.size());
		assertEquals("Sales", datasets.get(0).get("field"));
		assertEquals("Total Sales ($)", datasets.get(0).get("label"));
		assertEquals("rgba(78, 121, 167, 0.7)", datasets.get(0).get("backgroundColor"));

		@SuppressWarnings("unchecked")
		Map<String, Object> legend = (Map<String, Object>) ((Map<String, Object>) result.getOptions().get("plugins")).get("legend");
		assertEquals(false, legend.get("display"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #3  Revenue vs Expenses — Grouped Bar Chart
	//     P&L side-by-side in every ERP and finance dashboard. "Revenue vs Cost",
	//     "This Year vs Last Year", "Budget vs Actual" — always two bars per
	//     category so managers can compare at a glance.
	//     Used by: ERP, Finance, SaaS — any app comparing two metrics side-by-side
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testRevenueVsExpensesGroupedBarChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'bar'\n" +
			"  labelField 'Quarter'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Revenue'\n" +
			"      label 'Revenue'\n" +
			"      backgroundColor 'rgba(78, 121, 167, 0.7)'\n" +
			"      borderColor '#4e79a7'\n" +
			"      borderWidth 1\n" +
			"    }\n" +
			"    series {\n" +
			"      field 'Expenses'\n" +
			"      label 'Expenses'\n" +
			"      backgroundColor 'rgba(225, 87, 89, 0.7)'\n" +
			"      borderColor '#e15759'\n" +
			"      borderWidth 1\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Revenue vs Expenses by Quarter' }\n" +
			"      legend { position 'bottom' }\n" +
			"    }\n" +
			"    scales {\n" +
			"      y { beginAtZero true }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("bar", result.getType());
		assertEquals("Quarter", result.getLabelField());

		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(2, datasets.size());

		assertEquals("Revenue", datasets.get(0).get("field"));
		assertEquals("Revenue", datasets.get(0).get("label"));
		assertEquals("rgba(78, 121, 167, 0.7)", datasets.get(0).get("backgroundColor"));

		assertEquals("Expenses", datasets.get(1).get("field"));
		assertEquals("Expenses", datasets.get(1).get("label"));
		assertEquals("rgba(225, 87, 89, 0.7)", datasets.get(1).get("backgroundColor"));

		@SuppressWarnings("unchecked")
		Map<String, Object> legend = (Map<String, Object>) ((Map<String, Object>) result.getOptions().get("plugins")).get("legend");
		assertEquals("bottom", legend.get("position"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 2 — Very common, most dashboards have at least one (70-90%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #4  Expense Breakdown — Pie Chart
	//     "Where does the money go?" Every finance team, every budget review,
	//     every department head meeting. Pie is the go-to for showing proportions
	//     of a whole — expense categories, revenue sources, cost centers.
	//     Used by: Finance, ERP, CRM, SaaS — any app showing proportions of a whole
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testExpenseBreakdownPieChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'pie'\n" +
			"  labelField 'Category'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Amount'\n" +
			"      label 'Expenses'\n" +
			"      backgroundColor(['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'])\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Expense Breakdown by Category' }\n" +
			"      legend { position 'right' }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("pie", result.getType());
		assertEquals("Category", result.getLabelField());

		Map<String, Object> ds = result.getDatasets().get(0);
		assertEquals("Amount", ds.get("field"));

		@SuppressWarnings("unchecked")
		List<String> bgColors = (List<String>) ds.get("backgroundColor");
		assertEquals(5, bgColors.size());
		assertEquals("#4e79a7", bgColors.get(0));
		assertEquals("#59a14f", bgColors.get(4));

		@SuppressWarnings("unchecked")
		Map<String, Object> legend = (Map<String, Object>) ((Map<String, Object>) result.getOptions().get("plugins")).get("legend");
		assertEquals("right", legend.get("position"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #5  Revenue and Profit Margin — Dual Y-Axis Mixed Chart
	//     Executive KPI dashboard: Revenue ($, bars, left axis) + Profit Margin
	//     (%, line, right axis). CFOs and VPs of Sales always want to see the
	//     dollar amount alongside the percentage in one view.
	//     Used by: ERP, Finance, SaaS — executive dashboards correlating $ with %
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testRevenueAndProfitMarginDualAxisChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'bar'\n" +
			"  labelField 'Quarter'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Revenue'\n" +
			"      label 'Revenue ($)'\n" +
			"      backgroundColor 'rgba(78, 121, 167, 0.7)'\n" +
			"      borderColor '#4e79a7'\n" +
			"      borderWidth 1\n" +
			"      yAxisID 'y'\n" +
			"      order 1\n" +
			"    }\n" +
			"    series {\n" +
			"      field 'ProfitMargin'\n" +
			"      label 'Profit Margin (%)'\n" +
			"      type 'line'\n" +
			"      borderColor '#e15759'\n" +
			"      backgroundColor 'rgba(225, 87, 89, 0.1)'\n" +
			"      borderWidth 3\n" +
			"      pointRadius 5\n" +
			"      pointStyle 'circle'\n" +
			"      tension 0.3\n" +
			"      fill false\n" +
			"      yAxisID 'y1'\n" +
			"      order 0\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Revenue & Profit Margin' }\n" +
			"    }\n" +
			"    scales {\n" +
			"      y {\n" +
			"        type 'linear'\n" +
			"        position 'left'\n" +
			"        beginAtZero true\n" +
			"        title { display true; text 'Revenue ($)' }\n" +
			"      }\n" +
			"      y1 {\n" +
			"        type 'linear'\n" +
			"        position 'right'\n" +
			"        beginAtZero true\n" +
			"        max 100\n" +
			"        title { display true; text 'Margin (%)' }\n" +
			"        grid { drawOnChartArea false }\n" +
			"      }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("bar", result.getType());
		assertEquals("Quarter", result.getLabelField());

		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(2, datasets.size());

		// Revenue series: bars on left axis
		Map<String, Object> revenueDs = datasets.get(0);
		assertEquals("Revenue", revenueDs.get("field"));
		assertEquals("y", revenueDs.get("yAxisID"));
		assertEquals(1, revenueDs.get("order"));

		// Profit Margin series: line on right axis (mixed chart)
		Map<String, Object> marginDs = datasets.get(1);
		assertEquals("ProfitMargin", marginDs.get("field"));
		assertEquals("line", marginDs.get("type"));
		assertEquals("y1", marginDs.get("yAxisID"));
		assertEquals(5, marginDs.get("pointRadius"));
		assertEquals("circle", marginDs.get("pointStyle"));
		assertEquals(false, marginDs.get("fill"));
		assertEquals(0, marginDs.get("order"));

		// Dual Y-axis scales
		@SuppressWarnings("unchecked")
		Map<String, Object> scales = (Map<String, Object>) result.getOptions().get("scales");
		@SuppressWarnings("unchecked")
		Map<String, Object> yLeft = (Map<String, Object>) scales.get("y");
		assertEquals("left", yLeft.get("position"));
		assertEquals(true, yLeft.get("beginAtZero"));

		@SuppressWarnings("unchecked")
		Map<String, Object> yRight = (Map<String, Object>) scales.get("y1");
		assertEquals("right", yRight.get("position"));
		assertEquals(100, yRight.get("max"));

		@SuppressWarnings("unchecked")
		Map<String, Object> y1Grid = (Map<String, Object>) yRight.get("grid");
		assertEquals(false, y1Grid.get("drawOnChartArea"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #6  Quarterly Revenue by Product Line — Stacked Bar Chart
	//     "How much of Q3 revenue came from each product line?" Stacked bars show
	//     composition over time — extremely common in ERP product analytics,
	//     SaaS plan-level MRR breakdowns, and regional contribution reports.
	//     Used by: ERP, SaaS, Finance — composition analysis over time periods
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testQuarterlyRevenueByProductStackedBarChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'bar'\n" +
			"  labelField 'Quarter'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Software'\n" +
			"      label 'Software'\n" +
			"      backgroundColor 'rgba(78, 121, 167, 0.8)'\n" +
			"    }\n" +
			"    series {\n" +
			"      field 'Services'\n" +
			"      label 'Professional Services'\n" +
			"      backgroundColor 'rgba(242, 142, 43, 0.8)'\n" +
			"    }\n" +
			"    series {\n" +
			"      field 'Support'\n" +
			"      label 'Support & Maintenance'\n" +
			"      backgroundColor 'rgba(89, 161, 79, 0.8)'\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Quarterly Revenue by Product Line' }\n" +
			"      legend { position 'bottom' }\n" +
			"      tooltip { mode 'index'; intersect false }\n" +
			"    }\n" +
			"    scales {\n" +
			"      x { stacked true }\n" +
			"      y { stacked true; beginAtZero true; title { display true; text 'Revenue ($)' } }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("bar", result.getType());
		assertEquals("Quarter", result.getLabelField());

		// Three product line series
		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(3, datasets.size());
		assertEquals("Software", datasets.get(0).get("field"));
		assertEquals("Software", datasets.get(0).get("label"));
		assertEquals("Services", datasets.get(1).get("field"));
		assertEquals("Professional Services", datasets.get(1).get("label"));
		assertEquals("Support", datasets.get(2).get("field"));
		assertEquals("Support & Maintenance", datasets.get(2).get("label"));

		// Stacked scales (Chart.js native)
		@SuppressWarnings("unchecked")
		Map<String, Object> scales = (Map<String, Object>) result.getOptions().get("scales");
		@SuppressWarnings("unchecked")
		Map<String, Object> xAxis = (Map<String, Object>) scales.get("x");
		assertEquals(true, xAxis.get("stacked"));
		@SuppressWarnings("unchecked")
		Map<String, Object> yAxis = (Map<String, Object>) scales.get("y");
		assertEquals(true, yAxis.get("stacked"));
		assertEquals(true, yAxis.get("beginAtZero"));

		// Tooltip mode for stacked charts
		@SuppressWarnings("unchecked")
		Map<String, Object> tooltip = (Map<String, Object>) ((Map<String, Object>) result.getOptions().get("plugins")).get("tooltip");
		assertEquals("index", tooltip.get("mode"));
		assertEquals(false, tooltip.get("intersect"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 3 — Common in specific domains (40-70%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #7  Portfolio Allocation — Doughnut Chart
	//     Financial apps: investment portfolio split, fund allocation, asset class
	//     weights. Also used for market share, product revenue mix. Doughnut with
	//     cutout is the modern alternative to pie when you want to show a KPI or
	//     total in the center hole.
	//     Used by: Finance, SaaS, CRM — portfolio views, market share, plan mix
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testPortfolioAllocationDoughnutChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'doughnut'\n" +
			"  labelField 'AssetClass'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Allocation'\n" +
			"      label 'Portfolio Weight (%)'\n" +
			"      backgroundColor(['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'])\n" +
			"      borderWidth 2\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    cutout '60%'\n" +
			"    plugins {\n" +
			"      title { display true; text 'Portfolio Allocation by Asset Class' }\n" +
			"      legend { position 'right' }\n" +
			"      tooltip { enabled true }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("doughnut", result.getType());
		assertEquals("AssetClass", result.getLabelField());

		Map<String, Object> ds = result.getDatasets().get(0);
		assertEquals("Allocation", ds.get("field"));
		assertEquals(2, ds.get("borderWidth"));

		@SuppressWarnings("unchecked")
		List<String> bgColors = (List<String>) ds.get("backgroundColor");
		assertEquals(5, bgColors.size());

		Map<String, Object> opts = result.getOptions();
		assertEquals("60%", opts.get("cutout"));

		@SuppressWarnings("unchecked")
		Map<String, Object> tooltip = (Map<String, Object>) ((Map<String, Object>) opts.get("plugins")).get("tooltip");
		assertEquals(true, tooltip.get("enabled"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #8  Budget vs Actual Spending — Area Chart (Line with Fill)
	//     Financial planning: budget as a filled area, actual spend as a line
	//     overlay. Also used for sales target tracking ("target zone" vs actual),
	//     project spend monitoring, and forecast vs reality comparisons.
	//     Used by: Finance, ERP, Operations — budget tracking, forecast vs actual
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testBudgetVsActualSpendingAreaChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'line'\n" +
			"  labelField 'Month'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Budget'\n" +
			"      label 'Budget'\n" +
			"      borderColor '#4e79a7'\n" +
			"      backgroundColor 'rgba(78, 121, 167, 0.3)'\n" +
			"      fill 'origin'\n" +
			"      tension 0.4\n" +
			"      pointRadius 3\n" +
			"    }\n" +
			"    series {\n" +
			"      field 'Actual'\n" +
			"      label 'Actual Spending'\n" +
			"      borderColor '#e15759'\n" +
			"      borderDash([5, 5])\n" +
			"      borderWidth 2\n" +
			"      fill false\n" +
			"      pointRadius 4\n" +
			"      pointStyle 'circle'\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Budget vs Actual Spending' }\n" +
			"      legend { position 'bottom' }\n" +
			"    }\n" +
			"    scales {\n" +
			"      y { beginAtZero true; title { display true; text 'Amount ($)' } }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("line", result.getType());
		assertEquals("Month", result.getLabelField());

		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(2, datasets.size());

		// Budget series — filled area
		Map<String, Object> budgetDs = datasets.get(0);
		assertEquals("Budget", budgetDs.get("field"));
		assertEquals("origin", budgetDs.get("fill"));
		assertEquals(new java.math.BigDecimal("0.4"), budgetDs.get("tension"));

		// Actual series — dashed line overlay
		Map<String, Object> actualDs = datasets.get(1);
		assertEquals("Actual", actualDs.get("field"));
		assertEquals(false, actualDs.get("fill"));
		assertEquals("circle", actualDs.get("pointStyle"));

		// borderDash passes through as a list (Chart.js native)
		@SuppressWarnings("unchecked")
		List<Integer> borderDash = (List<Integer>) actualDs.get("borderDash");
		assertEquals(2, borderDash.size());
		assertEquals(Integer.valueOf(5), borderDash.get(0));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #9  Top 10 Customers by Revenue — Horizontal Bar Chart
	//     CRM ranking reports: "Top 10 Customers", "Top Products by Units Sold",
	//     "Sales Leaderboard by Rep". Horizontal bars are the natural choice for
	//     ranked lists where category labels (company names) are long.
	//     Used by: CRM, ERP, SaaS — ranked lists, leaderboards, Pareto analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testTopCustomersByRevenueHorizontalBarChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'bar'\n" +
			"  labelField 'Customer'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Revenue'\n" +
			"      label 'Revenue ($)'\n" +
			"      backgroundColor 'rgba(89, 161, 79, 0.7)'\n" +
			"      borderColor '#59a14f'\n" +
			"      borderWidth 1\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    indexAxis 'y'\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Top 10 Customers by Revenue' }\n" +
			"      legend { display false }\n" +
			"    }\n" +
			"    scales {\n" +
			"      x { beginAtZero true; title { display true; text 'Revenue ($)' } }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("bar", result.getType());
		assertEquals("Customer", result.getLabelField());

		Map<String, Object> ds = result.getDatasets().get(0);
		assertEquals("Revenue", ds.get("field"));

		// Horizontal bar: indexAxis = 'y' (Chart.js native)
		Map<String, Object> opts = result.getOptions();
		assertEquals("y", opts.get("indexAxis"));

		@SuppressWarnings("unchecked")
		Map<String, Object> legend = (Map<String, Object>) ((Map<String, Object>) opts.get("plugins")).get("legend");
		assertEquals(false, legend.get("display"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// TIER 4 — Specialized but important (10-30%)
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #10 Employee Performance Review — Radar Chart
	//     HR: comparing an employee's scores across 6-8 skill dimensions against
	//     the team average. Also used for supplier evaluation scorecards and
	//     product feature comparison matrices.
	//     Used by: HR, Operations, ERP — performance reviews, supplier scorecards
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testEmployeePerformanceRadarChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'radar'\n" +
			"  labelField 'Skill'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'EmployeeScore'\n" +
			"      label 'Employee'\n" +
			"      borderColor '#4e79a7'\n" +
			"      backgroundColor 'rgba(78, 121, 167, 0.2)'\n" +
			"      pointRadius 4\n" +
			"      pointStyle 'rectRot'\n" +
			"    }\n" +
			"    series {\n" +
			"      field 'TeamAverage'\n" +
			"      label 'Team Average'\n" +
			"      borderColor '#e15759'\n" +
			"      backgroundColor 'rgba(225, 87, 89, 0.2)'\n" +
			"      pointRadius 4\n" +
			"      pointStyle 'circle'\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Performance Review: Skills Assessment' }\n" +
			"    }\n" +
			"    scales {\n" +
			"      r {\n" +
			"        beginAtZero true\n" +
			"        max 10\n" +
			"        ticks { stepSize 2 }\n" +
			"      }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("radar", result.getType());
		assertEquals("Skill", result.getLabelField());

		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(2, datasets.size());

		assertEquals("EmployeeScore", datasets.get(0).get("field"));
		assertEquals("rectRot", datasets.get(0).get("pointStyle"));

		assertEquals("TeamAverage", datasets.get(1).get("field"));
		assertEquals("circle", datasets.get(1).get("pointStyle"));

		@SuppressWarnings("unchecked")
		Map<String, Object> scales = (Map<String, Object>) result.getOptions().get("scales");
		@SuppressWarnings("unchecked")
		Map<String, Object> rAxis = (Map<String, Object>) scales.get("r");
		assertEquals(true, rAxis.get("beginAtZero"));
		assertEquals(10, rAxis.get("max"));

		@SuppressWarnings("unchecked")
		Map<String, Object> ticks = (Map<String, Object>) rAxis.get("ticks");
		assertEquals(2, ticks.get("stepSize"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #11 Customer Satisfaction by Channel — Polar Area Chart
	//     Customer success / quality teams: NPS or CSAT scores broken down by
	//     support channel (phone, email, chat, in-person). Each wedge's radius
	//     shows the score magnitude — useful when categories aren't parts of a
	//     whole but each has an independent score.
	//     Used by: CRM, SaaS — customer success teams, NPS/CSAT analysis
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCustomerSatisfactionPolarAreaChart() throws Exception {
		String dsl = "chart {\n" +
			"  type 'polarArea'\n" +
			"  labelField 'Channel'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'SatisfactionScore'\n" +
			"      label 'CSAT Score'\n" +
			"      backgroundColor(['rgba(78,121,167,0.6)', 'rgba(242,142,43,0.6)', 'rgba(225,87,89,0.6)', 'rgba(118,183,178,0.6)', 'rgba(89,161,79,0.6)'])\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Customer Satisfaction by Support Channel' }\n" +
			"      legend { position 'right' }\n" +
			"    }\n" +
			"    scales {\n" +
			"      r { beginAtZero true; max 100 }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("polarArea", result.getType());
		assertEquals("Channel", result.getLabelField());

		Map<String, Object> ds = result.getDatasets().get(0);
		assertEquals("SatisfactionScore", ds.get("field"));

		@SuppressWarnings("unchecked")
		List<String> bgColors = (List<String>) ds.get("backgroundColor");
		assertEquals(5, bgColors.size());

		@SuppressWarnings("unchecked")
		Map<String, Object> rAxis = (Map<String, Object>) ((Map<String, Object>) result.getOptions().get("scales")).get("r");
		assertEquals(true, rAxis.get("beginAtZero"));
		assertEquals(100, rAxis.get("max"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// SYNTAX SHORTCUTS & EDGE CASES
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// #12 Quick Ad-Hoc Report — Compact Map-Style Series Shorthand
	//     When a user just wants a quick chart and doesn't need to configure every
	//     property — uses the compact series field: 'x', label: 'Y' notation
	//     instead of closure blocks.
	//     Used by: Any app type — quick ad-hoc reports, prototyping, one-off charts
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testCompactMapStyleSeriesShorthand() throws Exception {
		String dsl = "chart {\n" +
			"  type 'bar'\n" +
			"  labelField 'Product'\n" +
			"  series {\n" +
			"    series field: 'UnitsSold', label: 'Units Sold', backgroundColor: '#4e79a7'\n" +
			"    series field: 'Revenue', label: 'Revenue ($)', backgroundColor: '#e15759', type: 'line'\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		assertEquals("bar", result.getType());
		assertEquals("Product", result.getLabelField());

		List<Map<String, Object>> datasets = result.getDatasets();
		assertEquals(2, datasets.size());

		assertEquals("UnitsSold", datasets.get(0).get("field"));
		assertEquals("Units Sold", datasets.get(0).get("label"));
		assertEquals("#4e79a7", datasets.get(0).get("backgroundColor"));

		assertEquals("Revenue", datasets.get(1).get("field"));
		assertEquals("line", datasets.get(1).get("type"));
		assertEquals("#e15759", datasets.get(1).get("backgroundColor"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #13 Edge Case — Empty/Null DSL Returns Empty Options
	//     Used by: Internal — guards against misconfigured or missing .groovy files
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testEmptyDslReturnsEmptyOptions() throws Exception {
		ChartOptions resultEmpty = ChartOptionsParser.parseGroovyChartDslCode("");
		assertNotNull(resultEmpty);
		assertNull(resultEmpty.getType());
		assertTrue(resultEmpty.getDatasets().isEmpty());

		ChartOptions resultNull = ChartOptionsParser.parseGroovyChartDslCode(null);
		assertNotNull(resultNull);
		assertNull(resultNull.getType());
		assertTrue(resultNull.getDatasets().isEmpty());
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// #14 Future-Proofing — Unknown Chart.js Properties Pass Through
	//     If Chart.js releases a new dataset property or plugin option tomorrow,
	//     our DSL handles it today via methodMissing catch-alls — no code changes
	//     needed in ChartOptionsScript.
	//     Used by: Any app type — ensures zero-maintenance compatibility with Chart.js upgrades
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testFutureChartJsPropertiesPassThrough() throws Exception {
		String dsl = "chart {\n" +
			"  type 'bar'\n" +
			"  labelField 'X'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Y'\n" +
			"      label 'Data'\n" +
			"      someNewDatasetProp 'value1'\n" +
			"      anotherFutureProp 42\n" +
			"      yetAnotherProp true\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    futureTopLevelOption 'enabled'\n" +
			"    plugins {\n" +
			"      futurePlugin { activated true; threshold 0.5 }\n" +
			"    }\n" +
			"  }\n" +
			"}";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		// Series-level methodMissing: unknown properties pass through
		Map<String, Object> ds = result.getDatasets().get(0);
		assertEquals("value1", ds.get("someNewDatasetProp"));
		assertEquals(42, ds.get("anotherFutureProp"));
		assertEquals(true, ds.get("yetAnotherProp"));

		// Chart-level options: unknown properties pass through
		Map<String, Object> opts = result.getOptions();
		assertEquals("enabled", opts.get("futureTopLevelOption"));

		// Nested unknown plugin: pass through as map
		@SuppressWarnings("unchecked")
		Map<String, Object> futurePlugin = (Map<String, Object>) ((Map<String, Object>) opts.get("plugins")).get("futurePlugin");
		assertEquals(true, futurePlugin.get("activated"));
		assertEquals(new java.math.BigDecimal("0.5"), futurePlugin.get("threshold"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// AGGREGATOR REPORTS — Named blocks for multi-component dashboards
	// ═════════════════════════════════════════════════════════════════════════════

	// ─────────────────────────────────────────────────────────────────────────────
	// Named Chart Blocks — Multi-Component Dashboard Pattern
	//     When a single report needs multiple charts side-by-side (e.g., a
	//     dashboard with a revenue bar chart AND a monthly trend line chart),
	//     each chart block gets a unique string ID. The parser stores each named
	//     block independently in namedOptions, leaving the unnamed defaults empty.
	//     Used by: Multi-component reports, aggregator dashboards — see
	//     /docs/bi-analytics/dashboards#multi-component-reports
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testNamedChartBlocks() throws Exception {
		String dsl =
			"chart('revenueChart') {\n" +
			"  type 'bar'\n" +
			"  labelField 'Region'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Revenue'\n" +
			"      label 'Revenue ($)'\n" +
			"      backgroundColor '#4e79a7'\n" +
			"    }\n" +
			"  }\n" +
			"  options {\n" +
			"    responsive true\n" +
			"    plugins {\n" +
			"      title { display true; text 'Revenue by Region' }\n" +
			"    }\n" +
			"  }\n" +
			"}\n" +
			"\n" +
			"chart('trendChart') {\n" +
			"  type 'line'\n" +
			"  labelField 'Month'\n" +
			"  series {\n" +
			"    series {\n" +
			"      field 'Sales'\n" +
			"      label 'Monthly Sales'\n" +
			"      borderColor '#e15759'\n" +
			"      tension 0.3\n" +
			"    }\n" +
			"  }\n" +
			"}\n";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		// Unnamed options should be empty (no unnamed chart block)
		assertNull(result.getType());

		// Named options should have 2 entries
		Map<String, ChartOptions> named = result.getNamedOptions();
		assertEquals(2, named.size());

		// Verify revenueChart
		ChartOptions revenue = named.get("revenueChart");
		assertNotNull(revenue);
		assertEquals("bar", revenue.getType());
		assertEquals("Region", revenue.getLabelField());
		assertEquals(1, revenue.getDatasets().size());
		assertEquals("Revenue", revenue.getDatasets().get(0).get("field"));
		Map<String, Object> revOpts = revenue.getOptions();
		assertEquals(true, revOpts.get("responsive"));

		// Verify trendChart
		ChartOptions trend = named.get("trendChart");
		assertNotNull(trend);
		assertEquals("line", trend.getType());
		assertEquals("Month", trend.getLabelField());
		assertEquals(1, trend.getDatasets().size());
		assertEquals("Sales", trend.getDatasets().get(0).get("field"));
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Mixed Unnamed + Named Blocks — Coexistence Pattern
	//     A report can have ONE unnamed chart block (the default/primary
	//     visualization) alongside one or more named blocks. The unnamed block
	//     populates the root-level DTO fields (type, labelField, etc.); named
	//     blocks populate namedOptions. This pattern is used when a report has a
	//     main chart plus supplementary detail charts embedded alongside it.
	//     Used by: Reports that need a primary view plus secondary detail views
	// ─────────────────────────────────────────────────────────────────────────────
	@Test
	public void testMixedUnnamedAndNamedChartBlocks() throws Exception {
		String dsl =
			"chart {\n" +
			"  type 'pie'\n" +
			"  labelField 'Category'\n" +
			"}\n" +
			"\n" +
			"chart('detailChart') {\n" +
			"  type 'bar'\n" +
			"  labelField 'Product'\n" +
			"  series {\n" +
			"    series { field 'Quantity'; label 'Qty' }\n" +
			"  }\n" +
			"}\n";

		ChartOptions result = ChartOptionsParser.parseGroovyChartDslCode(dsl);

		// Unnamed block should be populated
		assertEquals("pie", result.getType());
		assertEquals("Category", result.getLabelField());

		// Named block should also be populated
		assertEquals(1, result.getNamedOptions().size());
		ChartOptions detail = result.getNamedOptions().get("detailChart");
		assertNotNull(detail);
		assertEquals("bar", detail.getType());
		assertEquals(1, detail.getDatasets().size());
	}
}
