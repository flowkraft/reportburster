package com.sourcekraft.documentburster.common.pivottable;

import groovy.lang.Script;
import groovy.lang.Closure;

import java.util.*;

/**
 * Groovy DSL base class for Pivot Table configuration.
 * Aligned with react-pivottable API.
 * 
 * Minimal DSL:
 * pivotTable {
 *   rows 'region', 'country'
 *   cols 'year', 'quarter'
 *   vals 'revenue'
 *   
 *   aggregatorName 'Sum'
 *   rendererName 'Table'
 *   
 *   rowOrder 'key_a_to_z'
 *   colOrder 'key_a_to_z'
 *   
 *   valueFilter {
 *     filter 'status', exclude: ['Inactive', 'Pending']
 *   }
 *   
 *   options {
 *     menuLimit 500
 *   }
 * }
 */
public abstract class PivotTableOptionsScript extends Script {
	private final List<String> rows = new ArrayList<>();
	private final List<String> cols = new ArrayList<>();
	private final List<String> vals = new ArrayList<>();
	private String aggregatorName = null;
	private String rendererName = null;
	private String rowOrder = null;
	private String colOrder = null;
	private final Map<String, Map<String, Boolean>> valueFilter = new LinkedHashMap<>();
	private final Map<String, Object> options = new LinkedHashMap<>();
	private final List<Map<String, Object>> dataRows = new ArrayList<>();
	
	// New fields for complete API coverage
	private final List<String> hiddenAttributes = new ArrayList<>();
	private final List<String> hiddenFromAggregators = new ArrayList<>();
	private final List<String> hiddenFromDragDrop = new ArrayList<>();
	private Integer unusedOrientationCutoff = null;
	private Integer menuLimit = null;
	private final Map<String, Object> sorters = new LinkedHashMap<>();
	private final Map<String, String> derivedAttributes = new LinkedHashMap<>();

