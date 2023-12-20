package com.sourcekraft.documentburster.unit.documentation.advanced.scripting.samples;

import static org.junit.Assert.*;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class MergeExternalFilesTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";
    private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    @Test
    public void merge() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "MergeExternalFilesTest-merge") {
            protected void executeController() throws Exception {

                super.executeController();

                ctx.scripts.endExtractDocument = "merge_with_external_files.groovy";

            };
        };

        // the script has hard-coded def externalFilePath =
        // "samples/Invoices-Dec.pdf"
        // so for now the simples way is to make a dirty FileCopy for
        // Invoices-Dec.pdf
        // to a temporarily samples directory
        FileUtils.copyFileToDirectory(new File("src/main/external-resources/template/samples/burst/Invoices-Dec.pdf"),
                new File("samples"));

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // remove the temporarily file/folder samples/Invoices-Dec.pdf
        FileUtils.deleteQuietly(new File("samples"));

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(tokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : tokens) {

            String path = burster.getCtx().outputFolder + "/" + token + ".pdf";

            File outputReport = new File(path);
            assertTrue(outputReport.exists());

            DocumentTester tester = new DocumentTester(path);

            // assert number of pages
            tester.assertPageCountEquals(3);

            // assert content

            // assert that external report is merged first
            tester.assertContentContainsTextOnPage("{0018}", 1, TextSearchType.CONTAINS);
            tester.assertContentContainsTextOnPage("{0019}", 2, TextSearchType.CONTAINS);

            // and the extracted file is merged second
            tester.assertContentContainsTextOnPage("{" + token + "}", 3, TextSearchType.CONTAINS);

            tester.close();

        }

    }
};