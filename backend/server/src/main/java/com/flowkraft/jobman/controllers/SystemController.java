package com.flowkraft.jobman.controllers;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

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
import com.flowkraft.jobman.models.SystemInfo;
import com.flowkraft.jobman.services.SystemService;
import com.flowkraft.jobman.services.SystemService.DirCriteria;
import com.flowkraft.jobman.services.SystemService.FileCriteria;
import com.flowkraft.jobman.services.SystemService.FindCriteria;
import com.flowkraft.jobman.services.SystemService.InspectResult;
import com.flowkraft.jobman.services.SystemService.ProcessOutputResult;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/jobman/system", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class SystemController {

	@Autowired
	SystemService systemService;

	@GetMapping("/check-url")
	public Mono<Boolean> checkUrl(@RequestParam String url) throws Exception {

		// System.out.println("/jobman/system/check-url");

		String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8.toString());

		WebClient webClient = WebClient.create();

		return webClient.head().uri(decodedUrl).exchangeToMono(response -> {

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

	@GetMapping("/get-changelog")
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

	@GetMapping("/get-blog-posts")
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
	public Mono<SystemInfo> getSystemInfo() {

		// System.out.println("/info");
		SystemInfo info = SystemService.infoGet();
		return Mono.just(info);

	}

	@GetMapping("/unix-cli/find")
	public Mono<List<String>> find(@RequestParam String path, @RequestParam List<String> matching,
			@RequestParam Optional<Boolean> files, @RequestParam Optional<Boolean> directories,
			@RequestParam Optional<Boolean> recursive, @RequestParam Optional<Boolean> ignoreCase) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		List<String> results = systemService.unixCliFind(fullPath,
				new FindCriteria(matching, files, directories, recursive, ignoreCase));
		return Mono.just(results);
	}

	@GetMapping(value = "/unix-cli/cat", produces = MediaType.TEXT_PLAIN_VALUE)
	Mono<String> cat(@RequestParam String path) throws Exception {

		// System.out.println("/unix-cli/cat path = " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		String fileContent = systemService.unixCliCat(URLDecoder.decode(fullPath, StandardCharsets.UTF_8.toString()));
		// System.out.println("fileContent = " + fileContent);

		return Mono.just(fileContent);

	}

	@DeleteMapping("/fs/delete-quietly")
	public Mono<Boolean> deleteQuietly(@RequestParam String path) throws Exception {
		
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		
		Boolean deleted = systemService.fsDelete(fullPath);
		return Mono.just(deleted);
	}

	@GetMapping(value = "/fs/read-file-to-string", produces = MediaType.TEXT_PLAIN_VALUE)
	Mono<String> readFileToString(@RequestParam String path) throws Exception {

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		// System.out.println("/fs/read-file-to-string: fullPath = " + fullPath);

		String fileContent = systemService.unixCliCat(fullPath);
		return Mono.just(fileContent);

	}

	@PostMapping(value = "/fs/write-string-to-file", consumes = "text/plain")
	Mono<Void> writeStringToFile(@RequestParam String path, @RequestBody Optional<String> content) throws Exception {

		// System.out.println("/fs/write-string-to-file content = " + content);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		System.out.println("/fs/write-string-to-file fullPath = " + fullPath);

		return Mono.fromCallable(() -> {
			systemService.fsWriteStringToFile(fullPath, content);
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
			systemService.fsCopy(fullFromPath,
					fullToPath, overwrite, matching, ignoreCase);
			return null;
		});
	}

	@PostMapping("/fs/move")
	public Mono<Void> move(@RequestParam String fromPath, @RequestParam String toPath,
			@RequestParam(defaultValue = "false") boolean overwrite) {
		// System.out.println("/fs/move");

		return Mono.fromCallable(() -> {
			systemService.fsMove(Paths.get(URLDecoder.decode(fromPath, StandardCharsets.UTF_8.toString())),
					Paths.get(URLDecoder.decode(toPath, StandardCharsets.UTF_8.toString())), overwrite);
			return null;
		});
	}

	@GetMapping(value = "/fs/exists", produces = MediaType.TEXT_PLAIN_VALUE)
	public Mono<String> exists(@RequestParam String path) throws Exception {
		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		String exists = systemService.fsExists(fullPath);
		return Mono.just(exists);
	}

	@PostMapping(value = "/fs/dir")
	public Mono<Void> dir(@RequestParam String path, @RequestBody Optional<DirCriteria> criteria) throws Exception {
		// System.out.println("/fs/dir = " + path);

		String fullPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/"
				+ URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

		systemService.fsDir(fullPath, criteria);
		return Mono.empty();

	}

	@PostMapping("/fs/file")
	public Mono<String> file(@RequestParam String path, @RequestBody Optional<FileCriteria> criteria) throws Exception {
		// System.out.println("/fs/file");

		String file = systemService.fsFile(URLDecoder.decode(path, StandardCharsets.UTF_8.toString()), criteria);
		return Mono.just(file);

	}

	@GetMapping("/fs/inspect")
	public Mono<Optional<InspectResult>> inspect(@RequestParam String path, @RequestParam Optional<String> checksum,
			@RequestParam Optional<Boolean> mode, @RequestParam Optional<Boolean> times,
			@RequestParam Optional<Boolean> absolutePath, @RequestParam Optional<String> symlinks) throws Exception {
		// System.out.println("/fs/inspect");

		Optional<InspectResult> inspect = systemService.fsInspect(
				URLDecoder.decode(path, StandardCharsets.UTF_8.toString()), checksum, mode, times, absolutePath,
				symlinks);
		return Mono.just(inspect);

	}

	@PostMapping("/child-process/spawn")
	public Mono<ProcessOutputResult> spawn(@RequestBody List<String> args, @RequestParam Optional<String> cwdPath)
			throws Exception {

		// System.out.println("/child-process/spawn commands: " + args);

		return systemService.spawn(args, cwdPath);

	}

	@PostMapping("/install/chocolatey")
	public Mono<ProcessOutputResult> installChocolatey() throws Exception {
		// System.out.println("/install/chocolatey");

		return systemService.installChocolatey();

	}

	@PostMapping("/uninstall/chocolatey")
	public Mono<ProcessOutputResult> unInstallChocolatey() throws Exception {
		// System.out.println("/uninstall/chocolatey");

		return systemService.unInstallChocolatey();

	}
}
