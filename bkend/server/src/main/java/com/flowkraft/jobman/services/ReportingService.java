package com.flowkraft.jobman.services;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.samples.SamplesFrendOnlyService;

import com.flowkraft.cfgman.DocumentBursterSettingsService;
import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.dtos.ReportFullConfigDto;
import com.sourcekraft.documentburster.common.chart.ChartOptionsParser;
import com.sourcekraft.documentburster.common.db.ReportDataResult;
import com.sourcekraft.documentburster.common.pivottable.PivotTableOptionsParser;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.ConfigurationFileInfo;
import com.sourcekraft.documentburster.common.tabulator.TabulatorOptionsParser;
import com.sourcekraft.documentburster.job.CliJob;
import com.sourcekraft.documentburster.utils.CsvUtils;
import com.sourcekraft.documentburster.utils.FreemarkerRenderingUtils;

@Service
public class ReportingService {

	private static final Logger log = LoggerFactory.getLogger(ReportingService.class);

	@Autowired
	DocumentBursterSettingsService settingsService;

	@Autowired
	SamplesFrendOnlyService samplesFrendOnlyService;

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
		System.out.println("[DEBUG] ReportingService.loadReportConfig(" + reportCode + ") - START");
		System.out.println("[DEBUG] PORTABLE_EXECUTABLE_DIR_PATH = " + AppPaths.PORTABLE_EXECUTABLE_DIR_PATH);
		
		ReportFullConfigDto config = new ReportFullConfigDto();
		config.reportCode = reportCode;
		
		// Try config/reports first, then config/samples
		Path reportsDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports", reportCode);
		Path samplesDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", reportCode);
		
		System.out.println("[DEBUG] Checking reportsDir: " + reportsDir + " exists=" + Files.exists(reportsDir));
		System.out.println("[DEBUG] Checking samplesDir: " + samplesDir + " exists=" + Files.exists(samplesDir));
		
		Path itemDir;
		String configType;
		if (Files.exists(reportsDir)) {
			itemDir = reportsDir;
			configType = "config-reports";
		} else if (Files.exists(samplesDir)) {
			itemDir = samplesDir;
			configType = "config-samples";
		} else {
			// Try frend-only samples under config/samples/_frend/{reportCode}
			Path frendSamplesDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", SamplesFrendOnlyService.FREND_SAMPLES_SUBFOLDER, reportCode);
			System.out.println("[DEBUG] Checking frendSamplesDir: " + frendSamplesDir + " exists=" + Files.exists(frendSamplesDir));
			if (Files.exists(frendSamplesDir)) {
				try {
					System.out.println("[DEBUG] Found _frend sample folder: " + reportCode + " - ensuring settings.xml/reporting.xml exist...");
					samplesFrendOnlyService.getOrProvisionFrendSample(reportCode);
					itemDir = frendSamplesDir;
					configType = "config-samples-frend"; // use distinct type for _frend path resolution
					System.out.println("[DEBUG] Using _frend sample directory: " + itemDir);
				} catch (Exception e) {
					System.out.println("[DEBUG] Failed loading frend sample: " + e.getMessage());
					throw new RuntimeException("Report not found: " + reportCode, e);
				}
			} else {
				System.out.println("[DEBUG] Report not found: " + reportCode);
				throw new RuntimeException("Report not found: " + reportCode);
			}
		}
		
		System.out.println("[DEBUG] Using itemDir: " + itemDir);
		
