package com.sourcekraft.documentburster.unit.documentation.userguide.qualityassurance;

import static org.junit.Assert.assertEquals;
import java.io.File;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class UploadTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

    private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    @Test
    public final void allTokensDistributeReportsFalse() throws Exception {

        allTokensFtp(false);

    }

    @Test
    public final void allTokensDistributeReportsTrue() throws Exception {

        allTokensFtp(true);

    }

    private void allTokensFtp(final boolean distributeReports) throws Exception {
        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-allTokens-distributeReports-"
                        + distributeReports) {
                    protected void executeController() throws Exception {

                        super.executeController();

                        super.setUpMockUpload();
                        ctx.settings.setSendFilesUpload(distributeReports);

                        ctx.scripts.upload = "assert_upload_not_executed.groovy";

                        ctx.settings
                                .setFtpCommand("-T $extracted_file_path$ --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/");

                    };
                };

        burster.burst(PAYSLIPS_REPORT_PATH, true, StringUtils.EMPTY, -1);

        if (distributeReports)
            assertEquals(3, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
        else
            assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

        // assert individual quality-assurance files
        for (String token : tokens) {

            assertEquals(distributeReports, new File(burster.getCtx().outputFolder + "/quality-assurance/" + token
                    + "_ftp_upload.txt").exists());

        }

        // assert 3 output files are generated
        assertEquals(3, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        PdfTestUtils.assertDefaultResults(burster, tokens);

        assertEquals(3, burster.getCtx().numberOfExtractedFiles);
        if (distributeReports)
            assertEquals(3, burster.getCtx().numberOfDistributedFiles);
        else
            assertEquals(0, burster.getCtx().numberOfDistributedFiles);

        assertEquals(0, burster.getCtx().numberOfSkippedFiles);
        assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

    }

    @Test
    public final void listOfTokensDistributeReportsFalse() throws Exception {
        listOfTokens(false);
    }

    @Test
    public final void listOfTokensDistributeReportsTrue() throws Exception {
        listOfTokens(true);
    }

    private void listOfTokens(final boolean distributeReports) throws Exception {
        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-listOfTokens-distributeReports-"
                        + distributeReports) {
                    protected void executeController() throws Exception {

                        super.executeController();

                        super.setUpMockUpload();
                        ctx.settings.setSendFilesUpload(distributeReports);

                        if (!distributeReports)
                            ctx.scripts.upload = "assert_upload_not_executed.groovy";
                        else
                            ctx.scripts.upload = "assert_upload_ftp_executed.groovy";

                        ctx.settings
                                .setFtpCommand("-T $extracted_file_path$ --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/");

                    };

                };

        String testTokens = "clyde.grew@northridgehealth.org,alfreda.waldback@northridgehealth.org";
        burster.burst(PAYSLIPS_REPORT_PATH, false, testTokens, -1);

        // assert 2 ftp corresponding quality-assurance files
        // are generated if distributeReports=true and 0 otherwise
        if (distributeReports)
            assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
        else
            assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

        List<String> listOfTestTokens = Arrays.asList(testTokens.split(","));
        // assert individual quality-assurance files
        for (String token : listOfTestTokens) {

            assertEquals(distributeReports, new File(burster.getCtx().outputFolder + "/quality-assurance/" + token
                    + "_ftp_upload.txt").exists());

        }

        // assert only 2 output files are generated
        assertEquals(2, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        PdfTestUtils.assertDefaultResults(burster, listOfTestTokens);

        assertEquals(2, burster.getCtx().numberOfExtractedFiles);
        if (distributeReports)
            assertEquals(2, burster.getCtx().numberOfDistributedFiles);
        else
            assertEquals(0, burster.getCtx().numberOfDistributedFiles);
        assertEquals(0, burster.getCtx().numberOfSkippedFiles);
        assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

    }

    @Test
    public void randomTokensDistributeReportsTrue() throws Exception {
        randomTokens(true);
    }

    @Test
    public void randomTokensDistributeReportsFalse() throws Exception {
        randomTokens(false);
    }

    private void randomTokens(final boolean distributeReports) throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-randomTokens-distributeReports-"
                        + distributeReports) {
                    protected void executeController() throws Exception {

                        super.executeController();

                        super.setUpMockUpload();
                        ctx.settings.setSendFilesUpload(distributeReports);

                        if (!distributeReports)
                            ctx.scripts.upload = "assert_upload_not_executed.groovy";
                        else
                            ctx.scripts.upload = "assert_upload_ftp_executed.groovy";

                        ctx.settings
                                .setFtpCommand("-T $extracted_file_path$ --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/");

                    };
                };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, 2);

        // assert 2 ftp corresponding quality-assurance files
        // are generated if distributeReports == true and 0 otherwise
        if (distributeReports)
            assertEquals(2, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);
        else
            assertEquals(0, new File(burster.getCtx().outputFolder + "/quality-assurance").listFiles().length);

        // assert only 2 output files are generated
        assertEquals(2, new File(burster.getCtx().outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        Iterator<File> it =
                FileUtils.iterateFiles(new File(burster.getCtx().outputFolder), new String[]{"pdf"}, false);

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

        assertEquals(2, burster.getCtx().numberOfExtractedFiles);
        if (distributeReports)
            assertEquals(2, burster.getCtx().numberOfDistributedFiles);
        else
            assertEquals(0, burster.getCtx().numberOfDistributedFiles);

        assertEquals(0, burster.getCtx().numberOfSkippedFiles);
        assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

    };

};