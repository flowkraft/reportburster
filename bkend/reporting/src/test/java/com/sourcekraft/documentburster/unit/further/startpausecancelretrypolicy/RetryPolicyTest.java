/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.unit.further.startpausecancelretrypolicy;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import java.util.Random;

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

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.EmailMessage;

public class RetryPolicyTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	@Test
	public final void testExceptionFailJobFalseRetryFalse() {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"RetryPolicyTest-testExceptionFailJobFalseRetryFalse") {

			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();
				ctx.scripts.email = "email_retry_policy.groovy";

				ctx.settings.setFailJobIfAnyDistributionFails(false);

			};

		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			fail("Exception should not be thrown - RetryPolicyTest-testExceptionFailJobFalseRetryFalse");
		} finally {
			assertEquals(3, burster.getCtx().numberOfExtractedFiles);
			assertEquals(2, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);

			try {
				TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
			} catch (Exception e) {
				fail("Exception should not be thrown - " + e);
			}
		}

	};

	@Test
	public final void testExceptionFailJobFalseRetryTrueFails2() {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"RetryPolicyTest-testExceptionFailJobFalseRetryTrueFails2") {

			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();
				ctx.scripts.email = "email_retry_policy.groovy";

				ctx.settings.setFailJobIfAnyDistributionFails(false);
				ctx.settings.setEnableRetryPolicy(true);

				RetryPolicyInfo data = new RetryPolicyInfo();
				data.requestedNumberOfFailures = 2;
				ctx.additionalInformation = data;

			};

		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			fail("Exception should not be thrown - RetryPolicyTest-testExceptionFailJobFalseRetryTrueFails2");
		} finally {
			assertEquals(3, burster.getCtx().numberOfExtractedFiles);
			assertEquals(3, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);
			
			try {
				TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
			} catch (Exception e) {
				fail("Exception should not be thrown - " + e);
			}
		}

	};

	@Test
	public final void testExceptionFailJobFalseRetryTrueFails4() {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"RetryPolicyTest-testExceptionFailJobFalseRetryTrueFails4") {

			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();
				ctx.scripts.email = "email_retry_policy.groovy";

				ctx.settings.setFailJobIfAnyDistributionFails(false);
				ctx.settings.setEnableRetryPolicy(true);

				RetryPolicyInfo data = new RetryPolicyInfo();
				data.requestedNumberOfFailures = 4;
				ctx.additionalInformation = data;

			};

		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			fail("Exception should not be thrown - RetryPolicyTest-testExceptionFailJobFalseRetryTrueFails4");
		} finally {
			assertEquals(3, burster.getCtx().numberOfExtractedFiles);
			assertEquals(2, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
			
			try {
				TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
			} catch (Exception e) {
				fail("Exception should not be thrown - " + e);
			}
		}

	};

	@Test
	public final void testExceptionFailJobTrueRetryFalse() {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"RetryPolicyTest-testExceptionFailJobTrueRetryFalse") {

			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();
				ctx.scripts.email = "email_retry_policy.groovy";

				ctx.settings.setFailJobIfAnyDistributionFails(true);

			};

		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			assertTrue(e.getMessage().contains("RetryPolicyTest-testExceptionFailJobTrueRetryFalse"));
		} finally {
			assertEquals(2, burster.getCtx().numberOfExtractedFiles);
			assertEquals(1, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
			
			try {
				TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
			} catch (Exception e) {
				fail("Exception should not be thrown - " + e);
			}
		}

	};

	@Test
	public final void testExceptionFailJobTrueRetryTrueFails2() {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"RetryPolicyTest-testExceptionFailJobTrueRetryTrueFails2") {

			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();
				ctx.scripts.email = "email_retry_policy.groovy";

				ctx.settings.setFailJobIfAnyDistributionFails(true);

				ctx.settings.setEnableRetryPolicy(true);

				RetryPolicyInfo data = new RetryPolicyInfo();
				data.requestedNumberOfFailures = 2;
				ctx.additionalInformation = data;

			};

		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			fail("Exception should not be thrown - RetryPolicyTest-testExceptionFailJobTrueRetryTrueFails2");
		} finally {
			assertEquals(3, burster.getCtx().numberOfExtractedFiles);
			assertEquals(3, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);
			
			try {
				TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
			} catch (Exception e) {
				fail("Exception should not be thrown - " + e);
			}
		}

	};

	@Test
	public final void testExceptionFailJobTrueRetryTrueFails4() {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"RetryPolicyTest-testExceptionFailJobTrueRetryTrueFails4") {

			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();
				ctx.scripts.email = "email_retry_policy.groovy";

				ctx.settings.setFailJobIfAnyDistributionFails(true);

				ctx.settings.setEnableRetryPolicy(true);

				RetryPolicyInfo data = new RetryPolicyInfo();
				data.requestedNumberOfFailures = 4;
				ctx.additionalInformation = data;

			};

		};

		try {
			burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			assertTrue(e.getMessage().contains("RetryPolicyTest-testExceptionFailJobTrueRetryTrueFails4"));
		} finally {
			assertEquals(2, burster.getCtx().numberOfExtractedFiles);
			assertEquals(1, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
			
			try {
				TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
			} catch (Exception e) {
				fail("Exception should not be thrown - " + e);
			}
		}
	}

	public static void throwRandomPossibleEmailException(EmailMessage emailMessage) throws Exception {

		Random r = new Random();
		int indexRandomException = r.nextInt(16);

		if (indexRandomException == 0)
			throw new Exception(emailMessage.ctx.testName);
		else if (indexRandomException == 1)
			throw new MessagingException(emailMessage.ctx.testName);
		else if (indexRandomException == 2)
			throw new AuthenticationFailedException(emailMessage.ctx.testName);
		else if (indexRandomException == 3)
			throw new FolderClosedException(null, emailMessage.ctx.testName);
		else if (indexRandomException == 4)
			throw new FolderNotFoundException(null, emailMessage.ctx.testName);
		else if (indexRandomException == 5)
			throw new IllegalWriteException(emailMessage.ctx.testName);
		else if (indexRandomException == 6)
			throw new MessageRemovedException(emailMessage.ctx.testName);
		else if (indexRandomException == 7)
			throw new MethodNotSupportedException(emailMessage.ctx.testName);
		else if (indexRandomException == 8)
			throw new NoSuchProviderException(emailMessage.ctx.testName);
		else if (indexRandomException == 9)
			throw new ParseException(emailMessage.ctx.testName);
		else if (indexRandomException == 10)
			throw new ReadOnlyFolderException(null, emailMessage.ctx.testName);
		else if (indexRandomException == 11)
			throw new SearchException(emailMessage.ctx.testName);
		else if (indexRandomException == 12)
			throw new SendFailedException(emailMessage.ctx.testName);
		else if (indexRandomException == 13)
			throw new SendFailedException(emailMessage.ctx.testName);
		else if (indexRandomException == 14)
			throw new StoreClosedException(null, emailMessage.ctx.testName);
		else if (indexRandomException == 15)
			throw new EmailException(emailMessage.ctx.testName);

	}

}
