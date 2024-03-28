package com.sourcekraft.documentburster.unit.documentation.userguide.howtodo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Arrays;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.Before;
import org.junit.Test;

import com.sourcekraft.documentburster.MainProgram;
import com.sourcekraft.documentburster._helpers.ExcelTestUtils;
import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.pdf.Merger;
import com.sourcekraft.documentburster.job.CliJob;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.variables.Variables;

import com.sourcekraft.documentburster._helpers.DocumentTester;

public class CommandLineConfigurationTest {

	private static final String MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH = "src/test/resources/input/unit/other/merge-file-Invoicec-Oct-Nov-Dec-bCpvjjzdk1.mf";

	private static final String EXCEL_BURST_BY_DISTINCT_COLUMN_VALUES_COMPLEX = "src/test/resources/input/unit/excel/extra/burst-by-distinct-column-values-complex.xls";
	private static final String USER_VARIABLES_PATH = "src/test/resources/input/unit/pdf/user-variables.pdf";
	private static final String PDF_CUSTOM_SETTINGS_LONG = "src/test/resources/input/unit/pdf/custom-settings-long.pdf";

	private static Settings settings = new Settings();
	private static CliJob job;
	private static MainProgram program;
	private static AbstractBurster burster;

	@Before
	public void setUp() throws Exception {

		// make sure the timestamp will be different otherwise some asserts will
		// fail
		Thread.sleep(1000);

		// a "temp" folder is required to be available
		FileUtils.forceMkdir(new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/temp"));

		program = new MainProgram() {

			protected CliJob getJob(CommandLine cmd) {

				String configFilePath = "src/main/external-resources/template/config/burst/settings.xml";

				if (cmd.hasOption("c"))
					configFilePath = cmd.getOptionValue("c");

				job = new CliJob(configFilePath) {

					public String getTempFolder() {
						return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp/";
					}

					protected AbstractBurster getBurster(String filePath) throws Exception {

						String extension = FilenameUtils.getExtension(filePath);

						if (extension.equalsIgnoreCase("pdf"))
							burster = (AbstractBurster) new TestBursterFactory.PdfBurster(configurationFilePath,
									"CommandLineConfigurationTest");

						else
							burster = (AbstractBurster) new TestBursterFactory.PoiExcelBurster(configurationFilePath,
									"CommandLineConfigurationTest");

						return burster;
					}

					protected Merger getMerger() throws Exception {

						settings.loadSettings(configurationFilePath);
						settings.setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER
								+ "/output/CommandLineConfigurationTestValidMergeArguments/");
						return new Merger(settings);

					}
				};

				return job;

			};

		};
	}

	@Test
	public void validMergeArgumentsCustomConfigurationFile() throws Throwable {

		String mergeFilePath = job.getTempFolder() + FilenameUtils.getName(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH);
		FileUtils.copyFile(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH), new File(mergeFilePath));

		String[] args = new String[4];
		args[0] = "-mf";
		args[1] = mergeFilePath;
		args[2] = "-c";
		args[3] = "src/test/resources/config/settings-custom.xml";

		program.execute(args);

		assertMergeResults("merged-custom.pdf");

		// merge file should be deleted after the merge is finished
		assertFalse(new File(mergeFilePath).exists());

