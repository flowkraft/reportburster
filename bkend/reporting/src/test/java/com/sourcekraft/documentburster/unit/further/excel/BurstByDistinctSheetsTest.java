package com.sourcekraft.documentburster.unit.further.excel;

import static org.junit.Assert.*;

import java.io.File;
import java.util.Arrays;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.variables.Variables;

public class BurstByDistinctSheetsTest {

    private static final String BURST_BY_DISTINCT_SHEETS_METADATA_PATH =
            "src/test/resources/input/unit/excel/extra/burst-by-distinct-sheets-metadata.xls";

    @Test
    public void burstUsingMetadataAndVariablesAndCustomConfig() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PoiExcelBurster(StringUtils.EMPTY,
                        "BurstByDistinctSheetsTest-burstUsingMetadataAndVariablesAndCustomConfig");

        burster.burst(BURST_BY_DISTINCT_SHEETS_METADATA_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder = burster.getCtx().outputFolder + "/";

        // assert that only 2 files are generated
        assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : Arrays.asList("USA@USA.biz", "Canada@Canada.com")) {

            // assert output report exists and has the correct Custom File Name
            // burstfilename - > settings-custom.xml
            // (${var0}-${var1}.${input_document_extension})

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();

            String fileName = var0 + "-" + var1 + ".xls";

            File file = new File(outputFolder + fileName);
            assertTrue(file.exists());

        }

        // assert the SKIP variable is 'false' for token 'USA@USA.biz'
        String skip = burster.getCtx().variables.getUserVariables("USA@USA.biz").get(Variables.SKIP).toString();
        assertFalse(Boolean.valueOf(skip).booleanValue());

        // assert the SKIP variable is 'true' for token 'Canada@Canada.com'
        skip = burster.getCtx().variables.getUserVariables("Canada@Canada.com").get(Variables.SKIP).toString();
        assertTrue(Boolean.valueOf(skip).booleanValue());

    }
}