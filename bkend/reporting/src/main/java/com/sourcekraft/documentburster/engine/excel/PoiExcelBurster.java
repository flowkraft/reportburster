package com.sourcekraft.documentburster.engine.excel;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.excel.extractor.PoiExcelExtractor;

public class PoiExcelBurster extends AbstractBurster {

	private Logger log = LoggerFactory.getLogger(PoiExcelBurster.class);

	private String tempWorkBookPath;

	private ExcelBurstMetaData burstMetaData = new ExcelBurstMetaData();

	public PoiExcelBurster(String configFilePath) {
		super(configFilePath);
	}

	protected void initializeResources() throws Exception {
		ctx.burstTokens = new ArrayList<String>();
		tempWorkBookPath = getTempWorkBookPath();
	}

	protected void closeResources() throws Exception {

		if (!burstMetaData.getBurstMethod().equals("distinct-sheets")) {
			File tempWorkBook = new File(tempWorkBookPath);
			if (tempWorkBook.exists())
				try {
					FileUtils.forceDelete(tempWorkBook);
				} catch (Exception e) {
					FileUtils.forceDeleteOnExit(tempWorkBook);
				}
		}

	}

	private String getBurstMethod(Workbook workBook) {

		String method = "distinct-sheets";

		Sheet burstMetaDataSheet = workBook.getSheet("burst");

		Row secondRow = null;

		if (burstMetaDataSheet != null) {

			secondRow = burstMetaDataSheet.getRow(1);

			Cell burstMethodCell = null;

			if (secondRow != null)
				burstMethodCell = secondRow.getCell(0);

			if (burstMethodCell != null)
				method = burstMethodCell.getStringCellValue();

		}

		return method;

	}

	protected void parseBurstingMetaData() throws Exception {

		InputStream input = new FileInputStream(new File(filePath));
		Workbook workBook = WorkbookFactory.create(input);

		String burstMethod = getBurstMethod(workBook);
		validateBurstMethod(burstMethod);
		burstMetaData.setBurstMethod(burstMethod);

		Sheet burstMetaDataSheet = workBook.getSheet("burst");

		if (burstMetaDataSheet == null)
			ctx.burstTokens = getBurstTokensFromDistinctSheets(workBook);
		else
			ctx.burstTokens = getBurstTokensAndParseBurstMetaData(workBook, burstMetaDataSheet);

		if (ctx.burstTokens.size() == 0)
			log.warn(
					"The list of burst tokens found in the 'burst' sheet metadata is empty. Is that what you want? Please consider to provide a valid list of burst tokens in the 'burstTokens' column of the 'burst' metadata sheet!");

		log.debug("Excel burstMetaData : " + burstMetaData);

	}

	private List<String> getBurstTokensAndParseBurstMetaData(Workbook workBook, Sheet burstMetaDataSheet)
			throws Exception {

		List<String> tokens = new ArrayList<String>();

		Row metaDataRow = burstMetaDataSheet.getRow(1);

		if (!burstMetaData.getBurstMethod().equals("distinct-sheets"))
			parseBurstSheetAndColumnIndex(workBook, metaDataRow);

		_checkForCustomConfigFile(metaDataRow);

		for (Row row : burstMetaDataSheet) {

			Cell burstTokensCell = row.getCell(3);

			if (burstTokensCell != null) {

				String token = ExcelUtils.getCellValueAsString(burstTokensCell);

				if (StringUtils.isNotEmpty(token) && !token.endsWith("burstTokens")) {
					if (!tokens.contains(token)) {
						token = token.trim();
						tokens.add(token);
						parseUserVariablesForCurrentToken(row, token);
					}
				}
			}

		}

		return tokens;
	}

	private void _checkForCustomConfigFile(Row metaDataRow) throws Exception {

		String customConfigFilePath = null;
		Cell configFileCell = metaDataRow.getCell(5);

		if (configFileCell != null)
			customConfigFilePath = configFileCell.getStringCellValue();

		if (StringUtils.isNotEmpty(customConfigFilePath)) {
			ctx.configurationFilePath = customConfigFilePath;
			ctx.settings.setConfigurationFilePath(customConfigFilePath);
			executeController();
		}

	}

	private void parseBurstSheetAndColumnIndex(Workbook workBook, Row metaDataRow) throws Exception {

		Cell burstSheetIndexCell = metaDataRow.getCell(1);
		Cell burstColumnIndexCell = metaDataRow.getCell(2);

		int sheetIndex = 0;

		if (burstSheetIndexCell == null)
			throw new Exception(
					"The mandatory numeric 'burstSheetIndex' is missing in the  'burst' sheet metadata. Please provide a valid numeric(0 based) 'burstSheetIndex'. -1 is a allowed conventional value which meens to burst using the first sheet.");
		else
			sheetIndex = Integer.valueOf(ExcelUtils.getNumericCellValueAsString(burstSheetIndexCell)).intValue();

		if (sheetIndex > 0)
			burstMetaData.setBurstSheetIndex(sheetIndex);
		else
			burstMetaData.setBurstSheetIndex(0);

		int columnIndex = -1;

		if (burstColumnIndexCell == null)
			throw new Exception(
					"The mandatory numeric 'burstColumnIndex' is missing in the  'burst' sheet metadata. Please provide a valid numeric(0 based) 'burstColumnIndex'. -1 is a allowed conventional value which meens to burst using the last column from the bursting sheet.");
		else
			columnIndex = Integer.valueOf(ExcelUtils.getNumericCellValueAsString(burstColumnIndexCell)).intValue();

		if (columnIndex >= 0)
			burstMetaData.setBurstColumnIndex(columnIndex);
		else {
			Sheet burstSheet = workBook.getSheetAt(burstMetaData.getBurstSheetIndex());
			burstMetaData.setBurstColumnIndex(burstSheet.getRow(0).getLastCellNum() - 1);
		}

	}

