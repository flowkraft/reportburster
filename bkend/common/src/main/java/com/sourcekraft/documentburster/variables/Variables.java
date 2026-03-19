/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.variables;

import java.text.DateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.utils.Utils;

public class Variables {

	private static final Logger log = LoggerFactory.getLogger(Variables.class);

	private static final String SKIP_END_SHORT = "</s>";
	private static final String SKIP_START_SHORT = "<s>";

	private static final String SKIP_END_LONG = "</skip>";
	private static final String SKIP_START_LONG = "<skip>";

	public static final String INPUT_DOCUMENT_NAME = "input_document_name";
	public static final String INPUT_DOCUMENT_EXTENSION = "input_document_extension";
	public static final String OUTPUT_TYPE_EXTENSION = "output_type_extension";

	public static final String BURST_TOKEN = "burst_token";
	public static final String BURST_INDEX = "burst_index";

	public static final String OUTPUT_FOLDER = "output_folder";
	public static final String EXTRACTED_FILE_PATH = "extracted_file_path";
	public static final String EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME = "extracted_file_paths_after_splitting_2nd_time";

	public static final String QUARANTINE_FOLDER = "quarantine_folder";

	// stats variables
	public static final String STATS_INFO_TEMPLATE = "${num_pages}pages-${num_files_extracted}extracted-${num_files_distributed}distributed";
	public static final String STATS_INFO = "stats_info";
	public static final String NUM_PAGES = "num_pages";
	public static final String NUM_TOKENS = "num_tokens";
	public static final String NUM_FILES_EXTRACTED = "num_files_extracted";
	public static final String NUM_MESSAGES_SENT = "num_messages_sent";
	public static final String NUM_FILES_DISTRIBUTED = "num_files_distributed";
	public static final String NUM_FILES_SKIPPED_DISTRIBUTION = "num_files_skipped_distribution";
	public static final String NUM_FILES_QUARANTINED = "num_files_quarantined";

	public static final String NOW = "now";
	public static final String NOW_DEFAULT_DATE = "now_default_date";
	public static final String NOW_SHORT_DATE = "now_short_date";
	public static final String NOW_MEDIUM_DATE = "now_medium_date";
	public static final String NOW_LONG_DATE = "now_long_date";
	public static final String NOW_FULL_DATE = "now_full_date";

	public static final String NOW_DEFAULT_TIME = "now_default_time";
	public static final String NOW_SHORT_TIME = "now_short_time";
	public static final String NOW_MEDIUM_TIME = "now_medium_time";
	public static final String NOW_LONG_TIME = "now_long_time";
	public static final String NOW_FULL_TIME = "now_full_time";

	public static final String NOW_QUARTER = "now_quarter";
	public static final String DASHBOARD_URL = "dashboard_url";
	public static final String SKIP = "skip";

	private List<String> varAliases;

	// Global variables (no token prefix): system vars, dates, reportData, etc.
	private Map<String, Object> globalVars = new HashMap<>();

	// Per-token variables: token -> {key -> value}
	private Map<String, Map<String, Object>> tokenVars = new HashMap<>();

	private int numberOfUserVariables;

	public Variables(String documentName, String language, String country, int numberOfUserVariables) {

		globalVars.put(INPUT_DOCUMENT_NAME, documentName);
		globalVars.put(INPUT_DOCUMENT_EXTENSION, FilenameUtils.getExtension(documentName));
		globalVars.put(OUTPUT_TYPE_EXTENSION, FilenameUtils.getExtension(documentName));

		addDateSystemVariables(language, country);

		// numberOfUserVariables might not be relevant anymore if we parse all columns
		// Keep it for now for backward compatibility with text parsing
		this.numberOfUserVariables = numberOfUserVariables;

	}

