package com.flowkraft.reporting.dsl.slicer;

import groovy.lang.Closure;
import groovy.lang.Script;

import java.util.*;
import java.util.Set;

/**
 * Groovy DSL base class for Slicer configuration.
 *
 * Minimal DSL — the name is the field, so the name alone is a slicer:
 *   slicer('channel')
 *
 * Full DSL:
 *   slicer('countryFilter') {
 *     field 'ShipCountry'
 *     label 'Country'
 *     sort 'asc'
 *     maxValues 500
 *     showSearch true
 *     showCount true
 *     defaultValue 'Germany', 'France'
 *     control 'multiselect'
 *     height '300px'
 *   }
 */
/**
 * <h2>SlicerOptionsScript — slicer DSL parser, block form, strict.</h2>
 *
 * <p>See {@link com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme#iAmImportantReadme()}
 * for full DSL principles + slicer-specific GOOD/BAD examples. Static init
 * below compile-pins this class to that readme.
 *
 * <p><b>Note:</b> this parser deliberately does NOT use {@code methodMissing}.
 * Slicer is a DataPallas-owned component with a small fixed surface
 * (9 properties) — typos must throw, not be silently swallowed. New properties
 * get an explicit setter when the feature ships.
 *
 * <p>It says the filtering things with {@code reportParameters}' words (owner decision 19):
 * {@code defaultValue} and {@code control 'multiselect'|'select'}. The words it replaced,
 * {@code defaultSelected} and {@code multiSelect}, are not accepted: an alias would be a second
 * language for one idea, and this parser being strict is what tells an author so.
 */
public abstract class SlicerOptionsScript extends Script {

    static { com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme.iAmImportantReadme(); }

    private static final Set<String> VALID_SORT_VALUES = Set.of("asc", "desc", "count_desc", "none");

    /** The two controls a slicer can be, spelled as a parameter's {@code ui(control: ...)} spells them. */
    private static final Set<String> VALID_CONTROL_VALUES =
        Set.of(SlicerOptions.CONTROL_MULTISELECT, SlicerOptions.CONTROL_SELECT);

    // ── Single source of truth for parsing slicer DSL ──
    // Both the unnamed `slicer { ... }` and named `slicer('id') { ... }` forms
    // dispatch their closure body to a NamedSlicerDelegate — the ONE class that
    // owns all setters and getOptions().
    // Per DSLPrinciplesReadme Principle 2 (DRY): no parallel parser surfaces.

    /** Captures the unnamed default {@code slicer { ... }} block, if present. */
    private NamedSlicerDelegate unnamedDelegate;

    /** Named blocks: id → options map (populated by {@link #slicer(String, Closure)}). */
    private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

    // DSL root — unnamed (default)
    public void slicer(Closure<?> body) {
        NamedSlicerDelegate delegate = new NamedSlicerDelegate();
        body.setDelegate(delegate);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        this.unnamedDelegate = delegate;
    }

    // DSL root — the name alone: `slicer('channel')` is a whole slicer, because the name is the
    // field (owner decision 19). Nothing else to say, so there is no block to write.
    public void slicer(String id) {
        namedOptions.put(id, new LinkedHashMap<>(Map.of("field", id)));
    }

    // DSL root — named block for multi-component reports
    public void slicer(String id, Closure<?> body) {
        NamedSlicerDelegate delegate = new NamedSlicerDelegate();
        body.setDelegate(delegate);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        Map<String, Object> options = delegate.getOptions();
        // The name IS the field, unless the block says otherwise: `slicer('channel')` is a whole
        // slicer, and `field` is written only where the column and the name differ. A published slicer
        // always writes it, because its name is the component's id and not a column
        // (`DashboardFileGenerator` refuses to publish a slicer with no field at all).
        options.putIfAbsent("field", id);
        namedOptions.put(id, options);
    }

    private static void validateSort(String value) {
        if (value != null && !VALID_SORT_VALUES.contains(value)) {
            throw new IllegalArgumentException(
                "Invalid sort value '" + value + "'. Must be one of: " + VALID_SORT_VALUES);
        }
    }

    private static void validateControl(String value) {
        if (value != null && !VALID_CONTROL_VALUES.contains(value)) {
            throw new IllegalArgumentException(
                "Invalid control value '" + value + "'. Must be one of: " + VALID_CONTROL_VALUES);
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
     * Delegate for slicer blocks (both unnamed and named) — single
     * parse-state owner per DSLPrinciplesReadme Principle 2 (DRY).
     */
    private static class NamedSlicerDelegate {
        private String field;
        private String label;
        private String sort;
        private Integer maxValues;
        private Boolean showSearch;
        private Boolean showCount;
        private final List<String> defaultValue = new ArrayList<>();
        private String control;
        private String height;

        public void field(String value) { this.field = value; }
        public void label(String value) { this.label = value; }
        public void sort(String value) { validateSort(value); this.sort = value; }
        public void maxValues(int value) { this.maxValues = value; }
        public void showSearch(boolean value) { this.showSearch = value; }
        public void showCount(boolean value) { this.showCount = value; }
        public void control(String value) { validateControl(value); this.control = value; }
        public void height(String value) { this.height = value; }

        public void defaultValue(String... values) {
            if (values != null) defaultValue.addAll(Arrays.asList(values));
        }

        public void defaultValue(List<String> values) {
            if (values != null) defaultValue.addAll(values);
        }

        public Map<String, Object> getOptions() {
            Map<String, Object> out = new LinkedHashMap<>();
            if (field != null) out.put("field", field);
            if (label != null) out.put("label", label);
            if (sort != null) out.put("sort", sort);
            if (maxValues != null) out.put("maxValues", maxValues);
            if (showSearch != null) out.put("showSearch", showSearch);
            if (showCount != null) out.put("showCount", showCount);
            if (!defaultValue.isEmpty()) out.put("defaultValue", new ArrayList<>(defaultValue));
            if (control != null) out.put("control", control);
            if (height != null) out.put("height", height);
            return out;
        }
    }
}
