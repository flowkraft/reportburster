package com.flowkraft.reporting.dsl.slicer;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Slicer options DTO — configuration for the rb-slicer web component.
 *
 * <p>A slicer and a report parameter are both filtering, so they say the same things with the same
 * words (owner decision 19): {@code defaultValue} for what is picked to begin with and
 * {@code control 'multiselect'|'select'} for how many values may be picked, spelled as
 * {@code reportParameters}' own {@code ui(control: ...)} spells them. The old {@code defaultSelected}
 * and {@code multiSelect} are gone with no alias: one canonical form (DSL principles 1 and 3).
 *
 * Groovy DSL example:
 *   slicer('channel') {           // the name IS the field, when they are the same
 *     label 'Channel'                 // default: field name
 *     sort 'asc'                      // 'asc'|'desc'|'count_desc'|'none', default: 'asc'
 *     maxValues 500                   // default: 500
 *     showSearch true                 // default: auto (true when >10 values)
 *     showCount false                 // default: false
 *     defaultValue 'web', 'mobile'    // default: [] (nothing picked)
 *     control 'multiselect'           // 'multiselect' (default) or 'select'
 *     height 'auto'                   // default: 'auto' (grows, max 300px)
 *   }
 *   slicer('shipTo') { field 'ShipCountry' }   // field, when the column differs from the name
 */
public class SlicerOptions {

    /** Many values at a time: the slicer's default, and what a slicer is for. */
    public static final String CONTROL_MULTISELECT = "multiselect";

    /** One value at a time, as a parameter's single select means it. */
    public static final String CONTROL_SELECT = "select";

    // Required: which column to show distinct values for
    private String field;

    // Display label (default: field name)
    private String label;

    // Sort order: 'asc', 'desc', 'count_desc', 'none'
    private String sort = "asc";

    // Maximum number of distinct values to load
    private int maxValues = 500;

    // Show search box: true, false, or null for auto (true when >10 values)
    private Boolean showSearch;

    // Show occurrence count next to each value
    private boolean showCount = false;

    // Values picked to begin with (a parameter's word for the same idea)
    private List<String> defaultValue = new ArrayList<>();

    // How many values may be picked: 'multiselect' (the default) or 'select'
    private String control = CONTROL_MULTISELECT;

    // Height: 'auto' or CSS value like '300px'
    private String height = "auto";

    // Named blocks for multi-component reports
    private Map<String, SlicerOptions> namedOptions = new LinkedHashMap<>();

    // Getters and setters
    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getSort() { return sort; }
    public void setSort(String sort) { this.sort = sort; }

    public int getMaxValues() { return maxValues; }
    public void setMaxValues(int maxValues) { this.maxValues = maxValues; }

    public Boolean getShowSearch() { return showSearch; }
    public void setShowSearch(Boolean showSearch) { this.showSearch = showSearch; }

    public boolean isShowCount() { return showCount; }
    public void setShowCount(boolean showCount) { this.showCount = showCount; }

    public List<String> getDefaultValue() { return defaultValue; }
    public void setDefaultValue(List<String> defaultValue) { this.defaultValue = defaultValue; }

    public String getControl() { return control; }
    public void setControl(String control) { this.control = control; }

    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }

    public Map<String, SlicerOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, SlicerOptions> namedOptions) { this.namedOptions = namedOptions; }
}