	private void addDateSystemVariables(String language, String country) {

		Locale locale = null;

		Date now = new Date();

		globalVars.put(NOW, now);

		if (StringUtils.isNotEmpty(language)) {

			locale = new Locale(language, country);

			globalVars.put(NOW_DEFAULT_DATE, DateFormat.getDateInstance(DateFormat.DEFAULT, locale).format(now));
			globalVars.put(NOW_SHORT_DATE, DateFormat.getDateInstance(DateFormat.SHORT, locale).format(now));
			globalVars.put(NOW_MEDIUM_DATE, DateFormat.getDateInstance(DateFormat.MEDIUM, locale).format(now));
			globalVars.put(NOW_LONG_DATE, DateFormat.getDateInstance(DateFormat.LONG, locale).format(now));
			globalVars.put(NOW_FULL_DATE, DateFormat.getDateInstance(DateFormat.FULL, locale).format(now));

			globalVars.put(NOW_DEFAULT_TIME, DateFormat.getTimeInstance(DateFormat.DEFAULT, locale).format(now));
			globalVars.put(NOW_SHORT_TIME, DateFormat.getTimeInstance(DateFormat.SHORT, locale).format(now));
			globalVars.put(NOW_MEDIUM_TIME, DateFormat.getTimeInstance(DateFormat.MEDIUM, locale).format(now));
			globalVars.put(NOW_LONG_TIME, DateFormat.getTimeInstance(DateFormat.LONG, locale).format(now));
			globalVars.put(NOW_FULL_TIME, DateFormat.getTimeInstance(DateFormat.FULL, locale).format(now));

		} else {

			globalVars.put(NOW_DEFAULT_DATE, DateFormat.getDateInstance(DateFormat.DEFAULT).format(now));
			globalVars.put(NOW_SHORT_DATE, DateFormat.getDateInstance(DateFormat.SHORT).format(now));
			globalVars.put(NOW_MEDIUM_DATE, DateFormat.getDateInstance(DateFormat.MEDIUM).format(now));
			globalVars.put(NOW_LONG_DATE, DateFormat.getDateInstance(DateFormat.LONG).format(now));
			globalVars.put(NOW_FULL_DATE, DateFormat.getDateInstance(DateFormat.FULL).format(now));

			globalVars.put(NOW_DEFAULT_TIME, DateFormat.getTimeInstance(DateFormat.DEFAULT).format(now));
			globalVars.put(NOW_SHORT_TIME, DateFormat.getTimeInstance(DateFormat.SHORT).format(now));
			globalVars.put(NOW_MEDIUM_TIME, DateFormat.getTimeInstance(DateFormat.MEDIUM).format(now));
			globalVars.put(NOW_LONG_TIME, DateFormat.getTimeInstance(DateFormat.LONG).format(now));
			globalVars.put(NOW_FULL_TIME, DateFormat.getTimeInstance(DateFormat.FULL).format(now));

		}

		globalVars.put(NOW_QUARTER, Integer.toString(Utils.getQuarter(now, locale)));

	}

	public void setVarAliases(List<String> varAliases) {
		this.varAliases = varAliases;
	}

	public void setNumberOfUserVariables(int numberOfUserVariables) {
		this.numberOfUserVariables = numberOfUserVariables;
	}

	public void parseUserVariables(String token, String text) {

		for (int i = 0; i < numberOfUserVariables; i++) {

			String start = "<" + i + ">";
			String end = "</" + i + ">";
			String value = StringUtils.substringBetween(text, start, end);

			if (value != null) {
				setUserVariable(token, "var" + i, value);
			}

		}

		parseSkipVariable(token, text);

	}

	/**
	 * Parses user variables from a map where keys are column names and values are
	 * cell values. Assumes the map iteration order corresponds to the desired
	 * column index for varX/colX. Preserves the original Object type of values.
	 *
	 * @param token   The burst token.
	 * @param dataRow A map (preferably ordered like LinkedHashMap) of column names
	 *                to values.
	 */
	public void parseUserVariablesFromMap(String token, Map<String, Object> dataRow) {
		int index = 0;
		if (dataRow != null) {
			Map<String, Object> tokenMap = tokenVars.computeIfAbsent(token, k -> new LinkedHashMap<>());
			for (Map.Entry<String, Object> entry : dataRow.entrySet()) {
				String columnName = entry.getKey();
				Object value = entry.getValue();

				// Set indexed variable (varX) and its aliases (colX, etc.)
				setUserVariable(token, "var" + index, value);

				// Set named variable (using column name)
				if (!isIndexedVariableOrAlias(columnName, index)) {
					tokenMap.put(columnName, value);
				}

				index++;
			}
		}
	}

