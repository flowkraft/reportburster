package com.flowkraft.reporting.dsl.slicer;

import java.util.List;
import java.util.Map;

import org.codehaus.groovy.control.CompilerConfiguration;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * Parses Slicer Groovy DSL and produces SlicerOptions DTO.
 *
 * Usage:
 *   String dsl = "slicer('countryFilter') { field 'ShipCountry'; label 'Country' }";
 *   SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
 */
public class SlicerOptionsParser {

    @SuppressWarnings("unchecked")
    public static SlicerOptions parseGroovySlicerDslCode(String groovyDslCode) throws Exception {
        if (groovyDslCode == null || groovyDslCode.trim().isEmpty()) {
            return new SlicerOptions();
        }

        Binding binding = new Binding();

        CompilerConfiguration config = new CompilerConfiguration();
        config.setScriptBaseClass(SlicerOptionsScript.class.getName());

        // Pass the script base class's classloader as parent — see TabulatorOptionsParser comment.
        GroovyShell shell = new GroovyShell(SlicerOptionsScript.class.getClassLoader(), binding, config);
        SlicerOptionsScript script = (SlicerOptionsScript) shell.parse(groovyDslCode);
        script.setBinding(binding);
        script.run();

        SlicerOptions opts = mapToSlicerOptions(script.getOptions());

        // Extract named blocks for multi-component reports
        Map<String, Map<String, Object>> namedRaw = script.getNamedOptions();
        if (namedRaw != null && !namedRaw.isEmpty()) {
            Map<String, SlicerOptions> named = new java.util.LinkedHashMap<>();
            for (Map.Entry<String, Map<String, Object>> entry : namedRaw.entrySet()) {
                named.put(entry.getKey(), mapToSlicerOptions(entry.getValue()));
            }
            opts.setNamedOptions(named);
        }

        return opts;
    }

    /** Maps a raw options map to a SlicerOptions DTO */
    @SuppressWarnings("unchecked")
    private static SlicerOptions mapToSlicerOptions(Map<String, Object> map) {
        SlicerOptions opts = new SlicerOptions();

        if (map.containsKey("field")) opts.setField(String.valueOf(map.get("field")));
        if (map.containsKey("label")) opts.setLabel(String.valueOf(map.get("label")));
        if (map.containsKey("sort")) opts.setSort(String.valueOf(map.get("sort")));
        if (map.containsKey("maxValues")) opts.setMaxValues(((Number) map.get("maxValues")).intValue());
        if (map.containsKey("showSearch")) opts.setShowSearch((Boolean) map.get("showSearch"));
        if (map.containsKey("showCount")) opts.setShowCount((Boolean) map.get("showCount"));
        if (map.containsKey("defaultValue")) opts.setDefaultValue((List<String>) map.get("defaultValue"));
        if (map.containsKey("control")) opts.setControl(String.valueOf(map.get("control")));
        if (map.containsKey("height")) opts.setHeight(String.valueOf(map.get("height")));

        return opts;
    }
}
