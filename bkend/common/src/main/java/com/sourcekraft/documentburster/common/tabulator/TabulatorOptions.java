package com.sourcekraft.documentburster.common.tabulator;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.ArrayList;

public class TabulatorOptions {
    private Map<String, Object> layoutOptions = new LinkedHashMap<>();
    private List<Map<String, Object>> columns = new ArrayList<>();
    private List<Map<String, Object>> data = new ArrayList<>();

    public Map<String, Object> getLayoutOptions() {
        return layoutOptions;
    }

    public void setLayoutOptions(Map<String, Object> layoutOptions) {
        this.layoutOptions = layoutOptions;
    }

    public List<Map<String, Object>> getColumns() {
        return columns;
    }

    public void setColumns(List<Map<String, Object>> columns) {
        this.columns = columns;
    }

    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }
}
