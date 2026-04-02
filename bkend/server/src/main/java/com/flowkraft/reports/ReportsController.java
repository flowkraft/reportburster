package com.flowkraft.reports;

import java.io.File;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.flowkraft.common.MimeTypeUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.common.AppPaths;
import com.flowkraft.common.Utils;
import com.flowkraft.system.services.IOUtilsService;
import com.flowkraft.system.services.FileSystemService;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.ConfigurationFileInfo;
import com.sourcekraft.documentburster.common.settings.model.ConnectionFileInfo;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionEmailSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettingsInternal;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/reports")
public class ReportsController {

	private static final Logger log = LoggerFactory.getLogger(ReportsController.class);
	private static final String PASSWORD_MASK = "******";

	@Autowired
	ReportsService rbSettingsService;

	@Autowired
	FileSystemService fileSystemService;

	@Autowired
	IOUtilsService ioUtilsService;

	// ── Password masking helpers ──

	/**
	 * Replace all password/secret fields with PASSWORD_MASK before returning to
	 * the frontend.
	 */
	private void maskPasswords(DocumentBursterSettings dbSettings) {
		if (dbSettings == null || dbSettings.settings == null)
			return;

		if (dbSettings.settings.emailserver != null) {
			dbSettings.settings.emailserver.userpassword = PASSWORD_MASK;
		}
		if (dbSettings.settings.smssettings != null && dbSettings.settings.smssettings.twilio != null) {
			dbSettings.settings.smssettings.twilio.authtoken = PASSWORD_MASK;
			dbSettings.settings.smssettings.twilio.accountsid = PASSWORD_MASK;
		}
		if (dbSettings.settings.simplejavamail != null && dbSettings.settings.simplejavamail.proxy != null) {
			dbSettings.settings.simplejavamail.proxy.password = PASSWORD_MASK;
		}
	}

	/**
	 * When the frontend sends PASSWORD_MASK for a password field, load the
	 * existing encrypted value from disk so we never overwrite with the literal
	 * mask string.
	 */
	private void preserveExistingPasswords(DocumentBursterSettings incoming, String fullPath) {
		try {
			DocumentBursterSettings existing = rbSettingsService.loadSettings(fullPath);

			if (incoming.settings.emailserver != null
					&& PASSWORD_MASK.equals(incoming.settings.emailserver.userpassword)
					&& existing.settings.emailserver != null) {
				incoming.settings.emailserver.userpassword = existing.settings.emailserver.userpassword;
			}

			if (incoming.settings.smssettings != null && incoming.settings.smssettings.twilio != null) {
				if (PASSWORD_MASK.equals(incoming.settings.smssettings.twilio.authtoken)
						&& existing.settings.smssettings != null
						&& existing.settings.smssettings.twilio != null) {
					incoming.settings.smssettings.twilio.authtoken = existing.settings.smssettings.twilio.authtoken;
				}
				if (PASSWORD_MASK.equals(incoming.settings.smssettings.twilio.accountsid)
						&& existing.settings.smssettings != null
						&& existing.settings.smssettings.twilio != null) {
					incoming.settings.smssettings.twilio.accountsid = existing.settings.smssettings.twilio.accountsid;
				}
			}

			if (incoming.settings.simplejavamail != null && incoming.settings.simplejavamail.proxy != null
					&& PASSWORD_MASK.equals(incoming.settings.simplejavamail.proxy.password)
					&& existing.settings.simplejavamail != null
					&& existing.settings.simplejavamail.proxy != null) {
				incoming.settings.simplejavamail.proxy.password = existing.settings.simplejavamail.proxy.password;
			}
		} catch (Exception e) {
			log.warn("Failed to load existing settings for password preservation: {}", e.getMessage());
		}
	}

	private void maskConnectionEmailPassword(DocumentBursterConnectionEmailSettings settings) {
		if (settings != null && settings.connection != null && settings.connection.emailserver != null) {
			settings.connection.emailserver.userpassword = PASSWORD_MASK;
		}
	}

	private void maskConnectionDatabasePassword(DocumentBursterConnectionDatabaseSettings settings) {
		if (settings != null && settings.connection != null && settings.connection.databaseserver != null) {
			settings.connection.databaseserver.userpassword = PASSWORD_MASK;
		}
	}

	private void maskConnectionFileInfoPasswords(ConnectionFileInfo connFileInfo) {
		if (connFileInfo == null)
			return;
		if (connFileInfo.emailserver != null) {
			connFileInfo.emailserver.userpassword = PASSWORD_MASK;
		}
		if (connFileInfo.dbserver != null) {
			connFileInfo.dbserver.userpassword = PASSWORD_MASK;
		}
	}

