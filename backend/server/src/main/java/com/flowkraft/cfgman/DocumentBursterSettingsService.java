package com.flowkraft.cfgman;

import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.file.Paths;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;

import org.springframework.stereotype.Service;

import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettingsInternal;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;

@Service
public class DocumentBursterSettingsService {

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

	public DocumentBursterConnectionSettings loadSettingsConnection(String connectionFilePath) throws Exception {

		Settings settings = new Settings();
		settings.loadSettingsConnection(connectionFilePath);

		return settings.connectionSettings;
	}

	public void saveSettingsConnection(DocumentBursterConnectionSettings settings, String connectionFilePath) throws Exception {

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

	public void saveSettingsInternal(DocumentBursterSettingsInternal dbSettingsInternal, String internalConfigFilePath) throws Exception {

		JAXBContext jc = JAXBContext.newInstance(DocumentBursterSettingsInternal.class);
		Marshaller marshaller = jc.createMarshaller();
		marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);

		try (OutputStream os = new FileOutputStream(internalConfigFilePath)) {
			marshaller.marshal(dbSettingsInternal, os);
		}

	}

}
