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
/**
 * <h2>FilterPaneOptionsScript — filter pane DSL parser, block form, strict.</h2>
 *
 * <p>See {@link com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme#iAmImportantReadme()}
 * for full DSL principles + filterpane-specific GOOD/BAD examples. Static init
 * below compile-pins this class to that readme.
 *
 * <p><b>Note:</b> this parser deliberately does NOT use {@code methodMissing}.
 * FilterPane is a DataPallas-owned component with a small fixed surface
 * (8 properties) — typos must throw, not be silently swallowed. New properties
 * get an explicit setter when the feature ships.
 */
public abstract class FilterPaneOptionsScript extends Script {

    static { com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme.iAmImportantReadme(); }

    private static final Set<String> VALID_SORT_VALUES = Set.of("asc", "desc", "count_desc", "none");

    // ── Single source of truth for parsing filterPane DSL ──
    // Both the unnamed `filterPane { ... }` and named `filterPane('id') { ... }` forms
    // dispatch their closure body to a NamedFilterPaneDelegate — the ONE class that
    // owns all setters and getOptions().
    // Per DSLPrinciplesReadme Principle 2 (DRY): no parallel parser surfaces.

    /** Captures the unnamed default {@code filterPane { ... }} block, if present. */
    private NamedFilterPaneDelegate unnamedDelegate;

    /** Named blocks: id → options map (populated by {@link #filterPane(String, Closure)}). */
    private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

    // DSL root — unnamed (default)
    public void filterPane(Closure<?> body) {
        NamedFilterPaneDelegate delegate = new NamedFilterPaneDelegate();
        body.setDelegate(delegate);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        this.unnamedDelegate = delegate;
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

    /** Return final options map for the unnamed (default) block. */
    public Map<String, Object> getOptions() {
        return unnamedDelegate != null ? unnamedDelegate.getOptions() : new LinkedHashMap<>();
    }

    /** Return named options map (id → options) for multi-component reports */
    public Map<String, Map<String, Object>> getNamedOptions() {
        return namedOptions;
    }

    @Override
    public Object run() { return null; }

    /**
     * Delegate for filterPane blocks (both unnamed and named) — single
     * parse-state owner per DSLPrinciplesReadme Principle 2 (DRY).
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
