package com.sourcekraft.documentburster.unit.further.variables;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

public class UserVariablesTest {

    private static final String USER_VARIABLES_PATH = "src/test/resources/input/unit/pdf/user-variables.pdf";

    private static final List<String> tokens = Arrays.asList("page1", "page2", "page3");

    @Test
    public final void burstUsingStringTemplateVariablesSyntax() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UserVariablesTest-burstUsingStringTemplateVariablesSyntax") {
            protected void executeController() throws Exception {

            	super.executeController();

                ctx.settings
                        .setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/output/${input_document_name}/UserVariablesTest-burstUsingStringTemplateVariablesSyntax/${burst_token}/${var0}/${var1}/${var2}/${var3}");

                ctx.settings.setBurstFileName("${var4}-${var5}-${var6}-${var7}-${var8}-${var9}.${input_document_extension}");

            };
        };

        burster.burst(USER_VARIABLES_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder =
        		TestsUtils.TESTS_OUTPUT_FOLDER + "/output/" + FilenameUtils.getName(USER_VARIABLES_PATH)
                        + "/UserVariablesTest-burstUsingStringTemplateVariablesSyntax/";

        // assert for the output files to have the correct name/path
        for (String token : tokens) {

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();
            String var2 = burster.getCtx().variables.getUserVariables(token).get("var2").toString();
            String var3 = burster.getCtx().variables.getUserVariables(token).get("var3").toString();
            String var4 = burster.getCtx().variables.getUserVariables(token).get("var4").toString();
            String var5 = burster.getCtx().variables.getUserVariables(token).get("var5").toString();
            String var6 = burster.getCtx().variables.getUserVariables(token).get("var6").toString();
            String var7 = burster.getCtx().variables.getUserVariables(token).get("var7").toString();
            String var8 = burster.getCtx().variables.getUserVariables(token).get("var8").toString();
            String var9 = burster.getCtx().variables.getUserVariables(token).get("var9").toString();

            String fullOutputFolder = outputFolder + token + "/" + var0 + "/" + var1 + "/" + var2 + "/" + var3;

            // assert only one file is generated per folder
            assertEquals(1, new File(fullOutputFolder + "/").listFiles(UtilsTest.outputFilesFilter).length);

            // assert for
            // ${var4}-${var5}-${var6}-${var7}-${var8}-${var9}.${input_document_extension}
            // burst filename
            String path =
                    fullOutputFolder + "/" + var4 + "-" + var5 + "-" + var6 + "-" + var7 + "-" + var8 + "-" + var9
                            + ".pdf";

            File outputReport = new File(path);
            assertTrue(outputReport.exists());
        }

    };

    @Test
    public final void burstUsingFreeMarkerVariablesSyntax() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UserVariablesTest-burstUsingFreeMarkerVariablesSyntax") {
            protected void executeController() throws Exception {

            	super.executeController();

                ctx.settings
                        .setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/output/${input_document_name}/UserVariablesTest-burstUsingFreeMarkerVariablesSyntax/${burst_token}/${var0}/${var1}/${var2}/${var3}");

                ctx.settings.setBurstFileName("${var4}-${var5}-${var6}-${var7}-${var8}-${var9}.${input_document_extension}");

            };
        };

        burster.burst(USER_VARIABLES_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder =
        		TestsUtils.TESTS_OUTPUT_FOLDER + "/output/" + FilenameUtils.getName(USER_VARIABLES_PATH)
                        + "/UserVariablesTest-burstUsingFreeMarkerVariablesSyntax/";

        // assert for the output files to have the correct name/path
        for (String token : tokens) {

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();
            String var2 = burster.getCtx().variables.getUserVariables(token).get("var2").toString();
            String var3 = burster.getCtx().variables.getUserVariables(token).get("var3").toString();
            String var4 = burster.getCtx().variables.getUserVariables(token).get("var4").toString();
            String var5 = burster.getCtx().variables.getUserVariables(token).get("var5").toString();
            String var6 = burster.getCtx().variables.getUserVariables(token).get("var6").toString();
            String var7 = burster.getCtx().variables.getUserVariables(token).get("var7").toString();
            String var8 = burster.getCtx().variables.getUserVariables(token).get("var8").toString();
            String var9 = burster.getCtx().variables.getUserVariables(token).get("var9").toString();

            String fullOutputFolder = outputFolder + token + "/" + var0 + "/" + var1 + "/" + var2 + "/" + var3;

            // assert only one file is generated per folder
            assertEquals(1, new File(fullOutputFolder + "/").listFiles(UtilsTest.outputFilesFilter).length);

            // assert for
            // ${var4}-${var5}-${var6}-${var7}-${var8}-${var9}.${input_document_extension}
            // burst filename
            String path =
                    fullOutputFolder + "/" + var4 + "-" + var5 + "-" + var6 + "-" + var7 + "-" + var8 + "-" + var9
                            + ".pdf";

            File outputReport = new File(path);
            assertTrue(outputReport.exists());
        }

    };
}
