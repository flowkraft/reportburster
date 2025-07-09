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
package com.sourcekraft.documentburster.common.settings;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.model.Attachment;
import com.sourcekraft.documentburster.common.settings.model.Capabilities;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionEmailSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettingsInternal;
import com.sourcekraft.documentburster.common.settings.model.EmailRfc2822Validator;
import com.sourcekraft.documentburster.common.settings.model.EmailSettings;
import com.sourcekraft.documentburster.common.settings.model.ReportSettings;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;
import com.sourcekraft.documentburster.common.settings.model.RetryPolicy;
import com.sourcekraft.documentburster.common.settings.model.SendFiles;
import com.sourcekraft.documentburster.common.settings.model.SimpleJavaMail;
import com.sourcekraft.documentburster.common.settings.model.SmsSettings;
import com.sourcekraft.documentburster.common.settings.model.UploadSettings;
import com.sourcekraft.documentburster.common.settings.model.WebUploadSettings;
import com.sourcekraft.documentburster.utils.DumpToString;

public class Settings extends DumpToString {

	/**
	 * 
	 */
	public static String PORTABLE_EXECUTABLE_DIR_PATH = StringUtils.EMPTY;

	private static final long serialVersionUID = 6953576182023603829L;

	private Logger log = LoggerFactory.getLogger(Settings.class);

	private String configurationFilePath;

	public DocumentBursterSettings docSettings;
	public DocumentBursterSettingsInternal docSettingsInternal;
	public ReportingSettings reportingSettings;
	public DocumentBursterConnectionEmailSettings connectionEmailSettings;
	public DocumentBursterConnectionDatabaseSettings connectionDatabaseSettings;

	public Settings(String configFilePath) {

		if ((StringUtils.isNoneEmpty(configFilePath) && (Files.exists(Paths.get(configFilePath)))))
			this.configurationFilePath = configFilePath;
		else
			this.configurationFilePath = "./config/burst/settings.xml";

		Path path = Paths.get(this.configurationFilePath);
		Path parentPath = path.getParent();
		// Remove the last two directories from the path
		Path grandParentPath = parentPath.getParent().getParent();

		if (this.configurationFilePath.endsWith("config/burst/settings.xml")) {
			PORTABLE_EXECUTABLE_DIR_PATH = grandParentPath.toAbsolutePath().toString().replace("\\", "/");
		} else {
			PORTABLE_EXECUTABLE_DIR_PATH = grandParentPath.getParent().toAbsolutePath().toString().replace("\\", "/");
		}

	}

	public String getReportingPrimaryDatabaseConnectionCode() {

		if (Objects.isNull(this.reportingSettings))
			return StringUtils.EMPTY;

		if (!Objects.isNull(this.reportingSettings.report.datasource.sqloptions))
			return this.reportingSettings.report.datasource.sqloptions.conncode;

		return this.reportingSettings.report.datasource.scriptoptions.conncode;

	}

	public DocumentBursterSettings loadSettings() throws Exception {

		log.debug("loadSettings()");

		JAXBContext jc = JAXBContext.newInstance(DocumentBursterSettings.class);

		Unmarshaller u = jc.createUnmarshaller();

		try (FileInputStream fis = new FileInputStream(new File(this.configurationFilePath))) {
			docSettings = (DocumentBursterSettings) u.unmarshal(fis);
		}

		_sortAttachments();

		if ((!Objects.isNull(docSettings.settings.capabilities)
				&& docSettings.settings.capabilities.reportgenerationmailmerge))
			loadSettingsReporting();

		log.debug("loadSettings - settings = [" + docSettings + "], reportingSettings = [" + reportingSettings + "]");

		return docSettings;
	}

	public DocumentBursterSettingsInternal loadSettingsInternal() throws Exception {

		String internalConfigFilePath = Paths.get(PORTABLE_EXECUTABLE_DIR_PATH, "config/_internal/settings.xml")
				.normalize().toString();

		JAXBContext jcr = JAXBContext.newInstance(DocumentBursterSettingsInternal.class);

		Unmarshaller ur = jcr.createUnmarshaller();

		try (FileInputStream fis = new FileInputStream(new File(internalConfigFilePath))) {
			docSettingsInternal = (DocumentBursterSettingsInternal) ur.unmarshal(fis);
		}

		return docSettingsInternal;
	}

