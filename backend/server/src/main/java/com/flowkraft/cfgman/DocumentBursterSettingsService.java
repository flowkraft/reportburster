package com.flowkraft.cfgman;

import java.io.FileOutputStream;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.services.SystemService;
import com.flowkraft.jobman.services.SystemService.FindCriteria;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.ConfigurationFileInfo;
import com.sourcekraft.documentburster.common.settings.model.ConnectionFileInfo;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettingsInternal;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;

@Service
public class DocumentBursterSettingsService {

	@Autowired
	SystemService systemService;

	public Stream<ConfigurationFileInfo> loadSettingsAll() throws Exception {

		List<ConfigurationFileInfo> configurationFiles = new ArrayList<ConfigurationFileInfo>();

		// AppPaths.CONFIG_DIR_PATH + "/burst"
		List<String> matching = new ArrayList<String>();

		matching.add("*.xml");
		Optional<Boolean> files = Optional.of(true);
		Optional<Boolean> directories = Optional.of(false);
		Optional<Boolean> recursive = Optional.of(false);
		Optional<Boolean> ignoreCase = Optional.of(true);

		FindCriteria criteria = new FindCriteria(matching, files, directories, recursive, ignoreCase);

		// System.out.println("burst folder path = " + AppPaths.CONFIG_DIR_PATH +
		// "/burst");

		List<String> burstConfigFilePaths = systemService.unixCliFind(AppPaths.CONFIG_DIR_PATH + "/burst", criteria);

		// System.out.println("burstConfigFilePaths = " + burstConfigFilePaths);

		// AppPaths.CONFIG_DIR_PATH + "/reports"
		matching = new ArrayList<String>();

		matching.add("settings.xml");
		files = Optional.of(true);
		directories = Optional.of(false);
		recursive = Optional.of(true);
		ignoreCase = Optional.of(true);

		criteria = new FindCriteria(matching, files, directories, recursive, ignoreCase);

		List<String> reportsConfigFilePaths = systemService.unixCliFind(AppPaths.CONFIG_DIR_PATH + "/reports",
				criteria);

		// System.out.println("reportsConfigFilePaths = " + reportsConfigFilePaths);

		// AppPaths.CONFIG_DIR_PATH + "/samples"
		// matching = new ArrayList<String>();

		// matching.add("settings.xml");
		// files = Optional.of(true);
		// directories = Optional.of(false);
		// recursive = Optional.of(true);
		// ignoreCase = Optional.of(true);

		// criteria = new FindCriteria(matching, files, directories, recursive,
		// ignoreCase);

		List<String> samplesConfigFilePaths = systemService.unixCliFind(AppPaths.CONFIG_DIR_PATH + "/samples",
				criteria);

		// System.out.println("samplesConfigFilePaths = " + samplesConfigFilePaths);

		List<String> configFilePaths = new ArrayList<>();
		configFilePaths.addAll(burstConfigFilePaths);
		configFilePaths.addAll(reportsConfigFilePaths);
		configFilePaths.addAll(samplesConfigFilePaths);

		for (String filePath : configFilePaths) {
			String configurationFileName = Paths.get(filePath).getFileName().toString();

			boolean isFallbackSettings = filePath.endsWith("burst/settings.xml");

			boolean isRealSettingsXmlFile = !filePath.endsWith("_defaults/settings.xml")
					&& !filePath.endsWith("preferences/settings.xml");

			if (isRealSettingsXmlFile) {

				String fullFilePath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + filePath;

				// System.out.println("filePath = " + filePath);
				// System.out.println("fullFilePath = " + fullFilePath);

				String settingsFileContent = systemService.unixCliCat(fullFilePath);

				// System.out.println("settingsFileContent = " + settingsFileContent);

				int startPos = settingsFileContent.indexOf("<template>") + "<template>".length();
				int endPos = settingsFileContent.indexOf("</template>");
				String configurationName = settingsFileContent.substring(startPos, endPos).trim();

				startPos = settingsFileContent.indexOf("<reportdistribution>") + "<reportdistribution>".length();
				endPos = settingsFileContent.indexOf("</reportdistribution>");
				boolean boolReportDistribution = Boolean
						.parseBoolean(settingsFileContent.substring(startPos, endPos).trim());

				startPos = settingsFileContent.indexOf("<reportgenerationmailmerge>")
						+ "<reportgenerationmailmerge>".length();
				endPos = settingsFileContent.indexOf("</reportgenerationmailmerge>");
				boolean boolReportGenerationMailMerge = Boolean
						.parseBoolean(settingsFileContent.substring(startPos, endPos).trim());

				startPos = settingsFileContent.indexOf("<visibility>") + "<visibility>".length();
				endPos = settingsFileContent.indexOf("</visibility>");
				String strVisibility = settingsFileContent.substring(startPos, endPos).trim();

				startPos = settingsFileContent.indexOf("<useconn>") + "<useconn>".length();
				endPos = settingsFileContent.indexOf("</useconn>");
				boolean boolUseEmailConnection = Boolean
						.parseBoolean(settingsFileContent.substring(startPos, endPos).trim());

				String strEmailConnectionCode = StringUtils.EMPTY;
				if (settingsFileContent.contains("<conncode>")) {
					startPos = settingsFileContent.indexOf("<conncode>") + "<conncode>".length();
					endPos = settingsFileContent.indexOf("</conncode>");
					strEmailConnectionCode = settingsFileContent.substring(startPos, endPos).trim();
				}

				String templateRelativeFilePath = "./config/burst/" + configurationFileName;
				String typeOfConfiguration = "config-burst-legacy";

				String folderName = Paths.get(filePath).getParent().getFileName().toString();

				String dsInputType = StringUtils.EMPTY;
				if (filePath.contains("config/reports/" + folderName)) {
					typeOfConfiguration = "config-reports";
					templateRelativeFilePath = "./config/reports/" + folderName + "/settings.xml";

					if (boolReportGenerationMailMerge) {
						String reportingXmlFilePath = Paths.get(fullFilePath).getParent().toString() + "/reporting.xml";

						String reportingXmlFileContent = systemService.unixCliCat(reportingXmlFilePath);

						// System.out.println("reportingXmlFileContent = " + reportingXmlFileContent);

						startPos = reportingXmlFileContent.indexOf("<type>") + "<type>".length();
						endPos = reportingXmlFileContent.indexOf("</type>");
						dsInputType = reportingXmlFileContent.substring(startPos, endPos).trim();
					}

				} else if (filePath.contains("config/samples/" + folderName)) {
					typeOfConfiguration = "config-samples";
					templateRelativeFilePath = "./config/samples/" + folderName + "/settings.xml";
				}

				ConfigurationFileInfo configFile = new ConfigurationFileInfo();
				configFile.fileName = configurationFileName;
				configFile.filePath = filePath.replace("\\", "/");
				configFile.relativeFilePath = templateRelativeFilePath;
				configFile.templateName = configurationName;
				configFile.isFallback = isFallbackSettings;
				configFile.capReportDistribution = boolReportDistribution;
				configFile.capReportGenerationMailMerge = boolReportGenerationMailMerge;
				configFile.dsInputType = dsInputType;
				configFile.visibility = strVisibility;
				configFile.notes = StringUtils.EMPTY;
				configFile.folderName = folderName;
				configFile.type = typeOfConfiguration;
				configFile.activeClicked = false;
				configFile.useEmlConn = boolUseEmailConnection;
				configFile.emlConnCode = strEmailConnectionCode;

				configurationFiles.add(configFile);
			}

		}

		// System.out.println("configurationFiles = " + configurationFiles);

		return configurationFiles.stream();

	}

