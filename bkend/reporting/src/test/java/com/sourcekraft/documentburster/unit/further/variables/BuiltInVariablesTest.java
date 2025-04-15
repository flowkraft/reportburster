package com.sourcekraft.documentburster.unit.further.variables;

import static org.junit.Assert.*;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.utils.Utils;

public class BuiltInVariablesTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

    private static final List<String> tokens = Arrays.asList("clyde.grew@northridgehealth.org",
            "kyle.butford@northridgehealth.org", "alfreda.waldback@northridgehealth.org");

    @Test
    public final void burstUsingStringTemplateVariablesSyntax() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "BuiltInVariablesTest-burstUsingStringTemplateVariablesSyntax") {
            protected void executeController() throws Exception {

                super.executeController();

                ctx.settings
                        .setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/output/$input_document_name$/BuiltInVariablesTest-burstUsingStringTemplateVariablesSyntax/$now; format=\"yyyy\"$/$now; format=\"MM.dd\"$/$burst_token$");

                ctx.settings
                        .setQuarantineFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/quarantine/$input_document_name$/$now; format=\"yyyy\"$/$now; format=\"MM.dd\"$/$burst_token$");

                ctx.settings.setBurstFileName("$burst_token$-$burst_index$.$input_document_extension$");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        File lastOutputDir = new File(burster.getCtx().outputFolder);
        String outputFolder = lastOutputDir.getParent();

        // assert for ${input_document_name}
        assertTrue(outputFolder.contains(FilenameUtils.getName(PAYSLIPS_REPORT_PATH)));

        // assert for $now; format=\"yyyy\"$
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy");
        assertTrue(outputFolder.contains(formatter.format(new Date())));

        // assert for $now; format=\"MM.dd\"$
        formatter = new SimpleDateFormat("MM.dd");
        assertTrue(outputFolder.contains(formatter.format(new Date())));

        // assert for $now_quarter$
        int expectedQuarter = Utils.getQuarter(new Date(), null);
        assertEquals((Integer.valueOf(expectedQuarter)).toString(), burster.getCtx().variables.get("now_quarter"));

        // assert for the output files to have the correct name/path
        for (String token : tokens) {

            // assert for $burst_token$ used to define the outputfolder
            assertEquals(1, new File(outputFolder + "/" + token + "/").listFiles(UtilsTest.outputFilesFilter).length);

            // assert for $burst_token$-$burst_index$.${input_document_extension} used to define
            // burst filename
            String path = outputFolder + "/" + token + "/" + token + "-" + (tokens.indexOf(token) + 1) + ".pdf";

            File outputReport = new File(path);
            assertTrue(outputReport.exists());

        }
    };
    
    @Test
    public final void burstUsingFreeMarkerVariablesSyntax() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "BuiltInVariablesTest-burstUsingFreeMarkerVariablesSyntax") {
            protected void executeController() throws Exception {

                super.executeController();

                ctx.settings
                        .setOutputFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/output/${input_document_name}/BuiltInVariablesTest-burstUsingFreeMarkerVariablesSyntax/${now?string['yyyy']}/${now?string['MM.dd']}/${burst_token}");

                ctx.settings
                        .setQuarantineFolder(TestsUtils.TESTS_OUTPUT_FOLDER + "/quarantine/${input_document_name}/${now?string['yyyy']}/${now?string['MM.dd']}/${burst_token}");

                ctx.settings.setBurstFileName("${burst_token}-${burst_index}.${input_document_extension}");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        File lastOutputDir = new File(burster.getCtx().outputFolder);
        String outputFolder = lastOutputDir.getParent();

        // assert for ${input_document_name}
        assertTrue(outputFolder.contains(FilenameUtils.getName(PAYSLIPS_REPORT_PATH)));

        // assert for $now; format=\"yyyy\"$
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy");
        assertTrue(outputFolder.contains(formatter.format(new Date())));

        // assert for $now; format=\"MM.dd\"$
        formatter = new SimpleDateFormat("MM.dd");
        assertTrue(outputFolder.contains(formatter.format(new Date())));

        // assert for $now_quarter$
        int expectedQuarter = Utils.getQuarter(new Date(), null);
        assertEquals((Integer.valueOf(expectedQuarter)).toString(), burster.getCtx().variables.get("now_quarter"));

        // assert for the output files to have the correct name/path
        for (String token : tokens) {

            // assert for $burst_token$ used to define the outputfolder
            assertEquals(1, new File(outputFolder + "/" + token + "/").listFiles(UtilsTest.outputFilesFilter).length);

            // assert for $burst_token$-$burst_index$.${input_document_extension} used to define
            // burst filename
            String path = outputFolder + "/" + token + "/" + token + "-" + (tokens.indexOf(token) + 1) + ".pdf";

            File outputReport = new File(path);
            assertTrue(outputReport.exists());

        }
    };

}
