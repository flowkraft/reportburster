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
import com.sourcekraft.documentburster.common.db.DatabaseConnectionTester;
import com.sourcekraft.documentburster.common.db.DatabaseSchemaFetcher;
import com.sourcekraft.documentburster.common.db.schema.SchemaInfo;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionEmailSettings;
import com.sourcekraft.documentburster.job.CliJob;

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

	private String getConnectionsDir() {
		return AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/connections";
	}

	private String getConnectionFilePath(String connectionId) {
		return getConnectionsDir() + "/" + connectionId + "/" + connectionId + ".xml";
	}

	/**
	 * Test an email connection by sending a test message.
	 */
	public void testEmailConnection(String connectionId) throws Exception {
		String connectionFilePath = getConnectionFilePath(connectionId);
		log.info("Testing email connection: {}", connectionId);

		CliJob job = new CliJob(connectionFilePath);
		job.doCheckEmail();

		log.info("Email connection test completed for: {}", connectionId);
	}

	/**
	 * Test a database connection and fetch its schema.
	 */
	public SchemaInfo testDatabaseConnection(String connectionId) throws Exception {
		String connectionFilePath = getConnectionFilePath(connectionId);
		log.info("Testing database connection: {}", connectionId);

		// Test connection
		DatabaseConnectionTester tester = new DatabaseConnectionTester();
		tester.testConnection(connectionFilePath);
		log.info("Database connection test successful for: {}", connectionId);

		// Fetch and save schema
		DatabaseSchemaFetcher fetcher = new DatabaseSchemaFetcher();
		SchemaInfo schemaInfo = fetcher.fetchSchema(connectionFilePath);

		// Save information-schema.json
		String schemaOutputPath = getConnectionsDir() + "/" + connectionId + "/" + connectionId
				+ "-information-schema.json";
		fetcher.saveSchemaToJson(schemaInfo, schemaOutputPath);

		// Save table-names.txt
		String tableNamesPath = getConnectionsDir() + "/" + connectionId + "/" + connectionId + "-table-names.txt";
		StringBuilder sb = new StringBuilder();
		for (var table : schemaInfo.tables) {
			String type = (table.tableType != null) ? table.tableType.toUpperCase() : "TABLE";
			if ("VIEW".equals(type)) {
				sb.append(table.tableName).append(" (VIEW)").append("\n");
			} else {
				sb.append(table.tableName).append("\n");
			}
		}
		Files.writeString(Path.of(tableNamesPath), sb.toString().trim());

		log.info("Database schema saved for: {}", connectionId);
		return schemaInfo;
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
