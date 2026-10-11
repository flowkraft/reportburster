package com.flowkraft.reporting.dsl.chart;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chart options DTO used for frontend preview.
 * Contains configuration for Chart.js rendering.
 * 
 * Data defaults to reportData (passed separately via API response).
 * If DSL specifies data override, it's included here.
 */
public class ChartOptions {
	private String type;
	private String labelField; // Which column to use for X-axis labels
	private String seriesField; // Optional pivot column — frontend splits rows into one dataset per distinct value
	private Map<String, Object> options = new LinkedHashMap<>();
	private List<String> labels = new ArrayList<>(); // Explicit labels override
	private List<Map<String,Object>> datasets = new ArrayList<>(); // Series/dataset configurations
	private List<Map<String,Object>> data = new ArrayList<>(); // Optional data override
	/**
	 * Whether a click on a bar of this chart selects the value its label stands for, the way a
	 * slicer pick does ({@code clicksFilter} in the chart's DSL). Null means the author never
	 * ticked it, which is every chart until one is.
	 *
	 * <p>LOGIC-MIRROR of {@code clicksFilterOf} in
	 * {@code ui-startpage/lib/explore-data/slicer-filters.ts}: the canvas writes the condition for
	 * every field a click can select into the OTHER widgets' SQL, and this is what tells the
	 * published chart it may make such a selection.
	 */
	private Boolean clicksFilter;
	/**
	 * Which of the named colour sets this chart is drawn in ({@code palette 'warm'} in the chart's
	 * DSL): one of {@code warm}, {@code cool}, {@code pastel}, {@code mono}. Null or empty is the
	 * house colours, which is every chart whose author never picked another set.
	 *
	 * <p>LOGIC-MIRROR of {@code PALETTE_COLORS} in
	 * {@code ui-startpage/components/explore-data/widgets/ChartWidget.tsx} and of
	 * {@code RB_NAMED_PALETTES} in {@code RbChart.wc.svelte}: the canvas and the published page
	 * draw the same chart in the same colours because all three know the same names.
	 */
	private String palette;

	private Map<String, ChartOptions> namedOptions = new LinkedHashMap<>(); // Named blocks for aggregator reports
	/**
	 * What the parser did not recognise at chart level, each {@code {chart, block, key, level,
	 * message}} - the cube DSL's warning shape. Empty for every chart written the way the DSL asks,
	 * which is every shipped one.
	 */
	private List<Map<String,Object>> warnings = new ArrayList<>();

	public String getType() { return type; }
	public void setType(String type) { this.type = type; }

	public String getLabelField() { return labelField; }
	public void setLabelField(String labelField) { this.labelField = labelField; }

	public String getSeriesField() { return seriesField; }
	public void setSeriesField(String seriesField) { this.seriesField = seriesField; }

	public Map<String, Object> getOptions() { return options; }
	public void setOptions(Map<String, Object> options) { this.options = options; }

	public List<String> getLabels() { return labels; }
	public void setLabels(List<String> labels) { this.labels = labels; }

	public List<Map<String, Object>> getDatasets() { return datasets; }
	public void setDatasets(List<Map<String, Object>> datasets) { this.datasets = datasets; }

	public List<Map<String, Object>> getData() { return data; }
	public void setData(List<Map<String, Object>> data) { this.data = data; }

	public Boolean getClicksFilter() { return clicksFilter; }
	public void setClicksFilter(Boolean clicksFilter) { this.clicksFilter = clicksFilter; }

	public String getPalette() { return palette; }
	public void setPalette(String palette) { this.palette = palette; }

	public Map<String, ChartOptions> getNamedOptions() { return namedOptions; }
	public void setNamedOptions(Map<String, ChartOptions> namedOptions) { this.namedOptions = namedOptions; }

	public List<Map<String, Object>> getWarnings() { return warnings; }
	public void setWarnings(List<Map<String, Object>> warnings) { this.warnings = warnings; }
}
