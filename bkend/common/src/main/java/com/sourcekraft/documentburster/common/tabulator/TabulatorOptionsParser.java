package com.sourcekraft.documentburster.common.tabulator;

import java.util.Map;

import org.codehaus.groovy.control.CompilerConfiguration;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

public class TabulatorOptionsParser {

	public static TabulatorOptions parseGroovyTabulatorDslCode(String groovyDslCode) throws Exception {
		// System.out.println("[DEBUG] TabulatorOptionsParser: entering, code length=" + (groovyDslCode != null ? groovyDslCode.length() : "null"));
		
		// Early return for empty/null input
		if (groovyDslCode == null || groovyDslCode.trim().isEmpty()) {
			// System.out.println("[DEBUG] TabulatorOptionsParser: empty input, returning empty TabulatorOptions");
			return new TabulatorOptions();
		}
		
		Binding binding = new Binding();

		CompilerConfiguration config = new CompilerConfiguration();
		config.setScriptBaseClass(TabulatorOptionsScript.class.getName());

		// System.out.println("[DEBUG] TabulatorOptionsParser: creating GroovyShell...");
		GroovyShell shell = new GroovyShell(binding, config);
		// System.out.println("[DEBUG] TabulatorOptionsParser: parsing script...");
		TabulatorOptionsScript script = (TabulatorOptionsScript) shell.parse(groovyDslCode);
		script.setBinding(binding);
		// System.out.println("[DEBUG] TabulatorOptionsParser: running script...");
		script.run();
		// System.out.println("[DEBUG] TabulatorOptionsParser: script.run() completed");

		Map<String, Object> map = script.getOptions();
		TabulatorOptions opts = new TabulatorOptions();
		if (map.containsKey("layoutOptions")) opts.setLayoutOptions((Map<String, Object>) map.get("layoutOptions"));
		if (map.containsKey("columns")) opts.setColumns((java.util.List<Map<String, Object>>) map.get("columns"));
		if (map.containsKey("data")) opts.setData((java.util.List<Map<String, Object>>) map.get("data"));
		return opts;
	}
}

