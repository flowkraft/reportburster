package com.flowkraft.common;

import org.apache.commons.io.FilenameUtils;

/**
 * Shared MIME type detection utility.
 * Used by ReportsController (template asset serving) and FileExplorerController (file viewing).
 */
public class MimeTypeUtils {

	public static String determineContentType(String fileNameOrPath) {
		String extension = FilenameUtils.getExtension(fileNameOrPath).toLowerCase();

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

		// Default binary
		default:
			return "application/octet-stream";
		}
	}
}