		// Set configuration file path
		if ("config-reports".equals(configType)) {
			config.configurationFilePath = "./config/reports/" + reportCode + "/settings.xml";
		} else if ("config-samples-frend".equals(configType)) {
			config.configurationFilePath = "./config/samples/_frend/" + reportCode + "/settings.xml";
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
		System.out.println("[DEBUG] Parameters DSL path: " + paramsPath + " exists=" + Files.exists(paramsPath));
		if (Files.exists(paramsPath)) {
			String dslContent = Files.readString(paramsPath);
			config.parametersDsl = dslContent;
			System.out.println("[DEBUG] Parameters DSL content (first 200 chars): " + dslContent.substring(0, Math.min(200, dslContent.length())));
			config.parameters = ReportParametersHelper.parseGroovyParametersDslCode(dslContent);
			config.hasParameters = config.parameters != null && !config.parameters.isEmpty();
			System.out.println("[DEBUG] Parameters DSL parsed, hasParameters=" + config.hasParameters);
		}
		
		// Load Tabulator DSL
		Path tabulatorPath = itemDir.resolve(reportCode + "-tabulator-config.groovy");
		System.out.println("[DEBUG] Tabulator DSL path: " + tabulatorPath + " exists=" + Files.exists(tabulatorPath));
		if (Files.exists(tabulatorPath)) {
			try {
				String dslContent = Files.readString(tabulatorPath);
				config.tabulatorDsl = dslContent;
				System.out.println("[DEBUG] Tabulator DSL content (first 200 chars): " + dslContent.substring(0, Math.min(200, dslContent.length())));
				var opts = TabulatorOptionsParser.parseGroovyTabulatorDslCode(dslContent);
				System.out.println("[DEBUG] Tabulator DSL parsed successfully, opts=" + (opts != null ? "not null" : "null"));
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
			} catch (Exception e) {
				System.out.println("[DEBUG] ERROR parsing Tabulator DSL: " + e.getMessage());
				e.printStackTrace();
				throw e;
			}
		}
		
		// Load Chart DSL
		Path chartPath = itemDir.resolve(reportCode + "-chart-config.groovy");
		System.out.println("[DEBUG] Chart DSL path: " + chartPath + " exists=" + Files.exists(chartPath));
		if (Files.exists(chartPath)) {
			String dslContent = Files.readString(chartPath);
			config.chartDsl = dslContent;
			System.out.println("[DEBUG] Chart DSL content (first 200 chars): " + dslContent.substring(0, Math.min(200, dslContent.length())));
			var opts = ChartOptionsParser.parseGroovyChartDslCode(dslContent);
			System.out.println("[DEBUG] Chart DSL parsed successfully, opts=" + (opts != null ? "not null" : "null"));
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
		System.out.println("[DEBUG] Pivot DSL path: " + pivotPath + " exists=" + Files.exists(pivotPath));
		if (Files.exists(pivotPath)) {
			String dslContent = Files.readString(pivotPath);
			config.pivotTableDsl = dslContent;
			System.out.println("[DEBUG] Pivot DSL loaded, content length=" + dslContent.length() + ", first 200 chars: " + dslContent.substring(0, Math.min(200, dslContent.length())));
			var opts = PivotTableOptionsParser.parseGroovyPivotTableDslCode(dslContent);
			System.out.println("[DEBUG] Pivot DSL parsed successfully, opts=" + (opts != null ? "not null" : "null"));
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
				System.out.println("[DEBUG] Pivot config set: hasPivotTable=true, pivotTableDsl length=" + config.pivotTableDsl.length());
			}
		} else {
			System.out.println("[DEBUG] No pivot DSL file found at: " + pivotPath);
		}
		
		return config;
	}
	
