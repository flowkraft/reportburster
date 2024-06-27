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
    `(WITH Report Generation) - should check the correct and default values/behaviour`,
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Invoices',
        'enableMailMergeCapability',
      );

      ft =
        ConfigurationTestHelper.assertDefaultDocumentBursterReportingConfiguration(
          ft,
          'invoices',
        );

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
        .elementShouldNotBeVisible('#invoices_ds\\.csvfile')
        .click('#selectMailMergeClassicReport')
        .waitOnElementToBecomeVisible('#bills_ds\\.csvfile')
        .waitOnElementToBecomeVisible('#invoices_ds\\.csvfile')
        .click('#invoices_ds\\.csvfile')
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
        .waitOnElementToBecomeVisible('#invoices_ds\\.csvfile')
        .click('#bills_ds\\.csvfile')
        .waitOnElementToBecomeVisible('#mailMergeClassicReportInputFile')
        .waitOnElementToBecomeVisible('#browseMailMergeClassicReportInputFile')
        //click the x and clear the selection
        .click('.ng-clear-wrapper')
        .waitOnElementToBecomeInvisible('#mailMergeClassicReportInputFile')
        .waitOnElementToBecomeInvisible(
          '#browseMailMergeClassicReportInputFile',
        );

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'invoices');

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'bills');

      return ft
        .gotoBurstScreen()
        .elementShouldNotBeVisible('#reportGenerationMailMergeTab-link');
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
        'Bills',
        'enableMailMergeCapability',
      );

      ft =
        ConfigurationTestHelper.changeSaveLoadAssertSavedReportingConfiguration(
          ft,
          'bills',
        );

      ft =
        ConfigurationTestHelper.rollbackChangesToDefaultDocumentBursterConfiguration(
          ft,
          'bills',
        );

      //#btnCapReportGenerationMailMerge will be changed to "off" after rollback => assert without the Reporting part
      ft = ConfigurationTestHelper.assertDefaultDocumentBursterConfiguration(
        ft,
        'bills',
      );

      //Update #btnCapReportGenerationMailMerge to be "on" again
      ft = ft
        .gotoConfigurationTemplates()
        .clickAndSelectTableRow(`#bills_${PATHS.SETTINGS_CONFIG_FILE}`)
        .waitOnElementToBecomeEnabled('#btnEdit')
        .click('#btnEdit')
        .waitOnElementToBecomeVisible('#btnCapReportGenerationMailMerge')
        .elementCheckBoxShouldNotBeSelected('#btnCapReportGenerationMailMerge')
        .click('#btnCapReportGenerationMailMerge')
        .clickYesDoThis()
        .waitOnElementToBecomeInvisible('#btnCapReportGenerationMailMerge');

      //assert with the Reporting part
      ft =
        ConfigurationTestHelper.assertDefaultDocumentBursterReportingConfiguration(
          ft,
          'bills',
        );

      return ConfTemplatesTestHelper.deleteTemplate(ft, 'bills');
    },
  );
});
