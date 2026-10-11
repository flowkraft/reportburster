package com.flowkraft.exploredata.export;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.flowkraft.queries.services.QueriesService;
import com.sourcekraft.documentburster.common.db.SeedScriptRunner;
import com.sourcekraft.documentburster.common.db.northwind.NorthwindFixture;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * A dashboard filter with nothing in it is not a filter: the rows come back as if it were not
 * there - on the canvas and on the published dashboard, which is the same question asked twice.
 *
 * <p>Both paths are run here against the frozen {@code cube_demo} rows on the two legs that need no
 * container. The canvas path is {@code QueriesService.prepare} followed by JDBI, the production
 * path; the published path is the script {@link ScriptAssembler} writes, run through a GroovyShell
 * on the same connection. The three answers - 1,200 with nothing filled in, 394 and 425 with one
 * filter filled in - are the frozen data's own (the AI Hub cases p1d and p1a of
 * {@code truths-ai-hub.out}, and the 1,200 rows of {@code crm_deals.psv}), and both paths are held
 * to all three.
 */
class EmptyParameterMeansNoFilterTest {

	private static final String DB_TEMPLATE_DB = "../../asbl/src/main/external-resources/db-template/db";

	/** Every deal: what an unfiltered question answers (crm_deals.psv). */
	private static final int ALL_DEALS = 1200;

	/** Over 31999.99, all of them, whenever the close date is not filtered (case p1d). */
	private static final int DEALS_OVER_AMOUNT = 394;

	/** Closing on or before 2026-01-31, whatever the amount (case p1a). */
	private static final int DEALS_BY_DATE = 425;

	/** Deals at one stage, and at two: {@code crm_deals.psv} counted by its {@code stage} column
	 *  (Closed Won 402, Negotiation 189, and the four other stages making the 1,200 up). */
	private static final int DEALS_CLOSED_WON = 402;
	private static final int DEALS_CLOSED_WON_OR_NEGOTIATION = 402 + 189;

	/** The stages the frozen deals really sit at: what a pane on that field lists. */
	private static final List<String> STAGES = List.of("Closed Lost", "Closed Won", "Negotiation",
			"Proposal", "Prospecting", "Qualification");

	/**
	 * What a filter pane does to the widget beside it, as the canvas writes it: the widget's own
	 * query with one condition per pane field, bound to the pane's own parameter. Nothing is
	 * declared on the parameters tab for it - a pane parameter is the pane's, not the author's - so
	 * this is also the proof that the assembler finds it in the SQL itself.
	 */
	private static final String PANE_FILTERED_SQL = "SELECT COUNT(*) AS deal_count\n"
			+ "FROM cube_demo.crm_deals\n"
			+ "WHERE stage IN (${__pane_stage})";

	/** The pane's own question: the values of its field, which is all a pane ever asks. */
	private static final String PANE_VALUES_SQL = "SELECT DISTINCT stage\n"
			+ "FROM cube_demo.crm_deals\n"
			+ "WHERE stage IS NOT NULL\n"
			+ "ORDER BY stage";

	/**
	 * The same question with the OTHER pane's pick applied, which is how a published pane greys out:
	 * the list it gets while nothing is picked is every value it can show, and the shorter list it
	 * gets once the other pane has a pick is the values that still answer rows - the difference is
	 * the greys. Its own field is never in its own query, so its own pick never shortens its own
	 * list (`paneNarrowingLines` in the canvas writes both of these).
	 */
	private static final String PANE_VALUES_SQL_STAGE = "SELECT DISTINCT stage\n"
			+ "FROM cube_demo.crm_deals\n"
			+ "WHERE stage IS NOT NULL\n"
			+ "AND probability_pct IN (${__pane_probability_pct})\n"
			+ "ORDER BY stage";

	private static final String PANE_VALUES_SQL_PROBABILITY = "SELECT DISTINCT probability_pct\n"
			+ "FROM cube_demo.crm_deals\n"
			+ "WHERE probability_pct IS NOT NULL\n"
			+ "AND stage IN (${__pane_stage})\n"
			+ "ORDER BY probability_pct";

	/** The probabilities the frozen deals sit at, one per stage: 0 Closed Lost, 10 Prospecting,
	 *  25 Qualification, 50 Proposal, 75 Negotiation, 100 Closed Won (crm_deals.psv). */
	private static final List<String> PROBABILITIES = List.of("0", "10", "25", "50", "75", "100");

