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
package com.sourcekraft.documentburster.job;

import java.io.File;
import java.io.FileNotFoundException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.LinkedHashMap; 

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.GlobalContext;
import com.sourcekraft.documentburster.common.ServicesManager;
import com.sourcekraft.documentburster.common.db.DatabaseConnectionTester;
import com.sourcekraft.documentburster.common.db.DatabaseSchemaFetcher;
import com.sourcekraft.documentburster.common.db.ReportDataResult;
import com.sourcekraft.documentburster.common.db.schema.SchemaInfo;
import com.sourcekraft.documentburster.common.settings.EmailConnection;
import com.sourcekraft.documentburster.common.settings.NewFeatureRequest;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.engine.BursterFactory;
import com.sourcekraft.documentburster.engine.pdf.Merger;
import com.sourcekraft.documentburster.job.model.JobDetails;
import com.sourcekraft.documentburster.job.model.JobProgressDetails;
import com.sourcekraft.documentburster.scripting.Scripting;
import com.sourcekraft.documentburster.sender.factory.EmailMessageFactory;
import com.sourcekraft.documentburster.sender.factory.SmsMessageFactory;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.sender.model.SmsMessage;
import com.sourcekraft.documentburster.utils.LicenseUtils;
import com.sourcekraft.documentburster.utils.Scripts;
import com.sourcekraft.documentburster.utils.Utils;

public class CliJob {

	private static Logger log = LoggerFactory.getLogger(CliJob.class);

	private Map<String, String> parameters = new HashMap<>();

	private LicenseUtils licenseUtils = new LicenseUtils();

	public String configurationFilePath;

	private Settings settings;

	private String jobProgressFilePath;
	private String jobFilePath;
	private String jobType = "burst";

	public static String STATUS_COMPLETED = "COMPLETED";
	public static String STATUS_FAILED = "FAILED";

	public static String RUN_MODE_QA = "QA";
	public static String RUN_MODE_LIVE = "LIVE";

	private GlobalContext global;

	public void setGlobal(GlobalContext global) {
		this.global = global;
	}

	public void setParameters(Map<String, String> parameters) {
		// // System.out.println("[DEBUG] CliJob.setParameters called with: " +
		// parameters);
		this.parameters = parameters;
	}

	public CliJob(String configFilePath) {

		log.debug("public CliJob(String configFilePath) constructor configurationFilePath = " + configFilePath);

		if ((StringUtils.isNoneEmpty(configFilePath) && (Files.exists(Paths.get(configFilePath)))))
			this.configurationFilePath = configFilePath;
		else
			this.configurationFilePath = "./config/burst/settings.xml";

		settings = new Settings(configurationFilePath);

	}

	public Settings getSettings() throws Exception {
		return settings;
	}

	public void setJobProgressFilePath(String jobProgressFilePath) {

		this.jobProgressFilePath = jobProgressFilePath;

	}

	public void setJobType(String jobType) {

		this.jobType = jobType;

	}

	public void doCheckEmail() throws Exception {

		log.debug("doCheckEmail()");

		EmailMessage message;

		if ((configurationFilePath.contains("connections")) && (configurationFilePath.contains("eml-"))) {
			EmailConnection emailConnection = new EmailConnection();
			emailConnection.loadDetails(configurationFilePath);
			message = (new EmailMessageFactory()).createCheckEmailMessageFromConnection(emailConnection);

		} else {
			settings.setConfigurationFilePath(configurationFilePath);
			settings.loadSettings();

			message = (new EmailMessageFactory()).createCheckEmailMessageFromSettings(settings);

		}

		File jobFile = null;

		try {
			jobFile = _createJobFile(Scripts.EMAIL, "check-email");
			(new Scripting()).executeSenderScript(Scripts.EMAIL, message);

		} finally {
			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();
		}

	}

	public void doSendFeatureRequestEmail(String newFeatureRequestFilePath) throws Exception {

		log.debug("doSendFeatureRequestEmail()");

		if (StringUtils.isNotBlank(newFeatureRequestFilePath)) {
			File rnfXmlFile = new File(newFeatureRequestFilePath);

			if ((rnfXmlFile != null) && rnfXmlFile.exists()) {
				EmailConnection defaultEmailConnection = new EmailConnection();
				defaultEmailConnection.loadDetailsDefault(StringUtils.EMPTY);
				EmailMessage message = (new EmailMessageFactory())
						.createCheckEmailMessageFromConnection(defaultEmailConnection);

				NewFeatureRequest featureRequest = new NewFeatureRequest();

				featureRequest.loadDetails(newFeatureRequestFilePath);

				message.subject = featureRequest.getDetails().featurerequest.subject;
				message.textMessage = featureRequest.getDetails().featurerequest.message;

				message.tos.clear();
				message.tos.add("support@pdfburst.com");

				File jobFile = null;

				try {
					jobFile = _createJobFile(Scripts.EMAIL, "send-feature-request-email");
					(new Scripting()).executeSenderScript(Scripts.EMAIL, message);

				} finally {

					rnfXmlFile.delete();

					if ((jobFile != null) && (jobFile.exists()))
						jobFile.delete();
				}

			} else
				throw new Exception("'Request New Feature' XML file does not exist: " + newFeatureRequestFilePath);

		}

	}

