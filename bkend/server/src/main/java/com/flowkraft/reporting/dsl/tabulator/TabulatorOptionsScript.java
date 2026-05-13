package com.flowkraft.reporting.dsl.tabulator;

import groovy.lang.Script;
import groovy.lang.Closure;

import java.util.*;

/**
 * Groovy DSL base for parsing Tabulator options.
 *
 * DESIGN PRINCIPLES:
 * 1. This DSL is the MINIMUM POSSIBLE wrapper over the EXACT SAME tabulator.info API.
 *    Every keyword (layout, height, pagination, paginationSize, paginationMode, filterMode,
 *    sortMode, headerFilter, sorter, formatter, etc.) maps 1:1 to tabulator.info — no
 *    invented concepts, no renamed properties, no wrapper objects.
 * 2. Only where provably necessary (e.g. Groovy syntax requires closures for nested
 *    structures like columns) do we deviate from tabulator.info's JSON structure, and
 *    such deviations are kept to the absolute minimum.
 * 3. Both table-level and column-level use methodMissing catch-alls so that ANY current
 *    or future tabulator.info property works automatically without code changes here.
 * 4. The output of getOptions() is a flat Map that matches Tabulator's constructor
 *    options object directly — no intermediate wrappers.
 *
 * Usage: tabulator { layout "fitColumns"; height 400; pagination true; columns { column { title "Name"; field "name" } } }
 */
/**
 * <h2>TabulatorOptionsScript — tabulator DSL parser, block form only.</h2>
 *
 * <p>See {@link com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme#iAmImportantReadme()}
 * for full DSL principles + tabulator-specific GOOD/BAD examples. Static init
 * below compile-pins this class to that readme.
 *
 * <p><b>Note:</b> {@code methodMissing} on {@code ColumnDelegate} is intentional
 * openness (tabulator.info has ~80 column properties: sorter, formatter,
 * hozAlign, ...) — NOT drift.
 */
public abstract class TabulatorOptionsScript extends Script {

    static { com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme.iAmImportantReadme(); }

	// ── Single source of truth for parsing tabulator DSL ──
	// Both the unnamed `tabulator { ... }` and named `tabulator('id') { ... }` forms
	// dispatch their closure body to a NamedTabulatorDelegate — the ONE class that
	// owns tableOptions, columns, dataRows, column()/data() overloads, and methodMissing.
	// Per DSLPrinciplesReadme Principle 2 (DRY): no parallel parser surfaces.

	/** Captures the unnamed default {@code tabulator { ... }} block, if present. */
	private NamedTabulatorDelegate unnamedDelegate;

	/** Named blocks: id → options map (populated by {@link #tabulator(String, Closure)}). */
	private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

	// DSL root — unnamed (default)
	public void tabulator(Closure<?> body) {
		NamedTabulatorDelegate delegate = new NamedTabulatorDelegate();
		body.setDelegate(delegate);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		this.unnamedDelegate = delegate;
	}

	// DSL root — named block for aggregator reports
	public void tabulator(String id, Closure<?> body) {
		NamedTabulatorDelegate delegate = new NamedTabulatorDelegate();
		body.setDelegate(delegate);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		namedOptions.put(id, delegate.getOptions());
	}

	/** Return final options map for the unnamed form (empty if none was declared). */
	public Map<String, Object> getOptions() {
		return unnamedDelegate != null ? unnamedDelegate.getOptions() : new LinkedHashMap<>();
	}

	/** Return named options map (id → options) for aggregator reports */
	public Map<String, Map<String, Object>> getNamedOptions() {
		return namedOptions;
	}

	@Override
	public Object run() {
		return null;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// Inner classes
	// ═══════════════════════════════════════════════════════════════════════════

	// Column delegate to capture column-level methods
	// Aligned with Tabulator.info column definition API
	private static class ColumnDelegate {
		private final Map<String, Object> map;
		ColumnDelegate(Map<String, Object> map) { this.map = map; }

		// Catch-all for any Tabulator column property
		public void methodMissing(String name, Object args) {
			if (args instanceof Object[] && ((Object[]) args).length > 0) {
				map.put(name, ((Object[]) args)[0]);
			} else {
				map.put(name, args);
			}
		}
	}

	/**
	 * Delegate for tabulator blocks (both unnamed and named) — single
	 * parse-state owner per DSLPrinciplesReadme Principle 2 (DRY).
	 */
	private static class NamedTabulatorDelegate {
		private final Map<String, Object> tableOptions = new LinkedHashMap<>();
		private final List<Map<String, Object>> columns = new ArrayList<>();
		private final List<Map<String, Object>> dataRows = new ArrayList<>();

		public void columns(Closure<?> body) {
			body.setDelegate(this);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
		}

		public void column(Map<String, Object> args) { column(args, null); }
		public void column(Closure<?> body) { column(new LinkedHashMap<>(), body); }
		public void column(Map<String, Object> args, Closure<?> body) {
			Map<String, Object> c = new LinkedHashMap<>(args);
			this.columns.add(c);
			if (body != null) {
				ColumnDelegate d = new ColumnDelegate(c);
				body.setDelegate(d);
				body.setResolveStrategy(Closure.DELEGATE_FIRST);
				body.call();
			}
		}

		public void data(List<Map<String, Object>> rows) {
			if (rows != null) {
				for (Map<String, Object> r : rows) {
					this.dataRows.add(new LinkedHashMap<>(r));
				}
			}
		}

		// Catch-all for any Tabulator table-level option (layout, height, pagination, paginationSize, etc.)
		public Object methodMissing(String name, Object args) {
			if (args instanceof Object[] && ((Object[]) args).length > 0) {
				tableOptions.put(name, ((Object[]) args)[0]);
			} else {
				tableOptions.put(name, args);
			}
			return null;
		}

		public Map<String, Object> getOptions() {
			Map<String, Object> out = new LinkedHashMap<>(tableOptions);
			if (!columns.isEmpty()) out.put("columns", new ArrayList<>(columns));
			if (!dataRows.isEmpty()) out.put("data", new ArrayList<>(dataRows));
			return out;
		}
	}
}
