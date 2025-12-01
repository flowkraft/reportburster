package com.sourcekraft.documentburster.common.chart;

import groovy.lang.Script;
import groovy.lang.Closure;

import java.util.*;

/**
 * Groovy DSL base class for Chart configuration.
 * Aligned with wpDataTables-style chart capabilities.
 * 
 * Minimal DSL:
 * chart {
 *   type 'bar'
 *   
 *   // Which column to use for X-axis labels (optional - auto-detected if not specified)
 *   labelField 'month'
 *   
 *   // Series configuration - which data columns to chart
 *   series {
 *     series field: 'revenue', label: 'Revenue', color: '#4e79a7'
 *     series field: 'cost', label: 'Cost', color: '#e15759', type: 'line'
 *   }
 *   
 *   // Chart.js options passthrough
 *   options {
 *     responsive true
 *     plugins {
 *       title { display true; text 'Sales Report' }
 *       legend { position 'bottom' }
 *     }
 *   }
 * }
 * 
 * Data defaults to ctx.reportData - no override needed in most cases.
 */
public abstract class ChartOptionsScript extends Script {
	private String type = null;
	private String labelField = null;
	private Map<String, Object> options = new LinkedHashMap<>();
	private final List<String> labels = new ArrayList<>();
	private final List<Map<String, Object>> datasets = new ArrayList<>();
	private final List<Map<String, Object>> dataRows = new ArrayList<>();

	public void chart(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// Chart type: line, bar, pie, doughnut, radar, polarArea, scatter, bubble
	public void type(String t) { this.type = t; }

	// Which column from reportData to use for X-axis labels
	public void labelField(String f) { this.labelField = f; }

	// Chart.js options - map form
	public void options(Map<String, Object> args) {
		if (args != null) options.putAll(args);
	}

	// Chart.js options - closure form for nested structure
	public void options(Closure<?> body) {
		NestedMapDelegate d = new NestedMapDelegate(options);
		body.setDelegate(d);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// Explicit labels override (optional)
	public void labels(List<String> vals) {
		if (vals != null) labels.addAll(vals);
	}

	// Optional data override - defaults to ctx.reportData if not specified
	// Use for filtered/transformed data: data ctx.reportData.findAll { it.status == 'Active' }
	public void data(List<Map<String, Object>> rows) {
		if (rows != null) {
			for (Map<String, Object> r : rows) {
				this.dataRows.add(new LinkedHashMap<>(r));
			}
		}
	}

	// datasets block for explicit Chart.js datasets
	public void datasets(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// Single dataset definition
	public void dataset(Map<String, Object> args) {
		if (args != null) this.datasets.add(new LinkedHashMap<>(args));
	}

	// series block - wpDataTables-inspired series configuration
	public void series(Closure<?> body) {
		SeriesContainer sc = new SeriesContainer();
		body.setDelegate(sc);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		this.datasets.addAll(sc.getSeries());
	}

	// Single series definition (shorthand)
	public void series(Map<String, Object> args) {
		if (args != null) this.datasets.add(new LinkedHashMap<>(args));
	}

	/** Return final options map */
	public Map<String, Object> getOptions() {
		Map<String, Object> out = new LinkedHashMap<>();
		if (type != null) out.put("type", type);
		if (labelField != null) out.put("labelField", labelField);
		if (!options.isEmpty()) out.put("options", new LinkedHashMap<>(options));
		if (!labels.isEmpty()) out.put("labels", new ArrayList<>(labels));
		if (!datasets.isEmpty()) out.put("datasets", new ArrayList<>(datasets));
		if (!dataRows.isEmpty()) out.put("data", new ArrayList<>(dataRows));
		return out;
	}

	@Override
	public Object run() { return null; }

	// Groovy dynamic method handling for top-level options
	public Object methodMissing(String name, Object args) {
		if (args instanceof Object[] && ((Object[]) args).length > 0) {
			this.options.put(name, ((Object[]) args)[0]);
		} else {
			this.options.put(name, args);
		}
		return null;
	}

	/**
	 * Nested map delegate that handles closures recursively for deep options like:
	 * options { plugins { title { display true } } }
	 */
	private static class NestedMapDelegate {
		private final Map<String, Object> map;
		
		NestedMapDelegate(Map<String, Object> map) { this.map = map; }
		
		public Object methodMissing(String name, Object args) {
			if (args instanceof Object[]) {
				Object[] arr = (Object[]) args;
				if (arr.length == 1 && arr[0] instanceof Closure) {
					// Nested closure - create sub-map
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

	/** Series container handles multiple series definitions */
	private static class SeriesContainer {
		private final List<Map<String, Object>> series = new ArrayList<>();
		
		public void series(Map<String, Object> args) { 
			if (args != null) series.add(new LinkedHashMap<>(args)); 
		}
		
		public void series(Closure<?> body) {
			Map<String, Object> s = new LinkedHashMap<>();
			SeriesDelegate d = new SeriesDelegate(s);
			body.setDelegate(d);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
			series.add(s);
		}
		
		public List<Map<String, Object>> getSeries() { return series; }
	}

	/**
	 * Series delegate - wpDataTables-inspired series properties:
	 * field, label, color, type, yAxisID, borderWidth, fill, etc.
	 */
	private static class SeriesDelegate {
		private final Map<String, Object> map;
		
		SeriesDelegate(Map<String, Object> map) { this.map = map; }
		
		// Core series properties
		public void field(String f) { map.put("field", f); }
		public void label(String l) { map.put("label", l); }
		public void color(String c) { map.put("color", c); }
		public void backgroundColor(String c) { map.put("backgroundColor", c); }
		public void borderColor(String c) { map.put("borderColor", c); }
		public void type(String t) { map.put("type", t); }
		
		// Chart.js dataset properties
		public void yAxisID(String id) { map.put("yAxisID", id); }
		public void xAxisID(String id) { map.put("xAxisID", id); }
		public void borderWidth(Object w) { map.put("borderWidth", w); }
		public void fill(Object f) { map.put("fill", f); }
		public void tension(Object t) { map.put("tension", t); }
		public void pointRadius(Object r) { map.put("pointRadius", r); }
		public void pointStyle(Object s) { map.put("pointStyle", s); }
		public void hidden(Object h) { map.put("hidden", h); }
		public void order(Object o) { map.put("order", o); }
		
		// Catch-all for any other Chart.js dataset property
		public void methodMissing(String name, Object args) {
			if (args instanceof Object[] && ((Object[]) args).length > 0) {
				map.put(name, ((Object[]) args)[0]);
			} else {
				map.put(name, args);
			}
		}
	}
}