	@GetMapping(value = "/load-all")
	public Flux<ConfigurationFileInfo> loadRbSettingsAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadSettingsAll());
	}

	/**
	 * MINIMAL LOADING - Fast startup endpoint.
	 * Returns only basic metadata needed for UI menus (no DSL parsing).
	 * Use loadConfigDetails() to get full DSL options for a specific config.
	 */
	@GetMapping(value = "/load-all-minimal")
	public Flux<ConfigurationFileInfo> loadRbSettingsAllMinimal() throws Exception {
		return Flux.fromStream(rbSettingsService.loadSettingsAllMinimal());
	}

	/**
	 * FULL DETAILS LOADING - On-demand endpoint for a specific configuration.
	 * Parses and returns DSL options (reportParameters, tabulatorOptions, etc.)
	 * 
	 * @param path The relative path to settings.xml (e.g., "/config/samples/_frend/sales-region-prod-qtr/settings.xml")
	 */
	@GetMapping(value = "/load-config-details")
	public Mono<ConfigurationFileInfo> loadConfigDetails(@RequestParam String path) throws Exception {
		String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
		ConfigurationFileInfo details = rbSettingsService.loadConfigDetails(decodedPath);
		return details != null ? Mono.just(details) : Mono.empty();
	}

	@GetMapping(value = "/load")
	public Mono<DocumentBursterSettings> loadRbSettings(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		DocumentBursterSettings dbSettings = rbSettingsService.loadSettings(fullPath);
		maskPasswords(dbSettings);

		return Mono.just(dbSettings);

	}

	@PostMapping(value = "/save")
	public void saveRbSettings(@RequestParam String path, @RequestBody DocumentBursterSettings dbSettings)
			throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		preserveExistingPasswords(dbSettings, fullPath);
		rbSettingsService.saveSettings(dbSettings, fullPath);

	}

	@GetMapping(value = "/load-reporting")
	public Mono<ReportingSettings> loadRbSettingsReporting(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		return Mono.just(rbSettingsService.loadSettingsReporting(fullPath));

	}

	@PostMapping(value = "/save-reporting")
	public void saveRbReportSettingsReporting(@RequestParam String path, @RequestBody ReportingSettings dbSettings)
			throws Exception {

		// System.out.println("saveRbReportSettingsReporting dbSettings = " +
		// dbSettings);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		rbSettingsService.saveSettingsReporting(dbSettings, fullPath);

	}

	@GetMapping(value = "/load-connection-email-all")
	public Flux<ConnectionFileInfo> loadRbSettingsConnectionEmailAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadSettingsConnectionEmailAll()
				.peek(this::maskConnectionFileInfoPasswords));
	}

	@GetMapping(value = "/load-connection-email")
	public Mono<DocumentBursterConnectionEmailSettings> loadRbSettingsConnectionEmail(@RequestParam String path)
			throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		DocumentBursterConnectionEmailSettings result = rbSettingsService.loadSettingsConnectionEmail(fullPath);
		maskConnectionEmailPassword(result);

		return Mono.just(result);

	}

	@PostMapping(value = "/save-connection-email")
	public void saveRbReportSettingsConnection(@RequestParam String path,
			@RequestBody DocumentBursterConnectionEmailSettings dbSettings) throws Exception {

		String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
		Path requestedPath = Paths.get(decodedPath);
		String fullPath;

		// Check if the decoded path from the request is already absolute
		if (requestedPath.isAbsolute()) {
			fullPath = decodedPath; // Use the absolute path directly
		} else {
			// If the path is relative, prepend the base directory
			fullPath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, decodedPath).toString();
		}

		// Preserve existing encrypted password if frontend sent the mask
		if (dbSettings.connection != null && dbSettings.connection.emailserver != null
				&& PASSWORD_MASK.equals(dbSettings.connection.emailserver.userpassword)) {
			try {
				DocumentBursterConnectionEmailSettings existing = rbSettingsService
						.loadSettingsConnectionEmail(fullPath);
				dbSettings.connection.emailserver.userpassword = existing.connection.emailserver.userpassword;
			} catch (Exception e) {
				log.warn("Failed to load existing email connection for password preservation: {}", e.getMessage());
			}
		}

		rbSettingsService.saveSettingsConnectionEmail(dbSettings, fullPath);

	}

	@GetMapping(value = "/load-connection-database-all")
	public Flux<ConnectionFileInfo> loadRbSettingsConnectionDatabaseAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadSettingsConnectionDatabaseAll()
				.peek(this::maskConnectionFileInfoPasswords));
	}

	@GetMapping(value = "/load-connection-database")
	public Mono<DocumentBursterConnectionDatabaseSettings> loadRbSettingsConnectionDatabase(@RequestParam String path)
			throws Exception {
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		DocumentBursterConnectionDatabaseSettings result = rbSettingsService.loadSettingsConnectionDatabase(fullPath);
		maskConnectionDatabasePassword(result);

		return Mono.just(result);
	}

	@PostMapping(value = "/save-connection-database")
	public void saveRbSettingsConnectionDatabase(@RequestParam String path,
			@RequestBody DocumentBursterConnectionDatabaseSettings dbSettings) throws Exception {

		String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
		Path requestedPath = Paths.get(decodedPath);
		String fullPath;

		// Check if the decoded path from the request is already absolute
		if (requestedPath.isAbsolute()) {
			fullPath = decodedPath; // Use the absolute path directly
		} else {
			// If the path is relative, prepend the base directory
			fullPath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, decodedPath).toString();
		}

		// Preserve existing encrypted password if frontend sent the mask
		if (dbSettings.connection != null && dbSettings.connection.databaseserver != null
				&& PASSWORD_MASK.equals(dbSettings.connection.databaseserver.userpassword)) {
			try {
				DocumentBursterConnectionDatabaseSettings existing = rbSettingsService
						.loadSettingsConnectionDatabase(fullPath);
				dbSettings.connection.databaseserver.userpassword = existing.connection.databaseserver.userpassword;
			} catch (Exception e) {
				log.warn("Failed to load existing database connection for password preservation: {}", e.getMessage());
			}
		}

		rbSettingsService.saveSettingsConnectionDatabase(dbSettings, fullPath);
	}

	@GetMapping(value = "/load-internal")
	public Mono<DocumentBursterSettingsInternal> loadRbSettingsInternal(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		return Mono.just(rbSettingsService.loadSettingsInternal(fullPath));

	}

	@PostMapping(value = "/save-internal")
	public void saveRbSettingsInternal(@RequestParam String path,
			@RequestBody DocumentBursterSettingsInternal dbSettingsInternal) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		rbSettingsService.saveSettingsInternal(dbSettingsInternal, fullPath);

	}

	@GetMapping(value = "/load-templates-all")
	public Flux<ConfigurationFileInfo> loadRbTemplatesAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadRbTemplatesAll());
	}

	@PostMapping(value = "/save-template", consumes = "text/plain")
	Mono<Void> saveTemplate(@RequestParam String path, @RequestBody Optional<String> content) throws Exception {

		// System.out.println("/fs/write-string-to-file content = " + content);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("/fs/write-string-to-file fullPath = " + fullPath);

		return Mono.fromCallable(() -> {
			fileSystemService.fsWriteStringToFile(fullPath, content);
			return null;
		});
	}

	@GetMapping(value = "/load-template", produces = MediaType.TEXT_PLAIN_VALUE)
	Mono<String> readFileToString(@RequestParam String path) throws Exception {
		String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
		// Strip leading slash so path is always treated as relative (on Linux,
		// "/samples/..." is absolute and would bypass the base directory prepend)
		String relPath = decodedPath.startsWith("/") ? decodedPath.substring(1) : decodedPath;
		String fullPath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, relPath).toString();

		
		//System.out.println("/load-template Full path: " + fullPath);

		// Ensure fileSystemService.unixCliCat can handle the corrected fullPath
		String fileContent = fileSystemService.unixCliCat(fullPath);
		// Return empty string if content is null to avoid potential NPEs downstream
		// and align with previous behavior causing JSON parse error on failure.
		return Mono.just(fileContent != null ? fileContent : "");

	}

	@GetMapping(value = "/serve-asset", produces = MediaType.ALL_VALUE)
	public Mono<ResponseEntity<?>> serveAsset(@RequestParam String path) throws Exception {
		// System.out.println("========== SERVE ASSET ENDPOINT CALLED ==========");
		// System.out.println("Path requested: " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("Full path: " + fullPath);

		// Determine content type based on file extension
		String contentType = MimeTypeUtils.determineContentType(fullPath);
		// System.out.println("Content type: " + contentType);

		// For images and binary files
		if (!contentType.startsWith("text/")) {
			return Mono.fromCallable(() -> {
				byte[] fileData = ioUtilsService.readBinaryFile(fullPath);
				return ResponseEntity.ok().header("Content-Type", contentType) // Set content type explicitly
						.header("Accept", "*/*") // Accept any content type
						.body(fileData);
			});
		}
		// For text files (CSS, JS, etc.)
		else {
			return Mono.fromCallable(() -> {
				String fileContent = fileSystemService.unixCliCat(fullPath);
				return ResponseEntity.ok().header("Content-Type", contentType) // Set content type explicitly
						.header("Accept", "*/*") // Accept any content type
						.body(fileContent);
			});
		}
	}

	@GetMapping(value = "/view-template", produces = MediaType.TEXT_HTML_VALUE)
	public Mono<ResponseEntity<String>> viewTemplate(@RequestParam String path) throws Exception {
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		boolean isXml = path.toLowerCase().endsWith(".xml");

		return Mono.fromCallable(() -> {
			// Read the HTML content
			String htmlContent = StringUtils.EMPTY;

			if (isXml) {
				// Parse XML using Settings and get EmailSettings.html
				Settings settings = new Settings(fullPath);

				settings.loadSettings();
				htmlContent = settings.getEmailSettings().html;
				if (htmlContent == null) {
					htmlContent = "<!-- No HTML email content found in XML -->";
				}
			} else {
				// Read the HTML content as before
				htmlContent = fileSystemService.unixCliCat(fullPath);
			}

			// Get the base directory from the path
			String baseDir = path.substring(0, path.lastIndexOf('/') + 1);

			// Process the HTML to fix relative URLs
			Document doc = Jsoup.parse(htmlContent);

			// Fix image sources
			Elements images = doc.select("img[src]");
			for (Element img : images) {
				String src = img.attr("src");
				if (!src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("/api/")) {
					// Remove ./ if present
					src = src.replaceFirst("^\\./", "");
					img.attr("src", "/api/reports/serve-asset?path=" + Utils.encodeURIComponent(baseDir + src));
				}
			}

			// Fix CSS links
			Elements links = doc.select("link[href]");
			for (Element link : links) {
				String href = link.attr("href");
				if (!href.startsWith("http") && !href.startsWith("data:") && !href.startsWith("/api/")) {
					// Remove ./ if present
					href = href.replaceFirst("^\\./", "");
					link.attr("href", "/api/reports/serve-asset?path=" + Utils.encodeURIComponent(baseDir + href));
				}
			}

			// Fix background images and font URLs in style elements
			Elements styles = doc.select("style");
			for (Element style : styles) {
				String css = style.html();

				// Fix background-image URLs
				Pattern bgPattern = Pattern
						.compile("background-image:\\s*url\\(['\"]((?!http|data:|/api)[^'\"]*)['\"]*\\)");
				Matcher bgMatcher = bgPattern.matcher(css);
				StringBuffer bgSb = new StringBuffer();
				while (bgMatcher.find()) {
					String path1 = bgMatcher.group(1).replaceFirst("^\\./", "");
					bgMatcher.appendReplacement(bgSb,
							"background-image: url('/api/reports/serve-asset?path=" + baseDir + path1 + "')");
				}
				bgMatcher.appendTail(bgSb);
				css = bgSb.toString();

				// Fix @font-face src URLs
				Pattern fontPattern = Pattern.compile("src:\\s*url\\(['\"]((?!http|data:|/api)[^'\"]*)['\"]*\\)");
				Matcher fontMatcher = fontPattern.matcher(css);
				StringBuffer fontSb = new StringBuffer();
				while (fontMatcher.find()) {
					String path1 = fontMatcher.group(1).replaceFirst("^\\./", "");
					fontMatcher.appendReplacement(fontSb,
							"src: url('/api/reports/serve-asset?path=" + baseDir + path1 + "')");
				}
				fontMatcher.appendTail(fontSb);
				css = fontSb.toString();

				style.html(css);
			}

			// Fix background images in style attributes
			Elements elementsWithStyle = doc.select("[style*=background-image]");
			for (Element el : elementsWithStyle) {
				String style = el.attr("style");
				Pattern pattern = Pattern
						.compile("background-image:\\s*url\\(['\"]((?!http|data:|/api)[^'\"]*)['\"]*\\)");
				Matcher matcher = pattern.matcher(style);
				StringBuffer sb = new StringBuffer();
				while (matcher.find()) {
					String path1 = matcher.group(1).replaceFirst("^\\./", "");
					matcher.appendReplacement(sb,
							"background-image: url('/api/reports/serve-asset?path=" + baseDir + path1 + "')");
				}
				matcher.appendTail(sb);
				el.attr("style", sb.toString());
			}

			// Inject web components bundle if dashboard components are present
			String rawHtml = doc.outerHtml();
			if (rawHtml.contains("<rb-tabulator") || rawHtml.contains("<rb-chart")
					|| rawHtml.contains("<rb-pivot-table") || rawHtml.contains("<rb-parameters")) {
				doc.body().appendElement("script")
						.attr("src", "/rb-webcomponents/rb-webcomponents.umd.js");
			}

			// Convert back to HTML string
			String processedHtml = doc.outerHtml();

			return ResponseEntity.ok().header("Content-Type", "text/html").body(processedHtml);
		});
	}


	// ── Phase 2: High-level atomic configuration endpoints ──

	@PostMapping(value = "/configurations", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<ConfigurationFileInfo>> createConfiguration(@RequestBody Map<String, Object> request)
			throws Exception {

		String reportId = (String) request.get("reportId");
		String templateName = (String) request.get("templateName");
		boolean capReportDistribution = Boolean.TRUE.equals(request.get("capReportDistribution"));
		boolean capReportGenerationMailMerge = Boolean.TRUE.equals(request.get("capReportGenerationMailMerge"));
		String copyFromReportId = (String) request.get("copyFromReportId");

		ConfigurationFileInfo result = rbSettingsService.createConfiguration(reportId, templateName,
				capReportDistribution, capReportGenerationMailMerge, copyFromReportId);

		return Mono.just(ResponseEntity.status(HttpStatus.CREATED).body(result));
	}

	@PostMapping(value = "/configurations/{reportId}/duplicate", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<ConfigurationFileInfo>> duplicateConfiguration(@PathVariable String reportId,
			@RequestBody Map<String, Object> request) throws Exception {

		String targetReportId = (String) request.get("targetReportId");
		String newTemplateName = (String) request.get("templateName");
		boolean capReportDistribution = Boolean.TRUE.equals(request.get("capReportDistribution"));
		boolean capReportGenerationMailMerge = Boolean.TRUE.equals(request.get("capReportGenerationMailMerge"));

		ConfigurationFileInfo result = rbSettingsService.duplicateConfiguration(reportId, targetReportId,
				newTemplateName, capReportDistribution, capReportGenerationMailMerge);

		return Mono.just(ResponseEntity.status(HttpStatus.CREATED).body(result));
	}

	@PostMapping(value = "/configurations/{reportId}/restore-defaults")
	public Mono<ResponseEntity<Void>> restoreDefaults(@PathVariable String reportId) throws Exception {
		rbSettingsService.restoreDefaults(reportId);
		return Mono.just(ResponseEntity.ok().build());
	}

	@DeleteMapping(value = "/configurations/{reportId}")
	public Mono<ResponseEntity<Void>> deleteConfiguration(@PathVariable String reportId) throws Exception {
		rbSettingsService.deleteConfiguration(reportId);
		return Mono.just(ResponseEntity.ok().build());
	}

	@PutMapping(value = "/configurations/{reportId}/visibility", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public Mono<ResponseEntity<Map<String, String>>> toggleVisibility(@PathVariable String reportId,
			@RequestBody Map<String, String> request) throws Exception {

		String newVisibility = request.get("visibility");
		String result = rbSettingsService.toggleVisibility(reportId, newVisibility);
		return Mono.just(ResponseEntity.ok(Map.of("visibility", result)));
	}

	// ── Phase 3: ID-based REST endpoints ──

	@GetMapping(value = "/{reportId}/settings", consumes = MediaType.ALL_VALUE)
	public Mono<DocumentBursterSettings> loadReportSettings(@PathVariable String reportId) throws Exception {
		String fullPath = resolveSettingsPath(reportId);
		DocumentBursterSettings dbSettings = rbSettingsService.loadSettings(fullPath);
		maskPasswords(dbSettings);
		return Mono.just(dbSettings);
	}

	@PutMapping(value = "/{reportId}/settings")
	public void saveReportSettings(@PathVariable String reportId, @RequestBody DocumentBursterSettings settings)
			throws Exception {
		String fullPath = resolveSettingsPath(reportId);
		preserveExistingPasswords(settings, fullPath);
		rbSettingsService.saveSettings(settings, fullPath);
	}

	@GetMapping(value = "/{reportId}/datasource", consumes = MediaType.ALL_VALUE)
	public Mono<ReportingSettings> loadReportDataSource(@PathVariable String reportId) throws Exception {
		String fullPath = resolveSettingsPath(reportId);
		return Mono.just(rbSettingsService.loadSettingsReporting(fullPath));
	}

	@PutMapping(value = "/{reportId}/datasource")
	public void saveReportDataSource(@PathVariable String reportId, @RequestBody ReportingSettings settings)
			throws Exception {
		String fullPath = resolveSettingsPath(reportId);
		rbSettingsService.saveSettingsReporting(settings, fullPath);
	}

	@GetMapping(value = "/{reportId}/template/{type}", produces = MediaType.TEXT_PLAIN_VALUE, consumes = MediaType.ALL_VALUE)
	public Mono<String> loadReportTemplate(@PathVariable String reportId, @PathVariable String type) throws Exception {
		String templatePath = resolveTemplatePath(reportId, type);
		String content = fileSystemService.unixCliCat(templatePath);
		return Mono.just(content != null ? content : "");
	}

	@PutMapping(value = "/{reportId}/template/{type}", consumes = "text/plain")
	public Mono<Void> saveReportTemplate(@PathVariable String reportId, @PathVariable String type,
			@RequestBody Optional<String> content) throws Exception {
		String templatePath = resolveTemplatePath(reportId, type);
		return Mono.fromCallable(() -> {
			fileSystemService.fsWriteStringToFile(templatePath, content);
			return null;
		});
	}

	// ── Simplified template endpoints (backend resolves path from config) ──

	@GetMapping(value = "/{reportId}/template", produces = MediaType.TEXT_PLAIN_VALUE, consumes = MediaType.ALL_VALUE)
	public Mono<String> loadReportTemplateAuto(@PathVariable String reportId) throws Exception {
		String templatePath = resolveTemplatePathFromConfig(reportId);
		if (templatePath == null || templatePath.isEmpty()) {
			return Mono.just("");
		}
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/" + templatePath;
		String content = fileSystemService.unixCliCat(fullPath);
		return Mono.just(content != null ? content : "");
	}

	@PutMapping(value = "/{reportId}/template", consumes = "text/plain")
	public Mono<Void> saveReportTemplateAuto(@PathVariable String reportId,
			@RequestBody Optional<String> content) throws Exception {
		String templatePath = resolveTemplatePathFromConfig(reportId);
		if (templatePath == null || templatePath.isEmpty()) {
			return Mono.empty();
		}
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/" + templatePath;
		return Mono.fromCallable(() -> {
			fileSystemService.fsWriteStringToFile(fullPath, content);
			return null;
		});
	}

	/**
	 * Resolve template file path by reading the report's reporting.xml config.
	 * The template path is stored in reporting.xml → report.template.documentpath
	 */
	private String resolveTemplatePathFromConfig(String reportId) {
		try {
			String settingsPath = resolveSettingsPath(reportId);
			String configDir = new File(settingsPath).getParent();
			String reportingPath = configDir + "/reporting.xml";

			if (!new File(reportingPath).exists()) {
				return null;
			}

			ReportingSettings reporting = rbSettingsService.loadSettingsReporting(settingsPath);
			if (reporting != null && reporting.report != null && reporting.report.template != null) {
				return reporting.report.template.retrieveTemplateFilePath();
			}
		} catch (Exception e) {
			// Config not found or parsing error — return null
		}
		return null;
	}

	// ── Private helpers for ID-based path resolution ──

	private String resolveSettingsPath(String reportId) {
		// Check reports first, then samples, then burst (legacy)
		String reportsPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/reports/" + reportId + "/settings.xml";
		if (new File(reportsPath).exists())
			return reportsPath;

		String samplesPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/samples/" + reportId + "/settings.xml";
		if (new File(samplesPath).exists())
			return samplesPath;

		String burstPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/config/burst/settings.xml";
		if ("burst".equals(reportId) && new File(burstPath).exists())
			return burstPath;

		// Default to reports path even if doesn't exist yet (for create)
		return reportsPath;
	}

	private String resolveTemplatePath(String reportId, String type) {
		// Template types: html, docx, xsl, fo, jrxml
		String extension = type;
		if ("fop2pdf".equals(type))
			extension = "xsl";
		if ("jasper".equals(type))
			extension = "jrxml";

		return AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/templates/reports/" + reportId + "/" + reportId + "-" + type
				+ "." + extension;
	}
}
