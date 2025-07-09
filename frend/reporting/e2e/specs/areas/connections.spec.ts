import { test } from '@playwright/test';
import _ from 'lodash';

import { FluentTester } from '../../helpers/fluent-tester';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import * as PATHS from '../../utils/paths';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import { ConnectionsTestHelper } from '../../helpers/areas/connections-test-helper';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    '(email-connection) should correctly CRUD create, read, update, duplicate and delete',
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConnectionsTestHelper.createAndAssertNewEmailConnection(
        ft,
        'Test Email Connection',
      );
      ft = ConnectionsTestHelper.readUpdateAndAssertEmailConnection(
        ft,
        'Test Email Connection',
      );
      ft = ConnectionsTestHelper.duplicateAndAssertEmailConnection(
        ft,
        'Test Email Connection',
      );
      ft = ConnectionsTestHelper.deleteAndAssertEmailConnection(
        ft,
        'eml-test-email-connection\\.xml',
      );
      ft = ConnectionsTestHelper.deleteAndAssertEmailConnection(
        ft,
        'eml-test-email-connection-duplicated\\.xml',
      );

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    '(email-connection) should correctly handle all the "Default" related actions',
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      //assert basic "default" email-connection things
      ft.gotoConnections()
        .clickAndSelectTableRow(`#${PATHS.EML_CONTACT_FILE}`)
        .waitOnElementToBecomeEnabled('#btnNewDropdown')
        .waitOnElementToBecomeEnabled('#btnEdit')
        .waitOnElementToBecomeEnabled('#btnDuplicate')
        .elementShouldContainText(
          `#${PATHS.EML_CONTACT_FILE} td:first-child`,
          'Default Email Connection',
        )
        .elementShouldContainText(
          `#${PATHS.EML_CONTACT_FILE} td:nth-child(2)`,
          'email-connection',
        )
        .elementShouldContainText(
          `#${PATHS.EML_CONTACT_FILE} td:nth-child(3)`,
          '--not used--',
        )
        .elementShouldBeVisible(`#btnDefault_${PATHS.EML_CONTACT_FILE}`)
        .elementShouldNotBeVisible(`#btnActions_${PATHS.EML_CONTACT_FILE}`)
        .click(`#btnDefault_${PATHS.EML_CONTACT_FILE}`)
        .waitOnElementToBecomeVisible(
          `#btnSendTestEmail_${PATHS.EML_CONTACT_FILE}`,
        )
        .elementShouldNotBeVisible(`#btnSeparator_${PATHS.EML_CONTACT_FILE}`)
        .elementShouldNotBeVisible(
          `#btnToggleDefault_${PATHS.EML_CONTACT_FILE}`,
        )
        //#btnDelete should be disabled for Default | usedBy != empty
        .elementShouldHaveClass('#btnDelete', 'disabled');

      //create 2nd email connection and assert it is not default and other basic things
      const secondEmailConnectionName = 'Second Email Connection';
      const secondEmailConnectionFileName = `eml-${_.kebabCase(
        secondEmailConnectionName,
      )}\\.xml`;

      ft = ConnectionsTestHelper.createAndAssertNewEmailConnection(
        ft,
        secondEmailConnectionName,
      );
      ft.gotoConnections()
        .clickAndSelectTableRow(`#${secondEmailConnectionFileName}`)
        .waitOnElementToBecomeEnabled('#btnNewDropdown')
        .waitOnElementToBecomeEnabled('#btnEdit')
        .waitOnElementToBecomeEnabled('#btnDuplicate')
        //#btnDelete should be enable for NonDefault && usedBy == empty
        .waitOnElementToBecomeEnabled('#btnDelete')
        .elementShouldContainText(
          `#${secondEmailConnectionFileName} td:first-child`,
          secondEmailConnectionName,
        )
        .elementShouldContainText(
          `#${secondEmailConnectionFileName} td:nth-child(2)`,
          'email-connection',
        )
        .elementShouldHaveText(
          `#${secondEmailConnectionFileName} td:nth-child(3)`,
          '--not used--',
        );
      //toggle 1st time default and assert it worked
      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        secondEmailConnectionFileName,
      );

      //toggle 2nd tine default and assert it worked
      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        PATHS.EML_CONTACT_FILE,
      );

      ft = ConnectionsTestHelper.deleteAndAssertEmailConnection(
        ft,
        secondEmailConnectionFileName,
      );

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    '(email-connection) should correctly handle Configuration -> Email -> Connection Settings -> "Re-use existing email connection"',
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage); //assert basic "default" connection things

      const escapedWhich = PATHS.SETTINGS_CONFIG_FILE; //;.replace('.', '\\.');

      ft.gotoBurstScreen()
        .click('#topMenuConfiguration')
        .click('#topMenuConfigurationLoad_burst_' + escapedWhich) // STEP0 - CHANGE VALUES general settings
        .click('#leftMenuEmailSettings') // email SMTP settings
        .click('#btnUseExistingEmailConnection');

      //assert basic "default" connection things
      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'burst',
        'Default Email Connection',
        'yes-default-connection',
      );

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'First Test Configuration',
      );
      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'first-test-configuration',
        'Default Email Connection',
        'yes-default-connection',
      );

      ft = ConnectionsTestHelper.createAndAssertNewEmailConnection(
        ft,
        'Test Contact Information',
      );

      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        'eml-test-contact-information\\.xml',
      );

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Second Test Configuration',
      );

      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'second-test-configuration',
        'Test Contact Information',
        'yes-default-connection',
      );

      ft = ft
        .gotoBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuEmailSettings')
        .waitOnElementToBecomeVisible('#selectedEmailConnectionDefault')
        .waitOnElementToBecomeVisible('#btnSelectAnotherEmailConnection')
        .click('#btnSelectAnotherEmailConnection')
        .waitOnElementToBecomeVisible('#eml-contact')
        .click('#eml-contact')
        .clickNoDontDoThis()
        .click('#btnSelectAnotherEmailConnection')
        .waitOnElementToBecomeVisible('#eml-contact')
        .click('#eml-contact')
        .clickYesDoThis()
        .waitOnElementToBecomeInvisible('#selectedEmailConnectionDefault')
        .gotoBurstScreen();

      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'second-test-configuration',
        'Default Email Connection',
        'no-default-connection',
      );

      //uncheck the "Re-use existing email connection" and change email host and port
      //and assert things are working correctly
      ft = ft
        .click('#btnUseExistingEmailConnection')
        .waitOnElementToBecomeInvisible('#btnSelectAnotherEmailConnection')
        .waitOnElementToBecomeEnabled('#emailServerHost')
        .click('#emailServerHost')
        .typeText('')
        .typeText('email.company.com')
        .waitOnElementToBecomeEnabled('#smtpPort')
        .click('#smtpPort')
        .typeText('')
        .typeText('777')
        .gotoBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuEmailSettings')
        .elementShouldNotBeVisible('#btnSelectAnotherEmailConnection')
        .inputShouldHaveValue('#emailServerHost', 'email.company.com')
        .inputShouldHaveValue('#smtpPort', '777')
        .elementShouldBeEnabled('#fromName')
        .elementShouldBeEnabled('#fromEmailAddress')
        .elementShouldBeEnabled('#emailServerHost')
        .elementShouldBeEnabled('#smtpPort')
        .elementShouldBeEnabled('#userName')
        .elementShouldBeEnabled('#smtpPassword')
        .elementShouldBeEnabled('#btnTLS')
        .elementShouldBeEnabled('#btnSSL')
        .elementShouldNotHaveAttribute(
          '#btnFromNameVariables button',
          'disabled',
        )
        .elementShouldNotHaveAttribute(
          '#btnFromEmailAddressVariables button',
          'disabled',
        )
        .elementShouldNotHaveAttribute(
          '#btnEmailServerHostVariables button',
          'disabled',
        )
        .elementShouldNotHaveAttribute(
          '#btnSmtpPortVariables button',
          'disabled',
        )
        .elementShouldNotHaveAttribute(
          '#btnUserNameVariables button',
          'disabled',
        )
        .elementShouldNotHaveAttribute(
          '#btnSmtpPasswordVariables button',
          'disabled',
        );

      //check back "Re-use existing email connection" and then "Manage Email Connections" and change email host and port
      //and come back to Connection and check things are working correctly
      ft = ft
        .gotoBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuEmailSettings')
        .click('#btnUseExistingEmailConnection')
        .waitOnElementToBecomeDisabled('#emailServerHost')
        .waitOnElementToBecomeVisible('#btnSelectAnotherEmailConnection')
        .click('#btnSelectAnotherEmailConnection')
        .waitOnElementToBecomeVisible('#manageEmailConnections')
        .click('#manageEmailConnections')
        .waitOnElementToBecomeInvisible('#btnSelectAnotherEmailConnection')
        .waitOnElementToBecomeVisible('#btnGoBack')
        .waitOnElementToHaveText(
          `#${PATHS.EML_CONTACT_FILE} td:first-child`,
          'Default Email Connection',
        )
        .clickAndSelectTableRow(`#${PATHS.EML_CONTACT_FILE}`)
        .waitOnElementToBecomeEnabled('#btnEdit')
        .click('#btnEdit')
        .waitOnElementToBecomeEnabled('#emailServerHost')
        .click('#emailServerHost')
        .typeText('')
        .typeText('smtp.exmail.qq.com Modified')
        .waitOnElementToBecomeEnabled('#smtpPort')
        .click('#smtpPort')
        .typeText('')
        .typeText('999')
        .click('#btnOKConfirmationConnectionModal')
        .waitOnElementToBecomeVisible('#btnGoBack');

      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        PATHS.EML_CONTACT_FILE,
      );

      //assert that changes are reflected accurately
      ft = ft
        .click('#btnGoBack')
        .waitOnElementToBecomeVisible('#selectedEmailConnectionDefault')
        .waitOnElementToContainText(
          '#btnSelectedEmailConnection',
          'Default Email Connection',
        )
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Modified')
        .inputShouldHaveValue('#smtpPort', '999')
        .elementShouldBeDisabled('#emailServerHost')
        .elementShouldBeDisabled('#smtpPort');

      ft = ft
        .gotoBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuEmailSettings')
        .elementCheckBoxShouldBeSelected('#btnUseExistingEmailConnection')
        .waitOnElementToBecomeVisible('#selectedEmailConnectionDefault')
        .waitOnElementToContainText(
          '#btnSelectedEmailConnection',
          'Default Email Connection',
        )
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Modified')
        .inputShouldHaveValue('#smtpPort', '999')
        .elementShouldBeDisabled('#emailServerHost')
        .elementShouldBeDisabled('#smtpPort');

      ft = ConfTemplatesTestHelper.deleteTemplate(
        ft,
        'first-test-configuration',
      );

      ft = ConfTemplatesTestHelper.deleteTemplate(
        ft,
        'second-test-configuration',
      );
      ft = ConnectionsTestHelper.deleteAndAssertEmailConnection(
        ft,
        'eml-test-contact-information\\.xml',
      );

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    '(database-connection) should correctly CRUD create, read, update, duplicate and delete',
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      // Determine which database vendor to test with
      let dbVendor: string;
      if (ConnectionsTestHelper.DB_VENDORS_TEST_RANDOM) {
        dbVendor = ConnectionsTestHelper.getRandomDbVendor();
        console.log(`Testing with random database vendor: ${dbVendor}`);
      } else {
        dbVendor = ConnectionsTestHelper.DB_VENDORS_DEFAULT;
        console.log(`Testing with default database vendor: ${dbVendor}`);
      }

      // Create a new database connection
      ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
        ft,
        'Test Database Connection',
        dbVendor,
      );

      // Read and update the connection
      ft = ConnectionsTestHelper.readUpdateAndAssertDatabaseConnection(
        ft,
        'Test Database Connection',
        dbVendor,
      );

      // Duplicate the connection
      ft = ConnectionsTestHelper.duplicateAndAssertDatabaseConnection(
        ft,
        'Test Database Connection',
        dbVendor,
      );

      // Delete both connections and verify associated files are also deleted
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        'db-test-database-connection\\.xml',
        dbVendor,
      );
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        'db-test-database-connection-duplicated\\.xml',
        dbVendor,
      );

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    '(database-connection) should correctly handle all the "Default" related actions',
    async function ({ beforeAfterEach: firstPage }) {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      const dbConnection1Name = 'First Test DB for Default';
      const dbConnection1FileNameAndId = `db-${_.kebabCase(dbConnection1Name)}\\.xml`; // For UI element IDs
      const dbConnection1Vendor = ConnectionsTestHelper.getRandomDbVendor();

      const dbConnection2Name = 'Second Test DB for Default';
      const dbConnection2FileNameAndId = `db-${_.kebabCase(dbConnection2Name)}\\.xml`;
      const dbConnection2Vendor = ConnectionsTestHelper.getRandomDbVendor();

      // --- Test Steps ---

      // 1. Go to connections.
      ft.gotoConnections();

      // 2. Create the first database connection.
      ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
        ft,
        dbConnection1Name,
        dbConnection1Vendor,
      );

      // 3. Assert the first DB connection is present and NOT default initially.
      // "Make Default" should be available. Delete button should be enabled.
      ft.gotoConnections()
        .clickAndSelectTableRow(`#${dbConnection1FileNameAndId}`)
        .waitOnElementToBecomeEnabled('#btnNewDropdown')
        .waitOnElementToBecomeEnabled('#btnEdit')
        .waitOnElementToBecomeDisabled('#btnDuplicate')
        .waitOnElementToBecomeEnabled('#btnDelete') // Delete should be enabled for non-default & unused
        .elementShouldContainText(
          `#${dbConnection1FileNameAndId} td:first-child`,
          dbConnection1Name,
        )
        .elementShouldContainText(
          `#${dbConnection1FileNameAndId} td:nth-child(2)`,
          'database-connection',
        )
        .elementShouldHaveText(
          `#${dbConnection1FileNameAndId} td:nth-child(3)`,
          '--not used--',
        ).waitOnElementToBecomeVisible(
          `#btnDefault_${dbConnection1FileNameAndId}`,
        )
        .elementShouldNotBeVisible(`#btnActions_${dbConnection1FileNameAndId}`)
        .clickAndSelectTableRow(`#${dbConnection1FileNameAndId}`);
      
        // 5. Create the second database connection.
      ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
        ft,
        dbConnection2Name,
        dbConnection2Vendor,
      );

      // 6. Assert the second DB connection is present and NOT default.
      // The first DB connection should still be default.
      // Delete button for second connection should be enabled.
      ft.gotoConnections()
        .clickAndSelectTableRow(`#${dbConnection2FileNameAndId}`)
        .elementShouldBeVisible(`#btnActions_${dbConnection2FileNameAndId}`)
        .elementShouldNotBeVisible(`#btnDefault_${dbConnection2FileNameAndId}`)
        .waitOnElementToBecomeEnabled('#btnDelete') // Delete enabled for this non-default
        // Verify first one is still default and its delete button is disabled
        .clickAndSelectTableRow(`#${dbConnection1FileNameAndId}`)
        .elementShouldBeVisible(`#btnDefault_${dbConnection1FileNameAndId}`)
        .elementShouldNotBeVisible(`#btnActions_${dbConnection1FileNameAndId}`)
        .elementShouldHaveClass('#btnDelete', 'disabled');

      // 7. Make the second DB connection default.
      // First connection becomes non-default, its delete button should become enabled.
      // Second connection becomes default, its delete button should become disabled.
      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        dbConnection2FileNameAndId,
      ); // Make temp default

      ft = ft
        .clickAndSelectTableRow(`#${dbConnection2FileNameAndId}`) // Reselect second
        .elementShouldHaveClass('#btnDelete', 'disabled') // Delete disabled for new default
        .waitOnElementToBecomeVisible(
          `#btnActions_${dbConnection1FileNameAndId}`,
        ) // First is no longer default
        .clickAndSelectTableRow(`#${dbConnection1FileNameAndId}`) // Select first
        .waitOnElementToBecomeEnabled('#btnDelete'); // Delete enabled for now non-default first

      // 8. Make the first DB connection default again.
      // Second connection becomes non-default, its delete button should become enabled.
      // First connection becomes default, its delete button should become disabled.
      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        dbConnection1FileNameAndId,
      ); // Make temp default

      ft = ft
        .waitOnElementToBecomeVisible(
          `#btnActions_${dbConnection2FileNameAndId}`,
        ) // Second is no longer default
        .elementShouldHaveClass('#btnDelete', 'disabled') // Delete disabled for new default
        .clickAndSelectTableRow(`#${dbConnection2FileNameAndId}`) // Select second
        .waitOnElementToBecomeEnabled('#btnDelete'); // Delete enabled for now non-default second

      // 9. Delete the second (now non-default) database connection.
      // dbConnection1Name should remain default, and its delete button should remain disabled.
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        dbConnection2FileNameAndId,
        dbConnection2Vendor,
      );

      // 10. Attempt to delete the first (and now only, and default) database connection.
      // Assert Delete button is disabled.
      ft.gotoConnections();
      ft.clickAndSelectTableRow(
        `#${dbConnection1FileNameAndId}`,
      ).elementShouldHaveClass('#btnDelete', 'disabled');

      ft = ft.deleteFolder(
        `${process.env.PORTABLE_EXECUTABLE_DIR}/db/${dbConnection1FileNameAndId.replace('\\.xml', '')}`,
      );
      // 11. To clean up, we must create another connection, make IT default, then delete the original.
      // For this test's scope, we'll just delete dbConnection1Name after making it non-default
      // by creating a temporary one.
      // However, a full cleanup would involve another helper or direct deletion if the test was ending.
      // For now, we'll just assert it cannot be deleted and then manually clean it up
      // (assuming a global afterAll or similar handles full cleanup of test-created files).
      // For this specific test, we will delete it by creating a temp one, making it default, then deleting the original.

      return ft;
    },
  );

});
