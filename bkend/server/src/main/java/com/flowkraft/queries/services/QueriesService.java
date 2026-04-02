package com.flowkraft.queries.services;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.sourcekraft.documentburster.common.db.DatabaseConnectionManager;
import com.sourcekraft.documentburster.common.db.DatabaseSchemaFetcher;
import com.sourcekraft.documentburster.common.db.SqlExecutor;
import com.sourcekraft.documentburster.common.db.schema.SchemaInfo;
import com.sourcekraft.documentburster.common.settings.Settings;

/**
 * Service for ad-hoc SQL query execution and database schema exploration.
 * Wires existing SqlExecutor and DatabaseSchemaFetcher behind a clean API.
 */
@Service
public class QueriesService {

	private static final Logger log = LoggerFactory.getLogger(QueriesService.class);

	private final DatabaseSchemaFetcher schemaFetcher = new DatabaseSchemaFetcher();

	/**
	 * Execute a SQL query against any configured database connection.
	 */
	public List<Map<String, Object>> executeQuery(String connectionId, String sql, Map<String, Object> params)
			throws Exception {

		DatabaseConnectionManager dbManager = createConnectionManager(connectionId);
		SqlExecutor executor = new SqlExecutor(dbManager);
		return executor.queryOn(connectionId, sql, params);
	}

	/**
	 * Fetch the full database schema for a connection.
	 */
	public SchemaInfo getSchema(String connectionId) throws Exception {
		String connectionFilePath = resolveConnectionFilePath(connectionId);
		return schemaFetcher.fetchSchema(connectionFilePath);
	}

	private DatabaseConnectionManager createConnectionManager(String connectionId) throws Exception {
		String configFilePath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/burst/settings.xml";
		Settings settings = new Settings(configFilePath);
		settings.loadSettings();

		return new DatabaseConnectionManager(settings);
	}

	private String resolveConnectionFilePath(String connectionId) {
		return AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/connections/" + connectionId + "/" + connectionId
				+ ".xml";
	}
}
