package com.sourcekraft.documentburster._helpers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Random;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.assertj.core.api.Assertions;

import com.sourcekraft.documentburster.common.settings.EmailConnection;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.engine.excel.ExcelUtils;
import com.sourcekraft.documentburster.scripting.Scripting;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.utils.CsvUtils;

public class TestBursterFactory {

	public static final String REPORTING_CONFIG_PATH = "../../asbl/src/main/external-resources/db-template/config/_defaults/reporting.xml";

	public static class PdfBurster extends com.sourcekraft.documentburster.engine.pdf.PdfBurster {

		protected String testName;

		public PdfBurster(String configFilePath, String testName) {

			super(configFilePath);

			this.testName = testName;

			if (StringUtils.isNotEmpty(configFilePath))
				this.configurationFilePath = configFilePath;
			else
				this.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

			// a "temp" folder is required to be available
			File tempDir = new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/temp");

			if (!tempDir.exists())
				try {
					FileUtils.forceMkdir(tempDir);
				} catch (IOException e) {
					e.printStackTrace();
				}

		}

		protected void setUpScriptingRoots() {

			scripting.setRoots(new String[] { "src/test/groovy", "src/test/groovy/senders-messages",
					"src/test/groovy/bursting-context-lifecycle", "src/main/external-resources/template/scripts/burst",
					"src/main/external-resources/template/scripts/burst/internal",
					"src/main/external-resources/template/scripts/burst/samples" });

		};

		protected void executeController() throws Exception {

			super.executeController();
			TestBursterFactory.setUpTestFolders(ctx, testName);

		};

		public String getTempFolder() {
			return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp/";
		}

		protected void setUpMockEmail() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockEmail(scripting, ctx);

		};

