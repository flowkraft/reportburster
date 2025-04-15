package com.sourcekraft.documentburster.unit.documentation.advanced.scripting.samples;

import static org.junit.Assert.assertTrue;

import java.io.File;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;

public class ZipTest {

    private static final String PAYSLIPS_REPORT_PATH =
            "src/main/external-resources/template/samples/burst/Payslips-Distinct-Sheets.xls";

    @Test
    public void zip() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PoiExcelBurster(StringUtils.EMPTY, "ZipTest-zip") {
            protected void executeController() throws Exception {

                super.executeController();

                ctx.scripts.endBursting = "zip.groovy";

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // assert the output zip
        String path = burster.getCtx().outputFolder + "/Payslips-Distinct-Sheets.xls.zip";
        File zip = new File(path);
        assertTrue(zip.exists());

    }
};