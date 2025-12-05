package com.flowkraft.samples;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.dtos.FindCriteriaDto;
import com.flowkraft.jobman.services.SystemService;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.ConfigurationFileInfo;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;

import jakarta.annotation.PostConstruct;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

/**
 * Service for managing sample reports.
 * Uses lazy initialization pattern for fast startup - samples are only loaded when first requested.
 */
@Service
public class SamplesBackendService {

    @Autowired
    SystemService systemService;

    // Lazy-loaded cache of sample reports
    private List<ConfigurationFileInfo> cachedSamples = null;
    private final Object cacheLock = new Object();

    /**
     * Get all sample report configurations.
     * Lazy-loads samples on first access.
     */
    public List<ConfigurationFileInfo> getSamples() throws Exception {
        synchronized (cacheLock) {
            if (cachedSamples == null) {
                cachedSamples = loadSamplesFromDisk();
            }
            return cachedSamples;
        }
    }

    /**
     * Get a specific sample by its file path.
     */
    public Optional<ConfigurationFileInfo> getSampleByPath(String filePath) throws Exception {
        return getSamples().stream()
                .filter(s -> s.filePath.equals(filePath))
                .findFirst();
    }

    /**
     * Reload samples from disk, clearing the cache.
     */
    public void refreshSamples() {
        synchronized (cacheLock) {
            cachedSamples = null;
        }
    }

    /**
     * Load sample configurations from the samples directory.
     */
    private List<ConfigurationFileInfo> loadSamplesFromDisk() throws Exception {
        List<ConfigurationFileInfo> samples = new ArrayList<>();

        String samplesDir = AppPaths.SAMPLES_DIR_PATH;
        if (StringUtils.isBlank(samplesDir) || !Files.exists(Paths.get(samplesDir))) {
            return samples;
        }

        // Find all settings.xml files in samples directory
        List<String> matching = new ArrayList<>();
        matching.add("settings.xml");

        FindCriteriaDto criteriaDto = new FindCriteriaDto(
                matching,
                true,   // files
                false,  // directories
                true,   // recursive
                true    // ignoreCase
        );

        List<String> sampleFilePaths = systemService.unixCliFind(samplesDir, criteriaDto);

        for (String filePath : sampleFilePaths) {
            try {
                ConfigurationFileInfo info = loadSampleConfig(filePath);
                if (info != null) {
                    samples.add(info);
                }
            } catch (Exception e) {
                // Log but continue loading other samples
                System.err.println("Failed to load sample config: " + filePath + " - " + e.getMessage());
            }
        }

        return samples;
    }

    /**
     * Load a single sample configuration file.
     */
    private ConfigurationFileInfo loadSampleConfig(String filePath) throws Exception {
        File file = new File(filePath);
        if (!file.exists()) {
            return null;
        }

        ConfigurationFileInfo info = new ConfigurationFileInfo();
        info.filePath = filePath;
        info.fileName = file.getName();

        // Extract sample name from parent directory
        Path path = Paths.get(filePath);
        if (path.getParent() != null) {
            info.folderName = path.getParent().getFileName().toString();
        }

        // Load the settings to get report metadata
        try (FileInputStream fis = new FileInputStream(file)) {
            JAXBContext jaxbContext = JAXBContext.newInstance(ReportingSettings.class);
            Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();
            ReportingSettings settings = (ReportingSettings) unmarshaller.unmarshal(fis);
            
            // Use folder name as template name
            info.templateName = info.folderName;
        }

        return info;
    }

    /**
     * Get sample data for a specific sample report.
     * This would load the actual data file associated with the sample.
     */
    public Map<String, Object> getSampleData(String samplePath) throws Exception {
        Map<String, Object> result = new HashMap<>();
        
        Path settingsPath = Paths.get(samplePath);
        if (!Files.exists(settingsPath)) {
            throw new IllegalArgumentException("Sample not found: " + samplePath);
        }

        // Look for data files (CSV, JSON) in the same directory
        Path sampleDir = settingsPath.getParent();
        if (sampleDir != null && Files.exists(sampleDir)) {
            // Find data files
            try (Stream<Path> files = Files.list(sampleDir)) {
                files.filter(p -> {
                    String name = p.getFileName().toString().toLowerCase();
                    return name.endsWith(".csv") || name.endsWith(".json");
                }).findFirst().ifPresent(dataFile -> {
                    result.put("dataFile", dataFile.toString());
                    result.put("dataFileName", dataFile.getFileName().toString());
                });
            }
        }

        result.put("settingsPath", samplePath);
        return result;
    }
}
