import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { FluentTester } from '../../helpers/fluent-tester';
import { ConfigurationTestHelper } from '../../helpers/areas/configuration-test-helper';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import * as PATHS from '../../utils/paths';
import { Constants } from '../../utils/constants';

//DONE2
test.describe('', async () => {

  electronBeforeAfterAllTest(
    `(WITHOUT Report Generation) - should work changing/saving configuration values and should work rolling back to default configuration values 
    ("My Reports")`,
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfigurationTestHelper.changeSaveLoadAssertSavedConfiguration(ft);

      ft =
        ConfigurationTestHelper.rollbackChangesToDefaultDocumentBursterConfiguration(
          ft,
          'burst',
        );

      return ConfigurationTestHelper.assertDefaultDocumentBursterConfiguration(
        ft,
        'burst',
      );
    },
  );
  
  electronBeforeAfterAllTest(
    `(WITH Report Generation) - should properly 'Generate Reports' templates, verify datasource defaults, do the 'Read Only' template/Output checks and then cleanup`,
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      const docxTemplatePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/templates/reports/payslips/payslips-template.docx`;
      const tempStoragePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/temp/payslips-template.docx`;

      ft = ft.moveFile(docxTemplatePath, tempStoragePath);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      ).sleep(2 * Constants.DELAY_ONE_SECOND);

      ft =
        ConfigurationTestHelper.assertDefaultDocumentBursterReportingConfiguration(
          ft,
          'payslips',
        );

      // Loop through all output types for comprehensive testing
      const outputTypes = [
        'output.pdf',
        'output.none',
        'output.docx',
        'output.xlsx',
        'output.html',
        'output.any',
        'output.fop2pdf'
      ];

      for (const outputType of outputTypes) {
        ft = ft.consoleLog(
          `Testing AI Help Features for Output Type: ${outputType}`,
        );
        ft = ConfigurationTestHelper.assertTemplateOutputAIHelpFeatures(
          ft,
          outputType,
        );

        // Test the gallery features for the current output type
        // Use 7 for gallery template count by default
        let galleryTemplateCount = 7;

        if (outputType === 'output.xlsx') {
          galleryTemplateCount = 1;
        }

        ft = ft.consoleLog(
          `Testing Gallery Features for Output Type: ${outputType} with ${galleryTemplateCount} templates`,
        );
        ft = ConfigurationTestHelper.assertTemplateOutputGalleryFeatures(
          ft,
          outputType,
          galleryTemplateCount,
        );
      }

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Bills',
        'enableMailMergeCapability',
      );

      ft = ft
        .gotoBurstScreen()
        .click('#reportGenerationMailMergeTab-link')
        .elementShouldBeVisible('#selectMailMergeClassicReport')
        .elementShouldNotBeVisible('#mailMergeClassicReportInputFile')
        .elementShouldNotBeVisible('#browseMailMergeClassicReportInputFile')
        .elementShouldBeVisible('#btnGenerateReports')
        .elementShouldBeDisabled('#btnGenerateReports')
        .elementShouldNotBeVisible('#bills_ds\\.csvfile')
        .elementShouldNotBeVisible('#payslips_ds\\.csvfile')
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible('#bills_ds\\.csvfile')
        .waitOnElementToBecomeVisible('#payslips_ds\\.csvfile')
        .click('#bills_ds\\.csvfile')
        .waitOnElementToBecomeVisible('#mailMergeClassicReportInputFile')
        .elementShouldBeVisible('#browseMailMergeClassicReportInputFile')
        //click the x and clear the selection
        .click('.ng-clear-wrapper')
        .waitOnElementToBecomeInvisible('#mailMergeClassicReportInputFile')
        .waitOnElementToBecomeInvisible(
          '#browseMailMergeClassicReportInputFile',
        )
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible('#bills_ds\\.csvfile')
        .waitOnElementToBecomeVisible('#payslips_ds\\.csvfile')
        .click('#bills_ds\\.csvfile')
        .waitOnElementToBecomeVisible('#mailMergeClassicReportInputFile')
        .waitOnElementToBecomeVisible('#browseMailMergeClassicReportInputFile')
        //click the x and clear the selection
        .click('.ng-clear-wrapper')
        .waitOnElementToBecomeInvisible('#mailMergeClassicReportInputFile')
        .waitOnElementToBecomeInvisible(
          '#browseMailMergeClassicReportInputFile',
        );

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'bills');

      return ft
        .moveFile(tempStoragePath, docxTemplatePath)
        .gotoBurstScreen()
        .waitOnElementToBecomeVisible('#reportGenerationMailMergeTab-link')
        .waitOnElementToBecomeEnabled('#reportGenerationMailMergeTab-link')
        .click('#reportGenerationMailMergeTab-link')
        .waitOnElementToBecomeVisible('#noReportsShowMeHowToConfigureReports')
        .waitOnElementToBecomeEnabled('#noReportsShowMeHowToConfigureReports');
    },
  );

  electronBeforeAfterAllTest(
    `(WITH Report Generation) - should work changing/saving configuration values and should work rolling back to default configuration values`,
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      // Select random output type for comprehensive testing
      const outputTypes = ['output.pdf', 'output.xlsx', 'output.html'];
      const randomOutputType =
        outputTypes[Math.floor(Math.random() * outputTypes.length)];

      // Test the gallery and AI features for the random output type
      // Use 7 for gallery template count
      let galleryTemplateCount = 7;

      if (randomOutputType === 'output.xlsx') {
        galleryTemplateCount = 1;
      }

      ft =
        ConfigurationTestHelper.changeSaveLoadAssertSavedReportingConfiguration(
          ft,
          'payslips',
          randomOutputType,
          galleryTemplateCount,
        );

      ft =
        ConfigurationTestHelper.rollbackChangesToDefaultDocumentBursterConfiguration(
          ft,
          'payslips',
        );

      //#btnCapReportGenerationMailMerge will be changed to "off" after rollback => assert without the Reporting part
      ft = ConfigurationTestHelper.assertDefaultDocumentBursterConfiguration(
        ft,
        'payslips',
      );

      //Update #btnCapReportGenerationMailMerge to be "on" again
      
      //ft = ft
      //  .gotoConfigurationTemplates()
      //  .clickAndSelectTableRow(`#payslips_${PATHS.SETTINGS_CONFIG_FILE}`)
      //  .waitOnElementToBecomeEnabled('#btnEdit')
      //  .click('#btnEdit')
      //  .waitOnElementToBecomeVisible('#btnCapReportGenerationMailMerge')
      //  .elementCheckBoxShouldNotBeSelected('#btnCapReportGenerationMailMerge')
      //  .click('#btnCapReportGenerationMailMerge')
      //  .clickYesDoThis()
      //  .waitOnElementToBecomeInvisible('#btnCapReportGenerationMailMerge');

      //const docxTemplatePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/templates/reports/payslips/payslips-template.docx`;
      //const tempStoragePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/temp/payslips-template.docx`;

      //ft = ft.moveFile(docxTemplatePath, tempStoragePath);
      //assert with the Reporting part
      //ft =
      //  ConfigurationTestHelper.assertDefaultDocumentBursterReportingConfiguration(
      //    ft,
      //    'payslips',
      //  ).moveFile(tempStoragePath, docxTemplatePath);
      //
      return ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');
    } ,
  );
  
});
