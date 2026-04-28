package com.flowkraft.queries.services;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Autowired;

import com.flowkraft.connections.ConnectionsService;
import com.flowkraft.queries.ConnectionFactory;
import com.sourcekraft.documentburster.common.db.DatabaseConnectionManager;
import com.sourcekraft.documentburster.common.db.DatabaseHelper;
import com.sourcekraft.documentburster.common.db.DatabaseSchemaFetcher;
import com.sourcekraft.documentburster.common.db.SqlExecutor;
import com.sourcekraft.documentburster.common.db.schema.SchemaInfo;

/**
 * Service for ad-hoc SQL query execution and database schema exploration.
 * Wires existing SqlExecutor and DatabaseSchemaFetcher behind a clean API.
 */
@Service
public class QueriesService {

	private static final Logger log = LoggerFactory.getLogger(QueriesService.class);

	private final DatabaseSchemaFetcher schemaFetcher = new DatabaseSchemaFetcher();

	@Autowired
	private ConnectionsService connectionsService;

	/**
	 * Execute a SQL query against any configured database connection.
	 * When params are provided, ${param} / #{param} placeholders in the SQL are
	 * converted to JDBI :param syntax before binding — injection-safe via bindMap.
	 * Only parameters actually referenced in the SQL are bound, so dashboards may
	 * freely mix filtered widgets and unfiltered context widgets on the same canvas.
	 */
	public List<Map<String, Object>> executeQuery(String connectionId, String sql, Map<String, Object> params)
			throws Exception {

		Map<String, Object> boundParams = null;
		if (params != null && !params.isEmpty()) {
			sql = DatabaseHelper.convertToJdbiParameters(sql);
			boundParams = new java.util.LinkedHashMap<>();
			for (Map.Entry<String, Object> e : params.entrySet()) {
				if (sql.contains(":" + e.getKey())) {
					boundParams.put(e.getKey(), e.getValue());
				}
			}
		}
		DatabaseConnectionManager dbManager = createConnectionManager(connectionId);
		SqlExecutor executor = new SqlExecutor(dbManager);
		return executor.queryOn(connectionId, sql, boundParams);
	}

	/**
	 * Fetch the full database schema for a connection.
	 * Uses the code-based schema fetcher so packaged sample connections
	 * (rbt-sample-northwind-*) work the same as regular on-disk connections.
	 */
	public SchemaInfo getSchema(String connectionId) throws Exception {
		ConnectionFactory.syncPath();
		String xmlPath = connectionsService.prepareConnectionFilePath(connectionId);
		return schemaFetcher.fetchSchema(xmlPath);
	}

	private DatabaseConnectionManager createConnectionManager(String connectionId) throws Exception {
		return ConnectionFactory.newConnectionManager();
	}
}
