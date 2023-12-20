package com.sourcekraft.documentburster.unit.documentation.userguide.burst;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;
import static org.junit.Assert.*;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class InvoicesOctTest {

    private static final String INVOICES_REPORT_PATH = "src/main/external-resources/template/samples/burst/Invoices-Oct.pdf";

    private static final List<String> tokens = Arrays.asList("0011", "0012", "0013", "0014");

    @Test
    public final void burst() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "InvoicesOctTest-burst") {
            protected void executeController() throws Exception {

                super.executeController();

                // Custom File Name
                ctx.settings.setBurstFileName("Invoice-${burst_token}.${input_document_extension}");

            };
        };

        burster.burst(INVOICES_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // assert output reports
        for (String token : tokens) {

            // assert for the Custom File Name
            String path = burster.getCtx().outputFolder + "/Invoice-" + token + ".pdf";

            // assert the files have been generated
            File outputReport = new File(path);
            assertTrue(outputReport.exists());

            DocumentTester tester = new DocumentTester(path);

            // assert number of pages
            tester.assertPageCountEquals(1);

            // assert content
            tester.assertContentContainsTextOnPage("{" + token + "}", 1, TextSearchType.CONTAINS);

            // assert PDF keywords
            tester.assertKeywordsEquals(token);

            tester.close();

        }

        // assert the backup file
        File backupFile = new File(burster.getCtx().backupFolder + "/Invoices-Oct.pdf");
        assertTrue(backupFile.exists());

    }
}