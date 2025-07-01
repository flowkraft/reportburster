package com.sourcekraft.documentburster.common.db;

import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.context.BurstingContext;

public class DatabaseHelper {

	private static final Logger log = LoggerFactory.getLogger(DatabaseHelper.class);

	private String configurationFilePath;
	private BurstingContext ctx;

	public DatabaseHelper(String configFilePath) {
		this.configurationFilePath = configFilePath;
		log.debug("SqlReporter initialized with config path: {}", configFilePath);
	}

	public SqlQueryResult doExecSqlQuery(String sqlQuery, Map<String, String> parameters) throws Exception {
		SqlQueryResult result = new SqlQueryResult();
		long startTime = System.currentTimeMillis();

		// Validate inputs
		if (StringUtils.isBlank(sqlQuery)) {
			throw new IllegalArgumentException("SQL query cannot be blank");
		}

		if (Objects.isNull(ctx)) {
			ctx = new BurstingContext();
			ctx.configurationFilePath = configurationFilePath;
			ctx.settings = new Settings(configurationFilePath);
			ctx.settings.loadSettings();
			ctx.dbManager = new DatabaseConnectionManager(ctx.settings);
		}

		String dbConnectionCode = ctx.settings.getPrimaryDatabaseConnectionCode();

		// Convert query to use JDBI parameters
		String jdbiQuery = convertToJdbiParameters(sqlQuery);
		List<String> paramNames = findQueryParameters(jdbiQuery);

		// Create and execute query through DatabaseConnectionManager
		try (Handle handle = ctx.dbManager.getJdbi(dbConnectionCode).open()) {
			Query query = handle.createQuery(jdbiQuery).setQueryTimeout(30) // 30 second timeout
					.setMaxRows(100); // Limit to 100 rows for preview

			// Bind parameters
			for (String param : paramNames) {
				if (parameters.containsKey(param)) {
					query.bind(param, parameters.get(param));
				}
			}

			// Execute query with streaming
			result.reportData = query.map((rs, ctx) -> {
				ResultSetMetaData meta = rs.getMetaData();
				LinkedHashMap<String, Object> row = new LinkedHashMap<>();
				for (int i = 1; i <= meta.getColumnCount(); i++) {
					row.put(meta.getColumnLabel(i), rs.getObject(i));
				}
				return row;
			}).stream().collect(Collectors.toList());

			// Set result metadata
			if (!result.reportData.isEmpty()) {
				result.reportColumnNames = new ArrayList<>(result.reportData.get(0).keySet());
			}
			result.isPreview = true;
			result.executionTimeMillis = System.currentTimeMillis() - startTime;
		}

		return result;
	}

	public List<String> findQueryParameters(String sql) {
		Pattern pattern = Pattern.compile("(?<!')(:(\\w+))(?!')");
		Matcher matcher = pattern.matcher(sql);
		List<String> params = new ArrayList<>();

		while (matcher.find()) {
			params.add(matcher.group(2));
		}

		return params.stream().distinct().collect(Collectors.toList());
	}

	public String convertToJdbiParameters(String sql) {
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

	public Jdbi retrieveJdbiInstance(String connectionCode) throws Exception {
		return ctx.dbManager.getJdbi(connectionCode);
	}
}
