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
import com.sourcekraft.documentburster.common.security.SecretsCipher;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionEmailSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;

import com.sourcekraft.documentburster.common.settings.model.ConnectionFileInfo;

import reactor.core.publisher.Flux;
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

	private static final String PASSWORD_MASK = "******";

	// ========== LIST ALL CONNECTIONS ==========

	@GetMapping(value = "/email", consumes = MediaType.ALL_VALUE)
	public Flux<ConnectionFileInfo> listEmailConnections() throws Exception {
		return Flux.fromStream(reportsService.loadSettingsConnectionEmailAll()
				.peek(this::maskConnectionFileInfoPasswords));
	}

	@GetMapping(value = "/database", consumes = MediaType.ALL_VALUE)
	public Flux<ConnectionFileInfo> listDatabaseConnections() throws Exception {
		return Flux.fromStream(reportsService.loadSettingsConnectionDatabaseAll()
				.peek(this::maskConnectionFileInfoPasswords));
	}

	// ========== LOAD SINGLE CONNECTION ==========

	@GetMapping(value = "/{connectionId}/email/settings", consumes = MediaType.ALL_VALUE)
	public Mono<DocumentBursterConnectionEmailSettings> loadEmailConnection(
			@PathVariable String connectionId) throws Exception {
		String fullPath = connectionsService.resolveEmailConnectionPath(connectionId);
		DocumentBursterConnectionEmailSettings result = reportsService.loadSettingsConnectionEmail(fullPath);
		if (result != null && result.connection != null && result.connection.emailserver != null) {
			result.connection.emailserver.userpassword = maskIfSecret(result.connection.emailserver.userpassword);
		}
		return Mono.just(result);
	}

	@GetMapping(value = "/{connectionId}/database/settings", consumes = MediaType.ALL_VALUE)
	public Mono<DocumentBursterConnectionDatabaseSettings> loadDatabaseConnection(
			@PathVariable String connectionId) throws Exception {
		String fullPath = connectionsService.resolveDbConnectionPath(connectionId);
		DocumentBursterConnectionDatabaseSettings result = reportsService.loadSettingsConnectionDatabase(fullPath);
		if (result != null && result.connection != null && result.connection.databaseserver != null) {
			result.connection.databaseserver.userpassword = maskIfSecret(result.connection.databaseserver.userpassword);
		}
		return Mono.just(result);
	}

	// ========== SAVE CONNECTION ==========

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
			try {
				if ("email".equals(connectionType)) {
					connectionsService.testEmailConnection(connectionId);
					return ResponseEntity.ok(Map.<String, Object>of(
							"status", "success",
							"message", "Email connection test passed"));
				} else if ("email-inline".equals(connectionType)) {
					connectionsService.testInlineEmailConnection(connectionId);
					return ResponseEntity.ok(Map.<String, Object>of(
							"status", "success",
							"message", "Inline email connection test passed"));
				} else {
					connectionsService.testDatabaseConnection(connectionId);
					return ResponseEntity.ok(Map.<String, Object>of(
							"status", "success",
							"message", "Database connection test passed"));
				}
			} catch (Throwable t) {
				throw (t instanceof Exception) ? (Exception) t : new Exception(t);
			}
		}).onErrorResume(e -> {
			log.error("Connection test failed for {}: {}", connectionId, e.getMessage());
			return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("status", "error", "message", e.getMessage())));
		});
	}

	/**
	 * Save (create or update) a database connection.
	 * Backend resolves the file path from connectionId.
	 */
	@PutMapping(value = "/{connectionId}/database", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<Void>> saveDatabaseConnection(
			@PathVariable String connectionId,
			@RequestBody DocumentBursterConnectionDatabaseSettings settings) {
		log.info("Saving database connection: {}", connectionId);
		return Mono.fromCallable(() -> {
			String fullPath = connectionsService.resolveDbConnectionPath(connectionId);
			// If password is masked, preserve the existing encrypted value from disk
			if (settings.connection != null && settings.connection.databaseserver != null
					&& PASSWORD_MASK.equals(settings.connection.databaseserver.userpassword)
					&& new File(fullPath).exists()) {
				DocumentBursterConnectionDatabaseSettings existing = reportsService.loadSettingsConnectionDatabase(fullPath);
				if (existing != null && existing.connection != null && existing.connection.databaseserver != null) {
					settings.connection.databaseserver.userpassword = existing.connection.databaseserver.userpassword;
				}
			}
			reportsService.saveSettingsConnectionDatabase(settings, fullPath);
			return ResponseEntity.ok().<Void>build();
		}).onErrorResume(e -> {
			log.error("Failed to save database connection {}: {}", connectionId, e.getMessage());
			return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
		});
	}

	/**
	 * Save (create or update) an email connection.
	 * Backend resolves the file path from connectionId.
	 */
	@PutMapping(value = "/{connectionId}/email", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<Void>> saveEmailConnection(
			@PathVariable String connectionId,
			@RequestBody DocumentBursterConnectionEmailSettings settings) {
		log.info("Saving email connection: {}", connectionId);
		return Mono.fromCallable(() -> {
			String filePath = connectionsService.resolveEmailConnectionPath(connectionId);
			// If password is masked, preserve the existing encrypted value from disk
			if (settings.connection != null && settings.connection.emailserver != null
					&& PASSWORD_MASK.equals(settings.connection.emailserver.userpassword)
					&& new File(filePath).exists()) {
				DocumentBursterConnectionEmailSettings existing = reportsService.loadSettingsConnectionEmail(filePath);
				if (existing != null && existing.connection != null && existing.connection.emailserver != null) {
					settings.connection.emailserver.userpassword = existing.connection.emailserver.userpassword;
				}
			}
			reportsService.saveSettingsConnectionEmail(settings, filePath);
			return ResponseEntity.ok().<Void>build();
		}).onErrorResume(e -> {
			log.error("Failed to save email connection {}: {}", connectionId, e.getMessage());
			return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
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

	// ========== PRIVATE HELPERS ==========

	private String maskIfSecret(String value) {
		if (value == null || value.isEmpty()) return value;
		if (value.startsWith("ENC(")) return PASSWORD_MASK;
		if (value.contains("${")) return value; // Variable references
		if (value.contains(" ") && value.length() > 10) return value; // Placeholder text
		return PASSWORD_MASK;
	}

	private void maskConnectionFileInfoPasswords(ConnectionFileInfo connFileInfo) {
		if (connFileInfo == null) return;
		if (connFileInfo.emailserver != null) {
			connFileInfo.emailserver.userpassword = maskIfSecret(connFileInfo.emailserver.userpassword);
		}
		if (connFileInfo.dbserver != null) {
			connFileInfo.dbserver.userpassword = maskIfSecret(connFileInfo.dbserver.userpassword);
		}
	}
}
