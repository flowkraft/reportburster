package com.flowkraft.queries.controllers;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.queries.services.QueriesService;
import com.sourcekraft.documentburster.common.db.schema.SchemaInfo;

import reactor.core.publisher.Mono;

/**
 * Ad-hoc SQL query execution and schema exploration.
 * Replaces the need for SQL Management Studio / Toad.
 */
@RestController
@RequestMapping(value = "/api/queries", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class QueriesController {

	private static final Logger log = LoggerFactory.getLogger(QueriesController.class);

	private final QueriesService queriesService;

	public QueriesController(QueriesService queriesService) {
		this.queriesService = queriesService;
	}

	@PostMapping("/execute")
	public Mono<Map<String, Object>> executeQuery(@RequestBody Map<String, Object> request) throws Exception {
		String connectionId = (String) request.get("connectionId");
		String sql = (String) request.get("sql");

		@SuppressWarnings("unchecked")
		Map<String, Object> params = (Map<String, Object>) request.get("params");

		log.info("Executing ad-hoc query on connection '{}': {}", connectionId,
				sql != null && sql.length() > 100 ? sql.substring(0, 100) + "..." : sql);

		List<Map<String, Object>> rows = queriesService.executeQuery(connectionId, sql, params);

		return Mono.just(Map.of(
				"data", rows,
				"rowCount", rows.size()));
	}

	@GetMapping(value = "/schema/{connectionId}", consumes = MediaType.ALL_VALUE)
	public Mono<SchemaInfo> getSchema(@PathVariable String connectionId) throws Exception {
		log.info("Fetching schema for connection '{}'", connectionId);
		return Mono.just(queriesService.getSchema(connectionId));
	}
}
