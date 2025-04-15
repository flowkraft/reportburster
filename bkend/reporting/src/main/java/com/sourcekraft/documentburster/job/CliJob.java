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
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.GlobalContext;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.engine.BursterFactory;
import com.sourcekraft.documentburster.engine.pdf.Merger;
import com.sourcekraft.documentburster.job.model.JobDetails;
import com.sourcekraft.documentburster.job.model.JobProgressDetails;
import com.sourcekraft.documentburster.scripting.Scripting;
import com.sourcekraft.documentburster.scripting.Scripts;
import com.sourcekraft.documentburster.sender.factory.EmailMessageFactory;
import com.sourcekraft.documentburster.sender.factory.SmsMessageFactory;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.sender.model.SmsMessage;
import com.sourcekraft.documentburster.common.settings.EmailConnection;
import com.sourcekraft.documentburster.common.settings.NewFeatureRequest;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.utils.LicenseUtils;
import com.sourcekraft.documentburster.utils.Utils;

public class CliJob {

	private static Logger log = LoggerFactory.getLogger(CliJob.class);

	private Settings settings = new Settings();
	private LicenseUtils licenseUtils = new LicenseUtils();

	public String configurationFilePath;

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

	public CliJob(String configFilePath) {

		log.debug("configurationFilePath = " + configFilePath);

		if (configFilePath != null)
			this.configurationFilePath = configFilePath;
		else
			this.configurationFilePath = "./config/burst/settings.xml";

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
			settings.loadSettings(configurationFilePath);

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
				throw new FileNotFoundException(
						"'Request New Feature' XML file does not exist: " + newFeatureRequestFilePath);

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

		settings.loadSettings(configurationFilePath);
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

		settings.loadSettings(configurationFilePath);

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

}
