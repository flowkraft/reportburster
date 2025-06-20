package com.sourcekraft.documentburster._helpers;

import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.utils.Utils;

public class TestsUtils {

	public static final String TESTS_OUTPUT_FOLDER = "./target/test-output";

	public static List<String[]> toArrayRows(List<LinkedHashMap<String, Object>> data) {
		if (data == null)
			return Collections.emptyList();
		return data.stream()
				.map(row -> row.values().stream().map(v -> v == null ? "" : v.toString()).toArray(String[]::new))
				.collect(Collectors.toList());
	}

	public static void cleanOutputFolder() throws Exception {

		FileUtils.deleteDirectory(new File(TestsUtils.TESTS_OUTPUT_FOLDER));

	}

	public static final void assertBackupStatsAndLogArchivesFiles(AbstractBurster burster) throws Exception {

		// assert the backup file
		File backupFile = new File(
				burster.getCtx().backupFolder + "/" + FilenameUtils.getName(burster.getCtx().inputDocumentFilePath));
		assertTrue(backupFile.exists());

		// assert _stats file
		String logsArchivesFolderPath = burster.getCtx().logsArchivesFolder;

		String statsFileName = Utils.getStringFromTemplate(burster.getCtx().settings.getStatsFileName(),
				burster.getCtx().variables, burster.getCtx().token);
		String statsFilePath = logsArchivesFolderPath + "/" + statsFileName;

		String statsFileContent = FileUtils.readFileToString(new File(statsFilePath), "UTF-8");

		if ((StringUtils.isNotBlank(burster.getCtx().inputDocumentFilePath))
				&& burster.getCtx().inputDocumentFilePath.endsWith(".pdf"))
			assertTrue(statsFileContent.contains("Number Of Pages = " + burster.getCtx().numberOfPages));

		assertTrue(statsFileContent.contains("Number Of Tokens Read = " + burster.getCtx().burstTokens.size()));
		assertTrue(statsFileContent
				.contains("Number Of Documents Extracted = " + burster.getCtx().numberOfExtractedFiles));

		assertTrue(statsFileContent
				.contains("Number Of Documents Distributed = " + burster.getCtx().numberOfDistributedFiles));

		if (burster.getCtx().numberOfSkippedFiles > 0)
			assertTrue(statsFileContent
					.contains("Number Of Documents Skipped = " + burster.getCtx().numberOfSkippedFiles));

		if (burster.getCtx().numberOfQuarantinedFiles > 0)
			assertTrue(statsFileContent
					.contains("Number Of Documents Quarantined = " + burster.getCtx().numberOfQuarantinedFiles));

		if (StringUtils.isNotEmpty(burster.getCtx().outputFolder))
			assertTrue(statsFileContent.contains("Output Folder = '" + burster.getCtx().outputFolder + "'"));

		if (StringUtils.isNotEmpty(burster.getCtx().quarantineFolder))
			assertTrue(statsFileContent.contains("Quarantine Folder = '" + burster.getCtx().quarantineFolder + "'"));

	}

}