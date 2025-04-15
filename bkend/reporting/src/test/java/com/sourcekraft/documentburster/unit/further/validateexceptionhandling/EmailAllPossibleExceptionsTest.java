package com.sourcekraft.documentburster.unit.further.validateexceptionhandling;

import static org.junit.Assert.*;

import javax.mail.AuthenticationFailedException;
import javax.mail.FolderClosedException;
import javax.mail.FolderNotFoundException;
import javax.mail.IllegalWriteException;
import javax.mail.MessageRemovedException;
import javax.mail.MessagingException;
import javax.mail.MethodNotSupportedException;
import javax.mail.NoSuchProviderException;
import javax.mail.ReadOnlyFolderException;
import javax.mail.SendFailedException;
import javax.mail.StoreClosedException;
import javax.mail.internet.ParseException;
import javax.mail.search.SearchException;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.mail.EmailException;
import org.junit.Test;

import org.simplejavamail.MailException;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest;

public class EmailAllPossibleExceptionsTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	// 0. java.lang.Exception
	@Test
	public final void testExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testExceptionFailJobFalse");

	};

	@Test
	public final void testExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testExceptionFailJobTrue", "java.lang.Exception");

	};

	// 0. java.lang.RuntimeException
	@Test
	public final void testRuntimeExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testRuntimeExceptionFailJobFalse");

	};

	@Test
	public final void testRuntimeExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testRuntimeExceptionFailJobTrue",
				"java.lang.RuntimeException");

	};

	// 1. javax.mail.MessagingException
	@Test
	public final void testMessagingExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testMessagingExceptionFailJobFalse");

	};

	@Test
	public final void testMessagingExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testMessagingExceptionFailJobTrue",
				"javax.mail.MessagingException");

	};

	// 2. javax.mail.AuthenticationFailedException
	@Test
	public final void testAuthenticationFailedExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testAuthenticationFailedExceptionFailJobFalse");

	};

	@Test
	public final void testAuthenticationFailedExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testAuthenticationFailedExceptionFailJobTrue",
				"javax.mail.AuthenticationFailedException");

	};

	// 3. javax.mail.FolderClosedException
	@Test
	public final void testFolderClosedExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testFolderClosedExceptionFailJobFalse");

	};

	@Test
	public final void testFolderClosedExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testFolderClosedExceptionFailJobTrue",
				"javax.mail.FolderClosedException");

	};

	// 4. javax.mail.FolderNotFoundException
	@Test
	public final void testFolderNotFoundExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testFolderNotFoundExceptionFailJobFalse");

	};

	@Test
	public final void testFolderNotFoundExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testFolderNotFoundExceptionFailJobTrue",
				"javax.mail.FolderNotFoundException");

	};

	// 5. javax.mail.IllegalWriteException
	@Test
	public final void testIllegalWriteExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testIllegalWriteExceptionFailJobFalse");

	};

	@Test
	public final void testIllegalWriteExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testIllegalWriteExceptionFailJobTrue",
				"javax.mail.IllegalWriteException");

	};

	// 6. javax.mail.MessageRemovedException
	@Test
	public final void testMessageRemovedExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testMessageRemovedExceptionFailJobFalse");

	};

	@Test
	public final void testMessageRemovedExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testMessageRemovedExceptionFailJobTrue",
				"javax.mail.MessageRemovedException");

	};

	// 7. javax.mail.MethodNotSupportedException
	@Test
	public final void testMethodNotSupportedExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testMethodNotSupportedExceptionFailJobFalse");

	};

	@Test
	public final void testMethodNotSupportedExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testMethodNotSupportedExceptionFailJobTrue",
				"javax.mail.MethodNotSupportedException");

	};

	// 8. javax.mail.NoSuchProviderException
	@Test
	public final void testNoSuchProviderExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testNoSuchProviderExceptionFailJobFalse");

	};

	@Test
	public final void testNoSuchProviderExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testNoSuchProviderExceptionFailJobTrue",
				"javax.mail.NoSuchProviderException");

	};

	// 9. javax.mail.internet.ParseException
	@Test
	public final void testParseExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testParseExceptionFailJobFalse");

	};

	@Test
	public final void testParseExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testParseExceptionFailJobTrue",
				"javax.mail.internet.ParseException");

	};

	// 10. javax.mail.ReadOnlyFolderException
	@Test
	public final void testReadOnlyFolderExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testReadOnlyFolderExceptionFailJobFalse");

	};

	@Test
	public final void testReadOnlyFolderExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testReadOnlyFolderExceptionFailJobTrue",
				"javax.mail.ReadOnlyFolderException");

	};

	// 11. javax.mail.search.SearchException
	@Test
	public final void testSearchExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testSearchExceptionFailJobFalse");

	};

	@Test
	public final void testSearchExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testSearchExceptionFailJobTrue",
				"javax.mail.search.SearchException");

	};

	// 12. javax.mail.SendFailedException
	@Test
	public final void testSendFailedExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testSendFailedExceptionFailJobFalse");

	};

	@Test
	public final void testSendFailedExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testSendFailedExceptionFailJobTrue",
				"javax.mail.SendFailedException");

	};

	// 13. javax.mail.StoreClosedException
	@Test
	public final void testStoreClosedExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testStoreClosedExceptionFailJobFalse");

	};

	@Test
	public final void testStoreClosedExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testStoreClosedExceptionFailJobTrue",
				"javax.mail.StoreClosedException");

	};

	// 14. org.apache.commons.mail.EmailException
	@Test
	public final void testEmailExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testEmailExceptionFailJobFalse");

	};

	@Test
	public final void testEmailExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testEmailExceptionFailJobTrue",
				"org.apache.commons.mail.EmailException");

	};

	// 15. org.apache.commons.mail.EmailException
	@Test
	public final void testSJMMailExceptionFailJobFalse() {

		_testExceptionFailJobFalse("EmailPossibleErrorsTest-testSJMMailExceptionFailJobFalse");

	};

	@Test
	public final void testSJMMailExceptionFailJobTrue() {

		_testExceptionFailJobTrue("EmailPossibleErrorsTest-testSJMMailExceptionFailJobTrue",
				"com.sourcekraft.documentburster.unit.further.validateexceptionhandling.EmailAllPossibleExceptionsTest$1SJMMailException");

	};

	@Test
	public final void testSMTPServerHostNotFoundFailJobTrue() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailPossibleErrorsTest-testSMTPServerHostNotFound") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.scripts.email = "email.groovy";
				ctx.settings.setEmailSubject(StringUtils.EMPTY);
				ctx.settings.setEmailText(StringUtils.EMPTY);
				ctx.settings.setFailJobIfAnyDistributionFails(true);

			};
		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			assertEquals(EmailException.class, e.getClass());
			assertEquals(MessagingException.class, e.getCause().getClass().getSuperclass());
			assertTrue(e.getCause().getMessage().toLowerCase().contains("host"));
		} finally {
			assertEquals(1, burster.getCtx().numberOfExtractedFiles);
			assertEquals(0, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
		}

	};

	@Test
	public final void testSMTPServerHostNotFoundFailJobFalse() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailPossibleErrorsTest-testSMTPServerHostNotFoundFailJobFalse") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.scripts.email = "email.groovy";
				ctx.settings.setEmailSubject(StringUtils.EMPTY);
				ctx.settings.setEmailText(StringUtils.EMPTY);
				ctx.settings.setFailJobIfAnyDistributionFails(false);

			};
		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			fail("Exception should not be thrown - "
					+ "EmailPossibleErrorsTest-testSMTPServerHostNotFoundFailJobFalse");
		}

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(0, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(3, burster.getCtx().numberOfQuarantinedFiles);

	};

	private final void _testExceptionFailJobFalse(String tstName) {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, tstName) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setFailJobIfAnyDistributionFails(false);

			};
		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			fail("Exception should not be thrown - " + tstName);
		}

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(2, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);

		try {
			TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
		} catch (Exception e) {
			fail("Exception should not be thrown - " + tstName);
		}

	};

	private final void _testExceptionFailJobTrue(String tstName, String exceptionClassName) {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, tstName) {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.setFailJobIfAnyDistributionFails(true);

			};
		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			assertTrue(e.getClass().getName().equals(exceptionClassName));
			assertTrue(e.getMessage().contains(tstName));
		} finally {
			assertEquals(2, burster.getCtx().numberOfExtractedFiles);
			assertEquals(1, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);

			try {
				TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
			} catch (Exception e) {
				fail("Exception should not be thrown - " + tstName);
			}

		}

	};

	public static void throwPossibleErrors(EmailMessage emailMessage) throws Exception {

		// do this only for "clyde.grew@northridgehealth.org"
		if (emailMessage.token.equals("kyle.butford@northridgehealth.org")) {

			if (emailMessage.ctx.testName.toLowerCase().contains("testexceptionfailjob"))
				throw new Exception(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testruntimeexceptionfailjob"))
				throw new RuntimeException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testmessagingexceptionfailjob"))
				throw new MessagingException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testauthenticationfailedexceptionfailjob"))
				throw new AuthenticationFailedException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testfolderclosedexceptionfailjob"))
				throw new FolderClosedException(null, emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testfoldernotfoundexceptionfailjob"))
				throw new FolderNotFoundException(null, emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testillegalwriteexceptionfailjob"))
				throw new IllegalWriteException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testmessageremovedexceptionfailjob"))
				throw new MessageRemovedException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testmethodnotsupportedexceptionfailjob"))
				throw new MethodNotSupportedException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testnosuchproviderexceptionfailjob"))
				throw new NoSuchProviderException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testparseexceptionfailjob"))
				throw new ParseException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testreadonlyfolderexceptionfailjob"))
				throw new ReadOnlyFolderException(null, emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testsearchexceptionfailjob"))
				throw new SearchException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testsendfailedexceptionfailjob"))
				throw new SendFailedException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("teststoreclosedexceptionfailjob"))
				throw new StoreClosedException(null, emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testemailexceptionfailjob"))
				throw new EmailException(emailMessage.ctx.testName);
			else if (emailMessage.ctx.testName.toLowerCase().contains("testsjmmailexceptionfailjob")) {

				final class SJMMailException extends MailException {

					private static final long serialVersionUID = 1L;

					SJMMailException(String message) {
						super(message);
					}
				}

				throw new SJMMailException(emailMessage.ctx.testName);

			}
		} else
			EmailTest.assertEmailMessage(emailMessage);

	}

};