	public void loadSettingsReporting() throws Exception {

		// config/reports/payslips
		String configFolderPath = Paths.get(this.configurationFilePath).getParent().toString();
		String reportingConfigFilePath = configFolderPath + "/reporting.xml";

		JAXBContext jcr = JAXBContext.newInstance(ReportingSettings.class);

		Unmarshaller ur = jcr.createUnmarshaller();

		try (FileInputStream fis = new FileInputStream(new File(reportingConfigFilePath))) {
			reportingSettings = (ReportingSettings) ur.unmarshal(fis);
		}

		if (!Objects.isNull(reportingSettings.report.datasource.sqloptions)
				&& !Objects.isNull(reportingSettings.report.datasource.sqloptions.conncode)) {

			String connCode = reportingSettings.report.datasource.sqloptions.conncode;

			if (StringUtils.isNotBlank(connCode)) {
				// config/reports/payslips
				configFolderPath = Paths.get(this.configurationFilePath).getParent().toString();

				// config/reports
				configFolderPath = Paths.get(configFolderPath).getParent().toString();

				// config
				configFolderPath = Paths.get(configFolderPath).getParent().toString();

				String dbConfigFilePath = configFolderPath + "/connections/" + connCode + "/" + connCode + ".xml";

				jcr = JAXBContext.newInstance(DocumentBursterConnectionDatabaseSettings.class);

				ur = jcr.createUnmarshaller();
				try (FileInputStream fis = new FileInputStream(new File(dbConfigFilePath))) {
					connectionDatabaseSettings = (DocumentBursterConnectionDatabaseSettings) ur.unmarshal(fis);
				}

			}

		}
	}

	public ReportingSettings loadSettingsReportingWithCode(String reportCode) throws Exception {

		String reportingFilePath = Paths
				.get(PORTABLE_EXECUTABLE_DIR_PATH, "config/reports", reportCode, "reporting.xml").normalize()
				.toString();

		JAXBContext jcr = JAXBContext.newInstance(ReportingSettings.class);

		Unmarshaller ur = jcr.createUnmarshaller();
		ReportingSettings repSettings;
		try (FileInputStream fis = new FileInputStream(new File(reportingFilePath))) {
			repSettings = (ReportingSettings) ur.unmarshal(fis);
		}
		return repSettings;
	}

	public ReportingSettings loadSettingsReportingWithPath(String reportPath) throws Exception {

		JAXBContext jcr = JAXBContext.newInstance(ReportingSettings.class);

		Unmarshaller ur = jcr.createUnmarshaller();
		try (FileInputStream fis = new FileInputStream(new File(reportPath))) {
			reportingSettings = (ReportingSettings) ur.unmarshal(fis);
		}
		return reportingSettings;
	}

	public DocumentBursterConnectionEmailSettings loadSettingsConnectionEmail(String connectionCode) throws Exception {

		String connectionFilePath = Paths.get(PORTABLE_EXECUTABLE_DIR_PATH, connectionCode).normalize().toString();

		JAXBContext jcr = JAXBContext.newInstance(DocumentBursterConnectionEmailSettings.class);

		Unmarshaller ur = jcr.createUnmarshaller();

		try (FileInputStream fis = new FileInputStream(new File(connectionFilePath))) {
			connectionEmailSettings = (DocumentBursterConnectionEmailSettings) ur.unmarshal(fis);
		}

		return connectionEmailSettings;
	}

	public DocumentBursterConnectionDatabaseSettings loadSettingsConnectionDatabase(String connectionCode)
			throws Exception {

		String connectionConfigFilePath = Paths
				.get(PORTABLE_EXECUTABLE_DIR_PATH, "config/connections", connectionCode, connectionCode + ".xml")
				.normalize().toString();

		return this.loadSettingsConnectionDatabaseByPath(connectionConfigFilePath);

	}

