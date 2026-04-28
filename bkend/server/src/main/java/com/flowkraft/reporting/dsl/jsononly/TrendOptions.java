package com.flowkraft.reporting.dsl.jsononly;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Trend widget options DTO — configuration for the rb-trend web component.
 *
 * Mirrors the RbTrend.wc.svelte `options` prop shape.
 */
public class TrendOptions {

    // Temporal column for the X axis
    private String dateField;

    // Numeric column for the sparkline / latest-value KPI
    private String valueField;

    // Format: 'number', 'currency', 'percent', 'raw'
    private String format;

    // Display label (default: valueField name)
    private String label;

    // Named blocks for multi-component reports
    private Map<String, TrendOptions> namedOptions = new LinkedHashMap<>();

    public String getDateField() { return dateField; }
    public void setDateField(String dateField) { this.dateField = dateField; }

    public String getValueField() { return valueField; }
    public void setValueField(String valueField) { this.valueField = valueField; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Map<String, TrendOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, TrendOptions> namedOptions) { this.namedOptions = namedOptions; }
}
