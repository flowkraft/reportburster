package com.flowkraft.cfgman;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.common.AppPaths;
import com.flowkraft.common.Utils;
import com.flowkraft.jobman.services.IOUtilsService;
import com.flowkraft.jobman.services.SystemService;
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
@RequestMapping(value = "/api/cfgman")
public class CfgManController {

	@Autowired
	DocumentBursterSettingsService rbSettingsService;

	@Autowired
	SystemService systemService;

	@Autowired
	IOUtilsService ioUtilsService;

	@GetMapping(value = "/rb/load-all")
	public Flux<ConfigurationFileInfo> loadRbSettingsAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadSettingsAll());
	}

	@GetMapping(value = "/rb/load")
	public Mono<DocumentBursterSettings> loadRbSettings(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("Loading path: " + path);
		DocumentBursterSettings dbSettings = rbSettingsService.loadSettings(fullPath);
		// System.out.println("/rb/load/dbSettings.attachments.size: " +
		// dbSettings.settings.attachments.items.attachmentItems.size());

		return Mono.just(dbSettings);

	}

	@PostMapping(value = "/rb/save")
	public void saveRbSettings(@RequestParam String path, @RequestBody DocumentBursterSettings dbSettings)
			throws Exception {

		// System.out.println("/rb/save path: " + path);
		// System.out.println("/rb/save/dbSettings.settings: " + dbSettings.settings);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		rbSettingsService.saveSettings(dbSettings, fullPath);

	}

	@GetMapping(value = "/rb/load-reporting")
	public Mono<ReportingSettings> loadRbSettingsReporting(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		return Mono.just(rbSettingsService.loadSettingsReporting(fullPath));

	}

	@PostMapping(value = "/rb/save-reporting")
	public void saveRbReportSettingsReporting(@RequestParam String path, @RequestBody ReportingSettings dbSettings)
			throws Exception {

		// System.out.println("saveRbReportSettingsReporting dbSettings = " +
		// dbSettings);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		rbSettingsService.saveSettingsReporting(dbSettings, fullPath);

	}

	@GetMapping(value = "/rb/load-connection-email-all")
	public Flux<ConnectionFileInfo> loadRbSettingsConnectionEmailAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadSettingsConnectionEmailAll());
	}

	@GetMapping(value = "/rb/load-connection-email")
	public Mono<DocumentBursterConnectionEmailSettings> loadRbSettingsConnectionEmail(@RequestParam String path)
			throws Exception {

		// System.out.println("loadRbSettingsConnection path = " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		return Mono.just(rbSettingsService.loadSettingsConnectionEmail(fullPath));

	}

	@PostMapping(value = "/rb/save-connection-email")
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

		rbSettingsService.saveSettingsConnectionEmail(dbSettings, fullPath);

	}

	@GetMapping(value = "/rb/load-connection-database-all")
	public Flux<ConnectionFileInfo> loadRbSettingsConnectionDatabaseAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadSettingsConnectionDatabaseAll());
	}

	@GetMapping(value = "/rb/load-connection-database")
	public Mono<DocumentBursterConnectionDatabaseSettings> loadRbSettingsConnectionDatabase(@RequestParam String path)
			throws Exception {
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
		return Mono.just(rbSettingsService.loadSettingsConnectionDatabase(fullPath));
	}

	@PostMapping(value = "/rb/save-connection-database")
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

		rbSettingsService.saveSettingsConnectionDatabase(dbSettings, fullPath);
	}

	@GetMapping(value = "/rb/load-internal")
	public Mono<DocumentBursterSettingsInternal> loadRbSettingsInternal(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		return Mono.just(rbSettingsService.loadSettingsInternal(fullPath));

	}

	@PostMapping(value = "/rb/save-internal")
	public void saveRbSettingsInternal(@RequestParam String path,
			@RequestBody DocumentBursterSettingsInternal dbSettingsInternal) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		rbSettingsService.saveSettingsInternal(dbSettingsInternal, fullPath);

	}

	@GetMapping(value = "/rb/load-templates-all")
	public Flux<ConfigurationFileInfo> loadRbTemplatesAll() throws Exception {
		return Flux.fromStream(rbSettingsService.loadRbTemplatesAll());
	}

	@PostMapping(value = "/rb/save-template", consumes = "text/plain")
	Mono<Void> saveTemplate(@RequestParam String path, @RequestBody Optional<String> content) throws Exception {

		// System.out.println("/fs/write-string-to-file content = " + content);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("/fs/write-string-to-file fullPath = " + fullPath);

		return Mono.fromCallable(() -> {
			systemService.fsWriteStringToFile(fullPath, content);
			return null;
		});
	}

	@GetMapping(value = "/rb/load-template", produces = MediaType.TEXT_PLAIN_VALUE)
	Mono<String> readFileToString(@RequestParam String path) throws Exception {
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

		// Ensure systemService.unixCliCat can handle the corrected fullPath
		String fileContent = systemService.unixCliCat(fullPath);
		// Return empty string if content is null to avoid potential NPEs downstream
		// and align with previous behavior causing JSON parse error on failure.
		return Mono.just(fileContent != null ? fileContent : "");

	}

	@GetMapping(value = "/rb/serve-asset", produces = MediaType.ALL_VALUE)
	public Mono<ResponseEntity<?>> serveAsset(@RequestParam String path) throws Exception {
		// System.out.println("========== SERVE ASSET ENDPOINT CALLED ==========");
		// System.out.println("Path requested: " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("Full path: " + fullPath);

		// Determine content type based on file extension
		String contentType = determineContentType(fullPath);
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
				String fileContent = systemService.unixCliCat(fullPath);
				return ResponseEntity.ok().header("Content-Type", contentType) // Set content type explicitly
						.header("Accept", "*/*") // Accept any content type
						.body(fileContent);
			});
		}
	}

	@GetMapping(value = "/rb/view-template", produces = MediaType.TEXT_HTML_VALUE)
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
				htmlContent = systemService.unixCliCat(fullPath);
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
					img.attr("src", "/api/cfgman/rb/serve-asset?path=" + Utils.encodeURIComponent(baseDir + src));
				}
			}

			// Fix CSS links
			Elements links = doc.select("link[href]");
			for (Element link : links) {
				String href = link.attr("href");
				if (!href.startsWith("http") && !href.startsWith("data:") && !href.startsWith("/api/")) {
					// Remove ./ if present
					href = href.replaceFirst("^\\./", "");
					link.attr("href", "/api/cfgman/rb/serve-asset?path=" + Utils.encodeURIComponent(baseDir + href));
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
							"background-image: url('/api/cfgman/rb/serve-asset?path=" + baseDir + path1 + "')");
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
							"src: url('/api/cfgman/rb/serve-asset?path=" + baseDir + path1 + "')");
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
							"background-image: url('/api/cfgman/rb/serve-asset?path=" + baseDir + path1 + "')");
				}
				matcher.appendTail(sb);
				el.attr("style", sb.toString());
			}

			// Convert back to HTML string
			String processedHtml = doc.outerHtml();

			return ResponseEntity.ok().header("Content-Type", "text/html").body(processedHtml);
		});
	}

	private String determineContentType(String filePath) {
		String extension = "";
		int i = filePath.lastIndexOf('.');
		if (i > 0) {
			extension = filePath.substring(i + 1).toLowerCase();
		}

		switch (extension) {
		// Images
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "gif":
			return "image/gif";
		case "svg":
			return "image/svg+xml";
		case "webp":
			return "image/webp";
		case "ico":
			return "image/x-icon";
		case "bmp":
			return "image/bmp";

		// Web fonts
		case "woff":
			return "font/woff";
		case "woff2":
			return "font/woff2";
		case "ttf":
			return "font/ttf";
		case "eot":
			return "application/vnd.ms-fontobject";
		case "otf":
			return "font/otf";

		// Web assets
		case "css":
			return "text/css";
		case "js":
			return "application/javascript";
		case "json":
			return "application/json";
		case "xml":
			return "application/xml";
		case "html":
		case "htm":
			return "text/html";
		case "txt":
			return "text/plain";

		// Default binary
		default:
			return "application/octet-stream";
		}
	}
}