	public DocumentBursterConnectionDatabaseSettings loadSettingsConnectionDatabaseByPath(String connectionFilePath)
			throws Exception {
		// System.out.println("loadSettingsConnection connectionConfigFilePath = " +
		// connectionConfigFilePath);

		JAXBContext jcr = JAXBContext.newInstance(DocumentBursterConnectionDatabaseSettings.class);

		Unmarshaller ur = jcr.createUnmarshaller();
		DocumentBursterConnectionDatabaseSettings connDatabaseSettings;
		try (FileInputStream fis = new FileInputStream(new File(connectionFilePath))) {
			connDatabaseSettings = (DocumentBursterConnectionDatabaseSettings) ur.unmarshal(fis);
		}

		if (StringUtils.isBlank(connDatabaseSettings.connection.databaseserver.url)
				&& !StringUtils.isBlank(connDatabaseSettings.connection.databaseserver.connectionstring))
			connDatabaseSettings.connection.databaseserver.url = connDatabaseSettings.connection.databaseserver.connectionstring;

		return connDatabaseSettings;
	}

	private void _sortAttachments() {

		if (docSettings.settings.attachments.items.attachmentItems == null)
			return;

		if (docSettings.settings.attachments.items.attachmentItems.size() > 0) {

			Comparator<Attachment> COMPARATOR = new Comparator<Attachment>() {
				public int compare(Attachment a1, Attachment a2) {
					return a1.order - a2.order;
				}
			};

			Collections.sort(docSettings.settings.attachments.items.attachmentItems, COMPARATOR);
		}

	}

	public ReportSettings.DataSource getReportDataSource() {
		return reportingSettings.report.datasource;
	}

	public String getReportFolderNameId() {

		if (!this.getCapabilities().reportgenerationmailmerge)
			return StringUtils.EMPTY;

		return this.getTemplateName().toLowerCase();
	}

	public ReportSettings.Template getReportTemplate() {
		return reportingSettings.report.template;
	}

	public String getConfigurationFilePath() {
		return this.configurationFilePath;
	}

	public String setConfigurationFilePath(String configurationFilePath) {
		return this.configurationFilePath = configurationFilePath;
	}

	public Capabilities getCapabilities() {
		return docSettings.settings.capabilities;
	}

	public String getTemplateName() {
		return docSettings.settings.template.trim();
	}

	public String getVersion() {
		return docSettings.settings.version;
	}

	public String getBurstFileName() {
		return docSettings.settings.burstfilename.trim();
	}

	public String getOutputFolder() {
		return docSettings.settings.outputfolder.trim();
	}

	public String getBackupFolder() {
		return docSettings.settings.backupfolder.trim();
	}

	public boolean isQuarantineFiles() {
		return docSettings.settings.quarantinefiles;
	}

	public String getQuarantineFolder() {
		return docSettings.settings.quarantinefolder.trim();
	}

	public String getStatsFileName() {
		return docSettings.settings.statsfilename.trim();
	}

	public String getLogsArchivesFolder() {

		return docSettings.settings.logsarchivesfolder.trim();
	}

	public SendFiles getSendFiles() {
		return docSettings.settings.sendfiles;
	}

	public boolean isDeleteFiles() {
		return docSettings.settings.deletefiles;
	}

	public boolean isHtmlEmail() {
		return docSettings.settings.htmlemail;
	}

	public void setHtmlEmail(boolean htmlEmail) {
		docSettings.settings.htmlemail = htmlEmail;
	}

	public boolean isHtmlEmailEditCode() {
		return docSettings.settings.htmlemaileditcode;
	}

	public boolean isSortByPosition() {
		return docSettings.settings.sortbyposition;
	}

	public boolean isShouldSeparateByBeads() {
		return docSettings.settings.shouldseparatebybeads;
	}

	public boolean isSuppressDuplicateOverlappingText() {
		return docSettings.settings.suppressduplicateoverlappingtext;
	}

	public float getAverageCharTolerance() {
		return docSettings.settings.averagechartolerancevalue;
	}

	public float getSpacingTolerance() {
		return docSettings.settings.spacingtolerancevalue;
	}

	public int getNumberOfUserVariables() {
		return docSettings.settings.numberofuservariables;
	}

	public void setNumberOfVariables(int numberOfUserVariables) {
		docSettings.settings.numberofuservariables = numberOfUserVariables;
	}

	public double getDelayEachDistributionBy() {
		return docSettings.settings.delayeachdistributionby;
	}

	public void setDelayEachDistributionBy(double delayEachDistributionBy) {
		docSettings.settings.delayeachdistributionby = delayEachDistributionBy;
	}

