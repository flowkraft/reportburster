package com.flowkraft.reporting.dsl.chart;

import java.util.Map;
import org.codehaus.groovy.control.CompilerConfiguration;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * Parses Chart Groovy DSL and produces ChartOptions DTO.
 * 
 * The parser is intentionally simple - it passes configuration through to the frontend.
 * Data transformation (reportData → Chart.js format) is handled by the frontend's
 * normalizeDataForChart() function, not here.
 */
public class ChartOptionsParser {

	public static ChartOptions parseGroovyChartDslCode(String groovyDslCode) throws Exception {
		// System.out.println("[DEBUG] ChartOptionsParser: entering, code length=" + (groovyDslCode != null ? groovyDslCode.length() : "null"));
		
		// Early return for empty/null input
		if (groovyDslCode == null || groovyDslCode.trim().isEmpty()) {
			// System.out.println("[DEBUG] ChartOptionsParser: empty input, returning empty ChartOptions");
			return new ChartOptions();
		}
		
		Binding binding = new Binding();

		CompilerConfiguration config = new CompilerConfiguration();
		config.setScriptBaseClass(ChartOptionsScript.class.getName());

		// System.out.println("[DEBUG] ChartOptionsParser: creating GroovyShell...");
		// Pass the script base class's classloader as parent — see TabulatorOptionsParser comment.
		GroovyShell shell = new GroovyShell(ChartOptionsScript.class.getClassLoader(), binding, config);
		// System.out.println("[DEBUG] ChartOptionsParser: parsing script...");
		ChartOptionsScript script = (ChartOptionsScript) shell.parse(groovyDslCode);
		script.setBinding(binding);
		// System.out.println("[DEBUG] ChartOptionsParser: running script...");
		script.run();
		// System.out.println("[DEBUG] ChartOptionsParser: script.run() completed");

		Map<String, Object> map = script.getOptions();
		ChartOptions out = new ChartOptions();

		// Simple passthrough - no data transformation here
		if (map.containsKey("type")) out.setType(String.valueOf(map.get("type")));
		if (map.containsKey("labelField")) out.setLabelField(String.valueOf(map.get("labelField")));
		if (map.containsKey("options")) out.setOptions((java.util.Map<String,Object>) map.get("options"));
		if (map.containsKey("labels")) out.setLabels((java.util.List<String>) map.get("labels"));
		if (map.containsKey("datasets")) out.setDatasets((java.util.List<java.util.Map<String,Object>>) map.get("datasets"));
		if (map.containsKey("data")) out.setData((java.util.List<java.util.Map<String,Object>>) map.get("data"));

		// Extract named blocks for aggregator reports
		Map<String, Map<String, Object>> namedRaw = script.getNamedOptions();
		if (namedRaw != null && !namedRaw.isEmpty()) {
			Map<String, ChartOptions> named = new java.util.LinkedHashMap<>();
			for (Map.Entry<String, Map<String, Object>> entry : namedRaw.entrySet()) {
				Map<String, Object> m = entry.getValue();
				ChartOptions co = new ChartOptions();
				if (m.containsKey("type")) co.setType(String.valueOf(m.get("type")));
				if (m.containsKey("labelField")) co.setLabelField(String.valueOf(m.get("labelField")));
				if (m.containsKey("options")) co.setOptions((java.util.Map<String,Object>) m.get("options"));
				if (m.containsKey("labels")) co.setLabels((java.util.List<String>) m.get("labels"));
				if (m.containsKey("datasets")) co.setDatasets((java.util.List<java.util.Map<String,Object>>) m.get("datasets"));
				if (m.containsKey("data")) co.setData((java.util.List<java.util.Map<String,Object>>) m.get("data"));
				named.put(entry.getKey(), co);
			}
			out.setNamedOptions(named);
		}

		return out;
	}
}
