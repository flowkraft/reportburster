package com.flowkraft.jobman.controllers;

import java.io.File;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.jobman.config.FileExplorerConfiguration;
import com.flowkraft.jobman.models.FileTreeVO;
import com.flowkraft.jobman.services.FileExplorerService;
import com.flowkraft.jobman.services.SystemService;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/jobman/file-explorer")
public class FileExplorerController {

	@Autowired
	private SystemService systemService;

	@Autowired
	private FileExplorerService fileExplorerService;

	@Autowired
	private FileExplorerConfiguration fileExplorerConfig;

	/**
	 * Get metadata information about the file explorer
	 */
	@GetMapping("/meta-info")
	public Mono<Map<String, Object>> getMetaInfo() {
		return Mono.fromCallable(() -> {
			Map<String, Object> metaInfo = new HashMap<>();
			metaInfo.put("title", fileExplorerConfig.getTitle());
			metaInfo.put("description", fileExplorerConfig.getDescription());
			metaInfo.put("quickLinks", fileExplorerConfig.getQuickLinks());
			// Add baseDirPath to the meta info
			metaInfo.put("baseDirPath", fileExplorerConfig.getBaseDirPath()); 
			return metaInfo;
		});
	}

	/**
	 * Get file tree structure for a directory
	 */
	@GetMapping("/file-tree")
	public Mono<FileTreeVO> getFileTree(@RequestParam String dir) {
		return Mono.fromCallable(() -> {
			try {
				String decodedPath = URLDecoder.decode(dir, StandardCharsets.UTF_8.toString());
				String fullPath = resolveFullPath(decodedPath);
				return fileExplorerService.buildFileTree(fullPath); // Changed from getFileTree to buildFileTree
			} catch (Exception e) {
				throw new RuntimeException("Error getting file tree", e);
			}
		});
	}