	/**
	 * The shape the Visualize step writes: one condition per line, the first carrying the WHERE and
	 * the rest joined with AND - a date, a number and a list, each bound to a dashboard parameter.
	 */
	private static final String SQL = "SELECT COUNT(*) AS deal_count\n"
			+ "FROM cube_demo.crm_deals\n"
			+ "WHERE close_date <= ${to}\n"
			+ "  AND amount > ${min}\n"
			+ "  AND stage IN (${stages})";

	private static final Map<String, String> TYPES = Map.of("to", "Date", "min", "Double");

	@TempDir
	Path tempDir;

	@Test
	void ansi_an_empty_date_number_or_list_parameter_leaves_its_filter_out() throws Exception {
		for (String vendor : List.of("duckdb", "sqlite")) {
			try (Connection connection = open(vendor)) {

				// Nothing filled in: three filters, none of them applied, every deal.
				assertEquals(ALL_DEALS, onCanvas(connection, values("", "", "")),
						vendor + ", canvas: no value in any of the three filters, so none is applied");

				// The amount filled in, the date and the list still empty. This is the line the
				// WHERE sits on being left out: what is left has to keep asking a whole question.
				assertEquals(DEALS_OVER_AMOUNT, onCanvas(connection, values("", "31999.99", "")),
						vendor + ", canvas: only the amount filter is applied");

				// The other way round: the first filter applied, the two after it left out.
				assertEquals(DEALS_BY_DATE, onCanvas(connection, values("2026-01-31", "", "")),
						vendor + ", canvas: only the date filter is applied");
			}
		}
	}

	@Test
	void ansi_the_published_dashboard_answers_the_same_as_the_canvas() throws Exception {
		for (String vendor : List.of("duckdb", "sqlite")) {
			try (Connection connection = open(vendor)) {

				assertEquals(ALL_DEALS, published(connection, values("", "", "")),
						vendor + ", published: no value in any of the three filters");
				assertEquals(DEALS_OVER_AMOUNT, published(connection, values("", "31999.99", "")),
						vendor + ", published: only the amount filter is applied");
				assertEquals(DEALS_BY_DATE, published(connection, values("2026-01-31", "", "")),
						vendor + ", published: only the date filter is applied");
			}
		}
	}

	/**
	 * A filter pane is the same rule as a filter bar, on a parameter the author never declared:
	 * nothing picked is every row, one value picked narrows to that value, two values OR together.
	 * The pane itself lists its field's values whatever is picked - a pane that lost the values it
	 * had just dimmed would be a pane nobody can click twice.
	 */
	@Test
	void ansi_a_pane_filters_the_published_dashboard_and_nothing_picked_is_every_row() throws Exception {
		for (String vendor : List.of("duckdb", "sqlite")) {
			try (Connection connection = open(vendor)) {

				assertEquals(ALL_DEALS, underPane(connection, ""),
						vendor + ", published: nothing picked in the pane, so every deal");
				assertEquals(DEALS_CLOSED_WON, underPane(connection, "Closed Won"),
						vendor + ", published: one value picked");
				assertEquals(DEALS_CLOSED_WON_OR_NEGOTIATION, underPane(connection, "Closed Won,Negotiation"),
						vendor + ", published: two values of one pane OR together");
			}
		}
	}

	/** The pane's own value list is its field's values, whatever is picked in it. */
	@Test
	void ansi_a_published_pane_lists_its_values_whatever_is_picked() throws Exception {
		try (Connection connection = open("duckdb")) {
			for (String picked : List.of("", "Closed Won")) {
				assertEquals(STAGES, paneValues(connection, picked),
						"the pane lists every stage, with '" + picked + "' picked");
			}
		}
	}

