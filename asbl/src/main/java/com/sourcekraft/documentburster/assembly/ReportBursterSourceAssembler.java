package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import org.apache.commons.io.FileUtils;
import org.zeroturnaround.zip.ZipUtil;

public class ReportBursterSourceAssembler extends AbstractAssembler {

	public ReportBursterSourceAssembler() {
		super("target/package/db-src", "target/package/verified-db-src", "target/reportburster-src.zip");
	}

	@Override
	protected void compile() throws Exception {
		// No compilation needed for source package
	}

	@Override
	protected void preparePackage() throws Exception {
		File sourceDir = new File(Utils.getTopProjectFolderPath());
		File targetDir = new File(packageDirPath + "/" + topFolderName);

		String[] excludePatterns = new String[] { "node_modules", ".venv", "__pycache__", "dependencies", "target",
				"results", "test-results", "dist", "release", ".git", ".angular", ".settings", "build", ".aider",
				".docs", ".workspace", ".log", "_ai_crew", ".flattened-pom" };

		FileUtils.copyDirectory(sourceDir, targetDir, file -> {
			String relativePath = sourceDir.toURI().relativize(file.toURI()).getPath();
			String fileName = file.getName();

			for (String pattern : excludePatterns) {
				// Check exact matches
				if (fileName.equals(pattern)) {
					return false;
				}

				// Check starts-with and ends-with for current file/folder
				if (fileName.startsWith(pattern) || fileName.endsWith(pattern)) {
					return false;
				}

				// Check exact matches in path
				if (relativePath.contains("/" + pattern + "/")) {
					return false;
				}

				// Check starts-with and ends-with in path components
				String[] pathParts = relativePath.split("/");
				for (String part : pathParts) {
					if (part.startsWith(pattern) || part.endsWith(pattern)) {
						return false;
					}
				}
			}
			return true;
		});

		System.out.println(
				"------------------------------------- DONE:ReportBursterSourceAssembler copied source files ... -------------------------------------");
	}

	@Override
	public void verify() throws Exception {
		ZipUtil.unpack(new File(targetPathZipFile), new File(verifyDirPath));

		// Verify key source directories/files exist
		String[] requiredPaths = { "/frontend", "/backend", "/documentation", "/pom.xml", "/README.md" };

		for (String path : requiredPaths) {
			String verifyFilePath = verifyDirPath + "/" + topFolderName + path;
			assertThat(new File(verifyFilePath).exists())
					.withFailMessage("Required path not found verifyFilePath: " + verifyFilePath).isTrue();
		}

		System.out.println(
				"------------------------------------- VERIFIED:ReportBursterSourceAssembler source package ... -------------------------------------");
	}
}