package com.flowkraft.cubes;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.flowkraft.reporting.dsl.cube.CubeOptions;
import com.flowkraft.reporting.dsl.cube.CubeOptionsParser;
import com.sourcekraft.documentburster.common.db.northwind.NorthwindFixture;

/**
 * Every measure of the dashboards cubes answers the number the demo data's truths hold.
 *
 * <p>CubeSampleSqlExecutesTest sweeps these cubes too, but it only asks whether the generated SQL
 * runs: a measure that sums the wrong column, or one whose filter says {@code = 'overdue'} where
 * the truths say {@code IN ('open', 'overdue', 'partially_paid')}, runs perfectly well and answers
 * a number nobody notices is wrong. So this test takes each measure on its own, generates its SQL
 * the way a widget does, runs it on the fixture's DuckDB - the same database the package ships,
 * built by the same code path - and compares the answer with a number written here by hand from
 * the frozen rows.
 *
 * <p>The truths are the dashboards demo data's own conventions, the ones
 * {@code truths_dashboards_demo.py} and every checks file use: a sale is an order whose status is
 * not {@code cancelled}, an open invoice is one of {@code open}, {@code overdue} or
 * {@code partially_paid}, and what was billed is the amount and the tax together. A cube that
 * drifted from them would show a dashboard one number and the demo's own checks another.
 *
 * <p>The totals are the same whenever this runs: the seed shifts the rows by whole 364-day steps,
 * so a row moves but no row appears or disappears, and a sum over all of them does not move. The
 * splits are by a joined field - the customer's segment, the invoice's status, the agent's team -
 * so they also prove the joins bring the right row, and that a many-to-one join multiplies
 * nothing: dd-sales' Revenue split three ways still adds up to the total above it.
 */
class DashboardsDemoCubeMeasuresTest {

	private static final String CUBES_DIR =
			"../../asbl/src/main/external-resources/db-template/config/samples-cubes/dashboard-demos";

	/** The day the frozen rows call today (R7), the day the fixture seeds them for. */
	private static final LocalDate PINNED_TODAY = LocalDate.of(2026, 9, 30);

	/**
	 * Money and counts agree to the cent; a ratio is a fraction, so it gets its own tolerance. An
	 * average is read back as the generator casts it, DECIMAL(31,4), so its truth is written with
	 * the same four decimals rather than pretending the engine hands back more.
	 */
	private static final double CENT = 0.011;
	private static final double RATIO = 0.000001;
	private static final double FOUR_DECIMALS = 0.00011;

	/** The dashboards cubes, every one of them: a cube left out here would ship unchecked. */
	private static final List<String> CUBES = List.of("dd-sales", "dd-finance", "dd-support", "dd-delivery",
			"dd-crm", "dd-people", "dd-inventory", "dd-web");

	/**
	 * Every measure of every cube, alone, with the number the frozen rows hold. The map is also the
	 * list: a measure added to a cube with no truth written here fails
	 * {@link #everyMeasureIsAccountedFor()}, so a new measure cannot ship unchecked.
	 */
	private static final Map<String, Map<String, Double>> TRUTHS = Map.of(
			"dd-sales", new LinkedHashMap<>(Map.of(
					"Revenue", 54411955.71,
					"Cost", 36466647.26,
					"GrossProfit", 17945308.45,
					"MarginPct", 0.329805,
					"Qty", 137497.0,
					"Orders", 23492.0)),
			"dd-finance", new LinkedHashMap<>(Map.of(
					"Billed", 29172759.59,
					"OpenAmount", 1637606.29,
					"OverdueAmount", 201658.32,
					"Invoices", 8933.0)),
			"dd-support", new LinkedHashMap<>(Map.of(
					"Tickets", 14000.0,
					"OpenTickets", 127.0,
					"AvgFirstResponseMinutes", 836.5481,
					"AvgCsat", 4.0089)),
			"dd-delivery", new LinkedHashMap<>(Map.of(
					"Orders", 24000.0,
					"Delivered", 23355.0,
					"Late", 1557.0,
					"OnTimePct", 0.933333,
					"Returned", 1432.0,
					"ReturnRatePct", 0.059667)),
			"dd-crm", new LinkedHashMap<>(Map.of(
					"Opportunities", 2400.0,
					"Won", 718.0,
					"Lost", 1397.0,
					"WinRatePct", 0.339480,
					"WonAmount", 14579254.00,
					"Pipeline", 5255334.00)),
			"dd-people", new LinkedHashMap<>(Map.of(
					"Employees", 260.0,
					"Headcount", 209.0,
					"Leavers", 51.0,
					"LeaverRatePct", 0.196154,
					"AvgSalary", 45873.2057)),
			"dd-inventory", new LinkedHashMap<>(Map.of(
					"StockLines", 1000.0,
					"OnHand", 279650.0,
					"StockValue", 77966532.24,
					"BelowReorder", 14.0,
					"BelowReorderPct", 0.014)),
			"dd-web", new LinkedHashMap<>(Map.of(
					"Sessions", 60000.0,
					"ReachedCheckout", 3964.0,
					"Purchases", 2263.0,
					"ConversionPct", 0.037717,
					"CheckoutConversionPct", 0.570888,
					"AvgPages", 3.3456,
					"AvgDurationSec", 148.6642)));

