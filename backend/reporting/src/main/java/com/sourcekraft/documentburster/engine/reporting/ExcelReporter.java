package com.sourcekraft.documentburster.engine.reporting;

import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.engine.excel.ExcelUtils;
import com.sourcekraft.documentburster.utils.CsvUtils;
import com.sourcekraft.documentburster.variables.Variables;

public class ExcelReporter extends AbstractReporter {

	private static Logger log = LoggerFactory.getLogger(ExcelReporter.class);

	public ExcelReporter(String configFilePath) {
		super(configFilePath);
	}

	@Override
	protected void initializeResources() throws Exception {
		ctx.variables.setVarAliases(Arrays.asList("col"));
		ctx.variables.set(Variables.OUTPUT_TYPE_EXTENSION,
				FilenameUtils.getExtension(ctx.settings.getReportTemplate().outputtype));

		try (FileInputStream excelFile = new FileInputStream(filePath);
				Workbook workbook = WorkbookFactory.create(excelFile)) {

			// Get sheet based on settings or default to first sheet
			int sheetIndex = ctx.settings.getReportDataSource().exceloptions.sheetindex;
			Sheet sheet = workbook.getSheetAt(sheetIndex);

			// Parse settings
			boolean hasHeader = ctx.settings.getReportDataSource().exceloptions.header.equals("firstline");
			int skipLines = ctx.settings.getReportDataSource().exceloptions.skiplines;
			boolean ignoreLeadingWhitespace = ctx.settings.getReportDataSource().exceloptions.ignoreleadingwhitespace;
			boolean useFormulaResults = ctx.settings.getReportDataSource().exceloptions.useformularesults;

			// Parse Excel sheet
			this.parsedLines = convertSheetToStringArrays(sheet, hasHeader, skipLines, ignoreLeadingWhitespace,
					useFormulaResults);

			// Basic validation check
			if ((this.parsedLines.size() > 0) && (1 == this.parsedLines.get(0).length)) {
				throw new IllegalArgumentException(
						"Excel file appears to contain only 1 column with value: '" + this.parsedLines.get(0)[0] + "'");
			}

			log.debug("Parsed " + this.parsedLines.size() + " rows from Excel file");
		}
	}

	private List<String[]> convertSheetToStringArrays(Sheet sheet, boolean hasHeader, int skipLines,
			boolean ignoreLeadingWhitespace, boolean useFormulaResults) {
		List<String[]> result = new ArrayList<>();
		Iterator<Row> rowIterator = sheet.iterator();

		// Handle header and skip lines
		int skipCount = 0;
		// Don't add extra skip for header - only use skipLines value
		// This matches CsvReporter behavior
		skipCount = skipLines;

		// Skip rows if configured
		for (int i = 0; i < skipCount && rowIterator.hasNext(); i++) {
			rowIterator.next();
		}

		// Process data rows
		while (rowIterator.hasNext()) {
			Row row = rowIterator.next();
			int lastColumn = (int) row.getLastCellNum();
			if (lastColumn < 0) {
				lastColumn = 0;
			}

			String[] rowData = new String[lastColumn];
			boolean hasContent = false; // Flag to track if row has any non-empty content

			for (int i = 0; i < lastColumn; i++) {
				Cell cell = row.getCell(i, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
				String cellValue = getCellValueAsString(cell, useFormulaResults);

				if (ignoreLeadingWhitespace && cellValue != null) {
					cellValue = cellValue.trim();
				}

				rowData[i] = cellValue;

				// Check if this cell has content
				if (cellValue != null && !cellValue.trim().isEmpty()) {
					hasContent = true;
				}
			}

			// Only add rows that have at least one non-empty cell
			if (hasContent) {
				result.add(rowData);
			}
		}

		return result;
	}

	private String getCellValueAsString(Cell cell, boolean useFormulaResults) {
		if (cell == null) {
			return "";
		}

		// Handle formula cells specially based on settings
		if (cell.getCellType() == CellType.FORMULA && !useFormulaResults) {
			// Return the formula itself
			return cell.getCellFormula();
		}

		// Otherwise use the existing robust implementation
		return ExcelUtils.getCellValueAsString(cell);
	}

	@Override
	public List<String> parseBurstingMetaData() throws Exception {
		List<String> tokens = new ArrayList<>();
		int lineLength = 0;
		int lineIndex = 0;
		int codeColumnIndex = -1;

		String idColumn = ctx.settings.getReportDataSource().exceloptions.idcolumn;

		// Explicit NOT_USED means use sequential numbering
		// Empty/null would indicate misconfiguration
		if (StringUtils.isEmpty(idColumn))
			throw new IllegalArgumentException(
					"idcolumn setting must be configured - use 'notused' for sequential numbering");

		if (!idColumn.contains(CsvUtils.NOT_USED)) {
			if (idColumn.contains(CsvUtils.COLUMN_FIRST))
				codeColumnIndex = 0;
			else if (idColumn.contains(CsvUtils.COLUMN_LAST))
				codeColumnIndex = -1; // Will be set when we know line length
			else if (StringUtils.isNumeric(idColumn))
				codeColumnIndex = Integer.valueOf(idColumn);
			else
				throw new IllegalArgumentException("idcolumn must be 'first', 'last', 'notused' or a number");
		}

		for (String[] currentLine : this.parsedLines) {
			if (lineLength <= 0) {
				lineLength = currentLine.length;
				if (idColumn.contains(CsvUtils.COLUMN_LAST)) // Handle COLUMN_LAST case
					codeColumnIndex = lineLength - 1;
			}

			String token = codeColumnIndex >= 0 ? currentLine[codeColumnIndex] : String.valueOf(lineIndex);

			StringBuilder userVariablesStringBuilder = new StringBuilder();
			for (int currentColumnIndex = 0; currentColumnIndex < lineLength; currentColumnIndex++) {
				userVariablesStringBuilder.append("<").append(currentColumnIndex).append(">")
						.append(currentLine[currentColumnIndex]).append("</").append(currentColumnIndex).append(">");
			}

			ctx.variables.parseUserVariables(token, userVariablesStringBuilder.toString());
			tokens.add(token);
			lineIndex++;
		}

		return tokens;
	}

	/**
	 * Get the parsed Excel lines.
	 * 
	 * @return List of String arrays representing the parsed data rows
	 */
	public List<String[]> getParsedExcelLines() {
		return this.parsedLines;
	}
}