	/**
	 * Two panes on one table: each one's list is narrowed by the other's pick and never by its own.
	 *
	 * This is the whole of the published grey-outs. The canvas asks `/api/analytics/explore` which
	 * values still answer rows; a published dashboard may not (that endpoint answers to report
	 * authors, and it reads the table past the values a share link locked), so a published pane
	 * reads it off its own list instead. The frozen deals make the answer exact: every stage sits at
	 * one probability, so picking 100 leaves one stage, and picking Negotiation leaves one
	 * probability.
	 */
	@Test
	void ansi_two_published_panes_narrow_each_other_and_never_themselves() throws Exception {
		for (String vendor : List.of("duckdb", "sqlite")) {
			try (Connection connection = open(vendor)) {

				// Nothing picked anywhere: each pane lists every value it can ever show, which is
				// the list its greys are measured against.
				assertEquals(STAGES, listedBy(connection, "filter-pane_stage_p", "", ""),
						vendor + ": nothing picked, so the stage pane lists every stage");
				assertEquals(PROBABILITIES, listedBy(connection, "filter-pane_probability_pct_q", "", ""),
						vendor + ": nothing picked, so the probability pane lists every probability");

				// One pane picked: the other pane's list is down to what still answers rows, and
				// the picked pane's own list is untouched - or a reader could not pick twice.
				assertEquals(List.of("Closed Won"), listedBy(connection, "filter-pane_stage_p", "", "100"),
						vendor + ": 100 picked in the probability pane, so one stage still answers");
				assertEquals(PROBABILITIES, listedBy(connection, "filter-pane_probability_pct_q", "", "100"),
						vendor + ": a pane's own pick leaves its own list whole");

				assertEquals(List.of("75"), listedBy(connection, "filter-pane_probability_pct_q", "Negotiation", ""),
						vendor + ": Negotiation picked in the stage pane, so one probability still answers");
				assertEquals(STAGES, listedBy(connection, "filter-pane_stage_p", "Negotiation", ""),
						vendor + ": and the stage pane still lists every stage");

				// Two values of one pane OR together here too: two stages, two probabilities.
				assertEquals(List.of("75", "100"),
						listedBy(connection, "filter-pane_probability_pct_q", "Negotiation,Closed Won", ""),
						vendor + ": two stages picked, so both their probabilities still answer");
			}
		}
	}

	/** The assembled script declares the pane's parameter and guards the line it sits on. */
	@Test
	void the_assembled_script_declares_the_pane_parameter_nobody_declared() throws Exception {
		String script = ScriptAssembler.assemble(paneCanvas(), List.of()).text();
		assertTrue(script.contains("def __pane_stage = userVars?.get('__pane_stage')?.toString()"),
				"the pane's parameter is read from the request like any other filter value:\n" + script);
		assertTrue(script.contains("if (has__pane_stage && listHasValues(__pane_stage))"),
				"and the line it sits on is only written when something is picked:\n" + script);
		assertTrue(script.contains("WHERE 1=1"),
				"with nothing picked the query keeps asking a whole question:\n" + script);
	}

	// ── The two paths ────────────────────────────────────────────────────────────

	/** What the canvas asks: the production {@code prepare}, then JDBI, on this connection. */
	private static long onCanvas(Connection connection, Map<String, Object> values) {
		QueriesService.PreparedSql prepared = QueriesService.prepare(SQL, values, TYPES);
		org.jdbi.v3.core.Jdbi jdbi = com.sourcekraft.documentburster.common.reportparameters.ParameterArguments
				.install(org.jdbi.v3.core.Jdbi.create(() -> notClosing(connection)));
		try (org.jdbi.v3.core.Handle handle = jdbi.open()) {
			org.jdbi.v3.core.statement.Query query = handle.createQuery(prepared.sql());
			if (prepared.params() != null) {
				for (Map.Entry<String, Object> bind : prepared.params().entrySet()) {
					if (bind.getValue() instanceof List<?> list) query.bindList(bind.getKey(), list);
					else query.bind(bind.getKey(), bind.getValue());
				}
			}
			return query.mapTo(Long.class).one();
		}
	}

	/** What the published dashboard asks: the assembled script, on the same connection. */
	@SuppressWarnings("unchecked")
	private static long published(Connection connection, Map<String, Object> values) throws Exception {

		Map<String, Object> dataSource = new LinkedHashMap<>();
		dataSource.put("mode", "sql");
		dataSource.put("sql", SQL);
		Map<String, Object> widget = new LinkedHashMap<>();
		widget.put("id", "w-a");
		widget.put("type", "tabulator");
		widget.put("dataSource", dataSource);

		List<Map<String, Object>> parameters = new ArrayList<>();
		parameters.add(Map.of("id", "to", "type", "Date"));
		parameters.add(Map.of("id", "min", "type", "Double"));
		parameters.add(Map.of("id", "stages"));
		String script = ScriptAssembler.assemble(List.of(widget), parameters).text();

		Map<String, List<Map<String, Object>>> reported = run(connection, script, values);

		List<Map<String, Object>> rows = reported.get("tabulator_a");
		if (rows == null || rows.isEmpty()) {
			throw new IllegalStateException("the widget reported no rows: " + reported);
		}
		return ((Number) rows.get(0).values().iterator().next()).longValue();
	}

