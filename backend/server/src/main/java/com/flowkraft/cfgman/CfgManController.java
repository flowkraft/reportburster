package com.flowkraft.cfgman;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.common.AppPaths;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterSettingsInternal;
import com.sourcekraft.documentburster.common.settings.model.ReportingSettings;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/cfgman", produces = MediaType.APPLICATION_JSON_VALUE)
public class CfgManController {

	@Autowired
	DocumentBursterSettingsService rbSettingsService;

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

		return Mono.just(
				rbSettingsService.loadSettingsReporting(fullPath));

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

	@GetMapping(value = "/rb/load-connection")
	public Mono<DocumentBursterConnectionSettings> loadRbSettingsConnection(@RequestParam String path)
			throws Exception {

		// System.out.println("loadRbSettingsConnection path = " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		return Mono.just(rbSettingsService
				.loadSettingsConnection(fullPath));

	}

	@PostMapping(value = "/rb/save-connection")
	public void saveRbReportSettingsConnection(@RequestParam String path,
			@RequestBody DocumentBursterConnectionSettings dbSettings) throws Exception {

		// System.out.println("saveRbReportSettingsReporting dbSettings = " +
		// dbSettings);
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		rbSettingsService.saveSettingsConnection(dbSettings,
				fullPath);

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

}