	public DocumentBursterSettings loadSettings(String configFilePath) throws Exception {
		Settings settings = new Settings();
		settings.loadSettings(configFilePath);

		return settings.docSettings;
	}

	public void saveSettings(DocumentBursterSettings settings, String configFilePath) throws Exception {

		JAXBContext jc = JAXBContext.newInstance(DocumentBursterSettings.class);
		Marshaller marshaller = jc.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

		try (OutputStream os = new FileOutputStream(configFilePath)) {
			marshaller.marshal(settings, os);
		}

	}

	public ReportingSettings loadSettingsReporting(String configFilePath) throws Exception {

		String configFolderPath = Paths.get(configFilePath).getParent().toString();
		String reportingConfigFilePath = configFolderPath + "/reporting.xml";

		Settings settings = new Settings();
		settings.loadSettingsReporting(reportingConfigFilePath);

		return settings.reportingSettings;
	}

	public void saveSettingsReporting(ReportingSettings settings, String configFilePath) throws Exception {

		String configFolderPath = Paths.get(configFilePath).getParent().toString();
		String reportingConfigFilePath = configFolderPath + "/reporting.xml";

		JAXBContext jc = JAXBContext.newInstance(ReportingSettings.class);
		Marshaller marshaller = jc.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

		try (OutputStream os = new FileOutputStream(reportingConfigFilePath)) {
			marshaller.marshal(settings, os);
		}

	}