	/** The canvas a pane makes: a KPI on a table and a pane on one of its fields. */
	private static List<Map<String, Object>> paneCanvas() {

		Map<String, Object> filteredSource = new LinkedHashMap<>();
		filteredSource.put("mode", "visual");
		// What the widget ran before any pane was added - left in on purpose: a pane must not be
		// able to change what a widget asks except through paneSql.
		filteredSource.put("generatedSql", "SELECT COUNT(*) AS deal_count\nFROM cube_demo.crm_deals");
		filteredSource.put("paneSql", PANE_FILTERED_SQL);
		Map<String, Object> kpi = new LinkedHashMap<>();
		kpi.put("id", "w-a");
		kpi.put("type", "number");
		kpi.put("dataSource", filteredSource);

		Map<String, Object> paneSource = new LinkedHashMap<>();
		paneSource.put("mode", "visual");
		paneSource.put("paneValuesSql", PANE_VALUES_SQL);
		Map<String, Object> pane = new LinkedHashMap<>();
		pane.put("id", "w-p");
		pane.put("type", "filter-pane");
		pane.put("dataSource", paneSource);
		pane.put("displayConfig", Map.of("dslConfig", Map.of("field", "stage")));

		return List.of(kpi, pane);
	}

	/** The KPI's number on a published dashboard whose pane is picked at these values. */
	private static long underPane(Connection connection, String picked) throws Exception {
		Map<String, Object> values = new LinkedHashMap<>();
		values.put("__pane_stage", picked);
		Map<String, List<Map<String, Object>>> reported = runPublished(connection, values);
		List<Map<String, Object>> rows = reported.get("number_a");
		if (rows == null || rows.isEmpty())
			throw new IllegalStateException("the KPI reported no rows: " + reported);
		return ((Number) rows.get(0).values().iterator().next()).longValue();
	}

	/** The values the published pane itself was handed, in the order it got them. */
	private static List<String> paneValues(Connection connection, String picked) throws Exception {
		Map<String, Object> values = new LinkedHashMap<>();
		values.put("__pane_stage", picked);
		Map<String, List<Map<String, Object>>> reported = runPublished(connection, values);
		List<Map<String, Object>> rows = reported.get("filter-pane_stage_p");
		if (rows == null)
			throw new IllegalStateException("the pane reported nothing: " + reported);
		List<String> listed = new ArrayList<>();
		for (Map<String, Object> row : rows)
			listed.add(String.valueOf(row.values().iterator().next()));
		return listed;
	}

	/**
	 * A canvas with two panes on one table, each listing its own field under the other's pick.
	 *
	 * @param id    the widget id, which decides the component id the published pane reports under
	 * @param field the field the pane filters by
	 * @param sql   the pane's own value query
	 */
	private static Map<String, Object> pane(String id, String field, String sql) {
		Map<String, Object> source = new LinkedHashMap<>();
		source.put("mode", "visual");
		source.put("paneValuesSql", sql);
		Map<String, Object> pane = new LinkedHashMap<>();
		pane.put("id", id);
		pane.put("type", "filter-pane");
		pane.put("dataSource", source);
		pane.put("displayConfig", Map.of("dslConfig", Map.of("field", field)));
		return pane;
	}

	private static List<Map<String, Object>> twoPaneCanvas() {
		List<Map<String, Object>> widgets = new ArrayList<>(paneCanvas());
		widgets.set(1, pane("w-p", "stage", PANE_VALUES_SQL_STAGE));
		widgets.add(pane("w-q", "probability_pct", PANE_VALUES_SQL_PROBABILITY));
		return widgets;
	}

