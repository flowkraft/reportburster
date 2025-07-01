package com.sourcekraft.documentburster.unit.further.validateexceptionhandling;

import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.junit.Assert.assertEquals;

import org.apache.commons.lang3.StringUtils;
import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.ExitStatusException;
import org.apache.tools.ant.UnsupportedAttributeException;
import org.apache.tools.ant.UnsupportedElementException;
import org.apache.tools.ant.taskdefs.optional.testing.BuildTimeoutException;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.UploadMessage;

public class UploadAllPossibleExceptionsTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";
    private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    // 0. java.lang.Exception
    @Test
    public final void testExceptionFailJobFalse() {

        _testExceptionFailJobFalse("UploadPossibleErrorsTest-testExceptionFailJobFalse");

    };

    @Test
    public final void testExceptionFailJobTrue() {

        _testExceptionfailJobTrue("UploadPossibleErrorsTest-testExceptionFailJobTrue", "java.lang.Exception");

    };

    // 1. java.lang.RuntimeException
    @Test
    public final void testRuntimeExceptionFailJobFalse() {

        _testExceptionFailJobFalse("UploadPossibleErrorsTest-testRuntimeExceptionFailJobFalse");

    };

    @Test
    public final void testRuntimeExceptionFailJobTrue() {

        _testExceptionfailJobTrue("UploadPossibleErrorsTest-testRuntimeExceptionFailJobTrue",
                "java.lang.RuntimeException");

    };

    // 2. org.apache.tools.ant.BuildException
    @Test
    public final void testBuildExceptionExceptionFailJobFalse() {

        _testExceptionFailJobFalse("UploadPossibleErrorsTest-testBuildExceptionFailJobFalse");

    };

    @Test
    public final void testBuildExceptionExceptionFailJobTrue() {

        _testExceptionfailJobTrue("UploadPossibleErrorsTest-testBuildExceptionFailJobTrue",
                "org.apache.tools.ant.BuildException");

    };

    // 3. org.apache.tools.ant.taskdefs.optional.testing.BuildTimeoutException
    @Test
    public final void testBuildTimeoutExceptionFailJobFalse() {

        _testExceptionFailJobFalse("UploadPossibleErrorsTest-testBuildTimeoutExceptionFailJobFalse");

    };

    @Test
    public final void testBuildTimeoutExceptionFailJobTrue() {

        _testExceptionfailJobTrue("UploadPossibleErrorsTest-testBuildTimeoutExceptionFailJobTrue",
                "org.apache.tools.ant.taskdefs.optional.testing.BuildTimeoutException");

    };

    // 4. org.apache.tools.ant.ExitStatusException
    @Test
    public final void testExitStatusExceptionFailJobFalse() {

        _testExceptionFailJobFalse("UploadPossibleErrorsTest-testExitStatusExceptionFailJobFalse");

    };

    @Test
    public final void testExitStatusExceptionFailJobTrue() {

        _testExceptionfailJobTrue("UploadPossibleErrorsTest-testExitStatusExceptionFailJobTrue",
                "org.apache.tools.ant.ExitStatusException");

    };

    // 5. org.apache.tools.ant.UnsupportedAttributeException
    @Test
    public final void testUnsupportedAttributeExceptionFailJobFalse() {

        _testExceptionFailJobFalse("UploadPossibleErrorsTest-testUnsupportedAttributeExceptionFailJobFalse");

    };

    @Test
    public final void testUnsupportedAttributeExceptionFailJobTrue() {

        _testExceptionfailJobTrue("UploadPossibleErrorsTest-testUnsupportedAttributeExceptionFailJobTrue",
                "org.apache.tools.ant.UnsupportedAttributeException");

    };

    // 6. org.apache.tools.ant.UnsupportedElementException
    @Test
    public final void testUnsupportedElementExceptionFailJobFalse() {

        _testExceptionFailJobFalse("UploadPossibleErrorsTest-testUnsupportedElementExceptionFailJobFalse");

    };

    @Test
    public final void testUnsupportedElementExceptionFailJobTrue() {

        _testExceptionfailJobTrue("UploadPossibleErrorsTest-testUnsupportedElementExceptionFailJobTrue",
                "org.apache.tools.ant.UnsupportedElementException");

    };

    public static void assertUploadMessage(UploadMessage message) throws Exception {

        assertTrue(tokens.contains(message.token));
        assertTrue(message.uploadCommand.endsWith(message.token
                + ".pdf --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/"));

    }

    private final void _testExceptionFailJobFalse(String tstName) {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, tstName) {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.settings.setFailJobIfAnyDistributionFails(false);

                ctx.scripts.upload = "assert_upload_possibleerrors.groovy";
                ctx.settings
                        .setFtpCommand("-T $extracted_file_path$ --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/");

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

    }

    private final void _testExceptionfailJobTrue(String tstName, String exceptionClassName) {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, tstName) {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.settings.setFailJobIfAnyDistributionFails(true);

                ctx.scripts.upload = "assert_upload_possibleerrors.groovy";
                ctx.settings
                        .setFtpCommand("-T $extracted_file_path$ --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/");

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
    }

    public static void throwPossibleErrors(UploadMessage uploadMessage) throws Exception {

        // do this only for "clyde.grew@northridgehealth.org"
        if (uploadMessage.token.equals("kyle.butford@northridgehealth.org")) {

            if (uploadMessage.ctx.testName.toLowerCase().contains("testexceptionfailjob"))
                throw new Exception(uploadMessage.ctx.testName);
            else if (uploadMessage.ctx.testName.toLowerCase().contains("testruntimeexceptionfailjob"))
                throw new RuntimeException(uploadMessage.ctx.testName);
            else if (uploadMessage.ctx.testName.toLowerCase().contains("testbuildexceptionfailjob"))
                throw new BuildException(uploadMessage.ctx.testName);
            else if (uploadMessage.ctx.testName.toLowerCase().contains("testbuildtimeoutexceptionfailjob"))
                throw new BuildTimeoutException(uploadMessage.ctx.testName);
            else if (uploadMessage.ctx.testName.toLowerCase().contains("testexitstatusexceptionfailjob"))
                throw new ExitStatusException(uploadMessage.ctx.testName, -1);
            else if (uploadMessage.ctx.testName.toLowerCase().contains("testunsupportedattributeexceptionfailjob"))
                throw new UnsupportedAttributeException(uploadMessage.ctx.testName, null);
            else if (uploadMessage.ctx.testName.toLowerCase().contains("testunsupportedelementexceptionfailjob"))
                throw new UnsupportedElementException(uploadMessage.ctx.testName, null);
        } else
            assertUploadMessage(uploadMessage);

    }

};