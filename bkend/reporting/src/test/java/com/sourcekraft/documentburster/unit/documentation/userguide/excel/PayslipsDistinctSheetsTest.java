package com.sourcekraft.documentburster.unit.documentation.userguide.excel;

import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;

public class PayslipsDistinctSheetsTest {

	private static final String PAYSLIPS_REPORT_PATH2003 = "src/main/external-resources/template/samples/burst/Payslips-Distinct-Sheets.xls";

	private static final String PAYSLIPS_REPORT_PATH2007 = "src/test/resources/input/unit/excel/Payslips-Distinct-Sheets-2007.xlsx";
	private static final String PAYSLIPS_REPORT_PATH2010 = "src/test/resources/input/unit/excel/Payslips-Distinct-Sheets-2010.xlsx";

	private static final List<String> tokens = Arrays.asList("awaldback@northridgehealth.org",
			"cgrew@northridgehealth.org", "kbutford@northridgehealth.org");

	@Test
	public final void burst2003() throws Exception {

		_doBurstAndAssertResults(PAYSLIPS_REPORT_PATH2003, "PayslipsDistinctSheetsTest-burst2003");

	}

	@Test
	public void burst2007() throws Exception {

		_doBurstAndAssertResults(PAYSLIPS_REPORT_PATH2007, "PayslipsDistinctSheetsTest-burst2007");

	}

	@Test
	public void burst2010() throws Exception {

		_doBurstAndAssertResults(PAYSLIPS_REPORT_PATH2010, "PayslipsDistinctSheetsTest-burst2010");

	}

	private void _doBurstAndAssertResults(String filePath, final String testName) throws Exception {

		AbstractBurster burster = new TestBursterFactory.PoiExcelBurster(StringUtils.EMPTY, testName);

		burster.burst(filePath, false, StringUtils.EMPTY, -1);

		String extension = FilenameUtils.getExtension(filePath);

		// assert output reports
		for (String token : tokens) {

			String path = burster.getCtx().outputFolder + "/" + token + "." + extension;

			// assert the output file exists
			File outputReport = new File(path);
			assertTrue(outputReport.exists());

			// assert it has a single sheet and it is the correct sheet
			InputStream input = new FileInputStream(new File(path));
			Workbook workBook = WorkbookFactory.create(input);
			assertEquals(1, workBook.getNumberOfSheets());

			assertNotNull(workBook.getSheet(token));

			input.close();

		}

		TestsUtils.assertBackupStatsAndLogArchivesFiles(burster);

	}
}