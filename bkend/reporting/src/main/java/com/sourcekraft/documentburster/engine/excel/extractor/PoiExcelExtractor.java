package com.sourcekraft.documentburster.engine.excel.extractor;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import com.sourcekraft.documentburster.engine.excel.ExcelUtils;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
//import org.perf4j.aop.Profiled;

public class PoiExcelExtractor {

    private Logger log = LoggerFactory.getLogger(PoiExcelExtractor.class);

    private List<CellStyle> destStyles = new ArrayList<CellStyle>();

    private String inputFilePath;
    private String outputFilePath;

    private String token;

    private String tempWorkbookPath;

    public PoiExcelExtractor(String inputFilePath, String outputFilePath, String token) {

        log.debug("inputFilePath = " + ", outputFilePath = " + outputFilePath + ", token = " + token);

        this.inputFilePath = inputFilePath;
        this.outputFilePath = outputFilePath;
        this.token = token;

    }

    //@Profiled
    public void doExtractForDistinctColumnValueCopy(int sheetIndex, int columnIndex) throws Exception {

        log.debug("sheetIndex = " + sheetIndex + ", columnIndex = " + columnIndex);

        InputStream dest;

        FileOutputStream fileOut = null;
        InputStream input = null;

        try {

            dest = new FileInputStream(new File(tempWorkbookPath));
            Workbook destWorkbook = WorkbookFactory.create(dest);
            Sheet destSheet = destWorkbook.getSheetAt(sheetIndex);

            input = new FileInputStream(new File(inputFilePath));
            Workbook inputWorkbook = WorkbookFactory.create(input);
            Sheet inputSheet = inputWorkbook.getSheetAt(sheetIndex);

            copyMatchingRows(columnIndex, destWorkbook, destSheet, inputSheet);

            destWorkbook.setActiveSheet(sheetIndex);
            setActiveCell(destSheet);

            fileOut = new FileOutputStream(outputFilePath);

            destWorkbook.write(fileOut);
            fileOut.flush();

        } finally {

            closeResources(fileOut, input);

        }

    }

    private void copyMatchingRows(int columnIndex, Workbook destWorkbook, Sheet destSheet, Sheet inputSheet) {
        int burstColumnIndex = -1;
        int destRowNum = 0;

        for (Row inputRow : inputSheet) {

            if (burstColumnIndex == -1) {
                burstColumnIndex = getBurstColumnIndex(columnIndex, inputRow);
            }

            Cell burstCell = null;

            if (inputRow != null)
                burstCell = inputRow.getCell(burstColumnIndex);

            String cellValue = StringUtils.EMPTY;

            if (burstCell != null)
                cellValue = ExcelUtils.getCellValueAsString(burstCell);

            if (StringUtils.isEmpty(cellValue))
                cellValue = "keep-row";

            cellValue = cellValue.trim();

            if (cellValue.equals("keep-row") || cellValue.equals(token)) {
                copyRow(destWorkbook, inputSheet, destSheet, inputRow, destRowNum);
                destRowNum++;
            }

        }
    }

    private void closeResources(FileOutputStream fileOut, InputStream input) throws IOException {

        if (fileOut != null)
            fileOut.close();

        if (input != null)
            input.close();

    }

    private void setActiveCell(Sheet destSheet) {

        Row activeRow = destSheet.getRow(0);
        if (activeRow != null) {
            Cell activeCell = activeRow.getCell(0);
            if (activeCell != null)
                activeCell.setAsActiveCell();
        }

    }

    private int getBurstColumnIndex(int columnIndex, Row inputRow) {
        int burstColumnIndex;
        int lastCellIndex = 0;

        if (inputRow != null)
            lastCellIndex = inputRow.getLastCellNum() - 1;

        if (columnIndex > lastCellIndex)
            burstColumnIndex = lastCellIndex;
        else
            burstColumnIndex = columnIndex;
        return burstColumnIndex;
    }

