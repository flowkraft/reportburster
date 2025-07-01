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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.job.JobUtils;
import com.sourcekraft.documentburster.job.model.JobProgressDetails;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

public class StartPauseCancelTest {

    private static final List<String> cancelPauseTokens = Arrays.asList("clyde.grew@northridgehealth.org",
            "kyle.butford@northridgehealth.org");

    private static final List<String> resumedTokens = Arrays.asList("alfreda.waldback@northridgehealth.org");

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

    private final void _cancel(final boolean distributeReports, final boolean qualityAssuranceAllTokens)
            throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
                        "StartPauseCancelRetryPolicy-cancel-distributeReports-" + distributeReports
                                + "-qualityAssuranceAllTokens-" + qualityAssuranceAllTokens) {
                    protected void executeController() throws Exception {

                        super.executeController();

                        // otherwise progress file will not be created
                        licenseUtils.getLicense().setMockPaid(true);
                        
                        if (distributeReports)
                            super.setUpMockEmail();

                        if (qualityAssuranceAllTokens)
                            ctx.scripts.email = "assert_email_not_executed.groovy";

                        StartPauseCancelInfo data = new StartPauseCancelInfo();

                        data.command = "cancel";

                        data.cancelFilePath = getTempFolder() + getCancelJobFileName();
                        data.pauseFilePath = getTempFolder() + getPauseJobFileName();
                        data.progressFilePath = getTempFolder() + getJobProgressFileName();

                        ctx.additionalInformation = data;

                        ctx.scripts.endExtractDocument = "startpausecancel.groovy";

                    };
                };

       
        burster.burst(PAYSLIPS_REPORT_PATH, qualityAssuranceAllTokens, StringUtils.EMPTY, -1);

        // quality-assurance folder should not be created;
        if (!qualityAssuranceAllTokens)
            assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance").exists());

        assertEquals(2, burster.getCtx().numberOfExtractedFiles);

        if (distributeReports)
            assertEquals(2, burster.getCtx().numberOfDistributedFiles);
        else
            assertEquals(0, burster.getCtx().numberOfDistributedFiles);

        assertEquals(0, burster.getCtx().numberOfSkippedFiles);
        assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

        // assert cancel file was removed
        String cancelFilePath = ((StartPauseCancelInfo) burster.getCtx().additionalInformation).cancelFilePath;
        File cancelFile = new File(cancelFilePath);
        assertFalse(cancelFile.exists());

        // assert progress file was removed
        String progressFilePath = ((StartPauseCancelInfo) burster.getCtx().additionalInformation).progressFilePath;
        File progressFile = new File(progressFilePath);
        assertFalse(progressFile.exists());

        String outputFolder = burster.getCtx().outputFolder + "/";
        assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        if (qualityAssuranceAllTokens) {

            if (distributeReports)
                assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
            else
                assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

        }

        String shouldNotExistFilePath = outputFolder + "alfreda.waldback@northridgehealth.org.pdf";
        File shouldNotExistFile = new File(shouldNotExistFilePath);
        assertFalse(shouldNotExistFile.exists());

        // assert no cancel, pause, progress job files are left into the temp folder
        assertFalse((new File(burster.getTempFolder() + burster.getCancelJobFileName())).exists());
        assertFalse((new File(burster.getTempFolder() + burster.getPauseJobFileName())).exists());
        assertFalse((new File(burster.getTempFolder() + burster.getJobProgressFileName())).exists());

        PdfTestUtils.assertDefaultResults(burster, cancelPauseTokens);

    }

    private final void _pauseAndResume(final boolean distributeReports, final boolean qualityAssuranceAllTokens)
            throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
                        "StartPauseCancelRetryPolicy-pauseAndResume-distributeReports-" + distributeReports
                                + "-qualityAssuranceAllTokens-" + qualityAssuranceAllTokens) {
                    protected void executeController() throws Exception {

                    	super.executeController();
                    	
                    	// otherwise progress file will not be created
                        licenseUtils.getLicense().setMockPaid(true);
                        
                        if (distributeReports)
                            super.setUpMockEmail();

                        if (qualityAssuranceAllTokens)
                            ctx.scripts.email = "assert_email_not_executed.groovy";

                        StartPauseCancelInfo data = new StartPauseCancelInfo();

                        data.command = "pause";

                        data.cancelFilePath = getTempFolder() + getCancelJobFileName();
                        data.pauseFilePath = getTempFolder() + getPauseJobFileName();
                        data.progressFilePath = getTempFolder() + getJobProgressFileName();

                        ctx.additionalInformation = data;

                        ctx.scripts.endExtractDocument = "startpausecancel.groovy";

                    };
                };

        // ASSERT 0 - Pausing
        burster.burst(PAYSLIPS_REPORT_PATH, qualityAssuranceAllTokens, StringUtils.EMPTY, -1);

        // quality-assurance folder should not be created;
        if (!qualityAssuranceAllTokens)
            assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance").exists());

        assertEquals(2, burster.getCtx().numberOfExtractedFiles);

        if (distributeReports)
            assertEquals(2, burster.getCtx().numberOfDistributedFiles);
        else
            assertEquals(0, burster.getCtx().numberOfDistributedFiles);

        assertEquals(0, burster.getCtx().numberOfSkippedFiles);
        assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

        // assert cancel file was removed
        String pauseFilePath = ((StartPauseCancelInfo) burster.getCtx().additionalInformation).pauseFilePath;
        File pauseFile = new File(pauseFilePath);
        assertFalse(pauseFile.exists());

        String outputFolder = burster.getCtx().outputFolder + "/";
        assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        if (qualityAssuranceAllTokens) {

            if (distributeReports)
                assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
            else
                assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

        }

        String shouldNotExistFilePath = outputFolder + "alfreda.waldback@northridgehealth.org.pdf";
        File shouldNotExistFile = new File(shouldNotExistFilePath);
        assertFalse(shouldNotExistFile.exists());

        PdfTestUtils.assertDefaultResults(burster, cancelPauseTokens);

        // assert progress file content is correct
        String progressFilePath = ((StartPauseCancelInfo) burster.getCtx().additionalInformation).progressFilePath;
        File progressFile = new File(progressFilePath);

        JobProgressDetails jobProgressDetails = JobUtils.loadJobProgressFile(progressFilePath);

        assertEquals(jobProgressDetails.filepath, burster.getCtx().inputDocumentFilePath);

        assertEquals(jobProgressDetails.lasttokenprocessed, "kyle.butford@northridgehealth.org");
        assertEquals(jobProgressDetails.lasttokenindocument, "alfreda.waldback@northridgehealth.org");

        assertEquals(jobProgressDetails.tokenscount, 3);
        assertEquals(jobProgressDetails.pagescount, 3);

        assertEquals(jobProgressDetails.numberofremainingtokens, 1);
        assertEquals(jobProgressDetails.indexoflasttokenprocessed, 1);

        // assert progress job files is in the temp folder
        assertTrue((new File(burster.getTempFolder() + burster.getJobProgressFileName())).exists());

        Thread.sleep(1000);

        // ASSERT 1 - Resuming
        burster.setPreviousJobExecutionProgressDetails(jobProgressDetails);
        burster.setJobFilePath(progressFilePath);

        try {

            burster.burst(jobProgressDetails.filepath, qualityAssuranceAllTokens, StringUtils.EMPTY, -1);

            // assert the initial progress file was removed
            assertFalse((new File(burster.getTempFolder() + burster.getJobProgressFileName())).exists());

            assertEquals(1, burster.getCtx().numberOfExtractedFiles);

            if (distributeReports)
                assertEquals(1, burster.getCtx().numberOfDistributedFiles);
            else
                assertEquals(0, burster.getCtx().numberOfDistributedFiles);

            assertEquals(0, burster.getCtx().numberOfSkippedFiles);
            assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

            // assert cancel file was removed
            pauseFilePath = ((StartPauseCancelInfo) burster.getCtx().additionalInformation).pauseFilePath;
            pauseFile = new File(pauseFilePath);
            assertFalse(pauseFile.exists());

            outputFolder = burster.getCtx().outputFolder + "/";
            assertEquals(1, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

            if (qualityAssuranceAllTokens) {

                if (distributeReports)
                    assertEquals(1, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
                else
                    assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

            }

            // assert shouldNotExist files
            for (String token : cancelPauseTokens) {

                shouldNotExistFilePath = outputFolder + token + ".pdf";
                shouldNotExistFile = new File(shouldNotExistFilePath);
                assertFalse(shouldNotExistFile.exists());

            }

            PdfTestUtils.assertDefaultResults(burster, resumedTokens);

        } finally {

            if ((progressFile != null) && (progressFile.exists()))
                progressFile.delete();

        }

        // assert no cancel, pause, progress job files are left into the temp folder
        assertFalse((new File(burster.getTempFolder() + burster.getCancelJobFileName())).exists());
        assertFalse((new File(burster.getTempFolder() + burster.getPauseJobFileName())).exists());
        assertFalse((new File(burster.getTempFolder() + burster.getJobProgressFileName())).exists());

    }

    @Test
    public final void cancelDistributeReportsFalseQualityAssuranceAllTokensFalse() throws Exception {
        _cancel(false, false);
    }

    @Test
    public final void cancelDistributeReportsFalseQualityAssuranceAllTokensTrue() throws Exception {
        _cancel(false, true);
    }

    @Test
    public final void cancelDistributeReportsTrueQualityAssuranceAllTokensFalse() throws Exception {
        _cancel(true, false);
    }

    @Test
    public final void cancelDistributeReportsTrueQualityAssuranceAllTokensTrue() throws Exception {
        _cancel(true, true);
    }

    @Test
    public final void pauseAndResumeDistributeReportsFalseQualityAssuranceAllTokensFalse() throws Exception {
        _pauseAndResume(false, false);
    }

    @Test
    public final void pauseAndResumeDistributeReportsFalseQualityAssuranceAllTokensTrue() throws Exception {
        _pauseAndResume(false, true);
    }

    @Test
    public final void pauseAndResumeDistributeReportsTrueQualityAssuranceAllTokensFalse() throws Exception {
        _pauseAndResume(true, false);
    }

    @Test
    public final void pauseAndResumeDistributeReportsTrueQualityAssuranceAllTokensTrue() throws Exception {
        _pauseAndResume(true, true);
    }

}
