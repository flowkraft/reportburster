package com.flowkraft.reporting.controllers;

import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.flowkraft.common.AppPaths;
import com.flowkraft.reporting.dtos.ReportFullConfigDto;
import com.flowkraft.reporting.services.ReportingService;
import com.sourcekraft.documentburster.common.db.ReportDataResult;
import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;
import com.flowkraft.reporting.dsl.tabulator.TabulatorOptions;
import com.flowkraft.reporting.dsl.tabulator.TabulatorOptionsParser;
import com.flowkraft.reporting.dsl.chart.ChartOptions;
import com.flowkraft.reporting.dsl.chart.ChartOptionsParser;
import com.flowkraft.reporting.dsl.pivottable.PivotTableOptions;
import com.flowkraft.reporting.dsl.pivottable.PivotTableOptionsParser;
import com.flowkraft.reporting.dsl.filterpane.FilterPaneOptions;
import com.flowkraft.reporting.dsl.filterpane.FilterPaneOptionsParser;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/reporting",
		produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class ReportingController {

	private static final Logger log = LoggerFactory.getLogger(ReportingController.class);

	ReportingService reportingService;

	@Autowired
	public ReportingController(ReportingService reportingService) {
		this.reportingService = reportingService;
	}

	@PostMapping("/parse-parameters")
	public Mono<List<ReportParameter>> processGroovyParameters(@RequestBody String groovyParametersDslCode,
			@RequestParam(required = false) String connectionCode) {

		String cleanedCode = groovyParametersDslCode.replaceAll("^\"|\"$", "") // Remove surrounding quotes
				.replace("\\n", "\n") // Unescape newlines
				.replace("\\t", "\t") // Unescape tabs
				.replace("\\\"", "\""); // Unescape double quotes

		return Mono.fromCallable(() -> {
			List<ReportParameter> reportParameters = ReportParametersHelper.parseGroovyParametersDslCode(cleanedCode);

			if (connectionCode != null && !connectionCode.isEmpty()) {
				reportingService.resolveParameterSqlOptions(reportParameters, connectionCode);
			}

			return reportParameters;
		}).doOnError(e -> log.error("Error parsing report parameters", e)).onErrorResume(e -> Mono.error(
				new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse report parameters", e)));
	}

	@PostMapping("/parse-tabulator")
	public Mono<TabulatorOptions> processGroovyTabulator(@RequestBody String groovyTabulatorDslCode) {
		// System.out.println("[DEBUG] /parse-tabulator: received code length=" + (groovyTabulatorDslCode != null ? groovyTabulatorDslCode.length() : "null"));

		String cleanedCode = groovyTabulatorDslCode.replaceAll("^\"|\"$", "") // Remove surrounding quotes
				.replace("\\n", "\n") // Unescape newlines
				.replace("\\t", "\t") // Unescape tabs
				.replace("\\\"", "\""); // Unescape double quotes
		// System.out.println("[DEBUG] /parse-tabulator: cleanedCode length=" + cleanedCode.length() + ", isEmpty=" + cleanedCode.trim().isEmpty());

		return Mono.fromCallable(() -> {
			// System.out.println("[DEBUG] /parse-tabulator: calling parser...");
			TabulatorOptions opts = TabulatorOptionsParser.parseGroovyTabulatorDslCode(cleanedCode);
			// System.out.println("[DEBUG] /parse-tabulator: parser returned, opts=" + (opts != null ? "not null" : "null"));
			return opts;
		}).doOnError(e -> log.error("Error parsing tabulator options", e))
				.onErrorResume(e -> Mono.error(
						new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse tabulator options", e)));
	}

	@PostMapping("/parse-chart")
	public Mono<ChartOptions> processGroovyChart(@RequestBody String groovyChartDslCode) {
		// System.out.println("[DEBUG] /parse-chart: received code length=" + (groovyChartDslCode != null ? groovyChartDslCode.length() : "null"));

		String cleanedCode = groovyChartDslCode.replaceAll("^\"|\"$", "") // Remove surrounding quotes
				.replace("\\n", "\n") // Unescape newlines
				.replace("\\t", "\t") // Unescape tabs
				.replace("\\\"", "\""); // Unescape double quotes
		// System.out.println("[DEBUG] /parse-chart: cleanedCode length=" + cleanedCode.length() + ", isEmpty=" + cleanedCode.trim().isEmpty());

		return Mono.fromCallable(() -> {
			// System.out.println("[DEBUG] /parse-chart: calling parser...");
			ChartOptions opts = ChartOptionsParser.parseGroovyChartDslCode(cleanedCode);
			// System.out.println("[DEBUG] /parse-chart: parser returned, opts=" + (opts != null ? "not null" : "null"));
			return opts;
		}).doOnError(e -> log.error("Error parsing chart options", e)).onErrorResume(e -> Mono.error(
				new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse chart options", e)));
	}

	@PostMapping("/parse-pivot")
	public Mono<PivotTableOptions> processGroovyPivotTable(@RequestBody String groovyPivotDslCode) {
		String cleanedCode = groovyPivotDslCode.replaceAll("^\"|\"$", "") // Remove surrounding quotes
				.replace("\\n", "\n") // Unescape newlines
				.replace("\\t", "\t") // Unescape tabs
				.replace("\\\"", "\""); // Unescape double quotes

		return Mono.fromCallable(() -> {
			PivotTableOptions opts = PivotTableOptionsParser.parseGroovyPivotTableDslCode(cleanedCode);
			return opts;
		}).doOnError(e -> log.error("Error parsing pivot table options", e)).onErrorResume(e -> Mono.error(
				new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse pivot table options", e)));
	}

	@PostMapping("/parse-filterpane")
	public Mono<FilterPaneOptions> processGroovyFilterPane(@RequestBody String groovyFilterPaneDslCode) {
		String cleanedCode = groovyFilterPaneDslCode.replaceAll("^\"|\"$", "")
				.replace("\\n", "\n")
				.replace("\\t", "\t")
				.replace("\\\"", "\"");

		return Mono.fromCallable(() -> {
			FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(cleanedCode);
			return opts;
		}).doOnError(e -> log.error("Error parsing filter pane options", e)).onErrorResume(e -> Mono.error(
				new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse filter pane options", e)));
	}

	@GetMapping("/fetch-data")
	public Mono<ReportDataResult> fetchData(@RequestParam String configurationFilePath,
			@RequestParam Map<String, String> parameters) {

		// System.out.println("[DEBUG] /fetch-data: received request, configurationFilePath=" + configurationFilePath);
		// System.out.println("[DEBUG] /fetch-data: parameters=" + parameters.toString());

		return Mono.fromCallable(() -> {
			String cfgFilePath;
			if (Paths.get(configurationFilePath).isAbsolute()) {
				cfgFilePath = configurationFilePath;
			} else {
				cfgFilePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, configurationFilePath).toString();
			}
			// System.out.println("[DEBUG] /fetch-data: cfgFilePath=" + cfgFilePath);

			// Debug print parameter values
			//System.out.println("Parameter values:");
			parameters.forEach((key, value) -> {
				//System.out.println(key + " = " + value);
			});

			// System.out.println("[DEBUG] /fetch-data: calling reportingService.fetchData...");
			ReportDataResult result = reportingService.fetchData(cfgFilePath, parameters, false);
			// System.out.println("[DEBUG] /fetch-data: service returned, reportData size=" +
			//	(result.reportData != null ? result.reportData.size() : "null") +
			//	", columns=" + (result.reportColumnNames != null ? result.reportColumnNames.size() : "null"));
			// System.out.println("[DEBUG] /fetch-data: about to return result to HTTP response...");
			return result;
		}).doOnError(e -> {
			log.error("Error fetching data", e);
		}).onErrorResume(e -> Mono.error(
			new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch data", e)));
	}

	/**
	 * Get full configuration for a report by its code.
	 * This is the single endpoint web components need to bootstrap themselves.
	 * 
	 * @param reportCode The report folder name (e.g., "sales-summary")
	 * @return Complete configuration including parameters, tabulator, chart, pivot options
	 */
	@GetMapping(value = "/reports/{reportCode}/config", consumes = MediaType.ALL_VALUE)
	public Mono<ReportFullConfigDto> getReportConfig(@PathVariable String reportCode) {
		System.out.println("[DEBUG] GET /reports/" + reportCode + "/config - ENTERING");
		return Mono.fromCallable(() -> {
			System.out.println("[DEBUG] GET /reports/" + reportCode + "/config - calling reportingService.loadReportConfig");
			ReportFullConfigDto result = reportingService.loadReportConfig(reportCode);
			System.out.println("[DEBUG] GET /reports/" + reportCode + "/config - SUCCESS, hasTabulator=" + result.hasTabulator);
			return result;
		}).doOnError(e -> {
			System.out.println("[DEBUG] GET /reports/" + reportCode + "/config - ERROR: " + e.getMessage());
			e.printStackTrace();
			log.error("Error loading report config for: " + reportCode, e);
		}).onErrorResume(e -> Mono.error(
				new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to load report config", e)));
	}

	/**
	 * Fetch report data using the report code and parameter values.
	 * Web components call this after user submits parameters.
	 * 
	 * @param reportCode The report folder name
	 * @param parameters User-provided parameter values as query params
	 * @return Report data result
	 */
	@GetMapping(value = "/reports/{reportCode}/data", consumes = MediaType.ALL_VALUE)
	public Mono<ReportDataResult> fetchReportData(
			@PathVariable String reportCode,
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size,
			@RequestParam(required = false, defaultValue = "false") Boolean testMode,
			@RequestParam(required = false) String componentId,
			@RequestParam Map<String, String> parameters) {
		// Remove server-side operation params so they don't reach the Groovy script/SQL
		parameters.remove("page");
		parameters.remove("size");
		parameters.remove("testMode");

		// Extract Tabulator bracket-notation sort/filter params
		// e.g. sort[0][field]=Name&sort[0][dir]=asc&filter[0][field]=Status&filter[0][type]=like&filter[0][value]=Active
		String sort = extractBracketParams(parameters, "sort");
		String filter = extractBracketParams(parameters, "filter");

		// componentId stays in parameters — flows via reportParameters → ctx.variables
		// so ctx.reportData('id', rows) can match the requested component
		log.info("GET /reports/{}/data - params={}, page={}, size={}, sort={}, filter={}, testMode={}, componentId={}",
				reportCode, parameters, page, size, sort, filter, testMode, componentId);
		return Mono.fromCallable(() -> {
			ReportDataResult result = reportingService.fetchReportData(reportCode, parameters, testMode);
			log.info("GET /reports/{}/data - SUCCESS, rows={}", reportCode,
					result.reportData != null ? result.reportData.size() : "null");

			// Apply server-side filtering, sorting, and pagination
			result = reportingService.applyServerSideOperations(result, page, size, sort, filter);

			return result;
		}).doOnError(e -> {
			log.error("Error fetching report data for: " + reportCode, e);
		}).onErrorResume(e -> Mono.error(
			new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch report data", e)));
	}

	/**
	 * Parse Tabulator bracket-notation query params into a JSON array string.
	 * e.g. sort[0][field]=Name&sort[0][dir]=asc → [{"field":"Name","dir":"asc"}]
	 * Removes matched keys from the params map so they don't leak downstream.
	 */
	private String extractBracketParams(Map<String, String> params, String prefix) {
		TreeMap<Integer, Map<String, String>> indexed = new TreeMap<>();
		String pat = prefix + "[";
		Iterator<Map.Entry<String, String>> it = params.entrySet().iterator();
		while (it.hasNext()) {
			Map.Entry<String, String> e = it.next();
			if (e.getKey().startsWith(pat)) {
				// parse "sort[0][field]" → index=0, key="field"
				String rest = e.getKey().substring(pat.length());
				int cb = rest.indexOf(']');
				int idx = Integer.parseInt(rest.substring(0, cb));
				String key = rest.substring(cb + 2, rest.length() - 1);
				indexed.computeIfAbsent(idx, k -> new LinkedHashMap<>()).put(key, e.getValue());
				it.remove();
			}
		}
		if (indexed.isEmpty()) return null;
		try {
			return new ObjectMapper().writeValueAsString(new ArrayList<>(indexed.values()));
		} catch (Exception ex) {
			log.error("Failed to serialize bracket params for prefix: " + prefix, ex);
			return null;
		}
	}

}