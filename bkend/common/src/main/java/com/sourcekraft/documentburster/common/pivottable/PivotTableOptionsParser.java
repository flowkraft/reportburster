package com.sourcekraft.documentburster.common.pivottable;

import java.util.List;
import java.util.Map;

import org.codehaus.groovy.control.CompilerConfiguration;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * Parses Pivot Table Groovy DSL and produces PivotTableOptions DTO.
 */
public class PivotTableOptionsParser {

	@SuppressWarnings("unchecked")
	public static PivotTableOptions parseGroovyPivotTableDslCode(String groovyDslCode) throws Exception {
		// Early return for empty/null input
		if (groovyDslCode == null || groovyDslCode.trim().isEmpty()) {
			return new PivotTableOptions();
		}

		Binding binding = new Binding();

		CompilerConfiguration config = new CompilerConfiguration();
		config.setScriptBaseClass(PivotTableOptionsScript.class.getName());

		GroovyShell shell = new GroovyShell(binding, config);
		PivotTableOptionsScript script = (PivotTableOptionsScript) shell.parse(groovyDslCode);
		script.setBinding(binding);
		script.run();

		Map<String, Object> map = script.getOptions();
		PivotTableOptions opts = new PivotTableOptions();

		if (map.containsKey("rows")) {
			opts.setRows((List<String>) map.get("rows"));
		}
		if (map.containsKey("cols")) {
			opts.setCols((List<String>) map.get("cols"));
		}
		if (map.containsKey("vals")) {
			opts.setVals((List<String>) map.get("vals"));
		}
		if (map.containsKey("aggregatorName")) {
			opts.setAggregatorName(String.valueOf(map.get("aggregatorName")));
		}
		if (map.containsKey("rendererName")) {
			opts.setRendererName(String.valueOf(map.get("rendererName")));
		}
		if (map.containsKey("rowOrder")) {
			opts.setRowOrder(String.valueOf(map.get("rowOrder")));
		}
		if (map.containsKey("colOrder")) {
			opts.setColOrder(String.valueOf(map.get("colOrder")));
		}
		if (map.containsKey("valueFilter")) {
			opts.setValueFilter((Map<String, Map<String, Boolean>>) map.get("valueFilter"));
		}
		if (map.containsKey("options")) {
			opts.setOptions((Map<String, Object>) map.get("options"));
		}
		if (map.containsKey("data")) {
			opts.setData((List<Map<String, Object>>) map.get("data"));
		}
		// New fields
		if (map.containsKey("hiddenAttributes")) {
			opts.setHiddenAttributes((List<String>) map.get("hiddenAttributes"));
		}
		if (map.containsKey("hiddenFromAggregators")) {
			opts.setHiddenFromAggregators((List<String>) map.get("hiddenFromAggregators"));
		}
		if (map.containsKey("hiddenFromDragDrop")) {
			opts.setHiddenFromDragDrop((List<String>) map.get("hiddenFromDragDrop"));
		}
		if (map.containsKey("unusedOrientationCutoff")) {
			opts.setUnusedOrientationCutoff((Integer) map.get("unusedOrientationCutoff"));
		}
		if (map.containsKey("menuLimit")) {
			opts.setMenuLimit((Integer) map.get("menuLimit"));
		}
		if (map.containsKey("tableName")) {
			opts.setTableName(String.valueOf(map.get("tableName")));
		}
		if (map.containsKey("sorters")) {
			opts.setSorters((Map<String, Object>) map.get("sorters"));
		}
		if (map.containsKey("derivedAttributes")) {
			opts.setDerivedAttributes((Map<String, String>) map.get("derivedAttributes"));
		}

		return opts;
	}
}
