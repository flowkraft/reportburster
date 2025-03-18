package com.sourcekraft.documentburster.engine.excel;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.NumberToTextConverter;

public class ExcelUtils {

	/**
	 * Gets cell value as string, handling all cell types properly
	 */
	public static String getCellValueAsString(Cell cell) {
		if (cell == null) {
			return "";
		}

		String cellValue;
		CellType cellType = cell.getCellType();

		switch (cellType) {
		case STRING:
			cellValue = cell.getRichStringCellValue().getString();
			break;

		case NUMERIC:
			if (DateUtil.isCellDateFormatted(cell)) {
				cellValue = cell.getDateCellValue().toString();
			} else {
				// Use NumberToTextConverter to avoid scientific notation
				cellValue = NumberToTextConverter.toText(cell.getNumericCellValue());
			}
			break;

		case BOOLEAN:
			cellValue = Boolean.toString(cell.getBooleanCellValue());
			break;

		case FORMULA:
			// Handle formula cells based on their evaluated type
			CellType formulaResultType = cell.getCachedFormulaResultType();
			switch (formulaResultType) {
			case STRING:
				cellValue = cell.getStringCellValue();
				break;
			case NUMERIC:
				if (DateUtil.isCellDateFormatted(cell)) {
					cellValue = cell.getDateCellValue().toString();
				} else {
					cellValue = NumberToTextConverter.toText(cell.getNumericCellValue());
				}
				break;
			case BOOLEAN:
				cellValue = Boolean.toString(cell.getBooleanCellValue());
				break;
			default:
				cellValue = "";
			}
			break;

		case BLANK:
			cellValue = "";
			break;

		case ERROR:
			cellValue = "ERROR: " + cell.getErrorCellValue();
			break;

		default:
			cellValue = "";
		}

		return cellValue;
	}

	/**
	 * Gets numeric cell value as string, handling formatting
	 */
	public static String getNumericCellValueAsString(Cell cell) {
		double value = cell.getNumericCellValue();
		CellStyle cellStyle = cell.getCellStyle();
		short formatIndex = cellStyle.getDataFormat();

		// Use DataFormatter for proper numeric formatting
		DataFormatter formatter = new DataFormatter();
		return formatter.formatRawCellContents(value, formatIndex, cellStyle.getDataFormatString());
	}

	/**
	 * Extracts all text content from a worksheet as a single string
	 */
	public static String getSheetText(Sheet sheet) {
		StringBuilder text = new StringBuilder();

		for (Row row : sheet) {
			for (Cell cell : row) {
				String cellValue = getCellValueAsString(cell);
				if (!cellValue.isEmpty()) {
					text.append(cellValue).append(" ");
				}
			}
			text.append("\n");
		}

		return text.toString();
	}

	/**
	 * Extracts all text content from an Excel file
	 */
	public static String getExcelText(File excelFile) throws IOException {
		StringBuilder text = new StringBuilder();

		try (FileInputStream fis = new FileInputStream(excelFile); Workbook workbook = WorkbookFactory.create(fis)) {

			for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
				Sheet sheet = workbook.getSheetAt(i);
				text.append(getSheetText(sheet));
			}
		}

		return text.toString();
	}
}