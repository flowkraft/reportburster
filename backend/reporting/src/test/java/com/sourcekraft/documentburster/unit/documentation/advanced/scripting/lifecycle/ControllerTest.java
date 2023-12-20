package com.sourcekraft.documentburster.unit.documentation.advanced.scripting.lifecycle;

import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.variables.Variables;

public class ControllerTest {

    private static final String INVOICES_OCT_REPORT_PATH =
            "src/main/external-resources/template/samples/burst/Invoices-Oct.pdf";
    private static final String INVOICES_NOV_REPORT_PATH =
            "src/main/external-resources/template/samples/burst/Invoices-Nov.pdf";

    private static final List<String> invoice_oct_tokens = Arrays.asList("0011", "0012", "0013", "0014");

    private static final List<String> invoice_nov_tokens = Arrays.asList("0015", "0016", "0017");

    @Test
    public void controller() throws Exception {

        // Invoices-Oct.pdf
        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "ControllerTest-controller") {
            protected void executeController() throws Exception {

                super.executeController();

                scripting.executeBurstingLifeCycleScript("controller_lifecycle.groovy", ctx);

                ctx.variables =
                        new Variables(FilenameUtils.getName(ctx.inputDocumentFilePath), ctx.settings.getLanguage(),
                                ctx.settings.getCountry(), ctx.settings.getNumberOfUserVariables());
            };
        };

        // assert for var0-var1.pdf configuration
        burster.burst(INVOICES_OCT_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // assert output reports
        for (String token : invoice_oct_tokens) {

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();

            // assert for the Custom File Name
            String path = burster.getCtx().outputFolder + "/" + var0 + "-" + var1 + ".pdf";

            // assert the files have been generated
            File outputReport = new File(path);
            assertTrue(outputReport.exists());

        }

        // assert for var1-var0.pdf configuration
        burster.burst(INVOICES_NOV_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // assert output reports
        for (String token : invoice_nov_tokens) {

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();

            // assert for the Custom File Name
            String path = burster.getCtx().outputFolder + "/" + var1 + "-" + var0 + ".pdf";

            // assert the files have been generated
            File outputReport = new File(path);
            assertTrue(outputReport.exists());

        }

    }

};