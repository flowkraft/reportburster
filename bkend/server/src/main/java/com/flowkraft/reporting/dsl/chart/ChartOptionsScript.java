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
 * 4. The output of getOptions() is a Map shaped 1:1 like Chart.js's constructor
 *    config object — {@code { type, data: { labelField, seriesField, labels,
 *    datasets }, options }}. Single source of truth: see
 *    {@link #buildOptionsMap}.
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
/**
 * <h2>ChartOptionsScript — chart DSL parser, block form only.</h2>
 *
 * <p>See {@link com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme#iAmImportantReadme()}
 * for full DSL architecture principles + chart-specific GOOD/BAD examples.
 * Static init below compile-pins this class to that readme.
 *
 * <p><b>Important:</b> {@code labelField}, {@code seriesField}, and
 * {@code datasets} live ONLY inside the {@code data { }} block — top-level
 * setters were removed in the unification refactor. Do not re-add them.
 */
public abstract class ChartOptionsScript extends Script {

    static { com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme.iAmImportantReadme(); }

	// ── Single source of truth for parsing chart DSL ──
	// Both the unnamed `chart { ... }` and named `chart('id') { ... }` forms
	// dispatch their closure body to a NamedChartDelegate — the ONE class that
	// owns all setters, methodMissing, and the data{}/options{} sub-delegates.
	// Per DSLPrinciplesReadme Principle 2 (DRY): no parallel parser surfaces.

	/** Captures the unnamed default {@code chart { ... }} block, if present. */
	private NamedChartDelegate unnamedDelegate;

	/** Named blocks: id → options map (populated by {@link #chart(String, Closure)}). */
	private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

	// DSL root — unnamed (default)
	public void chart(Closure<?> body) {
		NamedChartDelegate delegate = new NamedChartDelegate();
		body.setDelegate(delegate);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		this.unnamedDelegate = delegate;
	}

	// DSL root — named block for aggregator reports
	public void chart(String id, Closure<?> body) {
		NamedChartDelegate delegate = new NamedChartDelegate();
		body.setDelegate(delegate);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		namedOptions.put(id, delegate.getOptions());
	}

	/** Return final options map for the unnamed form (empty if none was declared). */
	public Map<String, Object> getOptions() {
		return unnamedDelegate != null ? unnamedDelegate.getOptions() : new LinkedHashMap<>();
	}

	/**
	 * Build the canonical chart Map from a delegate's parsed state. SINGLE
	 * SOURCE OF TRUTH per DSLPrinciplesReadme Principle 2 (DRY): both the
	 * top-level {@code chart { ... }} form and the named
	 * {@code chart('id') { ... }} form route through this helper so the
	 * emitted shape cannot drift.
	 *
	 * <p>Canonical shape per the README (Chart section):
	 * {@code { type, options, data: { labelField, seriesField, labels, datasets } }}.
	 * labelField/seriesField/labels/datasets are NEVER emitted at the top
	 * level — they live inside the nested {@code data { }} block (Chart.js
	 * shape). Top-level emission caused the byte-stable round-trip bug where
	 * the Map ended up with BOTH flat keys AND a nested {@code data} block.
	 */
	private static Map<String, Object> buildOptionsMap(
			String type, String labelField, String seriesField,
			Map<String, Object> options, List<String> labels,
			List<Map<String, Object>> datasets, List<Map<String, Object>> dataRows) {
		Map<String, Object> out = new LinkedHashMap<>();
		if (type != null) out.put("type", type);
		if (!options.isEmpty()) out.put("options", new LinkedHashMap<>(options));
		if (!dataRows.isEmpty()) {
			// Legacy override form: chart { data([[row1],[row2]]) } — preserve.
			out.put("data", new ArrayList<>(dataRows));
		} else if (labelField != null || seriesField != null || !labels.isEmpty() || !datasets.isEmpty()) {
			Map<String, Object> data = new LinkedHashMap<>();
			if (labelField != null) data.put("labelField", labelField);
			if (seriesField != null) data.put("seriesField", seriesField);
			if (!labels.isEmpty()) data.put("labels", new ArrayList<>(labels));
			if (!datasets.isEmpty()) data.put("datasets", new ArrayList<>(datasets));
			out.put("data", data);
		}
		return out;
	}

	/** Return named options map (id → options) for aggregator reports */
	public Map<String, Map<String, Object>> getNamedOptions() {
		return namedOptions;
	}

	@Override
	public Object run() { return null; }

	// ═══════════════════════════════════════════════════════════════════════════
	// Inner classes
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Chart.js data { } block delegate.
	 * Captures labelField/labels and datasets, then pushes to parent.
	 */
	private static class DataDelegate {
		String labelField;
		String seriesField;
		final List<String> labels = new ArrayList<>();
		final List<Map<String, Object>> datasets = new ArrayList<>();

		public void labelField(String f) { this.labelField = f; }
		public void seriesField(String f) { this.seriesField = f; }

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
		private String seriesField = null;
		private Map<String, Object> options = new LinkedHashMap<>();
		private final List<String> labels = new ArrayList<>();
		private final List<Map<String, Object>> datasets = new ArrayList<>();
		private final List<Map<String, Object>> dataRows = new ArrayList<>();

		public void type(String t) { this.type = t; }

		// Explicit flat-form setters — mirror the root-class setters above.
		// The emitter promotes these fields to flat root level; these setters handle re-parse.
		public void labelField(String f) { this.labelField = f; }
		public void seriesField(String f) { this.seriesField = f; }
		public void datasets(Closure<?> body) {
			DatasetsContainer dc = new DatasetsContainer();
			body.setDelegate(dc);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
			datasets.addAll(dc.getDatasets());
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
			if (dd.seriesField != null) this.seriesField = dd.seriesField;
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
			// Routes through the same canonical-shape builder as the top-level
			// `chart { ... }` form — see ChartOptionsScript.buildOptionsMap.
			return buildOptionsMap(type, labelField, seriesField, options, labels, datasets, dataRows);
		}
	}
}
