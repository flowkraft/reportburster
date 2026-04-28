package com.flowkraft.system.services;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.system.dtos.FindCriteriaDto;
import com.flowkraft.system.models.SystemInfo;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettingsInternal;
import com.sourcekraft.documentburster.utils.Utils;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;

@Service
public class SystemService {

	@Autowired
	private FileSystemService fileSystemService;

	@Autowired
	private DockerService dockerService;

	public SystemInfo getSystemInfo() throws Exception {
		// Ensure Docker cache is fresh before returning status to the caller.
		dockerService.refreshDockerIfStale(false, false);

		SystemInfo info = new SystemInfo();
		info.osName = System.getProperty("os.name");
		info.osVersion = System.getProperty("os.version");
		info.userName = System.getProperty("user.name");
		info.osArch = System.getProperty("os.arch");
		info.product = "DataPallas";

		List<String> matching = new ArrayList<String>();

		matching.add("startServer.*");
		Optional<Boolean> files = Optional.of(true);
		Optional<Boolean> directories = Optional.of(false);
		Optional<Boolean> recursive = Optional.of(false);
		Optional<Boolean> ignoreCase = Optional.of(false);

		FindCriteriaDto criteria = new FindCriteriaDto(matching, files.orElse(null),
				directories.orElse(null),
				recursive.orElse(null),
				ignoreCase.orElse(null));

		List<String> startServerScripts = fileSystemService.unixCliFind(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, criteria);
		if (!Objects.isNull(startServerScripts) && startServerScripts.size() > 0)
			info.product = "DataPallas Server";

		// Use cached Docker probe results
		info.isDockerDaemonRunning = dockerService.isCachedDockerDaemonRunning();
		info.dockerVersion = dockerService.getCachedDockerVersion();
		info.isDockerInstalled = !"DOCKER_NOT_INSTALLED".equals(dockerService.getCachedDockerVersion())
			&& !"DOCKER_NOT_CHECKED".equals(dockerService.getCachedDockerVersion());
		info.isChocoOk = false;
		info.chocoVersion = "CHOCO_NOT_CHECKED_YET";

		return info;

	}

	public DocumentBursterSettingsInternal loadInternalSettings() throws Exception {
		String path = Utils.resolvePathAgainstPortableDir("config/_internal/settings.xml");
		JAXBContext jc = JAXBContext.newInstance(DocumentBursterSettingsInternal.class);
		Unmarshaller u = jc.createUnmarshaller();
		try (FileInputStream fis = new FileInputStream(path)) {
			return (DocumentBursterSettingsInternal) u.unmarshal(fis);
		}
	}

	public void saveInternalSettings(DocumentBursterSettingsInternal settings) throws Exception {
		String path = Utils.resolvePathAgainstPortableDir("config/_internal/settings.xml");
		File f = new File(path);
		f.getParentFile().mkdirs();
		JAXBContext jc = JAXBContext.newInstance(DocumentBursterSettingsInternal.class);
		Marshaller m = jc.createMarshaller();
		m.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);
		try (OutputStream os = new FileOutputStream(f)) {
			m.marshal(settings, os);
		}
		Settings.invalidateShowSamplesCache();
	}

}
