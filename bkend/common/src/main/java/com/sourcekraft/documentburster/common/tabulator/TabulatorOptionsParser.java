package com.sourcekraft.documentburster.common.tabulator;

import java.util.Map;

import org.codehaus.groovy.control.CompilerConfiguration;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * Parses Groovy Tabulator DSL code into TabulatorOptions.
 *
 * <h3>rb-tabulator Web Component — Two Usage Modes</h3>
 *
 * <b>MODE 1 — "Data Push"</b> (parent fetches data, passes via props)
 * <ul>
 *   <li>Props: [data], [columns], [options], [loading]</li>
 *   <li>Parent (Angular) calls the API, gets reportData, then renders:
 *       {@code <rb-tabulator [data]="result.reportData" [columns]="..." [options]="...">}</li>
 *   <li>Used in: Configuration &gt; Test SQL/Script button — Angular fetches data once
 *       and pushes the SAME dataset to Tabulator, Chart, and Pivot Table previews.
 *       This avoids 3 separate API calls for the same data.</li>
 * </ul>
 *
 * <b>MODE 2 — "Self-Fetch"</b> (component fetches its own config + data)
 * <ul>
 *   <li>Props: [reportCode], [apiBaseUrl], [reportParams], [testMode], [componentId]</li>
 *   <li>Component calls GET /reports/{code}/config then GET /reports/{code}/data</li>
 *   <li>Used in:
 *     <ul>
 *       <li>Configuration &gt; Tabulator/Chart/Pivot Preview for named components (aggregator reports)</li>
 *       <li>Processing &gt; View Data button</li>
 *     </ul>
 *   </li>
 *   <li>Needed because: View Data must support server-side pagination for large
 *       datasets (the component manages its own pagination state via ajaxRequestFunc).
 *       Named components need componentId-specific config that only the component knows.</li>
 * </ul>
 *
 * Both modes converge at {@code opts = Object.assign({}, options || {})} in
 * RbTabulator.wc.svelte where Tabulator is initialized with the same options
 * regardless of how data/config was obtained.
 */
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

		TabulatorOptions opts = new TabulatorOptions();
		opts.setOptions(script.getOptions());
		opts.setNamedOptions(script.getNamedOptions());

		// If paginationMode is set, ensure pagination:true is present.
		// Tabulator 6 requires both — paginationMode alone won't activate the Page module.
		ensurePaginationConsistency(opts.getOptions());
		for (Map.Entry<String, Map<String, Object>> entry : opts.getNamedOptions().entrySet()) {
			ensurePaginationConsistency(entry.getValue());
		}

		return opts;
	}

	/**
	 * If paginationMode is set, ensure pagination:true is present.
	 * Tabulator 6 requires both — paginationMode alone won't activate the Page module.
	 */
	private static void ensurePaginationConsistency(Map<String, Object> options) {
		if (options.containsKey("paginationMode") && !options.containsKey("pagination")) {
			options.put("pagination", true);
		}
	}
}

