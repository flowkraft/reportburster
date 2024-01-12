import * as path from 'path';
const slash = require('slash');

import { Page, test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';

test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should work correctly (01_monthly_payslips_split_only)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = Constants.PAYSLIPS_PDF_BURST_TOKENS.map(
        function (burstToken) {
          return burstToken + '.pdf';
        }
      );

      const ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdMONTHLY-PAYSLIPS-SPLIT-ONLY',
          '(split only)'
        )
        .click('#trMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .click('#btnSamplesLearnModeMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divMONTHLY-PAYSLIPS-SPLIT-ONLY',
          'you can process the data for all your company employees no matter if your company has few tens'
        )
        .click('#btnCloseSamplesLearnMoreModal')
        .click('#btnSampleTryItMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .clickNoDontDoThis()
        .click('#btnSampleTryItMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .clickYesDoThis()
        .click('#btnBurst')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles)
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    }
  );

  electronBeforeAfterAllTest(
    'should work correctly (02_excel_distinct_sheets_split_only)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = Constants.PAYSLIPS_XLS_BURST_TOKENS.map(
        function (burstToken) {
          return burstToken + '.xls';
        }
      );

      const ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdEXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
          '(split only)'
        )
        .click('#trEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .click('#btnSamplesLearnModeEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divEXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
          'you can process the data for all your company employees no matter if your company has few tens'
        )
        .click('#btnCloseSamplesLearnMoreModal')
        .click('#btnSampleTryItEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .clickNoDontDoThis()
        .click('#btnSampleTryItEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .clickYesDoThis()
        .click('#btnBurst')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'xls')
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    }
  );
});
