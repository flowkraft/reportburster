package com.sourcekraft.documentburster.engine.excel;

import org.apache.poi.ss.usermodel.BuiltinFormats;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;

public class ExcelUtils {

    public static String getCellValueAsString(Cell cell) {

        String cellValue;
         
        CellType cellType = cell.getCellType();
        
        switch (cellType) {
        case BLANK:
            cellValue = cell.getStringCellValue();
            break;
        case NUMERIC:
            cellValue = getNumericCellValueAsString(cell);
            break;
        case STRING:
            cellValue = cell.getRichStringCellValue().getString();
            break;
        default:
            cellValue = cell.getStringCellValue();
            break;
        }
        return cellValue;

    }

    public static String getNumericCellValueAsString(Cell cell) {

        double value = cell.getNumericCellValue();
        CellStyle cellStyle = cell.getCellStyle();

        short formatIndex = cellStyle.getDataFormat();
        String formatString = cellStyle.getDataFormatString();
        if (formatString == null)
            formatString = BuiltinFormats.getBuiltinFormat(formatIndex);

        String cellValue;

        if (formatString != null)
            cellValue = (new DataFormatter()).formatRawCellContents(value, formatIndex, formatString);
        else
            cellValue = Double.toString(value);

        return cellValue;

    }

}
