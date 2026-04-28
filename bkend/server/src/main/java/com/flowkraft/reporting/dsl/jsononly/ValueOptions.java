package com.flowkraft.reporting.dsl.jsononly;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Value (Number) widget options DTO — configuration for the rb-value web component.
 *
 * Mirrors the RbValue.wc.svelte prop shape. Unlike the other JSON-only widgets,
 * RbValue exposes `field` and `format` as top-level props rather than inside an
 * `options` object; this DTO folds them into a single options shape so the
 * Phase 6 exporter can write a consistent g-dashboard-{id}-config.json sidecar.
 */
public class ValueOptions {

    // Which column of the first data row to read the scalar value from
    private String field;

    // Format: 'currency', 'number', 'percent', 'date', or '' (raw)
    private String format;

    // Named blocks for multi-component reports
    private Map<String, ValueOptions> namedOptions = new LinkedHashMap<>();

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Map<String, ValueOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, ValueOptions> namedOptions) { this.namedOptions = namedOptions; }
}
