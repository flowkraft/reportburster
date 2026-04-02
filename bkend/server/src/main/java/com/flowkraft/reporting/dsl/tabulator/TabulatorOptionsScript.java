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
public abstract class TabulatorOptionsScript extends Script {
	private final Map<String, Object> tableOptions = new LinkedHashMap<>();
	private final List<Map<String, Object>> columns = new ArrayList<>();
	private final List<Map<String, Object>> dataRows = new ArrayList<>();

	// Named blocks: id → options map
	private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

	// DSL root — unnamed (default)
	public void tabulator(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// DSL root — named block for aggregator reports
	public void tabulator(String id, Closure<?> body) {
		// Use a temporary script-like delegate to capture this block's options independently
		NamedTabulatorDelegate delegate = new NamedTabulatorDelegate();
		body.setDelegate(delegate);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
		namedOptions.put(id, delegate.getOptions());
	}

	// columns block
	public void columns(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// column overloads
	public void column(Map<String, Object> args) { column(args, null); }
	public void column(Closure<?> body) { column(new LinkedHashMap<>(), body); }
	public void column(Map<String,Object> args, Closure<?> body) {
		Map<String, Object> c = new LinkedHashMap<>(args);
		this.columns.add(c);
		if (body != null) {
			ColumnDelegate d = new ColumnDelegate(c);
			body.setDelegate(d);
			body.setResolveStrategy(Closure.DELEGATE_FIRST);
			body.call();
		}
	}

	// data rows
	public void data(List<Map<String, Object>> rows) {
		if (rows != null) {
			for (Map<String,Object> r : rows) {
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

	/** Return final options map — flat structure matching tabulator.info API */
	public Map<String, Object> getOptions() {
		Map<String, Object> out = new LinkedHashMap<>(tableOptions);
		if (!columns.isEmpty()) out.put("columns", new ArrayList<>(columns));
		if (!dataRows.isEmpty()) out.put("data", new ArrayList<>(dataRows));
		return out;
	}

	/** Return named options map (id → options) for aggregator reports */
	public Map<String, Map<String, Object>> getNamedOptions() {
		return namedOptions;
	}

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
	 * Delegate for named tabulator blocks — captures options independently
	 * so multiple named blocks don't interfere with each other or the unnamed default.
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

	@Override
	public Object run() {
		return null;
	}
}
