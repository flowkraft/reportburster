package com.flowkraft.reporting.dsl.jsononly;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gauge widget options DTO — configuration for the rb-gauge web component.
 *
 * Mirrors the RbGauge.wc.svelte `options` prop shape.
 */
public class GaugeOptions {

    // Which numeric column of the (single) data row to show on the gauge
    private String field;

    // Gauge minimum value (default: 0)
    private Double min;

    // Gauge maximum value (default: 100)
    private Double max;

    // Colored bands along the arc, defined as { to, color } stops
    private List<Band> bands = new ArrayList<>();

    // Display label under the gauge (default: field name)
    private String label;

    // Format: 'number', 'currency', 'percent', 'raw'
    private String format;

    // Named blocks for multi-component reports
    private Map<String, GaugeOptions> namedOptions = new LinkedHashMap<>();

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public Double getMin() { return min; }
    public void setMin(Double min) { this.min = min; }

    public Double getMax() { return max; }
    public void setMax(Double max) { this.max = max; }

    public List<Band> getBands() { return bands; }
    public void setBands(List<Band> bands) { this.bands = bands; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Map<String, GaugeOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, GaugeOptions> namedOptions) { this.namedOptions = namedOptions; }

    /** Single colored band along the gauge arc. */
    public static class Band {
        private Double to;
        private String color;

        public Double getTo() { return to; }
        public void setTo(Double to) { this.to = to; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }
}
