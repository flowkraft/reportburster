import * as path from 'path';
const slash = require('slash');

import { Page, test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE4
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly split samples/burst/Payslips-Distinct-Sheets.xls (My Report)',
    async ({ beforeAfterEach: firstPage }) => {
      const expectedOutputFiles = Constants.PAYSLIPS_XLS_BURST_TOKENS.map(
        function (burstToken) {
          return burstToken + '.xls';
        },
      );

      await _splitExcel(
        firstPage,
        Constants.INPUT_FILE_CUSTOMERS_PAYSLIPS_DISTINCT_SHEETS_XLS,
        expectedOutputFiles,
      );
    },
  );

  electronBeforeAfterAllTest(
    'should correctly split samples/burst/Customers-Distinct-Column-Values.xls (My Report)',
    async ({ beforeAfterEach: firstPage }) => {
      const expectedOutputFiles = [
        'Germany.xls',
        'USA.xls',
        'UK.xls',
        'Sweden.xls',
        'France.xls',
        'Spain.xls',
        'Canada.xls',
        'Argentina.xls',
        'Switzerland.xls',
        'Brazil.xls',
        'Austria.xls',
        'Italy.xls',
        'Portugal.xls',
        'Mexico.xls',
        'Venezuela.xls',
        'Ireland.xls',
        'Belgium.xls',
        'Norway.xls',
        'Denmark.xls',
        'Finland.xls',
        'Poland.xls',
      ];

      await _splitExcel(
        firstPage,
        Constants.INPUT_FILE_CUSTOMERS_DISTINCT_COLUMN_VALUES_XLS,
        expectedOutputFiles,
      );
    },
  );
});

const _splitExcel = (
  firstPage: Page,
  file: string,
  expectedOutputFiles: string[],
): FluentTester => {
  const ft = new FluentTester(firstPage)
    .appShouldBeReadyToRunNewJobs()
    .appStatusShouldBeGreatNoErrorsNoWarnings()
    .click('#burstFile')
    .setInputFiles(
      '#burstFileUploadInput',
      path.resolve(
        slash(process.env.PORTABLE_EXECUTABLE_DIR + `/samples/burst/${file}`),
      ),
    )
    .waitOnElementToBecomeVisible('#qaReminderLink')
    .click('#btnBurst')
    .clickYesDoThis()
    //.waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
    //.waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
    .waitOnProcessingToStart(Constants.CHECK_PROCESSING_STATUS_BAR)
    .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_STATUS_BAR)
    .appStatusShouldBeGreatNoErrorsNoWarnings()
    .processingShouldHaveGeneratedNFilesHavingSuffix(
      expectedOutputFiles.length,
      '.xls',
    )
    .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'xls');

  return ft;
};
