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

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster.utils.Utils;

public class Variables {

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

	private Map<String, Object> vars = Collections.synchronizedMap(new HashMap<String, Object>());

	private int numberOfUserVariables;

	public Variables(String documentName, String language, String country, int numberOfUserVariables) {

		vars.put(INPUT_DOCUMENT_NAME, documentName);
		vars.put(INPUT_DOCUMENT_EXTENSION, FilenameUtils.getExtension(documentName));
		vars.put(OUTPUT_TYPE_EXTENSION, FilenameUtils.getExtension(documentName));

		addDateSystemVariables(language, country);

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

			String key = token + ".var" + Integer.toString(i);

			if (value != null) {
				vars.put(key, value);
				if (!Objects.isNull(varAliases))
					for (String varAlias : varAliases) {
						String keyAlias = token + "." + varAlias + Integer.toString(i);
						vars.put(keyAlias, value);
					}
			}

		}

		parseSkipVariable(token, text);

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

		Map<String, Object> userVars = _getBuildInVariables();

		for (int i = 0; i < numberOfUserVariables; i++) {

			String key = token + ".var" + Integer.toString(i);
			String value = (String) vars.get(key);

			if (value == null)
				value = "";

			userVars.put("var" + Integer.toString(i), value);

			if (!Objects.isNull(varAliases))
				for (String alias : varAliases)
					userVars.put(alias + Integer.toString(i), value);

		}

		String key = token + "." + SKIP;
		String value = (String) vars.get(key);

		if (value == null)
			value = "false";

		userVars.put(SKIP, value);

		return userVars;

	}

	private Map<String, Object> _getBuildInVariables() {
		Map<String, Object> userVars = new HashMap<String, Object>();

		userVars.put(INPUT_DOCUMENT_NAME, vars.get(INPUT_DOCUMENT_NAME));
		userVars.put(INPUT_DOCUMENT_EXTENSION, vars.get(INPUT_DOCUMENT_EXTENSION));
		userVars.put(OUTPUT_TYPE_EXTENSION, vars.get(OUTPUT_TYPE_EXTENSION));

		userVars.put(BURST_TOKEN, vars.get(BURST_TOKEN));
		userVars.put(BURST_INDEX, vars.get(BURST_INDEX));

		userVars.put(OUTPUT_FOLDER, vars.get(OUTPUT_FOLDER));
		userVars.put(EXTRACTED_FILE_PATH, vars.get(EXTRACTED_FILE_PATH));
		userVars.put(EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME,
				vars.get(EXTRACTED_FILE_PATHS_AFTER_SPLITTING_2ND_TIME));

		userVars.put(QUARANTINE_FOLDER, vars.get(QUARANTINE_FOLDER));

		// stats variables
		userVars.put(STATS_INFO, vars.get(STATS_INFO));
		userVars.put(NUM_PAGES, vars.get(NUM_PAGES));
		userVars.put(NUM_TOKENS, vars.get(NUM_TOKENS));
		userVars.put(NUM_FILES_EXTRACTED, vars.get(NUM_FILES_EXTRACTED));
		userVars.put(NUM_MESSAGES_SENT, vars.get(NUM_MESSAGES_SENT));
		userVars.put(NUM_FILES_DISTRIBUTED, vars.get(NUM_FILES_DISTRIBUTED));
		userVars.put(NUM_FILES_SKIPPED_DISTRIBUTION, vars.get(NUM_FILES_SKIPPED_DISTRIBUTION));
		userVars.put(NUM_FILES_QUARANTINED, vars.get(NUM_FILES_QUARANTINED));

		userVars.put(NOW, vars.get(NOW));

		userVars.put(NOW_DEFAULT_DATE, vars.get(NOW_DEFAULT_DATE));
		userVars.put(NOW_SHORT_DATE, vars.get(NOW_SHORT_DATE));
		userVars.put(NOW_MEDIUM_DATE, vars.get(NOW_MEDIUM_DATE));
		userVars.put(NOW_LONG_DATE, vars.get(NOW_LONG_DATE));
		userVars.put(NOW_FULL_DATE, vars.get(NOW_FULL_DATE));

		userVars.put(NOW_DEFAULT_TIME, vars.get(NOW_DEFAULT_TIME));
		userVars.put(NOW_SHORT_TIME, vars.get(NOW_SHORT_TIME));
		userVars.put(NOW_MEDIUM_TIME, vars.get(NOW_MEDIUM_TIME));
		userVars.put(NOW_LONG_TIME, vars.get(NOW_LONG_TIME));
		userVars.put(NOW_FULL_TIME, vars.get(NOW_FULL_TIME));

		userVars.put(NOW_QUARTER, vars.get(NOW_QUARTER));
		return userVars;
	}

	public Object set(String key, Object value) {
		return vars.put(key, value);
	}

	public Object get(String key) {
		return vars.get(key);
	}

	public Object setUserVariable(String token, String key, Object value) {
		return vars.put(token + "." + key, value);
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
			vars.put(key, skip);
		}
	}
}