	public Stream<ConnectionFileInfo> loadSettingsConnectionAll() throws Exception {

		List<ConnectionFileInfo> connectionFiles = new ArrayList<ConnectionFileInfo>();

		// AppPaths.CONFIG_DIR_PATH + "/burst"
		List<String> matching = new ArrayList<String>();

		matching.add("*.xml");
		Optional<Boolean> files = Optional.of(true);
		Optional<Boolean> directories = Optional.of(false);
		Optional<Boolean> recursive = Optional.of(false);
		Optional<Boolean> ignoreCase = Optional.of(true);

		FindCriteria criteria = new FindCriteria(matching, files, directories, recursive, ignoreCase);

		List<String> connectionFilePaths = systemService.unixCliFind(AppPaths.CONFIG_DIR_PATH + "/connections",
				criteria);

		for (String filePath : connectionFilePaths) {

			String connectionFileName = Paths.get(filePath).getFileName().toString();

			DocumentBursterConnectionSettings rbConnection = this.loadSettingsConnection(filePath);

			ConnectionFileInfo connFileInfo = new ConnectionFileInfo();
			connFileInfo.fileName = connectionFileName;
			connFileInfo.filePath = filePath.replace("\\", "/");
			connFileInfo.connectionCode = rbConnection.connection.code;
			connFileInfo.connectionName = rbConnection.connection.name;
			connFileInfo.connectionType = connectionFileName.startsWith("eml-") ? "email-connection"
					: "database-connection";
			connFileInfo.activeClicked = false;
			connFileInfo.defaultConnection = rbConnection.connection.defaultConnection;
			connFileInfo.usedBy = StringUtils.EMPTY;

			connFileInfo.emailserver.host = rbConnection.connection.emailserver.host;
			connFileInfo.emailserver.port = rbConnection.connection.emailserver.port;
			connFileInfo.emailserver.userid = rbConnection.connection.emailserver.userid;
			connFileInfo.emailserver.userpassword = rbConnection.connection.emailserver.userpassword;
			connFileInfo.emailserver.usessl = rbConnection.connection.emailserver.usessl;
			connFileInfo.emailserver.usetls = rbConnection.connection.emailserver.usetls;
			connFileInfo.emailserver.fromaddress = rbConnection.connection.emailserver.fromaddress;
			connFileInfo.emailserver.name = rbConnection.connection.emailserver.name;

			connectionFiles.add(connFileInfo);

		}

		return connectionFiles.stream();

	}

	public DocumentBursterConnectionSettings loadSettingsConnection(String connectionFilePath) throws Exception {

		Settings settings = new Settings();
		settings.loadSettingsConnection(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + connectionFilePath);

		return settings.connectionSettings;
	}

	public void saveSettingsConnection(DocumentBursterConnectionSettings settings, String connectionFilePath)
			throws Exception {

		JAXBContext jc = JAXBContext.newInstance(DocumentBursterConnectionSettings.class);
		Marshaller marshaller = jc.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

		try (OutputStream os = new FileOutputStream(connectionFilePath)) {
			marshaller.marshal(settings, os);
		}
	}

	public DocumentBursterSettingsInternal loadSettingsInternal(String internalConfigFilePath) throws Exception {

		Settings settings = new Settings();
		settings.loadSettingsInternal(internalConfigFilePath);

		return settings.docSettingsInternal;
	}

	public void saveSettingsInternal(DocumentBursterSettingsInternal dbSettingsInternal, String internalConfigFilePath)
			throws Exception {

		JAXBContext jc = JAXBContext.newInstance(DocumentBursterSettingsInternal.class);
		Marshaller marshaller = jc.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

		try (OutputStream os = new FileOutputStream(internalConfigFilePath)) {
			marshaller.marshal(dbSettingsInternal, os);
		}

	}

	public Stream<ConfigurationFileInfo> loadRbTemplatesAll() throws Exception {

		List<ConfigurationFileInfo> templateFiles = new ArrayList<ConfigurationFileInfo>();

		// AppPaths.CONFIG_DIR_PATH + "/burst"
		List<String> matching = new ArrayList<String>();

		matching.add("*.docx");
		matching.add("*.html");

		Optional<Boolean> files = Optional.of(true);
		Optional<Boolean> directories = Optional.of(false);
		Optional<Boolean> recursive = Optional.of(true);
		Optional<Boolean> ignoreCase = Optional.of(true);

		FindCriteria criteria = new FindCriteria(matching, files, directories, recursive, ignoreCase);

		List<String> reportTemplatesFilePaths = systemService.unixCliFind(AppPaths.TEMPLATES_DIR_PATH + "/reports",
				criteria);

		List<String> samplesTemplatesFilePaths = systemService.unixCliFind(AppPaths.SAMPLES_DIR_PATH + "/reports",
				criteria);

		List<String> templateFilePaths = new ArrayList<>();
		templateFilePaths.addAll(reportTemplatesFilePaths);
		templateFilePaths.addAll(samplesTemplatesFilePaths);

		for (String filePath : templateFilePaths) {
			String reportTemplateFileName = Paths.get(filePath).getFileName().toString();
			String folderName = Paths.get(filePath).getParent().getFileName().toString();

			String relativeFilePath = filePath.replace("templates/reports/", "");
			String tplType = "template-report";

			if (filePath.contains("samples/reports")) {
				tplType = "template-report-sample";
				relativeFilePath = filePath.replace("samples/reports/", "");
			}

			ConfigurationFileInfo templateFile = new ConfigurationFileInfo();
			templateFile.fileName = reportTemplateFileName;
			templateFile.filePath = filePath.replace("\\", "/");
			templateFile.folderName = folderName;
			templateFile.type = tplType;

			templateFile.relativeFilePath = relativeFilePath;

			templateFiles.add(templateFile);
		}

		return templateFiles.stream();
	}

}
