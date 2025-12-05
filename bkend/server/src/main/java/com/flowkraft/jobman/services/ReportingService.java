package com.flowkraft.jobman.services;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.cfgman.DocumentBursterSettingsService;
import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.dtos.ReportFullConfigDto;
import com.sourcekraft.documentburster.common.chart.ChartOptionsParser;
import com.sourcekraft.documentburster.common.db.ReportDataResult;
import com.sourcekraft.documentburster.common.pivottable.PivotTableOptionsParser;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;
import com.sourcekraft.documentburster.common.settings.model.ConfigurationFileInfo;
import com.sourcekraft.documentburster.common.tabulator.TabulatorOptionsParser;
import com.sourcekraft.documentburster.job.CliJob;

@Service
public class ReportingService {

	@Autowired
	DocumentBursterSettingsService settingsService;

	public ReportDataResult fetchData(String configurationFilePath, Map<String, String> parameters)
			throws Exception {
		CliJob cliJob = new CliJob(configurationFilePath);

		return cliJob.doFetchData(parameters);
	}

	/**
	 * Load full report configuration by report code.
	 * Looks in both config/reports/{code} and config/samples/{code}.
	 */
	public ReportFullConfigDto loadReportConfig(String reportCode) throws Exception {
		ReportFullConfigDto config = new ReportFullConfigDto();
		config.reportCode = reportCode;
		
		// Try config/reports first, then config/samples
		Path reportsDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports", reportCode);
		Path samplesDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", reportCode);
		
		Path itemDir;
		String configType;
		if (Files.exists(reportsDir)) {
			itemDir = reportsDir;
			configType = "config-reports";
		} else if (Files.exists(samplesDir)) {
			itemDir = samplesDir;
			configType = "config-samples";
		} else {
			throw new RuntimeException("Report not found: " + reportCode);
		}
		
		// Set configuration file path
		if ("config-reports".equals(configType)) {
			config.configurationFilePath = "./config/reports/" + reportCode + "/settings.xml";
		} else {
			config.configurationFilePath = "./config/samples/" + reportCode + "/settings.xml";
		}
		
		// Load settings.xml for report name and dsInputType
		Path settingsPath = itemDir.resolve("settings.xml");
		if (Files.exists(settingsPath)) {
			String content = Files.readString(settingsPath);
			config.reportName = extractXmlValue(content, "template");
			config.dsInputType = extractReportingDsInputType(itemDir);
		}
		
		// Load parameters DSL
		Path paramsPath = itemDir.resolve(reportCode + "-report-parameters-spec.groovy");
		if (Files.exists(paramsPath)) {
			config.parameters = ReportParametersHelper.parseGroovyParametersDslCode(Files.readString(paramsPath));
			config.hasParameters = config.parameters != null && !config.parameters.isEmpty();
		}
		
		// Load Tabulator DSL
		Path tabulatorPath = itemDir.resolve(reportCode + "-tabulator-config.groovy");
		if (Files.exists(tabulatorPath)) {
			var opts = TabulatorOptionsParser.parseGroovyTabulatorDslCode(Files.readString(tabulatorPath));
			if (opts != null) {
				config.tabulatorOptions = new HashMap<>();
				if (opts.getLayoutOptions() != null) {
					config.tabulatorOptions.put("layoutOptions", opts.getLayoutOptions());
				}
				if (opts.getColumns() != null) {
					config.tabulatorOptions.put("columns", opts.getColumns());
				}
				if (opts.getData() != null) {
					config.tabulatorOptions.put("data", opts.getData());
				}
				config.hasTabulator = true;
			}
		}
		
		// Load Chart DSL
		Path chartPath = itemDir.resolve(reportCode + "-chart-config.groovy");
		if (Files.exists(chartPath)) {
			var opts = ChartOptionsParser.parseGroovyChartDslCode(Files.readString(chartPath));
			if (opts != null) {
				config.chartOptions = new HashMap<>();
				if (opts.getType() != null) {
					config.chartOptions.put("type", opts.getType());
				}
				if (opts.getLabelField() != null) {
					config.chartOptions.put("labelField", opts.getLabelField());
				}
				if (opts.getOptions() != null && !opts.getOptions().isEmpty()) {
					config.chartOptions.put("options", opts.getOptions());
				}
				if (opts.getLabels() != null && !opts.getLabels().isEmpty()) {
					config.chartOptions.put("labels", opts.getLabels());
				}
				if (opts.getDatasets() != null && !opts.getDatasets().isEmpty()) {
					config.chartOptions.put("datasets", opts.getDatasets());
				}
				if (opts.getData() != null && !opts.getData().isEmpty()) {
					config.chartOptions.put("data", opts.getData());
				}
				config.hasChart = true;
			}
		}
		
		// Load Pivot DSL
		Path pivotPath = itemDir.resolve(reportCode + "-pivot-config.groovy");
		if (Files.exists(pivotPath)) {
			var opts = PivotTableOptionsParser.parseGroovyPivotTableDslCode(Files.readString(pivotPath));
			if (opts != null) {
				config.pivotTableOptions = new HashMap<>();
				if (opts.getRows() != null && !opts.getRows().isEmpty()) {
					config.pivotTableOptions.put("rows", opts.getRows());
				}
				if (opts.getCols() != null && !opts.getCols().isEmpty()) {
					config.pivotTableOptions.put("cols", opts.getCols());
				}
				if (opts.getVals() != null && !opts.getVals().isEmpty()) {
					config.pivotTableOptions.put("vals", opts.getVals());
				}
				if (opts.getAggregatorName() != null) {
					config.pivotTableOptions.put("aggregatorName", opts.getAggregatorName());
				}
				if (opts.getRendererName() != null) {
					config.pivotTableOptions.put("rendererName", opts.getRendererName());
				}
				if (opts.getRowOrder() != null) {
					config.pivotTableOptions.put("rowOrder", opts.getRowOrder());
				}
				if (opts.getColOrder() != null) {
					config.pivotTableOptions.put("colOrder", opts.getColOrder());
				}
				if (opts.getValueFilter() != null && !opts.getValueFilter().isEmpty()) {
					config.pivotTableOptions.put("valueFilter", opts.getValueFilter());
				}
				if (opts.getOptions() != null && !opts.getOptions().isEmpty()) {
					config.pivotTableOptions.put("options", opts.getOptions());
				}
				config.hasPivotTable = true;
			}
		}
		
		return config;
	}
	