	private void parseUserVariablesForCurrentToken(Row row, String token) {

		Cell variablesCell = row.getCell(4);
		String variablesText = null;

		if (variablesCell != null)
			variablesText = variablesCell.getStringCellValue();

		if (StringUtils.isNotEmpty(variablesText) && !variablesText.equals("userVariables")
				&& StringUtils.isNotEmpty(token) && !token.endsWith("burstTokens"))
			ctx.variables.parseUserVariables(token, variablesText);

	}

	private List<String> getBurstTokensFromDistinctSheets(Workbook workBook) {

		List<String> tokens = new ArrayList<String>();

		int numberOfSheets = workBook.getNumberOfSheets();
		for (int i = 0; i < numberOfSheets; i++) {
			tokens.add(workBook.getSheetName(i));
		}

		return tokens;

	}

	private void validateBurstMethod(String burstMethod) throws Exception {

		if (StringUtils.isEmpty(burstMethod))
			throw new Exception(
					"The mandatory 'burstMethod' is missing in the  'burst' sheet metadata. Please provide a valid 'burstMethod' such as 'distinct-sheets' or 'distinct-column-values'!");

		if (!burstMethod.equals("distinct-sheets") && !burstMethod.equals("distinct-column-values")
				&& !burstMethod.equals("distinct-column-values-copy"))
			throw new Exception(
					"The 'burstMethod' is misspelled in the 'burst' sheet metadata. Please provide a valid 'burstMethod' such as 'distinct-sheets' or 'distinct-column-values'!");
	}

	protected void extractOutputBurstDocument() throws Exception {

		log.debug("ctx = " + ctx + " , burstMetaData = " + burstMetaData);

		PoiExcelExtractor extractor = new PoiExcelExtractor(ctx.inputDocumentFilePath, ctx.extractedFilePath,
				ctx.token);

		if (burstMetaData.getBurstMethod().equals("distinct-sheets"))
			extractor.doExtractSheet();
		else {

			int burstSheetIndex = burstMetaData.getBurstSheetIndex();
			int burstColumnIndex = burstMetaData.getBurstColumnIndex();

			if (!(new File(tempWorkBookPath)).exists()) {
				evaluateAllInputFormula();
				createEmptyWorkbookTemplate(burstSheetIndex);
			}

			log.debug("tempWorkBookPath = " + tempWorkBookPath);

			extractor.setTempWorkbookPath(tempWorkBookPath);
			extractor.doExtractForDistinctColumnValueCopy(burstSheetIndex, burstColumnIndex);

		}
	}

	private void evaluateAllInputFormula() throws Exception {

		log.debug("evaluateAllInputFormula()");

		InputStream input = null;
		FileOutputStream fileOut = null;

		try {

			input = new FileInputStream(new File(filePath));

			Workbook workBook = WorkbookFactory.create(input);

			FormulaEvaluator evaluator = workBook.getCreationHelper().createFormulaEvaluator();

			for (int sheetNum = 0; sheetNum < workBook.getNumberOfSheets(); sheetNum++) {
				Sheet sheet = workBook.getSheetAt(sheetNum);
				for (Row row : sheet) {
					for (Cell cell : row) {
						if (cell.getCellType() == CellType.FORMULA) {
							evaluator.evaluateFormulaCell(cell);
						}
					}
				}
			}

			fileOut = new FileOutputStream(filePath);
			workBook.write(fileOut);
			fileOut.flush();

		} finally {
			closeResources(input, fileOut);
		}

	}

	private void closeResources(InputStream input, FileOutputStream fileOut) throws IOException {
		if (fileOut != null)
			fileOut.close();

		if (input != null)
			input.close();
	}

	private void createEmptyWorkbookTemplate(int burstSheetIndex) throws Exception {

		log.debug("burstSheetIndex = " + burstSheetIndex);

		InputStream input = null;
		FileOutputStream fileOut = null;

		try {
			input = new FileInputStream(new File(filePath));

			Workbook workBook = WorkbookFactory.create(input);
			cleanSheet(workBook.getSheetAt(burstSheetIndex));
			int numberOfSheets = workBook.getNumberOfSheets();
			workBook.removeSheetAt(numberOfSheets - 1);

			fileOut = new FileOutputStream(tempWorkBookPath);
			workBook.write(fileOut);
			fileOut.flush();

		} finally {
			closeResources(input, fileOut);
		}

	}

	protected String getTempWorkBookPath() {

		String baseName = FilenameUtils.getBaseName(filePath);
		String extension = FilenameUtils.getExtension(filePath);

		Random generator = new Random(Long.MAX_VALUE);

		return "./temp/" + baseName + "_" + generator.nextInt() + "." + extension;

	}

	private void cleanSheet(Sheet sheet) {

		int numberOfRows = sheet.getPhysicalNumberOfRows();

		while (numberOfRows > 0) {
			sheet.removeRow(sheet.getRow(numberOfRows - 1));
			numberOfRows = sheet.getPhysicalNumberOfRows();
		}

	}

}
