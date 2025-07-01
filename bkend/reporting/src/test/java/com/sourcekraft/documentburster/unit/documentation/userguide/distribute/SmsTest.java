package com.sourcekraft.documentburster.unit.documentation.userguide.distribute;

import java.util.Random;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.SmsMessage;
import com.twilio.sdk.TwilioRestException;

public class SmsTest {

	private static final String TWILIO_TEST_ACCOUNTSID = "AC9acb93c6feff6fd8d49d43bdf41c68a8";
	private static final String TWILIO_TEST_AUTH_TOKEN = "e8201396736a460ce6c8b6f01371fe01";

	private static final List<String> invalidFromNumbers = Arrays.asList("+15005550001", "+15005550007", "+15005550008",
			"+352621723018");
	private static final List<String> invalidToNumbers = Arrays.asList("+15005550001", "+15005550002", "+15005550003",
			"+15005550004", "+15005550009");

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
			"clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

	@Test
	public final void burstTwilioInvalidFromInvalidToNumbersFailJobTrue() throws Exception {
		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"SmsTest-burstTwilioInvalidFromInvalidToNumbersFailJobTrue") {

			protected void executeController() throws Exception {

				super.executeController();
				super.setUpMockSms();

				ctx.settings.setFailJobIfAnyDistributionFails(true);

				ctx.settings.getSmsSettings().twilio.accountsid = TWILIO_TEST_ACCOUNTSID;
				ctx.settings.getSmsSettings().twilio.authtoken = TWILIO_TEST_AUTH_TOKEN;

				ctx.settings.getSmsSettings().fromtelephonenumber = anyItem(invalidFromNumbers);
				ctx.settings.getSmsSettings().totelephonenumber = anyItem(invalidToNumbers);
				ctx.settings.getSmsSettings().text = testName;

			};
		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (TwilioRestException e) {
			assertEquals(1, burster.getCtx().numberOfExtractedFiles);
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
		}

	};

	@Test
	public final void burstTwilioInvalidFromInvalidToNumbersFailJobFalse() throws Exception {
		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"SmsTest-burstTwilioInvalidFromInvalidToNumbersFailJobFalse") {

			protected void executeController() throws Exception {

				super.executeController();
				super.setUpMockSms();

				ctx.settings.setFailJobIfAnyDistributionFails(false);
				ctx.settings.getSmsSettings().twilio.accountsid = TWILIO_TEST_ACCOUNTSID;
				ctx.settings.getSmsSettings().twilio.authtoken = TWILIO_TEST_AUTH_TOKEN;

				ctx.settings.getSmsSettings().fromtelephonenumber = anyItem(invalidFromNumbers);
				ctx.settings.getSmsSettings().totelephonenumber = anyItem(invalidToNumbers);
				ctx.settings.getSmsSettings().text = testName;

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(0, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(3, burster.getCtx().numberOfQuarantinedFiles);

	};

	@Test
	public final void burstSmsAllFine() throws Exception {
		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "SmsTest-burstSmsAllFine") {
			protected void executeController() throws Exception {

				super.executeController();
				super.setUpMockSms();

				ctx.settings.getSmsSettings().fromtelephonenumber = "1234";
				ctx.settings.getSmsSettings().totelephonenumber = "5678";
				ctx.settings.getSmsSettings().text = "SmsTest-burstSmsAllFine";

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		PdfTestUtils.doBurstAndAssertDefaultResults(PAYSLIPS_REPORT_PATH, tokens, "SmsTest-burstSmsAllFine");

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(3, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	};

	public static void assertSmsMessage(SmsMessage message) throws Exception {

		assertTrue(tokens.contains(message.token));

		assertTrue(message.fromTelephoneNumber.equals("1234"));
		assertTrue(message.toTelephoneNumber.equals("5678"));
		assertTrue(StringUtils.isNotBlank(message.text));

	}

	public String anyItem(List<String> items) {
		Random randomGenerator = new Random();
		int index = randomGenerator.nextInt(items.size());
		return items.get(index);
	}

};