	/** One split per cube that has joins (dd-web has none), by a field that only a join can reach. */
	private static final List<Split> SPLITS = List.of(
			new Split("dd-sales", "Segment", List.of("Revenue", "Orders"), Map.of(
					"Consumer", List.of(30116133.44, 18317.0),
					"Enterprise", List.of(12901885.95, 1414.0),
					"SMB", List.of(11393936.32, 3761.0))),
			new Split("dd-finance", "Status", List.of("Invoices", "Billed"), Map.of(
					"open", List.of(515.0, 1428333.84),
					"overdue", List.of(41.0, 201658.32),
					"paid", List.of(8372.0, 27535153.30),
					"partially_paid", List.of(5.0, 7614.13))),
			new Split("dd-support", "Team", List.of("Tickets", "OpenTickets"), Map.of(
					"Billing", List.of(3531.0, 26.0),
					"Returns", List.of(3547.0, 28.0),
					"Technical", List.of(3426.0, 37.0),
					"Tier 1", List.of(3496.0, 36.0))),
			new Split("dd-delivery", "Warehouse", List.of("Delivered", "Late"), Map.of(
					"Chicago DC", List.of(3960.0, 255.0),
					"Frankfurt DC", List.of(7561.0, 516.0),
					"Rotterdam DC", List.of(7376.0, 481.0),
					"Sao Paulo DC", List.of(1574.0, 109.0),
					"Tokyo DC", List.of(2884.0, 196.0))),
			new Split("dd-crm", "Segment", List.of("Won", "Lost"), Map.of(
					"Enterprise", List.of(189.0, 349.0),
					"SMB", List.of(529.0, 1048.0))),
			new Split("dd-people", "Department", List.of("Headcount", "Leavers"), Map.of(
					"Customer Support", List.of(26.0, 12.0),
					"Engineering", List.of(56.0, 6.0),
					"Finance", List.of(10.0, 2.0),
					"HR", List.of(6.0, 1.0),
					"Management", List.of(12.0, 2.0),
					"Marketing", List.of(14.0, 3.0),
					"Sales", List.of(39.0, 7.0),
					"Warehouse", List.of(46.0, 18.0))),
			new Split("dd-inventory", "Warehouse", List.of("OnHand", "StockValue"), Map.of(
					"Chicago DC", List.of(56320.0, 15816973.90),
					"Frankfurt DC", List.of(67450.0, 18242919.55),
					"Rotterdam DC", List.of(112800.0, 31969768.60),
					"Sao Paulo DC", List.of(18720.0, 5354447.86),
					"Tokyo DC", List.of(24360.0, 6582422.33))));

	/** A cube, the field it is split by, the measures read, and the row each value holds. */
	private static final class Split {
		private final String cube;
		private final String dimension;
		private final List<String> measures;
		private final Map<String, List<Double>> rows;

		private Split(String cube, String dimension, List<String> measures, Map<String, List<Double>> rows) {
			this.cube = cube;
			this.dimension = dimension;
			this.measures = measures;
			this.rows = rows;
		}
	}

	@Test
	void everyMeasureAnswersItsTruth() throws Exception {
		List<String> wrong = new ArrayList<>();
		try (Connection connection = NorthwindFixture.readOnly()) {
			for (String cubeId : CUBES) {
				CubeOptions cube = parse(cubeId);
				for (Map.Entry<String, Double> truth : TRUTHS.get(cubeId).entrySet()) {
					String measure = truth.getKey();
					String sql = sqlFor(cube, List.of(), List.of(measure));
					List<List<Double>> rows = numbers(connection, sql, 0, 1);
					if (rows.size() != 1) {
						wrong.add(cubeId + " / " + measure + ": " + rows.size() + " rows, expected 1\n" + sql);
						continue;
					}
					String complaint = complain(cubeId + " / " + measure, truth.getValue(),
							rows.get(0).get(0), tolerance(measure));
					if (complaint != null) wrong.add(complaint + "\n" + sql);
				}
			}
		}
		if (!wrong.isEmpty()) fail("A measure does not answer the demo data's truth:\n" + String.join("\n", wrong));
	}

	@Test
	void everyMeasureIsAccountedFor() throws Exception {
		Map<String, List<String>> missing = new LinkedHashMap<>();
		for (String cubeId : CUBES) {
			List<String> declared = new ArrayList<>();
			for (Map<String, Object> measure : parse(cubeId).getMeasures()) {
				declared.add(String.valueOf(measure.get("name")));
			}
			List<String> unchecked = new ArrayList<>(declared);
			unchecked.removeAll(TRUTHS.get(cubeId).keySet());
			if (!unchecked.isEmpty()) missing.put(cubeId, unchecked);
		}
		assertEquals(Map.of(), missing, "A measure with no truth behind it: " + missing);
	}

