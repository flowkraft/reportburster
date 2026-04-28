package com.flowkraft.reporting.dsl.jsononly;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Detail widget options DTO — configuration for the rb-detail web component.
 *
 * Mirrors the RbDetail.wc.svelte `options` prop shape.
 */
public class DetailOptions {

    // Columns to hide from the per-row readout
    private List<String> hiddenColumns = new ArrayList<>();

    // Which row of the result set to display (default: 0)
    private Integer rowIndex;

    // Per-column format specs (from frontend type-formatters.ts). Keys are
    // column names; values are ColumnFormat objects. When a column has a
    // format, the value is rendered via the matching HTML formatter
    // (link/image/etc.) instead of escaped text.
    private Map<String, ColumnFormat> columnFormats = new LinkedHashMap<>();

    // Per-column header label overrides
    private Map<String, String> columnTitles = new LinkedHashMap<>();

    // When true, renders a small gear button next to each key; clicking it
    // bubbles a `.rb-col-settings` click that the React wrapper catches.
    private boolean interactive = false;

    // Named blocks for multi-component reports
    private Map<String, DetailOptions> namedOptions = new LinkedHashMap<>();

    public List<String> getHiddenColumns() { return hiddenColumns; }
    public void setHiddenColumns(List<String> hiddenColumns) { this.hiddenColumns = hiddenColumns; }

    public Integer getRowIndex() { return rowIndex; }
    public void setRowIndex(Integer rowIndex) { this.rowIndex = rowIndex; }

    public Map<String, ColumnFormat> getColumnFormats() { return columnFormats; }
    public void setColumnFormats(Map<String, ColumnFormat> columnFormats) { this.columnFormats = columnFormats; }

    public Map<String, String> getColumnTitles() { return columnTitles; }
    public void setColumnTitles(Map<String, String> columnTitles) { this.columnTitles = columnTitles; }

    public boolean isInteractive() { return interactive; }
    public void setInteractive(boolean interactive) { this.interactive = interactive; }

    public Map<String, DetailOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, DetailOptions> namedOptions) { this.namedOptions = namedOptions; }

    /** Per-column format spec — mirrors type-formatters.ts shape. */
    public static class ColumnFormat {
        private String kind;
        private String currency;
        private String currencyStyle; // 'symbol' | 'code' | 'name'
        private Integer decimals;
        private Double scale;
        private String prefix;
        private String suffix;
        private Boolean compact;
        private String dateUnit;
        private String locale;

        public String getKind() { return kind; }
        public void setKind(String kind) { this.kind = kind; }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }

        public String getCurrencyStyle() { return currencyStyle; }
        public void setCurrencyStyle(String currencyStyle) { this.currencyStyle = currencyStyle; }

        public Integer getDecimals() { return decimals; }
        public void setDecimals(Integer decimals) { this.decimals = decimals; }

        public Double getScale() { return scale; }
        public void setScale(Double scale) { this.scale = scale; }

        public String getPrefix() { return prefix; }
        public void setPrefix(String prefix) { this.prefix = prefix; }

        public String getSuffix() { return suffix; }
        public void setSuffix(String suffix) { this.suffix = suffix; }

        public Boolean getCompact() { return compact; }
        public void setCompact(Boolean compact) { this.compact = compact; }

        public String getDateUnit() { return dateUnit; }
        public void setDateUnit(String dateUnit) { this.dateUnit = dateUnit; }

        public String getLocale() { return locale; }
        public void setLocale(String locale) { this.locale = locale; }
    }
}
