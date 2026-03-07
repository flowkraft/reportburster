import * as path from 'path';
import * as fs from 'fs';

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import * as PATHS from '../../utils/paths';
import _ from 'lodash';
import { ConnectionsTestHelper } from '../../helpers/areas/connections-test-helper';

/**
 * Copies a JasperReport sample from config/samples-jasper/ to config/reports-jasper/
 * so the backend scanner discovers it.
 */
function copyJasperSampleToReportsDir(sampleFolderName: string) {
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  const src = path.resolve(portableDir, 'config', 'samples-jasper', sampleFolderName);
  const dest = path.resolve(portableDir, 'config', 'reports-jasper', sampleFolderName);

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  for (const file of files) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

/**
 * Removes a JasperReport folder from config/reports-jasper/ (cleanup).
 */
function removeJasperReportDir(folderName: string) {
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  const dir = path.resolve(portableDir, 'config', 'reports-jasper', folderName);

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      fs.unlinkSync(path.join(dir, file));
    }
    fs.rmdirSync(dir);
  }
}

test.describe('JasperReports', async () => {

  FluentTester.setGlobalClickWaitMs(Constants.DELAY_ONE_SECOND);

  // ─── Test 1: Way 1 — Direct Execution (no DB, parameters passed from UI) ───
  electronBeforeAfterAllTest(
    'should execute JasperReport directly (employee_detail, no DB connection)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

      // Copy sample .jrxml to reports-jasper/ so scanner finds it
      copyJasperSampleToReportsDir('employee-detail');

      let ft = new FluentTester(firstPage);

      // Navigate to processing tab — the JasperReport should appear in the report picker
      ft = ft
        .gotoReportGenerationScreen()
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible(
          'span.ng-option-label:has-text("employee_detail")',
        )
        .click(
          'span.ng-option-label:has-text("employee_detail")',
        );

      // The parameter form should appear (EmployeeID, FirstName, LastName, etc.)
      ft = ft
        .waitOnElementToBecomeVisible('#formReportParameters')
        .waitOnElementToBecomeEnabled('#EmployeeID')
        .setValue('#EmployeeID', '1')
        .setValue('#FirstName', 'Nancy')
        .setValue('#LastName', 'Davolio')
        .setValue('#Title', 'Sales Representative')
        .setValue('#City', 'Seattle')
        .setValue('#Country', 'USA')
        .sleep(Constants.DELAY_ONE_SECOND);

      // Click Generate (clear logs first per standard pattern)
      ft = ft
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .click('#btnClearLogs')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogs')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedNFilesHavingSuffix(1, '.pdf')
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      // Cleanup
      removeJasperReportDir('employee-detail');

      return ft;
    },
  );

  // ─── Test 2: Way 1 — Direct Execution WITH parameter + DB connection ───
  electronBeforeAfterAllTest(
    '(sqlite) should execute JasperReport directly with country parameter and DB connection',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

      const dbVendor = 'sqlite';

      // Copy sample .jrxml to reports-jasper/
      copyJasperSampleToReportsDir('customer-by-country');

      let ft = new FluentTester(firstPage);

      // Create a DB connection (customer_by_country.jrxml has an internal SQL query)
      const dbConn = createDbConnection(ft, 'JasperCustByCountry', 'dbcon-plain-schema-only', dbVendor, false);
      ft = dbConn.ft;

      // Set this connection as the JasperReports connection
      ft = ConnectionsTestHelper.useForJasperReports(
        ft,
        `db-${_.kebabCase(dbConn.connectionName)}-${dbVendor}\\.xml`,
      );

      // Navigate to processing tab — select the JasperReport
      ft = ft
        .gotoReportGenerationScreen()
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible(
          'span.ng-option-label:has-text("customer_by_country")',
        )
        .click(
          'span.ng-option-label:has-text("customer_by_country")',
        );

      // The parameter form should show "country" parameter (parsed from .jrxml)
      ft = ft
        .waitOnElementToBecomeVisible('#formReportParameters')
        .waitOnElementToBecomeEnabled('#country')
        .setValue('#country', 'Germany')
        .sleep(Constants.DELAY_ONE_SECOND);

      // Click Generate
      ft = ft
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .click('#btnClearLogs')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogs')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedNFilesHavingSuffix(1, '.pdf')
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      // Delete DB connection
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        `db-${_.kebabCase(dbConn.connectionName)}-${dbVendor}\\.xml`,
        dbVendor,
      );

      // Cleanup
      removeJasperReportDir('customer-by-country');

      return ft;
    },
  );

  // ─── Test 3: Way 2 — Wrapper Report (loop: SQL returns 3 employees, output.jasper) ───
  electronBeforeAfterAllTest(
    '(sqlite) should generate 3 PDFs via wrapper report using JasperReport output type',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

      const dbVendor = 'sqlite';
      const TEST_NAME = 'JasperWrapper';

      // Copy employee_detail.jrxml to reports-jasper/
      copyJasperSampleToReportsDir('employee-detail');

      let ft = new FluentTester(firstPage);

      // Create DB connection
      const dbConn = createDbConnection(ft, TEST_NAME, 'dbcon-plain-schema-only', dbVendor, false);
      ft = dbConn.ft;

      // Set this connection as the JasperReports connection
      ft = ConnectionsTestHelper.useForJasperReports(
        ft,
        `db-${_.kebabCase(dbConn.connectionName)}-${dbVendor}\\\\.xml`,
      );

      // Create a new report configuration template (mail merge capability)
      ft = ConfTemplatesTestHelper.createNewTemplate(ft, TEST_NAME, 'enableMailMergeCapability');

      // Configure report: data source = SQL query
      ft = ft
        .gotoConfiguration()
        .click(`#topMenuConfigurationLoad_${_.kebabCase(TEST_NAME)}_${PATHS.SETTINGS_CONFIG_FILE}`)
        .waitOnElementToBecomeVisible('#leftMenuReportingSettings')
        .waitOnElementToBecomeEnabled('#leftMenuReportingSettings')
        .sleep(3 * Constants.DELAY_ONE_SECOND)
        .click('#leftMenuReportingSettings')
        .waitOnElementToBecomeVisible('#dsTypes')
        .waitOnElementToBecomeEnabled('#dsTypes')
        .dropDownSelectOptionHavingValue('#dsTypes', 'ds.sqlquery');

      // Set SQL query that returns all 3 employees
      const sqlQuery = `
SELECT
    "EmployeeID",
    "FirstName",
    "LastName",
    "Title",
    "City",
    "Country"
FROM "Employees"
ORDER BY "EmployeeID"
`;

      ft = ft
        .waitOnElementToBecomeVisible('#sqlQueryEditor')
        .setCodeJarContentSingleShot('#sqlQueryEditor', sqlQuery);

      // Verify data (3 employees)
      ft = ft
        .waitOnElementToContainText('#databaseConnection', '(default)')
        .waitOnElementToBecomeVisible('#btnTestSqlQuery')
        .click('#btnTestSqlQuery')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogs')
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnTestSqlQuery')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#reportingTabulatorTab-link')
        .waitOnTabulatorToBecomeVisible()
        .waitOnTabulatorToHaveRowCount(3)
        .tabulatorCellShouldHaveText(0, 'FirstName', 'Nancy')
        .tabulatorCellShouldHaveText(1, 'FirstName', 'Andrew')
        .tabulatorCellShouldHaveText(2, 'FirstName', 'Janet');

      // Configure output type: JasperReport (.jrxml)
      ft = ft
        .sleep(Constants.DELAY_ONE_SECOND)
        .click('#reportingTemplateOutputTab-link')
        .waitOnElementToBecomeVisible('#reportOutputType')
        .dropDownSelectOptionHavingValue('#reportOutputType', 'output.jasper');

      // Select the employee_detail JasperReport from the picker
      ft = ft
        .waitOnElementToBecomeVisible('#selectJasperReport')
        .click('#selectJasperReport')
        .waitOnElementToBecomeVisible(
          'span.ng-option-label:has-text("employee_detail")',
        )
        .click(
          'span.ng-option-label:has-text("employee_detail")',
        )
        .sleep(Constants.DELAY_ONE_SECOND);

      // Go to Processing tab and run the report
      ft = ft
        .sleep(3 * Constants.DELAY_ONE_SECOND)
        .gotoReportGenerationScreen()
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible(
          `span.ng-option-label:has-text("${TEST_NAME} (input SQL Query)")`,
        )
        .click(
          `span.ng-option-label:has-text("${TEST_NAME} (input SQL Query)")`,
        );

      // Click Generate
      ft = ft
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .click('#btnClearLogs')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogs')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedNFilesHavingSuffix(3, '.pdf')
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      // Cleanup: delete template, DB connection, and jasper report folder
      ft = ConfTemplatesTestHelper.deleteTemplate(ft, _.kebabCase(TEST_NAME));

      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        `db-${_.kebabCase(dbConn.connectionName)}-${dbVendor}\\.xml`,
        dbVendor,
      );

      removeJasperReportDir('employee-detail');

      return ft;
    },
  );

});

// ─── Helper: Create DB Connection (same pattern as reporting.spec.ts) ───

function createDbConnection(
  ft: FluentTester,
  testName: string,
  dbConnectionType: 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features' = 'dbcon-no-schema',
  dbVendor: string = 'sqlite',
  clearLogs: boolean = true,
): { ft: FluentTester; connectionName: string; dbConnectionType: string } {
  const connectionName = `${testName}-${dbVendor}-${dbConnectionType}`;

  ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
    ft,
    connectionName,
    dbVendor,
  );

  if (dbConnectionType !== 'dbcon-no-schema') {
    ft = ft
      .clickAndSelectTableRow(`#db-${_.kebabCase(connectionName)}-${dbVendor}\\.xml`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeEnabled('#btnTestDbConnection')
      .click('#btnTestDbConnection');

    if (clearLogs) {
      ft = ft
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogsDbConnection')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnTestDbConnection');
    }

    ft = ft
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .waitOnToastToBecomeVisible(
        'success',
        'Successfully connected to the database',
        Constants.DELAY_HUNDRED_SECONDS,
      );
  }

  return { ft, connectionName, dbConnectionType };
}
