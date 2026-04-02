package com.flowkraft.connections;

import java.io.File;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.common.AppPaths;
import com.flowkraft.reports.ReportsService;
import com.sourcekraft.documentburster.common.db.schema.SchemaInfo;
import com.sourcekraft.documentburster.common.security.SecretsCipher;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionEmailSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;

import reactor.core.publisher.Mono;

/**
 * REST API for managing database and email connections.
 * Replaces the old pattern of spawning CLI commands via child-process/spawn.
 */
@RestController
@RequestMapping(value = "/api/connections", produces = MediaType.APPLICATION_JSON_VALUE)
public class ConnectionsController {

	private static final Logger log = LoggerFactory.getLogger(ConnectionsController.class);

	private final ConnectionsService connectionsService;
	private final ReportsService reportsService;

	public ConnectionsController(ConnectionsService connectionsService, ReportsService reportsService) {
		this.connectionsService = connectionsService;
		this.reportsService = reportsService;
	}

	/**
	 * Test a connection (email or database).
	 * For database connections, also fetches and saves the schema.
	 */
	@PostMapping(value = "/{connectionId}/test", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<Map<String, Object>>> testConnection(
			@PathVariable String connectionId,
			@RequestBody Map<String, String> request) {

		String connectionType = request.getOrDefault("type", "database");
		log.info("Testing {} connection: {}", connectionType, connectionId);

		return Mono.fromCallable(() -> {
			if ("email".equals(connectionType)) {
				connectionsService.testEmailConnection(connectionId);
				return ResponseEntity.ok(Map.<String, Object>of(
						"status", "success",
						"message", "Email connection test passed"));
			} else {
				SchemaInfo schema = connectionsService.testDatabaseConnection(connectionId);
				return ResponseEntity.ok(Map.<String, Object>of(
						"status", "success",
						"message", "Database connection test passed",
						"tablesCount", schema.tables.size()));
			}
		}).onErrorResume(e -> {
			log.error("Connection test failed for {}: {}", connectionId, e.getMessage());
			return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("status", "error", "message", e.getMessage())));
		});
	}

	/**
	 * Delete a connection.
	 */
	@DeleteMapping("/{connectionId}")
	public Mono<ResponseEntity<Void>> deleteConnection(@PathVariable String connectionId) {
		log.info("Deleting connection: {}", connectionId);
		return Mono.fromCallable(() -> {
			connectionsService.deleteConnection(connectionId);
			return ResponseEntity.ok().<Void>build();
		});
	}

	/**
	 * Read connection metadata (domain-grouped-schema, er-diagram, ubiquitous-language, information-schema).
	 */
	@GetMapping(value = "/{connectionId}/metadata/{type}", consumes = MediaType.ALL_VALUE)
	public Mono<ResponseEntity<Map<String, String>>> getMetadata(
			@PathVariable String connectionId,
			@PathVariable String type) {

		return Mono.fromCallable(() -> {
			String content = connectionsService.getMetadata(connectionId, type);
			if (content == null) {
				return ResponseEntity.ok(Map.of("exists", "false", "content", ""));
			}
			return ResponseEntity.ok(Map.of("exists", "true", "content", content));
		});
	}

	/**
	 * Save connection metadata.
	 */
	@PutMapping(value = "/{connectionId}/metadata/{type}", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<Void>> saveMetadata(
			@PathVariable String connectionId,
			@PathVariable String type,
			@RequestBody Map<String, String> request) {

		String content = request.get("content");
		return Mono.fromCallable(() -> {
			connectionsService.saveMetadata(connectionId, type, content);
			return ResponseEntity.ok().<Void>build();
		});
	}

	/**
	 * Test SMS connection via Twilio.
	 */
	@PostMapping(value = "/test-sms", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<Map<String, Object>>> testSms(@RequestBody Map<String, String> request) {
		String fromNumber = request.get("fromNumber");
		String toNumber = request.get("toNumber");
		String configPath = request.get("configPath");

		log.info("Testing SMS: from={}, to={}", fromNumber, toNumber);

		return Mono.fromCallable(() -> {
			connectionsService.testSms(fromNumber, toNumber, configPath);
			return ResponseEntity.ok(Map.<String, Object>of(
					"status", "success",
					"message", "SMS test sent successfully"));
		}).onErrorResume(e -> {
			log.error("SMS test failed: {}", e.getMessage());
			return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("status", "error", "message", e.getMessage())));
		});
	}

	/**
	 * Reveal (decrypt) a password field for a connection or report settings.
	 *
	 * Query parameters:
	 *   - "field": the field name to reveal ("userpassword", "authtoken", "accountsid", "proxypassword")
	 *   - "reportId" (optional): for inline SMTP/Twilio/proxy passwords within a report config
	 *
	 * For database/email connections, connectionId is the connection code (e.g., "db-northwind-postgres", "eml-contact").
	 * For report-level passwords (Twilio, proxy, inline SMTP), use connectionId="settings" and provide reportId.
	 */
	@GetMapping(value = "/{connectionId}/reveal-password", consumes = MediaType.ALL_VALUE)
	public Mono<ResponseEntity<Map<String, String>>> revealPassword(
			@PathVariable String connectionId,
			@RequestParam String field,
			@RequestParam(required = false) String reportId) {

		final String fieldName = field;
		// Resolve reportId to configPath
		final String configPath;
		if (reportId != null && !reportId.isEmpty()) {
			String reportsPath = "config/reports/" + reportId + "/settings.xml";
			if (new File(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/" + reportsPath).exists()) {
				configPath = reportsPath;
			} else {
				String samplesPath = "config/samples/" + reportId + "/settings.xml";
				if (new File(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/" + samplesPath).exists()) {
					configPath = samplesPath;
				} else if ("burst".equals(reportId)) {
					configPath = "config/burst/settings.xml";
				} else {
					configPath = reportsPath;
				}
			}
		} else {
			configPath = null;
		}

		return Mono.fromCallable(() -> {
			SecretsCipher cipher = SecretsCipher.getInstance(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH);
			String encryptedValue = null;

			// Determine where to load the encrypted value from
			if ("authtoken".equals(fieldName) || "accountsid".equals(fieldName) || "proxypassword".equals(fieldName)) {
				// These live in main settings.xml, not in a connection file
				if (configPath == null || configPath.isEmpty()) {
					return ResponseEntity.badRequest()
							.body(Map.of("error", "configPath is required for field: " + fieldName));
				}
				String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
						+ configPath.replaceFirst("^/", "");
				DocumentBursterSettings dbSettings = reportsService.loadSettings(fullPath);

				if ("authtoken".equals(fieldName)
						&& dbSettings.settings.smssettings != null
						&& dbSettings.settings.smssettings.twilio != null) {
					encryptedValue = dbSettings.settings.smssettings.twilio.authtoken;
				} else if ("accountsid".equals(fieldName)
						&& dbSettings.settings.smssettings != null
						&& dbSettings.settings.smssettings.twilio != null) {
					encryptedValue = dbSettings.settings.smssettings.twilio.accountsid;
				} else if ("proxypassword".equals(fieldName)
						&& dbSettings.settings.simplejavamail != null
						&& dbSettings.settings.simplejavamail.proxy != null) {
					encryptedValue = dbSettings.settings.simplejavamail.proxy.password;
				}
			} else {
				// "userpassword" — try database connection first, then email connection
				String dbConnPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH
						+ "/config/connections/" + connectionId + "/" + connectionId + ".xml";

				if (new File(dbConnPath).exists()) {
					DocumentBursterConnectionDatabaseSettings dbConn = reportsService
							.loadSettingsConnectionDatabase(dbConnPath);
					encryptedValue = dbConn.connection.databaseserver.userpassword;
				} else {
					// Try as email connection file
					String emlConnPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH
							+ "/config/connections/" + connectionId + ".xml";
					if (new File(emlConnPath).exists()) {
						DocumentBursterConnectionEmailSettings emlConn = reportsService
								.loadSettingsConnectionEmail(emlConnPath);
						encryptedValue = emlConn.connection.emailserver.userpassword;
					} else {
						// Try configPath for main settings email password
						if (configPath != null && !configPath.isEmpty()) {
							String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
									+ configPath.replaceFirst("^/", "");
							DocumentBursterSettings dbSettings = reportsService.loadSettings(fullPath);
							if (dbSettings.settings.emailserver != null) {
								encryptedValue = dbSettings.settings.emailserver.userpassword;
							}
						}
					}
				}
			}

			if (encryptedValue == null || encryptedValue.isEmpty()) {
				return ResponseEntity.ok(Map.of("password", ""));
			}

			String decrypted = cipher.decrypt(encryptedValue);
			return ResponseEntity.ok(Map.of("password", decrypted));

		}).onErrorResume(e -> {
			log.error("Failed to reveal password for {}/{}: {}", connectionId, fieldName, e.getMessage());
			return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(Map.of("error", e.getMessage())));
		});
	}
}
