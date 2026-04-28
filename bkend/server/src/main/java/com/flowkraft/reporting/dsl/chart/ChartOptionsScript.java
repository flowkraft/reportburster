package com.flowkraft.reporting.dsl.chart;

import groovy.lang.Script;
import groovy.lang.Closure;

import java.util.*;

/**
 * Groovy DSL base for parsing Chart.js options.
 *
 * DESIGN PRINCIPLES:
 * 1. This DSL is the MINIMUM POSSIBLE wrapper over the EXACT SAME Chart.js API.
 *    Every keyword (type, data, datasets, options, plugins, scales, responsive,
 *    maintainAspectRatio, backgroundColor, borderColor, tension, fill, etc.) maps
 *    1:1 to chartjs.org — no invented concepts, no renamed properties, no wrapper objects.
 * 2. Only where provably necessary do we deviate from Chart.js's JSON structure:
 *    - 'labelField' on the data block (DSL-specific: maps a reportData column to labels,
 *      since Chart.js has no concept of column binding)
 *    - 'field' on each dataset (DSL-specific: maps a reportData column to dataset values,
 *      since Chart.js has no concept of column binding)
 *    - Groovy closures for nested structures like options { plugins { title { ... } } }
 *    Such deviations are kept to the absolute minimum.
 * 3. Both chart-level and dataset-level use methodMissing catch-alls so that ANY current
 *    or future Chart.js property works automatically without code changes here.
 * 4. The output of getOptions() is a flat Map that matches Chart.js's constructor
 *    config object directly — no intermediate wrappers.
 *
 * Usage:
 *   chart {
 *     type 'bar'
 *     data {
 *       labelField 'month'
 *       datasets {
 *         dataset { field 'revenue'; label 'Revenue'; backgroundColor '#4e79a7' }
 *       }
 *     }
 *     options { responsive true; plugins { title { display true; text 'Report' } } }
 *   }
 */
public abstract class ChartOptionsScript extends Script {
	private String type = null;
	private String labelField = null;
	private Map<String, Object> options = new LinkedHashMap<>();
	private final List<String> labels = new ArrayList<>();
	private final List<Map<String, Object>> datasets = new ArrayList<>();
	private final List<Map<String, Object>> dataRows = new ArrayList<>();

	// Named blocks: id → options map
	private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