	@Test
	void everySplitAnswersItsTruth() throws Exception {
		List<String> wrong = new ArrayList<>();
		try (Connection connection = NorthwindFixture.readOnly()) {
			for (Split split : SPLITS) {
				CubeOptions cube = parse(split.cube);
				String sql = sqlFor(cube, List.of(split.dimension), split.measures);
				Map<String, List<Double>> answered = new LinkedHashMap<>();
				try (Statement statement = connection.createStatement();
						ResultSet rs = statement.executeQuery(sql)) {
					while (rs.next()) {
						List<Double> values = new ArrayList<>();
						for (int i = 0; i < split.measures.size(); i++) {
							values.add(number(rs.getObject(2 + i)));
						}
						answered.put(String.valueOf(rs.getObject(1)), values);
					}
				}
				if (!answered.keySet().equals(split.rows.keySet())) {
					wrong.add(split.cube + " by " + split.dimension + ": answered " + answered.keySet()
							+ ", expected " + split.rows.keySet() + "\n" + sql);
					continue;
				}
				for (Map.Entry<String, List<Double>> row : split.rows.entrySet()) {
					for (int i = 0; i < split.measures.size(); i++) {
						String what = split.cube + " / " + split.measures.get(i) + " of " + row.getKey();
						String complaint = complain(what, row.getValue().get(i),
								answered.get(row.getKey()).get(i), CENT);
						if (complaint != null) wrong.add(complaint + "\n" + sql);
					}
				}
			}
		}
		if (!wrong.isEmpty()) fail("A split does not answer the demo data's truth:\n" + String.join("\n", wrong));
	}

	/**
	 * The negative half: the comparison itself. A cent of drift is caught, and a number that is
	 * right is not complained about - without this, a comparison that always said nothing would
	 * make the three tests above pass whatever the cubes answered.
	 */
	@Test
	void aMeasureThatDriftedIsCaught() {
		assertNotNull(complain("dd-sales / Revenue", 54411955.71, 54411955.80, CENT),
				"Nine cents of drift is drift");
		assertNotNull(complain("dd-support / AvgCsat", 4.0089, 4.0100, FOUR_DECIMALS),
				"An average drifts sooner");
		assertNotNull(complain("dd-sales / MarginPct", 0.329805, 0.329900, RATIO), "A ratio sooner still");
		assertNotNull(complain("dd-finance / Billed", 29172759.59, null, CENT), "No answer at all");
		assertNull(complain("dd-sales / Revenue", 54411955.71, 54411955.71, CENT), "The truth itself");
	}

	/** What is wrong with an answer, or null when nothing is. */
	private static String complain(String what, Double expected, Double answered, double tolerance) {
		if (answered == null) return what + ": answered nothing, expected " + expected;
		if (Math.abs(expected - answered) > tolerance) {
			return what + ": answered " + answered + ", expected " + expected;
		}
		return null;
	}

	private static double tolerance(String measure) {
		if (measure.endsWith("Pct")) return RATIO;
		if (measure.startsWith("Avg")) return FOUR_DECIMALS;
		return CENT;
	}

	/** The SQL a widget runs: generated for DuckDB, with the cube's own parameters bound (R1). */
	private static String sqlFor(CubeOptions cube, List<String> dimensions, List<String> measures) {
		Map<String, Object> request = new LinkedHashMap<>();
		request.put("dimensions", dimensions);
		request.put("measures", measures);
		return CubeVariableBinding.bound(CubeSqlGenerator.buildQuery(cube, request, "duckdb"), Map.of(),
				DashboardParameters.values(List.of(), cube, Map.of(), () -> PINNED_TODAY), Map.of())
				.toInlineSql("duckdb");
	}

	private static List<List<Double>> numbers(Connection connection, String sql, int skip, int count)
			throws Exception {
		List<List<Double>> rows = new ArrayList<>();
		try (Statement statement = connection.createStatement(); ResultSet rs = statement.executeQuery(sql)) {
			while (rs.next()) {
				List<Double> values = new ArrayList<>();
				for (int i = 0; i < count; i++) {
					values.add(number(rs.getObject(skip + 1 + i)));
				}
				rows.add(values);
			}
		}
		return rows;
	}

	private static Double number(Object value) {
		if (value == null) return null;
		if (value instanceof BigDecimal) return ((BigDecimal) value).doubleValue();
		if (value instanceof Number) return ((Number) value).doubleValue();
		return Double.valueOf(String.valueOf(value));
	}

	private static CubeOptions parse(String cubeId) throws Exception {
		File config = new File(CUBES_DIR, cubeId + "-cube-config.groovy");
		if (!config.exists()) {
			throw new IllegalStateException("The cube is not there: " + config.getAbsolutePath());
		}
		return CubeOptionsParser.parseGroovyCubeDslCode(Files.readString(config.toPath()));
	}
}