	// DSL root
	public void pivotTable(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// Row fields - varargs form
	public void rows(String... fields) {
		if (fields != null) {
			rows.addAll(Arrays.asList(fields));
		}
	}

	// Row fields - list form
	public void rows(List<String> fields) {
		if (fields != null) {
			rows.addAll(fields);
		}
	}

	// Column fields - varargs form
	public void cols(String... fields) {
		if (fields != null) {
			cols.addAll(Arrays.asList(fields));
		}
	}

	// Column fields - list form
	public void cols(List<String> fields) {
		if (fields != null) {
			cols.addAll(fields);
		}
	}

	// Value fields - varargs form
	public void vals(String... fields) {
		if (fields != null) {
			vals.addAll(Arrays.asList(fields));
		}
	}

	// Value fields - list form
	public void vals(List<String> fields) {
		if (fields != null) {
			vals.addAll(fields);
		}
	}

	// Aggregator selection
	// Count, Count Unique Values, List Unique Values, Sum, Integer Sum, Average, Median,
	// Sample Variance, Sample Standard Deviation, Minimum, Maximum, First, Last,
	// Sum over Sum, Sum as Fraction of Total, Sum as Fraction of Rows, Sum as Fraction of Columns,
	// Count as Fraction of Total, Count as Fraction of Rows, Count as Fraction of Columns
	public void aggregatorName(String name) {
		this.aggregatorName = name;
	}

	// Renderer selection
	// Table, Table Heatmap, Table Col Heatmap, Table Row Heatmap, Exportable TSV
	// (Plotly renderers if available: Grouped Column Chart, Stacked Column Chart, etc.)
	public void rendererName(String name) {
		this.rendererName = name;
	}

	// Row sorting: key_a_to_z, value_a_to_z, value_z_to_a
	public void rowOrder(String order) {
		this.rowOrder = order;
	}

	// Column sorting: key_a_to_z, value_a_to_z, value_z_to_a
	public void colOrder(String order) {
		this.colOrder = order;
	}

	// Value filter block
	public void valueFilter(Closure<?> body) {
		ValueFilterDelegate d = new ValueFilterDelegate(valueFilter);
		body.setDelegate(d);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// Options - map form
	public void options(Map<String, Object> args) {
		if (args != null) options.putAll(args);
	}

	// Options - closure form
	public void options(Closure<?> body) {
		NestedMapDelegate d = new NestedMapDelegate(options);
		body.setDelegate(d);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// Optional data override
	public void data(List<Map<String, Object>> rows) {
		if (rows != null) {
			for (Map<String, Object> r : rows) {
				this.dataRows.add(new LinkedHashMap<>(r));
			}
		}
	}

	// Hidden attributes - completely hidden from UI
	public void hiddenAttributes(String... attrs) {
		if (attrs != null) hiddenAttributes.addAll(Arrays.asList(attrs));
	}
	public void hiddenAttributes(List<String> attrs) {
		if (attrs != null) hiddenAttributes.addAll(attrs);
	}

	// Hidden from aggregator dropdown only
	public void hiddenFromAggregators(String... attrs) {
		if (attrs != null) hiddenFromAggregators.addAll(Arrays.asList(attrs));
	}
	public void hiddenFromAggregators(List<String> attrs) {
		if (attrs != null) hiddenFromAggregators.addAll(attrs);
	}

	// Hidden from drag-drop only
	public void hiddenFromDragDrop(String... attrs) {
		if (attrs != null) hiddenFromDragDrop.addAll(Arrays.asList(attrs));
	}
	public void hiddenFromDragDrop(List<String> attrs) {
		if (attrs != null) hiddenFromDragDrop.addAll(attrs);
	}

	// Layout threshold for unused attributes orientation
	public void unusedOrientationCutoff(int value) {
		this.unusedOrientationCutoff = value;
	}

	// Max values shown in filter menu
	public void menuLimit(int value) {
		this.menuLimit = value;
	}

	// Custom sorters - map form: sorters region: ['West', 'East', 'North', 'South']
	public void sorters(Map<String, Object> map) {
		if (map != null) sorters.putAll(map);
	}

	// Derived attributes - computed columns
	// derivedAttributes year: 'dateFormat(orderDate, "%y")'
	public void derivedAttributes(Map<String, String> map) {
		if (map != null) derivedAttributes.putAll(map);
	}

	/** Return final options map */
	public Map<String, Object> getOptions() {
		Map<String, Object> out = new LinkedHashMap<>();
		if (!rows.isEmpty()) out.put("rows", new ArrayList<>(rows));
		if (!cols.isEmpty()) out.put("cols", new ArrayList<>(cols));
		if (!vals.isEmpty()) out.put("vals", new ArrayList<>(vals));
		if (aggregatorName != null) out.put("aggregatorName", aggregatorName);
		if (rendererName != null) out.put("rendererName", rendererName);
		if (rowOrder != null) out.put("rowOrder", rowOrder);
		if (colOrder != null) out.put("colOrder", colOrder);
		if (!valueFilter.isEmpty()) out.put("valueFilter", new LinkedHashMap<>(valueFilter));
		if (!options.isEmpty()) out.put("options", new LinkedHashMap<>(options));
		if (!dataRows.isEmpty()) out.put("data", new ArrayList<>(dataRows));
		// New fields
		if (!hiddenAttributes.isEmpty()) out.put("hiddenAttributes", new ArrayList<>(hiddenAttributes));
		if (!hiddenFromAggregators.isEmpty()) out.put("hiddenFromAggregators", new ArrayList<>(hiddenFromAggregators));
		if (!hiddenFromDragDrop.isEmpty()) out.put("hiddenFromDragDrop", new ArrayList<>(hiddenFromDragDrop));
		if (unusedOrientationCutoff != null) out.put("unusedOrientationCutoff", unusedOrientationCutoff);
		if (menuLimit != null) out.put("menuLimit", menuLimit);
		if (!sorters.isEmpty()) out.put("sorters", new LinkedHashMap<>(sorters));
		if (!derivedAttributes.isEmpty()) out.put("derivedAttributes", new LinkedHashMap<>(derivedAttributes));
		return out;
	}

	@Override
	public Object run() { return null; }

	/**
	 * Value filter delegate - handles filter definitions
	 * filter 'column', exclude: ['val1', 'val2']
	 */
	private static class ValueFilterDelegate {
		private final Map<String, Map<String, Boolean>> filters;

		ValueFilterDelegate(Map<String, Map<String, Boolean>> filters) {
			this.filters = filters;
		}

		public void filter(String attribute, Map<String, Object> args) {
			Map<String, Boolean> attrFilter = new LinkedHashMap<>();
			
			// exclude: ['val1', 'val2'] - these values are filtered OUT (set to true)
			Object excludeObj = args.get("exclude");
			if (excludeObj instanceof List) {
				for (Object val : (List<?>) excludeObj) {
					attrFilter.put(String.valueOf(val), true);
				}
			}
			
			// include can be handled inversely if needed
			// For now, we follow react-pivottable's valueFilter semantics:
			// values in the filter map with true are EXCLUDED
			
			if (!attrFilter.isEmpty()) {
				filters.put(attribute, attrFilter);
			}
		}

		// Catch-all for simpler syntax
		public Object methodMissing(String name, Object args) {
			// Could be used for: status exclude: ['Inactive']
			// where 'status' is called as a method
			if (args instanceof Object[]) {
				Object[] arr = (Object[]) args;
				if (arr.length > 0 && arr[0] instanceof Map) {
					filter(name, (Map<String, Object>) arr[0]);
				}
			}
			return null;
		}
	}

	/**
	 * Nested map delegate for options block
	 */
	private static class NestedMapDelegate {
		private final Map<String, Object> map;

		NestedMapDelegate(Map<String, Object> map) { this.map = map; }

		public Object methodMissing(String name, Object args) {
			if (args instanceof Object[]) {
				Object[] arr = (Object[]) args;
				if (arr.length == 1 && arr[0] instanceof Closure) {
					Map<String, Object> subMap = new LinkedHashMap<>();
					Closure<?> c = (Closure<?>) arr[0];
					NestedMapDelegate sub = new NestedMapDelegate(subMap);
					c.setDelegate(sub);
					c.setResolveStrategy(Closure.DELEGATE_FIRST);
					c.call();
					map.put(name, subMap);
				} else if (arr.length > 0) {
					map.put(name, arr[0]);
				}
			} else {
				map.put(name, args);
			}
			return null;
		}
	}
}