	public void doResume(String jobProgressFilePath) throws Exception {

		log.debug("doResumeBurst(String jobProgressFilePath) : jobProgressFilePath = " + jobProgressFilePath);

		File jobFile = null;
		File jobProgressFile = new File(jobProgressFilePath);

		try {

			JobProgressDetails jobProgressDetails = JobUtils.loadJobProgressFile(jobProgressFilePath);
			jobProgressFile.delete();

			jobFile = _createJobFile(jobProgressDetails.filepath, jobProgressDetails.jobtype);

			this.configurationFilePath = jobProgressDetails.configurationFilePath;
			this.jobType = jobProgressDetails.jobtype;

			AbstractBurster burster = getBurster(jobProgressDetails.filepath);

			burster.setPreviousJobExecutionProgressDetails(jobProgressDetails);
			burster.setJobFilePath(jobFilePath);

			burster.burst(jobProgressDetails.filepath, jobProgressDetails.testall, jobProgressDetails.listoftesttokens,
					jobProgressDetails.numberofrandomtesttokens);

		} finally {

			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();

		}

	}

	public void doBurst(String filePath, boolean testAll, String listOfTestTokens, int numberOfRandomTestTokens)
			throws Exception {

		log.debug("doBurst(String filePath ) : filePath=" + filePath);

		File jobFile = null;

		try {

			jobFile = _createJobFile(filePath, jobType);

			AbstractBurster burster = getBurster(filePath);

			burster.setJobFilePath(jobFilePath);

			if (jobProgressFilePath != null)
				burster.setJobFilePath(jobProgressFilePath);

			// Pass parameters to AbstractReporter if applicable
			if (burster instanceof AbstractReporter && parameters != null && !parameters.isEmpty()) {
				((AbstractReporter) burster).setReportParameters(parameters);
			}

			burster.burst(filePath, testAll, listOfTestTokens, numberOfRandomTestTokens);

		} finally {
			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();
		}

	}

	/*
	 * public void doReportsGenerate(String filePath, String configFilePath, boolean
	 * testAll, String listOfTestTokens, int numberOfRandomTestTokens) throws
	 * Exception {
	 * 
	 * log.
	 * debug("doReportsGenerate(String filePath, String configFilePath), filePath = "
	 * + filePath + ", configFilePath = " + configFilePath);
	 * 
	 * File jobFile = null;
	 * 
	 * try {
	 * 
	 * jobFile = _createJobFile(filePath, "reporting");
	 * 
	 * AbstractBurster burster = getBurster(filePath);
	 * 
	 * burster.setJobFilePath(jobFilePath);
	 * 
	 * if (jobProgressFilePath != null) burster.setJobFilePath(jobProgressFilePath);
	 * 
	 * burster.burst(filePath, testAll, listOfTestTokens, numberOfRandomTestTokens);
	 * 
	 * } finally { if ((jobFile != null) && (jobFile.exists())) jobFile.delete(); }
	 * 
	 * }
	 */

	private String getJobFilePath() {

		return getTempFolder() + Utils.getRandomJobFileName();

	}

	public String getTempFolder() {

		return Utils.getTempFolder();

	}

	private File _createJobFile(String targetFilePath, String jobType) throws Exception {

		jobFilePath = getJobFilePath();

		JobDetails jobDetails = new JobDetails();

		jobDetails.filepath = targetFilePath;
		jobDetails.jobtype = jobType;

		JobUtils.saveJobDetails(jobDetails, jobFilePath);

		return new File(jobFilePath);

	}

	protected AbstractBurster getBurster(String filePath) throws Exception {

		AbstractBurster burster = BursterFactory.create(filePath, configurationFilePath, jobType);
		burster.setGlobal(global);

		return burster;

	}

	protected Merger getMerger() throws Exception {

		settings.setConfigurationFilePath(configurationFilePath);
		settings.loadSettings();
		return new Merger(settings);

	}

	public String getJobPath() {
		return jobFilePath;
	}

