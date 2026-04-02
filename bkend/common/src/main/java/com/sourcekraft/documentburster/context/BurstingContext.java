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
package com.sourcekraft.documentburster.context;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.sourcekraft.documentburster.common.db.DatabaseConnectionManager;
import com.sourcekraft.documentburster.common.db.SqlExecutor;
import com.sourcekraft.documentburster.common.security.SecretsCipher;
import com.sourcekraft.documentburster.common.settings.EmailConnection;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.ServerDatabaseSettings;
import com.sourcekraft.documentburster.utils.DumpToString;
import com.sourcekraft.documentburster.utils.Scripts;
import com.sourcekraft.documentburster.variables.Variables;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import groovy.sql.Sql;

/*
 * 
 * 1. All the fields should be public - this is required to have more convenient access to the field values
 * from within the scripts.
 * 
 * 2. Although public, all the fields should have getter/setters. Otherwise   
 * BeanUtils.copyProperties(copyContext, context) will not work properly
 *
 */

public class BurstingContext extends DumpToString {

	private static final Logger log = LoggerFactory.getLogger(BurstingContext.class);

	/**
	 * 
	 */
	private static final long serialVersionUID = 5135088795114181963L;

	public List<String> burstTokens;

	public List<LinkedHashMap<String, Object>> reportData;
	public List<String> reportColumnNames;

	public String configurationFilePath;

	public String inputDocumentFilePath;

	public DatabaseConnectionManager dbManager;
	public SqlExecutor sql;

	public Settings settings;
	public EmailConnection emailConnection;

	public Variables variables;
	public Scripts scripts;

	public int currentPageIndex;
	public String currentPageText;
	public String[] currentPageTokens;
	public String previousPageText;

	public String outputFolder;
	public String backupFolder;
	public String quarantineFolder;

	public String tempFolder = "temp";

	public String logsFolder;
	public String logsArchivesFolder;

	public String token;

	public String extractedFilePath;

	public Map<String, String> extractedFilePaths = new HashMap<String, String>();;
	public Map<String, String> extractedFilePathsAfterSplitting2ndTime = new HashMap<String, String>();;

	public int numberOfPages = -1;

	public int numberOfExtractedFiles = 0;
	public int numberOfDistributedFiles = 0;
	public int numberOfMessagesSent = 0;

	public int numberOfSkippedFiles = 0;
	public int numberOfQuarantinedFiles = 0;

	public boolean skipCurrentFileDistribution = false;

	public List<String> attachments = new ArrayList<String>();
	public String archiveFilePath;

	public Exception lastException;

	public Object additionalInformation;

	public boolean isQARunningMode = false;
	public String testName;

	// Transient Groovy Sql instance provided to scripts when conncode is specified
	public transient Sql dbSql;

	// Cache for extra Sql connections opened via getConnection()
	public transient Map<String, Sql> namedDbSql;

	/*
	 * public List<String> getBurstTokens() { return burstTokens; }
	 * 
	 * public void setBurstTokens(List<String> burstTokens) { this.burstTokens =
	 * burstTokens; }
	 * 
	 * public String getConfigurationFilePath() { return configurationFilePath; }
	 * 
	 * public void setConfigurationFilePath(String configurationFilePath) {
	 * this.configurationFilePath = configurationFilePath; }
	 * 
	 * public String getInputDocumentFilePath() { return inputDocumentFilePath; }
	 * 
	 * public void setInputDocumentFilePath(String inputDocumentFilePath) {
	 * this.inputDocumentFilePath = inputDocumentFilePath; }
	 * 
	 * public int getNumberOfPages() { return numberOfPages; }
	 * 
	 * public void setNumberOfPages(int numberOfPages) { this.numberOfPages =
	 * numberOfPages; }
	 * 
	 * public Settings getSettings() { return settings; }
	 * 
	 * public void setSettings(Settings settings) { this.settings = settings; }
	 * 
	 * public Variables getVariables() { return variables; }
	 * 
	 * public void setVariables(Variables variables) { this.variables = variables; }
	 * 
	 * public Scripts getScripts() { return scripts; }
	 * 
	 * public void setScripts(Scripts scripts) { this.scripts = scripts; }
	 * 
	 * public int getCurrentPageIndex() { return currentPageIndex; }
	 * 
	 * public void setCurrentPageIndex(int currentPageIndex) { this.currentPageIndex
	 * = currentPageIndex; }
	 * 
	 * public String getCurrentPageText() { return currentPageText; }
	 * 
	 * public void setCurrentPageText(String currentPageText) { this.currentPageText
	 * = currentPageText; }
	 * 
	 * public String getPreviousPageText() { return previousPageText; }
	 * 
	 * public void setPreviousPageText(String previousPageText) {
	 * this.previousPageText = previousPageText; }
	 * 
	 * public String getOutputFolder() { return outputFolder; }
	 * 
	 * public void setOutputFolder(String outputFolder) { this.outputFolder =
	 * outputFolder; }
	 * 
	 * public String getBackupFolder() { return backupFolder; }
	 * 
	 * public void setBackupFolder(String backupFolder) { this.backupFolder =
	 * backupFolder; }
	 * 
	 * public String getQuarantineFolder() { return quarantineFolder; }
	 * 
	 * public void setQuarantineFolder(String quarantineFolder) {
	 * this.quarantineFolder = quarantineFolder; }
	 * 
	 * public String getToken() { return token; }
	 * 
	 * public void setToken(String token) { this.token = token; }
	 * 
	 * public String getExtractedFilePath() { return extractedFilePath; }
	 * 
	 * public void setExtractedFilePath(String extractedFilePath) {
	 * this.extractedFilePath = extractedFilePath; }
	 * 
	 * public Map<String, String> getExtractedFilePaths() { return
	 * extractedFilePaths; }
	 * 
	 * public void setExtractedFilePaths(Map<String, String> extractedFilePaths) {
	 * this.extractedFilePaths = extractedFilePaths; }
	 * 
	 * public boolean isSkipCurrentFileDistribution() { return
	 * skipCurrentFileDistribution; }
	 * 
	 * public void setSkipCurrentFileDistribution(boolean
	 * skipCurrentFileDistribution) { this.skipCurrentFileDistribution =
	 * skipCurrentFileDistribution; }
	 * 
	 * public Object getAdditionalInformation() { return additionalInformation; }
	 * 
	 * public void setAdditionalInformation(Object additionalInformation) {
	 * this.additionalInformation = additionalInformation; }
	 * 
	 * public int getNumberOfExtractedFiles() { return numberOfExtractedFiles; }
	 * 
	 * public void setNumberOfExtractedFiles(int numberOfExtractedFiles) {
	 * this.numberOfExtractedFiles = numberOfExtractedFiles; }
	 * 
	 * public int getNumberOfDistributedFiles() { return numberOfDistributedFiles; }
	 * 
	 * public void setNumberOfDistributedFiles(int numberOfDistributedFiles) {
	 * this.numberOfDistributedFiles = numberOfDistributedFiles; }
	 * 
	 * public int getNumberOfSkippedFiles() { return numberOfSkippedFiles; }
	 * 
	 * public void setNumberOfSkippedFiles(int numberOfSkippedFiles) {
	 * this.numberOfSkippedFiles = numberOfSkippedFiles; }
	 * 
	 * public int getNumberOfQuarantinedFiles() { return numberOfQuarantinedFiles; }
	 * 
	 * public void setNumberOfQuarantinedFiles(int numberOfQuarantinedFiles) {
	 * this.numberOfQuarantinedFiles = numberOfQuarantinedFiles; }
	 * 
	 * public List<String> getAttachments() { return attachments; }
	 * 
	 * public void setAttachments(List<String> attachments) { this.attachments =
	 * attachments; }
	 * 
	 * public String getArchiveFilePath() { return archiveFilePath; }
	 * 
	 * public void setArchiveFilePath(String archiveFilePath) { this.archiveFilePath
	 * = archiveFilePath; }
	 */