		// but the resource merge file should still be there for the following
		// executions
		assertTrue(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH).exists());

	}

	@Test
	public void validMergeArgumentsCustomConfigurationFileButMinusOTakesPrecedence() throws Throwable {

		String mergeFilePath = job.getTempFolder() + FilenameUtils.getName(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH);
		FileUtils.copyFile(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH), new File(mergeFilePath));

		String[] args = new String[6];
		args[0] = "-mf";
		args[1] = mergeFilePath;
		args[2] = "-o";
		args[3] = "merged.pdf";
		args[4] = "-c";
		args[5] = "src/test/resources/config/settings-custom.xml";

		program.execute(args);

		assertMergeResults("merged.pdf");
		
		// merge file should be deleted after the merge is finished
		assertFalse(new File(mergeFilePath).exists());

		// but the resource merge file should still be there for the following
		// executions
		assertTrue(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH).exists());

	}

	private void assertMergeResults(String fileName) throws Exception {

		String path = TestsUtils.TESTS_OUTPUT_FOLDER + "/output/CommandLineConfigurationTestValidMergeArguments/"
				+ fileName;

		// assert output report
		File outputReport = new File(path);
		assertTrue(outputReport.exists());

		DocumentTester tester = new DocumentTester(path);

		// assert number of pages
		tester.assertPageCountEquals(9);

		tester.close();

	};

	@Test
	public void validBurstArgumentsDefaultSettingsXml() throws Throwable {

		String[] args = new String[2];
		args[0] = "-f";
		args[1] = USER_VARIABLES_PATH;

		program.execute(args);

		PdfTestUtils.assertDefaultResults(burster, Arrays.asList("page1", "page2", "page3"));

	}

	@Test
	public void validBurstArgumentsCustomConfigurationCommandLineOnly() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = USER_VARIABLES_PATH;
		args[2] = "-c";
		args[3] = "src/test/resources/config/settings-custom.xml";

		program.execute(args);

		// assert 3 files have been generated
		String outputFolder = burster.getCtx().outputFolder + "/";
		assertEquals(3, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		// assert for the Custom File Name
		String path = burster.getCtx().outputFolder + "/p1-var0-p1-var1.pdf";

		// assert the files have been generated
		File outputReport = new File(path);
		assertTrue(outputReport.exists());

		path = burster.getCtx().outputFolder + "/p2-var0-p2-var1.pdf";

		// assert the files have been generated
		outputReport = new File(path);
		assertTrue(outputReport.exists());

		path = burster.getCtx().outputFolder + "/p3-var0-p3-var1.pdf";

		// assert the files have been generated
		outputReport = new File(path);
		assertTrue(outputReport.exists());

	}

	@Test
	public void pdfValidBurstArgumentsCustomConfigurationCommandButBuiltInTakesPrecedence() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = PDF_CUSTOM_SETTINGS_LONG;
		args[2] = "-c";
		args[3] = "src/main/external-resources/template/config/burst/settings.xml";

		program.execute(args);

		// assert only 2 files have been generated
		String outputFolder = burster.getCtx().outputFolder + "/";
		assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		// assert for the Custom File Name
		String path = burster.getCtx().outputFolder + "/John Lehnon-March.pdf";

		// assert the files have been generated
		File outputReport = new File(path);
		assertTrue(outputReport.exists());

		path = burster.getCtx().outputFolder + "/Paul McCartney-June.pdf";

		// assert the files have been generated
		outputReport = new File(path);
		assertTrue(outputReport.exists());

	}

	@Test
	public void excelValidBurstArgumentsCustomConfigurationCommandButBuiltInTakesPrecedence() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = EXCEL_BURST_BY_DISTINCT_COLUMN_VALUES_COMPLEX;
		args[2] = "-c";
		args[3] = "src/main/external-resources/template/config/burst/settings.xml";

		program.execute(args);

		// assert only 2 files have been generated
		String outputFolder = burster.getCtx().outputFolder + "/";
		assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		// assert output reports
		for (String token : Arrays.asList("Germany", "USA")) {

			String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
			String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();

			// assert custom configuration
			// ${var0}-${var1}.${input_document_extension}
			String fileName = var0 + "-" + var1 + ".xls";

			File outputReport = new File(outputFolder + fileName);
			assertTrue(outputReport.exists());

			InputStream input = new FileInputStream(outputReport);
			Workbook workBook = WorkbookFactory.create(input);

			// assert it has a single sheet and it is the correct sheet
			assertEquals(1, workBook.getNumberOfSheets());
			assertNotNull(workBook.getSheet("Customer List"));

			// assert the data to be correct
			assertTrue(ExcelTestUtils.isWorkbookDataValid(workBook, token));

			input.close();

		}

		// assert "skip" variable values
		String skip = burster.getCtx().variables.getUserVariables("Germany").get(Variables.SKIP).toString();
		assertFalse(Boolean.valueOf(skip).booleanValue());

		skip = burster.getCtx().variables.getUserVariables("USA").get(Variables.SKIP).toString();
		assertTrue(Boolean.valueOf(skip).booleanValue());
	}

};