	public String doMerge(List<String> filePaths, String outputFileName) throws Exception {

		String mergedFilePath = null;
		File jobFile = null;

		try {

			jobFile = _createJobFile(outputFileName, "merge");

			Merger merger = getMerger();
			mergedFilePath = merger.doMerge(filePaths, outputFileName);

		} finally {
			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();
		}

		return mergedFilePath;

	}

	public void doActivateLicenseKey() throws Exception {

		log.debug("doActivateLicenseKey()");

		File jobFile = null;

		try {
			jobFile = _createJobFile(licenseUtils.getLicenseFilePath(), "activate-licenseUtils-key");
			licenseUtils.activateLicense();
		} finally {
			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();
		}

	}

	public void doDeactivateLicense() throws Exception {

		log.debug("doDeActivateLicenseKey()");

		File jobFile = null;

		try {
			jobFile = _createJobFile(licenseUtils.getLicenseFilePath(), "deactivate-licenseUtils-key");
			licenseUtils.deActivateLicense();
		} finally {
			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();
		}

	}

	public void doCheckLicense() throws Exception {

		log.debug("doCheckLicense()");

		File jobFile = null;

		try {
			jobFile = _createJobFile(licenseUtils.getLicenseFilePath(), "check-licenseUtils-key");
			licenseUtils.checkLicense();
		} finally {
			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();
		}

	}

	public void doCheckTwilio(String from, String to) throws Exception {

		log.debug("doCheckTwilio(String from, String to) : from = " + from + ", to = " + to);

		settings.setConfigurationFilePath(configurationFilePath);
		settings.loadSettings();

		SmsMessage message = (new SmsMessageFactory()).createCheckSmsMessage(from, to);
		message.twilio = settings.getSmsSettings().twilio;

		File jobFile = null;

		try {
			jobFile = _createJobFile(Scripts.TWILIO, "check-twilio");
			(new Scripting()).executeSenderScript(Scripts.TWILIO, message);
		} finally {
			if ((jobFile != null) && (jobFile.exists()))
				jobFile.delete();
		}

	}

	public ReportDataResult doTestFetchData(Map<String, String> parameters) throws Exception {

		File jobFile = null;
		ReportDataResult result = new ReportDataResult();

		try {
			// System.out.println("doTestFetchData: configurationFilePath = " +
			// configurationFilePath);

			// Create job file
			jobFile = _createJobFile(configurationFilePath, "test-fetch-data");
			// System.out.println(
			// "doTestFetchData: Created job file: " + (jobFile != null ?
			// jobFile.getAbsolutePath() : "null"));

			// Load settings and determine job type
			settings.setConfigurationFilePath(configurationFilePath);
			settings.loadSettings();

			String dsType = settings.getReportDataSource().type;
			// System.out.println("doTestFetchData: Data source type (jobType) = " +
			// dsType);

			this.setJobType(dsType);

			// Get the correct reporter (SqlReporter, ScriptReporter, etc.)
			AbstractBurster burster = getBurster(configurationFilePath);
			// System.out.println("doTestFetchData: Got burster of type: "
			// + (burster != null ? burster.getClass().getName() : "null"));

			// Only AbstractReporter descendants have setPreviewMode
			if (burster instanceof AbstractReporter) {
				// System.out.println("doTestFetchData: burster is instance of
				// AbstractReporter");
				((AbstractReporter) burster).setPreviewMode(true);
				// System.out.println("doTestFetchData: setPreviewMode called");

				((AbstractReporter) burster).setReportParameters(parameters);
				// System.out.println("doTestFetchData: setReportParameters called with: "
				// + (parameters != null ? parameters.toString() : "null"));
			} else {
				// System.out.println("doTestFetchData: burster is NOT instance of
				// AbstractReporter");
				throw new IllegalStateException("Test SQL Query only supported for AbstractReporter-based bursters");
			}

			// Run the normal reporting flow (no output/distribution in preview mode)
			// System.out.println("doTestFetchData: Calling burst...");
			long startTime = System.currentTimeMillis();
			burster.burst(settings.getTemplateName(), false, "", -1);
			long endTime = System.currentTimeMillis();
			// System.out.println("doTestFetchData: burst finished");

			// Prepare and return the result
			
			result.reportData = burster.getCtx().reportData;
			result.reportColumnNames = burster.getCtx().reportColumnNames;
			result.isPreview = true;
			result.executionTimeMillis = endTime - startTime;
			result.totalRows = (result.reportData != null) ? result.reportData.size() : 0;

			// System.out.println("doTestFetchData: reportData size = "
			// + (result.reportData != null ? result.reportData.size() : "null"));
			// System.out.println("doTestFetchData: reportColumnNames = "
			// + (result.reportColumnNames != null ? result.reportColumnNames.toString() :
			// "null"));
			return result;
			
		} catch (Throwable t) {
            String msg = (t.getMessage() == null || t.getMessage().isEmpty()) ? t.toString() : t.getMessage();
            
			// Log everything (goes through SLF4J/logback appenders)
            if (!msg.toLowerCase().contains("no burst tokens were provided or fetched for the document")) {
				log.error("Exception: ", t);
			}
			else {
				log.info(msg);
			}
            
			// Otherwise, we are invoked from the server (REST preview) — return a safe error payload
            LinkedHashMap<String, Object> row = new LinkedHashMap<>();
            row.put("ERROR_MESSAGE", msg);
            result.reportData = Arrays.asList(row);                    
            result.reportColumnNames = Arrays.asList("ERROR_MESSAGE");
            result.isPreview = true;
            result.executionTimeMillis = 0L;
            result.totalRows = 0;

            // If we were invoked from CLI (DocumentBurster/MainProgram set global)
            // rethrow to keep existing behavior (so top-level wrapper records exit and archiving)
            if (this.global != null) {
            	throw t;
            }
			return result;

        } finally {
			if ((jobFile != null) && (jobFile.exists())) {
				// System.out.println("doTestFetchData: Deleting job file: " +
				// jobFile.getAbsolutePath());
				jobFile.delete();
			}
		}
	}