	/**
	 * Fetch report data using report code and parameters.
	 */
	public ReportDataResult fetchReportData(String reportCode, Map<String, String> parameters) throws Exception {
		// Build config file path
		Path reportsDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports", reportCode);
		Path samplesDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", reportCode);
		
		String cfgFilePath;
		if (Files.exists(reportsDir)) {
			cfgFilePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports", reportCode, "settings.xml").toString();
		} else if (Files.exists(samplesDir)) {
			cfgFilePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", reportCode, "settings.xml").toString();
		} else {
			throw new RuntimeException("Report not found: " + reportCode);
		}
		
		return fetchData(cfgFilePath, parameters);
	}
	
	private String extractXmlValue(String content, String tag) {
		int startPos = content.indexOf("<" + tag + ">") + tag.length() + 2;
		int endPos = content.indexOf("</" + tag + ">");
		if (startPos > tag.length() + 1 && endPos > startPos) {
			return content.substring(startPos, endPos).trim();
		}
		return "";
	}
	
	private String extractReportingDsInputType(Path itemDir) {
		try {
			Path reportingPath = itemDir.resolve("reporting.xml");
			if (Files.exists(reportingPath)) {
				String content = Files.readString(reportingPath);
				return extractXmlValue(content, "type");
			}
		} catch (Exception e) {
			// Ignore
		}
		return "";
	}
}