	public boolean isReuseTokensWhenNotFound() {
		return docSettings.settings.reusetokenswhennotfound;
	}

	public boolean isSplit2ndTime() {
		return docSettings.settings.split2ndtime;
	}

	public boolean isFailJobIfAnyDistributionFails() {
		return docSettings.settings.failjobifanydistributionfails;
	}

	public boolean isEnableRetryPolicy() {
		return docSettings.settings.enableretrypolicy;
	}

	public String getLanguage() {
		return docSettings.settings.locale.language;
	}

	public String getCountry() {
		return docSettings.settings.locale.country;
	}

	public List<Attachment> getAttachments() {

		if (docSettings.settings.attachments.items.attachmentItems == null)
			return new ArrayList<Attachment>();

		return docSettings.settings.attachments.items.attachmentItems;

	}

	public boolean isArchiveAttachments() {
		return docSettings.settings.attachments.archive.archiveattachments;
	}

	public String getArchiveFileName() {
		return docSettings.settings.attachments.archive.archivefilename;
	}

	public EmailSettings getEmailSettings() {
		return docSettings.settings.emailsettings;
	}

	public boolean getEmailServerUseConn() {
		return docSettings.settings.emailserver.useconn;
	}

	public String getEmailServerConnCode() {
		return docSettings.settings.emailserver.conncode;
	}

	public String getEmailServerUserId() {
		return docSettings.settings.emailserver.userid;
	}

	public String getEmailServerUserPassword() {
		return docSettings.settings.emailserver.userpassword;
	}

	public String getEmailServerHost() {
		return docSettings.settings.emailserver.host;
	}

	public String getEmailServerPort() {
		return docSettings.settings.emailserver.port;
	}

	public String getEmailServerFrom() {
		return docSettings.settings.emailserver.fromaddress;
	}

	public String getEmailServerName() {
		return docSettings.settings.emailserver.name;
	}

	public boolean isEmailServerUseTLS() {
		return docSettings.settings.emailserver.usetls;
	}

	public boolean isEmailServerUseSSL() {
		return docSettings.settings.emailserver.usessl;
	}

	public String getTestEmailServerUserId() {
		return docSettings.settings.qualityassurance.emailserver.userid;
	}

	public String getTestEmailServerUserPassword() {
		return docSettings.settings.qualityassurance.emailserver.userpassword;
	}

	public String getTestEmailServerHost() {
		return docSettings.settings.qualityassurance.emailserver.host;
	}

	public String getTestEmailServerPort() {
		return docSettings.settings.qualityassurance.emailserver.port;
	}

	public String getTestEmailServerFrom() {
		return docSettings.settings.qualityassurance.emailserver.fromaddress;
	}

	public String getTestEmailServerName() {
		return docSettings.settings.qualityassurance.emailserver.name;
	}

	public boolean isTestEmailServerUseTLS() {
		return docSettings.settings.qualityassurance.emailserver.usetls;
	}

	public boolean isTestEmailServerUseSSL() {
		return docSettings.settings.qualityassurance.emailserver.usessl;
	}

	public SimpleJavaMail getSimpleJavaMail() {
		return docSettings.settings.simplejavamail;
	}

	public SimpleJavaMail setSimpleJavaMail(SimpleJavaMail sjm) {
		return docSettings.settings.simplejavamail = sjm;
	}

	public EmailRfc2822Validator getEmailRfc2822Validator() {
		return docSettings.settings.emailrfc2822validator;
	}

	public UploadSettings getUploadSettings() {
		return docSettings.settings.uploadsettings;
	}

	public WebUploadSettings getWebUploadSettings() {
		return docSettings.settings.webuploadsettings;
	}

	public SmsSettings getSmsSettings() {
		return docSettings.settings.smssettings;
	}

	public RetryPolicy getRetryPolicy() {
		return docSettings.settings.retrypolicy;
	}

	public String getMergeFileName() {
		return docSettings.settings.mergefilename;
	}

	public void setSendFilesEmail(boolean sendFilesEmail) {
		docSettings.settings.sendfiles.email = sendFilesEmail;
	}

	public void setSendFilesUpload(boolean sendFilesUpload) {
		docSettings.settings.sendfiles.upload = sendFilesUpload;
	}