	/** What one pane of the two-pane dashboard listed, with these values picked in each pane. */
	private static List<String> listedBy(Connection connection, String componentId, String stagePicked,
			String probabilityPicked) throws Exception {
		Map<String, Object> values = new LinkedHashMap<>();
		values.put("__pane_stage", stagePicked);
		values.put("__pane_probability_pct", probabilityPicked);
		String script = ScriptAssembler.assemble(twoPaneCanvas(), List.of()).text();
		Map<String, List<Map<String, Object>>> reported = run(connection, script, values);
		List<Map<String, Object>> rows = reported.get(componentId);
		if (rows == null)
			throw new IllegalStateException(componentId + " reported nothing: " + reported);
		List<String> listed = new ArrayList<>();
		for (Map<String, Object> row : rows)
			listed.add(String.valueOf(row.values().iterator().next()));
		return listed;
	}

	/** The pane canvas published and run: what each of its widgets reported. */
	private static Map<String, List<Map<String, Object>>> runPublished(Connection connection,
			Map<String, Object> values) throws Exception {
		String script = ScriptAssembler.assemble(paneCanvas(), List.of()).text();
		return run(connection, script, values);
	}

	/**
	 * One published script, run the way the server runs it: {@code ctx.dbSql} on this connection,
	 * the request's values as the viewer's variables, and {@code ctx.reportData} collecting what
	 * each widget reported.
	 */
	private static Map<String, List<Map<String, Object>>> run(Connection connection, String script,
			Map<String, Object> values) {

		Binding binding = new Binding();
		Map<String, List<Map<String, Object>>> reported = new LinkedHashMap<>();
		binding.setVariable("reported", reported);
		binding.setVariable("userVarsIn", new LinkedHashMap<>(values));
		binding.setVariable("connectionIn", notClosing(connection));
		GroovyShell shell = new GroovyShell(binding);
		binding.setVariable("ctx", shell.evaluate("""
				def dbSql = new groovy.sql.Sql(connectionIn)
				def vars = new Expando()
				vars.get = { k -> null }
				vars.getUserVariables = { t -> userVarsIn }
				def ctx = new Expando(dbSql: dbSql, variables: vars, token: '')
				ctx.reportData = { id, rows -> reported[id] = rows }
				ctx
				"""));
		shell.evaluate(script);
		return reported;
	}

	// ── Helpers ──────────────────────────────────────────────────────────────────

	/** The three filter-bar values, as text - which is all an HTML control ever writes. */
	private static Map<String, Object> values(String to, String min, String stages) {
		Map<String, Object> values = new LinkedHashMap<>();
		values.put("to", to);
		values.put("min", min);
		values.put("stages", stages);
		return values;
	}

	/**
	 * A handle closes its connection when it closes; this is the one connection of the throwaway
	 * database, so it is handed over as a proxy that ignores close().
	 */
	private static Connection notClosing(Connection connection) {
		return (Connection) java.lang.reflect.Proxy.newProxyInstance(
				EmptyParameterMeansNoFilterTest.class.getClassLoader(), new Class<?>[] { Connection.class },
				(proxy, method, arguments) -> {
					if ("close".equals(method.getName())) return null;
					try {
						return method.invoke(connection, arguments);
					} catch (java.lang.reflect.InvocationTargetException wrapped) {
						throw wrapped.getCause();
					}
				});
	}

	/** A throwaway database of this vendor, carrying the frozen {@code cube_demo} rows. */
	private Connection open(String vendor) throws Exception {

		if ("duckdb".equals(vendor)) {
			return DriverManager.getConnection("jdbc:duckdb:"
					+ NorthwindFixture.writableCopy(tempDir.resolve("northwind.duckdb")).toAbsolutePath());
		}

		Path main = NorthwindFixture.writableSqliteCopy(tempDir.resolve("northwind.db"));
		Connection connection = DriverManager
				.getConnection("jdbc:sqlite:" + main.toAbsolutePath().toString().replace("\\", "/"));
		try (Statement statement = connection.createStatement()) {
			statement.execute("ATTACH DATABASE '"
					+ tempDir.resolve("cube-demo.db").toAbsolutePath().toString().replace("\\", "/")
					+ "' AS cube_demo");
		}

		Path script = Paths.get(DB_TEMPLATE_DB, "scripts", "cube-demo-data.groovy");
		if (!Files.exists(script)) {
			throw new IllegalStateException("The seed script is missing: " + script.toAbsolutePath());
		}
		SeedScriptRunner.run(connection, vendor.toUpperCase(Locale.ROOT), script,
				NorthwindFixture.cubeDemoSeedParams(script.getParent().resolve("cube-demo-data")));
		return connection;
	}
}
