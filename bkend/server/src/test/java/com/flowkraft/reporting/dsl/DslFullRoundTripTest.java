package com.flowkraft.reporting.dsl;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.codehaus.groovy.control.CompilerConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowkraft.reporting.dsl.chart.ChartOptions;
import com.flowkraft.reporting.dsl.chart.ChartOptionsParser;
import com.flowkraft.reporting.dsl.chart.ChartOptionsScript;
import com.flowkraft.reporting.dsl.common.BlockFormEmitter;
import com.flowkraft.reporting.dsl.common.BlockFormRules;
import com.flowkraft.reporting.dsl.slicer.SlicerOptionsScript;
import com.flowkraft.reporting.dsl.pivottable.PivotTableOptionsScript;
import com.flowkraft.reporting.dsl.tabulator.TabulatorOptions;
import com.flowkraft.reporting.dsl.tabulator.TabulatorOptionsParser;
import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * Full round-trip tests for the DataPallas DSL emitter across all 5 widget types.
 *
 * <h2>Why these tests exist</h2>
 * <p>The parser tests ({@link TabulatorOptionsParserTest}, {@link ChartOptionsParserTest}, etc.)
 * cover only one direction: hand-crafted DSL text → Map. Nothing tested the emitter direction.
 * The D21 Playwright test caught the {@code formatterParams} bug because it exercised the
 * complete lifecycle: canvas author → publish → GET /config → Jackson serialize. A JUnit could
 * have caught it earlier if it tested emit → re-parse → compare.
 *
 * <h2>Coverage strategy (most bang for the test)</h2>
 * <p>For each widget type there are two tests:
 * <ol>
 *   <li><b>D21 simulation</b> — the exact g-dashboard DSL that exposes real production scenarios:
 *       money-formatted tabulator columns, chart color arrays, pivot sorting, full slicer
 *       surface, parameters with SQL-driven select. These are the scenarios where bugs hurt first.</li>
 *   <li><b>Parameterized over the canonical showcase file</b> — the shipped {@code *-examples-*.groovy}
 *       files that cover the full API surface of each underlying library (tabulator.info, Chart.js,
 *       react-pivottable). Catches any future emitter regression for any property combination in
 *       one parameterized sweep. No property names are enumerated — coverage comes from the example
 *       files, which grow as the API grows.</li>
 * </ol>
 *
 * <h2>What a passing test proves</h2>
 * <p>Each test asserts:
 * <ul>
 *   <li>Map equality: emit → re-parse produces the <em>same</em> options Map.</li>
 *   <li>Jackson-serializability: no Closure or delegate leaks through to the serialized DTO.</li>
 * </ul>
 * A Closure leak (the D21 bug class) fails both assertions loudly.
 *
 * @see com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme#iAmImportantReadme()
 */
public class DslFullRoundTripTest {

    static { com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme.iAmImportantReadme(); }

