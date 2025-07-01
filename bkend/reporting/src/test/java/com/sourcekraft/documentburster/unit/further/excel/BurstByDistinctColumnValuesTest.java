package com.sourcekraft.documentburster.unit.further.excel;

import static org.junit.Assert.*;

import java.io.File;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.ExcelTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;

public class BurstByDistinctColumnValuesTest {

    private static final String BURST_BY_DISTINCT_COLUMN_VALUES_COPY =
            "src/test/resources/input/unit/excel/extra/burst-by-distinct-column-values-copy.xls";

    private static final List<String> tokens = Arrays.asList("Germany", "USA", "UK", "Sweden", "France", "Spain",
            "Canada", "Argentina", "Switzerland", "Brazil", "Austria", "Italy", "Portugal", "Mexico", "Venezuela",
            "Ireland", "Belgium", "Norway", "Denmark", "Finland", "Poland");

    @Test
    public void burstSpeedyCopyAndVariables() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PoiExcelBurster(StringUtils.EMPTY,
                        "BurstByDistinctColumnValuesTest-burstSpeedyCopyAndVariables") {

                    protected String getTempWorkBookPath() {

                        String baseName = FilenameUtils.getBaseName(filePath);
                        String extension = FilenameUtils.getExtension(filePath);

                        Random generator = new Random(Long.MAX_VALUE);

                        return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp/" + baseName + "_" + generator.nextInt() + "." + extension;

                    }
                   
                };

        // a "temp" folder is required to be available
        FileUtils.forceMkdir(new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/temp"));

        // assert the usual things for BurstByDistinctColumnValues
        burster.burst(BURST_BY_DISTINCT_COLUMN_VALUES_COPY, false, StringUtils.EMPTY, -1);
        ExcelTestUtils.assertDefaultDistincValuesResults(burster, tokens);

        // assert variable values
        // assert the SKIP variable is 'false' for token 'USA@USA.biz'
        String var0 = burster.getCtx().variables.getUserVariables("Germany").get("var0").toString();
        assertEquals("Alfreds Futterkiste", var0);

        String var1 = burster.getCtx().variables.getUserVariables("Germany").get("var1").toString();
        assertEquals("Berlin", var1);

        var0 = burster.getCtx().variables.getUserVariables("USA").get("var0").toString();
        assertEquals("Fran Wilson", var0);

        var1 = burster.getCtx().variables.getUserVariables("USA").get("var1").toString();
        assertEquals("Portland", var1);

    }

}