    //@Profiled
    public void doExtractSheet() throws Exception {

        log.debug("doExtractSheet()");

        InputStream input = null;
        FileOutputStream fileOut = null;

        try {

            input = new FileInputStream(new File(inputFilePath));
            Workbook Workbook = WorkbookFactory.create(input);

            int sheetIndex = 0;
            for (int sheetCount = Workbook.getNumberOfSheets(); sheetIndex < sheetCount && sheetCount > 1;) {
                String currentSheetName = Workbook.getSheetName(sheetIndex);
                if (!token.equals(currentSheetName)) {
                    Workbook.removeSheetAt(sheetIndex);
                    sheetIndex = 0;
                    sheetCount = Workbook.getNumberOfSheets();
                } else
                    sheetIndex++;
            }

            Workbook.setActiveSheet(0);
            fileOut = new FileOutputStream(outputFilePath);
            Workbook.write(fileOut);
            fileOut.flush();

        } finally {

            closeResources(fileOut, input);
        }

    }

    public void setTempWorkbookPath(String tempWorkbookPath) {
        this.tempWorkbookPath = tempWorkbookPath;
    }

    private void copyRow(Workbook destWorkbook, Sheet sourceWorkSheet, Sheet destWorkSheet, Row sourceRow,
            int destinationRowNum) {

        cacheStyles(destWorkbook);

        Row newRow = destWorkSheet.createRow(destinationRowNum);

        for (int i = 0; i < sourceRow.getLastCellNum(); i++) {

            Cell oldCell = sourceRow.getCell(i);

            if (oldCell != null) {

                Cell newCell = newRow.createCell(i);

                copyCellStyle(destWorkbook, oldCell, newCell);

                copyCellCommentAndLink(oldCell, newCell);

                copyCellContent(oldCell, newCell);

            }

        }

        copyMergedRegions(sourceWorkSheet, destWorkSheet, sourceRow, newRow);

    }

    private void copyMergedRegions(Sheet sourceWorkSheet, Sheet destWorkSheet, Row sourceRow, Row newRow) {

        for (int i = 0; i < sourceWorkSheet.getNumMergedRegions(); i++) {

            log.debug("New merged region found in the sourceWorkSheet - i = " + i);

            CellRangeAddress cellRangeAddress = sourceWorkSheet.getMergedRegion(i);

            if (cellRangeAddress.getFirstRow() == sourceRow.getRowNum()) {
                log.debug("New merged region matched for sourceRow.getRowNum() = " + sourceRow.getRowNum());
                CellRangeAddress newCellRangeAddress =
                        new CellRangeAddress(newRow.getRowNum(), newRow.getRowNum()
                                + (cellRangeAddress.getFirstRow() - cellRangeAddress.getLastRow()),
                                cellRangeAddress.getFirstColumn(), cellRangeAddress.getLastColumn());
                destWorkSheet.addMergedRegion(newCellRangeAddress);
            }
        }

    }

    private void copyCellCommentAndLink(Cell oldCell, Cell newCell) {
        if (newCell.getCellComment() != null)
            newCell.setCellComment(oldCell.getCellComment());

        if (oldCell.getHyperlink() != null)
            newCell.setHyperlink(oldCell.getHyperlink());
    }

    private void copyCellStyle(Workbook destWorkbook, Cell oldCell, Cell newCell) {
        CellStyle sourceCellStyle = oldCell.getCellStyle();
        if (destStyles.contains(sourceCellStyle)) {
            newCell.setCellStyle((CellStyle) destStyles.get(destStyles.indexOf(sourceCellStyle)));
        } else {
            CellStyle newCellStyle = destWorkbook.createCellStyle();
            newCellStyle.cloneStyleFrom(oldCell.getCellStyle());
            newCell.setCellStyle(newCellStyle);
            destStyles.add(newCellStyle);
        }
    }

    private void copyCellContent(Cell oldCell, Cell newCell) {
        CellType cellType = oldCell.getCellType();

        switch (cellType) {
        case BOOLEAN:
            newCell.setCellValue(oldCell.getBooleanCellValue());
            break;
        case ERROR:
            newCell.setCellErrorValue(oldCell.getErrorCellValue());
            break;
        case NUMERIC:
            newCell.setCellValue(oldCell.getNumericCellValue());
            break;
        case STRING:
            newCell.setCellValue(oldCell.getRichStringCellValue());
            break;
        default:
            newCell.setCellValue(oldCell.getStringCellValue());
            break;
        }
    }

    private void cacheStyles(Workbook destWorkbook) {
        if (destStyles.size() == 0) {
            int numberOfStyles = destWorkbook.getNumCellStyles();
            for (short i = 0; i < numberOfStyles; i++) {
                destStyles.add(destWorkbook.getCellStyleAt(i));
            }

        }
    }

}
