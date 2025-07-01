package com.sourcekraft.documentburster.engine.reporting;

import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.engine.excel.ExcelUtils;
import com.sourcekraft.documentburster.utils.CsvUtils;

public class ExcelReporter extends AbstractReporter {

	private static Logger log = LoggerFactory.getLogger(ExcelReporter.class);

	public ExcelReporter(String configFilePath) {
		super(configFilePath);
	}
	@Override
    protected void fetchData() throws Exception {
        log.trace("Entering fetchData..."); // Added logging

        // --- Read Excel Options ---
        String idColumn = ctx.settings.getReportDataSource().exceloptions.idcolumn;
        String headerSetting = ctx.settings.getReportDataSource().exceloptions.header;
        int userSkipLines = ctx.settings.getReportDataSource().exceloptions.skiplines;
        boolean ignoreLeadingWhitespace = ctx.settings.getReportDataSource().exceloptions.ignoreleadingwhitespace;
        boolean useFormulaResults = ctx.settings.getReportDataSource().exceloptions.useformularesults;
        int sheetIndex = ctx.settings.getReportDataSource().exceloptions.sheetindex;

        // --- Validate idColumn --- (Kept from original)
        if (StringUtils.isEmpty(idColumn)) {
            throw new IllegalArgumentException(
                    "idcolumn setting must be configured - use 'notused' for sequential numbering");
        }
        if (!idColumn.equalsIgnoreCase(CsvUtils.NOT_USED) && !idColumn.equalsIgnoreCase(CsvUtils.COLUMN_FIRST)
                && !idColumn.equalsIgnoreCase(CsvUtils.COLUMN_LAST) && !StringUtils.isNumeric(idColumn)) {
            // Allow header names later? For now, stick to original validation.
            // Consider adding check if header name exists if hasHeader is true.
            log.warn("idcolumn validation passed for: {}", idColumn);
            throw new IllegalArgumentException(
             		"idcolumn must be 'first', 'last', 'notused' or a numeric column index (e.g., 0, 1, ...)");
        }

        // Ensure skipLines is non-negative
        if (userSkipLines < 0) {
            log.warn("Invalid negative skipLines ({}) provided. Defaulting to 0.", userSkipLines);
            userSkipLines = 0;
        }

        // Determine if a header row is expected based on settings
        // Correctly interpret 'firstline' and 'multiline' as having a header on the first line.
        boolean hasHeader = CsvUtils.HEADER_FIRSTLINE.equalsIgnoreCase(headerSetting) ||
                            CsvUtils.HEADER_MULTILINE.equalsIgnoreCase(headerSetting);

        log.debug(
                "Excel Options: headerSetting={}, userSkipLines={}, hasHeader={}, ignoreLeadingWhitespace={}, useFormulaResults={}, sheetIndex={}",
                headerSetting, userSkipLines, hasHeader, ignoreLeadingWhitespace, useFormulaResults, sheetIndex);

        // Initialize results
        ctx.reportData = new ArrayList<>();
        ctx.reportColumnNames = new ArrayList<>(); // Initialize reportColumnNames list
        String[] headers = null;
        int maxColsBasedOnHeader = 0; // Track header width if read

        try (FileInputStream excelFile = new FileInputStream(filePath);
                Workbook workbook = WorkbookFactory.create(excelFile)) {

            // Get sheet based on settings
            Sheet sheet;
            try {
                sheet = workbook.getSheetAt(sheetIndex);
                if (sheet == null) {
                    throw new IllegalArgumentException(
                            "Sheet index " + sheetIndex + " does not exist in the workbook.");
                }
            } catch (IllegalArgumentException e) { // Catch index out of bounds
                throw new IllegalArgumentException(
                        "Invalid sheet index: " + sheetIndex + ". Workbook has " + workbook.getNumberOfSheets() + " sheets.", e);
            }
            log.debug("Selected sheet '{}' at index {}.", sheet.getSheetName(), sheetIndex);


            // --- Read Header Row (if applicable) ---
            // The header is always the *first* row (index 0) if hasHeader is true.
            if (hasHeader) {
                log.debug("Attempting to read header from the first row (index 0).");
                Row headerRow = sheet.getRow(0); // Get the first row directly
                if (headerRow == null) {
                    log.warn(
                            "Header row (index 0) is null or physically missing, but header setting was '{}'. Will attempt to generate generic headers from data.", headerSetting);
                } else {
                    // Determine the number of cells in the header row
                    maxColsBasedOnHeader = headerRow.getLastCellNum();
                    if (maxColsBasedOnHeader < 0) maxColsBasedOnHeader = 0; // Handle empty header row

                    if (maxColsBasedOnHeader == 0) {
                        log.warn("Header row (index 0) has no cells. Will attempt to generate generic headers from data.");
                    } else {
                        headers = new String[maxColsBasedOnHeader];
                        log.trace("Header row has {} potential columns.", maxColsBasedOnHeader);
                        for (int i = 0; i < maxColsBasedOnHeader; i++) {
                            Cell cell = headerRow.getCell(i, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                            // Always get header as string, don't evaluate formulas here
                            headers[i] = ExcelUtils.getCellValueAsString(cell); // Use utility for consistency
                            if (ignoreLeadingWhitespace && headers[i] != null) {
                                headers[i] = headers[i].trim();
                            }
                            // Generate default name if header cell is blank (Original used ColumnX+1, using colX for consistency)
                            if (StringUtils.isBlank(headers[i])) {
                                headers[i] = "col" + i;
                                log.trace("Header cell at index {} was blank, assigned default name '{}'.", i, headers[i]);
                            }
                        }
                        log.debug("Successfully read header from first row ({} columns): {}", headers.length,
                                Arrays.toString(headers));
                    }
                }
            } else {
                log.debug("Header setting is 'noheader'. No header row will be read.");
            }


            // --- Calculate Data Start Row Index ---
            // If hasHeader, we must skip at least 1 row (the header itself).
            // The effective skip count is the *maximum* of userSkipLines and 1 (if header exists).
            // If no header, the effective skip count is just userSkipLines.
            int dataStartRowIndex = hasHeader ? Math.max(userSkipLines, 1) : userSkipLines;
            log.debug("Calculated data start row index (0-based): {}. (Based on hasHeader={}, userSkipLines={})",
                    dataStartRowIndex, hasHeader, userSkipLines);


            // --- Process Data Rows ---
            Iterator<Row> rowIterator = sheet.iterator();
            int currentRowIndex = 0; // Physical row index (0-based)

            // Skip rows before the data start index
            while (currentRowIndex < dataStartRowIndex && rowIterator.hasNext()) {
                rowIterator.next(); // Consume the row
                currentRowIndex++;
            }

            if (currentRowIndex < dataStartRowIndex) {
                log.warn("Reached end of sheet while skipping initial rows. Expected to start data at index {}, but sheet only has {} rows.", dataStartRowIndex, currentRowIndex);
            } else {
                log.debug("Starting data processing from physical row index {}.", currentRowIndex);
            }

            int dataRowCounter = 0; // Counter for data rows processed
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                log.trace("Processing physical row index: {}", currentRowIndex);

                // Determine the number of columns for this specific row
                int lastColumnForRow = row.getLastCellNum();
                if (lastColumnForRow < 0) lastColumnForRow = 0;

                // --- Generate Generic Headers (if needed) ---
                // This happens only on the *first* data row encountered if headers are still null.
                if (headers == null && dataRowCounter == 0) {
                    if (lastColumnForRow == 0) {
                        log.warn("First data row encountered (index {}) has no cells. Cannot generate headers.", currentRowIndex);
                        // Decide whether to continue or stop if headers are essential
                        currentRowIndex++; // Move to next potential row index
                        continue; // Skip this empty row
                    }
                    headers = new String[lastColumnForRow];
                    for (int i = 0; i < lastColumnForRow; i++) {
                        // Use original ColumnX+1 naming convention if preferred
                        headers[i] = "Column" + (i + 1);
                    }
                    maxColsBasedOnHeader = lastColumnForRow; // Update maxCols based on generated headers
                    log.debug("Generated generic headers based on first data row read ({} columns): {}", headers.length, Arrays.toString(headers));
                } else if (headers == null) {
                    // Should not happen if headers were generated or read previously, but safeguard
                    log.error("Headers are unexpectedly null while processing data row index {}. Stopping data read.", currentRowIndex);
                    break;
                }

                // Use the header width if defined, otherwise the row's width for processing this row
                int colsToProcess = (maxColsBasedOnHeader > 0) ? maxColsBasedOnHeader : lastColumnForRow;

                // --- Process Cells in the Current Data Row ---
                LinkedHashMap<String, Object> rowMap = new LinkedHashMap<>();
                boolean hasContent = false; // Track if the row has any non-blank content

                for (int i = 0; i < colsToProcess; i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    Object cellValue = null;
                    // Use header if available and index is within bounds, otherwise generate column name
                    String columnName = (headers != null && i < headers.length) ? headers[i] : "Column" + (i + 1);

                    // Get typed value based on cell type (kept original logic)
                    try { // Added try-catch around cell reading
                        switch (cell.getCellType()) {
                        case NUMERIC:
                            if (DateUtil.isCellDateFormatted(cell)) {
                                cellValue = cell.getDateCellValue();
                            } else {
                                cellValue = cell.getNumericCellValue();
                            }
                            break;
                        case BOOLEAN:
                            cellValue = cell.getBooleanCellValue();
                            break;
                        case FORMULA:
                            if (useFormulaResults) {
                                // Evaluate formula - try numeric first, then string, then fallback to formula string
                                try {
                                    cellValue = cell.getNumericCellValue();
                                } catch (IllegalStateException | NumberFormatException eNum) {
                                    try {
                                        cellValue = cell.getStringCellValue();
                                        if (ignoreLeadingWhitespace && cellValue != null) {
                                            cellValue = ((String) cellValue).trim();
                                        }
                                    } catch (IllegalStateException eStr) {
                                        log.trace("Could not evaluate formula at [{},{}] as numeric or string, using formula string.", row.getRowNum(), i, eStr);
                                        cellValue = cell.getCellFormula(); // Fallback to formula string
                                    }
                                }
                            } else {
                                cellValue = cell.getCellFormula(); // Use the formula string itself
                            }
                            break;
                        case BLANK: // Explicitly handle BLANK as null
                            cellValue = null;
                            break;
                        case STRING: // Handle STRING separately for trimming
                            cellValue = cell.getStringCellValue();
                            if (ignoreLeadingWhitespace && cellValue != null) {
                                cellValue = ((String) cellValue).trim();
                            }
                            break;
                        default: // Fallback for other types (Error, _NONE) - treat as blank/null
                            log.trace("Unhandled cell type {} at [{},{}]. Treating as null.", cell.getCellType(), row.getRowNum(), i);
                            cellValue = null;
                            break;
                        }
                    } catch (Exception e) {
                        log.warn("Error reading cell at [{},{}] (Header: '{}'). Using null. Error: {}", row.getRowNum(), i, columnName, e.getMessage());
                        cellValue = null; // Fallback to null on error
                    }

                    // Handle potential duplicate header names when putting into map
                    String uniqueHeaderName = columnName;
                    int duplicateCount = 2;
                    while (rowMap.containsKey(uniqueHeaderName)) {
                        uniqueHeaderName = columnName + "_" + duplicateCount++;
                    }
                    if (!uniqueHeaderName.equals(columnName)) {
                        log.trace("Duplicate header '{}' encountered for this row, using '{}' in map.", columnName, uniqueHeaderName);
                    }
                    rowMap.put(uniqueHeaderName, cellValue);


                    // Check if this cell has content (null or blank strings are considered no content)
                    // Kept original check: !((cellValue instanceof String) && ((String) cellValue).trim().isEmpty())
                    if (cellValue != null
                            && !((cellValue instanceof String) && ((String) cellValue).trim().isEmpty())) {
                        hasContent = true;
                    }
                } // End cell processing loop

                // Only add rows that have at least one non-empty cell (kept original logic)
                if (hasContent) {
                    ctx.reportData.add(rowMap);
                    log.trace("Added data row map (physical index {}): {}", currentRowIndex, rowMap);
                    dataRowCounter++;
                } else {
                    log.trace("Skipped row at physical index {} because it contained no content.", currentRowIndex);
                }
                currentRowIndex++;
            } // End row processing loop
            log.info("Finished reading Excel data. Total data rows processed: {}", dataRowCounter);

        } // End try-with-resources (Workbook)


        // --- Store Final Column Names ---
        if (headers != null) {
            // Handle potential duplicates in the final header list for ctx.reportColumnNames
            // This ensures ctx.reportColumnNames matches the keys used in the rowMaps if duplicates existed
            Map<String, Integer> headerCounts = new LinkedHashMap<>();
            for (String header : headers) {
                int count = headerCounts.getOrDefault(header, 0) + 1;
                headerCounts.put(header, count);
                // Only append suffix if it's actually a duplicate *within the header row itself*
                String uniqueHeader = (count > 1 && Arrays.stream(headers).filter(h -> h.equals(header)).count() > 1)
                        ? header + "_" + count
                        : header;
                ctx.reportColumnNames.add(uniqueHeader);
            }
            log.debug("Stored final column names (duplicates adjusted): {}", ctx.reportColumnNames);
        } else if (!ctx.reportData.isEmpty()) {
            log.warn("No headers were read or generated, but data rows exist. Column names context will be empty.");
        } else {
            log.debug("No headers found and no data rows processed.");
        }


        // Basic validation check (kept from original) - Consider if this is still needed/correct
        if (!ctx.reportData.isEmpty() && ctx.reportData.get(0).size() == 1) {
            log.warn("Validation check: Excel file appears to contain only 1 column with value: '{}'", ctx.reportData.get(0).values().iterator().next());
            // throw new IllegalArgumentException("Excel file appears to contain only 1 column with value: '"
            // 		+ ctx.reportData.get(0).values().iterator().next() + "'");
        }

        log.info("Excel data fetched successfully. Headers: {}. Data rows: {}", ctx.reportColumnNames.size(),
                ctx.reportData.size());
        log.trace("Exiting fetchData.");
    }

	
}