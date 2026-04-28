package com.flowkraft.reporting.dsl.jsononly;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Progress widget options DTO — configuration for the rb-progress web component.
 *
 * Mirrors the RbProgress.wc.svelte `options` prop shape.
 */
public class ProgressOptions {

    // Which numeric column of the (single) data row to show
    private String field;

    // Goal / target value (default: 100)
    private Double goal;

    // Display label (default: field name)
    private String label;

    // Format: 'number', 'currency', 'percent'
    private String format;

    // Bar color (default: '#509ee3')
    private String color;

    // Named blocks for multi-component reports
    private Map<String, ProgressOptions> namedOptions = new LinkedHashMap<>();

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public Double getGoal() { return goal; }
    public void setGoal(Double goal) { this.goal = goal; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Map<String, ProgressOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, ProgressOptions> namedOptions) { this.namedOptions = namedOptions; }
}
