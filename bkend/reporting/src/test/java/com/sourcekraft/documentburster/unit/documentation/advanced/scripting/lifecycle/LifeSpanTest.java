package com.sourcekraft.documentburster.unit.documentation.advanced.scripting.lifecycle;

import java.io.File;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.*;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.utils.Scripts;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.variables.Variables;

public class LifeSpanTest {

	private static final int HOW_MANY_VARIABLES_TO_ASSERT = 10;

	private static final String USER_VARIABLES_PATH = "src/test/resources/input/unit/pdf/user-variables.pdf";

	private static final List<String> tokens = Arrays.asList("page1", "page2", "page3");

	@Test
	public final void burst() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "LifeSpanTest-burst") {
			protected void executeController() throws Exception {

				super.executeController();

				ctx.scripts.startBursting = "startBursting_lifespan.groovy";
				ctx.scripts.startParsePage = "startParsePage_lifespan.groovy";
				ctx.scripts.endParsePage = "endParsePage_lifespan.groovy";
				ctx.scripts.startExtractDocument = "startExtractDocument_lifespan.groovy";
				ctx.scripts.endExtractDocument = "endExtractDocument_lifespan.groovy";
				ctx.scripts.startDistributeDocument = "startDistributeDocument_lifespan.groovy";
				ctx.scripts.endDistributeDocument = "endDistributeDocument_lifespan.groovy";
				ctx.scripts.quarantineDocument = "quarantineDocument_lifespan.groovy";
				ctx.scripts.endBursting = "endBursting_lifespan.groovy";

			};
		};

		burster.burst(USER_VARIABLES_PATH, false, StringUtils.EMPTY, -1);

	}

	public static void assertStartBursting(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		// ctx.numberOfPages
		assertTrue(ctx.numberOfPages == -1);

	}

	public static void assertStartParsePage(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		assertStuffForStartParsePageLifeCyclePhase(ctx);

		// ctx.numberOfPages
		assertTrue(ctx.numberOfPages == 3);

	}

	public static void assertEndParsePage(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		assertStuffForEndParsePageLifeCyclePhase(ctx);

	}

	public static void assertStartExtractDocument(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		// ctx.configurationFilePath
		assertTrue((new File(ctx.configurationFilePath)).exists());

		assertUserVariables(ctx.variables);

	}

	public static void assertEndExtractDocument(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		// ctx.configurationFilePath
		assertTrue((new File(ctx.configurationFilePath)).exists());

		assertPerDocumentStuff(ctx);

		assertPerDocumentBuiltInVariables(ctx.variables);
		assertUserVariables(ctx.variables);

		// ctx.skipCurrentFileDistribution
		assertFalse(ctx.skipCurrentFileDistribution);

		// $extracted_file_path$
		String extractedFilePath = ctx.variables.get(Variables.EXTRACTED_FILE_PATH).toString();
		assertTrue(new File(extractedFilePath).exists());

	}

	public static void assertStartDistributeDocument(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		// ctx.configurationFilePath
		assertTrue((new File(ctx.configurationFilePath)).exists());

		assertPerDocumentStuff(ctx);

		assertPerDocumentBuiltInVariables(ctx.variables);
		assertUserVariables(ctx.variables);

		// ctx.skipCurrentFileDistribution
		assertFalse(ctx.skipCurrentFileDistribution);

	}

	public static void assertQuarantineDocument(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		// ctx.configurationFilePath
		assertTrue((new File(ctx.configurationFilePath)).exists());

		assertPerDocumentStuff(ctx);

		File folder = new File(ctx.quarantineFolder);
		assertTrue(folder.exists());

		assertPerDocumentBuiltInVariables(ctx.variables);
		assertUserVariables(ctx.variables);

	}

	public static void assertEndDistributeDocument(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		// ctx.configurationFilePath
		assertTrue((new File(ctx.configurationFilePath)).exists());

		assertPerDocumentStuff(ctx);

		assertPerDocumentBuiltInVariables(ctx.variables);
		assertUserVariables(ctx.variables);

	}

	public static void assertEndBursting(BurstingContext ctx) throws Exception {

		assertCommonStuffToAllLifeCyclePhases(ctx);

		// ctx.configurationFilePath
		assertTrue((new File(ctx.configurationFilePath)).exists());

		File folder = new File(ctx.backupFolder);
		assertTrue(folder.exists());

		assertUserVariables(ctx.variables);

		// ctx.numberOfExtractedFiles
		assertTrue(ctx.numberOfExtractedFiles == 3);

		// ctx.numberOfDistributedFiles
		assertTrue(ctx.numberOfDistributedFiles == 0);

		// ctx.numberOfSkippedFiles
		assertTrue(ctx.numberOfSkippedFiles == 0);

		// ctx.numberOfQuarantinedFiles
		assertTrue(ctx.numberOfQuarantinedFiles == 0);

	}

	private static void assertCommonStuffToAllLifeCyclePhases(BurstingContext ctx) {

		// 1. ctx.inputDocumentFilePath
		assertEquals(USER_VARIABLES_PATH, ctx.inputDocumentFilePath);
		assertTrue((new File(ctx.inputDocumentFilePath)).exists());

		// 2. ctx.settings
		assertSettings(ctx.settings);

		// 3. ctx.variables
		assertBuiltInVariablesCommonToAllLifeCyclePhases(ctx.variables);

		// 4. ctx.scripts
		assertScripts(ctx.scripts);

		// 6. ctx.additionalInformation
		assertNull(ctx.additionalInformation);

	}

	private static void assertBuiltInVariablesCommonToAllLifeCyclePhases(Variables variables) {

		// ${input_document_name}
		assertEquals(FilenameUtils.getName(USER_VARIABLES_PATH), variables.get(Variables.INPUT_DOCUMENT_NAME));

		// ${input_document_extension}
		assertEquals(FilenameUtils.getExtension(USER_VARIABLES_PATH),
				variables.get(Variables.INPUT_DOCUMENT_EXTENSION));

	}

	private static void assertPerDocumentBuiltInVariables(Variables variables) {

		// $burst_token$,$burst_index$
		int index = Integer.parseInt(variables.get(Variables.BURST_INDEX).toString());

		assertEquals(tokens.get(index - 1), variables.get(Variables.BURST_TOKEN));

		// $output_folder$
		String outputFolder = variables.get(Variables.OUTPUT_FOLDER).toString();
		assertTrue(new File(outputFolder).exists());

	}

	private static void assertUserVariables(Variables variables) {

		// assert user variable values
		String index = variables.get(Variables.BURST_INDEX).toString();
		String token = variables.get(Variables.BURST_TOKEN).toString();

		Map<String, Object> userVariables = variables.getUserVariables(token);

		for (int i = 0; i < HOW_MANY_VARIABLES_TO_ASSERT; i++) {

			String varName = "var" + i;
			String varValue = userVariables.get(varName).toString();

			assertEquals("p" + index + "-" + varName, varValue);

		}

	}

	private static void assertSettings(Settings settings) {

		// burstFileName
		assertEquals("${burst_token}.${output_type_extension}", settings.getBurstFileName());

		// outputFolder, backupFolder, quarantineFolder
		assertEquals(TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/output/${input_document_name}/LifeSpanTest-burst/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}",
				settings.getOutputFolder());
		assertEquals(
				TestsUtils.TESTS_OUTPUT_FOLDER
						+ "/backup/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}",
				settings.getBackupFolder());
		assertEquals(
				TestsUtils.TESTS_OUTPUT_FOLDER
						+ "/quarantine/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}",
				settings.getQuarantineFolder());

		// sendFiles
		assertFalse(settings.getSendFiles().email);
		assertFalse(settings.getSendFiles().upload);
		assertFalse(settings.getSendFiles().web);
		assertFalse(settings.getSendFiles().sms);

		// deleteFiles
		assertFalse(settings.isDeleteFiles());

		// quarantineFiles
		assertTrue(settings.isQuarantineFiles());

	}

	private static void assertScripts(Scripts scripts) {

		assertEquals(scripts.startBursting, "startBursting_lifespan.groovy");
		assertEquals(scripts.startParsePage, "startParsePage_lifespan.groovy");
		assertEquals(scripts.endParsePage, "endParsePage_lifespan.groovy");
		assertEquals(scripts.startExtractDocument, "startExtractDocument_lifespan.groovy");
		assertEquals(scripts.endExtractDocument, "endExtractDocument_lifespan.groovy");
		assertEquals(scripts.startDistributeDocument, "startDistributeDocument_lifespan.groovy");
		assertEquals(scripts.endDistributeDocument, "endDistributeDocument_lifespan.groovy");
		assertEquals(scripts.quarantineDocument, "quarantineDocument_lifespan.groovy");
		assertEquals(scripts.endBursting, "endBursting_lifespan.groovy");

	}

	private static void assertStuffForStartParsePageLifeCyclePhase(BurstingContext ctx) {

		// ctx.currentPageIndex
		assertTrue(Arrays.asList(1, 2, 3).contains(ctx.currentPageIndex));

		// ctx.currentPageText,ctx.previousPageText
		String currentPageText = ctx.currentPageText;
		String previousPageText = ctx.previousPageText;

		if (ctx.currentPageIndex == 1) {
			assertEquals(StringUtils.EMPTY, previousPageText);
			assertEquals(StringUtils.EMPTY, currentPageText);
		} else if (ctx.currentPageIndex == 2) {
			assertTrue(previousPageText.contains("{page1}"));
			assertEquals(StringUtils.EMPTY, currentPageText);
		} else if (ctx.currentPageIndex == 3) {
			assertTrue(previousPageText.contains("{page2}"));
			assertEquals(StringUtils.EMPTY, currentPageText);
		}

	}

	private static void assertStuffForEndParsePageLifeCyclePhase(BurstingContext ctx) {

		// ctx.currentPageIndex
		assertTrue(Arrays.asList(1, 2, 3).contains(ctx.currentPageIndex));

		// ctx.currentPageText,ctx.previousPageText
		String currentPageText = ctx.currentPageText;
		String previousPageText = ctx.previousPageText;

		if (ctx.currentPageIndex == 1) {
			assertEquals(StringUtils.EMPTY, previousPageText);
			assertTrue(currentPageText.contains("{page1}"));
		} else if (ctx.currentPageIndex == 2) {
			assertTrue(previousPageText.contains("{page1}"));
			assertTrue(currentPageText.contains("{page2}"));
		} else if (ctx.currentPageIndex == 3) {
			assertTrue(previousPageText.contains("{page2}"));
			assertTrue(currentPageText.contains("{page3}"));
		}

	}

	private static void assertPerDocumentStuff(BurstingContext ctx) {

		int index = Integer.parseInt((ctx.variables.get(Variables.BURST_INDEX).toString()));

		// ctx.token
		assertEquals(tokens.get(index - 1), ctx.token);

		// ctx.outputFolder, ctx.backupFolder, ctx.quarantineFolder
		File folder = new File(ctx.outputFolder);
		assertTrue(folder.exists());

		// ctx.extractFilePath
		assertTrue(ctx.extractedFilePath.length() > 0);

		// ctx.numberOfPages
		assertTrue(ctx.numberOfPages == 3);

	}

};
