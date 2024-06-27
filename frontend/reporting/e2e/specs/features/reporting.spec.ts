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
    'should correctly generate docx output from docx template using CSV as datasource (csv2docx_from_docx_template)',
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
                '/samples/reports/payslips/payslips-data.csv',
            ),
          ),
        )
        .click('#btnGenerateReports')
        .clickYesDoThis()
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles, 'docx')
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      return ft;
    },
  );
});
