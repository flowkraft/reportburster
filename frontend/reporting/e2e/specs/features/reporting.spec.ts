import * as path from 'path';
const slash = require('slash');

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import * as PATHS from '../../utils/paths';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly generate DOCX output from DOCX template using CSV as datasource (csv2docx_from_docx_template)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = ['0.docx', '1.docx', '2.docx'];

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = ft
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_payslips_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuReportingSettings')
        //tab DataSource - assert the default values
        .waitOnElementToBecomeVisible('#dsTypes')
        //tab Output/Template - assert the default values
        .click('#reportingTemplateOutputTab-link')
        .waitOnElementToBecomeVisible('#reportOutputType')
        .dropDownSelectOptionHavingLabel(
          '#reportOutputType',
          'Microsoft Word Documents',
        )
        .waitOnElementToBecomeVisible('#reportTemplate')
        .waitOnElementToContainText(
          '#selectTemplateFile',
          'payslips-template.docx',
        )
        .waitOnElementWithTextToBecomeVisible('Saved')
        .gotoReportGenerationScreen()
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible(
          'span.ng-option-label:has-text("Payslips (input CSV)")',
        )
        .click('span.ng-option-label:has-text("Payslips (input CSV)")')
        .waitOnElementToBecomeVisible('#browseMailMergeClassicReportInputFile')
        .setInputFiles(
          '#reportingFileUploadInput',
          slash(
            path.resolve(
              process.env.PORTABLE_EXECUTABLE_DIR +
                '/samples/reports/payslips/Payslips.csv',
            ),
          ),
        )
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'docx')
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    'should correctly generate HTML output from HTML template using CSV as datasource (csv2html_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = ['0.html', '1.html', '2.html'];

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = ft
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_payslips_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuReportingSettings')
        //tab DataSource - assert the default values
        .waitOnElementToBecomeVisible('#dsTypes')
        //tab Output/Template - assert the default values
        .click('#reportingTemplateOutputTab-link')
        .waitOnElementToBecomeVisible('#reportOutputType')
        .dropDownSelectOptionHavingLabel('#reportOutputType', 'HTML Documents')
        .waitOnElementToBecomeVisible('#reportTemplate')
        .waitOnElementToContainText(
          '#selectTemplateFile',
          'payslips-template.html',
        )
        .waitOnElementWithTextToBecomeVisible('Saved')
        .gotoReportGenerationScreen()
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible(
          'span.ng-option-label:has-text("Payslips (input CSV)")',
        )
        .click('span.ng-option-label:has-text("Payslips (input CSV)")')
        .waitOnElementToBecomeVisible('#browseMailMergeClassicReportInputFile')
        .setInputFiles(
          '#reportingFileUploadInput',
          slash(
            path.resolve(
              process.env.PORTABLE_EXECUTABLE_DIR +
                '/samples/reports/payslips/Payslips.csv',
            ),
          ),
        )
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'html')
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    'should correctly generate PDF output from HTML template using CSV as datasource (csv2pdf_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const expectedOutputFiles = ['0.pdf', '1.pdf', '2.pdf'];

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = ft
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_payslips_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuReportingSettings')
        //tab DataSource - assert the default values
        .waitOnElementToBecomeVisible('#dsTypes')
        //tab Output/Template - assert the default values
        .click('#reportingTemplateOutputTab-link')
        .waitOnElementToBecomeVisible('#reportOutputType')
        .dropDownSelectOptionHavingLabel('#reportOutputType', 'PDF Documents')
        .waitOnElementToBecomeVisible('#reportTemplate')
        .waitOnElementToContainText(
          '#selectTemplateFile',
          'payslips-template.html',
        )
        .waitOnElementWithTextToBecomeVisible('Saved')
        .gotoReportGenerationScreen()
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible(
          'span.ng-option-label:has-text("Payslips (input CSV)")',
        )
        .click('span.ng-option-label:has-text("Payslips (input CSV)")')
        .waitOnElementToBecomeVisible('#browseMailMergeClassicReportInputFile')
        .setInputFiles(
          '#reportingFileUploadInput',
          slash(
            path.resolve(
              process.env.PORTABLE_EXECUTABLE_DIR +
                '/samples/reports/payslips/Payslips.csv',
            ),
          ),
        )
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'pdf')
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );
});
