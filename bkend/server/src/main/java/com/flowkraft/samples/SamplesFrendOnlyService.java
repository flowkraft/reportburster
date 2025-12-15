package com.flowkraft.samples;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.dtos.FindCriteriaDto;
import com.flowkraft.jobman.services.SystemService;
import com.sourcekraft.documentburster.common.settings.model.ConfigurationFileInfo;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

/**
 * Service for managing frontend-only sample reports.
 * These are samples in config/samples/_frend/ that are meant for showcasing
 * web components (tabulator, chart, pivottable, parameters) in frend-grails.
 * 
 * Key features:
 * - Auto-generates missing settings.xml and reporting.xml from defaults
 * - Samples are NOT shown in main ReportBurster UI
 * - Uses lazy initialization for fast startup
 */
@Service
public class SamplesFrendOnlyService {

    private static final Logger log = LoggerFactory.getLogger(SamplesFrendOnlyService.class);
    
    /** Subfolder within config/samples/ where frend-only samples live */
    public static final String FREND_SAMPLES_SUBFOLDER = "_frend";

    @Autowired
    SystemService systemService;

    // Lazy-loaded cache of frend sample reports
    private List<ConfigurationFileInfo> cachedFrendSamples = null;
    private final Object cacheLock = new Object();

    /**
     * Get the base path for frend-only samples: config/samples/_frend/
     */
    public String getFrendSamplesBasePath() {
        return AppPaths.CONFIG_DIR_PATH + "/samples/" + FREND_SAMPLES_SUBFOLDER;
    }

    /**
     * Get all frend-only sample report configurations.
     * Lazy-loads samples on first access.
     */
    public List<ConfigurationFileInfo> getFrendSamples() throws Exception {
        synchronized (cacheLock) {
            if (cachedFrendSamples == null) {
                cachedFrendSamples = loadFrendSamplesFromDisk();
            }
            return cachedFrendSamples;
        }
    }

    /**
     * Get or provision a frend sample by its report-code (folder name).
     * If the sample exists but is missing settings.xml/reporting.xml, they will be auto-created.
     * 
     * @param reportCode The folder name (e.g., "report1", "chart-demo")
     * @return ConfigurationFileInfo for the sample, or null if folder doesn't exist
     */
    public ConfigurationFileInfo getOrProvisionFrendSample(String reportCode) throws Exception {
        String frendSamplesBase = getFrendSamplesBasePath();
        Path sampleDir = Paths.get(frendSamplesBase, reportCode);
        
        if (!Files.exists(sampleDir) || !Files.isDirectory(sampleDir)) {
            log.warn("Frend sample folder not found: {}", sampleDir);
            return null;
        }
        
        Path settingsPath = sampleDir.resolve("settings.xml");
        Path reportingPath = sampleDir.resolve("reporting.xml");
        
        boolean wasProvisioned = false;
        
        // Auto-create settings.xml if missing
        if (!Files.exists(settingsPath)) {
            log.info("Auto-creating settings.xml for frend sample: {}", reportCode);
            provisionSettingsXml(sampleDir, reportCode);
            wasProvisioned = true;
        }
        
        // Auto-create reporting.xml if missing
        if (!Files.exists(reportingPath)) {
            log.info("Auto-creating reporting.xml for frend sample: {}", reportCode);
            provisionReportingXml(sampleDir, reportCode);
            wasProvisioned = true;
        }
        
        // Clear cache if we provisioned new files
        if (wasProvisioned) {
            refreshFrendSamples();
        }
        
        // Load and return the sample config
        return loadFrendSampleConfig(settingsPath.toString());
    }

    /**
     * Get a specific frend sample by its file path.
     */
    public Optional<ConfigurationFileInfo> getFrendSampleByPath(String filePath) throws Exception {
        return getFrendSamples().stream()
                .filter(s -> s.filePath.equals(filePath))
                .findFirst();
    }
    
    /**
     * Get a specific frend sample by its report code (folder name).
     */
    public Optional<ConfigurationFileInfo> getFrendSampleByReportCode(String reportCode) throws Exception {
        return getFrendSamples().stream()
                .filter(s -> s.folderName.equals(reportCode))
                .findFirst();
    }

    /**
     * Reload frend samples from disk, clearing the cache.
     */
    public void refreshFrendSamples() {
        synchronized (cacheLock) {
            cachedFrendSamples = null;
        }
    }

    /**
     * Load frend sample configurations from the _frend directory.
     */
    private List<ConfigurationFileInfo> loadFrendSamplesFromDisk() throws Exception {
        List<ConfigurationFileInfo> samples = new ArrayList<>();

        String frendSamplesDir = getFrendSamplesBasePath();
        if (StringUtils.isBlank(frendSamplesDir) || !Files.exists(Paths.get(frendSamplesDir))) {
            log.debug("Frend samples directory does not exist: {}", frendSamplesDir);
            return samples;
        }

        // Find all settings.xml files in frend samples directory
        List<String> matching = new ArrayList<>();
        matching.add("settings.xml");

        FindCriteriaDto criteriaDto = new FindCriteriaDto(
                matching,
                true,   // files
                false,  // directories
                true,   // recursive
                true    // ignoreCase
        );

        List<String> sampleFilePaths = systemService.unixCliFind(frendSamplesDir, criteriaDto);

        for (String filePath : sampleFilePaths) {
            try {
                ConfigurationFileInfo info = loadFrendSampleConfig(filePath);
                if (info != null) {
                    samples.add(info);
                }
            } catch (Exception e) {
                log.error("Failed to load frend sample config: {} - {}", filePath, e.getMessage());
            }
        }

        return samples;
    }

