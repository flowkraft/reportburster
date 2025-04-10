/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.unit.further.other;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;

import com.sourcekraft.documentburster._helpers.DocumentTester;
import com.sourcekraft.documentburster._helpers.DocumentTester.TextSearchType;

public class DistributedByTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

    private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    @Test
    public final void burst() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "DistributedByTest-burst");

        FileUtils.forceMkdir(new File("./temp/"));
        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
        FileUtils.deleteQuietly(new File("./temp/"));

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(tokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : tokens) {

            String path = outputFolder + token + ".pdf";

            File outputReport = new File(path);
            assertTrue(outputReport.exists());

            DocumentTester tester = new DocumentTester(path);

            // assert number of pages
            tester.assertPageCountEquals(1);

            // assert content
            tester.assertContentContainsTextOnPage("Sent by ReportBurster - https://reportburster.com/g/dbrb/br", 1,
                    TextSearchType.CONTAINS);

            // assert PDF keywords
            tester.assertKeywordsEquals(token);

            tester.close();

        }

    };

}
