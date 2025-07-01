package com.flowkraft.jobman.controllers;

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
import com.sourcekraft.documentburster.common.db.SqlQueryResult;
import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;

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

		System.out.println("/parse-parameters groovyParametersDslCode: " + groovyParametersDslCode.substring(0, 200));
		System.out.println("/parse-parameters cleanedCode: " + cleanedCode.substring(0, 200));

		return Mono.fromCallable(() -> {
			List<ReportParameter> reportParameters = ReportParametersHelper.parseGroovyParametersDslCode(cleanedCode);

			return reportParameters;
		}).doOnError(e -> log.error("Error parsing report parameters", e)).onErrorResume(e -> Mono.error(
				new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse report parameters", e)));
	}

	@GetMapping("/test-fetch-data")
	public Mono<SqlQueryResult> testFetchData(
		    @RequestParam String configurationFilePath,
		    @RequestParam Map<String, String> parameters) {

		System.out.println("/test-fetch-data Received request to test SQL query: " + configurationFilePath);
		System.out.println("/test-fetch-data Received parameters: " + parameters.toString());

		return Mono.fromCallable(() -> {
			String cfgFilePath = configurationFilePath;
			if (configurationFilePath.startsWith("/") || configurationFilePath.startsWith("\\")) {
				cfgFilePath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + configurationFilePath;
			}
			System.out.println("/test-fetch-data cfgFilePath: " + cfgFilePath);

			// Debug print parameter values
			System.out.println("Parameter values:");
			parameters.forEach((key, value) -> {
				System.out.println(key + " = " + value);
			});

			return reportingService.testFetchData(cfgFilePath, parameters);
		}).doOnError(e -> {
			System.out.println("Error testing SQL query: " + e.getMessage());
			log.error("Error testing SQL query", e);
		}).onErrorResume(e -> Mono
				.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to test SQL query", e)));
	}

}