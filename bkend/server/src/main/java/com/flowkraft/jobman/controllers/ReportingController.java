package com.flowkraft.jobman.controllers;

import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

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
import com.flowkraft.jobman.dtos.ReportFullConfigDto;
import com.flowkraft.jobman.services.ReportingService;
import com.sourcekraft.documentburster.common.db.ReportDataResult;
import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;
import com.sourcekraft.documentburster.common.tabulator.TabulatorOptions;
import com.sourcekraft.documentburster.common.tabulator.TabulatorOptionsParser;
import com.sourcekraft.documentburster.common.chart.ChartOptions;
import com.sourcekraft.documentburster.common.chart.ChartOptionsParser;
import com.sourcekraft.documentburster.common.pivottable.PivotTableOptions;
import com.sourcekraft.documentburster.common.pivottable.PivotTableOptionsParser;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/jobman/reporting", // Dedicated base path
		produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class ReportingController {

	private static final Logger log = LoggerFactory.getLogger(ReportingController.class);

	ReportingService reportingService;

	@Autowired
	public ReportingController(ReportingService reportingService) {
		this.reportingService = reportingService;
	}

	@PostMapping("/parse-parameters")
	public Mono<List<ReportParameter>> processGroovyParameters(@RequestBody String groovyParametersDslCode) {

		String cleanedCode = groovyParametersDslCode.replaceAll("^\"|\"$", "") // Remove surrounding quotes
				.replace("\\n", "\n") // Unescape newlines
				.replace("\\t", "\t") // Unescape tabs
				.replace("\\\"", "\""); // Unescape double quotes

		//System.out.println("/parse-parameters groovyParametersDslCode: " + groovyParametersDslCode.substring(0, 200));
		//System.out.println("/parse-parameters cleanedCode: " + cleanedCode.substring(0, 200));

		return Mono.fromCallable(() -> {
			List<ReportParameter> reportParameters = ReportParametersHelper.parseGroovyParametersDslCode(cleanedCode);

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
			ReportDataResult result = reportingService.fetchData(cfgFilePath, parameters);
			// System.out.println("[DEBUG] /fetch-data: service returned, reportData size=" + 
			//	(result.reportData != null ? result.reportData.size() : "null") + 
			//	", columns=" + (result.reportColumnNames != null ? result.reportColumnNames.size() : "null"));
			// System.out.println("[DEBUG] /fetch-data: about to return result to HTTP response...");
			return result;
		}).doOnSuccess(result -> {
			// System.out.println("[DEBUG] /fetch-data: Mono completed successfully, sending HTTP response");
		}).doOnError(e -> {
			//System.out.println("Error fetching data: " + e.getMessage());
			log.error("Error fetching data", e);
		}).onErrorResume(e -> Mono
				.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch data", e)));
	}

	/**
	 * Get full configuration for a report by its code.
	 * This is the single endpoint web components need to bootstrap themselves.
	 * 
	 * @param reportCode The report folder name (e.g., "sales-summary")
	 * @return Complete configuration including parameters, tabulator, chart, pivot options
	 */
	@GetMapping("/reports/{reportCode}/config")
	public Mono<ReportFullConfigDto> getReportConfig(@PathVariable String reportCode) {
		return Mono.fromCallable(() -> {
			return reportingService.loadReportConfig(reportCode);
		}).doOnError(e -> log.error("Error loading report config for: " + reportCode, e))
		.onErrorResume(e -> Mono.error(
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
	@GetMapping("/reports/{reportCode}/data")
	public Mono<ReportDataResult> fetchReportData(
			@PathVariable String reportCode,
			@RequestParam Map<String, String> parameters) {
		return Mono.fromCallable(() -> {
			return reportingService.fetchReportData(reportCode, parameters);
		}).doOnError(e -> log.error("Error fetching report data for: " + reportCode, e))
		.onErrorResume(e -> Mono.error(
				new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch report data", e)));
	}

}