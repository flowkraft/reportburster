package com.flowkraft.reporting.dsl.jsononly;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sankey widget options DTO — configuration for the rb-sankey web component.
 *
 * Mirrors the RbSankey.wc.svelte `options` prop shape.
 */
public class SankeyOptions {

    // Source node column
    private String sourceField;

    // Target node column
    private String targetField;

    // Link weight column (numeric measure)
    private String valueField;

    // Vertical spacing between nodes (default: 12)
    private Double nodePadding;

    // Node rectangle width in px (default: 14)
    private Double nodeWidth;

    // Node color palette (CSS colors); uses built-in palette when empty
    private List<String> palette = new ArrayList<>();

    // Named blocks for multi-component reports
    private Map<String, SankeyOptions> namedOptions = new LinkedHashMap<>();

    public String getSourceField() { return sourceField; }
    public void setSourceField(String sourceField) { this.sourceField = sourceField; }

    public String getTargetField() { return targetField; }
    public void setTargetField(String targetField) { this.targetField = targetField; }

    public String getValueField() { return valueField; }
    public void setValueField(String valueField) { this.valueField = valueField; }

    public Double getNodePadding() { return nodePadding; }
    public void setNodePadding(Double nodePadding) { this.nodePadding = nodePadding; }

    public Double getNodeWidth() { return nodeWidth; }
    public void setNodeWidth(Double nodeWidth) { this.nodeWidth = nodeWidth; }

    public List<String> getPalette() { return palette; }
    public void setPalette(List<String> palette) { this.palette = palette; }

    public Map<String, SankeyOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, SankeyOptions> namedOptions) { this.namedOptions = namedOptions; }
}