	public void doTestAndFetchDatabaseSchema(String connectionFilePath) throws Exception {
		log.info("Starting database connection test and schema fetch for: {}", connectionFilePath);

		File connectionFile = new File(connectionFilePath);
		if (!connectionFile.exists() || !connectionFile.isFile()) {
			// This check is redundant if MainProgram already did it, but good practice.
			throw new FileNotFoundException("Connection file not found or is not a file: " + connectionFilePath);
		}

		// Determine a job name based on the connection file for the temp job file
		String jobName = connectionFile.getName();
		File jobFile = null; // Declare outside try

		try {
			// Create the temporary job file to signal work is in progress
			// Using connectionFilePath as the "target" for context, and jobName for type/id
			jobFile = _createJobFile(connectionFilePath, "test-and-fetch-database-schema-" + jobName);
			log.debug("Created job file: {}", jobFilePath);

			// --- Core Logic ---

			// 2. Test Connection
			DatabaseConnectionTester tester = new DatabaseConnectionTester();
			log.info("Attempting to test database connection...");
			tester.testConnection(connectionFilePath);
			log.info("Database connection test successful.");

			// 3. Fetch Schema
			DatabaseSchemaFetcher fetcher = new DatabaseSchemaFetcher();
			SchemaInfo schemaInfo;
			log.info("Attempting to fetch database schema...");
			schemaInfo = fetcher.fetchSchema(connectionFilePath);
			log.info("Successfully fetched database schema.");

			// 4. Determine Output Path and Save Schema
			String outputJsonPath;
			Path inputPath = connectionFile.toPath();
			Path parentDir = inputPath.getParent();
			if (parentDir == null) {
				throw new Exception("Cannot determine parent directory for connection file.");
			}
			String baseName = connectionFile.getName();
			if (baseName.toLowerCase().endsWith(".xml")) {
				baseName = baseName.substring(0, baseName.length() - 4);
			}
			// Convention: <connection-code>-information-schema.json
			String outputFileName = baseName + "-information-schema.json";
			outputJsonPath = parentDir.resolve(outputFileName).toString();
			log.debug("Determined output schema JSON path: {}", outputJsonPath);

			log.info("Attempting to save schema to JSON file: {}", outputJsonPath);
			fetcher.saveSchemaToJson(schemaInfo, outputJsonPath);
			log.info("Successfully saved schema to: {}", outputJsonPath);

			log.info("Database connection test and schema fetch completed successfully for: {}", connectionFilePath);
			// --- End Core Logic ---

		} finally {
			// Ensure the temporary job file is deleted regardless of success or failure

			// System.out.println("jobFile.getAbsolutePath(): " +
			// jobFile.getAbsolutePath());

			if ((jobFile != null) && (jobFile.exists())) {
				log.debug("Deleting job file: {}", jobFile.getAbsolutePath());
				jobFile.delete();
			}
		}

	}

	public void doService(String serviceName, String commandLine) throws Exception {
		File jobFile = null;
		try {
			jobFile = _createJobFile(serviceName, commandLine);
			ServicesManager.execute(commandLine);
		} finally {
			// always clean up the temp job file
			if (jobFile != null && jobFile.exists()) {
				jobFile.delete();
			}
		}
	}

}
