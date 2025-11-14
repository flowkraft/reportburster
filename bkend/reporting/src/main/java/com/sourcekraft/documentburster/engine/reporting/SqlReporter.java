package com.sourcekraft.documentburster.engine.reporting;

import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.db.DatabaseHelper;
import com.sourcekraft.documentburster.common.settings.model.ReportSettings.DataSource.SQLOptions;
import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.variables.Variables;
import com.sourcekraft.documentburster.utils.Utils;

public class SqlReporter extends AbstractReporter {

	private static final Logger log = LoggerFactory.getLogger(SqlReporter.class);

	protected DatabaseHelper dbHelper;

	public SqlReporter(String configFilePath) {
		super(configFilePath);
		dbHelper = new DatabaseHelper(configFilePath);

		log.debug("SqlReporter initialized with config path: {}", configFilePath);
	}

	protected void initializeResources() throws Exception {
		super.initializeResources();
		this.dbHelper.setCtx(ctx);
		ctx.variables.set(Variables.INPUT_DOCUMENT_NAME, Utils.sanitizeFileName(ctx.settings.getTemplateName()));
	}

	@Override
	protected void fetchData() throws Exception {
		     
		log.trace("Entering fetchData...");
		SQLOptions sqlOptions = ctx.settings.getReportDataSource().sqloptions;
		if (sqlOptions == null) {
			log.error("SQLOptions are null.");
			throw new IllegalStateException("SQLOptions cannot be null.");
		}

		String connectionCode = sqlOptions.conncode;
		String sqlQuery = sqlOptions.query;
		
		//System.out.println("========================================");
		//System.out.println("[DEBUG] Original SQL Query:");
		//System.out.println(sqlQuery);
		//System.out.println("========================================");
		
		log.debug("SQL Options: conncode={}, query={}", connectionCode, sqlQuery);

		if (StringUtils.isBlank(connectionCode)) {
			throw new IllegalArgumentException(
					"Database connection code (conncode) cannot be empty for SQL data source.");
		}
		if (StringUtils.isBlank(sqlQuery)) {
			throw new IllegalArgumentException("SQL query (sqlquery) cannot be empty for SQL data source.");
		}

		// Get JDBI instance and execute query
		Jdbi jdbiInstance = this.retrieveJdbiInstance(connectionCode);
		String jdbiQuery = this.dbHelper.convertToJdbiParameters(sqlQuery);
		List<String> queryParams = this.dbHelper.findQueryParameters(jdbiQuery);
		
		//System.out.println("[DEBUG] Converted JDBI Query:");
		//System.out.println(jdbiQuery);
		//System.out.println("[DEBUG] Query Parameters: " + queryParams);
		//System.out.println("========================================");
		
		log.debug("Converted JDBI query: '{}' with params: {}", jdbiQuery, queryParams);

		try (Handle handle = jdbiInstance.open()) {
			org.jdbi.v3.core.statement.Query query = handle.createQuery(jdbiQuery);

			// Bind parameters from variables
			Map<String, Object> currentVars = ctx.variables.getUserVariables(ctx.token);

			// DEBUG: User variables
			//System.out.println("[DEBUG] User Variables (ctx.variables.getUserVariables):");
			//System.out.println(currentVars);
			//System.out.println("========================================");

			if (currentVars != null) {
				for (String paramName : queryParams) {
					if (currentVars.containsKey(paramName)) {
						query.bind(paramName, currentVars.get(paramName));
						log.debug("Bound parameter :{} = '{}'", paramName, currentVars.get(paramName));
					} else {
						log.warn("SQL parameter :{} not found in variables.", paramName);
					}
				}
			}

			// Execute query and store results directly
			// Execute query and map each row preserving column label case
			List<LinkedHashMap<String, Object>> dataRows = query.map((rs, rctx) -> {
				ResultSetMetaData md = rs.getMetaData();
				LinkedHashMap<String, Object> row = new LinkedHashMap<>();
				for (int i = 1; i <= md.getColumnCount(); i++) {
					// Use getColumnLabel for potential aliases, fallback to getColumnName
					String columnName = md.getColumnLabel(i);
					if (StringUtils.isBlank(columnName)) {
						columnName = md.getColumnName(i);
					}
					row.put(columnName, rs.getObject(i));
				}
				return row;
			}).list();

			//System.out.println("========================================");
			//System.out.println("[DEBUG] Query Results:");
			//System.out.println("  Number of rows fetched: " + dataRows.size());

			// Build header row
			LinkedHashMap<String, Object> headerMap = new LinkedHashMap<>();
			if (!dataRows.isEmpty()) {
				for (String col : dataRows.get(0).keySet()) {
					headerMap.put(col, col);
				}
			}
			List<LinkedHashMap<String, Object>> finalRows = new ArrayList<>();
			// Decide whether to include header row based on a setting? For now, assume yes.
			// if (!headerMap.isEmpty())
			// finalRows.add(headerMap);
			finalRows.addAll(dataRows);
			ctx.reportData = finalRows; // reportData now contains only data rows

			// Store header separately if needed, or assume first row of dataRows has keys
			if (!dataRows.isEmpty()) {
				ctx.reportColumnNames = new ArrayList<>(dataRows.get(0).keySet()); // Store column names if needed later
			} else {
				ctx.reportColumnNames = new ArrayList<>();
			}

			log.info("SQL query executed. Fetched {} result rows.", ctx.reportData.size());
		}
		log.trace("Exiting fetchData.");
	}

	protected Jdbi retrieveJdbiInstance(String connectionCode) throws Exception {

		// For other connections, use the default implementation
		return this.dbHelper.retrieveJdbiInstance(connectionCode);
	}

	@Override
	protected void backupFile() throws Exception {
		// Override backupFile to do nothing for SqlReporter tests,
		// as there's no physical input file to back up.
		log.debug("Skipping backupFile for SqlReporter");
	}

}
