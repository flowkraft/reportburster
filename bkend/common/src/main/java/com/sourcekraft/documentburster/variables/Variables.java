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
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap; // Import TreeMap
import java.util.stream.Collectors;

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
	public static final String SKIP = "skip";

	private List<String> varAliases;

	// Store variables as Objects to preserve types
	private Map<String, Object> vars = Collections.synchronizedMap(new HashMap<String, Object>());

	private int numberOfUserVariables;

	public Variables(String documentName, String language, String country, int numberOfUserVariables) {

		vars.put(INPUT_DOCUMENT_NAME, documentName);
		vars.put(INPUT_DOCUMENT_EXTENSION, FilenameUtils.getExtension(documentName));
		vars.put(OUTPUT_TYPE_EXTENSION, FilenameUtils.getExtension(documentName));

		addDateSystemVariables(language, country);

		// numberOfUserVariables might not be relevant anymore if we parse all columns
		// Keep it for now for backward compatibility with text parsing
		this.numberOfUserVariables = numberOfUserVariables;

	}

	private void addDateSystemVariables(String language, String country) {

		Locale locale = null;

		Date now = new Date();

		vars.put(NOW, now);

		if (StringUtils.isNotEmpty(language)) {

			locale = new Locale(language, country);

			vars.put(NOW_DEFAULT_DATE, DateFormat.getDateInstance(DateFormat.DEFAULT, locale).format(now));
			vars.put(NOW_SHORT_DATE, DateFormat.getDateInstance(DateFormat.SHORT, locale).format(now));
			vars.put(NOW_MEDIUM_DATE, DateFormat.getDateInstance(DateFormat.MEDIUM, locale).format(now));
			vars.put(NOW_LONG_DATE, DateFormat.getDateInstance(DateFormat.LONG, locale).format(now));
			vars.put(NOW_FULL_DATE, DateFormat.getDateInstance(DateFormat.FULL, locale).format(now));

			vars.put(NOW_DEFAULT_TIME, DateFormat.getTimeInstance(DateFormat.DEFAULT, locale).format(now));
			vars.put(NOW_SHORT_TIME, DateFormat.getTimeInstance(DateFormat.SHORT, locale).format(now));
			vars.put(NOW_MEDIUM_TIME, DateFormat.getTimeInstance(DateFormat.MEDIUM, locale).format(now));
			vars.put(NOW_LONG_TIME, DateFormat.getTimeInstance(DateFormat.LONG, locale).format(now));
			vars.put(NOW_FULL_TIME, DateFormat.getTimeInstance(DateFormat.FULL, locale).format(now));

		} else {

			vars.put(NOW_DEFAULT_DATE, DateFormat.getDateInstance(DateFormat.DEFAULT).format(now));
			vars.put(NOW_SHORT_DATE, DateFormat.getDateInstance(DateFormat.SHORT).format(now));
			vars.put(NOW_MEDIUM_DATE, DateFormat.getDateInstance(DateFormat.MEDIUM).format(now));
			vars.put(NOW_LONG_DATE, DateFormat.getDateInstance(DateFormat.LONG).format(now));
			vars.put(NOW_FULL_DATE, DateFormat.getDateInstance(DateFormat.FULL).format(now));

			vars.put(NOW_DEFAULT_TIME, DateFormat.getTimeInstance(DateFormat.DEFAULT).format(now));
			vars.put(NOW_SHORT_TIME, DateFormat.getTimeInstance(DateFormat.SHORT).format(now));
			vars.put(NOW_MEDIUM_TIME, DateFormat.getTimeInstance(DateFormat.MEDIUM).format(now));
			vars.put(NOW_LONG_TIME, DateFormat.getTimeInstance(DateFormat.LONG).format(now));
			vars.put(NOW_FULL_TIME, DateFormat.getTimeInstance(DateFormat.FULL).format(now));

		}

		vars.put(NOW_QUARTER, Integer.toString(Utils.getQuarter(now, locale)));

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
				// Use setUserVariable to handle potential alias updates
				setUserVariable(token, "var" + i, value); // Keep storing String for text parsing
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
			for (Map.Entry<String, Object> entry : dataRow.entrySet()) {
				String columnName = entry.getKey();
				Object value = entry.getValue(); // Keep the original Object value

				// Set indexed variable (varX) and its aliases (colX, etc.)
				// Pass the original Object value
				setUserVariable(token, "var" + index, value);

				// Set named variable (using column name)
				// Store the original Object value
				// Avoid overwriting if column name conflicts with 'varX' or alias format
				if (!isIndexedVariableOrAlias(columnName, index)) {
					vars.put(token + "." + columnName, value);
				}

				index++;
			}
			// Update the effective number of user variables based on the map size
			//this.numberOfUserVariables = index;
		}
		// Note: Skip variable is not handled here, assumes it's not present in the map
		// source
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

	/*
	 * public void parseUserVariablesWithAliases(String token, String text,
	 * List<String> varAliases) {
	 * 
	 * for (int i = 0; i < numberOfUserVariables; i++) {
	 * 
	 * String start = "<" + i + ">"; String end = "</" + i + ">"; String value =
	 * StringUtils.substringBetween(text, start, end);
	 * 
	 * String key = token + ".var" + Integer.toString(i);
	 * 
	 * if (value != null) { vars.put(key, value);
	 * 
	 * for (String varAlias : varAliases) { String keyAlias = token + "." + varAlias
	 * + Integer.toString(i); vars.put(keyAlias, value); } } }
	 * 
	 * parseSkipVariable(token, text);
	 * 
	 * }
	 */

	/*
	 * public Map<String, Object> getUserVariablesWithAliases(String token,
	 * List<String> varAliases) {
	 * 
	 * Map<String, Object> userVars = _getBuildInVariables();
	 * 
	 * for (int i = 0; i < numberOfUserVariables; i++) {
	 * 
	 * String key = token + ".var" + Integer.toString(i); String value = (String)
	 * vars.get(key);
	 * 
	 * if (value == null) value = "";
	 * 
	 * userVars.put("var" + Integer.toString(i), value);
	 * 
	 * if (!Objects.isNull(varAliases)) for (String alias : varAliases)
	 * userVars.put(alias + Integer.toString(i), value);
	 * 
	 * }
	 * 
	 * String key = token + "." + SKIP; String value = (String) vars.get(key);
	 * 
	 * if (value == null) value = "false";
	 * 
	 * userVars.put(SKIP, value);
	 * 
	 * return userVars;
	 * 
	 * }
	 */

	public Map<String, Object> getUserVariables(String token) {

		// Use TreeMap with CASE_INSENSITIVE_ORDER for the map passed to Freemarker
		Map<String, Object> userVars = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
		userVars.putAll(_getBuildInVariables()); // Add built-in variables first

		String prefix = token + ".";

		// Collect all variables associated with this token
		Set<String> tokenVarKeys = vars.keySet().stream().filter(k -> k.startsWith(prefix)).collect(Collectors.toSet());

		// Add indexed, alias, skip, and named variables to the result map
		for (String fullKey : tokenVarKeys) {
			String key = fullKey.substring(prefix.length());
			Object value = vars.get(fullKey); // Retrieve the Object value

			userVars.put(key, value); // Put the Object value into the map for Freemarker
		}

		// Ensure standard variables like 'skip' have default values if not present
		if (!userVars.containsKey(SKIP)) {
			userVars.put(SKIP, "false"); // Keep skip as String "false"
		}

		// Ensure indexed variables (varX and aliases) exist up to
		// numberOfUserVariables,
		// even if they were null/not set, defaulting to empty string for backward
		// compatibility.
		for (int i = 0; i < numberOfUserVariables; i++) {
			String varKey = "var" + i;
			if (!userVars.containsKey(varKey)) {
				userVars.put(varKey, StringUtils.EMPTY); // Default to empty string
			}
			if (varAliases != null) {
				for (String alias : varAliases) {
					String aliasKey = alias + i;
					if (!userVars.containsKey(aliasKey)) {
						userVars.put(aliasKey, StringUtils.EMPTY); // Default to empty string
					}
				}
			}
		}

		// Add global variables (no token prefix) to support crosstabData and similar
		for (String fullKey : vars.keySet()) {
			if (!fullKey.contains(".") && !userVars.containsKey(fullKey)) {
				userVars.put(fullKey, vars.get(fullKey));
			}
		}

		log.info("Variables map for token '{}' before returning: {}", token, userVars);

		return userVars;

	}

	private Map<String, Object> _getBuildInVariables() {
		// This map can remain a standard HashMap as it's just for internal collection
		Map<String, Object> builtInVars = new HashMap<String, Object>();

		// Retrieve Objects from the main 'vars' map
		builtInVars.put(INPUT_DOCUMENT_NAME, vars.get(INPUT_DOCUMENT_NAME));
		builtInVars.put(INPUT_DOCUMENT_EXTENSION, vars.get(INPUT_DOCUMENT_EXTENSION));
		builtInVars.put(OUTPUT_TYPE_EXTENSION, vars.get(OUTPUT_TYPE_EXTENSION));

		builtInVars.put(BURST_TOKEN, vars.get(BURST_TOKEN));
		builtInVars.put(BURST_INDEX, vars.get(BURST_INDEX));

		builtInVars.put(OUTPUT_FOLDER, vars.get(OUTPUT_FOLDER));
		builtInVars.put(EXTRACTED_FILE_PATH, vars.get(EXTRACTED_FILE_PATH));
		builtInVars.put(EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME,
				vars.get(EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME));

		builtInVars.put(QUARANTINE_FOLDER, vars.get(QUARANTINE_FOLDER));

		// stats variables
		builtInVars.put(STATS_INFO, vars.get(STATS_INFO));
		builtInVars.put(NUM_PAGES, vars.get(NUM_PAGES));
		builtInVars.put(NUM_TOKENS, vars.get(NUM_TOKENS));
		builtInVars.put(NUM_FILES_EXTRACTED, vars.get(NUM_FILES_EXTRACTED));
		builtInVars.put(NUM_MESSAGES_SENT, vars.get(NUM_MESSAGES_SENT));
		builtInVars.put(NUM_FILES_DISTRIBUTED, vars.get(NUM_FILES_DISTRIBUTED));
		builtInVars.put(NUM_FILES_SKIPPED_DISTRIBUTION, vars.get(NUM_FILES_SKIPPED_DISTRIBUTION));
		builtInVars.put(NUM_FILES_QUARANTINED, vars.get(NUM_FILES_QUARANTINED));

		// Date/Time variables - NOW is stored as Date, others as String
		builtInVars.put(NOW, vars.get(NOW));
		builtInVars.put(NOW_DEFAULT_DATE, vars.get(NOW_DEFAULT_DATE));
		builtInVars.put(NOW_SHORT_DATE, vars.get(NOW_SHORT_DATE));
		builtInVars.put(NOW_MEDIUM_DATE, vars.get(NOW_MEDIUM_DATE));
		builtInVars.put(NOW_LONG_DATE, vars.get(NOW_LONG_DATE));
		builtInVars.put(NOW_FULL_DATE, vars.get(NOW_FULL_DATE));

		builtInVars.put(NOW_DEFAULT_TIME, vars.get(NOW_DEFAULT_TIME));
		builtInVars.put(NOW_SHORT_TIME, vars.get(NOW_SHORT_TIME));
		builtInVars.put(NOW_MEDIUM_TIME, vars.get(NOW_MEDIUM_TIME));
		builtInVars.put(NOW_LONG_TIME, vars.get(NOW_LONG_TIME));
		builtInVars.put(NOW_FULL_TIME, vars.get(NOW_FULL_TIME));

		builtInVars.put(NOW_QUARTER, vars.get(NOW_QUARTER));
		return builtInVars; // Return the standard HashMap
	}

	public Object set(String key, Object value) {
		return vars.put(key, value); // Accepts Object
	}

	public Object get(String key) {
		return vars.get(key); // Returns Object
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
		// Original put operation - always update the specified key with the Object
		// value
		Object previousValue = vars.put(token + "." + key, value);

		// Synchronization logic remains the same, but operates on the Object value
		if (!Objects.isNull(varAliases)) {
			// Handle setting varX -> update aliases
			if (key.startsWith("var") && key.length() > 3) {
				try {
					int index = Integer.parseInt(key.substring(3));
					// Update all aliases for this index with the Object value
					for (String alias : varAliases) {
						String aliasKey = alias + index;
						vars.put(token + "." + aliasKey, value);
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
							// Extract the index from the alias
							int index = Integer.parseInt(key.substring(alias.length()));
							// Update the base variable with the Object value
							String varKey = "var" + index;
							vars.put(token + "." + varKey, value);

							// Also update other aliases for the same index with the Object value
							for (String otherAlias : varAliases) {
								if (!otherAlias.equals(alias)) {
									String otherAliasKey = otherAlias + index;
									vars.put(token + "." + otherAliasKey, value);
								}
							}
							break; // Found the matching alias, no need to check others
						} catch (NumberFormatException e) {
							// Not a numeric index, ignore synchronization
						}
					}
				}
			}
		} else {
			// Handle case where varAliases is null but key might be varX
			if (key.startsWith("var") && key.length() > 3) {
				// No aliases to update, just the base varX was updated above.
				try {
					Integer.parseInt(key.substring(3)); // Check if it's varX format
				} catch (NumberFormatException e) {
					// Not varX format
				}
			}
		}

		return previousValue;
	}

	public String toString() {
		return vars.toString();
	}

	private void parseSkipVariable(String token, String text) {

		String skip = StringUtils.substringBetween(text, SKIP_START_SHORT, SKIP_END_SHORT);

		if (StringUtils.isEmpty(skip))
			skip = StringUtils.substringBetween(text, SKIP_START_LONG, SKIP_END_LONG);

		if (StringUtils.isNotEmpty(skip)) {
			String key = token + "." + SKIP;
			vars.put(key, skip); // Store skip as String
		}
	}
}
