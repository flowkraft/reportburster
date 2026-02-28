package com.sourcekraft.documentburster.common.tabulator;

import java.util.Map;
import java.util.LinkedHashMap;

/**
 * Parsed Tabulator DSL result — flat structure matching tabulator.info constructor options.
 * All table-level options (layout, height, pagination, paginationMode, etc.) plus
 * columns and data are stored in a single flat options map.
 */
public class TabulatorOptions {
    private Map<String, Object> options = new LinkedHashMap<>();
    private Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

    public Map<String, Object> getOptions() {
        return options;
    }

    public void setOptions(Map<String, Object> options) {
        this.options = options;
    }

    public Map<String, Map<String, Object>> getNamedOptions() {
        return namedOptions;
    }

    public void setNamedOptions(Map<String, Map<String, Object>> namedOptions) {
        this.namedOptions = namedOptions;
    }
}
