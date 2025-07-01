package com.sourcekraft.documentburster.unit.documentation.userguide.burst.configuration;

import static org.junit.Assert.*;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;


import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class ConfigurationTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";
    private static final String REUSE_TOKEN_WHEN_NOT_FOUND_PATH =
            "src/test/resources/input/unit/pdf/reuse-token-when-not-found.pdf";

    private static final List<String> payslipsTokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    private static final List<String> reuseTokens = Arrays.asList("doc1", "doc2", "doc3");

    @Test
    public final void burstWithSendFalseAndDeleteOnceTheyAreDistributedTrue() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
                        "ConfigurationTest-burstWithSendFalseAndDeleteOnceTheyAreDistributedTrue") {

                    protected void executeController() throws Exception {
                        super.executeController();
                        ctx.settings.setDeleteFiles(true);
                    };

                };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(payslipsTokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : payslipsTokens) {

            String path = burster.getCtx().outputFolder + "/" + token + ".pdf";

            // output reports should not be deleted since
            // sendFile is 'false' (OnceTheyAreDistributedTrue)
            File outputReport = new File(path);
            assertTrue(outputReport.exists());

        }

        // only backup file should be deleted
        File backupFile = new File(burster.getCtx().backupFolder + "/Payslips.pdf");
        assertFalse(backupFile.exists());

    };

    @Test
    public final void burstWithReuseTokenWhenNotFoundFalse() throws Exception {
        burstReuseTokenWhenNotFound(false);
    }

    @Test
    public final void burstWithReuseTokenWhenNotFoundTrue() throws Exception {
        burstReuseTokenWhenNotFound(true);
    }

    private final void burstReuseTokenWhenNotFound(final boolean reuseTokenWhenNotFound) throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "ConfigurationTest-burstReuseTokenWhenNotFound") {

                    protected void executeController() throws Exception {
                        super.executeController();
                        ctx.settings.setReuseTokensWhenNotFound(reuseTokenWhenNotFound);
                    };

                };

        burster.burst(REUSE_TOKEN_WHEN_NOT_FOUND_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(reuseTokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : reuseTokens) {

            String path = burster.getCtx().outputFolder + "/" + token + ".pdf";

            // output reports should not be deleted since
            // sendFile is 'false' (OnceTheyAreDistributedTrue)
            File outputReport = new File(path);
            assertTrue(outputReport.exists());

            DocumentTester tester = new DocumentTester(path);

            // assert number of pages
            if (!reuseTokenWhenNotFound) {
                tester.assertPageCountEquals(1);
            } else {

                tester.assertContentDoesNotContainTextOnPage("{" + token + "}", 2, TextSearchType.CONTAINS);

                if (token.equals("doc1")) {

                    tester.assertPageCountEquals(4);

                    tester.assertContentDoesNotContainTextOnPage("{" + token + "}", 3, TextSearchType.CONTAINS);
                    tester.assertContentDoesNotContainTextOnPage("{" + token + "}", 4, TextSearchType.CONTAINS);

                } else if (token.equals("doc2"))
                    tester.assertPageCountEquals(2);

                tester.assertContentContainsTextOnPage("{" + token + "}", 1, TextSearchType.CONTAINS);

            }
            // assert PDF keywords
            tester.assertKeywordsEquals(token);

            tester.close();

        }

    }
};