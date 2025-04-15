package com.sourcekraft.documentburster.unit.documentation.userguide.qualityassurance;

import static org.junit.Assert.assertEquals;
import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

public class EmailUploadTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	@Test
	public void listOfTokensDistributeReportsTrue() throws Exception {
		listOfTokens(true);
	}

	@Test
	public void listOfTokensDistributeReportsFalse() throws Exception {
		listOfTokens(false);
	}

	private void listOfTokens(final boolean distributeReports) throws Exception {
		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailUploadTest-listOfTokens-distributeReports-" + distributeReports) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();
				super.setUpMockUpload();

				ctx.settings.setFtpCommand(
						"-T $extracted_file_path$ --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/");

				ctx.settings.setSendFilesEmail(distributeReports);
				ctx.settings.setSendFilesUpload(distributeReports);

				if (distributeReports)
					ctx.scripts.email = "assert_email_executed_qualityassurance.groovy";
				else
					ctx.scripts.email = "assert_email_not_executed.groovy";

				if (distributeReports)
					ctx.scripts.upload = "assert_upload_ftp_executed.groovy";
				else
					ctx.scripts.upload = "assert_upload_not_executed.groovy";

			};

		};

		String testTokens = "clyde.grew@northridgehealth.org,alfreda.waldback@northridgehealth.org";
		burster.burst(PAYSLIPS_REPORT_PATH, false, testTokens, -1);

		// assert correct number (6 or 2) (2 ctx and 2 email if distribute and 2
		// upload if distribute)
		// corresponding quality-assurance files
		// are generated
		if (distributeReports)
			assertEquals(4, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
		else
			assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

		List<String> listOfTestTokens = Arrays.asList(testTokens.split(","));
		// assert individual quality-assurance files
		for (String token : listOfTestTokens) {

			assertEquals(distributeReports,
					new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_email.txt").exists());

			assertEquals(distributeReports,
					new File(burster.getCtx().outputFolder + "/quality-assurance/" + token + "_ftp_upload.txt")
							.exists());

		}

		// assert only 2 output files are generated
		assertEquals(2, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

		PdfTestUtils.assertDefaultResults(burster, listOfTestTokens);

		assertEquals(2, burster.getCtx().numberOfExtractedFiles);

		if (distributeReports)
			assertEquals(4, burster.getCtx().numberOfDistributedFiles);
		else
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);

		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	}

};