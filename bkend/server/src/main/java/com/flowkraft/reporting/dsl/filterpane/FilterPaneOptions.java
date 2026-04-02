package com.flowkraft.reporting.dsl.filterpane;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Filter Pane options DTO — configuration for the rb-filter-pane web component.
 *
 * Groovy DSL example:
 *   filterPane('countryFilter') {
 *     field 'ShipCountry'       // required
 *     label 'Country'           // default: field name
 *     sort 'asc'                // 'asc'|'desc'|'count_desc'|'none', default: 'asc'
 *     maxValues 500             // default: 500
 *     showSearch true           // default: auto (true when >10 values)
 *     showCount false           // default: false
 *     defaultSelected 'Germany' // default: [] (nothing)
 *     multiSelect true          // default: true
 *     height 'auto'             // default: 'auto' (grows, max 300px)
 *   }
 */
public class FilterPaneOptions {

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

    // Pre-selected values on load
    private List<String> defaultSelected = new ArrayList<>();

    // Allow multiple selections
    private boolean multiSelect = true;

    // Height: 'auto' or CSS value like '300px'
    private String height = "auto";

    // Named blocks for multi-component reports
    private Map<String, FilterPaneOptions> namedOptions = new LinkedHashMap<>();

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

    public List<String> getDefaultSelected() { return defaultSelected; }
    public void setDefaultSelected(List<String> defaultSelected) { this.defaultSelected = defaultSelected; }

    public boolean isMultiSelect() { return multiSelect; }
    public void setMultiSelect(boolean multiSelect) { this.multiSelect = multiSelect; }

    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }

    public Map<String, FilterPaneOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, FilterPaneOptions> namedOptions) { this.namedOptions = namedOptions; }
}
