import * as path from 'path';
const slash = require('slash');

import { Page, test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should work correctly (01_monthly_payslips_split_only)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = Constants.PAYSLIPS_PDF_BURST_TOKENS.map(
        function (burstToken) {
          return burstToken + '.pdf';
        },
      );

      const ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdMONTHLY-PAYSLIPS-SPLIT-ONLY',
          '(split only)',
        )
        .click('#trMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .click('#btnSamplesLearnModeMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divMONTHLY-PAYSLIPS-SPLIT-ONLY',
          'you can process the data for all your company employees no matter if your company has few tens',
        )
        .click('#btnCloseSamplesLearnMoreModal')
        .click('#btnSampleTryItMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .clickNoDontDoThis()
        .click('#btnSampleTryItMONTHLY-PAYSLIPS-SPLIT-ONLY')
        .clickYesDoThis()
        .click('#btnBurst')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_LOGS)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles)
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (02_excel_distinct_sheets_split_only)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = Constants.PAYSLIPS_XLS_BURST_TOKENS.map(
        function (burstToken) {
          return burstToken + '.xls';
        },
      );

      const ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdEXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
          '(split only)',
        )
        .click('#trEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .click('#btnSamplesLearnModeEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divEXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
          'you can process the data for all your company employees no matter if your company has few tens',
        )
        .click('#btnCloseSamplesLearnMoreModal')
        .click('#btnSampleTryItEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .clickNoDontDoThis()
        .click('#btnSampleTryItEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .clickYesDoThis()
        .click('#btnBurst')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_LOGS)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'xls')
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (03_split_excel_file_by_distinct_column_values_split_only)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

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

      const ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY',
          '(split only)',
        )
        .click('#trEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY')
        .click('#btnSamplesLearnModeEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY',
          'you can process the data for all your company customers no matter if your company has few tens',
        )
        .click('#btnCloseSamplesLearnMoreModal')
        .click('#btnSampleTryItEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY')
        .clickNoDontDoThis()
        .click('#btnSampleTryItEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY')
        .clickYesDoThis()
        .click('#btnBurst')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'xls')
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (04_invoices_split_once_more_split_only)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = [
        '10.pdf',
        '9.pdf',
        '8.pdf',
        '7.pdf',
        '6.pdf',
        '5.pdf',
        '4.pdf',
        '3.pdf',
        '2.pdf',
        'accounting@alphainsurance.biz.pdf',
        'accounting@betainsurance.biz.pdf',
        'accounting@gammahealth.biz.pdf',
      ];

      const ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY',
          '(split only)',
        )
        .click('#trINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY')
        .click('#btnSamplesLearnModeINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY',
          'you can process the data for all your company customers no matter if your company has few tens',
        )
        .click('#btnCloseSamplesLearnMoreModal')
        .click('#btnSampleTryItINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY')
        .clickNoDontDoThis()
        .click('#btnSampleTryItINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY')
        .clickYesDoThis()
        .click('#btnBurst')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles)
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (05_invoices_merge_then_split_only)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = [
        '0011.pdf',
        '0012.pdf',
        '0013.pdf',
        '0014.pdf',
        '0015.pdf',
        '0016.pdf',
        '0017.pdf',
        '0018.pdf',
        '0019.pdf',
        'merged.pdf',
      ];

      const ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText('#tdINVOICES-MERGE-THEN-SPLIT', 'Merge and')
        .click('#trINVOICES-MERGE-THEN-SPLIT')
        .click('#btnSamplesLearnModeINVOICES-MERGE-THEN-SPLIT')
        .waitOnElementToContainText(
          '#divINVOICES-MERGE-THEN-SPLIT',
          'you can process the data for all your company invoices no matter if your company has few tens',
        )
        .click('#btnCloseSamplesLearnMoreModal')
        .click('#btnSampleTryItINVOICES-MERGE-THEN-SPLIT')
        .clickNoDontDoThis()
        .click('#btnSampleTryItINVOICES-MERGE-THEN-SPLIT')
        .clickYesDoThis()
        .click('#btnRun')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles)
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );
});
