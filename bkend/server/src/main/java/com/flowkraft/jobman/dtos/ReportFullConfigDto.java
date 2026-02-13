package com.flowkraft.jobman.dtos;

import java.util.List;
import java.util.Map;

import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;

/**
 * Complete report configuration returned to web components.
 * Server is the single source of truth - client just displays.
 */
public class ReportFullConfigDto {
    
    /** Report folder name (e.g., "sales-summary") */
    public String reportCode;
    
    /** Display name from settings.xml */
    public String reportName;
    
    /** Data source type (e.g., "ds-csvfile", "ds-database") */
    public String dsInputType;
    
    /** Relative path to settings.xml */
    public String configurationFilePath;
    
    /** Parameters parsed from {reportCode}-report-parameters-spec.groovy */
    public List<ReportParameter> parameters;
    
    /** Tabulator options parsed from {reportCode}-tabulator-config.groovy */
    public Map<String, Object> tabulatorOptions;
    
    /** Chart options parsed from {reportCode}-chart-config.groovy */
    public Map<String, Object> chartOptions;
    
    /** Pivot table options parsed from {reportCode}-pivot-config.groovy */
    public Map<String, Object> pivotTableOptions;
    
    /** Raw DSL source code for display/copy */
    public String tabulatorDsl;
    public String chartDsl;
    public String pivotTableDsl;
    public String parametersDsl;
    
    /** Which visualizations are configured */
    public boolean hasTabulator;
    public boolean hasChart;
    public boolean hasPivotTable;
    public boolean hasParameters;

    /**
     * Pivot engine mode: "browser" (download all data, aggregate client-side)
     * or "server" (aggregate server-side on DuckDB/ClickHouse, send only results).
     * Only relevant when hasPivotTable=true.
     */
    public String pivotEngineMode = "browser";  // default
}
