import * as path from 'path';
const slash = require('slash');

import { Page, test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { SamplesTestHelper } from '../../helpers/samples-test-helper';

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

      let ft = new FluentTester(firstPage);

      // First navigate to samples page and make the sample visible
      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdMONTHLY-PAYSLIPS-SPLIT-ONLY',
          '(split only)',
        );

      // Now verify the Learn More modal
      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'MONTHLY-PAYSLIPS-SPLIT-ONLY',
        //['config/samples/split-only/settings.xml'],
        'Payslips.pdf',
        'kyle.butford@northridgehealth.org.pdf',
      );

      // Continue with the test workflow
      await ft
        .click('#trMONTHLY-PAYSLIPS-SPLIT-ONLY')
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

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdEXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
          '(split only)',
        );

      // Now verify the Learn More modal
      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'EXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
        //['config/samples/split-only/settings.xml'],
        'Payslips-Distinct-Sheets.xls',
        'alfreda.waldback@northridgehealth.org.xls',
      );

      await ft
        .click('#trEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .click('#btnSamplesLearnModeEXCEL-DISTINCT-SHEETS-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divEXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
          'When processing your actual reports',
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

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .waitOnElementToContainText(
          '#tdEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY',
          '(split only)',
        );

      // Now verify the Learn More modal
      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'EXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY',
        //['config/samples/split-only/settings.xml'],
        'Customers-Distinct-Column-Values.xls',
        'Canada.xls',
      );

      await ft
        .click('#trEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY')
        .click('#btnSamplesLearnModeEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#divEXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY',
          'When processing your actual reports',
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

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#tdINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY',
          '(split only)',
        )
        .click('#trINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY');

      // Now verify the Learn More modal
      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'INVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY',
        //['config/samples/split-only/settings.xml'],
        'Split2Times.pdf',
        '6.pdf',
      );

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY')
        .waitOnElementToContainText(
          '#tdINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY',
          '(split only)',
        )
        .click('#trINVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY')
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

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trINVOICES-MERGE-THEN-SPLIT')
        .waitOnElementToContainText('#tdINVOICES-MERGE-THEN-SPLIT', 'Merge and')
        .click('#trINVOICES-MERGE-THEN-SPLIT');

      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'INVOICES-MERGE-THEN-SPLIT',
        //['config/samples/split-only/settings.xml'],
        'Invoices-Nov.pdf',
        '0018.pdf customer invoice',
      );

      await ft
        .scrollIntoViewIfNeeded('#trINVOICES-MERGE-THEN-SPLIT')
        .waitOnElementToContainText('#tdINVOICES-MERGE-THEN-SPLIT', 'Merge and')
        .click('#trINVOICES-MERGE-THEN-SPLIT')
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

  electronBeforeAfterAllTest(
    'should work correctly (06_generate_payslips_docx)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-DOCX')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-DOCX',
          'Generate (DOCX) Monthly',
        )
        .click('#trGENERATE-PAYSLIPS-DOCX');

      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'GENERATE-PAYSLIPS-DOCX',
        //['config/samples/split-only/settings.xml'],
        'Payslips.csv',
        'kyle.butford@northridgehealth.org.docx employee payslip',
        'payslips-template.docx',
      );

      await ft
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-DOCX')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-DOCX',
          'Generate (DOCX) Monthly',
        )
        .click('#trGENERATE-PAYSLIPS-DOCX')
        .click('#btnSampleTryItGENERATE-PAYSLIPS-DOCX')
        .clickNoDontDoThis()
        .click('#btnSampleTryItGENERATE-PAYSLIPS-DOCX')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#qaReminderLink')
        .waitOnElementToBecomeEnabled('#btnGenerateReports')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(
          ['0.docx', '1.docx', '2.docx'],
          'docx',
        )
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (07_generate_payslips_html)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-HTML')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-HTML',
          'Generate (HTML) Monthly',
        )
        .click('#trGENERATE-PAYSLIPS-HTML');

      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'GENERATE-PAYSLIPS-HTML',
        //['config/samples/split-only/settings.xml'],
        'Payslips.csv',
        'kyle.butford@northridgehealth.org.html employee payslip',
        undefined,
        'class="company-info"',
      );

      await ft
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-HTML')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-HTML',
          'Generate (HTML) Monthly',
        )
        .click('#trGENERATE-PAYSLIPS-HTML')
        .click('#btnSampleTryItGENERATE-PAYSLIPS-HTML')
        .clickNoDontDoThis()
        .click('#btnSampleTryItGENERATE-PAYSLIPS-HTML')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#qaReminderLink')
        .waitOnElementToBecomeEnabled('#btnGenerateReports')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(
          ['0.html', '1.html', '2.html'],
          'html',
        )
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (08_generate_payslips_pdf)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-PDF')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-PDF',
          'Generate (PDF) Monthly',
        );

      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'GENERATE-PAYSLIPS-PDF',
        //['config/samples/split-only/settings.xml'],
        'Payslips.csv',
        'kyle.butford@northridgehealth.org.pdf employee payslip',
        undefined,
        'class="company-info"',
      );

      await ft
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-PDF')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-PDF',
          'Generate (PDF) Monthly',
        )
        .click('#btnSampleTryItGENERATE-PAYSLIPS-PDF')
        .clickNoDontDoThis()
        .click('#btnSampleTryItGENERATE-PAYSLIPS-PDF')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#qaReminderLink')
        .waitOnElementToBecomeEnabled('#btnGenerateReports')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(
          ['0.pdf', '1.pdf', '2.pdf'],
          'pdf',
        )
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (09_generate_payslips_excel)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-EXCEL')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-EXCEL',
          'Generate (Excel) Monthly',
        )
        .click('#trGENERATE-PAYSLIPS-EXCEL');

      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'GENERATE-PAYSLIPS-EXCEL',
        //['config/samples/split-only/settings.xml'],
        'Payslips.csv',
        'kyle.butford@northridgehealth.org.xlsx employee payslip',
        undefined,
        'data-text-cell',
      );

      await ft
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-EXCEL')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-EXCEL',
          'Generate (Excel) Monthly',
        )
        .click('#trGENERATE-PAYSLIPS-EXCEL')
        .click('#btnSampleTryItGENERATE-PAYSLIPS-EXCEL')
        .clickNoDontDoThis()
        .click('#btnSampleTryItGENERATE-PAYSLIPS-EXCEL')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#qaReminderLink')
        .waitOnElementToBecomeEnabled('#btnGenerateReports')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(
          ['0.xlsx', '1.xlsx', '2.xlsx'],
          'xlsx',
        )
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

  electronBeforeAfterAllTest(
    'should work correctly (10_generate_xlsx_from_xlsx_ds)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      await ft
        .click('#leftMenuSamples')
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-EXCEL-XLSX-DS')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-EXCEL-XLSX-DS',
          'Generate Reports From Excel Data Source',
        )
        .click('#trGENERATE-PAYSLIPS-EXCEL-XLSX-DS');

      ft = SamplesTestHelper.verifyLearnMoreModal(
        ft,
        'GENERATE-PAYSLIPS-EXCEL-XLSX-DS',
        //['config/samples/split-only/settings.xml'],
        'Payslips.xlsx',
        'kyle.butford@northridgehealth.org.xlsx employee payslip',
        undefined,
        'data-text-cell',
      );

      await ft
        .scrollIntoViewIfNeeded('#trGENERATE-PAYSLIPS-EXCEL-XLSX-DS')
        .waitOnElementToContainText(
          '#tdGENERATE-PAYSLIPS-EXCEL-XLSX-DS',
          'Generate Reports From Excel',
        )
        .click('#trGENERATE-PAYSLIPS-EXCEL-XLSX-DS')
        .click('#btnSampleTryItGENERATE-PAYSLIPS-EXCEL-XLSX-DS')
        .clickNoDontDoThis()
        .click('#btnSampleTryItGENERATE-PAYSLIPS-EXCEL-XLSX-DS')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#qaReminderLink')
        .waitOnElementToBecomeEnabled('#btnGenerateReports')
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(
          ['0.xlsx', '1.xlsx', '2.xlsx'],
          'xlsx',
        )
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    },
  );

});
