package com.sourcekraft.documentburster.common.pivottable;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pivot Table options DTO - aligned with react-pivottable API.
 * Used for frontend preview rendering.
 */
public class PivotTableOptions {
	// Row/Column/Value field selections
	private List<String> rows = new ArrayList<>();
	private List<String> cols = new ArrayList<>();
	private List<String> vals = new ArrayList<>();
	
	// Aggregation
	private String aggregatorName = "Count";
	
	// Renderer selection
	private String rendererName = "Table";
	
	// Sorting
	private String rowOrder = "key_a_to_z";
	private String colOrder = "key_a_to_z";
	
	// Value filtering: { attrName: { value: true, ... }, ... }
	private Map<String, Map<String, Boolean>> valueFilter = new LinkedHashMap<>();
	
	// Additional options passthrough
	private Map<String, Object> options = new LinkedHashMap<>();
	
	// Optional data override
	private List<Map<String, Object>> data = new ArrayList<>();

	// UI control attributes
	private List<String> hiddenAttributes = new ArrayList<>();
	private List<String> hiddenFromAggregators = new ArrayList<>();
	private List<String> hiddenFromDragDrop = new ArrayList<>();
	private Integer unusedOrientationCutoff = null;
	private Integer menuLimit = null;
	
	// Custom sorters: { attrName: ['val1', 'val2', ...] } for custom order
	private Map<String, Object> sorters = new LinkedHashMap<>();
	
	// Derived attributes: { newColName: 'expression' }
	private Map<String, String> derivedAttributes = new LinkedHashMap<>();

	// Getters and setters
	public List<String> getRows() { return rows; }
	public void setRows(List<String> rows) { this.rows = rows; }

	public List<String> getCols() { return cols; }
	public void setCols(List<String> cols) { this.cols = cols; }

	public List<String> getVals() { return vals; }
	public void setVals(List<String> vals) { this.vals = vals; }

	public String getAggregatorName() { return aggregatorName; }
	public void setAggregatorName(String aggregatorName) { this.aggregatorName = aggregatorName; }

	public String getRendererName() { return rendererName; }
	public void setRendererName(String rendererName) { this.rendererName = rendererName; }

	public String getRowOrder() { return rowOrder; }
	public void setRowOrder(String rowOrder) { this.rowOrder = rowOrder; }

	public String getColOrder() { return colOrder; }
	public void setColOrder(String colOrder) { this.colOrder = colOrder; }

	public Map<String, Map<String, Boolean>> getValueFilter() { return valueFilter; }
	public void setValueFilter(Map<String, Map<String, Boolean>> valueFilter) { this.valueFilter = valueFilter; }

	public Map<String, Object> getOptions() { return options; }
	public void setOptions(Map<String, Object> options) { this.options = options; }

	public List<Map<String, Object>> getData() { return data; }
	public void setData(List<Map<String, Object>> data) { this.data = data; }

	public List<String> getHiddenAttributes() { return hiddenAttributes; }
	public void setHiddenAttributes(List<String> hiddenAttributes) { this.hiddenAttributes = hiddenAttributes; }

	public List<String> getHiddenFromAggregators() { return hiddenFromAggregators; }
	public void setHiddenFromAggregators(List<String> hiddenFromAggregators) { this.hiddenFromAggregators = hiddenFromAggregators; }

	public List<String> getHiddenFromDragDrop() { return hiddenFromDragDrop; }
	public void setHiddenFromDragDrop(List<String> hiddenFromDragDrop) { this.hiddenFromDragDrop = hiddenFromDragDrop; }

	public Integer getUnusedOrientationCutoff() { return unusedOrientationCutoff; }
	public void setUnusedOrientationCutoff(Integer unusedOrientationCutoff) { this.unusedOrientationCutoff = unusedOrientationCutoff; }

	public Integer getMenuLimit() { return menuLimit; }
	public void setMenuLimit(Integer menuLimit) { this.menuLimit = menuLimit; }

	public Map<String, Object> getSorters() { return sorters; }
	public void setSorters(Map<String, Object> sorters) { this.sorters = sorters; }

	public Map<String, String> getDerivedAttributes() { return derivedAttributes; }
	public void setDerivedAttributes(Map<String, String> derivedAttributes) { this.derivedAttributes = derivedAttributes; }
}
