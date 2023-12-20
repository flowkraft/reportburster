package com.sourcekraft.documentburster.unit.documentation.userguide.commandline;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Arrays;
import java.util.Iterator;

import org.apache.commons.cli.AlreadySelectedException;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.MissingArgumentException;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.After;
import org.junit.BeforeClass;
import org.junit.Test;

import com.sourcekraft.documentburster.MainProgram;
import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;
import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.pdf.Merger;
import com.sourcekraft.documentburster.job.CliJob;
import com.sourcekraft.documentburster.settings.Settings;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

/*
 * Correct arguments are given and correct output is asserted
 */
public class CommandLineArgumentsTest {

	private static final String MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH = "src/test/resources/input/unit/other/merge-file-Invoicec-Oct-Nov-Dec-bCpvjjzdk1.mf";
	private static final String MERGE_FILE_ONE_FILE_NOT_EXISTING_INVOICES_OCT_NOV_DEC_PATH = "src/test/resources/input/unit/other/merge-file-one-file-not-existing-Invoicec-Oct-Nov-Dec-bCpvjjzdk2.mf";

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	private static Settings settings = new Settings();

	private final static AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
			"CommandLineArgumentsTest");

	private static CliJob job;
	private static MainProgram program;

	@BeforeClass
	public static void setUp() throws Exception {

		// a "temp" folder is required to be available
		FileUtils.forceMkdir(new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/temp"));

		job = new CliJob("src/main/external-resources/template/config/burst/settings.xml") {

			public String getTempFolder() {
				return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp/";
			}

			protected AbstractBurster getBurster(String filePath) throws Exception {
				return burster;
			}

			protected Merger getMerger() throws Exception {

				settings.loadSettings(configurationFilePath);
				settings.setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/output/ValidMergeArguments/");
				settings.setBackupFolder(TestsUtils.TESTS_OUTPUT_FOLDER
						+ "/backup/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}");

				return new Merger(settings);

			}

		};

		program = new MainProgram() {

			protected CliJob getJob(CommandLine cmd) {
				return job;
			};

		};
	}

	@After
	public void sleep() throws Exception {
		Thread.sleep(1000);
	}

	@Test
	public void validBurstArguments() throws Throwable {

		String[] args = new String[2];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;

		program.execute(args);

		PdfTestUtils.assertDefaultResults(burster, Arrays.asList("alfreda.waldback@northridgehealth.org",
				"clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org"));
	}

	@Test(expected = MissingArgumentException.class)
	public void missingBurstArguments() throws Throwable {

		String[] args = new String[1];
		args[0] = "-f";

		program.execute(args);

	}

	@Test
	public void testAllBurstTokens() throws Throwable {

		String[] args = new String[3];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-ta";

		program.execute(args);

		PdfTestUtils.assertDefaultResults(burster, Arrays.asList("alfreda.waldback@northridgehealth.org",
				"clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org"));

		// assert no quality-assurance files are generated; qa files are generated only
		// for email/upload
		assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

	}

	@Test(expected = IllegalArgumentException.class)
	public void invalidTestListArguments() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-tl";
		args[3] = "aaaa,bbbb,cccc";

		program.execute(args);

	}

	@Test(expected = MissingArgumentException.class)
	public void missingTestRandomArguments() throws Throwable {

		String[] args = new String[3];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-tr";

		program.execute(args);

	}

	@Test(expected = NumberFormatException.class)
	public void invalidTestRandomArguments1() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-tr";
		args[3] = "a";

		program.execute(args);

	}

	@Test(expected = NumberFormatException.class)
	public void invalidTestRandomArguments2() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-tr";
		args[3] = "-2";

		program.execute(args);

	}

	@Test(expected = AlreadySelectedException.class)
	public void simultaneoslyValidTestListAndRandon() throws Throwable {

		String[] args = new String[6];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-tl";
		args[3] = "kyle.butford@northridgehealth.org,alfreda.waldback@northridgehealth.org";
		args[4] = "-tr";
		args[5] = "2";

		program.execute(args);

	}

	@Test
	public void validTestListArguments() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-tl";
		args[3] = "clyde.grew@northridgehealth.org,alfreda.waldback@northridgehealth.org";

		program.execute(args);

		PdfTestUtils.assertDefaultResults(burster,
				Arrays.asList("alfreda.waldback@northridgehealth.org", "clyde.grew@northridgehealth.org"));

		// assert kyle.butford@northridgehealth.org.pdf file was not generated
		String path = burster.getCtx().outputFolder + "/kyle.butford@northridgehealth.org.pdf";

		File outputReport = new File(path);
		assertFalse(outputReport.exists());

		// assert no quality-assurance files are generated; qa files are generated only
		// for email/upload
		assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

	}

	@Test
	public void validTestRandomArguments() throws Throwable {

		String[] args = new String[4];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;
		args[2] = "-tr";
		args[3] = "2";

		program.execute(args);

		// assert no quality-assurance files are generated; qa files are generated only
		// for email/upload
		assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		// assert only 2 output files are generated
		assertEquals(2, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		Iterator<File> it = FileUtils.iterateFiles(new File(burster.getCtx().outputFolder), new String[] { "pdf" },
				false);

		while (it.hasNext()) {

			File currentFile = (File) it.next();
			String fileName = currentFile.getName();
			String token = FilenameUtils.getBaseName(fileName);

			DocumentTester tester = new DocumentTester(currentFile.getCanonicalPath());

			// assert number of pages
			tester.assertPageCountEquals(1);

			// assert content
			tester.assertContentContainsTextOnPage(burster.getCtx().settings.getStartBurstTokenDelimiter() + token
					+ burster.getCtx().settings.getEndBurstTokenDelimiter(), 1, TextSearchType.CONTAINS);

			// assert PDF keywords
			tester.assertKeywordsEquals(token);

			tester.close();

		}

	}

	@Test(expected = MissingArgumentException.class)
	public void missingMergeFileArguments() throws Throwable {

		String[] args = new String[1];
		args[0] = "-mf";

		program.execute(args);

	}

	@Test(expected = FileNotFoundException.class)
	public void mergeFileNotFoundArguments() throws Throwable {

		String[] args = new String[2];
		args[0] = "-mf";
		args[1] = "src/test/resources/input/unit/other/not-existing-merge-file-Invoicec-Oct-Nov-Dec-bCpvjjzdk1.mf";

		program.execute(args);

	}

	@Test(expected = FileNotFoundException.class)
	public void validMergeArgumentsOneFileNotExisting() throws Throwable {

		String mergeFilePath = job.getTempFolder()
				+ FilenameUtils.getName(MERGE_FILE_ONE_FILE_NOT_EXISTING_INVOICES_OCT_NOV_DEC_PATH);
		FileUtils.copyFile(new File(MERGE_FILE_ONE_FILE_NOT_EXISTING_INVOICES_OCT_NOV_DEC_PATH),
				new File(mergeFilePath));

		String[] args = new String[2];
		args[0] = "-mf";
		args[1] = mergeFilePath;

		program.execute(args);

	}

	@Test
	public void validMergeArguments1() throws Throwable {

		String mergeFilePath = job.getTempFolder() + FilenameUtils.getName(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH);
		FileUtils.copyFile(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH), new File(mergeFilePath));

		String[] args = new String[2];
		args[0] = "-mf";
		args[1] = mergeFilePath;

		program.execute(args);

		assertMergeResults("merged.pdf");

		// merge file should be deleted after the merge is finished
		assertFalse(new File(mergeFilePath).exists());

		// but the resource merge file should still be there for the following
		// executions
		assertTrue(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH).exists());

	}

	@Test
	public void validMergeArguments2() throws Throwable {

		String mergeFilePath = job.getTempFolder() + FilenameUtils.getName(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH);
		FileUtils.copyFile(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH), new File(mergeFilePath));

		String[] args = new String[4];
		args[0] = "-mf";
		args[1] = mergeFilePath;
		args[2] = "-o";
		args[3] = "mergedTest2.pdf";

		program.execute(args);
		assertMergeResults("mergedTest2.pdf");

		// merge file should be deleted after the merge is finished
		assertFalse(new File(mergeFilePath).exists());

		// but the resource merge file should still be there for the following
		// executions
		assertTrue(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH).exists());

	}

	@Test
	public void validMergeArguments3() throws Throwable {

		String mergeFilePath = job.getTempFolder() + FilenameUtils.getName(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH);
		FileUtils.copyFile(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH), new File(mergeFilePath));

		String[] args = new String[5];
		args[0] = "-mf";
		args[1] = mergeFilePath;
		args[2] = "-o";
		args[3] = "mergedTest3.pdf";
		args[4] = "-b";

		program.execute(args);
		assertMergeResults("mergedTest3.pdf");

		// merge file should be deleted after the merge is finished
		assertFalse(new File(mergeFilePath).exists());

		// but the resource merge file should still be there for the following
		// executions
		assertTrue(new File(MERGE_FILE_INVOICES_OCT_NOV_DEC_PATH).exists());

	}

	@Test
	public void validPollArguments1() throws Throwable {

		final String[] args = new String[2];
		args[0] = "-p";
		args[1] = TestsUtils.TESTS_OUTPUT_FOLDER + "/poll";

		// "poll" folder is required to be available
		FileUtils.forceMkdir(new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/poll"));

		new Thread(new Runnable() {
			public void run() {
				try {
					program.execute(args);
				} catch (Throwable e) {
					e.printStackTrace();
				}
			}
		}).start();

		File pollPidFile = new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/temp/poll.pid");
		boolean directoryPollerStarted = false;

		while (!directoryPollerStarted) {
			directoryPollerStarted = pollPidFile.exists();
			Thread.sleep(100);
		}

		assertTrue(pollPidFile.exists());

		pollPidFile.delete();

	}

	private void assertMergeResults(String fileName) throws Exception {

		String path = TestsUtils.TESTS_OUTPUT_FOLDER + "/output/ValidMergeArguments/" + fileName;

		// assert output report
		File outputReport = new File(path);
		assertTrue(outputReport.exists());

		DocumentTester tester = new DocumentTester(path);

		// assert number of pages
		tester.assertPageCountEquals(9);

		tester.close();

	};

}