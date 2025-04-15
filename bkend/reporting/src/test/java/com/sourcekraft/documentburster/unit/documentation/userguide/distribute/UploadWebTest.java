package com.sourcekraft.documentburster.unit.documentation.userguide.distribute;

import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertTrue;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.UploadMessage;

public class UploadWebTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
			"clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

	@Test
	public final void burstDocumentBursterWeb() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"UploadWebTest-burstDocumentBursterWeb") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockWebUpload();

				ctx.scripts.webUpload = "assert_web_upload_documentbursterweb_executed.groovy";
				ctx.settings.setDocumentBursterWebCommand(
						"--user 'documentburster:password' -X POST --data 'code=1234&customer=Northridge Pharmaceuticals&product=Nebulizer Machine&amount=200.00&date=December 28th, 2015&status=Unpaid' https://portal.pdfburst.com/wp-json/pods/invoices");

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

	};

	public static void assertUploadDocumentBursterWebMessage(UploadMessage message) throws Exception {

		assertTrue(tokens.contains(message.token));
		assertTrue(message.uploadCommand.contains("https://portal.pdfburst.com"));

	}

	@Test
	public final void burstMSSharePoint() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"UploadWebTest-burstMSSharePoint") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockWebUpload();

				ctx.scripts.webUpload = "assert_web_upload_mssharepoint_executed.groovy";
				ctx.settings.setMSSharePointCommand(
						"--user 'user:password' -X POST --data 'code=1234&customer=Northridge Pharmaceuticals&product=Nebulizer Machine&amount=200.00&date=December 28th, 2015&status=Unpaid' http://www.yourmssharepointsite.com/");

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

	};

	public static void assertUploadMSSharePointMessage(UploadMessage message) throws Exception {

		assertTrue(tokens.contains(message.token));
		assertTrue(message.uploadCommand.contains("http://www.yourmssharepointsite.com/"));

	}

	@Test
	public final void burstWordPress() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadWebTest-burstWordPress") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockWebUpload();

				ctx.scripts.webUpload = "assert_web_upload_wordpress_executed.groovy";
				ctx.settings.setWordPressCommand(
						"--user 'user:password' -X POST --data 'code=1234&customer=Northridge Pharmaceuticals&product=Nebulizer Machine&amount=200.00&date=December 28th, 2015&status=Unpaid'http://www.yourwordpresssite.com/");

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

	};

	public static void assertUploadWordPressMessage(UploadMessage message) throws Exception {

		assertTrue(tokens.contains(message.token));
		assertTrue(message.uploadCommand.contains("http://www.yourwordpresssite.com/"));

	}

	@Test
	public final void burstDrupal() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadWebTest-burstDrupal") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockWebUpload();

				ctx.scripts.webUpload = "assert_web_upload_drupal_executed.groovy";
				ctx.settings.setDrupalCommand(
						"--user 'user:password' -X POST --data 'code=1234&customer=Northridge Pharmaceuticals&product=Nebulizer Machine&amount=200.00&date=December 28th, 2015&status=Unpaid' http://www.yourdrupalsite.com/");

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

	};

	public static void assertUploadDrupalMessage(UploadMessage message) throws Exception {

		assertTrue(tokens.contains(message.token));
		assertTrue(message.uploadCommand.contains("http://www.yourdrupalsite.com/"));

	}

	@Test
	public final void burstJoomla() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadWebTest-burstJoomla") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockWebUpload();

				ctx.scripts.webUpload = "assert_web_upload_joomla_executed.groovy";
				ctx.settings.setJoomlaCommand(
						"--user 'user:password' -X POST --data 'code=1234&customer=Northridge Pharmaceuticals&product=Nebulizer Machine&amount=200.00&date=December 28th, 2015&status=Unpaid' http://www.yourjoomlasite.com/");

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

	};

	public static void assertUploadJoomlaMessage(UploadMessage message) throws Exception {

		assertTrue(tokens.contains(message.token));
		assertTrue(message.uploadCommand.contains("http://www.yourjoomlasite.com/"));

	}

	@Test
	public final void burstOtherWeb() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadWebTest-burstOtherWeb") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockWebUpload();

				ctx.scripts.webUpload = "assert_web_upload_otherweb_executed.groovy";
				ctx.settings.setOtherWebCommand(
						"--user 'user:password' -X POST --data 'code=1234&customer=Northridge Pharmaceuticals&product=Nebulizer Machine&amount=200.00&date=December 28th, 2015&status=Unpaid' http://www.yourotherwebsite.com/");

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

	};

	public static void assertUploadOtherWebMessage(UploadMessage message) throws Exception {

		assertTrue(tokens.contains(message.token));
		assertTrue(message.uploadCommand.contains("http://www.yourotherwebsite.com/"));

	}

};