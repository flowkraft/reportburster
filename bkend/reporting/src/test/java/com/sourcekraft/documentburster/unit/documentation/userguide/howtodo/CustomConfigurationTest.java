package com.sourcekraft.documentburster.unit.documentation.userguide.howtodo;

import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Arrays;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.ExcelTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;
import com.sourcekraft.documentburster.variables.Variables;

public class CustomConfigurationTest {

    private static final String EXCEL_BURST_BY_DISTINCT_COLUMN_VALUES_COMPLEX =
            "src/test/resources/input/unit/excel/extra/burst-by-distinct-column-values-complex.xls";

    private static final String PDF_CUSTOM_SETTINGS_SHORT =
            "src/test/resources/input/unit/pdf/custom-settings-short.pdf";
    private static final String PDF_CUSTOM_SETTINGS_LONG = "src/test/resources/input/unit/pdf/custom-settings-long.pdf";

    @Test
    public final void pdfCustomSettingsShort() throws Exception {

        pdfCustomSettings(PDF_CUSTOM_SETTINGS_SHORT, "CustomConfigurationTest-pdfCustomSettingsShort");

    }

    @Test
    public final void pdfCustomSettingsLong() throws Exception {

        pdfCustomSettings(PDF_CUSTOM_SETTINGS_LONG, "CustomConfigurationTest-pdfCustomSettingsLong");

    }

    private final void pdfCustomSettings(String filePath, final String testName) throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, testName);

        burster.burst(filePath, false, StringUtils.EMPTY, -1);

        // assert only 2 files have been generated
        String outputFolder = burster.getCtx().outputFolder + "/";
        assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert for the Custom File Name
        String path = burster.getCtx().outputFolder + "/John Lehnon-March.pdf";

        // assert the files have been generated
        File outputReport = new File(path);
        assertTrue(outputReport.exists());

        path = burster.getCtx().outputFolder + "/Paul McCartney-June.pdf";

        // assert the files have been generated
        outputReport = new File(path);
        assertTrue(outputReport.exists());

    }

    @Test
    public void excelBurstTokensAndVariablesAndCustomSettings() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PoiExcelBurster(StringUtils.EMPTY,
                        "CustomConfigurationTest-excelBurstTokensAndVariablesAndCustomSettings");

        burster.burst(EXCEL_BURST_BY_DISTINCT_COLUMN_VALUES_COMPLEX, false, StringUtils.EMPTY, -1);

        // assert only 2 files have been generated
        String outputFolder = burster.getCtx().outputFolder + "/";
        assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : Arrays.asList("Germany", "USA")) {

            String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
            String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();

            // assert custom configuration
            // ${var0}-${var1}.${input_document_extension}
            String fileName = var0 + "-" + var1 + ".xls";

            File outputReport = new File(outputFolder + fileName);
            assertTrue(outputReport.exists());

            InputStream input = new FileInputStream(outputReport);
            Workbook workBook = WorkbookFactory.create(input);

            // assert it has a single sheet and it is the correct sheet
            assertEquals(1, workBook.getNumberOfSheets());
            assertNotNull(workBook.getSheet("Customer List"));

            // assert the data to be correct
            assertTrue(ExcelTestUtils.isWorkbookDataValid(workBook, token));

            input.close();

        }

        // assert "skip" variable values
        String skip = burster.getCtx().variables.getUserVariables("Germany").get(Variables.SKIP).toString();
        assertFalse(Boolean.valueOf(skip).booleanValue());

        skip = burster.getCtx().variables.getUserVariables("USA").get(Variables.SKIP).toString();
        assertTrue(Boolean.valueOf(skip).booleanValue());
    }

};