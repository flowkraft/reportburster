package com.sourcekraft.documentburster.common.dsl;

import static org.junit.Assert.*;

import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.sourcekraft.documentburster.common.tabulator.TabulatorOptions;
import com.sourcekraft.documentburster.common.tabulator.TabulatorOptionsParser;

/**
 * Comprehensive tests for the Tabulator Groovy DSL parser.
 *
 * <h3>rb-tabulator Web Component — Two Usage Modes</h3>
 *
 * <b>MODE 1 — "Data Push"</b> (parent fetches data, passes via props)
 * <ul>
 *   <li>Props: [data], [columns], [options], [loading]</li>
 *   <li>Parent (Angular) calls the API, gets reportData, then renders:
 *       {@code <rb-tabulator [data]="result.reportData" [columns]="..." [options]="...">}</li>
 *   <li>Used in: Configuration &gt; Test SQL/Script button — Angular fetches data once
 *       and pushes the SAME dataset to Tabulator, Chart, and Pivot Table previews.
 *       This avoids 3 separate API calls for the same data.</li>
 * </ul>
 *
 * <b>MODE 2 — "Self-Fetch"</b> (component fetches its own config + data)
 * <ul>
 *   <li>Props: [reportCode], [apiBaseUrl], [reportParams], [testMode], [componentId]</li>
 *   <li>Component calls GET /reports/{code}/config then GET /reports/{code}/data</li>
 *   <li>Used in:
 *     <ul>
 *       <li>Configuration &gt; Tabulator/Chart/Pivot Preview for named components (aggregator reports)</li>
 *       <li>Processing &gt; View Data button</li>
 *     </ul>
 *   </li>
 *   <li>Needed because: View Data must support server-side pagination for large
 *       datasets (the component manages its own pagination state via ajaxRequestFunc).
 *       Named components need componentId-specific config that only the component knows.</li>
 * </ul>
 *
 * Both modes converge at {@code opts = Object.assign({}, options || {})} in
 * RbTabulator.wc.svelte where Tabulator is initialized with the same options
 * regardless of how data/config was obtained.
 *
 * <hr/>
 *
 * Every test mirrors one of the 45 named tabulator blocks in
 * tab-examples-tabulator-config.groovy, using the UNNAMED syntax
 * ({@code tabulator &#123; ... &#125;}) as the default parsing form.
 *
 * The 45 examples are organized into 4 categories that match the Groovy file:
 *   LAYOUT       (23 tests: #1 – #23)
 *   DATA         ( 8 tests: #24 – #31)
 *   INTERACTION  (13 tests: #32 – #44)
 *   ADVANCED     ( 1 test:  #45)
 *
 * Plus edge-case tests and named-block tests at the end.
 */
public class TabulatorOptionsParserTest {

	// ═════════════════════════════════════════════════════════════════════════════
	// LAYOUT  (#1 – #23)
	// ═════════════════════════════════════════════════════════════════════════════

	/** #1 Virtual DOM - Vertical: Tabulator renders its table using a Virtual DOM,
	 *  this means that it only renders the rows you see in the table (plus a few
	 *  above and below the current view). */
	@Test
	public void testVirtualDomVertical() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"ID\"\n" +
			"      field \"id\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("311px", opts.get("height"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());

		assertEquals("ID", cols.get(0).get("title"));
		assertEquals("id", cols.get(0).get("field"));

		assertEquals("Name", cols.get(1).get("title"));
		assertEquals("name", cols.get(1).get("field"));

		assertEquals("Progress", cols.get(2).get("title"));
		assertEquals("number", cols.get(2).get("sorter"));

