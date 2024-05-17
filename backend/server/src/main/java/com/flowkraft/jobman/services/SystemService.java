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

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.input.Tailer;
import org.apache.commons.io.input.TailerListenerAdapter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.unix4j.Unix4j;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowkraft.common.AppPaths;
import com.flowkraft.common.Utils;
import com.flowkraft.jobman.models.FileInfo;
import com.flowkraft.jobman.models.SystemInfo;
import com.flowkraft.jobman.models.WebSocketJobsExecutionStatsInfo;
import com.sourcekraft.documentburster.common.utils.DumpToString;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class SystemService {

	@Autowired
	private SimpMessageSendingOperations messagingTemplate;

	private Map<String, Tailer> existingTailers = new HashMap<>();

	public static SystemInfo getSystemInfo() {
		SystemInfo info = new SystemInfo();
		info.osName = System.getProperty("os.name");
		info.osVersion = System.getProperty("os.version");
		info.userName = System.getProperty("user.name");
		info.osArch = System.getProperty("os.arch");
		return info;
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

	public List<String> unixCliFind(String path, FindCriteria criteria) throws Exception {

		// System.out.println("PORTABLE_EXECUTABLE_DIR_PATH: " +
		// AppPaths.PORTABLE_EXECUTABLE_DIR_PATH);

		// System.out.println("path = " + path + ", criteria = " + criteria);
		Stream<Path> stream;

		if (criteria.recursive) {
			stream = Files.walk(Paths.get(path));
		} else {
			stream = Files.list(Paths.get(path));
		}

		if (criteria.files) {
			stream = stream.filter(Files::isRegularFile);
		}

		if (criteria.directories) {
			stream = stream.filter(Files::isDirectory);
		}

		if (criteria.matching != null) {
			stream = stream.filter(filePath -> {
				String fileName = filePath.getFileName().toString();
				return criteria.matching.stream().anyMatch(pattern -> {
					String matchingPattern = criteria.ignoreCase ? "(?i)" + pattern : pattern;
					String regexPattern = matchingPattern.replace(".", "\\.").replace("*", ".*").replace("?", ".");
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

	public class ProcessOutputResult {
		public boolean success;
		public List<String> stdOutErrlines;

		public ProcessOutputResult(boolean success, List<String> stdOutErrlines) {
			super();
			this.success = success;
			this.stdOutErrlines = stdOutErrlines;
		}
	}

	public Mono<ProcessOutputResult> spawn(List<String> args, Optional<String> cwdPath) throws Exception {
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
			String modifiedArg = arg.replace("PORTABLE_EXECUTABLE_DIR_PATH/",
					AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/");
			if (os.contains("nix") || os.contains("nux") || os.contains("mac")) {
				modifiedArg = modifiedArg.replace(".bat", ".sh");
			}
			newArgs.add(modifiedArg);
		}
		commandWithShell.addAll(newArgs);

		String workingDirectoryPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH;

		if (cwdPath.isPresent()) {
			workingDirectoryPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
					+ URLDecoder.decode(cwdPath.get(), StandardCharsets.UTF_8.toString());
		}

		System.out.println("workingDirectoryPath: " + workingDirectoryPath);

		System.out.println("commandWithShell:");
		commandWithShell.stream().forEach(System.out::println);

		ProcessBuilder processBuilder = new ProcessBuilder(commandWithShell);
		processBuilder.directory(new File(workingDirectoryPath));

		Process process = processBuilder.start();

		Flux<String> stdoutFlux = Flux.using(() -> new BufferedReader(new InputStreamReader(process.getInputStream())),
				reader -> Flux.fromStream(reader.lines()), Utils.uncheckedConsumer(BufferedReader::close));

		Flux<String> stderrFlux = Flux.using(() -> new BufferedReader(new InputStreamReader(process.getErrorStream())),
				reader -> Flux.fromStream(reader.lines()), Utils.uncheckedConsumer(BufferedReader::close));

		return Flux.merge(stdoutFlux, stderrFlux).collectList()
				.map(outputLines -> new ProcessOutputResult(process.exitValue() == 0, outputLines))
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

		if (content.isPresent())
			Files.write(Paths.get(path), content.get().getBytes(StandardCharsets.UTF_8));
		else
			Files.write(Paths.get(path), StringUtils.EMPTY.getBytes(StandardCharsets.UTF_8));
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

	public String fsDir(String path, Optional<DirCriteria> criteria) throws Exception {
		Path dirPath = Paths.get(path);
		if (Files.exists(dirPath)) {
			if (!Files.isDirectory(dirPath)) {
				throw new RuntimeException("Path exists but is not a directory");
			}

			if (criteria.isPresent()) {

				DirCriteria c = criteria.get();

				// System.out.println("DirCriteria: " + c);
				// System.out.println("Directory path: " + dirPath);
				String[] fileList = dirPath.toFile().list();
				// System.out.println("File list: " + Arrays.toString(fileList));

				if (c.empty && dirPath.toFile().list().length > 0) {
					try (Stream<Path> paths = Files.walk(dirPath)) {
						paths.filter(p -> !p.equals(dirPath)).sorted(Comparator.reverseOrder()).map(Path::toFile)
								.forEach(File::delete);
					}
				}

				if (!StringUtils.isBlank(c.mode)) {
					Set<PosixFilePermission> perms = PosixFilePermissions.fromString(c.mode);
					Files.setPosixFilePermissions(dirPath, perms);
				}
			}
		} else {
			Files.createDirectories(dirPath);
		}

		return dirPath.toString().replace("\\", "/");
	}

	public String fsFile(String path, Optional<FileCriteria> criteria) throws Exception {
		Path filePath = Paths.get(path);
		if (!Files.exists(filePath)) {
			Files.createDirectories(filePath.getParent());
			Files.createFile(filePath);
		}

		if (criteria.isPresent()) {
			FileCriteria c = criteria.get();
			if (!Objects.isNull(c.content)) {
				if (c.content instanceof String) {
					Files.write(filePath, ((String) c.content).getBytes(StandardCharsets.UTF_8));
				} else if (c.content instanceof byte[]) {
					Files.write(filePath, (byte[]) c.content);
				} else if (c.content instanceof ByteBuffer) {
					Files.write(filePath, ((ByteBuffer) c.content).array());
				} else {
					ObjectMapper objectMapper = new ObjectMapper();
					objectMapper.writerWithDefaultPrettyPrinter().writeValue(filePath.toFile(), c.content);
				}
			}

			if (!Objects.isNull(c.mode)) {
				Set<PosixFilePermission> perms = PosixFilePermissions.fromString(c.mode);
				Files.setPosixFilePermissions(filePath, perms);
			}
		}

		return path;
	}

	public Optional<InspectResult> fsInspect(String path, Optional<String> checksum, Optional<Boolean> mode,
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

		InspectResult result = new InspectResult();
		result.name = filePath.getFileName().toString();
		result.type = Files.isDirectory(filePath) ? "dir" : "file";

		if (Files.isRegularFile(filePath)) {
			result.size = Files.size(filePath);
		}

		if (mode.isPresent()) {
			if (mode.get()) {
				result.mode = (int) Files.getAttribute(filePath, "unix:mode");
			}
		}

		if (times.isPresent()) {
			if (times.get()) {
				BasicFileAttributes attrs = Files.readAttributes(filePath, BasicFileAttributes.class);
				result.accessTime = Instant.ofEpochMilli(attrs.lastAccessTime().toMillis());
				result.modifyTime = Instant.ofEpochMilli(attrs.lastModifiedTime().toMillis());
				result.changeTime = Instant.ofEpochMilli(attrs.creationTime().toMillis());
			}

		}

		// Note: Symlinks and checksums are not handled in this example

		return Optional.of(result);
	}

	public Mono<ProcessOutputResult> installChocolatey() throws Exception {

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

	public Mono<ProcessOutputResult> unInstallChocolatey() throws Exception {

		String elevatedScriptFilePath = getCommandReadyToBeRunAsAdministratorUsingBatchCmd(
				"& ../tools/chocolatey/uninstall.ps1");

		List<String> commands = Arrays.asList("cmd.exe", "/c", elevatedScriptFilePath);
		return spawn(commands, Optional.empty());

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

	public static class DirCriteria extends DumpToString {
		private static final long serialVersionUID = 5563826436868324773L;
		public boolean empty = false;
		public String mode;
	}

	public static class FileCriteria {
		public Object content;
		public Integer jsonIndent;
		public String mode;
	}

	public static class FindCriteria extends DumpToString {
		public List<String> matching;
		public boolean files;
		public boolean directories;
		public boolean recursive;
		public boolean ignoreCase;

		public FindCriteria(List<String> matching, Optional<Boolean> files, Optional<Boolean> directories,
				Optional<Boolean> recursive, Optional<Boolean> ignoreCase) {
			this.matching = matching;
			this.files = files.orElse(true);
			this.directories = directories.orElse(false);
			this.recursive = recursive.orElse(false);
			this.ignoreCase = ignoreCase.orElse(false);
		}

		public String[] getUnix4jOptions() {
			List<String> options = new ArrayList<>();
			if (files) {
				options.add("--typeFile");
			}
			if (ignoreCase) {
				options.add("--ignoreCase");
			}
			options.add("--name");
			if (matching != null) {
				for (String match : matching) {
					options.add("--name");
					options.add(match);
				}
			}

			return options.toArray(new String[0]);
		}
	}

	public static class InspectCriteria {
		public String checksum;
		public Boolean mode;
		public Boolean times;
		public Boolean absolutePath;
		public String symlinks;
	}

	public static class InspectResult {
		public String name;
		public String type;
		public Long size;
		public String md5;
		public Integer mode;
		public Instant accessTime;
		public Instant modifyTime;
		public Instant changeTime;
		public Instant birthTime;
	}

}