	// DSL root — unnamed (default)
	public void chart(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// DSL root — named block for aggregator reports
	public void chart(String id, Closure<?> body) {
		NamedChartDelegate delegate = new NamedChartDelegate();
		body.setDelegate(delegate);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		namedOptions.put(id, delegate.getOptions());
	}

	// Chart type: line, bar, pie, doughnut, radar, polarArea, scatter, bubble
	public void type(String t) { this.type = t; }

	// labelField and datasets at the top level (emitted by GroovyDslEmitter)
	public void labelField(String f) { this.labelField = f; }

	@SuppressWarnings("unchecked")
	public void datasets(List<?> list) {
		if (list == null) return;
		for (Object item : list) {
			if (item instanceof Map) this.datasets.add(new LinkedHashMap<>((Map<String, Object>) item));
		}
	}

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

	// ── Chart.js data { } block ──

	// data block - closure form (Chart.js aligned: data { labelField ...; datasets { ... } })
	public void data(Closure<?> body) {
		DataDelegate dd = new DataDelegate();
		body.setDelegate(dd);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		if (dd.labelField != null) this.labelField = dd.labelField;
		if (!dd.labels.isEmpty()) this.labels.addAll(dd.labels);
		this.datasets.addAll(dd.datasets);
	}

	// Optional data override - defaults to ctx.reportData if not specified
	public void data(List<Map<String, Object>> rows) {
		if (rows != null) {
			for (Map<String, Object> r : rows) {
				this.dataRows.add(new LinkedHashMap<>(r));
			}
		}
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

	/** Return named options map (id → options) for aggregator reports */
	public Map<String, Map<String, Object>> getNamedOptions() {
		return namedOptions;
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

	// ═══════════════════════════════════════════════════════════════════════════
	// Inner classes
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Chart.js data { } block delegate.
	 * Captures labelField/labels and datasets, then pushes to parent.
	 */
	private static class DataDelegate {
		String labelField;
		final List<String> labels = new ArrayList<>();
		final List<Map<String, Object>> datasets = new ArrayList<>();

		public void labelField(String f) { this.labelField = f; }

		public void labels(List<String> vals) { if (vals != null) labels.addAll(vals); }

		public void datasets(Closure<?> body) {
			DatasetsContainer dc = new DatasetsContainer();
			body.setDelegate(dc);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
			datasets.addAll(dc.getDatasets());
		}

		public void dataset(Map<String, Object> args) {
			if (args != null) datasets.add(new LinkedHashMap<>(args));
		}

		public void dataset(Closure<?> body) {
			Map<String, Object> ds = new LinkedHashMap<>();
			DatasetDelegate d = new DatasetDelegate(ds);
			body.setDelegate(d);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
			datasets.add(ds);
		}
	}

	/**
	 * Container for multiple dataset definitions.
	 * Mirrors Chart.js datasets: [ {}, {}, ... ]
	 * Like columns { column { } } in the Tabulator DSL.
	 */
	private static class DatasetsContainer {
		private final List<Map<String, Object>> datasets = new ArrayList<>();

		public void dataset(Closure<?> body) {
			Map<String, Object> ds = new LinkedHashMap<>();
			DatasetDelegate d = new DatasetDelegate(ds);
			body.setDelegate(d);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
			datasets.add(ds);
		}

		public void dataset(Map<String, Object> args) {
			if (args != null) datasets.add(new LinkedHashMap<>(args));
		}

		List<Map<String, Object>> getDatasets() { return datasets; }
	}

	/**
	 * Dataset delegate — thin wrapper over Chart.js dataset properties.
	 * Only 'field' is DSL-specific (maps a reportData column to dataset values).
	 * Every other property (label, backgroundColor, borderColor, type, yAxisID,
	 * borderWidth, fill, tension, pointRadius, etc.) passes through to Chart.js
	 * via methodMissing — no explicit methods, no invented abstractions.
	 */
	private static class DatasetDelegate {
		private final Map<String, Object> map;

		DatasetDelegate(Map<String, Object> map) { this.map = map; }

		// The one DSL-specific property: which reportData column to plot
		public void field(String f) { map.put("field", f); }

		// Catch-all: any Chart.js dataset property works automatically
		public void methodMissing(String name, Object args) {
			if (args instanceof Object[] && ((Object[]) args).length > 0) {
				map.put(name, ((Object[]) args)[0]);
			} else {
				map.put(name, args);
			}
		}
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

	/**
	 * Delegate for named chart blocks — captures options independently
	 * so multiple named blocks don't interfere with each other or the unnamed default.
	 */
	private static class NamedChartDelegate {
		private String type = null;
		private String labelField = null;
		private Map<String, Object> options = new LinkedHashMap<>();
		private final List<String> labels = new ArrayList<>();
		private final List<Map<String, Object>> datasets = new ArrayList<>();
		private final List<Map<String, Object>> dataRows = new ArrayList<>();

		public void type(String t) { this.type = t; }

		public void labelField(String f) { this.labelField = f; }

		@SuppressWarnings("unchecked")
		public void datasets(List<?> list) {
			if (list == null) return;
			for (Object item : list) {
				if (item instanceof Map) this.datasets.add(new LinkedHashMap<>((Map<String, Object>) item));
			}
		}

		public void options(Map<String, Object> args) {
			if (args != null) options.putAll(args);
		}

		public void options(Closure<?> body) {
			NestedMapDelegate d = new NestedMapDelegate(options);
			body.setDelegate(d);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
		}

		public void labels(List<String> vals) {
			if (vals != null) labels.addAll(vals);
		}

		// data block - closure form (Chart.js aligned)
		public void data(Closure<?> body) {
			DataDelegate dd = new DataDelegate();
			body.setDelegate(dd);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
			if (dd.labelField != null) this.labelField = dd.labelField;
			if (!dd.labels.isEmpty()) this.labels.addAll(dd.labels);
			this.datasets.addAll(dd.datasets);
		}

		// data override - list form
		public void data(List<Map<String, Object>> rows) {
			if (rows != null) {
				for (Map<String, Object> r : rows) {
					this.dataRows.add(new LinkedHashMap<>(r));
				}
			}
		}

		public Object methodMissing(String name, Object args) {
			if (args instanceof Object[] && ((Object[]) args).length > 0) {
				this.options.put(name, ((Object[]) args)[0]);
			} else {
				this.options.put(name, args);
			}
			return null;
		}

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
	}
}
