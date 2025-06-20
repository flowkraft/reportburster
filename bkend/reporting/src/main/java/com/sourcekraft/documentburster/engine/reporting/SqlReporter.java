package com.sourcekraft.documentburster.engine.reporting;

import java.util.ArrayList;
import java.util.Arrays;
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
import com.sourcekraft.documentburster.utils.CsvUtils;

public class SqlReporter extends AbstractReporter {

	private static final Logger log = LoggerFactory.getLogger(SqlReporter.class);

	public SqlReporter(String configFilePath) {
		super(configFilePath);
		log.debug("SqlReporter initialized with config path: {}", configFilePath);
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
	protected void initializeResources() throws Exception {
		log.trace("Entering initializeResources...");
		ctx.burstTokens = new ArrayList<>();
		ctx.variables.setVarAliases(Arrays.asList("col"));
		log.trace("Exiting initializeResources.");
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
			// Execute query and get List<Map<String, Object>>
            List<Map<String, Object>> queryResult = query.mapToMap().list();

            // --- Convert to List<LinkedHashMap<String, Object>> ---
            ctx.sourceData = queryResult.stream()
                                        .map(LinkedHashMap::new) // Convert each Map to a LinkedHashMap
                                        .collect(Collectors.toList());
            
			log.info("SQL query executed. Fetched {} result rows.", ctx.sourceData.size());
		}
		log.trace("Exiting fetchData.");
	}

	@Override
	public void parseBurstingMetaData() throws Exception {
		log.trace("Entering parseBurstingMetaData...");

		if (ctx.sourceData == null || ctx.sourceData.isEmpty()) {
			log.warn("No data available (sourceData is null or empty).");
			ctx.burstTokens = new ArrayList<>();
			return;
		}

		// Get idcolumn configuration
		String configuredIdColumn = ctx.settings.getReportDataSource().sqloptions.idcolumn;
		if (StringUtils.isEmpty(configuredIdColumn)) {
			throw new IllegalArgumentException(
					"idcolumn setting must be configured - use 'notused' for sequential numbering");
		}

		// Process data rows
		ctx.burstTokens.clear();
		int lineIndex = 0;
		for (Map<String, Object> row : ctx.sourceData) {
			// Generate token based on configuration
			String token;
			if (configuredIdColumn.equalsIgnoreCase(CsvUtils.NOT_USED)) {
				token = String.valueOf(lineIndex);
			} else {
				Object idValue = row.get(configuredIdColumn);
				token = idValue != null ? String.valueOf(idValue) : String.valueOf(lineIndex);
			}

			// Generate variables XML
			StringBuilder varsXml = new StringBuilder();
			int colIndex = 0;
			for (Map.Entry<String, Object> entry : row.entrySet()) {
				String value = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
				varsXml.append("<").append(colIndex).append(">")
					  .append(value)
					  .append("</").append(colIndex).append(">");
				colIndex++;
			}

			ctx.variables.parseUserVariables(token, varsXml.toString());
			ctx.burstTokens.add(token);
			lineIndex++;
		}

		log.info("Generated {} tokens from {} data rows", ctx.burstTokens.size(), ctx.sourceData.size());
		log.trace("Exiting parseBurstingMetaData.");
	}

	/**
	 * Converts template variables to JDBI parameters.
	 */
	private String convertToJdbiParameters(String sql) {
		Pattern pattern = Pattern.compile("[\\$#]\\{([^}]+)\\}|@(\\w+)@");
		Matcher matcher = pattern.matcher(sql);
		StringBuffer sb = new StringBuffer();

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

	@Override
	protected void closeResources() throws Exception {
		// Resource cleanup handled by DatabaseConnectionManager and try-with-resources
		log.trace("closeResources - no explicit cleanup needed");
	}

	@Override
	protected void backupFile() throws Exception {
		// Override backupFile to do nothing for SqlReporter tests,
		// as there's no physical input file to back up.
		log.debug("Skipping backupFile for SqlReporter");
	}

}
