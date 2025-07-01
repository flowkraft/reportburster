package com.sourcekraft.documentburster.unit.documentation.advanced.scripting.samples;

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

public class FetchDistributionDetailsFileTest {

    private static final String LEGACY_NO_BURST_TOKENS_PATH =
            "src/test/resources/input/unit/pdf/legacy-no-burst-tokens.pdf";

    private static final List<String> tokens = Arrays.asList("1", "2", "3", "4");

    @Test
    public void burst() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "FetchDistributionDetailsFileTest-burst") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        ctx.settings.setBurstFileName("${var0}_${var1}_${var2}.${input_document_extension}");
                        ctx.scripts.startExtractDocument = "fetch_distribution_details_from_csv_file.groovy";

                    };
                };

        burster.burst(LEGACY_NO_BURST_TOKENS_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(tokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : tokens) {

            String path =
                    burster.getCtx().outputFolder + "/email" + token + "@address" + token + ".com_firstName" + token
                            + "_lastName" + token + ".pdf";

            File outputReport = new File(path);
            assertTrue(outputReport.exists());

            DocumentTester tester = new DocumentTester(path);

            // assert number of pages
            tester.assertPageCountEquals(1);

            tester.close();
        }

    }

};