	/**
	 * Checks if a given key matches the pattern of an indexed variable or its alias
	 * for a specific index.
	 */
	private boolean isIndexedVariableOrAlias(String key, int index) {
		if (key.equals("var" + index)) {
			return true;
		}
		if (varAliases != null) {
			for (String alias : varAliases) {
				if (key.equals(alias + index)) {
					return true;
				}
			}
		}
		return false;
	}

	public Map<String, Object> getUserVariables(String token) {

		// Use TreeMap with CASE_INSENSITIVE_ORDER for the map passed to Freemarker
		Map<String, Object> userVars = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
		userVars.putAll(_getBuildInVariables());

		// O(1) lookup: get all variables for this token directly
		Map<String, Object> tokenMap = tokenVars.get(token);
		if (tokenMap != null) {
			userVars.putAll(tokenMap);
		}

		// Ensure standard variables like 'skip' have default values if not present
		if (!userVars.containsKey(SKIP)) {
			userVars.put(SKIP, "false");
		}

		// Ensure indexed variables (varX and aliases) exist up to
		// numberOfUserVariables, defaulting to empty string.
		for (int i = 0; i < numberOfUserVariables; i++) {
			String varKey = "var" + i;
			if (!userVars.containsKey(varKey)) {
				userVars.put(varKey, StringUtils.EMPTY);
			}
			if (varAliases != null) {
				for (String alias : varAliases) {
					String aliasKey = alias + i;
					if (!userVars.containsKey(aliasKey)) {
						userVars.put(aliasKey, StringUtils.EMPTY);
					}
				}
			}
		}

		// Add global variables (reportData, crosstabData, etc.)
		for (Map.Entry<String, Object> entry : globalVars.entrySet()) {
			if (!userVars.containsKey(entry.getKey())) {
				userVars.put(entry.getKey(), entry.getValue());
			}
		}

		log.debug("Variables map for token '{}' before returning: {}", token, userVars);

		return userVars;

	}

	private Map<String, Object> _getBuildInVariables() {
		Map<String, Object> builtInVars = new HashMap<String, Object>();

		builtInVars.put(INPUT_DOCUMENT_NAME, globalVars.get(INPUT_DOCUMENT_NAME));
		builtInVars.put(INPUT_DOCUMENT_EXTENSION, globalVars.get(INPUT_DOCUMENT_EXTENSION));
		builtInVars.put(OUTPUT_TYPE_EXTENSION, globalVars.get(OUTPUT_TYPE_EXTENSION));

		builtInVars.put(BURST_TOKEN, globalVars.get(BURST_TOKEN));
		builtInVars.put(BURST_INDEX, globalVars.get(BURST_INDEX));

		builtInVars.put(OUTPUT_FOLDER, globalVars.get(OUTPUT_FOLDER));
		builtInVars.put(EXTRACTED_FILE_PATH, globalVars.get(EXTRACTED_FILE_PATH));
		builtInVars.put(EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME,
				globalVars.get(EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME));

		builtInVars.put(QUARANTINE_FOLDER, globalVars.get(QUARANTINE_FOLDER));

		// stats variables
		builtInVars.put(STATS_INFO, globalVars.get(STATS_INFO));
		builtInVars.put(NUM_PAGES, globalVars.get(NUM_PAGES));
		builtInVars.put(NUM_TOKENS, globalVars.get(NUM_TOKENS));
		builtInVars.put(NUM_FILES_EXTRACTED, globalVars.get(NUM_FILES_EXTRACTED));
		builtInVars.put(NUM_MESSAGES_SENT, globalVars.get(NUM_MESSAGES_SENT));
		builtInVars.put(NUM_FILES_DISTRIBUTED, globalVars.get(NUM_FILES_DISTRIBUTED));
		builtInVars.put(NUM_FILES_SKIPPED_DISTRIBUTION, globalVars.get(NUM_FILES_SKIPPED_DISTRIBUTION));
		builtInVars.put(NUM_FILES_QUARANTINED, globalVars.get(NUM_FILES_QUARANTINED));

		// Date/Time variables
		builtInVars.put(NOW, globalVars.get(NOW));
		builtInVars.put(NOW_DEFAULT_DATE, globalVars.get(NOW_DEFAULT_DATE));
		builtInVars.put(NOW_SHORT_DATE, globalVars.get(NOW_SHORT_DATE));
		builtInVars.put(NOW_MEDIUM_DATE, globalVars.get(NOW_MEDIUM_DATE));
		builtInVars.put(NOW_LONG_DATE, globalVars.get(NOW_LONG_DATE));
		builtInVars.put(NOW_FULL_DATE, globalVars.get(NOW_FULL_DATE));

		builtInVars.put(NOW_DEFAULT_TIME, globalVars.get(NOW_DEFAULT_TIME));
		builtInVars.put(NOW_SHORT_TIME, globalVars.get(NOW_SHORT_TIME));
		builtInVars.put(NOW_MEDIUM_TIME, globalVars.get(NOW_MEDIUM_TIME));
		builtInVars.put(NOW_LONG_TIME, globalVars.get(NOW_LONG_TIME));
		builtInVars.put(NOW_FULL_TIME, globalVars.get(NOW_FULL_TIME));

		builtInVars.put(NOW_QUARTER, globalVars.get(NOW_QUARTER));

		builtInVars.put(DASHBOARD_URL, globalVars.get(DASHBOARD_URL));

		return builtInVars;
	}