	public void setSendFilesWeb(boolean sendFilesWeb) {
		docSettings.settings.sendfiles.web = sendFilesWeb;
	}

	public void setSendFilesSms(boolean sendFilesSms) {
		docSettings.settings.sendfiles.sms = sendFilesSms;
	}

	public void setCapabilityReportGenerationMailMerge(boolean reportgenerationmailmerge) {
		docSettings.settings.capabilities.reportgenerationmailmerge = reportgenerationmailmerge;
	}

	public void setEmailServerHost(String host) {
		docSettings.settings.emailserver.host = host;
	}

	public void setEmailServerPort(String port) {
		docSettings.settings.emailserver.port = port;
	}

	public void setEmailServerUserId(String userId) {
		docSettings.settings.emailserver.userid = userId;
	}

	public void setEmailServerUserPassword(String userPassword) {
		docSettings.settings.emailserver.userpassword = userPassword;
	}

	public void setEmailServerUseTLS(boolean useTls) {
		docSettings.settings.emailserver.usetls = useTls;
	}

	public void setEmailServerUseSSL(boolean useSsl) {
		docSettings.settings.emailserver.usessl = useSsl;
	}

	public void setEmailServerFrom(String fromAddress) {
		docSettings.settings.emailserver.fromaddress = fromAddress;
	}

	public void setEmailServerName(String name) {
		docSettings.settings.emailserver.name = name;
	}

	public void setTestEmailServerHost(String host) {
		docSettings.settings.qualityassurance.emailserver.host = host;
	}

	public void setTestEmailServerPort(String port) {
		docSettings.settings.qualityassurance.emailserver.port = port;
	}

	public void setTesttEmailServerUserId(String userId) {
		docSettings.settings.qualityassurance.emailserver.userid = userId;
	}

	public void setTestEmailServerUserPassword(String userPassword) {
		docSettings.settings.qualityassurance.emailserver.userpassword = userPassword;
	}

	public void setTestEmailServerUseTLS(boolean useTls) {
		docSettings.settings.qualityassurance.emailserver.usetls = useTls;
	}

	public void setTestEmailServerUseSSL(boolean useSsl) {
		docSettings.settings.qualityassurance.emailserver.usessl = useSsl;
	}

	public void setTestEmailServerFrom(String fromAddress) {
		docSettings.settings.qualityassurance.emailserver.fromaddress = fromAddress;
	}

	public void setTestEmailServerName(String name) {
		docSettings.settings.qualityassurance.emailserver.name = name;
	}

	public void setEmailTo(String to) {
		docSettings.settings.emailsettings.to = to;
	}

	public void setEmailCc(String cc) {
		docSettings.settings.emailsettings.cc = cc;
	}

	public void setEmailBcc(String bcc) {
		docSettings.settings.emailsettings.bcc = bcc;
	}

	public void setEmailSubject(String subject) {
		docSettings.settings.emailsettings.subject = subject;
	}

	public void setEmailText(String text) {
		docSettings.settings.emailsettings.text = text;
	}

	public void addAttachment(Attachment item) {
		getAttachments().add(item);
	}

	public void setSplit2ndTime(boolean split2ndtime) {
		docSettings.settings.split2ndtime = split2ndtime;
	}

	public void setArchiveAttachments(boolean archiveAttachments) {
		docSettings.settings.attachments.archive.archiveattachments = archiveAttachments;
	}

	public void setArchiveFileName(String archiveFileName) {
		docSettings.settings.attachments.archive.archivefilename = archiveFileName;
	}

	public void setDeleteFiles(boolean deleteFiles) {
		docSettings.settings.deletefiles = deleteFiles;
	}

	public void setFtpCommand(String ftpCommand) {
		docSettings.settings.uploadsettings.ftpcommand = ftpCommand;
	}

	public void setOutputFolder(String folder) {
		docSettings.settings.outputfolder = folder;
	}

	public void setBackupFolder(String folder) {
		docSettings.settings.backupfolder = folder;
	}

	public void setQuarantineFolder(String folder) {
		docSettings.settings.quarantinefolder = folder;
	}

	public void setBurstFileName(String burstFileName) {
		docSettings.settings.burstfilename = burstFileName;
	}

	public void setStatsFileName(String statsFileName) {
		docSettings.settings.statsfilename = statsFileName;
	}

