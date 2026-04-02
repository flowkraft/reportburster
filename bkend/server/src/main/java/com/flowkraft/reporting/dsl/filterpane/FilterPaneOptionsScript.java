package com.flowkraft.reporting.dsl.filterpane;

import groovy.lang.Closure;
import groovy.lang.Script;

import java.util.*;
import java.util.Set;

/**
 * Groovy DSL base class for Filter Pane configuration.
 *
 * Minimal DSL:
 *   filterPane('countryFilter') {
 *     field 'ShipCountry'
 *   }
 *
 * Full DSL:
 *   filterPane('countryFilter') {
 *     field 'ShipCountry'
 *     label 'Country'
 *     sort 'asc'
 *     maxValues 500
 *     showSearch true
 *     showCount true
 *     defaultSelected 'Germany', 'France'
 *     multiSelect true
 *     height '300px'
 *   }
 */
public abstract class FilterPaneOptionsScript extends Script {

    private static final Set<String> VALID_SORT_VALUES = Set.of("asc", "desc", "count_desc", "none");

    // Unnamed (default) block state
    private String field;
    private String label;
    private String sort;
    private Integer maxValues;
    private Boolean showSearch;
    private Boolean showCount;
    private final List<String> defaultSelected = new ArrayList<>();
    private Boolean multiSelect;
    private String height;

    // Named blocks: id → options map
    private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

    // DSL root — unnamed (default)
    public void filterPane(Closure<?> body) {
        body.setDelegate(this);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
    }

    // DSL root — named block for multi-component reports
    public void filterPane(String id, Closure<?> body) {
        NamedFilterPaneDelegate delegate = new NamedFilterPaneDelegate();
        body.setDelegate(delegate);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        namedOptions.put(id, delegate.getOptions());
    }

    private static void validateSort(String value) {
        if (value != null && !VALID_SORT_VALUES.contains(value)) {
            throw new IllegalArgumentException(
                "Invalid sort value '" + value + "'. Must be one of: " + VALID_SORT_VALUES);
        }
    }

    // DSL methods
    public void field(String value) { this.field = value; }
    public void label(String value) { this.label = value; }
    public void sort(String value) { validateSort(value); this.sort = value; }
    public void maxValues(int value) { this.maxValues = value; }
    public void showSearch(boolean value) { this.showSearch = value; }
    public void showCount(boolean value) { this.showCount = value; }
    public void multiSelect(boolean value) { this.multiSelect = value; }
    public void height(String value) { this.height = value; }

    // defaultSelected — varargs form: defaultSelected 'Germany', 'France'
    public void defaultSelected(String... values) {
        if (values != null) defaultSelected.addAll(Arrays.asList(values));
    }

    // defaultSelected — list form
    public void defaultSelected(List<String> values) {
        if (values != null) defaultSelected.addAll(values);
    }

    /** Return final options map for the unnamed (default) block */
    public Map<String, Object> getOptions() {
        Map<String, Object> out = new LinkedHashMap<>();
        if (field != null) out.put("field", field);
        if (label != null) out.put("label", label);
        if (sort != null) out.put("sort", sort);
        if (maxValues != null) out.put("maxValues", maxValues);
        if (showSearch != null) out.put("showSearch", showSearch);
        if (showCount != null) out.put("showCount", showCount);
        if (!defaultSelected.isEmpty()) out.put("defaultSelected", new ArrayList<>(defaultSelected));
        if (multiSelect != null) out.put("multiSelect", multiSelect);
        if (height != null) out.put("height", height);
        return out;
    }

    /** Return named options map (id → options) for multi-component reports */
    public Map<String, Map<String, Object>> getNamedOptions() {
        return namedOptions;
    }

    @Override
    public Object run() { return null; }

    /**
     * Delegate for named filterPane blocks — captures options independently.
     */
    private static class NamedFilterPaneDelegate {
        private String field;
        private String label;
        private String sort;
        private Integer maxValues;
        private Boolean showSearch;
        private Boolean showCount;
        private final List<String> defaultSelected = new ArrayList<>();
        private Boolean multiSelect;
        private String height;

        public void field(String value) { this.field = value; }
        public void label(String value) { this.label = value; }
        public void sort(String value) { validateSort(value); this.sort = value; }
        public void maxValues(int value) { this.maxValues = value; }
        public void showSearch(boolean value) { this.showSearch = value; }
        public void showCount(boolean value) { this.showCount = value; }
        public void multiSelect(boolean value) { this.multiSelect = value; }
        public void height(String value) { this.height = value; }

        public void defaultSelected(String... values) {
            if (values != null) defaultSelected.addAll(Arrays.asList(values));
        }

        public void defaultSelected(List<String> values) {
            if (values != null) defaultSelected.addAll(values);
        }

        public Map<String, Object> getOptions() {
            Map<String, Object> out = new LinkedHashMap<>();
            if (field != null) out.put("field", field);
            if (label != null) out.put("label", label);
            if (sort != null) out.put("sort", sort);
            if (maxValues != null) out.put("maxValues", maxValues);
            if (showSearch != null) out.put("showSearch", showSearch);
            if (showCount != null) out.put("showCount", showCount);
            if (!defaultSelected.isEmpty()) out.put("defaultSelected", new ArrayList<>(defaultSelected));
            if (multiSelect != null) out.put("multiSelect", multiSelect);
            if (height != null) out.put("height", height);
            return out;
        }
    }
}