    // Maven sets user.dir to the module directory (bkend/server) during test runs.
    private static Path sampleFile(String relativePath) {
        return Paths.get(System.getProperty("user.dir"))
            .resolve("../../asbl/src/main/external-resources/db-template/config/samples/" + relativePath)
            .normalize();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // TABULATOR
    // ═════════════════════════════════════════════════════════════════════════════

    /** Exact content of
     *  {@code config/samples/g-dashboard/g-dashboard-tabulator-config.groovy}.
     *  Inlined so this test has no filesystem dependency. */
    private static final String G_DASHBOARD_TABULATOR_DSL =
        "tabulator('topCustomers') {\n" +
        "  layout \"fitColumns\"\n" +
        "  columns {\n" +
        "    column { title \"Company\"; field \"company\"; headerFilter \"input\"; widthGrow 2 }\n" +
        "    column { title \"Country\"; field \"country\"; headerFilter \"list\" }\n" +
        "    column { title \"Contact\"; field \"contact\" }\n" +
        "    column { title \"Orders\"; field \"orders\"; hozAlign \"right\"; sorter \"number\" }\n" +
        "    column { title \"Revenue\"; field \"revenue\"; hozAlign \"right\"; sorter \"number\"; formatter \"money\"; formatterParams([thousand: ',', symbol: '$', precision: 2]) }\n" +
        "  }\n" +
        "}";

    /**
     * D21 simulation — the exact tabulator DSL that exposed the Closure leak.
     *
     * <p>Before the fix, {@code formatterParams([...])} was emitted as a closure block.
     * Re-parse then stored a {@code Closure} instead of a {@code Map} in the
     * {@code ColumnDelegate}, causing Jackson to explode with "No serializer found
     * for {@code ColumnDelegate}" on the {@code GET /config} response.
     *
     * <p>This test proves the fix: {@code formatterParams} must survive as a
     * {@code Map}, not morph into a {@code Closure}, across the full
     * parse → emit → re-parse → serialize lifecycle.
     */
    @Test
    public void roundTrip_gDashboardTopCustomers() throws Exception {

        TabulatorOptions parsed1 = TabulatorOptionsParser.parseGroovyTabulatorDslCode(G_DASHBOARD_TABULATOR_DSL);
        @SuppressWarnings("unchecked")
        Map<String, Object> opts = parsed1.getNamedOptions().get("topCustomers");
        assertNotNull(opts, "namedOptions must contain 'topCustomers'");

        String emitted = BlockFormEmitter.emitNamed("tabulator", "topCustomers", opts,
                                                     BlockFormRules.TABULATOR, true);

        TabulatorOptions parsed2 = TabulatorOptionsParser.parseGroovyTabulatorDslCode(emitted);
        @SuppressWarnings("unchecked")
        Map<String, Object> opts2 = parsed2.getNamedOptions().get("topCustomers");
        assertNotNull(opts2, "re-parsed namedOptions must contain 'topCustomers'");

        assertEquals(opts, opts2, "Options map must be identical after round-trip");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cols = (List<Map<String, Object>>) opts2.get("columns");
        assertEquals(5, cols.size());
        Object fp = cols.get(4).get("formatterParams");
        assertInstanceOf(Map.class, fp,
            "formatterParams must be a Map after round-trip — a Closure means the emitter wrote a closure block");
        assertEquals(Map.of("thousand", ",", "symbol", "$", "precision", 2), fp);

        assertDoesNotThrow(() -> new ObjectMapper().writeValueAsString(opts2),
            "Round-tripped options must be Jackson-serializable — Closure delegates cause depth-limit explosions");
    }

    /**
     * Parameterized round-trip over every named block in the canonical tabulator showcase file.
     *
     * <p>The showcase covers all tabulator.info column and table properties used in real
     * dashboards: formatters, editors, validators, sorters, responsive layout, header filters,
     * etc. Because {@code ColumnDelegate} uses only {@code methodMissing}, these properties
     * all flow through the same generic path — one failing example names the broken property
     * combination precisely. Any new tabulator.info API surface added to the showcase file
     * is automatically covered by this test without code changes here.
     */
    @ParameterizedTest(name = "tabulator — {0}")
    @MethodSource("allTabExamples")
    @SuppressWarnings("unchecked")
    public void roundTrip_allTabExamples(String name, Map<String, Object> opts) throws Exception {

        String emitted = BlockFormEmitter.emitNamed("tabulator", name, opts,
                                                     BlockFormRules.TABULATOR, true);

        TabulatorOptions reparsed = TabulatorOptionsParser.parseGroovyTabulatorDslCode(emitted);
        Map<String, Object> opts2 = reparsed.getNamedOptions().get(name);
        assertNotNull(opts2, "Re-parsed namedOptions must contain '" + name + "'");

        assertEquals(opts, opts2, "Round-trip failed for tabulator example '" + name + "'");

        assertDoesNotThrow(() -> new ObjectMapper().writeValueAsString(opts2),
            "Jackson serialization failed for tabulator example '" + name + "'");
    }

    static Stream<Arguments> allTabExamples() {
        Path file = sampleFile("_frend/tab-examples/tab-examples-tabulator-config.groovy");
        try {
            String code = Files.readString(file);
            TabulatorOptions all = TabulatorOptionsParser.parseGroovyTabulatorDslCode(code);
            return all.getNamedOptions().entrySet().stream()
                .map(e -> Arguments.of(e.getKey(), e.getValue()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load tab-examples fixture: " + file, e);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // CHART
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * D21 chart simulation — the two charts from the g-dashboard sample.
     *
     * <p>{@code revenueTrend}: line chart with deeply nested {@code options} (plugins, scales).
     * Validates that the {@code NestedMapDelegate} recursion round-trips correctly through the emitter.
     *
     * <p>{@code revenueByCategory}: doughnut chart with a multi-element {@code backgroundColor}
     * list. Before the {@code BuilderBlock("dataset", true)} fix, this list was emitted as
     * {@code backgroundColor '#a', '#b', ...} (varargs). {@code DatasetDelegate.methodMissing}
     * then stored only {@code args[0]}, silently truncating the colour array.
     * After the fix, it is emitted as {@code backgroundColor(['#a', '#b', ...])} and the full
     * list survives.
     */
    @Test
    public void roundTrip_gDashboardCharts() throws Exception {
        Path file = sampleFile("g-dashboard/g-dashboard-chart-config.groovy");
        String dsl = Files.readString(file);
        Map<String, Map<String, Object>> namedOpts = parseChartRawNamed(dsl);

        for (Map.Entry<String, Map<String, Object>> e : namedOpts.entrySet()) {
            String name = e.getKey();
            Map<String, Object> opts = e.getValue();

            String emitted = BlockFormEmitter.emitNamed("chart", name, opts, BlockFormRules.CHART);
            Map<String, Map<String, Object>> reparsed = parseChartRawNamed(emitted);
            Map<String, Object> opts2 = reparsed.get(name);
            assertNotNull(opts2, "Re-parsed chart must contain '" + name + "'");

            assertEquals(opts, opts2,
                "Round-trip failed for g-dashboard chart '" + name + "'");
            assertDoesNotThrow(() -> new ObjectMapper().writeValueAsString(opts2),
                "Jackson serialization failed for chart '" + name + "'");
        }

        // Targeted check: revenueByCategory's 8-color array must survive intact.
        // datasets lives inside the nested data { } block (Chart.js canonical shape).
        @SuppressWarnings("unchecked")
        Map<String, Object> dataBlock =
            (Map<String, Object>) namedOpts.get("revenueByCategory").get("data");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> datasets = (List<Map<String, Object>>) dataBlock.get("datasets");
        @SuppressWarnings("unchecked")
        List<String> colors = (List<String>) datasets.get(0).get("backgroundColor");
        assertEquals(8, colors.size(),
            "All 8 backgroundColor colors must survive round-trip — varargs would truncate to 1");
    }

    /**
     * Parameterized round-trip over every named block in the canonical Chart.js showcase file.
     *
     * <p>The showcase covers 11 chart types and their Chart.js configuration options: line, bar,
     * grouped bar, stacked bar, pie, doughnut, horizontal bar, area, bubble, polar area, radar.
     * Because {@code DatasetDelegate} uses only {@code methodMissing} for all Chart.js dataset
     * properties, any new Chart.js API surface added to the showcase is automatically covered
     * without hardcoding property names here.
     */
    @ParameterizedTest(name = "chart — {0}")
    @MethodSource("allChartExamples")
    public void roundTrip_allChartExamples(String name, Map<String, Object> opts) throws Exception {

        String emitted = BlockFormEmitter.emitNamed("chart", name, opts, BlockFormRules.CHART);
        Map<String, Map<String, Object>> reparsed = parseChartRawNamed(emitted);
        Map<String, Object> opts2 = reparsed.get(name);
        assertNotNull(opts2, "Re-parsed chart must contain '" + name + "'");

        assertEquals(opts, opts2,
            "Round-trip failed for chart example '" + name + "'");
        assertDoesNotThrow(() -> new ObjectMapper().writeValueAsString(opts2),
            "Jackson serialization failed for chart example '" + name + "'");
    }

    static Stream<Arguments> allChartExamples() {
        Path file = sampleFile("_frend/charts-examples/charts-examples-chart-config.groovy");
        try {
            Map<String, Map<String, Object>> named = parseChartRawNamed(Files.readString(file));
            return named.entrySet().stream().map(e -> Arguments.of(e.getKey(), e.getValue()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load chart-examples fixture: " + file, e);
        }
    }

    /**
     * "Clicks filter the dashboard" survives the trip through the DSL text.
     *
     * <p>A chart, a table and a map each carry one tick that says a click on them selects the value
     * it stands for. The tick is a setting of the widget, kept in the widget's own DSL, so the
     * Display tab has to hand it back unchanged - otherwise a dashboard stops cross-filtering the
     * moment its author opens the editor and saves.
     *
     * <p>A chart's options are read key by key, so {@code clicksFilter} has an explicit setter
     * there; a table's whole map passes through, so it only has to be emitted and re-parsed. A
     * map's configuration is JSON and has no DSL text to lose it in.
     */
    @Test
    public void roundTrip_clicksFilter() throws Exception {
        Map<String, Object> chart = parseChartRawNamed(
            "chart('ordersByChannel') {\n" +
            "  type 'bar'\n" +
            "  clicksFilter true\n" +
            "  data { labelField 'channel'; datasets { dataset { field 'orders' } } }\n" +
            "}").get("ordersByChannel");
        assertEquals(Boolean.TRUE, chart.get("clicksFilter"), "the chart's tick is parsed");

        String emittedChart = BlockFormEmitter.emitNamed("chart", "ordersByChannel", chart,
                                                          BlockFormRules.CHART);
        assertEquals(chart, parseChartRawNamed(emittedChart).get("ordersByChannel"),
            "a chart's `clicksFilter` survives the round trip");

        Map<String, Object> table = TabulatorOptionsParser.parseGroovyTabulatorDslCode(
            "tabulator('orders') {\n" +
            "  clicksFilter true\n" +
            "  columns { column { field 'channel'; title 'Channel' } }\n" +
            "}").getNamedOptions().get("orders");
        assertEquals(Boolean.TRUE, table.get("clicksFilter"), "the table's tick is parsed");

        String emittedTable = BlockFormEmitter.emitNamed("tabulator", "orders", table,
                                                          BlockFormRules.TABULATOR, true);
        assertEquals(table, TabulatorOptionsParser.parseGroovyTabulatorDslCode(emittedTable)
                .getNamedOptions().get("orders"),
            "a table's `clicksFilter` survives the round trip");
    }

    /** The colour set an author picks for one chart travels in that chart's own DSL. */
    @Test
    public void roundTrip_chartPalette() throws Exception {
        Map<String, Object> chart = parseChartRawNamed(
            "chart('ordersByChannel') {\n" +
            "  type 'bar'\n" +
            "  palette 'warm'\n" +
            "  data { labelField 'channel'; datasets { dataset { field 'orders' } } }\n" +
            "}").get("ordersByChannel");
        assertEquals("warm", chart.get("palette"), "the chart's colour set is parsed");

        String emitted = BlockFormEmitter.emitNamed("chart", "ordersByChannel", chart,
                                                     BlockFormRules.CHART);
        assertEquals(chart, parseChartRawNamed(emitted).get("ordersByChannel"),
            "a chart's `palette` survives the round trip");

        ChartOptions read = ChartOptionsParser.parseGroovyChartDslCode(
            "chart('ordersByChannel') {\n" +
            "  type 'bar'\n" +
            "  palette 'warm'\n" +
            "  data { labelField 'channel'; datasets { dataset { field 'orders' } } }\n" +
            "}");
        assertEquals("warm", read.getNamedOptions().get("ordersByChannel").getPalette(),
            "and the chart the page is given carries it");
    }

    /** #24: the data labels are the rb-chart plugin's own option, carried in `options` as written. */
    @Test
    public void roundTrip_chartValueLabels() throws Exception {
        String dsl =
            "chart('ordersByChannel') {\n" +
            "  type 'bar'\n" +
            "  data { labelField 'channel'; datasets { dataset { field 'orders' } } }\n" +
            "  options { plugins { rbValueLabels { display true } } }\n" +
            "}";
        Map<String, Object> chart = parseChartRawNamed(dsl).get("ordersByChannel");
        String emitted = BlockFormEmitter.emitNamed("chart", "ordersByChannel", chart, BlockFormRules.CHART);
        assertEquals(chart, parseChartRawNamed(emitted).get("ordersByChannel"),
            "the data labels survive the round trip");

        ChartOptions read = ChartOptionsParser.parseGroovyChartDslCode(dsl);
        Object options = read.getNamedOptions().get("ordersByChannel").getOptions();
        assertEquals(Map.of("display", true),
            ((Map<?, ?>) ((Map<?, ?>) ((Map<?, ?>) options).get("plugins")).get("rbValueLabels")),
            "and the chart the page is given carries them");
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PIVOT TABLE
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * D21 pivot simulation — the {@code orderExplorer} pivot from the g-dashboard sample.
     *
     * <p>Exercises: multi-row {@code rows}, single {@code cols}/{@code vals}, named aggregator and
     * renderer, row ordering. Simple but real — the exact config shipped with DataPallas.
     */
    @Test
    public void roundTrip_gDashboardPivot() throws Exception {
        Path file = sampleFile("g-dashboard/g-dashboard-pivot-config.groovy");
        String dsl = Files.readString(file);
        Map<String, Map<String, Object>> namedOpts = parsePivotRawNamed(dsl);

        for (Map.Entry<String, Map<String, Object>> e : namedOpts.entrySet()) {
            String name = e.getKey();
            Map<String, Object> opts = e.getValue();

            String emitted = BlockFormEmitter.emitNamed("pivotTable", name, opts,
                                                         BlockFormRules.PIVOT, true);
            Map<String, Map<String, Object>> reparsed = parsePivotRawNamed(emitted);
            Map<String, Object> opts2 = reparsed.get(name);
            assertNotNull(opts2, "Re-parsed pivot must contain '" + name + "'");

            assertEquals(opts, opts2,
                "Round-trip failed for g-dashboard pivot '" + name + "'");
            assertDoesNotThrow(() -> new ObjectMapper().writeValueAsString(opts2),
                "Jackson serialization failed for pivot '" + name + "'");
        }
    }

    /**
     * Parameterized round-trip over every named block in the canonical pivot showcase file.
     *
     * <p>The showcase covers the full react-pivottable API: multi-dimension rows/cols,
     * all aggregator types (Sum, Average, Count Unique Values, Sum over Sum, etc.),
     * all renderer types (Table, Heatmap, Grouped Bar, Line Chart, etc.),
     * value filters, custom sorters, derived attributes, and hidden field controls.
     * All pivot properties use explicit setters — the showcase verifies that the emitter
     * produces parseable DSL for every combination, including the Map-valued
     * {@code sorters}, {@code derivedAttributes}, and {@code valueFilter} properties
     * that require inline literal emission ({@code rootInlineMaps=true}).
     */
    @ParameterizedTest(name = "pivot — {0}")
    @MethodSource("allPivotExamples")
    public void roundTrip_allPivotExamples(String name, Map<String, Object> opts) throws Exception {

        String emitted = BlockFormEmitter.emitNamed("pivotTable", name, opts,
                                                     BlockFormRules.PIVOT, true);
        Map<String, Map<String, Object>> reparsed = parsePivotRawNamed(emitted);
        Map<String, Object> opts2 = reparsed.get(name);
        assertNotNull(opts2, "Re-parsed pivot must contain '" + name + "'");

        assertEquals(opts, opts2,
            "Round-trip failed for pivot example '" + name + "'");
        assertDoesNotThrow(() -> new ObjectMapper().writeValueAsString(opts2),
            "Jackson serialization failed for pivot example '" + name + "'");
    }

    static Stream<Arguments> allPivotExamples() {
        Path file = sampleFile("_frend/piv-examples/piv-examples-pivot-config.groovy");
        try {
            Map<String, Map<String, Object>> named = parsePivotRawNamed(Files.readString(file));
            return named.entrySet().stream().map(e -> Arguments.of(e.getKey(), e.getValue()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load piv-examples fixture: " + file, e);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // SLICER
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Slicer full-surface round-trip — exercises all 9 properties in one shot.
     *
     * <p>Slicer has a strict, fixed API (no {@code methodMissing}) — every property has an
     * explicit setter. The key round-trip risk is the {@code defaultValue} list: the emitter
     * must emit it as varargs ({@code defaultValue 'Germany', 'France'}) so the
     * {@code defaultValue(String...)} parser method accepts it. This test verifies every
     * property survives, with particular focus on {@code defaultValue} preserving all elements.
     *
     * <p>DSL mirrors the canonical slicer usage from the docs and the D21 g-dashboard
     * country parameter.
     */
    @Test
    public void roundTrip_slicerFullSurface() throws Exception {
        String dsl =
            "slicer('countryFilter') {\n" +
            "  field 'ShipCountry'\n" +
            "  label 'Country'\n" +
            "  sort 'asc'\n" +
            "  maxValues 500\n" +
            "  showSearch true\n" +
            "  showCount true\n" +
            "  defaultValue 'Germany', 'France', 'Spain'\n" +
            "  control 'multiselect'\n" +
            "  height '300px'\n" +
            "}";

        Map<String, Map<String, Object>> namedOpts = parseSlicerRawNamed(dsl);
        Map<String, Object> opts = namedOpts.get("countryFilter");
        assertNotNull(opts, "namedOptions must contain 'countryFilter'");
        assertEquals(3, ((List<?>) opts.get("defaultValue")).size(),
            "All 3 defaultValue values must be present after first parse");

        String emitted = BlockFormEmitter.emitNamed("slicer", "countryFilter", opts,
                                                     BlockFormRules.SLICER);

        Map<String, Map<String, Object>> reparsed = parseSlicerRawNamed(emitted);
        Map<String, Object> opts2 = reparsed.get("countryFilter");
        assertNotNull(opts2, "Re-parsed slicer must contain 'countryFilter'");

        assertEquals(opts, opts2, "All 9 slicer properties must survive round-trip");
        assertDoesNotThrow(() -> new ObjectMapper().writeValueAsString(opts2),
            "Jackson serialization failed for slicer");
    }

    /**
     * The other two shapes a slicer is written in, round-tripped (owner decisions 19 and 20):
     * the name alone, where the name IS the field, and {@code control 'select'} for a slicer that
     * holds one value at a time.
     *
     * <p>Both matter to the Display tab: the panel hands the canonical Map to {@code /serialize},
     * the author edits the text, {@code /parse} hands a Map back, and a property that did not
     * survive that trip is a setting the author loses by opening the editor.
     */
    @Test
    public void roundTrip_slicerNameIsTheFieldAndSingleSelect() throws Exception {
        // The name alone: no `field` line at all.
        Map<String, Object> bare = parseSlicerRawNamed("slicer('channel')").get("channel");
        assertNotNull(bare, "`slicer('channel')` alone is a slicer");
        assertEquals("channel", bare.get("field"), "the name is the field");

        String emittedBare = BlockFormEmitter.emitNamed("slicer", "channel", bare,
                                                         BlockFormRules.SLICER);
        assertEquals(bare, parseSlicerRawNamed(emittedBare).get("channel"),
            "a name-only slicer survives the round trip");

        // One value at a time, and a default to start on.
        String dsl =
            "slicer('stage') {\n" +
            "  control 'select'\n" +
            "  defaultValue 'Negotiation'\n" +
            "}";
        Map<String, Object> opts = parseSlicerRawNamed(dsl).get("stage");
        assertEquals("select", opts.get("control"));
        assertEquals(List.of("Negotiation"), opts.get("defaultValue"));
        assertEquals("stage", opts.get("field"));

        String emitted = BlockFormEmitter.emitNamed("slicer", "stage", opts, BlockFormRules.SLICER);
        assertEquals(opts, parseSlicerRawNamed(emitted).get("stage"),
            "`control` and a one-value `defaultValue` survive the round trip");
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // REPORT PARAMETERS
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Parameters round-trip — the g-dashboard country select parameter.
     *
     * <p>Exercises the {@link BlockFormRules#REPORTPARAMETERS} {@code NamedArgsBlock} rule:
     * header named-args ({@code id}, {@code type}, {@code label}, {@code defaultValue}) are
     * emitted inline; sub-blocks ({@code constraints}, {@code uiHints → ui}) are emitted as
     * method calls inside the parameter's closure.
     *
     * <p>The round-trip validates that {@code BlockFormEmitter.emit} produces a Groovy
     * {@code reportParameters { parameter(...) { ... } }} block that the parameters parser
     * can re-parse into a {@code ReportParameter} with all key fields preserved.
     * This is the D21 country-filter parameter — the same DSL that all 5 g-dashboard
     * widgets use for country-based filtering.
     */
    @Test
    public void roundTrip_gDashboardParameters() throws Exception {
        // Input Map shape — same as what DslController.reportParameterToMap produces.
        // The emitter's NamedArgsBlock rule maps uiHints → ui in the emitted DSL.
        Map<String, Object> countryParam = Map.of(
            "id", "country",
            "type", "String",
            "label", "Country",
            "defaultValue", "-- All --",
            "constraints", Map.of("required", false),
            "uiHints", Map.of("control", "select",
                "options", "SELECT '-- All --' AS ShipCountry UNION ALL SELECT DISTINCT ShipCountry FROM Orders WHERE ShipCountry IS NOT NULL ORDER BY ShipCountry")
        );
        Map<String, Object> opts = Map.of("parameters", List.of(countryParam));

        String emitted = BlockFormEmitter.emit("reportParameters", opts,
                                               BlockFormRules.REPORTPARAMETERS);

        // Re-parse and verify key fields survive.
        List<ReportParameter> params = ReportParametersHelper.parseGroovyParametersDslCode(emitted);
        assertEquals(1, params.size(), "Emitted reportParameters block must produce exactly 1 parameter");
        ReportParameter p = params.get(0);
        assertEquals("country", p.id, "Parameter id must survive round-trip");
        assertEquals("Country", p.label, "Parameter label must survive round-trip");
        assertEquals("-- All --", p.defaultValue, "Parameter defaultValue must survive round-trip");
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // Private parse helpers — call DSL scripts directly to get raw Maps
    // (bypassing the parser DTOs so emitter input and output shapes are comparable)
    // ═════════════════════════════════════════════════════════════════════════════

    private static Map<String, Map<String, Object>> parseChartRawNamed(String dslCode) throws Exception {
        Binding b = new Binding();
        CompilerConfiguration cfg = new CompilerConfiguration();
        cfg.setScriptBaseClass(ChartOptionsScript.class.getName());
        GroovyShell shell = new GroovyShell(ChartOptionsScript.class.getClassLoader(), b, cfg);
        ChartOptionsScript script = (ChartOptionsScript) shell.parse(dslCode);
        script.setBinding(b);
        script.run();
        return script.getNamedOptions();
    }

    private static Map<String, Map<String, Object>> parsePivotRawNamed(String dslCode) throws Exception {
        Binding b = new Binding();
        CompilerConfiguration cfg = new CompilerConfiguration();
        cfg.setScriptBaseClass(PivotTableOptionsScript.class.getName());
        GroovyShell shell = new GroovyShell(PivotTableOptionsScript.class.getClassLoader(), b, cfg);
        PivotTableOptionsScript script = (PivotTableOptionsScript) shell.parse(dslCode);
        script.setBinding(b);
        script.run();
        return script.getNamedOptions();
    }

    private static Map<String, Map<String, Object>> parseSlicerRawNamed(String dslCode) throws Exception {
        Binding b = new Binding();
        CompilerConfiguration cfg = new CompilerConfiguration();
        cfg.setScriptBaseClass(SlicerOptionsScript.class.getName());
        GroovyShell shell = new GroovyShell(SlicerOptionsScript.class.getClassLoader(), b, cfg);
        SlicerOptionsScript script = (SlicerOptionsScript) shell.parse(dslCode);
        script.setBinding(b);
        script.run();
        return script.getNamedOptions();
    }
}
