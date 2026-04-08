package com.flowkraft.system.controllers;

import java.io.File;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.flowkraft.common.AppPaths;
import com.flowkraft.system.dtos.DirCriteriaDto;
import com.flowkraft.system.dtos.FileCriteriaDto;
import com.flowkraft.system.dtos.FindCriteriaDto;
import com.flowkraft.system.dtos.InspectResultDto;
import com.flowkraft.system.dtos.ProcessOutputResultDto;
import com.flowkraft.jobs.models.FileInfo;
import com.flowkraft.system.models.SystemInfo;
import com.flowkraft.system.services.DockerService;
import com.flowkraft.system.services.FileSystemService;
import com.flowkraft.system.services.ProcessService;
import com.flowkraft.system.services.SystemService;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/system", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class SystemController {

	@Autowired
	SystemService systemService;

	@Autowired
	FileSystemService fileSystemService;

	@Autowired
	ProcessService processService;

	@Autowired
	DockerService dockerService;

	@GetMapping("/check-url")
	public Mono<Boolean> checkUrl(@RequestParam String url) throws Exception {

		String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8.toString());

		// System.out.println("/jobman/system/check-url url = " + decodedUrl);

		WebClient webClient = WebClient.create();

		return webClient.get().uri(decodedUrl).exchangeToMono(response -> {

			// System.out.println(
			// "/jobman/system/check-url url = " + decodedUrl + ", response.status = " +
			// response.statusCode());

			if (response.statusCode().equals(HttpStatus.OK)) {
				return Mono.just(true);
			} else {
				return Mono.just(false);
			}
		}).onErrorResume(e -> Mono.just(false));
	}

	@GetMapping("/changelog")
	public Mono<String> getChangeLog(@RequestParam String itemName) throws Exception {
		String itemNameDecoded = URLDecoder.decode(itemName, StandardCharsets.UTF_8.toString());

		String url = "https://www.pdfburst.com/store?edd_action=get_version&item_name=" + itemNameDecoded;

		WebClient webClient = WebClient.create();

		return webClient.get().uri(url).exchangeToMono(response -> {
			if (response.statusCode().is3xxRedirection()) {
				String redirectUrl = response.headers().asHttpHeaders().getLocation().toString();
				return webClient.get().uri(redirectUrl).retrieve().bodyToMono(String.class);
			} else {
				return response.bodyToMono(String.class);
			}
		});
	}

	@GetMapping("/blog-posts")
	public Mono<String> getBlogPosts() {
		String url = "https://www.pdfburst.com/blog/feed/";

		WebClient webClient = WebClient.create();

		return webClient.get().uri(url).retrieve().bodyToMono(String.class).flatMap(body -> {
			XmlMapper xmlMapper = new XmlMapper();
			ObjectMapper jsonMapper = new ObjectMapper();
			return Mono.fromCallable(() -> xmlMapper.readTree(body))
					.flatMap(xmlNode -> Mono.fromCallable(() -> jsonMapper.writeValueAsString(xmlNode)));
		}).onErrorMap(e -> new RuntimeException("Error converting XML to JSON", e));
	}

	@GetMapping("/info")
	public Mono<SystemInfo> getSystemInfo() throws Exception {

		// System.out.println("/info");
		SystemInfo info = systemService.getSystemInfo();
		return Mono.just(info);

	}

	@GetMapping("/unix-cli/find")
	public Mono<List<String>> find(@RequestParam String path, @RequestParam List<String> matching,
			@RequestParam Optional<Boolean> files, @RequestParam Optional<Boolean> directories,
			@RequestParam Optional<Boolean> recursive, @RequestParam Optional<Boolean> ignoreCase) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		FindCriteriaDto criteriaDto = new FindCriteriaDto(matching, files.orElse(null), // Use orElse(null)
				directories.orElse(null), // Use orElse(null)
				recursive.orElse(null), // Use orElse(null)
				ignoreCase.orElse(null) // Use orElse(null)
		);

		List<String> results = fileSystemService.unixCliFind(fullPath, criteriaDto);

		return Mono.just(results);
	}

	@GetMapping(value = "/unix-cli/cat", produces = MediaType.TEXT_PLAIN_VALUE)
	Mono<String> cat(@RequestParam String path) throws Exception {

		// System.out.println("/unix-cli/cat path = " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		String fileContent = fileSystemService.unixCliCat(URLDecoder.decode(fullPath, StandardCharsets.UTF_8.toString()));
		// System.out.println("fileContent = " + fileContent);

		return Mono.just(fileContent);

	}

	@DeleteMapping("/fs/delete-quietly")
	public Mono<Boolean> deleteQuietly(@RequestParam String path) throws Exception {
		String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
		String fullPath;

		// Normalize path separators for reliable comparison, especially on Windows
		String normalizedDecodedPath = decodedPath.replace("\\", "/");
		String normalizedBaseDirPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH.replace("\\", "/");

		// Ensure the base path itself ends with a slash for startsWith comparison if
		// needed,
		// or handle it by checking startsWith(normalizedBaseDirPath + "/") if
		// decodedPath is just a sub-path.
		// For simplicity, assuming direct startsWith check is sufficient if paths are
		// well-formed.

		if (normalizedDecodedPath.startsWith(normalizedBaseDirPath)) {
			// Path already seems to be absolute and correctly rooted
			fullPath = decodedPath;
		} else {
			// Path is relative, prepend the base directory
			fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/" + decodedPath;
		}

		// Optional: Further normalize fullPath to resolve any ".." or "." and ensure
		// correct separators
		// Path finalFullPath = Paths.get(fullPath).normalize();
		// Boolean deleted = systemService.fsDelete(finalFullPath.toString());

		Boolean deleted = fileSystemService.fsDelete(fullPath); // Assuming fsDelete handles normalization or expects this
															// format
		return Mono.just(deleted);
	}

	@GetMapping(value = "/fs/read-file-to-string", produces = MediaType.TEXT_PLAIN_VALUE)
	Mono<String> readFileToString(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("/fs/read-file-to-string: fullPath = " + fullPath);

		String fileContent = fileSystemService.unixCliCat(fullPath);
		return Mono.just(fileContent);

	}

	// Add this to SystemController.java
	@GetMapping("/fs/resolve-absolute-path")
	public Map<String, String> resolveAbsolutePath(@RequestParam("path") String relativePath) {
		// System.out.println("Controller resolveAbsolutePath called with path: " +
		// relativePath);

		// Use the existing SystemService method to resolve the path
		String absolutePath = fileSystemService.fsResolvePath(relativePath);
		// System.out.println("Controller returning absolutePath: " + absolutePath);

		// Return the result as a map
		Map<String, String> result = new HashMap<>();
		result.put("absolutePath", absolutePath);
		return result;
	}

	@PostMapping(value = "/fs/write-string-to-file", consumes = "text/plain")
	Mono<Void> writeStringToFile(@RequestParam String path, @RequestBody Optional<String> content) throws Exception {

		// System.out.println("/fs/write-string-to-file content = " + content);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("/fs/write-string-to-file fullPath = " + fullPath);

		return Mono.fromCallable(() -> {
			fileSystemService.fsWriteStringToFile(fullPath, content);
			return null;
		});
	}

	@PostMapping("/fs/copy")
	public Mono<Void> copy(@RequestParam String fromPath, @RequestParam String toPath,
			@RequestParam(defaultValue = "false") boolean overwrite, @RequestParam(required = false) String[] matching,
			@RequestParam(defaultValue = "false") boolean ignoreCase) throws Exception {
		// System.out.println("/fs/copy");

		String fullFromPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(fromPath, StandardCharsets.UTF_8.toString());

		String fullToPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(toPath, StandardCharsets.UTF_8.toString());

		return Mono.fromCallable(() -> {
			fileSystemService.fsCopy(fullFromPath, fullToPath, overwrite, matching, ignoreCase);
			return null;
		});
	}

	@PostMapping("/fs/move")
	public Mono<Void> move(@RequestParam String fromPath, @RequestParam String toPath,
			@RequestParam(defaultValue = "false") boolean overwrite) {
		// System.out.println("/fs/move");

		return Mono.fromCallable(() -> {
			fileSystemService.fsMove(Paths.get(URLDecoder.decode(fromPath, StandardCharsets.UTF_8.toString())),
					Paths.get(URLDecoder.decode(toPath, StandardCharsets.UTF_8.toString())), overwrite);
			return null;
		});
	}

	@GetMapping(value = "/fs/exists", produces = MediaType.TEXT_PLAIN_VALUE)
	public Mono<String> exists(@RequestParam String path) throws Exception {
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		String exists = fileSystemService.fsExists(fullPath);
		return Mono.just(exists);
	}

	@PostMapping(value = "/fs/dir")
	public Mono<Void> dir(@RequestParam String path, @RequestBody Optional<DirCriteriaDto> criteria) throws Exception {
		// System.out.println("/fs/dir = " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		fileSystemService.fsDir(fullPath, criteria);
		return Mono.empty();

	}

	@PostMapping("/fs/file")
	public Mono<String> file(@RequestParam String path, @RequestBody Optional<FileCriteriaDto> criteria)
			throws Exception {
		// System.out.println("/fs/file");

		String file = fileSystemService.fsFile(URLDecoder.decode(path, StandardCharsets.UTF_8.toString()), criteria);
		return Mono.just(file);

	}

	@GetMapping("/fs/inspect")
	public Mono<Optional<InspectResultDto>> inspect(@RequestParam String path, @RequestParam Optional<String> checksum,
			@RequestParam Optional<Boolean> mode, @RequestParam Optional<Boolean> times,
			@RequestParam Optional<Boolean> absolutePath, @RequestParam Optional<String> symlinks) throws Exception {
		// System.out.println("/fs/inspect");

		Optional<InspectResultDto> inspect = fileSystemService.fsInspect(
				URLDecoder.decode(path, StandardCharsets.UTF_8.toString()), checksum, mode, times, absolutePath,
				symlinks);
		return Mono.just(inspect);

	}

	@GetMapping("/fs/list")
	public Flux<FileInfo> listFiles(@RequestParam String path) throws Exception {
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		File directory = new File(fullPath);
		if (!directory.exists() || !directory.isDirectory()) {
			return Flux.empty();
		}

		return Flux.fromArray(directory.listFiles()).map(file -> {
			FileInfo info = new FileInfo(file.getName(), StringUtils.EMPTY, false);
			info.filePath = file.getAbsolutePath();
			info.fileSize = file.length();
			info.isDirectory = file.isDirectory();
			info.lastModified = file.lastModified();
			// info.setName(file.getName());
			// info.setPath(file.getAbsolutePath());
			// info.setDirectory(file.isDirectory());
			// info.setSize(file.length());
			// info.setLastModified(file.lastModified());
			return info;
		});
	}

	@PostMapping("/child-process/spawn")
	public Mono<ProcessOutputResultDto> spawn(@RequestBody List<String> args, @RequestParam Optional<String> cwdPath)
			throws Exception {

		// System.out.println("/child-process/spawn commands: " + args);

		return processService.spawn(args, cwdPath);

	}

	/**
	 * Start or stop the test email server (MailHog or similar).
	 * Replaces the old shellService.startStopTestEmailServer() which spawned a bat file.
	 */
	@PostMapping("/test-email-server")
	public Mono<ProcessOutputResultDto> startStopTestEmailServer(@RequestBody Map<String, String> request)
			throws Exception {
		String action = request.get("action"); // "start" or "stop"
		if (action == null || action.isBlank()) {
			throw new IllegalArgumentException("action is required (start or stop)");
		}

		String cwdPath = "tools/test-email-server";
		String batFile = action + "TestEmailServer.bat";

		return processService.spawn(java.util.Arrays.asList(batFile), Optional.of(cwdPath));
	}

	@PostMapping("/install/chocolatey")
	public Mono<ProcessOutputResultDto> installChocolatey() throws Exception {
		// System.out.println("/install/chocolatey");

		return processService.installChocolatey();

	}

	@PostMapping("/uninstall/chocolatey")
	public Mono<ProcessOutputResultDto> unInstallChocolatey() throws Exception {
		// System.out.println("/uninstall/chocolatey");

		return processService.unInstallChocolatey();

	}

	@GetMapping("/services/status")
	public Mono<List<DockerService.ServiceStatusInfo>> getAllServicesStatus(@RequestParam Optional<Boolean> forceProbe, @RequestParam Optional<Boolean> skipProbe) throws Exception {
		boolean force = forceProbe.orElse(false);
		boolean skip = skipProbe.orElse(false);
		List<DockerService.ServiceStatusInfo> statuses = dockerService.getAllServicesStatus(force, skip);
		return Mono.just(statuses);
	}

	@GetMapping("/services/check-seed-status")
	public Mono<Map<String, Object>> checkSeedStatus(@RequestParam String vendor) {
		return Mono.fromCallable(() -> {
			com.sourcekraft.documentburster.common.db.northwind.NorthwindManager.DatabaseVendor dbVendor =
				com.sourcekraft.documentburster.common.db.northwind.NorthwindManager.DatabaseVendor.valueOf(vendor.toUpperCase());
			com.sourcekraft.documentburster.common.db.northwind.NorthwindManager manager =
				new com.sourcekraft.documentburster.common.db.northwind.NorthwindManager();
			try (java.sql.Connection conn = manager.getConnection(dbVendor)) {
				boolean hasSeedData = com.sourcekraft.documentburster.common.db.northwind.InvoiceSeedGenerator.checkSeedStatus(conn, dbVendor);
				Map<String, Object> result = new HashMap<>();
				result.put("vendor", vendor);
				result.put("hasSeedData", hasSeedData);
				return result;
			}
		});
	}
}