	public Exception getLastException() {
		return lastException;
	}

	public void setLastException(Exception lastException) {
		this.lastException = lastException;
	}

	/**
	 * Stores a dataset for visualization reports (charts, tabulators, pivot tables).
	 * Called from Groovy scripts as: ctx.reportData('salesGrid', sql.rows("..."))
	 *
	 * By convention, componentId is set via ctx.variables from request params.
	 * When set, only the dataset matching the requested component is stored.
	 */
	@SuppressWarnings("unchecked")
	public void reportData(String id, List<?> rows) {
		String requestedId = (variables != null) ? (String) variables.get("componentId") : null;
		if (requestedId != null && !id.equals(requestedId))
			return;

		List<LinkedHashMap<String, Object>> converted = new ArrayList<>();
		for (Object row : rows) {
			LinkedHashMap<String, Object> map;
			if (row instanceof LinkedHashMap) {
				map = (LinkedHashMap<String, Object>) row;
			} else if (row instanceof Map) {
				map = new LinkedHashMap<>((Map<String, Object>) row);
			} else {
				continue;
			}
			// Sanitize values: convert Groovy GStrings and other non-JSON types to String
			for (Map.Entry<String, Object> entry : map.entrySet()) {
				Object val = entry.getValue();
				if (val != null && !(val instanceof String) && !(val instanceof Number)
						&& !(val instanceof Boolean) && !(val instanceof Map) && !(val instanceof List)) {
					entry.setValue(val.toString());
				}
			}
			converted.add(map);
		}
		this.reportData = converted;
		if (!converted.isEmpty() && converted.get(0) != null) {
			this.reportColumnNames = new ArrayList<>(converted.get(0).keySet());
		}
	}

	/**
	 * Returns a Groovy Sql instance for the given connection code, creating and
	 * caching it on first use. All cached connections are closed by ScriptedReporter
	 * after script execution.
	 * Called from Groovy scripts as: def duckDb = ctx.getConnection('my-duckdb-conn')
	 */
	public Sql getConnection(String connectionCode) throws Exception {
		if (namedDbSql == null)
			namedDbSql = new LinkedHashMap<>();
		if (namedDbSql.containsKey(connectionCode))
			return namedDbSql.get(connectionCode);

		ServerDatabaseSettings dbs = dbManager.getServerDatabaseSettings(connectionCode);
		dbs.ensureDriverAndUrl();

		// Decrypt password at the exact moment of use — never store plaintext
		String decryptedPassword = dbs.userpassword;
		try {
			decryptedPassword = SecretsCipher.getInstance(Settings.PORTABLE_EXECUTABLE_DIR_PATH)
					.decrypt(dbs.userpassword);
		} catch (Exception e) {
			log.warn("Failed to decrypt database password for connection '{}': {}", connectionCode, e.getMessage());
		}
		Sql sql = Sql.newInstance(dbs.url, dbs.userid, decryptedPassword, dbs.driver);
		namedDbSql.put(connectionCode, sql);
		return sql;
	}

}
