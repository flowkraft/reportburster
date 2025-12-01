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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.services.ReportingService;
import com.sourcekraft.documentburster.common.db.ReportDataResult;
import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;
import com.sourcekraft.documentburster.common.tabulator.TabulatorOptions;
import com.sourcekraft.documentburster.common.tabulator.TabulatorOptionsParser;
import com.sourcekraft.documentburster.common.chart.ChartOptions;
import com.sourcekraft.documentburster.common.chart.ChartOptionsParser;

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

	@GetMapping("/test-fetch-data")
	public Mono<ReportDataResult> testFetchData(@RequestParam String configurationFilePath,
			@RequestParam Map<String, String> parameters) {

		// System.out.println("[DEBUG] /test-fetch-data: received request, configurationFilePath=" + configurationFilePath);
		// System.out.println("[DEBUG] /test-fetch-data: parameters=" + parameters.toString());

		return Mono.fromCallable(() -> {
			String cfgFilePath;
			if (Paths.get(configurationFilePath).isAbsolute()) {
				cfgFilePath = configurationFilePath;
			} else {
				cfgFilePath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, configurationFilePath).toString();
			}
			// System.out.println("[DEBUG] /test-fetch-data: cfgFilePath=" + cfgFilePath);

			// Debug print parameter values
			//System.out.println("Parameter values:");
			parameters.forEach((key, value) -> {
				//System.out.println(key + " = " + value);
			});

			// System.out.println("[DEBUG] /test-fetch-data: calling reportingService.testFetchData...");
			ReportDataResult result = reportingService.testFetchData(cfgFilePath, parameters);
			// System.out.println("[DEBUG] /test-fetch-data: service returned, reportData size=" + 
			//	(result.reportData != null ? result.reportData.size() : "null") + 
			//	", columns=" + (result.reportColumnNames != null ? result.reportColumnNames.size() : "null"));
			// System.out.println("[DEBUG] /test-fetch-data: about to return result to HTTP response...");
			return result;
		}).doOnSuccess(result -> {
			// System.out.println("[DEBUG] /test-fetch-data: Mono completed successfully, sending HTTP response");
		}).doOnError(e -> {
			//System.out.println("Error testing SQL query: " + e.getMessage());
			log.error("Error testing SQL query", e);
		}).onErrorResume(e -> Mono
				.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to test SQL query", e)));
	}

}