    /**
     * Load a single frend sample configuration file.
     */
    private ConfigurationFileInfo loadFrendSampleConfig(String filePath) throws Exception {
        File file = new File(filePath);
        if (!file.exists()) {
            return null;
        }

        ConfigurationFileInfo info = new ConfigurationFileInfo();
        info.filePath = filePath;
        info.fileName = file.getName();

        // Extract sample name from parent directory (the report-code)
        Path path = Paths.get(filePath);
        if (path.getParent() != null) {
            info.folderName = path.getParent().getFileName().toString();
        }

        // Load the settings to get report metadata
        try (FileInputStream fis = new FileInputStream(file)) {
            JAXBContext jaxbContext = JAXBContext.newInstance(com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings.class);
            Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();
            com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings settings = 
                (com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings) unmarshaller.unmarshal(fis);
            
            // Use the template name from settings, or fall back to folder name
            if (settings.settings != null && settings.settings.template != null && !settings.settings.template.isBlank()) {
                info.templateName = settings.settings.template;
            } else {
                info.templateName = toCamelCaseDisplayName(info.folderName);
            }
        }

        return info;
    }
    
    /**
     * Provision settings.xml from defaults for a frend sample.
     */
    private void provisionSettingsXml(Path sampleDir, String reportCode) throws Exception {
        String defaultSettingsPath = AppPaths.CONFIG_DIR_PATH + "/_defaults/settings.xml";
        Path targetPath = sampleDir.resolve("settings.xml");
        
        // Copy from defaults
        FileUtils.copyFile(new File(defaultSettingsPath), targetPath.toFile());
        
        // Read and customize
        String content = FileUtils.readFileToString(targetPath.toFile(), "UTF-8");
        
        String displayName = toCamelCaseDisplayName(reportCode);
        
        // Replace template name
        content = content.replace("<template>My Reports</template>", 
                                  "<template>" + displayName + "</template>");
        
        // Set up for report generation (not distribution)
        content = content.replace("<reportdistribution>true</reportdistribution>",
                                  "<reportdistribution>false</reportdistribution>");
        content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
                                  "<reportgenerationmailmerge>true</reportgenerationmailmerge>");
        
        FileUtils.writeStringToFile(targetPath.toFile(), content, "UTF-8");
        log.info("Created settings.xml for frend sample: {}", reportCode);
    }
    
    /**
     * Provision reporting.xml from defaults for a frend sample.
     */
    private void provisionReportingXml(Path sampleDir, String reportCode) throws Exception {
        String defaultReportingPath = AppPaths.CONFIG_DIR_PATH + "/_defaults/reporting.xml";
        Path targetPath = sampleDir.resolve("reporting.xml");

        // Copy from defaults
        FileUtils.copyFile(new File(defaultReportingPath), targetPath.toFile());

        // Read and customize - set output type to HTML by default for web components
        String content = FileUtils.readFileToString(targetPath.toFile(), "UTF-8");

        content = content.replace("ds.csvfile", "ds.scriptfile");

        // connection to sample northwind sqlite DB
        content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
                "<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

        String dsScriptName = reportCode + "-script.groovy";
        content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
                "<scriptname>" + dsScriptName + "</scriptname>");

        // Write updated reporting.xml
        FileUtils.writeStringToFile(targetPath.toFile(), content, "UTF-8");

        // Create empty Groovy script file in same folder
        Path scriptPath = sampleDir.resolve(dsScriptName);
        if (!Files.exists(scriptPath)) {
            Files.createFile(scriptPath);
            log.info("Created empty script file: {}", scriptPath);
        }

        log.info("Created reporting.xml for frend sample: {}", reportCode);
    }

    
    private String toCamelCaseDisplayName(String folderName) {
        if (StringUtils.isBlank(folderName)) {
            return folderName;
        }
        
        // Split by hyphen, underscore, or camelCase boundaries
        String[] parts = folderName.split("[-_]");
        
        return Arrays.stream(parts)
                .filter(StringUtils::isNotBlank)
                .map(part -> StringUtils.capitalize(part.toLowerCase()))
                .collect(Collectors.joining(""));
    }

    /**
     * Get sample data for a specific frend sample report.
     * This would load the actual data file associated with the sample.
     */
    public Map<String, Object> getFrendSampleData(String reportCode) throws Exception {
        Map<String, Object> result = new HashMap<>();
        
        String frendSamplesBase = getFrendSamplesBasePath();
        Path sampleDir = Paths.get(frendSamplesBase, reportCode);
        
        if (!Files.exists(sampleDir)) {
            throw new IllegalArgumentException("Frend sample not found: " + reportCode);
        }

        // Look for data files (CSV, JSON) in the sample directory
        if (Files.exists(sampleDir)) {
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

        result.put("reportCode", reportCode);
        result.put("sampleDir", sampleDir.toString());
        return result;
    }
    
    /**
     * Check if a report code belongs to a frend-only sample.
     * This is used to exclude _frend samples from the main UI.
     */
    public boolean isFrendOnlySample(String configFilePath) {
        if (StringUtils.isBlank(configFilePath)) {
            return false;
        }
        // Normalize path separators and check if path contains /samples/_frend/
        String normalized = configFilePath.replace("\\", "/");
        return normalized.contains("/samples/_frend/");
    }
}