	/**
	 * View file content
	 */
	@GetMapping(value = "/file-viewer", produces = MediaType.TEXT_HTML_VALUE)
	public Mono<ResponseEntity<String>> viewFile(@RequestParam String file) {
		return Mono.fromCallable(() -> {
			try {
				String decodedPath = URLDecoder.decode(file, StandardCharsets.UTF_8.toString());
				String fullPath = resolveFullPath(decodedPath);

				File fileObj = new File(fullPath);
				if (!fileObj.exists() || !fileObj.isFile() || !fileObj.canRead()) {
					return ResponseEntity.status(HttpStatus.NOT_FOUND)
							.body("<html><body><h1>404 File Not Found or Not Readable</h1></body></html>");
				}

				String fileContent = systemService.unixCliCat(fullPath);
				String fileName = fileObj.getName();
				String fileExtension = FilenameUtils.getExtension(fileName).toLowerCase();

				// Create a simple HTML viewer for the file content
				StringBuilder htmlBuilder = new StringBuilder();
				htmlBuilder.append("<!DOCTYPE html>\n<html>\n<head>\n");
				htmlBuilder.append("<title>File Viewer: ").append(fileName).append("</title>\n");
				htmlBuilder.append("<meta charset=\"UTF-8\">\n");
				htmlBuilder.append("<style>\n");
				htmlBuilder.append("body { font-family: Arial, sans-serif; margin: 20px; }\n");
				htmlBuilder.append(
						"pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }\n");
				htmlBuilder.append("h1 { color: #333; }\n");
				htmlBuilder.append("</style>\n");

				// Add syntax highlighting for common code files
				if (Arrays.asList("js", "ts", "java", "py", "html", "xml", "css", "json", "yml", "yaml")
						.contains(fileExtension)) {
					htmlBuilder.append(
							"<link href=\"https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css\" rel=\"stylesheet\">\n");
				}

				htmlBuilder.append("</head>\n<body>\n");
				htmlBuilder.append("<h1>").append(fileName).append("</h1>\n");

				if (Arrays.asList("jpg", "jpeg", "png", "gif", "bmp", "webp").contains(fileExtension)) {
					// Display as image
					htmlBuilder.append("<img src=\"/api/jobman/file-explorer/file-downloader?file=")
							.append(URLDecoder.decode(file, StandardCharsets.UTF_8.toString()))
							.append("\" style=\"max-width: 100%;\">");
				} else if (fileExtension.equals("pdf")) {
					// Display PDF with object tag
					htmlBuilder.append("<object data=\"/api/jobman/file-explorer/file-downloader?file=")
							.append(URLDecoder.decode(file, StandardCharsets.UTF_8.toString()))
							.append("\" type=\"application/pdf\" width=\"100%\" height=\"800px\">")
							.append("<p>Unable to display PDF. <a href=\"/api/jobman/file-explorer/file-downloader?file=")
							.append(URLDecoder.decode(file, StandardCharsets.UTF_8.toString()))
							.append("\">Download</a> instead.</p>").append("</object>");
				} else {
					// Display as code with syntax highlighting for common types
					String language = "";
					switch (fileExtension) {
					case "js":
						language = "javascript";
						break;
					case "ts":
						language = "typescript";
						break;
					case "java":
						language = "java";
						break;
					case "py":
						language = "python";
						break;
					case "html":
						language = "html";
						break;
					case "xml":
						language = "xml";
						break;
					case "css":
						language = "css";
						break;
					case "json":
						language = "json";
						break;
					case "yml":
					case "yaml":
						language = "yaml";
						break;
					default:
						language = "";
						break;
					}

					if (!language.isEmpty()) {
						htmlBuilder.append("<pre><code class=\"language-").append(language).append("\">")
								.append(escapeHtml(fileContent)).append("</code></pre>\n");
					} else {
						htmlBuilder.append("<pre>").append(escapeHtml(fileContent)).append("</pre>\n");
					}

					// Add Prism.js for syntax highlighting
					if (!language.isEmpty()) {
						htmlBuilder.append(
								"<script src=\"https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js\"></script>\n");
						htmlBuilder
								.append("<script src=\"https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-")
								.append(language).append(".min.js\"></script>\n");
					}
				}

				htmlBuilder.append("</body>\n</html>");

				return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(htmlBuilder.toString());
			} catch (Exception e) {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
						"<html><body><h1>500 Internal Server Error</h1><p>" + e.getMessage() + "</p></body></html>");
			}
		});
	}

	/**
	 * Download a file
	 */
	@GetMapping("/file-downloader")
	public Mono<ResponseEntity<FileSystemResource>> downloadFile(@RequestParam String file) {
		return Mono.fromCallable(() -> {
			try {
				String decodedPath = URLDecoder.decode(file, StandardCharsets.UTF_8.toString());
				String fullPath = resolveFullPath(decodedPath);

				File fileObj = new File(fullPath);
				if (!fileObj.exists() || !fileObj.isFile() || !fileObj.canRead()) {
					return ResponseEntity.notFound().build();
				}

				String fileName = fileObj.getName();
				String contentType = determineContentType(fileName);

				HttpHeaders headers = new HttpHeaders();
				headers.setContentDisposition(ContentDisposition.builder("attachment").filename(fileName).build());
				headers.setContentType(MediaType.parseMediaType(contentType));
				headers.setContentLength(fileObj.length());

				return ResponseEntity.ok().headers(headers).body(new FileSystemResource(fileObj));
			} catch (Exception e) {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
			}
		});
	}

	/**
	 * Get file content as text
	 */
	@GetMapping(value = "/file-content", produces = MediaType.TEXT_PLAIN_VALUE)
	public Mono<ResponseEntity<String>> getFileContent(@RequestParam String file) {
		return Mono.fromCallable(() -> {
			try {
				String decodedPath = URLDecoder.decode(file, StandardCharsets.UTF_8.toString());
				String fullPath = resolveFullPath(decodedPath);

				File fileObj = new File(fullPath);
				if (!fileObj.exists() || !fileObj.isFile() || !fileObj.canRead()) {
					return ResponseEntity.notFound().build();
				}

				String fileContent = systemService.unixCliCat(fullPath);
				return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(fileContent);
			} catch (Exception e) {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
			}
		});
	}

	/**
	 * Create a new directory
	 */
	@PostMapping("/create-directory")
	public Mono<Boolean> createDirectory(@RequestBody Map<String, String> request) {
		return Mono.fromCallable(() -> {
			try {
				String path = request.get("path");
				String name = request.get("name");

				if (path == null || name == null || name.trim().isEmpty()) {
					return false;
				}

				String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
				String fullPath = resolveFullPath(decodedPath);

				File parentDir = new File(fullPath);
				if (!parentDir.exists() || !parentDir.isDirectory() || !parentDir.canWrite()) {
					return false;
				}

				File newDir = new File(parentDir, name);
				return newDir.mkdir();
			} catch (Exception e) {
				return false;
			}
		});
	}

	/**
	 * Delete a file or directory
	 */
	@DeleteMapping("/delete")
	public Mono<Boolean> delete(@RequestParam String path) {
		return Mono.fromCallable(() -> {
			try {
				String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
				String fullPath = resolveFullPath(decodedPath);

				File file = new File(fullPath);
				if (!file.exists()) {
					return false;
				}

				if (file.isDirectory()) {
					FileUtils.deleteDirectory(file);
				} else {
					file.delete();
				}

				return true;
			} catch (Exception e) {
				return false;
			}
		});
	}

	/**
	 * Upload a file
	 */
	@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public Mono<Boolean> upload(@RequestPart("file") FilePart filePart, @RequestParam String dir) {
		return Mono.fromCallable(() -> {
			try {
				String decodedDir = URLDecoder.decode(dir, StandardCharsets.UTF_8.toString());
				String fullDir = resolveFullPath(decodedDir);

				File targetDir = new File(fullDir);
				if (!targetDir.exists() || !targetDir.isDirectory() || !targetDir.canWrite()) {
					return false;
				}

				Path tempFile = Files.createTempFile("upload-", "-temp");

				return filePart.transferTo(tempFile).then(Mono.fromCallable(() -> {
					File targetFile = new File(targetDir, filePart.filename());
					Files.copy(tempFile, targetFile.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
					Files.deleteIfExists(tempFile);
					return true;
				})).onErrorReturn(false).block();
			} catch (Exception e) {
				return false;
			}
		});
	}

	private String resolveFullPath(String path) {
		if (path == null || path.trim().isEmpty()) {
			// Default to base directory if path is empty
			return fileExplorerConfig.getBaseDirPath();
		}

		// Fix Windows paths that start with a slash before the drive letter
		if (path.matches("^/[A-Za-z]:.*")) {
			path = path.substring(1); // Remove the leading slash
		}

		// If the path is relative (doesn't start with a drive letter on Windows or / on
		// Unix)
		if (!path.matches("^[A-Za-z]:.*") && !path.startsWith("/")) {
			return fileExplorerConfig.getBaseDirPath() + "/" + path;
		}

		// Check if we need to restrict to base directory
		if (fileExplorerConfig.getRestrictToBaseDir()) {
			try {
				File requestedFile = new File(path);
				File baseDir = new File(fileExplorerConfig.getBaseDirPath());

				// Convert to canonical paths to handle relative paths like "../"
				String canonicalRequestedPath = requestedFile.getCanonicalPath();
				String canonicalBasePath = baseDir.getCanonicalPath();

				if (!canonicalRequestedPath.startsWith(canonicalBasePath)) {
					return fileExplorerConfig.getBaseDirPath();
				}
			} catch (Exception e) {
				return fileExplorerConfig.getBaseDirPath();
			}
		}

		return path;
	}

	/**
	 * Helper method to determine content type based on file extension
	 */
	private String determineContentType(String fileName) {
		String extension = FilenameUtils.getExtension(fileName).toLowerCase();

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

		// Documents
		case "pdf":
			return "application/pdf";
		case "doc":
			return "application/msword";
		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case "xls":
			return "application/vnd.ms-excel";
		case "xlsx":
			return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		case "ppt":
			return "application/vnd.ms-powerpoint";
		case "pptx":
			return "application/vnd.openxmlformats-officedocument.presentationml.presentation";

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
		case "md":
			return "text/markdown";
		case "csv":
			return "text/csv";

		// Archives
		case "zip":
			return "application/zip";
		case "rar":
			return "application/x-rar-compressed";
		case "7z":
			return "application/x-7z-compressed";
		case "tar":
			return "application/x-tar";
		case "gz":
			return "application/gzip";

		// Default
		default:
			return "application/octet-stream";
		}
	}

	/**
	 * Helper method to escape HTML special characters
	 */
	private String escapeHtml(String input) {
		if (input == null)
			return "";
		return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")
				.replace("'", "&#39;");
	}
}