	/**
	 * Fetch report data using report code and parameters.
	 * If entityCode parameter is provided, also renders the HTML template for that entity.
	 * 
	 * When entityCode is present, it's expected that the SQL query or Groovy script
	 * uses :entityCode as a parameter binding, guaranteeing a single row result.
	 */
	public ReportDataResult fetchReportData(String reportCode, Map<String, String> parameters) throws Exception {
		System.out.println("[DEBUG] fetchReportData - START, reportCode=" + reportCode + ", parameters=" + parameters);
		
		// Build config file path
		Path reportsDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports", reportCode);
		Path samplesDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", reportCode);
		
		System.out.println("[DEBUG] fetchReportData - reportsDir=" + reportsDir + ", exists=" + Files.exists(reportsDir));
		System.out.println("[DEBUG] fetchReportData - samplesDir=" + samplesDir + ", exists=" + Files.exists(samplesDir));
		
		String cfgFilePath;
		Path itemDir;
		if (Files.exists(reportsDir)) {
			cfgFilePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports", reportCode, "settings.xml").toString();
			itemDir = reportsDir;
			System.out.println("[DEBUG] fetchReportData - using reportsDir, cfgFilePath=" + cfgFilePath);
		} else if (Files.exists(samplesDir)) {
			cfgFilePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", reportCode, "settings.xml").toString();
			itemDir = samplesDir;
			System.out.println("[DEBUG] fetchReportData - using samplesDir, cfgFilePath=" + cfgFilePath);
		} else {
			// Try frend-only samples under config/samples/_frend/{reportCode}
			Path frendSamplesDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", SamplesFrendOnlyService.FREND_SAMPLES_SUBFOLDER, reportCode);
			System.out.println("[DEBUG] Checking frendSamplesDir (data fetch): " + frendSamplesDir + " exists=" + Files.exists(frendSamplesDir));
			if (Files.exists(frendSamplesDir)) {
				try {
					samplesFrendOnlyService.getOrProvisionFrendSample(reportCode);
					cfgFilePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples", SamplesFrendOnlyService.FREND_SAMPLES_SUBFOLDER, reportCode, "settings.xml").toString();
					itemDir = frendSamplesDir;
				} catch (Exception e) {
					throw new RuntimeException("Report not found: " + reportCode, e);
				}
			} else {
				throw new RuntimeException("Report not found: " + reportCode);
			}
		}
		
		// Fetch the report data (entityCode flows through as a parameter to SQL/Script)
		System.out.println("[DEBUG] fetchReportData - about to call fetchData with cfgFilePath=" + cfgFilePath);
		ReportDataResult result = fetchData(cfgFilePath, parameters);
		System.out.println("[DEBUG] fetchReportData - fetchData returned, reportData size=" + (result.reportData != null ? result.reportData.size() : "null"));
		
		// Check if entityCode was provided for single-entity HTML rendering
		String entityCode = parameters != null ? parameters.get("entityCode") : null;
		System.out.println("[DEBUG] fetchReportData - entityCode=" + entityCode);
		if (entityCode != null && !entityCode.isEmpty()) {
			result.entityCode = entityCode;
			
			try {
				// Load settings to get template configuration
				Settings settings = new Settings(cfgFilePath);
				settings.loadSettings();
				
				String outputType = settings.getReportTemplate().outputtype;
				System.out.println("[DEBUG] fetchReportData - outputType=" + outputType);
				
				// Only render if output type is HTML-based
				if (FreemarkerRenderingUtils.isHtmlBasedOutputType(outputType)) {
					String templatePath = settings.getReportTemplate().retrieveTemplateFilePath();
					System.out.println("[DEBUG] fetchReportData - templatePath=" + templatePath);
					
					// Make template path absolute if relative
					Path absoluteTemplatePath = itemDir.resolve(templatePath);
					System.out.println("[DEBUG] fetchReportData - absoluteTemplatePath=" + absoluteTemplatePath + ", exists=" + Files.exists(absoluteTemplatePath));
					if (!Files.exists(absoluteTemplatePath)) {
						// Try from PORTABLE_EXECUTABLE_DIR_PATH
						absoluteTemplatePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, templatePath);
						System.out.println("[DEBUG] fetchReportData - trying PORTABLE path: " + absoluteTemplatePath + ", exists=" + Files.exists(absoluteTemplatePath));
					}
					
					if (Files.exists(absoluteTemplatePath)) {
						// When entityCode is used, the SQL/Script is expected to return exactly one row
						// via :entityCode parameter binding (e.g., WHERE customer_id = :entityCode)
						if (result.reportData != null && !result.reportData.isEmpty()) {
							LinkedHashMap<String, Object> entityRow = result.reportData.get(0);
							System.out.println("[DEBUG] fetchReportData - entityRow keys=" + entityRow.keySet());
							
							// Build user variables from the entity row
							Map<String, Object> userVariables = new HashMap<>(entityRow);
							
							// Render the template
							result.renderedHtml = FreemarkerRenderingUtils.renderTemplate(
									absoluteTemplatePath.toString(), userVariables);
							System.out.println("[DEBUG] fetchReportData - renderedHtml length=" + (result.renderedHtml != null ? result.renderedHtml.length() : "null"));
							
							log.info("Rendered HTML for entity '{}' from template '{}'", 
									entityCode, absoluteTemplatePath);
						} else {
							System.out.println("[DEBUG] fetchReportData - No data returned for entityCode: " + entityCode);
							log.warn("No data returned for entityCode: {}", entityCode);
						}
					} else {
						System.out.println("[DEBUG] fetchReportData - Template file not found: " + absoluteTemplatePath);
						log.warn("Template file not found: {}", absoluteTemplatePath);
					}
				} else {
					System.out.println("[DEBUG] fetchReportData - Output type is not HTML-based: " + outputType);
					log.debug("Output type '{}' is not HTML-based, skipping template rendering", outputType);
				}
			} catch (Exception e) {
				System.out.println("[DEBUG] fetchReportData - EXCEPTION: " + e.getMessage());
				e.printStackTrace();
				log.error("Failed to render HTML for entity '{}': {}", entityCode, e.getMessage(), e);
				// Don't fail the entire request, just log the error
			}
		}
		
		System.out.println("[DEBUG] fetchReportData - END, returning result with renderedHtml=" + (result.renderedHtml != null ? result.renderedHtml.length() + " chars" : "null"));
		return result;
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