		assertEquals("Date Of Birth", cols.get(6).get("title"));
		assertEquals("center", cols.get(6).get("hozAlign"));
	}

	/** #2 Virtual DOM - Horizontal: For tables with large numbers of columns you can
	 *  use the virtualDomHoz option to enable the horizontal Virtual DOM which will
	 *  improve table rendering performance. */
	@Test
	public void testVirtualDomHorizontal() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  renderHorizontal \"virtual\"\n" +
			"  autoColumns true\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("311px", opts.get("height"));
		assertEquals("virtual", opts.get("renderHorizontal"));
		assertEquals(true, opts.get("autoColumns"));
		assertNull("columns should not be set when autoColumns is true", opts.get("columns"));
	}

	/** #3 Fit To Data: Tables will automatically resize columns to fit the data. */
	@Test
	public void testFitToData() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("311px", opts.get("height"));
		assertNull("layout should not be set (fitData is the default)", opts.get("layout"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());

		assertEquals("right", cols.get(1).get("hozAlign"));
		assertEquals("number", cols.get(1).get("sorter"));
		assertEquals("date", cols.get(5).get("sorter"));
		assertEquals("center", cols.get(6).get("hozAlign"));
	}

	/** #4 Fit To Data and Fill: By setting the layout option to fitDataFill, the table
	 *  will resize the columns to fit their data, and ensure that rows take up the
	 *  full width. */
	@Test
	public void testFitToDataAndFill() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitDataFill\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitDataFill", opts.get("layout"));
		assertEquals("311px", opts.get("height"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(5, cols.size());
		assertEquals("Name", cols.get(0).get("title"));
		assertEquals("center", cols.get(3).get("hozAlign"));
	}

	/** #5 Fit To Data and Stretch Last Column: By setting the layout option to
	 *  fitDataStretch, the table will resize the columns to fit their data, and
	 *  stretch the final column to fill remaining width. */
	@Test
	public void testFitToDataAndStretchLastColumn() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitDataStretch\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitDataStretch", opts.get("layout"));
		assertEquals("311px", opts.get("height"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(5, cols.size());
	}

	/** #6 Fit Table and Columns to Data: Tables will automatically resize container
	 *  and columns to fit the data. */
	@Test
	public void testFitTableAndColumnsToData() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitDataTable\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitDataTable", opts.get("layout"));
		assertEquals("311px", opts.get("height"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(3, cols.size());
		assertEquals("number", cols.get(1).get("sorter"));
	}

	/** #7 Fit To Width: By setting the layout option to fitColumns, the table will
	 *  resize columns so that they fit perfectly inside the width of the container. */
	@Test
	public void testFitToWidth() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      widthGrow 2\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      widthGrow 3\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      widthGrow 2\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitColumns", opts.get("layout"));
		assertEquals("311px", opts.get("height"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());

		assertEquals(200, cols.get(0).get("width"));
		assertEquals(2, cols.get(2).get("widthGrow"));
		assertEquals(3, cols.get(4).get("widthGrow"));
		assertEquals(2, cols.get(5).get("widthGrow"));
	}

	/** #8 Responsive Layout: By setting the responsiveLayout option to 'hide', the
	 *  table will automatically hide/show columns to prevent exceeding container width. */
	@Test
	public void testResponsiveLayout() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  responsiveLayout \"hide\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"      responsive 0\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 150\n" +
			"      responsive 2\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 150\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("hide", opts.get("responsiveLayout"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());

		assertEquals(0, cols.get(0).get("responsive"));
		assertEquals(200, cols.get(0).get("width"));
		assertEquals(2, cols.get(2).get("responsive"));
	}

	/** #9 Responsive Layout Collapsed List: By setting the responsiveLayout option to
	 *  'collapse', the table will automatically collapse columns that don't fit on
	 *  the table into a list. */
	@Test
	public void testResponsiveLayoutCollapsedList() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitDataFill\"\n" +
			"  responsiveLayout \"collapse\"\n" +
			"  rowHeader([formatter: \"responsiveCollapse\", width: 30, minWidth: 30, hozAlign: \"center\", resizable: false, headerSort: false])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"      responsive 0\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 150\n" +
			"      responsive 2\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 150\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitDataFill", opts.get("layout"));
		assertEquals("collapse", opts.get("responsiveLayout"));

		@SuppressWarnings("unchecked")
		Map<String, Object> rowHeader = (Map<String, Object>) opts.get("rowHeader");
		assertNotNull("rowHeader should be present for collapse toggle", rowHeader);
		assertEquals("responsiveCollapse", rowHeader.get("formatter"));
		assertEquals(30, rowHeader.get("width"));
		assertEquals(30, rowHeader.get("minWidth"));
		assertEquals("center", rowHeader.get("hozAlign"));
		assertEquals(false, rowHeader.get("resizable"));
		assertEquals(false, rowHeader.get("headerSort"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
		assertEquals(0, cols.get(0).get("responsive"));
	}

	/** #10 Automatic Column Generation: Tabulator can automatically work out the columns
	 *  structure of simple tables by examining the data in the first row. */
	@Test
	public void testAutomaticColumnGeneration() throws Exception {
		String dsl = "tabulator {\n" +
			"  autoColumns true\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("autoColumns"));
		assertNull("columns should not be set when autoColumns is true", opts.get("columns"));
	}

	/** #11 Resizable Columns: By including the Resize Columns module in your table all
	 *  columns will automatically become resizable. */
	@Test
	public void testResizableColumns() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  resizableColumnFit true\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"      resizable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      resizable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      resizable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      resizable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      resizable true\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitColumns", opts.get("layout"));
		assertEquals(true, opts.get("resizableColumnFit"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(5, cols.size());
		assertEquals(200, cols.get(0).get("width"));
		assertEquals(true, cols.get(0).get("resizable"));
		assertEquals(true, cols.get(1).get("resizable"));
		assertEquals(true, cols.get(4).get("resizable"));
	}

	/** #12 Resize Guides: When using guides, when you drag the edge of a column or row,
	 *  a guide is shown that helps you see how big the element will be. */
	@Test
	public void testResizeGuides() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  resizableRows true\n" +
			"  resizableRowGuide true\n" +
			"  resizableColumnGuide true\n" +
			"  columnDefaults([resizable: true])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("resizableRows"));
		assertEquals(true, opts.get("resizableRowGuide"));
		assertEquals(true, opts.get("resizableColumnGuide"));

		@SuppressWarnings("unchecked")
		Map<String, Object> colDefaults = (Map<String, Object>) opts.get("columnDefaults");
		assertEquals(true, colDefaults.get("resizable"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(5, cols.size());
	}

	/** #13 Column Groups: By creating groups in the column definition array, you can
	 *  create multi line headers with groups of columns. */
	@Test
	public void testColumnGroups() throws Exception {
		String dsl = "tabulator {\n" +
			"  columnHeaderVertAlign \"bottom\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 160\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Work Info\"\n" +
			"      columns([[title: \"Progress\", field: \"progress\", hozAlign: \"right\", sorter: \"number\", width: 100], [title: \"Rating\", field: \"rating\", hozAlign: \"center\", width: 80], [title: \"Driver\", field: \"car\", hozAlign: \"center\", width: 80]])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Personal Info\"\n" +
			"      columns([[title: \"Gender\", field: \"gender\", width: 90], [title: \"Favourite Color\", field: \"col\", width: 140], [title: \"Date Of Birth\", field: \"dob\", hozAlign: \"center\", sorter: \"date\", width: 130]])\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("bottom", opts.get("columnHeaderVertAlign"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(3, cols.size());
		assertEquals("Name", cols.get(0).get("title"));
		assertEquals("Work Info", cols.get(1).get("title"));
		assertEquals("Personal Info", cols.get(2).get("title"));
	}

	/** #14 Vertical Column Headers: If you are trying to fit a lot of narrow columns on
	 *  your table, you can use the headerVertical property to change text orientation
	 *  to vertical. */
	@Test
	public void testVerticalColumnHeaders() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      headerSort false\n" +
			"      headerVertical true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      formatter \"progress\"\n" +
			"      editable true\n" +
			"      headerSort false\n" +
			"      headerVertical true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      headerSort false\n" +
			"      headerVertical true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      headerSort false\n" +
			"      headerVertical true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      headerSort false\n" +
			"      headerVertical true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      headerSort false\n" +
			"      headerVertical true\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
		assertEquals(true, cols.get(0).get("headerVertical"));
		assertEquals(false, cols.get(0).get("headerSort"));
		assertEquals("progress", cols.get(1).get("formatter"));
		assertEquals("tickCross", cols.get(5).get("formatter"));
	}

	/** #15 Row Header: In addition to the column headers, it is possible to add row
	 *  headers to the table using the rowHeader option. */
	@Test
	public void testRowHeader() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  rowHeader([formatter: \"rownum\", headerSort: false, hozAlign: \"center\", resizable: false, frozen: true])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      headerSort false\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      formatter \"progress\"\n" +
			"      editable true\n" +
			"      headerSort false\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      headerSort false\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      headerSort false\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      headerSort false\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      headerSort false\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		@SuppressWarnings("unchecked")
		Map<String, Object> rowHeader = (Map<String, Object>) opts.get("rowHeader");
		assertEquals("rownum", rowHeader.get("formatter"));
		assertEquals(false, rowHeader.get("headerSort"));
		assertEquals(true, rowHeader.get("frozen"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
	}

	/** #16 Frozen Columns: You can use the frozen property in a columns definition
	 *  object to freeze that column in place during horizontal scrolling. */
	@Test
	public void testFrozenColumns() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 250\n" +
			"      frozen true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      formatter \"progress\"\n" +
			"      width 200\n" +
			"      editable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      width 150\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
		assertEquals(true, cols.get(0).get("frozen"));
		assertEquals(250, cols.get(0).get("width"));
	}

	/** #17 Frozen Rows: You can use the frozenRows option in the table constructor to
	 *  specify the number of rows you want to freeze at the top. */
	@Test
	public void testFrozenRows() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  frozenRows 1\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 250\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      formatter \"progress\"\n" +
			"      width 200\n" +
			"      editable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      width 150\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(1, opts.get("frozenRows"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
	}

	/** #18 Nested Data Trees: You can enable tree structures on nested data by setting
	 *  the dataTree option to true in the table constructor. */
	@Test
	public void testNestedDataTrees() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  dataTree true\n" +
			"  dataTreeStartExpanded true\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"      responsive 0\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Location\"\n" +
			"      field \"location\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 150\n" +
			"      responsive 2\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      width 150\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("dataTree"));
		assertEquals(true, opts.get("dataTreeStartExpanded"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(5, cols.size());
		assertEquals("location", cols.get(1).get("field"));
	}

	/** #19 Formatters: Tabulator allows you to format your data in a wide variety of
	 *  ways, so your tables can display information in a more graphical and clear
	 *  layout. */
	@Test
	public void testFormatters() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      formatter \"progress\"\n" +
			"      formatterParams([color: [\"#00dd00\", \"orange\", \"rgb(255,0,0)\"]])\n" +
			"      sorter \"number\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      formatterParams([stars: 6])\n" +
			"      hozAlign \"center\"\n" +
			"      width 120\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      width 50\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Col\"\n" +
			"      field \"col\"\n" +
			"      formatter \"color\"\n" +
			"      width 50\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Line Wraping\"\n" +
			"      field \"lorem\"\n" +
			"      formatter \"textarea\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitColumns", opts.get("layout"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
		assertEquals("progress", cols.get(1).get("formatter"));
		assertEquals("star", cols.get(2).get("formatter"));
		assertEquals("tickCross", cols.get(3).get("formatter"));
		assertEquals("color", cols.get(4).get("formatter"));
		assertEquals("textarea", cols.get(5).get("formatter"));
	}

	/** #20 Persistent Configuration: Tabulator can store a variety of table setup options
	 *  so that each time a user comes back to the page, the table is laid out just
	 *  as they left it. */
	@Test
	public void testPersistentConfiguration() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  persistence([sort: true, filter: true, columns: true])\n" +
			"  persistenceID \"examplePerststance\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 100\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      width 80\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("examplePerststance", opts.get("persistenceID"));

		@SuppressWarnings("unchecked")
		Map<String, Object> persistence = (Map<String, Object>) opts.get("persistence");
		assertEquals(true, persistence.get("sort"));
		assertEquals(true, persistence.get("filter"));
		assertEquals(true, persistence.get("columns"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #21 Column Calculations: Column calculations can be used to add a row of
	 *  calculated values to the top or bottom of your table to display summary
	 *  information. */
	@Test
	public void testColumnCalculations() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  movableColumns true\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 100\n" +
			"      sorter \"number\"\n" +
			"      bottomCalc \"avg\"\n" +
			"      bottomCalcParams([precision: 3])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      width 80\n" +
			"      bottomCalc \"avg\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      topCalc \"count\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("movableColumns"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
		assertEquals("avg", cols.get(1).get("bottomCalc"));
		assertEquals("avg", cols.get(3).get("bottomCalc"));
		assertEquals("count", cols.get(6).get("topCalc"));
	}

	/** #22 No Column Headers: By setting the headerVisible option to false you can hide
	 *  the column headers and present the table as a simple list. */
	@Test
	public void testNoColumnHeaders() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  headerVisible false\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 250\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      formatter \"progress\"\n" +
			"      width 200\n" +
			"      editable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      width 150\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(false, opts.get("headerVisible"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
	}

	/** #23 RTL Text Direction: Tabulator supports both 'Right to Left' and 'Left To
	 *  Right' text directions. */
	@Test
	public void testRtlTextDirection() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  textDirection \"rtl\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 250\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      formatter \"progress\"\n" +
			"      width 200\n" +
			"      editable true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      width 150\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("rtl", opts.get("textDirection"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// DATA  (#24 – #31)
	// ═════════════════════════════════════════════════════════════════════════════

	/** #24 AJAX Progressive Loading: You can use the ajaxProgressiveLoad option along
	 *  with ajaxURL to progressively load pages of data as the user scrolls down. */
	@Test
	public void testAjaxProgressiveLoading() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  progressiveLoad \"scroll\"\n" +
			"  paginationSize 20\n" +
			"  placeholder \"No Data Set\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      sorter \"string\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      formatter \"progress\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      sorter \"string\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      sorter \"string\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      sorter \"date\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      sorter \"boolean\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("scroll", opts.get("progressiveLoad"));
		assertEquals(20, opts.get("paginationSize"));
		assertEquals("No Data Set", opts.get("placeholder"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #25 Data Reactivity: Data can be loaded into the table from a remote URL using
	 *  a JSON formatted string. */
	@Test
	public void testDataReactivity() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  reactiveData true\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      sorter \"string\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      formatter \"progress\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      sorter \"string\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      sorter \"string\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("reactiveData"));
		assertEquals("fitColumns", opts.get("layout"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(5, cols.size());
	}

	/** #26 Editable Data: Using the editable setting on each column, you can make a
	 *  user editable table. */
	@Test
	public void testEditableData() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 150\n" +
			"      editor \"input\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Location\"\n" +
			"      field \"location\"\n" +
			"      width 130\n" +
			"      editor \"list\"\n" +
			"      editorParams([autocomplete: \"true\", allowEmpty: true, listOnEmpty: true, valuesLookup: true])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      formatter \"progress\"\n" +
			"      width 140\n" +
			"      editor true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      editor \"list\"\n" +
			"      editorParams([values: [male: \"Male\", female: \"Female\", unknown: \"Unknown\"]])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"      editor true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      width 140\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      editor true\n" +
			"      formatter \"tickCross\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
		assertEquals("input", cols.get(0).get("editor"));
		assertEquals("list", cols.get(1).get("editor"));
		assertEquals("location", cols.get(1).get("field"));
		assertEquals(true, cols.get(2).get("editor"));
		assertEquals("list", cols.get(3).get("editor"));
		assertEquals(true, cols.get(6).get("editor"));
	}

	/** #27 Validate User Input: You can set validators on columns to ensure that any
	 *  user input into your editable cells matches your requirements. */
	@Test
	public void testValidateUserInput() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 150\n" +
			"      editor \"input\"\n" +
			"      validator \"required\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      hozAlign \"left\"\n" +
			"      editor true\n" +
			"      validator([\"min:0\", \"max:100\", \"numeric\"])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      editor \"input\"\n" +
			"      validator([\"required\", \"in:male|female\"])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      editor \"input\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"      validator([\"min:0\", \"max:5\", \"integer\"])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      editor \"input\"\n" +
			"      validator([\"minLength:3\", \"maxLength:10\", \"string\"])\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitColumns", opts.get("layout"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(5, cols.size());
		assertEquals("required", cols.get(0).get("validator"));
		assertEquals("input", cols.get(0).get("editor"));
	}

	/** #28 Filter Data In Header: By setting the headerFilter parameter for a column you
	 *  can add column based filtering directly into your table. */
	@Test
	public void testFilterDataInHeader() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 150\n" +
			"      headerFilter \"input\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 150\n" +
			"      formatter \"progress\"\n" +
			"      sorter \"number\"\n" +
			"      headerFilter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      editor \"list\"\n" +
			"      editorParams([values: [male: \"Male\", female: \"Female\"], clearable: true])\n" +
			"      headerFilter true\n" +
			"      headerFilterParams([values: [male: \"Male\", female: \"Female\", \"\": \"\"], clearable: true])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      editor \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"      headerFilter \"number\"\n" +
			"      headerFilterPlaceholder \"at least...\"\n" +
			"      headerFilterFunc \">=\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"      editor \"input\"\n" +
			"      headerFilter \"list\"\n" +
			"      headerFilterParams([valuesLookup: true, clearable: true])\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"      headerFilter \"input\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"      headerFilter \"tickCross\"\n" +
			"      headerFilterParams([tristate: true])\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
		assertEquals("input", cols.get(0).get("headerFilter"));
		assertEquals("number", cols.get(1).get("headerFilter"));
		assertEquals(true, cols.get(2).get("headerFilter"));
		assertEquals(">=", cols.get(3).get("headerFilterFunc"));
		assertEquals("tickCross", cols.get(6).get("headerFilter"));
	}

	/** #29 Sorters: By default Tabulator will attempt to guess which sorter should be
	 *  applied to a column based on the data contained. */
	@Test
	public void testSorters() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      headerSortTristate true\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      sorter \"string\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      sorter \"date\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"boolean\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
		assertEquals(true, cols.get(1).get("headerSortTristate"));
		assertEquals("string", cols.get(2).get("sorter"));
		assertEquals("date", cols.get(5).get("sorter"));
		assertEquals("boolean", cols.get(6).get("sorter"));
	}

	/** #30 Grouping Data: You can group rows together using the groupBy option. To group
	 *  by a field, set this option to the name of the field. */
	@Test
	public void testGroupingData() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  movableRows true\n" +
			"  groupBy \"gender\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      formatter \"progress\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("gender", opts.get("groupBy"));
		assertEquals(true, opts.get("movableRows"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #31 Pagination: Tabulator allows you to paginate your data. Simply set the
	 *  pagination property to true. */
	@Test
	public void testPagination() throws Exception {
		String dsl = "tabulator {\n" +
			"  layout \"fitColumns\"\n" +
			"  pagination \"local\"\n" +
			"  paginationSize 6\n" +
			"  paginationSizeSelector([3, 6, 8, 10])\n" +
			"  movableColumns true\n" +
			"  paginationCounter \"rows\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      formatter \"progress\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("local", opts.get("pagination"));
		assertEquals(6, opts.get("paginationSize"));
		assertEquals(true, opts.get("movableColumns"));
		assertEquals("rows", opts.get("paginationCounter"));

		@SuppressWarnings("unchecked")
		List<Object> sizeSelector = (List<Object>) opts.get("paginationSizeSelector");
		assertEquals(4, sizeSelector.size());
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// INTERACTION  (#32 – #44)
	// ═════════════════════════════════════════════════════════════════════════════

	/** #32 Selectable Rows: Using the selectableRows option, you can allow users to
	 *  select rows in the table via a number of different routes. */
	@Test
	public void testSelectableRows() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  selectableRows true\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 100\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 80\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("selectableRows"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #33 Selectable Rows With Tickbox: By using the rowSelection formatter in the row
	 *  header, you can create a table with rows selectable using a tickbox. */
	@Test
	public void testSelectableRowsWithTickbox() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  rowHeader([headerSort: false, resizable: false, frozen: true, headerHozAlign: \"center\", hozAlign: \"center\", formatter: \"rowSelection\", titleFormatter: \"rowSelection\"])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 100\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 80\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		@SuppressWarnings("unchecked")
		Map<String, Object> rowHeader = (Map<String, Object>) opts.get("rowHeader");
		assertEquals("rowSelection", rowHeader.get("formatter"));
		assertEquals("rowSelection", rowHeader.get("titleFormatter"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #34 Selectable Cell Range: Using the selectableRange option, you can allow users
	 *  to select a range of cells in the table. */
	@Test
	public void testSelectableCellRange() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  selectableRange true\n" +
			"  selectableRangeColumns true\n" +
			"  selectableRangeRows true\n" +
			"  rowHeader([resizable: false, frozen: true, hozAlign: \"center\", formatter: \"rownum\", cssClass: \"range-header-col\"])\n" +
			"  columnDefaults([headerSort: false, resizable: \"header\"])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 100\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 80\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("selectableRange"));
		assertEquals(true, opts.get("selectableRangeColumns"));
		assertEquals(true, opts.get("selectableRangeRows"));

		@SuppressWarnings("unchecked")
		Map<String, Object> colDefaults = (Map<String, Object>) opts.get("columnDefaults");
		assertEquals(false, colDefaults.get("headerSort"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #35 Selectable Cell Range with Clipboard: By using the selectableRange option,
	 *  along with the clipboard, and edit modules you can create a table that allows
	 *  for bulk copying and pasting. */
	@Test
	public void testSelectableCellRangeWithClipboard() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  selectableRange 1\n" +
			"  selectableRangeColumns true\n" +
			"  selectableRangeRows true\n" +
			"  selectableRangeClearCells true\n" +
			"  editTriggerEvent \"dblclick\"\n" +
			"  clipboard true\n" +
			"  clipboardCopyStyled false\n" +
			"  clipboardCopyConfig([rowHeaders: false, columnHeaders: false])\n" +
			"  clipboardCopyRowRange \"range\"\n" +
			"  clipboardPasteParser \"range\"\n" +
			"  clipboardPasteAction \"range\"\n" +
			"  rowHeader([resizable: false, frozen: true, width: 40, hozAlign: \"center\", formatter: \"rownum\", cssClass: \"range-header-col\", editor: false])\n" +
			"  columnDefaults([headerSort: false, headerHozAlign: \"center\", editor: \"input\", resizable: \"header\", width: 100])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 100\n" +
			"      hozAlign \"right\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 80\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(1, opts.get("selectableRange"));
		assertEquals(true, opts.get("clipboard"));
		assertEquals("range", opts.get("clipboardPasteAction"));
		assertEquals("dblclick", opts.get("editTriggerEvent"));
	}

	/** #36 Spreadsheet: The spreadsheet module will create a standard grid of numbered
	 *  rows and letter columns of any size needed. */
	@Test
	public void testSpreadsheet() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  spreadsheet true\n" +
			"  spreadsheetRows 10\n" +
			"  spreadsheetColumns 10\n" +
			"  spreadsheetColumnDefinition([editor: \"input\"])\n" +
			"  rowHeader([field: \"_id\", hozAlign: \"center\", headerSort: false, frozen: true])\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("spreadsheet"));
		assertEquals(10, opts.get("spreadsheetRows"));
		assertEquals(10, opts.get("spreadsheetColumns"));

		@SuppressWarnings("unchecked")
		Map<String, Object> colDef = (Map<String, Object>) opts.get("spreadsheetColumnDefinition");
		assertEquals("input", colDef.get("editor"));
	}

	/** #37 Multisheet Spreadsheet: By using the spreadsheetSheets prop, we can pass in
	 *  an array of multiple sheet definitions to load multiple sheets of data. */
	@Test
	public void testMultisheetSpreadsheet() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  spreadsheet true\n" +
			"  spreadsheetRows 10\n" +
			"  spreadsheetColumns 10\n" +
			"  spreadsheetColumnDefinition([editor: \"input\"])\n" +
			"  spreadsheetSheetTabs true\n" +
			"  rowHeader([field: \"_id\", hozAlign: \"center\", headerSort: false, frozen: true])\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("spreadsheet"));
		assertEquals(true, opts.get("spreadsheetSheetTabs"));
	}

	/** #38 Spreadsheet with Clipboard: By using the spreadsheet option, along with the
	 *  clipboard, and edit modules you can create a fully functional spreadsheet. */
	@Test
	public void testSpreadsheetWithClipboard() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  spreadsheet true\n" +
			"  spreadsheetRows 50\n" +
			"  spreadsheetColumns 50\n" +
			"  spreadsheetColumnDefinition([editor: \"input\", resizable: \"header\"])\n" +
			"  spreadsheetSheetTabs true\n" +
			"  rowHeader([field: \"_id\", hozAlign: \"center\", headerSort: false, frozen: true])\n" +
			"  editTriggerEvent \"dblclick\"\n" +
			"  selectableRange 1\n" +
			"  selectableRangeColumns true\n" +
			"  selectableRangeRows true\n" +
			"  selectableRangeClearCells true\n" +
			"  clipboard true\n" +
			"  clipboardCopyStyled false\n" +
			"  clipboardCopyConfig([rowHeaders: false, columnHeaders: false])\n" +
			"  clipboardCopyRowRange \"range\"\n" +
			"  clipboardPasteParser \"range\"\n" +
			"  clipboardPasteAction \"range\"\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("spreadsheet"));
		assertEquals(50, opts.get("spreadsheetRows"));
		assertEquals(50, opts.get("spreadsheetColumns"));
		assertEquals(true, opts.get("clipboard"));
		assertEquals("range", opts.get("clipboardPasteAction"));
	}

	/** #39 Movable Rows: Using the movableRows property you can allow the user to move
	 *  rows around the table by clicking and dragging. */
	@Test
	public void testMovableRows() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  movableRows true\n" +
			"  rowHeader([headerSort: false, resizable: false, minWidth: 30, width: 30, rowHandle: true, formatter: \"handle\"])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      formatter \"progress\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      formatterParams([stars: 6])\n" +
			"      hozAlign \"center\"\n" +
			"      width 120\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("movableRows"));

		@SuppressWarnings("unchecked")
		Map<String, Object> rowHeader = (Map<String, Object>) opts.get("rowHeader");
		assertEquals("handle", rowHeader.get("formatter"));
		assertEquals(true, rowHeader.get("rowHandle"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #40 Movable Rows With Row Groups: By using the groupValues property to define a
	 *  series of groups, you can create a table that allows users to drag rows
	 *  between groups. */
	@Test
	public void testMovableRowsWithGroups() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  movableRows true\n" +
			"  rowHeader([headerSort: false, resizable: false, minWidth: 30, width: 30, rowHandle: true, formatter: \"handle\"])\n" +
			"  groupBy \"col\"\n" +
			"  groupValues([[\"green\", \"blue\", \"purple\"]])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 150\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      formatter \"progress\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      formatter \"star\"\n" +
			"      formatterParams([stars: 6])\n" +
			"      hozAlign \"center\"\n" +
			"      width 120\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("col", opts.get("groupBy"));
		assertEquals(true, opts.get("movableRows"));
		assertNotNull(opts.get("groupValues"));
	}

	/** #41 Movable Rows Between Tables: Using the movableRowsConnectedTables property
	 *  you can set the tables that can receive rows from another table. */
	@Test
	public void testMovableRowsBetweenTables() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  movableRows true\n" +
			"  movableRowsConnectedTables \"#example-table-receiver\"\n" +
			"  movableRowsReceiver \"add\"\n" +
			"  movableRowsSender \"delete\"\n" +
			"  placeholder \"All Rows Moved\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("#example-table-receiver", opts.get("movableRowsConnectedTables"));
		assertEquals("add", opts.get("movableRowsReceiver"));
		assertEquals("delete", opts.get("movableRowsSender"));
		assertEquals("All Rows Moved", opts.get("placeholder"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(1, cols.size());
	}

	/** #42 Movable Rows Between Elements: Using the movableRowsConnectedElements
	 *  property you can set the elements that can receive rows from a table. */
	@Test
	public void testMovableRowsBetweenElements() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  movableRows true\n" +
			"  movableRowsConnectedElements \"#drop-element\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("#drop-element", opts.get("movableRowsConnectedElements"));
		assertEquals(true, opts.get("movableRows"));
	}

	/** #43 Clipboard: Using the clipboard option, you can allow users to copy and paste
	 *  from your table. */
	@Test
	public void testClipboard() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  clipboard true\n" +
			"  clipboardPasteAction \"replace\"\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      width 100\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      width 80\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"date\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      formatter \"tickCross\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("clipboard"));
		assertEquals("replace", opts.get("clipboardPasteAction"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
	}

	/** #44 Interaction History: By setting the history option to true, you can make the
	 *  table track any user changes to the table. */
	@Test
	public void testInteractionHistory() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  history true\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"      width 200\n" +
			"      editor \"input\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      hozAlign \"right\"\n" +
			"      editor \"input\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"      editor \"input\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"      hozAlign \"center\"\n" +
			"      width 100\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"      sorter \"date\"\n" +
			"      hozAlign \"center\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Driver\"\n" +
			"      field \"car\"\n" +
			"      hozAlign \"center\"\n" +
			"      sorter \"boolean\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals(true, opts.get("history"));
		assertEquals("fitColumns", opts.get("layout"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(7, cols.size());
		assertEquals("input", cols.get(0).get("editor"));
		assertEquals("input", cols.get(1).get("editor"));
		assertEquals("input", cols.get(2).get("editor"));
	}

	// ═════════════════════════════════════════════════════════════════════════════
	// ADVANCED  (#45)
	// ═════════════════════════════════════════════════════════════════════════════

	/** #45 Localization: You can localize the content of your tables to meet the needs
	 *  of your regional users. */
	@Test
	public void testLocalization() throws Exception {
		String dsl = "tabulator {\n" +
			"  height \"311px\"\n" +
			"  layout \"fitColumns\"\n" +
			"  pagination \"local\"\n" +
			"  langs([\"fr-fr\": [columns: [name: \"Nom\", progress: \"Progression\", gender: \"Genre\", rating: \"\\u00C9valuation\", col: \"Couleur\", dob: \"Date de Naissance\"], pagination: [first: \"Premier\", first_title: \"Premi\\u00E8re Page\", last: \"Dernier\", last_title: \"Derni\\u00E8re Page\", prev: \"Pr\\u00E9c\\u00E9dent\", prev_title: \"Page Pr\\u00E9c\\u00E9dente\", next: \"Suivant\", next_title: \"Page Suivante\", all: \"Toute\"]], \"de-de\": [columns: [name: \"Name\", progress: \"Fortschritt\", gender: \"Genre\", rating: \"Geschlecht\", col: \"Farbe\", dob: \"Geburtsdatum\"], pagination: [first: \"Erste\", first_title: \"Erste Seite\", last: \"Letzte\", last_title: \"Letzte Seite\", prev: \"Vorige\", prev_title: \"Vorige Seite\", next: \"N\\u00E4chste\", next_title: \"N\\u00E4chste Seite\", all: \"Alle\"]]])\n" +
			"  columns {\n" +
			"    column {\n" +
			"      title \"Name\"\n" +
			"      field \"name\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Progress\"\n" +
			"      field \"progress\"\n" +
			"      sorter \"number\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Gender\"\n" +
			"      field \"gender\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Rating\"\n" +
			"      field \"rating\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Favourite Color\"\n" +
			"      field \"col\"\n" +
			"    }\n" +
			"    column {\n" +
			"      title \"Date Of Birth\"\n" +
			"      field \"dob\"\n" +
			"    }\n" +
			"  }\n" +
			"}";

		TabulatorOptions result = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dsl);
		Map<String, Object> opts = result.getOptions();

		assertEquals("fitColumns", opts.get("layout"));
		assertEquals("local", opts.get("pagination"));

		@SuppressWarnings("unchecked")
		Map<String, Object> langs = (Map<String, Object>) opts.get("langs");
		assertNotNull("langs should be present", langs);
		assertTrue("Should contain fr-fr locale", langs.containsKey("fr-fr"));
		assertTrue("Should contain de-de locale", langs.containsKey("de-de"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> cols = (List<Map<String, Object>>) opts.get("columns");
		assertEquals(6, cols.size());
	}
}
