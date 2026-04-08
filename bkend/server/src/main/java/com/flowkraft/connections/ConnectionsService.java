package com.flowkraft.connections;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobs.services.JobExecutionService;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.job.CliJob;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionEmailSettings;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Service for managing database and email connections.
 * Handles CRUD operations, connection testing, and metadata file management.
 */
@Service
public class ConnectionsService {

	private static final Logger log = LoggerFactory.getLogger(ConnectionsService.class);

	@org.springframework.beans.factory.annotation.Autowired
	private JobExecutionService jobExecutionService;

	private String getConnectionsDir() {
		return AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/connections";
	}

	private String getConnectionFilePath(String connectionId) {
		return getConnectionsDir() + "/" + connectionId + "/" + connectionId + ".xml";
	}

	/** Resolve file path for a database connection: config/connections/{id}/{id}.xml */
	public String resolveDbConnectionPath(String connectionId) {
		return getConnectionFilePath(connectionId);
	}

	/** Resolve file path for an email connection: config/connections/{id}.xml */
	public String resolveEmailConnectionPath(String connectionId) {
		return getConnectionsDir() + "/" + connectionId + ".xml";
	}

	/**
	 * Test an email connection by sending a test message.
	 * Goes through DocumentBurster.execute() → CliJob.doCheckEmail() for proper
	 * .job file lifecycle (status bar "Working on...").
	 */
	public void testEmailConnection(String connectionId) throws Throwable {
		String connectionFilePath = resolveEmailConnectionPath(connectionId);
		log.info("Testing email connection: {}", connectionId);
		jobExecutionService.executeSync(new String[] {
				"system", "test-email",
				"--email-connection-file", connectionFilePath
		});
		log.info("Email connection test completed for: {}", connectionId);
	}

	/**
	 * Test inline SMTP email settings from a report config (settings.xml).
	 * Used when useconn=false — the SMTP settings are in the report's own config,
	 * not in a separate connection file.
	 */
	public void testInlineEmailConnection(String reportId) throws Throwable {
		String settingsPath;
		if ("burst".equals(reportId)) {
			settingsPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/burst/settings.xml";
		} else {
			settingsPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/reports/" + reportId + "/settings.xml";
		}
		log.info("Testing inline email connection from report config: {}", settingsPath);
		jobExecutionService.executeSync(new String[] {
				"system", "test-email",
				"--email-connection-file", settingsPath
		});
		log.info("Inline email connection test completed for report: {}", reportId);
	}

	/**
	 * Test a database connection and fetch its schema.
	 * Goes through DocumentBurster.execute() → CliJob.doTestAndFetchDatabaseSchema()
	 * which handles testing, schema fetch, and saving information-schema.json + table-names.txt.
	 */
	public void testDatabaseConnection(String connectionId) throws Throwable {
		String connectionFilePath = getConnectionFilePath(connectionId);
		log.info("Testing database connection: {}", connectionId);
		jobExecutionService.executeSync(new String[] {
				"system", "test-and-fetch-database-schema",
				"--database-connection-file", connectionFilePath
		});
		log.info("Database connection test and schema fetch completed for: {}", connectionId);
	}

	/**
	 * Test SMS via Twilio by sending a test message.
	 */
	public void testSms(String fromNumber, String toNumber, String configFilePath) throws Exception {
		log.info("Testing SMS: from={}, to={}", fromNumber, toNumber);

		String fullConfigPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ configFilePath.replaceFirst("^/", "");

		CliJob job = new CliJob(fullConfigPath);
		job.doCheckTwilio(fromNumber, toNumber);

		log.info("SMS test completed");
	}

	/**
	 * Delete a connection — removes the folder (for database connections) or
	 * the single XML file (for email connections).
	 */
	public void deleteConnection(String connectionId) throws Exception {
		// Database connections live in a directory: config/connections/{connectionId}/
		File connectionDir = new File(getConnectionsDir() + "/" + connectionId);
		if (connectionDir.exists() && connectionDir.isDirectory()) {
			FileUtils.deleteDirectory(connectionDir);
			log.info("Deleted connection directory: {}", connectionId);
			return;
		}

		// Email connections live as a single file: config/connections/{connectionId}.xml
		File connectionFile = new File(getConnectionsDir() + "/" + connectionId + ".xml");
		if (connectionFile.exists() && connectionFile.isFile()) {
			connectionFile.delete();
			log.info("Deleted connection file: {}", connectionId);
		}
	}

	/**
	 * Read connection metadata file (domain-grouped-schema, er-diagram, ubiquitous-language, information-schema).
	 *
	 * @param connectionId the connection identifier
	 * @param type one of: "domain-grouped-schema", "er-diagram", "ubiquitous-language", "information-schema"
	 * @return the file content, or null if file doesn't exist
	 */
	public String getMetadata(String connectionId, String type) throws Exception {
		String filePath = resolveMetadataPath(connectionId, type);
		File file = new File(filePath);
		if (!file.exists()) {
			return null;
		}
		return Files.readString(file.toPath());
	}

	/**
	 * Save connection metadata file.
	 * If content is empty/null, deletes the file.
	 */
	public void saveMetadata(String connectionId, String type, String content) throws Exception {
		String filePath = resolveMetadataPath(connectionId, type);

		if (StringUtils.isBlank(content)) {
			// Delete the file if content is empty
			File file = new File(filePath);
			if (file.exists()) {
				file.delete();
				log.info("Deleted metadata {}/{}", connectionId, type);
			}
		} else {
			Files.writeString(Path.of(filePath), content);
			log.info("Saved metadata {}/{} ({} chars)", connectionId, type, content.length());
		}
	}

	private String resolveMetadataPath(String connectionId, String type) {
		String baseDir = getConnectionsDir() + "/" + connectionId;
		switch (type) {
		case "domain-grouped-schema":
			return baseDir + "/" + connectionId + "-domain-grouped-schema.json";
		case "er-diagram":
			return baseDir + "/" + connectionId + "-er-diagram.puml";
		case "ubiquitous-language":
			return baseDir + "/" + connectionId + "-ubiquitous-language.md";
		case "information-schema":
			return baseDir + "/" + connectionId + "-information-schema.json";
		case "table-names":
			return baseDir + "/" + connectionId + "-table-names.txt";
		default:
			throw new IllegalArgumentException("Unknown metadata type: " + type);
		}
	}
}
