package com.sourcekraft.documentburster._helpers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.excel.ExcelUtils;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

public class ExcelTestUtils {

    public static AbstractBurster doBurstAndAssertDefaultDistincValuesResults(String filePath, List<String> tokens,
            final String testName) throws Exception {

        AbstractBurster burster = new TestBursterFactory.PoiExcelBurster(StringUtils.EMPTY, testName);

        // a "temp" folder is required to be available
        FileUtils.forceMkdir(new File(TestsUtils.TESTS_OUTPUT_FOLDER + "/temp"));

        burster.burst(filePath, false, StringUtils.EMPTY, -1);
        ExcelTestUtils.assertDefaultDistincValuesResults(burster, tokens);

        return burster;
    }

    public static void assertDefaultDistincValuesResults(AbstractBurster burster, List<String> tokens) throws Exception {

        String extension = FilenameUtils.getExtension(burster.getCtx().inputDocumentFilePath);
        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(tokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports
        for (String token : tokens) {

            String path = outputFolder + "/" + token + "." + extension;

            File outputReport = new File(path);
            assertTrue(outputReport.exists());

            InputStream input = new FileInputStream(outputReport);
            Workbook workBook = WorkbookFactory.create(input);

            // assert it has a single sheet and it is the correct sheet
            assertEquals(1, workBook.getNumberOfSheets());
            assertNotNull(workBook.getSheet("Customer List"));

            // assert the data to be correct
            assertTrue(isWorkbookDataValid(workBook, token));

            input.close();
        }
        
        TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);
    
    }

    public static boolean isWorkbookDataValid(Workbook workBook, String valueToCheck) {

        Sheet sheet = workBook.getSheetAt(0);
        int columnIndex = sheet.getRow(0).getLastCellNum() - 1;

        for (Row row : sheet) {

            Cell cell = row.getCell(columnIndex);

            if (cell != null) {

                String cellValue = ExcelUtils.getCellValueAsString(cell);

                if (cellValue == null || cellValue.length() == 0)
                    cellValue = "keep-row";

                if ((!cellValue.equals("keep-row")) && (!cellValue.equals(valueToCheck)))
                    return false;

            }
        }

        return true;

    }

}