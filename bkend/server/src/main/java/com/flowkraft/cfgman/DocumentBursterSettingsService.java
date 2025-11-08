package com.flowkraft.cfgman;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.dtos.FindCriteriaDto;
import com.flowkraft.jobman.services.SystemService;
import com.sourcekraft.documentburster.common.reportparameters.ReportParametersHelper;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.ConfigurationFileInfo;
import com.sourcekraft.documentburster.common.settings.model.ConnectionFileInfo;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionEmailSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettingsInternal;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;

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

		// CORRECTED: Construct the DTO using orElse(null)
		FindCriteriaDto criteriaDto = new FindCriteriaDto(matching, files.orElse(null), // Use orElse(null) here
				directories.orElse(null), // Use orElse(null) here
				recursive.orElse(null), // Use orElse(null) here
				ignoreCase.orElse(null) // Use orElse(null) here
		);

		// System.out.println("burst folder path = " + AppPaths.CONFIG_DIR_PATH +
		// "/burst");

		List<String> burstConfigFilePaths = systemService.unixCliFind(AppPaths.CONFIG_DIR_PATH + "/burst", criteriaDto);

		// System.out.println("burstConfigFilePaths = " + burstConfigFilePaths);

		// AppPaths.CONFIG_DIR_PATH + "/reports"
		matching = new ArrayList<String>();

		matching.add("settings.xml");
		files = Optional.of(true);
		directories = Optional.of(false);
		recursive = Optional.of(true);
		ignoreCase = Optional.of(true);

		criteriaDto = new FindCriteriaDto(matching, files.orElse(null), directories.orElse(null),
				recursive.orElse(null), ignoreCase.orElse(null));

		List<String> reportsConfigFilePaths = systemService.unixCliFind(AppPaths.CONFIG_DIR_PATH + "/reports",
				criteriaDto);

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
				criteriaDto);

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
				String scriptOptionsSelectFileExplorer = "globpattern";

				if (filePath.contains("config/reports/" + folderName)) {
					typeOfConfiguration = "config-reports";
					templateRelativeFilePath = "./config/reports/" + folderName + "/settings.xml";

				} else if (filePath.contains("config/samples/" + folderName)) {
					typeOfConfiguration = "config-samples";
					templateRelativeFilePath = "./config/samples/" + folderName + "/settings.xml";
				}

				if (boolReportGenerationMailMerge) {
					String reportingXmlFilePath = Paths.get(fullFilePath).getParent().toString() + "/reporting.xml";

					String reportingXmlFileContent = systemService.unixCliCat(reportingXmlFilePath);

					// System.out.println("reportingXmlFileContent = " + reportingXmlFileContent);

					startPos = reportingXmlFileContent.indexOf("<type>") + "<type>".length();
					endPos = reportingXmlFileContent.indexOf("</type>");
					dsInputType = reportingXmlFileContent.substring(startPos, endPos).trim();

					startPos = reportingXmlFileContent.indexOf("<selectfileexplorer>")
							+ "<selectfileexplorer>".length();
					endPos = reportingXmlFileContent.indexOf("</selectfileexplorer>");
					if (startPos >= 0 && endPos > startPos)
						scriptOptionsSelectFileExplorer = reportingXmlFileContent.substring(startPos, endPos).trim();

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
				configFile.scriptOptionsSelectFileExplorer = scriptOptionsSelectFileExplorer;
				configFile.visibility = strVisibility;
				configFile.notes = StringUtils.EMPTY;
				configFile.folderName = folderName;
				configFile.type = typeOfConfiguration;
				configFile.activeClicked = false;
				configFile.useEmlConn = boolUseEmailConnection;
				configFile.emlConnCode = strEmailConnectionCode;

				if (configFile.capReportGenerationMailMerge
						&& ("config-reports".equals(configFile.type) || "config-samples".equals(configFile.type))) {

					Path baseConfigDir;
					if ("config-reports".equals(configFile.type)) {
						baseConfigDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "reports");
					} else { // "config-samples"
						baseConfigDir = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, "config", "samples");
					}
					Path itemDir = baseConfigDir.resolve(configFile.folderName);
					String paramsSpecFileName = configFile.folderName + "-report-parameters-spec.groovy";
					Path paramsSpecPath = itemDir.resolve(paramsSpecFileName);

					if (Files.exists(paramsSpecPath)) {
						configFile.reportParameters = ReportParametersHelper
								.parseGroovyParametersDslCode(Files.readString(paramsSpecPath));
					}

				}

				configurationFiles.add(configFile);
			}

		}

		// System.out.println("configurationFiles = " + configurationFiles);

		return configurationFiles.stream();

	}

	public DocumentBursterSettings loadSettings(String configFilePath) throws Exception {
		Settings settings = new Settings(configFilePath);
		return settings.loadSettings();
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

		Settings settings = new Settings(configFilePath);
		settings.loadSettings();
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

	public Stream<ConnectionFileInfo> loadSettingsConnectionEmailAll() throws Exception {

		List<ConnectionFileInfo> connectionFiles = new ArrayList<ConnectionFileInfo>();

		// AppPaths.CONFIG_DIR_PATH + "/burst"
		List<String> matching = new ArrayList<String>();

		matching.add("*.xml");
		Optional<Boolean> files = Optional.of(true);
		Optional<Boolean> directories = Optional.of(false);
		Optional<Boolean> recursive = Optional.of(false);
		Optional<Boolean> ignoreCase = Optional.of(true);

		FindCriteriaDto criteriaDto = new FindCriteriaDto(matching, files.orElse(null), directories.orElse(null),
				recursive.orElse(null), ignoreCase.orElse(null));

		List<String> connectionFilePaths = systemService.unixCliFind(AppPaths.CONFIG_DIR_PATH + "/connections",
				criteriaDto);

		// System.out.println("List<String> connectionFilePaths = " +
		// connectionFilePaths.toString());

		for (String filePath : connectionFilePaths) {

			String connectionFileName = Paths.get(filePath).getFileName().toString();

			DocumentBursterConnectionEmailSettings rbConnection = this.loadSettingsConnectionEmail(filePath);

			// System.out.println("rbConnection = " + rbConnection.toString());

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

	public DocumentBursterConnectionEmailSettings loadSettingsConnectionEmail(String connectionCode) throws Exception {

		Settings settings = new Settings(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/burst/settings.xml");

		settings.loadSettingsConnectionEmail(connectionCode);

		// System.out.println(
		// "DocumentBursterConnectionEmailSettings settings.connectionEmailSettings = "
		// + settings.connectionEmailSettings.toString());

		return settings.connectionEmailSettings;
	}

	public void saveSettingsConnectionEmail(DocumentBursterConnectionEmailSettings settings, String connectionFilePath)
			throws Exception {

		JAXBContext jc = JAXBContext.newInstance(DocumentBursterConnectionEmailSettings.class);
		Marshaller marshaller = jc.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

		try (OutputStream os = new FileOutputStream(connectionFilePath)) {
			marshaller.marshal(settings, os);
		}
	}

	// DATABASE START
	public Stream<ConnectionFileInfo> loadSettingsConnectionDatabaseAll() throws Exception {
		File connectionsFolder = new File(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/" + "config/connections");

		if (!connectionsFolder.exists()) {
			return Stream.empty();
		}

		// Get all folders that start with "db-" instead of files
		File[] connectionFolders = connectionsFolder
				.listFiles((dir, name) -> new File(dir, name).isDirectory() && name.toLowerCase().startsWith("db-"));

		if (connectionFolders == null || connectionFolders.length == 0) {
			return Stream.empty();
		}

		List<ConnectionFileInfo> connectionInfoFiles = new ArrayList<>();

		for (File connectionFolder : connectionFolders) {
			// Look for the main XML file inside the folder
			File mainXmlFile = new File(connectionFolder, connectionFolder.getName() + ".xml");

			if (mainXmlFile.exists()) {
				// Load the connection file
				DocumentBursterConnectionDatabaseSettings connectionSettings = loadSettingsConnectionDatabase(
						mainXmlFile.getAbsolutePath());

				if (connectionSettings != null && connectionSettings.connection != null) {
					ConnectionFileInfo connectionInfo = new ConnectionFileInfo();

					// Populate connection info
					connectionInfo.fileName = mainXmlFile.getName();
					connectionInfo.filePath = mainXmlFile.getAbsolutePath().replace("\\", "/");

					connectionInfo.connectionCode = connectionSettings.connection.code;

					connectionInfo.connectionName = connectionSettings.connection.name;
					connectionInfo.connectionType = "database-connection";

					connectionInfo.defaultConnection = connectionSettings.connection.defaultConnection;
					connectionInfo.usedBy = StringUtils.EMPTY;

					// Map all database server fields
					connectionInfo.dbserver.type = connectionSettings.connection.databaseserver.type;
					connectionInfo.dbserver.host = connectionSettings.connection.databaseserver.host;
					connectionInfo.dbserver.port = connectionSettings.connection.databaseserver.port;
					connectionInfo.dbserver.database = connectionSettings.connection.databaseserver.database;
					connectionInfo.dbserver.userid = connectionSettings.connection.databaseserver.userid;
					connectionInfo.dbserver.userpassword = connectionSettings.connection.databaseserver.userpassword;
					connectionInfo.dbserver.usessl = connectionSettings.connection.databaseserver.usessl;
					connectionInfo.dbserver.defaultquery = connectionSettings.connection.databaseserver.defaultquery;
					connectionInfo.dbserver.driver = connectionSettings.connection.databaseserver.driver;
					connectionInfo.dbserver.url = connectionSettings.connection.databaseserver.url;

					connectionInfoFiles.add(connectionInfo);
				}
			}

		}

		return connectionInfoFiles.stream();
	}

	public DocumentBursterConnectionDatabaseSettings loadSettingsConnectionDatabase(String filePath) throws Exception {
		File connectionFile = new File(filePath);

		if (!connectionFile.exists()) {
			throw new Exception("Database connection file not found: " + filePath);
		}

		try (FileInputStream inputStream = new FileInputStream(connectionFile)) {
			// Use JAXB to unmarshal the XML content
			JAXBContext jaxbContext = JAXBContext.newInstance(DocumentBursterConnectionDatabaseSettings.class);
			Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();

			return (DocumentBursterConnectionDatabaseSettings) unmarshaller.unmarshal(inputStream);
		}
	}

	public void saveSettingsConnectionDatabase(DocumentBursterConnectionDatabaseSettings dbSettings, String filePath)
			throws Exception {
		// Extract folder path from the file path
		File file = new File(filePath);
		File folderPath = file.getParentFile();

		// Create folder if it doesn't exist
		if (!folderPath.exists()) {
			folderPath.mkdirs();
		}

		// Rest of your saving logic...
		JAXBContext jaxbContext = JAXBContext.newInstance(DocumentBursterConnectionDatabaseSettings.class);
		Marshaller marshaller = jaxbContext.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

		try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
			marshaller.marshal(dbSettings, outputStream);
		}

	}
	// DATABASE END

	public DocumentBursterSettingsInternal loadSettingsInternal(String internalConfigFilePath) throws Exception {

		Settings settings = new Settings(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/burst/settings.xml");
		return settings.loadSettingsInternal();
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

		FindCriteriaDto criteriaDto = new FindCriteriaDto(matching, files.orElse(null), directories.orElse(null),
				recursive.orElse(null), ignoreCase.orElse(null));

		List<String> reportTemplatesFilePaths = systemService.unixCliFind(AppPaths.TEMPLATES_DIR_PATH + "/reports",
				criteriaDto);

		List<String> samplesTemplatesFilePaths = systemService.unixCliFind(AppPaths.SAMPLES_DIR_PATH + "/reports",
				criteriaDto);

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