	public Object set(String key, Object value) {
		return globalVars.put(key, value);
	}

	public Object get(String key) {
		return globalVars.get(key);
	}

	/**
	 * Sets a user variable for a specific token, handling aliases. Accepts Object
	 * values.
	 *
	 * @param token The burst token.
	 * @param key   The base variable key (e.g., "var0", "col0").
	 * @param value The variable value (as an Object).
	 * @return The previous value associated with the key, or null.
	 */
	public Object setUserVariable(String token, String key, Object value) {
		Map<String, Object> tokenMap = tokenVars.computeIfAbsent(token, k -> new LinkedHashMap<>());

		Object previousValue = tokenMap.put(key, value);

		if (!Objects.isNull(varAliases)) {
			// Handle setting varX -> update aliases
			if (key.startsWith("var") && key.length() > 3) {
				try {
					int index = Integer.parseInt(key.substring(3));
					for (String alias : varAliases) {
						tokenMap.put(alias + index, value);
					}
				} catch (NumberFormatException e) {
					// Not a numeric index, ignore synchronization
				}
			}
			// Handle setting aliasX -> update varX and other aliases
			else {
				for (String alias : varAliases) {
					if (key.startsWith(alias) && key.length() > alias.length()) {
						try {
							int index = Integer.parseInt(key.substring(alias.length()));
							tokenMap.put("var" + index, value);

							for (String otherAlias : varAliases) {
								if (!otherAlias.equals(alias)) {
									tokenMap.put(otherAlias + index, value);
								}
							}
							break;
						} catch (NumberFormatException e) {
							// Not a numeric index, ignore synchronization
						}
					}
				}
			}
		}

		return previousValue;
	}

	public String toString() {
		return "globalVars=" + globalVars.toString() + ", tokenVars.size=" + tokenVars.size();
	}

	private void parseSkipVariable(String token, String text) {

		String skip = StringUtils.substringBetween(text, SKIP_START_SHORT, SKIP_END_SHORT);

		if (StringUtils.isEmpty(skip))
			skip = StringUtils.substringBetween(text, SKIP_START_LONG, SKIP_END_LONG);

		if (StringUtils.isNotEmpty(skip)) {
			tokenVars.computeIfAbsent(token, k -> new LinkedHashMap<>()).put(SKIP, skip);
		}
	}
}
