package com.flowkraft.jobman.services;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.io.PrintWriter;
import java.net.URLDecoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.CopyOption;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.input.Tailer;
import org.apache.commons.io.input.TailerListenerAdapter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.unix4j.Unix4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.ProcessResult;
import java.util.concurrent.TimeUnit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowkraft.common.AppPaths;
import com.flowkraft.common.Utils;
import com.flowkraft.common.Constants;
import com.sourcekraft.documentburster.common.ServicesManager;
import com.flowkraft.jobman.dtos.DirCriteriaDto;
import com.flowkraft.jobman.dtos.FileCriteriaDto;
import com.flowkraft.jobman.dtos.FindCriteriaDto;
import com.flowkraft.jobman.dtos.InspectResultDto;
import com.flowkraft.jobman.dtos.ProcessOutputResultDto;
import com.flowkraft.jobman.models.FileInfo;
import com.flowkraft.jobman.models.SystemInfo;
import com.flowkraft.jobman.models.WebSocketJobsExecutionStatsInfo;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class SystemService {

	private static final Logger log = LoggerFactory.getLogger(SystemService.class);

	@Autowired
	private SimpMessageSendingOperations messagingTemplate;

	private Map<String, Tailer> existingTailers = new HashMap<>();

	// Cached availability/version information
	private volatile boolean cachedDockerDaemonRunning = false;
	private volatile boolean cachedDockerOk = false; // convenience: installed && daemon running
	// Initial state: not yet checked. After first probe this will become either
	// a version string or the sentinel "DOCKER_NOT_INSTALLED".
	private volatile String cachedDockerVersion = "DOCKER_NOT_CHECKED"; // DOCKER_NOT_CHECKED means probe not yet run

	// TTL-based caching for Docker probe to avoid repeated blocking probes during
	// rapid polling
	private static final long DOCKER_PROBE_TTL_MS = 15_000; // 15 seconds
	private volatile long lastDockerProbeTimeMs = 0L;

	// Note: Chocolatey probing removed to keep backend focused on Docker status.
	// Frontend/Electron still records choco in logs.

	/**
	 * Synchronously refresh Docker presence/version and daemon status.
	 * Blocking and intended to be used when the caller needs the latest status
	 * (e.g., right before performing `docker ps`).
	 */
	public synchronized void refreshChocoAndDockerSync() {
		// Docker: check binary then daemon (Chocolatey probe removed per simplification)

		// Keep previous values and compute new ones locally, then only log when
		// status actually changes to avoid repeated identical debug lines.
		String prevVersion = cachedDockerVersion;
		boolean prevDaemonRunning = cachedDockerDaemonRunning;
		boolean prevOk = cachedDockerOk;

		String newDockerVersion = cachedDockerVersion;
		boolean newDockerDaemonRunning = cachedDockerDaemonRunning;

		try {
			ProcessResult pr = new ProcessExecutor().command("docker", "--version").readOutput(true)
					.redirectErrorStream(true)
					.timeout(3, TimeUnit.SECONDS)
					.execute();
			if (pr.getExitValue() == 0) {
				String out = pr.getOutput().getString();
				java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)+)").matcher(out);
				newDockerVersion = m.find() ? m.group(1) : out.trim();
			} else {
				newDockerVersion = "DOCKER_NOT_INSTALLED";
			}
		} catch (Exception e) {
			newDockerVersion = "DOCKER_NOT_INSTALLED";
		}

		// If binary present, check if daemon is reachable (docker info)
		try {
			if (!"DOCKER_NOT_INSTALLED".equals(newDockerVersion)) {
				ProcessResult pr2 = new ProcessExecutor().command("docker", "info").readOutput(true)
						.redirectErrorStream(true)
						.timeout(10, TimeUnit.SECONDS)
						.execute();
				int exitVal = pr2.getExitValue();
				log.info("docker info exit code: {}", exitVal);
				newDockerDaemonRunning = exitVal == 0;
			} else {
				newDockerDaemonRunning = false;
			}
		} catch (Exception e) {
			log.warn("docker info check failed with exception: {}", e.getMessage());
			newDockerDaemonRunning = false;
		}

		// convenience flag
		boolean newOk = (!"DOCKER_NOT_INSTALLED".equals(newDockerVersion)) && newDockerDaemonRunning;

		// Log only when status changed from last probe
		if (!Objects.equals(prevVersion, newDockerVersion) || prevDaemonRunning != newDockerDaemonRunning
				|| prevOk != newOk) {
			log.debug(
					"refreshChocoAndDockerSync: docker status changed: version {}->{}, daemon {}->{}, ok {}->{}",
					prevVersion, newDockerVersion, prevDaemonRunning, newDockerDaemonRunning, prevOk, newOk);
		}

		cachedDockerVersion = newDockerVersion;
		cachedDockerDaemonRunning = newDockerDaemonRunning;
		cachedDockerOk = newOk;

		// update probe timestamp
		lastDockerProbeTimeMs = System.currentTimeMillis();
	}

	/**
	 * Refresh Docker probe if TTL expired or if forced.
	 * 
	 * @param force     if true, always run probe synchronously
	 * @param skipProbe if true, skip probing even if TTL expired (used during
	 *                  transitions)
	 */
	public synchronized void refreshDockerIfStale(boolean force, boolean skipProbe) {
		if (skipProbe) {
			// Caller requested skipping probes (e.g., items are in starting/stopping)
			return;
		}
		long now = System.currentTimeMillis();
		if (!force && (now - lastDockerProbeTimeMs) < DOCKER_PROBE_TTL_MS) {
			// Cache still fresh, skip probe
			return;
		}
		// Run the synchronous refresh
		refreshChocoAndDockerSync();
	}

	public SystemInfo getSystemInfo() throws Exception {
		SystemInfo info = new SystemInfo();
		info.osName = System.getProperty("os.name");
		info.osVersion = System.getProperty("os.version");
		info.userName = System.getProperty("user.name");
		info.osArch = System.getProperty("os.arch");
		info.product = "ReportBurster";

		List<String> matching = new ArrayList<String>();

		matching.add("startServer.*");
		Optional<Boolean> files = Optional.of(true);
		Optional<Boolean> directories = Optional.of(false);
		Optional<Boolean> recursive = Optional.of(false);
		Optional<Boolean> ignoreCase = Optional.of(false);

		FindCriteriaDto criteria = new FindCriteriaDto(matching, files.orElse(null), // Extract Boolean or null
				directories.orElse(null), // Extract Boolean or null
				recursive.orElse(null), // Extract Boolean or null
				ignoreCase.orElse(null) // Extract Boolean or null
		);

		List<String> startServerScripts = this.unixCliFind(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, criteria);
		if (!Objects.isNull(startServerScripts) && startServerScripts.size() > 0)
			info.product = "ReportBurster Server";

		// Use cached Docker probe results (Chocolatey fields left as defaults)
		info.isDockerDaemonRunning = this.cachedDockerDaemonRunning;
		info.dockerVersion = this.cachedDockerVersion;
		// Consider Docker installed only if we've probed and the version is not the
		// sentinel for "not installed" or "not checked yet".
		info.isDockerInstalled = !"DOCKER_NOT_INSTALLED".equals(this.cachedDockerVersion)
			&& !"DOCKER_NOT_CHECKED".equals(this.cachedDockerVersion);
		info.isChocoOk = false; // not probed by backend
		info.chocoVersion = "CHOCO_NOT_CHECKED_YET";

		return info;

	}

	private String getDockerVersion() {
		try {
			ProcessResult r = new ProcessExecutor().command("docker", "--version").readOutput(true)
					.redirectErrorStream(true)
					.timeout(3, TimeUnit.SECONDS)
					.execute();
			if (r.getExitValue() != 0)
				return "";
			String out = r.getOutput().getString();
			java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)+)").matcher(out);
			if (m.find())
				return m.group(1);
			return out.trim();
		} catch (Exception e) {
			return "";
		}
	}

	public String unixCliCat(String path) {

		File file = new File(path.trim());

		if (!file.exists()) {
			// System.out.println("File does not exist: " + path + "!");
			return StringUtils.EMPTY;
		}

		Stream<String> stream = Unix4j.builder().cd(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH).cat(path).toStringStream();
		return stream.collect(Collectors.joining("\n"));
	}

	public List<String> unixCliFind(String path, FindCriteriaDto criteria) throws Exception {

		// System.out.println("PORTABLE_EXECUTABLE_DIR_PATH: " +
		// AppPaths.PORTABLE_EXECUTABLE_DIR_PATH);

		// System.out.println("path = " + path + ", criteria = " + criteria);
		Stream<Path> stream;

		if (criteria.isRecursive()) {
			stream = Files.walk(Paths.get(path));
		} else {
			stream = Files.list(Paths.get(path));
		}

		if (criteria.isFiles()) {
			stream = stream.filter(Files::isRegularFile);
		}

		if (criteria.isDirectories()) {
			stream = stream.filter(Files::isDirectory);
		}

		if (criteria.getMatching() != null) {
			stream = stream.filter(filePath -> {
				String fileName = filePath.getFileName().toString();
				return criteria.getMatching().stream().anyMatch(pattern -> {
					// Construct the regex pattern with case-insensitivity applied correctly.
					String regexPattern = pattern.replace(".", "\\.").replace("*", ".*").replace("?", ".");
					if (criteria.isIgnoreCase()) {
						regexPattern = "(?i)" + regexPattern;
					}
					return fileName.matches(regexPattern);
				});
			});
		}

		List<String> list = stream.map(Path::toAbsolutePath).map(Path::normalize).map(Path::toString)
				.map(p -> p.replace("\\", "/")).map(p -> p.replace(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, ""))
				.collect(Collectors.toList());

		// System.out.println("SystemService.unixCliFind before return");
		// list.forEach(System.out::println);

		return list;
	}

	public void startTailer(String fileName) throws Exception {
		if (Objects.isNull(existingTailers.get(fileName))) {

			// System.out.println("startTailer - AppPaths.LOGS_DIR_PATH = " +
			// AppPaths.LOGS_DIR_PATH + "/" + fileName);

			Tailer tailer = new Tailer(new File(AppPaths.LOGS_DIR_PATH + "/" + fileName), new TailerListenerAdapter() {
				public void handle(String line) {

					boolean trimContent = false;

					List<FileInfo> logsTailInfo = new ArrayList<FileInfo>();
					logsTailInfo.add(new FileInfo(fileName, line, trimContent));

					WebSocketJobsExecutionStatsInfo tailMessageInfo = new WebSocketJobsExecutionStatsInfo("logs.tailer",
							logsTailInfo.stream());

					// System.out.println("fileName = " + fileName + ", tailer.line = " + line);
					messagingTemplate.convertAndSend("/topic/tailer", tailMessageInfo);
				}
			});
			existingTailers.put(fileName, tailer);
			tailer.run();
		} else
			throw new Exception("A tailer is already started for " + fileName);
	}

	public void stopTailer(String fileName) {

		Tailer tailer = existingTailers.get(fileName);

		if (!Objects.isNull(tailer)) {
			// System.out.println("stopTailer - AppPaths.LOGS_DIR_PATH = " +
			// AppPaths.LOGS_DIR_PATH + "/" + fileName);

			tailer.stop();
			existingTailers.remove(fileName);
		}

	}

	public class ProcessOutput {
		public Stream<String> stdout;
		public Stream<String> stderr;
	}

	public Mono<ProcessOutputResultDto> spawn(List<String> args, Optional<String> cwdPath) throws Exception {
		List<String> commandWithShell = new ArrayList<>();
		String os = System.getProperty("os.name").toLowerCase();

		if (os.contains("win")) {
			commandWithShell.add("cmd.exe");
			commandWithShell.add("/c");
		} else if (os.contains("nix") || os.contains("nux") || os.contains("mac")) {
			commandWithShell.add("/bin/sh");
		}

		List<String> newArgs = new ArrayList<>();
		for (String arg : args) {
			// Print each original argument
			// // System.out.println("[DEBUG] Original arg: " + arg);

			String modifiedArg = arg.replace("PORTABLE_EXECUTABLE_DIR_PATH/",
					AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/");
			if (os.contains("nix") || os.contains("nux") || os.contains("mac")) {
				modifiedArg = modifiedArg.replace(".bat", ".sh");
			}
			newArgs.add(modifiedArg);
		}
		// Print the final command line that will be executed
		// // System.out.println("[DEBUG] Full command to execute:");
		for (String part : commandWithShell) {
			// System.out.print(part + " ");
		}
		for (String part : newArgs) {
			// System.out.print(part + " ");
		}
		// System.out.println();

		commandWithShell.addAll(newArgs);

		String workingDirectoryPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH;

		if (cwdPath.isPresent()) {
			workingDirectoryPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
					+ URLDecoder.decode(cwdPath.get(), StandardCharsets.UTF_8.toString());
		}

		// // System.out.println("[DEBUG] Working directory: " + workingDirectoryPath);

		ProcessBuilder processBuilder = new ProcessBuilder(commandWithShell);
		processBuilder.directory(new File(workingDirectoryPath));

		Process process = processBuilder.start();

		Flux<String> stdoutFlux = Flux.using(() -> new BufferedReader(new InputStreamReader(process.getInputStream())),
				reader -> Flux.fromStream(reader.lines()), Utils.uncheckedConsumer(BufferedReader::close));

		Flux<String> stderrFlux = Flux.using(() -> new BufferedReader(new InputStreamReader(process.getErrorStream())),
				reader -> Flux.fromStream(reader.lines()), Utils.uncheckedConsumer(BufferedReader::close));

		return Flux.merge(stdoutFlux, stderrFlux).collectList()
				.map(outputLines -> new ProcessOutputResultDto(process.exitValue() == 0, outputLines))
				.doOnTerminate(process::destroy);
	}

	public ProcessOutput execProcess(String command) throws Exception {
		Process process = Runtime.getRuntime().exec(command);

		PipedInputStream stdoutPipedInput = new PipedInputStream();
		PipedOutputStream stdoutPipedOutput = new PipedOutputStream(stdoutPipedInput);
		Thread stdoutThread = new Thread(() -> {
			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
			PrintWriter writer = new PrintWriter(stdoutPipedOutput);
			reader.lines().forEach(writer::println);

		});

		PipedInputStream stderrPipedInput = new PipedInputStream();
		PipedOutputStream stderrPipedOutput = new PipedOutputStream(stderrPipedInput);
		Thread stderrThread = new Thread(() -> {
			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
			PrintWriter writer = new PrintWriter(stderrPipedOutput);
			reader.lines().forEach(writer::println);

		});

		stdoutThread.start();
		stderrThread.start();

		ProcessOutput output = new ProcessOutput();
		output.stdout = new BufferedReader(new InputStreamReader(stdoutPipedInput)).lines();
		output.stderr = new BufferedReader(new InputStreamReader(stderrPipedInput)).lines();
		return output;
	}

	public String fsResolvePath(String path) {
		Path base = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH).toAbsolutePath();
		Path pathToResolve = Paths.get(path);

		// Remove the common prefix from the path to resolve
		Path relative = base.relativize(base.resolve(pathToResolve));

		// Resolve the path without the common prefix against the base path
		Path resolved = base.resolve(relative);

		return resolved.toAbsolutePath().normalize().toString();
	}

	public void fsWriteStringToFile(String path, Optional<String> content) throws Exception {
		Path filePath = Paths.get(path);

		// Create parent directories if they don't exist
		Files.createDirectories(filePath.getParent());

		// Write the file
		if (content.isPresent())
			Files.write(filePath, content.get().getBytes(StandardCharsets.UTF_8));
		else
			Files.write(filePath, StringUtils.EMPTY.getBytes(StandardCharsets.UTF_8));
	}

	public boolean fsDelete(String path) throws Exception {

		// System.out.println("fsDeleteQuietly:" + path);
		Path filePath = Paths.get(path);
		if (Files.isDirectory(filePath)) {
			FileUtils.deleteDirectory(new File(path));
			return true;
		} else
			return Files.deleteIfExists(filePath);

	}

	public void fsCopy(String from, String to, boolean overwrite, String[] matching, boolean ignoreCase)
			throws Exception {

		// System.out.println("fsCopy overwrite = " + overwrite);

		Path sourcePath = Paths.get(from);
		Path destinationPath = Paths.get(to);

		// Define the copy option based on the overwrite flag
		CopyOption[] options = overwrite ? new CopyOption[] { StandardCopyOption.REPLACE_EXISTING }
				: new CopyOption[] {};

		// Create a PathMatcher for each glob pattern
		FileSystem fs = FileSystems.getDefault();
		PathMatcher[] matchers;
		if (!Objects.isNull(matching)) {
			matchers = Stream.of(matching)
					.map(pattern -> fs.getPathMatcher("glob:" + (ignoreCase ? pattern.toLowerCase() : pattern)))
					.toArray(PathMatcher[]::new);
		} else {
			matchers = new PathMatcher[0];
		}

		// Use the Files.walk method to recursively copy all files and directories
		Files.walk(sourcePath).filter(
				source -> matchers.length == 0 || Stream.of(matchers).anyMatch(matcher -> matcher.matches(source)))
				.forEach(source -> fsCopy(source, destinationPath.resolve(sourcePath.relativize(source)), options));
	}

	public static class MoveOptions {
		public boolean overwrite = false;
	}

	public void fsMove(Path from, Path to, boolean overwrite) throws Exception {

		MoveOptions options = new SystemService.MoveOptions();
		options.overwrite = overwrite;

		// Define the copy option based on whether overwrite is enabled
		CopyOption[] copyOptions = options.overwrite ? new CopyOption[] { StandardCopyOption.REPLACE_EXISTING }
				: new CopyOption[] {};

		// Move the file or directory
		Files.move(from, to, copyOptions);
	}

	public String fsExists(String path) throws Exception {

		// System.out.println("fsExists.path = " + path);

		Path filePath = Paths.get(path);
		if (!Files.exists(filePath)) {
			return "false";
		} else if (Files.isDirectory(filePath)) {
			return "dir";
		} else if (Files.isRegularFile(filePath)) {
			return "file";
		} else {
			return "other";
		}
	}

	public String fsDir(String path, Optional<DirCriteriaDto> criteria) throws Exception {
		Path dirPath = Paths.get(path);
		if (Files.exists(dirPath)) {
			if (!Files.isDirectory(dirPath)) {
				throw new RuntimeException("Path exists but is not a directory");
			}

			if (criteria.isPresent()) {

				DirCriteriaDto c = criteria.get();

				// System.out.println("DirCriteria: " + c);
				// System.out.println("Directory path: " + dirPath);
				// String[] fileList = dirPath.toFile().list();
				// System.out.println("File list: " + Arrays.toString(fileList));

				if (c.isEmpty() && dirPath.toFile().list().length > 0) {
					try (Stream<Path> paths = Files.walk(dirPath)) {
						paths.filter(p -> !p.equals(dirPath)).sorted(Comparator.reverseOrder()).map(Path::toFile)
								.forEach(File::delete);
					}
				}

				if (!StringUtils.isBlank(c.getMode())) {
					Set<PosixFilePermission> perms = PosixFilePermissions.fromString(c.getMode());
					Files.setPosixFilePermissions(dirPath, perms);
				}
			}
		} else {
			Files.createDirectories(dirPath);
		}

		return dirPath.toString().replace("\\", "/");
	}

	public String fsFile(String path, Optional<FileCriteriaDto> criteria) throws Exception {
		Path filePath = Paths.get(path);
		if (!Files.exists(filePath)) {
			Files.createDirectories(filePath.getParent());
			Files.createFile(filePath);
		}

		if (criteria.isPresent()) {
			FileCriteriaDto c = criteria.get();
			if (!Objects.isNull(c.getContent())) {
				if (c.getContent() instanceof String) {
					Files.write(filePath, ((String) c.getContent()).getBytes(StandardCharsets.UTF_8));
				} else if (c.getContent() instanceof byte[]) {
					Files.write(filePath, (byte[]) c.getContent());
				} else if (c.getContent() instanceof ByteBuffer) {
					Files.write(filePath, ((ByteBuffer) c.getContent()).array());
				} else {
					ObjectMapper objectMapper = new ObjectMapper();
					objectMapper.writerWithDefaultPrettyPrinter().writeValue(filePath.toFile(), c.getContent());
				}
			}

			if (!Objects.isNull(c.getMode())) {
				Set<PosixFilePermission> perms = PosixFilePermissions.fromString(c.getMode());
				Files.setPosixFilePermissions(filePath, perms);
			}
		}

		return path;
	}

	public Optional<InspectResultDto> fsInspect(String path, Optional<String> checksum, Optional<Boolean> mode,
			Optional<Boolean> times, Optional<Boolean> absolutePath, Optional<String> symlinks) throws Exception {
		Path filePath;

		if (absolutePath.isPresent() && absolutePath.get()) {
			filePath = Paths.get(path).toAbsolutePath();
		} else {
			filePath = Paths.get(path);
		}

		if (!Files.exists(filePath)) {
			return Optional.empty();
		}

		InspectResultDto result = new InspectResultDto();
		result.setName(filePath.getFileName().toString());
		result.setType(Files.isDirectory(filePath) ? "dir" : "file");

		if (Files.isRegularFile(filePath)) {
			result.setSize(Files.size(filePath));
		}

		if (mode.isPresent()) {
			if (mode.get()) {
				result.setMode((int) Files.getAttribute(filePath, "unix:mode"));
			}
		}

		if (times.isPresent()) {
			if (times.get()) {
				BasicFileAttributes attrs = Files.readAttributes(filePath, BasicFileAttributes.class);
				result.setAccessTime(Instant.ofEpochMilli(attrs.lastAccessTime().toMillis()));
				result.setModifyTime(Instant.ofEpochMilli(attrs.lastModifiedTime().toMillis()));
				result.setChangeTime(Instant.ofEpochMilli(attrs.creationTime().toMillis()));
			}

		}

		// Note: Symlinks and checksums are not handled in this example

		return Optional.of(result);
	}

	public Mono<ProcessOutputResultDto> installChocolatey() throws Exception {

		String INSTALL_CHOCOLATEY_SCRIPT_CONTENT = "@echo off\n" + "\n" + "SET DIR=%~dp0%\n" + "    \n"
				+ "::download install.ps1\n"
				+ "%systemroot%/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"((new-object net.webclient).DownloadFile('https://chocolatey.org/install.ps1','%DIR%install.ps1'))\"\n"
				+ "::run installer\n"
				+ "%systemroot%/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"& '%DIR%install.ps1' %*\"\n"
				+ "del /f /s install.ps1\n";

		// Step 1: Generate /temp/installChocolatey.cmd
		Path scriptFilePath = Paths.get("/temp/installChocolatey.cmd");
		Files.write(scriptFilePath, INSTALL_CHOCOLATEY_SCRIPT_CONTENT.getBytes());

		// Step 2: Run installChocolatey.cmd
		// Run installChocolatey.cmd from an elevated cmd.exe command prompt and it will
		// install the latest version of Chocolatey.
		String elevatedScriptFilePath = getCommandReadyToBeRunAsAdministratorUsingBatchCmd(
				"CALL " + scriptFilePath.toString());

		List<String> commands = Arrays.asList("cmd.exe", "/c", elevatedScriptFilePath);
		return spawn(commands, Optional.empty());

	}

	public Mono<ProcessOutputResultDto> unInstallChocolatey() throws Exception {

		String elevatedScriptFilePath = getCommandReadyToBeRunAsAdministratorUsingBatchCmd(
				"& ../tools/chocolatey/uninstall.ps1");

		List<String> commands = Arrays.asList("cmd.exe", "/c", elevatedScriptFilePath);
		return spawn(commands, Optional.empty());

	}

	// Inner public class for service status info
	public static class ServiceStatusInfo {
		public String name; // e.g., "mariadb"
		public String status; // e.g., "running", "stopped", "error", "starting" (when unhealthy)
		public String ports; // e.g., "3307/tcp" or "N/A"
		public String health; // e.g., "healthy", "unhealthy", "starting", or null if no healthcheck
	}

	public List<ServiceStatusInfo> getAllServicesStatus(boolean forceProbe, boolean skipProbe) throws Exception {

		List<ServiceStatusInfo> statuses = new ArrayList<>();
		try {
			// Refresh Docker probe only if cache is stale (avoid probing during rapid
			// polling)
			// Do not probe on every poll; only when cached info is older than TTL or caller
			// forces it.
			refreshDockerIfStale(forceProbe, skipProbe);
			// If docker binary not present, skip
			if ("DOCKER_NOT_INSTALLED".equals(this.cachedDockerVersion)) {
				log.warn("Docker CLI not installed (cached) - skipping getAllServicesStatus");
				return statuses;
			}
			// If docker daemon not running, skip
			if (!this.cachedDockerDaemonRunning) {
				log.warn("Docker CLI present but daemon not running (cached) - skipping getAllServicesStatus");
				return statuses;
			}

			// Build the Docker command to get all running containers
			List<String> command = Arrays.asList("docker", "ps", "--format", "json");

			// Execute the command (no working directory needed for global query)
			ProcessResult result = new ProcessExecutor().command(command).readOutput(true).redirectErrorStream(true)
					.timeout(5, TimeUnit.SECONDS)
					.execute();
			String output = result.getOutput().getString();

			// Check if the command succeeded (exit code 0)
			if (result.getExitValue() != 0) {
				log.warn("Docker command failed (exit code={}): {}", result.getExitValue(), output);
				return statuses;
			}

			// Trim and check the output format
			output = output.trim();
			if (output.isEmpty()) {
				return statuses;
			}

			ObjectMapper mapper = new ObjectMapper();

			if (output.startsWith("[")) {
				// Parse as JSON array
				List<Map<String, Object>> services = mapper.readValue(output,
						new TypeReference<List<Map<String, Object>>>() {
						});
				for (Map<String, Object> service : services) {
					ServiceStatusInfo info = new ServiceStatusInfo();
					info.name = (String) service.get("Names");
					String state = (String) service.get("State");
					String statusText = (String) service.get("Status");
					info.health = extractHealthStatus(statusText);
					if ("running".equals(state) && info.health != null && !"healthy".equals(info.health)) {
						info.status = "starting";
					} else {
						info.status = state;
					}
					info.ports = service.get("Ports") != null ? service.get("Ports").toString() : "N/A";
					statuses.add(info);
				}
			} else if (output.startsWith("{")) {
				// Handle newline-delimited JSON objects (docker ps outputs one JSON per line)
				String[] lines = output.split("\\R"); // Split by any line separator
				for (String line : lines) {
					line = line.trim();
					if (line.isEmpty() || !line.startsWith("{")) {
						continue;
					}
					try {
						Map<String, Object> service = mapper.readValue(line, new TypeReference<Map<String, Object>>() {
						});
						if (service.containsKey("Names")) {
							ServiceStatusInfo info = new ServiceStatusInfo();
							info.name = (String) service.get("Names");
							String state = (String) service.get("State");
							String statusText = (String) service.get("Status");
							info.health = extractHealthStatus(statusText);
							if ("running".equals(state) && info.health != null && !"healthy".equals(info.health)) {
								info.status = "starting";
							} else {
								info.status = state;
							}
							info.ports = service.get("Ports") != null ? service.get("Ports").toString() : "N/A";
							statuses.add(info);
						}
					} catch (Exception e) {
						log.debug("Failed to parse Docker JSON line (ignored): {}", line);
					}
				}
			} else {
				// Non-JSON output (e.g., plain text error)
				log.warn("Non-JSON output from Docker (ignored): {}", output);
			}
		} catch (Exception e) {
			log.warn("Exception while fetching Docker services status: {}", e.getMessage());
			// Return empty statuses on any issue to avoid noisy failures in normal app flow
			return statuses;
		} finally {
			try {
				processPauseCancelJobs();
			} catch (Exception e) {
				log.debug("processPauseCancelJobs failed (ignored): {}", e.getMessage());
			}
		}

		return statuses;
	}

	/**
	 * Quick check whether Docker CLI is available and responsive.
	 */
	private boolean isDockerAvailable() {
		try {
			ProcessResult r = new ProcessExecutor().command("docker", "--version").readOutput(true)
					.redirectErrorStream(true)
					.timeout(3, TimeUnit.SECONDS)
					.execute();
			return r.getExitValue() == 0;
		} catch (Exception e) {
			return false;
		}
	}

	/**
	 * Extract health status from Docker's Status string.
	 * Examples: "Up 30 seconds (healthy)", "Up 10 seconds (health: starting)", "Up
	 * 5 seconds (unhealthy)"
	 * Returns: "healthy", "starting", "unhealthy", or null if no healthcheck
	 */
	private String extractHealthStatus(String statusText) {
		if (statusText == null)
			return null;
		if (statusText.contains("(healthy)"))
			return "healthy";
		if (statusText.contains("(health: starting)"))
			return "starting";
		if (statusText.contains("(unhealthy)"))
			return "unhealthy";
		// No health info in status = no healthcheck configured
		return null;
	}

	/**
	 * Scan the jobs temp folder for *.pause / *.cancel files and handle them.
	 * For each found signal file we look for the matching .job file, parse its
	 * <filepath> to find a candidate folder and search upwards for a
	 * docker-compose.yml (or .yaml). If found, we run `docker compose down
	 * --remove-orphans`
	 * in that folder and then remove the main job file and the pause/cancel file
	 * (and any .progress file).
	 */
	private void processPauseCancelJobs() throws Exception {
		Path jobsDir = Paths.get(AppPaths.JOBS_DIR_PATH);
		if (!Files.exists(jobsDir) || !Files.isDirectory(jobsDir))
			return;

		List<Path> files = Files.list(jobsDir).collect(Collectors.toList());

		for (Path p : files) {
			String fname = p.getFileName().toString();
			if (!(fname.endsWith(".pause") || fname.endsWith(".cancel")))
				continue;

			String baseName = FilenameUtils.getBaseName(fname); // e.g. "123456789"
			String jobFileName = baseName + Constants.EXTENTION_JOB_FILE; // ".job"
			Path jobPath = jobsDir.resolve(jobFileName);
			if (!Files.exists(jobPath)) {
				// nothing to do if the main job file is not present
				continue;
			}

			String jobContent = Files.readString(jobPath, StandardCharsets.UTF_8);
			// Require explicit jobtype: only handle 'app start <service>' – no filepath
			// fallback
			Pattern jobtypePtn = Pattern.compile("<jobtype>(.*?)</jobtype>", Pattern.DOTALL);
			Matcher jobtypeMatcher = jobtypePtn.matcher(jobContent);
			if (!jobtypeMatcher.find()) {
				// No jobtype -> skip (per requested behavior, do not fallback)
				continue;
			}
			String jobtype = jobtypeMatcher.group(1).trim();
			String[] tokens = jobtype.split("\\s+");
			if (tokens.length < 3 || !tokens[0].equalsIgnoreCase("app") || !tokens[1].equalsIgnoreCase("start")) {
				// Not an app start job -> skip (explicit policy)
				continue;
			}
			String serviceName = tokens[2].trim();

			// Use the unified ServicesManager stop flow instead of resolving/composing
			// ourselves
			try {
				ServicesManager.Result r = ServicesManager.execute("app stop " + serviceName);
				String status = (r != null ? r.status : "null");
				String output = (r != null && r.output != null ? r.output.replaceAll("\r?\n", " ") : "");
				System.out.println("pause/cancel: executed 'app stop " + serviceName + "' -> status=" + status
						+ " output=" + output);

				// Consider the stop successful if ServicesManager returned "stopped" or similar
				if ("stopped".equalsIgnoreCase(status) || "ok".equalsIgnoreCase(status)) {
					// remove job files (main + signal + possible progress)
					FileUtils.deleteQuietly(jobPath.toFile());
					FileUtils.deleteQuietly(p.toFile());
					FileUtils.deleteQuietly(jobsDir.resolve(baseName + ".progress").toFile());
					System.out.println("pause/cancel: cleaned up job files for " + baseName);
				} else {
					System.err.println("pause/cancel: stop command did not indicate success for " + serviceName
							+ " (status=" + status + "). Leaving signal file for retry.");
				}
			} catch (Exception ex) {
				System.err.println(
						"pause/cancel: Exception while executing stop for " + serviceName + ": " + ex.getMessage());
				// Keep the *.pause / *.cancel file so the next poll retries
			}
		}

	}

	private String getCommandReadyToBeRunAsAdministratorUsingBatchCmd(String commandToElevate) throws Exception {
		File tempFile = File.createTempFile("elevated-batch-cmd-script", ".cmd", new File("/temp/")); // replace
																										// "/temp/" with
																										// your
																										// directory
		String elevatedScriptFilePath = tempFile.getAbsolutePath();

		String scriptContent = "::::::::::::::::::::::::::::::::::::::::::::\n" + ":: Elevate.cmd - Version 4\n"
				+ ":: Automatically check & get admin rights\n"
				+ ":: see \"https://stackoverflow.com/a/12264592/1016343\" for description\n"
				+ "::::::::::::::::::::::::::::::::::::::::::::\n" + " @echo off\n" + " CLS\n" + " ECHO.\n"
				+ " ECHO =============================\n" + " ECHO Please wait... Running '" + commandToElevate
				+ "' as Admin...\n" + " ECHO =============================\n" + ":init\n"
				+ " setlocal DisableDelayedExpansion\n" + " set cmdInvoke=0\n" + " set winSysFolder=System32\n"
				+ " set \"batchPath=%~0\"\n" + " for %%k in (%0) do set batchName=%%~nk\n"
				+ " set \"vbsGetPrivileges=%temp%/OEgetPriv_%batchName%.vbs\"\n" + " setlocal EnableDelayedExpansion\n"
				+ ":checkPrivileges\n" + "  NET FILE 1>NUL 2>NUL\n"
				+ "  if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )\n" + ":getPrivileges\n"
				+ "  if '%1'=='ELEV' (echo ELEV & shift /1 & goto gotPrivileges)\n" + "  ECHO.\n"
				+ "  ECHO **************************************\n" + "  ECHO Invoking UAC for Privilege Escalation\n"
				+ "  ECHO **************************************\n"
				+ "  ECHO Set UAC = CreateObject^(\"Shell.Application\"^) > \"%vbsGetPrivileges%\"\n"
				+ "  ECHO args = \"ELEV \" >> \"%vbsGetPrivileges%\"\n"
				+ "  ECHO For Each strArg in WScript.Arguments >> \"%vbsGetPrivileges%\"\n"
				+ "  ECHO args = args ^& strArg ^& \" \"  >> \"%vbsGetPrivileges%\"\n"
				+ "  ECHO Next >> \"%vbsGetPrivileges%\"\n" + "  if '%cmdInvoke%'=='1' goto InvokeCmd\n"
				+ "  ECHO UAC.ShellExecute \"!batchPath!\", args, \"\", \"runas\", 1 >> \"%vbsGetPrivileges%\"\n"
				+ "  goto ExecElevation\n" + ":InvokeCmd\n"
				+ "  ECHO args = \"/c \"\"\" + \"!batchPath!\" + \"\"\" \" + args >> \"%vbsGetPrivileges%\"\n"
				+ "  ECHO UAC.ShellExecute \"%SystemRoot%/%winSysFolder%/cmd.exe\", args, \"\", \"runas\", 1 >> \"%vbsGetPrivileges%\"\n"
				+ ":ExecElevation\n" + " \"%SystemRoot%/%winSysFolder%/WScript.exe\" \"%vbsGetPrivileges%\" %*\n"
				+ " exit /B\n" + ":gotPrivileges\n" + " setlocal & cd /d %~dp0\n"
				+ " if '%1'=='ELEV' (del \"%vbsGetPrivileges%\" 1>nul 2>nul  &  shift /1)\n"
				+ "::::::::::::::::::::::::\n" + "::START\n" + "::::::::::::::::::::::::\n"
				+ " REM Run shell as admin (example) - put here code as you like\n" + " " + commandToElevate
				+ " 2>&1 >> " + AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/logs/bash.service.log\n"
				+ " del /f /s *.cmd 2>&1 >> " + AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/logs/bash.service.log\n"
				+ " cmd /k\n";

		Files.write(Paths.get(elevatedScriptFilePath), scriptContent.getBytes());

		return elevatedScriptFilePath;
	}

	private void fsCopy(Path source, Path dest, CopyOption[] options) {
		try {
			Files.copy(source, dest, options);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

}
