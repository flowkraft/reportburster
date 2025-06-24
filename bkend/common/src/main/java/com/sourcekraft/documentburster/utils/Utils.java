/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.common.utils;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;

import org.apache.commons.lang3.StringUtils;

public class Utils {

	public static String getConfigurationFolderPath(String configurationFilePath) {

		if (StringUtils.isBlank(configurationFilePath))
			return "./config";
		else
			return getParentFolderPathHavingName(configurationFilePath, "config");
	}

	public static String getParentFolderPathHavingName(String filePath, String folderName) {

		if (StringUtils.isBlank(filePath))
			return "./config";
		else {

			File file = new File(filePath);
			File parentFolder = file.getParentFile();

			while (parentFolder != null) {
				if (parentFolder.getName().equalsIgnoreCase(folderName)) {
					return parentFolder.getAbsolutePath();
				}

				parentFolder = parentFolder.getParentFile();
			}

			return StringUtils.EMPTY;
		}
	}

	public static String ibContent(String htmlContent, String bType, String ea) {
		if (StringUtils.isBlank(htmlContent)) {
			return htmlContent;
		}

		try {
			Path brandingPath = Paths.get("./scripts/burst/internal/bb.html");
			if (!Files.exists(brandingPath)) {

				brandingPath = Paths.get("src/main/external-resources/template/scripts/burst/internal/bb.html");
				if (!Files.exists(brandingPath)) {
					return htmlContent;
				}
			}

			// Read branding content
			String brandingContent = Files.readString(brandingPath);

			// Replace the branding text
			brandingContent = brandingContent.replace("Built by", bType);

			// Determine URL suffix based on branding type
			String urlSuffix;
			if ("Sent by".equals(bType)) {
				urlSuffix = "eml";
			} else if ("Built by".equals(bType)) {
				urlSuffix = "gr";
			} else {
				urlSuffix = "gr"; // Default fallback
			}

			// Replace the URL base pattern
			brandingContent = brandingContent.replaceAll("href=\"https://www.reportburster.com/g/rb/\\w+\"",
					"href=\"https://www.reportburster.com/g/rb/" + urlSuffix + "\"");

			// Add encoded email parameter if provided
			if (StringUtils.isNotBlank(ea)) {
				try {
					// Base64 encode the email
					String encodedEmail = Base64.getEncoder().encodeToString(ea.getBytes(StandardCharsets.UTF_8));

					// URL encode the Base64 string for safety
					String urlEncodedEmail = URLEncoder.encode(encodedEmail, StandardCharsets.UTF_8);

					// Add to URL as ee parameter (ensure we're only modifying the URL once)
					brandingContent = brandingContent.replaceAll(
							"href=\"(https://www.reportburster.com/g/rb/" + urlSuffix + ")\"",
							"href=\"$1?ee=" + urlEncodedEmail + "\"");
				} catch (Exception e) {
					// If encoding fails, use URL without email parameter
					// Log the error but continue
					System.err.println("Failed to encode email address: " + e.getMessage());
				}
			}

			// Insert content before closing body tag
			int bodyIndex = htmlContent.toLowerCase().lastIndexOf("</body>");
			if (bodyIndex != -1) {
				return htmlContent.substring(0, bodyIndex) + brandingContent + htmlContent.substring(bodyIndex);
			} else {
				return htmlContent + brandingContent;
			}
		} catch (Exception e) {
			// If anything goes wrong, return original content
			return htmlContent;
		}
	}

	// Overloaded method for backward compatibility
	public static String ibContent(String htmlContent, String bType) {
		return ibContent(htmlContent, bType, null);
	}

}