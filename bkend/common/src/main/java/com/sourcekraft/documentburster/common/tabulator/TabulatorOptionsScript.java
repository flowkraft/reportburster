package com.sourcekraft.documentburster.common.tabulator;

import groovy.lang.Script;
import groovy.lang.Closure;

import java.util.*;

/** Minimal Groovy DSL base for parsing Tabulator options (v0)
 *  Supports: tabulator { layoutOptions {...} columns { column { title ""; field "" } } data([ ... ]) }
 */
public abstract class TabulatorOptionsScript extends Script {
	private final Map<String, Object> layoutOptions = new LinkedHashMap<>();
	private final List<Map<String, Object>> columns = new ArrayList<>();
	private final List<Map<String, Object>> dataRows = new ArrayList<>();
	private Map<String,Object> currentColumn = null;

	// DSL root
	public void tabulator(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// layoutOptions overload - support map form
	public void layoutOptions(Map<String, Object> args) {
		if (args != null) layoutOptions.putAll(args);
	}

	// layoutOptions overload - support closure form
	public void layoutOptions(Closure<?> body) {
		body.setDelegate(this);
		body.setResolveStrategy(Closure.DELEGATE_FIRST);
		body.call();
	}

	// common table-level options we support for v0
	public void layout(String v) { layoutOptions.put("layout", v); }
	public void height(Object v) { layoutOptions.put("height", v); }
	public void autoColumns(Object v) { layoutOptions.put("autoColumns", v); }
	public void renderVertical(String v) { layoutOptions.put("renderVertical", v); }
	public void renderHorizontal(String v) { layoutOptions.put("renderHorizontal", v); }
	public void layoutColumnsOnNewData(Object v) { layoutOptions.put("layoutColumnsOnNewData", v); }
	public void width(Object v) { layoutOptions.put("width", v); }

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
				// ensure we copy each map
				this.dataRows.add(new LinkedHashMap<>(r));
			}
		}
	}

	/** Return final options map */
	public Map<String, Object> getOptions() {
		Map<String, Object> out = new LinkedHashMap<>();
		if (!layoutOptions.isEmpty()) out.put("layoutOptions", new LinkedHashMap<>(layoutOptions));
		if (!columns.isEmpty()) out.put("columns", new ArrayList<>(columns));
		if (!dataRows.isEmpty()) out.put("data", new ArrayList<>(dataRows));
		return out;
	}

	// Column delegate to capture column-level methods
	// Aligned with Tabulator.info column definition API
	private static class ColumnDelegate {
		private final Map<String, Object> map;
		ColumnDelegate(Map<String, Object> map) { this.map = map; }
		
		// Required properties
		public void title(String t) { map.put("title", t); }
		public void field(String f) { map.put("field", f); }
		
		// Alignment
		public void hozAlign(String a) { map.put("hozAlign", a); } // left, center, right
		public void vertAlign(String a) { map.put("vertAlign", a); } // top, middle, bottom
		public void headerHozAlign(String a) { map.put("headerHozAlign", a); }
		
		// Width control
		public void width(Object w) { map.put("width", w); }
		public void minWidth(Object w) { map.put("minWidth", w); }
		public void maxWidth(Object w) { map.put("maxWidth", w); }
		public void widthGrow(Object w) { map.put("widthGrow", w); }
		public void widthShrink(Object w) { map.put("widthShrink", w); }
		
		// Visibility & Layout
		public void visible(Object v) { map.put("visible", v); }
		public void frozen(Object f) { map.put("frozen", f); }
		public void responsive(Object r) { map.put("responsive", r); }
		public void resizable(Object r) { map.put("resizable", r); }
		
		// Sorting & Filtering
		public void sorter(Object s) { map.put("sorter", s); } // string, number, alphanum, boolean, exists, date, time, datetime, array
		public void sorterParams(Object p) { map.put("sorterParams", p); }
		public void headerSort(Object h) { map.put("headerSort", h); }
		public void headerFilter(Object f) { map.put("headerFilter", f); } // input, number, list, textarea, etc.
		public void headerFilterParams(Object p) { map.put("headerFilterParams", p); }
		public void headerFilterPlaceholder(String p) { map.put("headerFilterPlaceholder", p); }
		
		// Formatting & Display
		public void formatter(Object f) { map.put("formatter", f); } // plaintext, textarea, html, money, image, link, datetime, etc.
		public void formatterParams(Object p) { map.put("formatterParams", p); }
		public void cssClass(String c) { map.put("cssClass", c); }
		public void tooltip(Object t) { map.put("tooltip", t); }
		
		// Editing
		public void editor(Object e) { map.put("editor", e); } // input, textarea, number, range, tick, star, select, autocomplete, date, time, datetime
		public void editorParams(Object p) { map.put("editorParams", p); }
		public void editable(Object e) { map.put("editable", e); }
		public void validator(Object v) { map.put("validator", v); }
		
		// Header customization
		public void headerTooltip(Object t) { map.put("headerTooltip", t); }
		public void headerVertical(Object v) { map.put("headerVertical", v); }
		
		// Catch-all for any other Tabulator column property
		public void methodMissing(String name, Object args) {
			if (args instanceof Object[] && ((Object[]) args).length > 0) {
				map.put(name, ((Object[]) args)[0]);
			} else {
				map.put(name, args);
			}
		}
	}

	@Override
	public Object run() {
		return null;
	}
}
