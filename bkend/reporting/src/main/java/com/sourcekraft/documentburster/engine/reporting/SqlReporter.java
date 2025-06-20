package com.sourcekraft.documentburster.engine.reporting;

import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.model.ReportSettings.DataSource.SQLOptions;
import com.sourcekraft.documentburster.engine.AbstractReporter;

public class SqlReporter extends AbstractReporter {

	private static final Logger log = LoggerFactory.getLogger(SqlReporter.class);

	public SqlReporter(String configFilePath) {
		super(configFilePath);
		log.debug("SqlReporter initialized with config path: {}", configFilePath);
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
		String jdbiQuery = convertToJdbiParameters(sqlQuery);
		List<String> queryParams = findQueryParameters(jdbiQuery);
		log.debug("Converted JDBI query: '{}' with params: {}", jdbiQuery, queryParams);

		try (Handle handle = jdbiInstance.open()) {
			org.jdbi.v3.core.statement.Query query = handle.createQuery(jdbiQuery);

			// Bind parameters from variables
			Map<String, Object> currentVars = ctx.variables.getUserVariables(ctx.token);
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

	/**
	 * Converts template variables to JDBI parameters.
	 */
	private String convertToJdbiParameters(String sql) {
		Pattern pattern = Pattern.compile("[\\$#]\\{([^}]+)\\}|@(\\w+)@");
		Matcher matcher = pattern.matcher(sql);
		StringBuilder sb = new StringBuilder();

		while (matcher.find()) {
			String varName = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
			if (varName != null) {
				matcher.appendReplacement(sb, ":" + varName);
			}
		}
		matcher.appendTail(sb);
		return sb.toString();
	}

	/**
	 * Finds JDBI-style parameters in SQL query.
	 */
	private List<String> findQueryParameters(String sql) {
		Pattern pattern = Pattern.compile("(?<!')(:(\\w+))(?!')");
		Matcher matcher = pattern.matcher(sql);
		List<String> params = new ArrayList<>();

		while (matcher.find()) {
			params.add(matcher.group(2));
		}

		return params.stream().distinct().collect(Collectors.toList());
	}

	protected Jdbi retrieveJdbiInstance(String connectionCode) throws Exception {
		log.debug("Requesting Jdbi instance for connection code: {}", connectionCode);
		Jdbi jdbiInstance = ctx.dbManager.getJdbi(connectionCode);
		if (jdbiInstance == null) {
			log.error("DatabaseConnectionManager returned a null Jdbi instance for code: {}", connectionCode);
			throw new IllegalStateException("Failed to obtain Jdbi instance for connection: " + connectionCode);
		}
		log.debug("Obtained Jdbi instance for code: {}", connectionCode);
		return jdbiInstance;
	}

	@Override
	protected void backupFile() throws Exception {
		// Override backupFile to do nothing for SqlReporter tests,
		// as there's no physical input file to back up.
		log.debug("Skipping backupFile for SqlReporter");
	}

}
