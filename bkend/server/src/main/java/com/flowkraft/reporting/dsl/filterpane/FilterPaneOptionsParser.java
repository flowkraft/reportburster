package com.flowkraft.reporting.dsl.filterpane;

import java.util.List;
import java.util.Map;

import org.codehaus.groovy.control.CompilerConfiguration;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * Parses Filter Pane Groovy DSL and produces FilterPaneOptions DTO.
 *
 * Usage:
 *   String dsl = "filterPane('countryFilter') { field 'ShipCountry'; label 'Country' }";
 *   FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
 */
public class FilterPaneOptionsParser {

    @SuppressWarnings("unchecked")
    public static FilterPaneOptions parseGroovyFilterPaneDslCode(String groovyDslCode) throws Exception {
        if (groovyDslCode == null || groovyDslCode.trim().isEmpty()) {
            return new FilterPaneOptions();
        }

        Binding binding = new Binding();

        CompilerConfiguration config = new CompilerConfiguration();
        config.setScriptBaseClass(FilterPaneOptionsScript.class.getName());

        GroovyShell shell = new GroovyShell(binding, config);
        FilterPaneOptionsScript script = (FilterPaneOptionsScript) shell.parse(groovyDslCode);
        script.setBinding(binding);
        script.run();

        FilterPaneOptions opts = mapToFilterPaneOptions(script.getOptions());

        // Extract named blocks for multi-component reports
        Map<String, Map<String, Object>> namedRaw = script.getNamedOptions();
        if (namedRaw != null && !namedRaw.isEmpty()) {
            Map<String, FilterPaneOptions> named = new java.util.LinkedHashMap<>();
            for (Map.Entry<String, Map<String, Object>> entry : namedRaw.entrySet()) {
                named.put(entry.getKey(), mapToFilterPaneOptions(entry.getValue()));
            }
            opts.setNamedOptions(named);
        }

        return opts;
    }

    /** Maps a raw options map to a FilterPaneOptions DTO */
    @SuppressWarnings("unchecked")
    private static FilterPaneOptions mapToFilterPaneOptions(Map<String, Object> map) {
        FilterPaneOptions opts = new FilterPaneOptions();

        if (map.containsKey("field")) opts.setField(String.valueOf(map.get("field")));
        if (map.containsKey("label")) opts.setLabel(String.valueOf(map.get("label")));
        if (map.containsKey("sort")) opts.setSort(String.valueOf(map.get("sort")));
        if (map.containsKey("maxValues")) opts.setMaxValues(((Number) map.get("maxValues")).intValue());
        if (map.containsKey("showSearch")) opts.setShowSearch((Boolean) map.get("showSearch"));
        if (map.containsKey("showCount")) opts.setShowCount((Boolean) map.get("showCount"));
        if (map.containsKey("defaultSelected")) opts.setDefaultSelected((List<String>) map.get("defaultSelected"));
        if (map.containsKey("multiSelect")) opts.setMultiSelect((Boolean) map.get("multiSelect"));
        if (map.containsKey("height")) opts.setHeight(String.valueOf(map.get("height")));

        return opts;
    }
}