		protected void setUpMockUpload() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockUpload(scripting, ctx);

		};

		protected void setUpMockWebUpload() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockWebUpload(scripting, ctx);

		};

		protected void setUpMockSms() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockSms(scripting, ctx);

		};

		protected void checkLicense() throws Exception {

			// Just for
			// IssuesTest.issue61MakeSureTheSoftwareWorksFineEvenWhenServerReturnsSSLExceptionWhenCheckingTheLicense
			// it should run the super.checkLicense() otherwise checkLicense should do
			// nothing during the unit tests
			if (!StringUtils.isEmpty(testName) && (this.testName.toLowerCase().contains("issue61")))
				super.checkLicense();
		}
	}

	public static class PoiExcelBurster extends com.sourcekraft.documentburster.engine.excel.PoiExcelBurster {

		protected String testName;

		public PoiExcelBurster(String configFilePath, String testName) {

			super(configFilePath);
			this.testName = testName;

			if (StringUtils.isNotEmpty(configFilePath))
				this.configurationFilePath = configFilePath;
			else
				this.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

			// a "temp" folder is required to be available
			File tempDir = new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/temp");

			if (!tempDir.exists())
				try {
					FileUtils.forceMkdir(tempDir);
				} catch (IOException e) {
					e.printStackTrace();
				}

		}

		public String getTempFolder() {
			return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp";
		}

		protected void setUpScriptingRoots() {

			scripting.setRoots(new String[] { "src/test/groovy", "src/test/groovy/senders-messages",
					"src/test/groovy/bursting-context-lifecycle", "src/main/external-resources/template/scripts/burst",
					"src/main/external-resources/template/scripts/burst/internal",
					"src/main/external-resources/template/scripts/burst/samples" });

		};

		protected void executeController() throws Exception {

			super.executeController();
			TestBursterFactory.setUpTestFolders(ctx, testName);

		};

		protected void setUpMockEmail() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockEmail(scripting, ctx);

		};

		protected String getTempWorkBookPath() {

			String baseName = FilenameUtils.getBaseName(filePath);
			String extension = FilenameUtils.getExtension(filePath);

			Random generator = new Random(Long.MAX_VALUE);

			return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp/" + baseName + "_" + generator.nextInt() + "." + extension;

		}

		protected void checkLicense() throws Exception {
		}
	}

	public static class CsvReporter extends com.sourcekraft.documentburster.engine.reporting.CsvReporter {

		protected String testName;

		public CsvReporter(String configFilePath, String testName) {
			super(configFilePath);
			this.testName = testName;

			if (StringUtils.isNotEmpty(configFilePath))
				this.configurationFilePath = configFilePath;
			else
				this.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		}

		protected void setUpMockEmail() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockEmail(scripting, ctx);

		};

		protected void executeController() throws Exception {

			super.executeController();

			TestBursterFactory.setUpTestFolders(ctx, testName);

			ctx.settings.setCapabilityReportGenerationMailMerge(true);

			ctx.settings.loadSettingsReporting(REPORTING_CONFIG_PATH);

			// a "temp" folder is required to be available
			ctx.tempFolder = TestsUtils.TESTS_OUTPUT_FOLDER + "/temp";

			File tempDir = new File(ctx.tempFolder);

			if (!tempDir.exists())
				try {
					FileUtils.forceMkdir(tempDir);
				} catch (IOException e) {
					e.printStackTrace();
				}

		};

		protected void checkLicense() throws Exception {
		}

		protected void setUpScriptingRoots() {

			scripting.setRoots(new String[] { "src/test/groovy", "src/test/groovy/senders-messages",
					"src/test/groovy/bursting-context-lifecycle", "src/main/external-resources/template/scripts/burst",
					"src/main/external-resources/template/scripts/burst/internal",
					"src/main/external-resources/template/scripts/burst/samples" });
		}
	}

	public static class FixedWidthReporter extends com.sourcekraft.documentburster.engine.reporting.FixedWidthReporter {

		protected String testName;

		public FixedWidthReporter(String configFilePath, String testName) {
			super(configFilePath);
			this.testName = testName;

			if (StringUtils.isNotEmpty(configFilePath))
				this.configurationFilePath = configFilePath;
			else
				this.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		}

		protected void setUpMockEmail() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockEmail(scripting, ctx);

		};

		protected void executeController() throws Exception {

			super.executeController();

			TestBursterFactory.setUpTestFolders(ctx, testName);

			ctx.settings.setCapabilityReportGenerationMailMerge(true);

			ctx.settings.loadSettingsReporting(REPORTING_CONFIG_PATH);

			// a "temp" folder is required to be available
			ctx.tempFolder = TestsUtils.TESTS_OUTPUT_FOLDER + "/temp";

			File tempDir = new File(ctx.tempFolder);

			if (!tempDir.exists())
				try {
					FileUtils.forceMkdir(tempDir);
				} catch (IOException e) {
					e.printStackTrace();
				}

		};

		protected void checkLicense() throws Exception {
		}

		protected void setUpScriptingRoots() {

			scripting.setRoots(new String[] { "src/test/groovy", "src/test/groovy/senders-messages",
					"src/test/groovy/bursting-context-lifecycle", "src/main/external-resources/template/scripts/burst",
					"src/main/external-resources/template/scripts/burst/internal",
					"src/main/external-resources/template/scripts/burst/samples" });
		}
	}

	public static class ExcelReporter extends com.sourcekraft.documentburster.engine.reporting.ExcelReporter {

		protected String testName;

		public ExcelReporter(String configFilePath, String testName) {
			super(configFilePath);
			this.testName = testName;

			if (StringUtils.isNotEmpty(configFilePath))
				this.configurationFilePath = configFilePath;
			else
				this.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		}
		protected void setUpMockEmail() throws Exception {

			ctx.testName = this.testName;
			TestBursterFactory.setUpMockEmail(scripting, ctx);

		};

		protected void executeController() throws Exception {

			super.executeController();

			TestBursterFactory.setUpTestFolders(ctx, testName);

			ctx.settings.setCapabilityReportGenerationMailMerge(true);

			ctx.settings.loadSettingsReporting(REPORTING_CONFIG_PATH);

			// a "temp" folder is required to be available
			ctx.tempFolder = TestsUtils.TESTS_OUTPUT_FOLDER + "/temp";

			File tempDir = new File(ctx.tempFolder);

			if (!tempDir.exists())
				try {
					FileUtils.forceMkdir(tempDir);
				} catch (IOException e) {
					e.printStackTrace();
				}

		};

		protected void checkLicense() throws Exception {
		}

		protected void setUpScriptingRoots() {

			scripting.setRoots(new String[] { "src/test/groovy", "src/test/groovy/senders-messages",
					"src/test/groovy/bursting-context-lifecycle", "src/main/external-resources/template/scripts/burst",
					"src/main/external-resources/template/scripts/burst/internal",
					"src/main/external-resources/template/scripts/burst/samples" });
		}

	}

	static private void setUpTestFolders(BurstingContext ctx, String testName) throws Exception {

		ctx.settings.setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/output/${input_document_name}/" + testName
				+ "/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}");

		ctx.settings.setBackupFolder(TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/backup/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}");
		ctx.settings.setQuarantineFolder(TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/quarantine/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}");

		ctx.settings.setLogsArchivesFolder(TestsUtils.TESTS_OUTPUT_FOLDER
				+ "/logs/archives/${input_document_name}/${now?string[\"yyyy.MM.dd_HH.mm.ss.SSS\"]}");

	}

	private static void setUpMockEmail(Scripting scripting, BurstingContext ctx) {

		ctx.settings.setSendFilesEmail(true);

		if (!ctx.settings.getEmailServerUseConn()) {
			ctx.settings.setEmailServerHost("smtp.test.com");
			ctx.settings.setEmailServerPort("465");
			ctx.settings.setEmailServerUserId("firstname.lastname");
			ctx.settings.setEmailServerUserPassword("password");
			ctx.settings.setEmailServerUseTLS(false);
			ctx.settings.setEmailServerUseSSL(true);

			ctx.settings.setEmailServerFrom("firstname.lastname@test.com");
			ctx.settings.setEmailServerName("FirstName LastName");
		} else {

			ctx.emailConnection = new EmailConnection();

			ctx.emailConnection.getDetails().connection.emailserver.host = "smtp.test.com";
			ctx.emailConnection.getDetails().connection.emailserver.port = "465";

			ctx.emailConnection.getDetails().connection.emailserver.userid = "firstname.lastname";
			ctx.emailConnection.getDetails().connection.emailserver.userpassword = "password";
			ctx.emailConnection.getDetails().connection.emailserver.usetls = false;
			ctx.emailConnection.getDetails().connection.emailserver.usessl = true;

			ctx.emailConnection.getDetails().connection.emailserver.fromaddress = "firstname.lastname@test.com";
			ctx.emailConnection.getDetails().connection.emailserver.name = "FirstName LastName";

		}

		ctx.settings.setTestEmailServerHost("test.smtp.test.com");
		ctx.settings.setTestEmailServerPort("995");
		ctx.settings.setTesttEmailServerUserId("test.firstname.lastname");
		ctx.settings.setTestEmailServerUserPassword("test.password");
		ctx.settings.setTestEmailServerUseTLS(false);
		ctx.settings.setTestEmailServerUseSSL(true);

		ctx.settings.setTestEmailServerFrom("test.firstname.lastname@test.com");
		ctx.settings.setTestEmailServerName("Test FirstName LastName");

		ctx.settings.setEmailSubject("Subject ${burst_token}");
		ctx.settings.setEmailText("Message ${burst_token}");

		ctx.scripts.email = "assert_email_executed.groovy";

		ctx.scripts.upload = "assert_upload_not_executed.groovy";
		ctx.scripts.webUpload = "assert_web_upload_not_executed.groovy";
		ctx.scripts.sms = "assert_sms_not_executed.groovy";

		ctx.scripts.distributeReportErrorHandling = "distribute_report_error_handling_email_test.groovy";

	}

	private static void setUpMockUpload(Scripting scripting, BurstingContext ctx) {

		ctx.settings.setSendFilesUpload(true);

		ctx.scripts.email = "assert_email_not_executed.groovy";
		ctx.scripts.webUpload = "assert_web_upload_not_executed.groovy";
		ctx.scripts.sms = "assert_sms_not_executed.groovy";

	}

	private static void setUpMockWebUpload(Scripting scripting, BurstingContext ctx) {

		ctx.settings.setSendFilesWeb(true);

		ctx.scripts.email = "assert_email_not_executed.groovy";
		ctx.scripts.upload = "assert_upload_not_executed.groovy";
		ctx.scripts.sms = "assert_sms_not_executed.groovy";

	}

	private static void setUpMockSms(Scripting scripting, BurstingContext ctx) {

		ctx.settings.setSendFilesSms(true);

		ctx.scripts.sms = "assert_sms_executed.groovy";

		ctx.scripts.email = "assert_email_not_executed.groovy";
		ctx.scripts.upload = "assert_upload_not_executed.groovy";
		ctx.scripts.webUpload = "assert_web_upload_not_executed.groovy";

	}

	public static AbstractBurster createPdfBurster(String configFilePath, String testName) {
		return new PdfBurster(configFilePath, testName);
	}

	public static AbstractBurster createPoiExcelBurster(String configFilePath, String testName) {
		return new PoiExcelBurster(configFilePath, testName);
	}

	public static void assertThatCorrectOutputReportsWereGenerated(AbstractReporter burster, String pathToFile,
			boolean expectAllFilesToBeGenerated, String outputType)
			throws Exception, IOException, FileNotFoundException {

		// assert 3 rows are parsed
		assertEquals(3, burster.getParsedLines().size());

		// assert 17 columns are parsed
		boolean correctNumberOfColumns = ((burster.getParsedLines().get(0).length == 17)
				|| (burster.getParsedLines().get(0).length == 18));
		assertTrue("There should be 17 or 18 columns", correctNumberOfColumns);

		assertEquals("Kyle Butford", burster.getParsedLines().get(1)[0]);
		assertEquals("2890", burster.getParsedLines().get(1)[16]);

		String outputFolder = burster.getCtx().outputFolder + "/";

		int fileCount = new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length;

		if (expectAllFilesToBeGenerated)
			assertTrue("There should be 3 output files", fileCount == burster.getParsedLines().size());
		else
			assertTrue("There should be maximum 1, 2 or 3 output files",
					fileCount > 0 && fileCount <= burster.getParsedLines().size());

		int lineLength = 0;
		int lineIndex = 0;
		int codeColumnIndex = -1;

		String ccIndex = burster.getCtx().settings.getReportDataSource().csvoptions.idcolumn;

		if (!ccIndex.contains(CsvUtils.NOT_USED)) {
			if (!ccIndex.contains(CsvUtils.COLUMN_LAST)) {
				if (ccIndex.contains(CsvUtils.COLUMN_FIRST))
					codeColumnIndex = 0;
				else
					codeColumnIndex = Integer.valueOf(ccIndex);
			}
		}

		for (String[] currentCsvLine : burster.getParsedLines()) {

			if (lineLength <= 0) {
				lineLength = currentCsvLine.length;
				if (ccIndex.contains(CsvUtils.COLUMN_LAST))
					codeColumnIndex = lineLength - 1;
			}

			String token = StringUtils.EMPTY;

			if (codeColumnIndex >= 0)
				token = currentCsvLine[codeColumnIndex];
			else
				token = String.valueOf(lineIndex);

			String outputReportPath = outputFolder + token + "." + FilenameUtils.getExtension(outputType);

			File outputReport = new File(outputReportPath);
			boolean outputReportExists = outputReport.exists();

			if (outputReportExists) {
				String currentReportText = StringUtils.EMPTY;

				if (outputType.equals(CsvUtils.OUTPUT_TYPE_DOCX)) {
					XWPFDocument docx = new XWPFDocument(new FileInputStream(outputReportPath));
					int numPages = docx.getProperties().getExtendedProperties().getUnderlyingProperties().getPages();

					XWPFWordExtractor we = new XWPFWordExtractor(docx);

					if (numPages == 0) {
						numPages = we.getExtendedProperties().getPages();
					}

					currentReportText = we.getText();

					if (numPages > 0)
						Assertions.assertThat(numPages).isEqualTo(1);

					we.close();
					docx.close();

				} else if (outputType.equals(CsvUtils.OUTPUT_TYPE_HTML)) {
					currentReportText = FileUtils.readFileToString(new File(outputReportPath), "UTF-8");
				} else if (outputType.equals(CsvUtils.OUTPUT_TYPE_PDF)) {
					// Extract text from PDF using PDFBox (similar to how DOCX is handled)
					try (PDDocument document = PDDocument.load(outputReport)) {
						PDFTextStripper stripper = new PDFTextStripper();
						currentReportText = stripper.getText(document);
					}
				} else if (outputType.equals(CsvUtils.OUTPUT_TYPE_EXCEL)) {
					currentReportText = ExcelUtils.getExcelText(outputReport);
				}

				// assert branding
				if (!outputType.equals(CsvUtils.OUTPUT_TYPE_DOCX) && !outputType.equals(CsvUtils.OUTPUT_TYPE_EXCEL))
					Assertions.assertThat(currentReportText).contains("Built by");

				for (int currentColumnIndex = 0; currentColumnIndex < lineLength; currentColumnIndex++) {

					if (currentColumnIndex < 17) {
						String currentRowAndCurrentColumnValue = currentCsvLine[currentColumnIndex];

						if (currentColumnIndex != lineLength - 1)
							Assertions.assertThat(currentReportText).contains(currentRowAndCurrentColumnValue);

						if ((currentColumnIndex == lineLength - 1) && !pathToFile.endsWith("id-column-last.csv")
								&& !pathToFile.endsWith("id-column-specify-17-last.csv"))
							Assertions.assertThat(currentReportText).contains(currentRowAndCurrentColumnValue);
					}
				}

				lineIndex++;

			}
		}

	}

}