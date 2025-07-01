package com.sourcekraft.documentburster.unit.documentation.userguide.distribute;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import java.io.File;
import java.util.Random;

import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.common.settings.model.Proxy;
import com.sourcekraft.documentburster.common.settings.model.SimpleJavaMail;

public class EmailWithApacheCommonsEmailOrWithSimpleJavaMailTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	@Test
	public final void commonScenarioWithApacheCommonsEmail() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailWithApacheCommonsEmailOrWithSimpleJavaMailTest-commonScenarioWithApacheCommonsEmail") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.scripts.email = "assert_email_executed_commons_email_sjm.groovy";
			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

		// quality-assurance folder should not be created;
		assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance").exists());

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(3, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	};

	@Test
	public final void commonScenarioWithSimpleJavaMail() throws Exception {

		SimpleJavaMail sjmTestConfig = _generateRandomSimpleJavaMailConfiguration();

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailWithApacheCommonsEmailOrWithSimpleJavaMailTest-commonScenarioWithSimpleJavaMail") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				// send the emails using SJM
				ctx.settings.setSimpleJavaMail(sjmTestConfig);
				ctx.settings.getSimpleJavaMail().active = true;

				ctx.scripts.email = "assert_email_executed_commons_email_sjm.groovy";

			};
		};

		burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

		// quality-assurance folder should not be created;
		assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance").exists());

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(3, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	};

	public static void assertEmailMessageWithSimpleJavaMail(EmailMessage message) throws Exception {

		assertEquals(true, message.sjm.active);

		assertEquals(message.ctx.settings.getSimpleJavaMail().replytoaddress, message.sjm.replytoaddress);
		assertEquals(message.ctx.settings.getSimpleJavaMail().replytoname, message.sjm.replytoname);

		assertEquals(message.ctx.settings.getSimpleJavaMail().bouncetoaddress, message.sjm.bouncetoaddress);
		assertEquals(message.ctx.settings.getSimpleJavaMail().bouncetoname, message.sjm.bouncetoname);

		assertEquals(message.ctx.settings.getSimpleJavaMail().receipttoaddress, message.sjm.receipttoaddress);
		assertEquals(message.ctx.settings.getSimpleJavaMail().receipttoname, message.sjm.receipttoname);

		assertEquals(message.ctx.settings.getSimpleJavaMail().dispositionnotificationtoaddress,
				message.sjm.dispositionnotificationtoaddress);
		assertEquals(message.ctx.settings.getSimpleJavaMail().dispositionnotificationtoname,
				message.sjm.dispositionnotificationtoname);

		assertEquals(message.ctx.settings.getSimpleJavaMail().customemailheaders, message.sjm.customemailheaders);
		assertEquals(message.ctx.settings.getSimpleJavaMail().customsessionproperties,
				message.sjm.customsessionproperties);

		assertEquals(message.ctx.settings.getSimpleJavaMail().javaxmaildebug, message.sjm.javaxmaildebug);
		assertEquals(message.ctx.settings.getSimpleJavaMail().transportmodeloggingonly,
				message.sjm.transportmodeloggingonly);

		assertEquals(message.ctx.settings.getSimpleJavaMail().proxy.host, message.sjm.proxy.host);
		assertEquals(message.ctx.settings.getSimpleJavaMail().proxy.port, message.sjm.proxy.port);

		assertEquals(message.ctx.settings.getSimpleJavaMail().proxy.username, message.sjm.proxy.username);
		assertEquals(message.ctx.settings.getSimpleJavaMail().proxy.password, message.sjm.proxy.password);

		assertEquals(message.ctx.settings.getSimpleJavaMail().proxy.socks5bridgeport,
				message.sjm.proxy.socks5bridgeport);

	}

	private SimpleJavaMail _generateRandomSimpleJavaMailConfiguration() {

		SimpleJavaMail config = new SimpleJavaMail();

		config.replytoaddress = RandomStringUtils.random(10, true, false);
		config.replytoname = RandomStringUtils.random(10, true, false);

		config.bouncetoaddress = RandomStringUtils.random(10, true, false);
		config.bouncetoname = RandomStringUtils.random(10, true, false);

		config.receipttoaddress = RandomStringUtils.random(10, true, false);
		config.receipttoname = RandomStringUtils.random(10, true, false);

		config.dispositionnotificationtoaddress = RandomStringUtils.random(10, true, false);
		config.dispositionnotificationtoname = RandomStringUtils.random(10, true, false);

		config.customemailheaders = RandomStringUtils.random(10, true, false);
		config.customsessionproperties = RandomStringUtils.random(10, true, false);

		config.javaxmaildebug = new Random().nextBoolean();
		config.transportmodeloggingonly = new Random().nextBoolean();

		Proxy proxy = new Proxy();

		proxy.host = RandomStringUtils.random(10, true, false);
		proxy.port = new Random().nextInt(10000);

		proxy.username = RandomStringUtils.random(10, true, false);
		proxy.password = RandomStringUtils.random(10, true, false);

		proxy.socks5bridgeport = new Random().nextInt(10000);

		config.proxy = proxy;

		return config;

	}

};