	public void setLogsArchivesFolder(String folder) {
		docSettings.settings.logsarchivesfolder = folder;
	}

	public void setReuseTokensWhenNotFound(boolean reuseTokenWhenNotFound) {
		docSettings.settings.reusetokenswhennotfound = reuseTokenWhenNotFound;
	}

	public void setFailJobIfAnyDistributionFails(boolean failJobIfAnyDistributionFails) {

		docSettings.settings.failjobifanydistributionfails = failJobIfAnyDistributionFails;

	}

	public void setEnableRetryPolicy(boolean enableRetryPolicy) {

		docSettings.settings.enableretrypolicy = enableRetryPolicy;

	}

	public String getStartBurstTokenDelimiter() {
		return docSettings.settings.bursttokendelimiters.start;
	}

	public String getEndBurstTokenDelimiter() {
		return docSettings.settings.bursttokendelimiters.end;
	}

	public void setStartBurstTokenDelimiter(String startDelimiter) {
		docSettings.settings.bursttokendelimiters.start = startDelimiter;
	}

	public boolean getDumpRecordDataAsXml() {
		return docSettings.settings.dumprecorddataasxml;
	}

	public void setDumpRecordDataAsXml(boolean dumprecorddataasxml) {
		docSettings.settings.dumprecorddataasxml = dumprecorddataasxml;
	}

	public void setEndBurstTokenDelimiter(String endDelimiter) {
		docSettings.settings.bursttokendelimiters.end = endDelimiter;
	}

	public String getStartBurstTokenDelimiter2nd() {
		return docSettings.settings.bursttokendelimiters.start2nd;
	}

	public String getEndBurstTokenDelimiter2nd() {
		return docSettings.settings.bursttokendelimiters.end2nd;
	}

	public void setStartBurstTokenDelimiter2nd(String startDelimiter) {
		docSettings.settings.bursttokendelimiters.start2nd = startDelimiter;
	}

	public void setEndBurstTokenDelimiter2nd(String endDelimiter) {
		docSettings.settings.bursttokendelimiters.end2nd = endDelimiter;
	}

	public void setFileShareCommand(String fileShareCommand) {
		docSettings.settings.uploadsettings.filesharecommand = fileShareCommand;
	}

	public void setFtpsCommand(String ftpsCommand) {
		docSettings.settings.uploadsettings.ftpscommand = ftpsCommand;
	}

	public void setSftpCommand(String sftpCommand) {
		docSettings.settings.uploadsettings.sftpcommand = sftpCommand;

	}

	public void setHttpCommand(String httpCommand) {
		docSettings.settings.uploadsettings.httpcommand = httpCommand;
	}

	public void setCloudCommand(String cloudCommand) {
		docSettings.settings.uploadsettings.cloudcommand = cloudCommand;
	}

	public void setDocumentBursterWebCommand(String documentBursterWebCommand) {
		docSettings.settings.webuploadsettings.documentbursterwebcommand = documentBursterWebCommand;
	}

	public void setMSSharePointCommand(String msSharePointCommand) {
		docSettings.settings.webuploadsettings.mssharepointcommand = msSharePointCommand;
	}

	public void setWordPressCommand(String wordPressCommand) {
		docSettings.settings.webuploadsettings.wordpresscommand = wordPressCommand;

	}

	public void setDrupalCommand(String drupalCommand) {
		docSettings.settings.webuploadsettings.drupalcommand = drupalCommand;

	}

	public void setJoomlaCommand(String joomlaCommand) {
		docSettings.settings.webuploadsettings.joomlacommand = joomlaCommand;

	}

	public void setOtherWebCommand(String otherWebCommand) {
		docSettings.settings.webuploadsettings.otherwebcommand = otherWebCommand;

	}

	public void setRetryPolicyDelay(int delay) {
		docSettings.settings.retrypolicy.delay = delay;
	}

	public void setRetryPolicyMaxDelay(int maxDelay) {
		docSettings.settings.retrypolicy.maxdelay = maxDelay;
	}

	public void setRetryPolicyMaxRetries(int maxRetries) {
		docSettings.settings.retrypolicy.maxretries = maxRetries;
	}

	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.MULTI_LINE_STYLE);
	}
}
