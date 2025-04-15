package com.sourcekraft.documentburster.unit.documentation.userguide.variables;

import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class CustomizableBurstFileNameTest {

    private static final String INVOICES_REPORT_PATH = "src/main/external-resources/template/samples/burst/Invoices-Oct.pdf";

    private static final List<String> tokens = Arrays.asList("0011", "0012", "0013", "0014");

    @Test
    public final void burstUsingStringTemplateVariablesSyntax() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "CustomizableBurstFileNameTest-burstUsingStringTemplateVariablesSyntax") {
                    protected void executeController() throws Exception {

                    	 super.executeController();

                        // Custom File Name
                        ctx.settings.setBurstFileName("$var1$-$burst_token$-$var0$.$input_document_extension$");

                    };
                };

        burster.burst(INVOICES_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // assert output reports
        for (String token : tokens) {

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();

            // assert for the Custom File Name
            String path = burster.getCtx().outputFolder + "/" + var1 + "-" + token + "-" + var0 + ".pdf";

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

    @Test
    public final void burstUsingFreeMarkerVariablesSyntax() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "CustomizableBurstFileNameTest-burstUsingFreeMarkerVariablesSyntax") {
                    protected void executeController() throws Exception {

                    	 super.executeController();

                        // Custom File Name
                        ctx.settings.setBurstFileName("${var1}-${burst_token}-${var0}.${input_document_extension}");

                    };
                };

        burster.burst(INVOICES_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // assert output reports
        for (String token : tokens) {

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();

            // assert for the Custom File Name
            String path = burster.getCtx().outputFolder + "/" + var1 + "-" + token + "-" + var0 + ".pdf";

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
