import { test } from '@playwright/test';
import _ from 'lodash';

import { FluentTester } from '../../helpers/fluent-tester';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import * as PATHS from '../../utils/paths';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import { ConnectionsTestHelper, DB_VENDORS_DEFAULT, DB_VENDORS_SUPPORTED } from '../../helpers/areas/connections-test-helper';

const DB_VENDORS_SELECTED: string[] = (() => {
  const required = 'sqlite';
  const pool = DB_VENDORS_SUPPORTED.filter(v => v !== required);

  // Use date-based seed for daily variation but consistent within a run
  const today = new Date().toISOString().split('T')[0]; // e.g., "2025-12-02"
  const seed = today.split('-').reduce((acc, n) => acc + parseInt(n), 0);

  // Simple seeded shuffle
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };

  const shuffled = [...pool].sort((a, b) => seededRandom(pool.indexOf(a)) - seededRandom(pool.indexOf(b)));
  const pickedOthers = shuffled.slice(0, 2);

  const list = [required, ...pickedOthers];
  return list;
})();

//DONE2
test.describe('', async () => {

  electronBeforeAfterAllTest(
    '(email-connection) should correctly CRUD create, read, update, duplicate and delete',
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
    '(email-connection) should exercise Send Test Email: unsaved modal, list, config reuse, inline valid and inline invalid (bundled SMTP)',
    async function ({ beforeAfterEach: firstPage }) {
      // generous timeout for network & SMTP operations
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

      let ft = new FluentTester(firstPage);

      // Test connection name + derived selectors
      const connectionName = 'E2E Combined Email Conn';
      const connectionCode = `eml-${_.kebabCase(connectionName)}`;
      const connectionFileId = `${connectionCode}\\.xml`;
      const escapedWhich = PATHS.SETTINGS_CONFIG_FILE;

      // --------------------------------------------------------------------
      // STEP 1 — Start bundled SMTP test server so we can verify deliveries
      // --------------------------------------------------------------------
      ft = ft.gotoBurstScreen()
        .click('#leftMenuQualityAssurance')
        .click('#testTokensRandom')
        .waitOnElementToBecomeVisible('#startTestEmailServer')
        .waitOnElementToBecomeEnabled('#startTestEmailServer')
        .click('#startTestEmailServer')
        .clickYesDoThis()
        .waitOnElementToBecomeEnabled('#stopTestEmailServer', Constants.DELAY_FIVE_HUNDRED_SECONDS);

      // ensure inbox starts empty
      ft = ft.shouldHaveSentNCorrectEmails(0);

      // --------------------------------------------------------------------
      // STEP 2 — UNSAVED flow: open New Email modal, fill fields but DO NOT save,
      //           click Send Test Email -> expect "Save first?" dialog -> choose NO -> assert no email sent
      // --------------------------------------------------------------------
      ft = ft.gotoConnections()
        .waitOnElementToBecomeEnabled('#btnNewDropdown')
        .click('#btnNewDropdown')
        .waitOnElementToBecomeVisible('#btnNewEmail')
        .click('#btnNewEmail')
        .waitOnElementToBecomeVisible('#modalExtConnection')
        .waitOnElementToBecomeEnabled('#connectionName')
        .click('#connectionName').typeText(connectionName)
        .waitOnElementToBecomeEnabled('#fromName')
        .click('#fromName').typeText('Test User')
        .waitOnElementToBecomeEnabled('#fromEmailAddress')
        .click('#fromEmailAddress').typeText('test@example.com')
        .waitOnElementToBecomeEnabled('#emailServerHost')
        .click('#emailServerHost').typeText('127.0.0.1')
        .waitOnElementToBecomeEnabled('#smtpPort')
        .click('#smtpPort').typeText('1025');

      // Click Send Test Email (unsaved): expect "Save first?" -> click NO -> verify no email sent
      ft = ft.waitOnElementToBecomeVisible('#btnSendTestEmail')
        .waitOnElementToBecomeEnabled('#btnSendTestEmail')
        .click('#btnSendTestEmail')
        .waitOnElementToContainText(
          '#confirmDialog .modal-body',
          'The connection must be saved before being able to test it. Save now?',
        )
        .clickNoDontDoThis()
        .waitOnElementToBecomeInvisible('#confirmDialog');

      // assert still zero emails delivered
      ft = ft.shouldHaveSentNCorrectEmails(0);

      // --------------------------------------------------------------------
      // STEP 3 — UNSAVED flow continued: click Send Test Email again, choose YES to save+test,
      //           assert success toast and that 1 email was delivered
      // --------------------------------------------------------------------
      ft = ft.waitOnElementToBecomeEnabled('#btnSendTestEmail')
        .click('#btnSendTestEmail')
        .waitOnElementToContainText(
          '#confirmDialog .modal-body',
          'The connection must be saved before being able to test it. Save now?',
        )
        .clickYesDoThis()
        .click('#btnSendTestEmail')
        .waitOnElementToContainText(
          '#confirmDialog .modal-body',
          'Send test email?',
        )
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .waitOnElementToBecomeEnabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      // verify SMTP received 1 email (the saved+tested connection)
      ft = ft.shouldHaveSentNCorrectEmails(1)
        .click('#btnOKConfirmationConnectionModal')
        .waitOnToastToBecomeVisible(
          'info',
          `Connection '${connectionName}' saved successfully.`,
        )
        .clickAndSelectTableRow(`#${connectionCode}\\.xml`)
        .gotoBurstScreen();

      // --------------------------------------------------------------------
      // STEP 4 — From Connections list: press Send Test Email next to saved row
      // --------------------------------------------------------------------
      ft = ft.gotoConnections()
        .waitOnElementToHaveText(`#${connectionFileId} td:first-child`, connectionName)
        .clickAndSelectTableRow(`#${connectionFileId}`)
        .waitOnElementToBecomeVisible(`#btnActions_${connectionFileId}`)
        .click(`#btnActions_${connectionFileId}`)
        .waitOnElementToBecomeVisible(`#btnSendTestEmail_${connectionFileId}`)
        .waitOnElementToBecomeEnabled(`#btnSendTestEmail_${connectionFileId}`)
        .click(`#btnSendTestEmail_${connectionFileId}`)
        .waitOnElementToBecomeVisible('#btnClearLogsConnection')
        .waitOnElementToBecomeEnabled('#btnClearLogsConnection')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogsConnection')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogsConnection')
        .waitOnElementToBecomeEnabled('#btnSendTestEmail')
        .click('#btnSendTestEmail')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .waitOnElementToBecomeEnabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      // verify SMTP received 2 emails total now
      ft = ft.shouldHaveSentNCorrectEmails(2)
        .click('#btnCloseConnectionModal')
        .waitOnElementToBecomeInvisible('#btnCloseConnectionModal')
        .clickAndSelectTableRow(`#${connectionCode}\\.xml`);

      // --------------------------------------------------------------------
      // STEP 5 — Configuration tab: Re-use existing email connection -> select saved connection -> Send Test Email
      // --------------------------------------------------------------------
      ft = ft.gotoBurstScreen()
        .click('#topMenuConfiguration')
        .click('#topMenuConfigurationLoad_burst_' + escapedWhich)
        .click('#leftMenuEmailSettings');

      ft = ft.waitOnElementToBecomeVisible('#btnUseExistingEmailConnection')
        .click('#btnUseExistingEmailConnection')
        .waitOnElementToBecomeVisible('#btnSelectAnotherEmailConnection')
        .click('#btnSelectAnotherEmailConnection')
        .waitOnElementToBecomeVisible(`#${connectionCode}`)
        .click(`#${connectionCode}`)
        .clickYesDoThis()
        .waitOnElementToBecomeInvisible('#selectedEmailConnectionDefault', Constants.DELAY_TEN_SECONDS)
        .waitOnElementToBecomeVisible('#btnClearLogs')
        .waitOnElementToBecomeEnabled('#btnClearLogs')
        .click('#btnClearLogs')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogs')
        .waitOnElementToBecomeVisible('#btnSendTestEmail')
        .waitOnElementToBecomeEnabled('#btnSendTestEmail')
        .click('#btnSendTestEmail')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .waitOnElementToBecomeEnabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      // verify SMTP received 3 emails total now
      ft = ft.shouldHaveSentNCorrectEmails(3);

      // --------------------------------------------------------------------
      // STEP 6 — Configuration tab: uncheck "Re-use" and use inline SMTP details (valid) -> Send Test Email
      // --------------------------------------------------------------------
      ft = ft.waitOnElementToBecomeVisible('#btnUseExistingEmailConnection')
        .click('#btnUseExistingEmailConnection') // uncheck -> inline enabled
        .waitOnElementToBecomeEnabled('#emailServerHost')
        .click('#emailServerHost').typeText('') // clear then set
        .typeText('127.0.0.1')
        .waitOnElementToBecomeEnabled('#smtpPort')
        .click('#smtpPort').typeText('') // clear then set
        .typeText('1025')
        .waitOnElementToBecomeEnabled('#fromName')
        .click('#fromName').typeText('Test User')
        .waitOnElementToBecomeEnabled('#fromEmailAddress')
        .click('#fromEmailAddress').typeText('test@example.com');

      ft = ft.waitOnElementToBecomeEnabled('#btnClearLogs')
        .click('#btnClearLogs')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogs')
        .waitOnElementToBecomeEnabled('#btnSendTestEmail')
        .click('#btnSendTestEmail')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .waitOnElementToBecomeEnabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .appStatusShouldBeGreatNoErrorsNoWarnings();

      // verify SMTP received 4 emails total now
      ft = ft.shouldHaveSentNCorrectEmails(4);

      // --------------------------------------------------------------------
      // STEP 7 — Configuration tab: inline invalid SMTP detail (wrong port) -> Send Test Email -> expect NO new email delivered
      // --------------------------------------------------------------------
      ft = ft.waitOnElementToBecomeEnabled('#smtpPort')
        .click('#smtpPort')
        .typeText('') // clear
        .typeText('9999') // invalid port
        .waitOnElementToBecomeEnabled('#btnClearLogs')
        .click('#btnClearLogs')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnClearLogs')
        .waitOnElementToBecomeEnabled('#btnSendTestEmail')
        .click('#btnSendTestEmail')
        .clickYesDoThis()
        .waitOnElementToBecomeDisabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .waitOnElementToBecomeEnabled('#btnSendTestEmail', Constants.DELAY_HUNDRED_SECONDS)
        .appStatusShouldShowErrors();

      // mailbox should remain unchanged (still 4)
      ft = ft.shouldHaveSentNCorrectEmails(4);

      // --------------------------------------------------------------------
      // STEP 8 — Stop bundled SMTP server
      // --------------------------------------------------------------------
      ft = ft.gotoBurstScreen()
        .click('#leftMenuQualityAssurance')
        .click('#testTokensRandom')
        .waitOnElementToBecomeVisible('#stopTestEmailServer')
        .waitOnElementToBecomeEnabled('#stopTestEmailServer')
        .click('#stopTestEmailServer')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#startTestEmailServer', Constants.DELAY_FIVE_HUNDRED_SECONDS);

      // --------------------------------------------------------------------
      // STEP 9 — Cleanup: delete created email connection
      // --------------------------------------------------------------------
      ft = ft.gotoConnections();
      ft = ConnectionsTestHelper.deleteAndAssertEmailConnection(ft, connectionFileId);

      return ft;
    },
  );

  for (const dbVendor of DB_VENDORS_SELECTED) {
    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] should correctly CRUD create, read, update, duplicate and delete`,
      async function ({ beforeAfterEach: firstPage }) {
        //long running test
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

        const connectionName = `Test Database Connection (${dbVendor})`;
        const dbConnection1FileNameAndId = `db-${_.kebabCase(connectionName)}\\.xml`; // For UI element IDs

        let ft = new FluentTester(firstPage);

        // Create a new database connection
        ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
          ft,
          connectionName,
          dbVendor,
        );

        // Read and update the connection
        ft = ConnectionsTestHelper.readUpdateAndAssertDatabaseConnection(
          ft,
          connectionName,
          dbVendor,
        );

        // Duplicate the connection
        ft = ConnectionsTestHelper.duplicateAndAssertDatabaseConnection(
          ft,
          connectionName,
          dbVendor,
        );

        // Delete both connections and verify associated files are also deleted
        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          dbConnection1FileNameAndId,
          dbVendor,
        );
        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          `db-${_.kebabCase(`${connectionName} Duplicated`)}\\.xml`,
          dbVendor,
        );

        return ft;
      },
    );

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] should correctly handle all the "Default" related actions`,
      async function ({ beforeAfterEach: firstPage }) {
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

        let ft = new FluentTester(firstPage);

        const dbConnection1Name = `First Test DB for Default (${dbVendor})`;
        const dbConnection1FileNameAndId = `db-${_.kebabCase(dbConnection1Name)}\\.xml`; // For UI element IDs
        const dbConnection1Vendor = dbVendor;

        const dbConnection2Name = `Second Test DB for Default (${dbVendor})`;
        const dbConnection2FileNameAndId = `db-${_.kebabCase(dbConnection2Name)}\\.xml`;
        const dbConnection2Vendor = dbVendor;

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
          .waitOnElementToBecomeEnabled('#btnDuplicate')
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

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] should successfully test an (EXISTING) connection for a supported database type`,
      async function ({ beforeAfterEach: firstPage }) {
        //long running test
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS * 2); // Adjusted timeout for a single vendor test

        let ft = new FluentTester(firstPage);

        //const dbVendor = ConnectionsTestHelper.getRandomDbVendor();
        ft = ft.consoleLog(
          `Testing database connection for randomly selected vendor: ${dbVendor}`,
        );

        // Start starter-pack only for non-sqlite vendors
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
        }

        const connectionName = `ExistingTestConn-${dbVendor}-${Date.now()}`;
        const kebabConnectionName = _.kebabCase(connectionName);
        const fileNameAndId = `db-${kebabConnectionName}\\.xml`;

        // 1. Create the database connection using the existing helper
        // This helper handles filling details, SQLite file creation, and saving.
        ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
          ft,
          connectionName,
          dbVendor,
        );

        // 2. Go back to connections, find the created connection, and open it for editing
        ft = ft.gotoConnections();
        ft = ft.clickAndSelectTableRow(`#${fileNameAndId}`);
        ft = ft.waitOnElementToBecomeEnabled('#btnEdit').click('#btnEdit');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        // Wait for a known field to be enabled to ensure the modal is fully loaded with connection data
        ft = ft.waitOnElementToBecomeEnabled('#dbConnectionName');
        ft = ft.waitOnInputToHaveValue('#dbConnectionName', connectionName);

        // 3. Click the "Test Connection" button
        // Ensure the button is enabled before clicking. It might depend on form state or async operations.
        ft = ft
          .waitOnElementToBecomeEnabled('#btnTestDbConnection')
          .click('#btnTestDbConnection');

        if (dbVendor !== 'sqlite') {
          ft = ft.infoDialogShouldBeVisible()
            .clickYesDoThis()
            .click('#btnClearLogsDbConnection')
            .confirmDialogShouldBeVisible()
            .clickYesDoThis()
            .waitOnElementToBecomeDisabled('#btnClearLogsDbConnection')
            .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
            .appStatusShouldBeGreatNoErrorsNoWarnings()
            .click('#btnTestDbConnection');
        }

        ft = ft
          .confirmDialogShouldBeVisible()
          .clickYesDoThis()
          .waitOnElementToBecomeDisabled('#btnTestDbConnection')
          .waitOnElementToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');

        //    b. Verify that the schema information section is displayed
        //       The instruction text should disappear
        ft = ft
          .click('#databaseSchemaTab-link')
          .waitOnElementToBecomeInvisible(
            'span:has-text("To load the schema, please ensure your connection details are configured")',
          );
        //       The picklist for schema objects should become visible
        ft = ft.waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer');
        ft = ft.waitOnElementToBecomeVisible('#btnRefreshDatabaseSchema');
        ft = ft
          .click('#btnRefreshDatabaseSchema')
          .waitOnElementToContainText(
            '#confirmDialog .modal-body', // Specific selector for PrimeNG confirm dialog message
            'This will refresh the Database Schema. Continue?',
          )
          .clickNoDontDoThis()
          .click('#btnRefreshDatabaseSchema');

        ft = ft
          .waitOnElementToContainText(
            '#confirmDialog .modal-body', // Specific selector for PrimeNG confirm dialog message
            'This will refresh the Database Schema. Continue?',
          )
          .clickYesDoThis()
          .waitOnElementToHaveClass(
            '#btnRefreshDatabaseSchema .fa-refresh',
            'fa-spin',
          )
          .waitOnElementNotToHaveClass(
            '#btnRefreshDatabaseSchema .fa-refresh',
            'fa-spin',
          );

        // 5. Close the modal
        ft = ft.click('#btnCloseDbConnectionModal');

        ft = ft.clickAndSelectTableRow(`#${fileNameAndId}`);

        // 6. Clean up: Delete the connection
        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          fileNameAndId,
          dbVendor,
        );
        ft = ft.consoleLog(
          `Successfully tested and cleaned up for vendor: ${dbVendor}`,
        );

        // Stop starter-pack when done
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
        }

        return ft;
      },
    );

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] should successfully test an (NEW) connection for a supported database type`,
      async function ({ beforeAfterEach: firstPage }) {
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS * 3); // Adjusted timeout

        let ft = new FluentTester(firstPage);

        //const dbVendor = ConnectionsTestHelper.getRandomDbVendor();
        ft = ft.consoleLog(
          `Testing (NEW) database connection for randomly selected vendor: ${dbVendor}`,
        );

        // Start starter-pack only for non-sqlite vendors
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
        }

        const connectionName = `NewTestConn-${dbVendor}-${Date.now()}`;
        const kebabConnectionName = _.kebabCase(connectionName);
        const fileNameAndId = `db-${kebabConnectionName}\\.xml`; // For deletion after save

        // 1. Navigate and open the "New Database Connection" modal
        ft = ft.gotoConnections();
        ft = ft
          .waitOnElementToBecomeEnabled('#btnNewDropdown')
          .click('#btnNewDropdown');
        ft = ft
          .waitOnElementToBecomeVisible('#btnNewDatabase')
          .click('#btnNewDatabase');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.waitOnElementToBecomeEnabled('#dbConnectionName'); // Wait for modal to be ready

        // 2. Fill connection details using the reusable helper
        //    (modal remains open, connection not yet saved by modal's OK)
        ft = ConnectionsTestHelper.fillNewDatabaseConnectionDetails(
          ft,
          connectionName,
          dbVendor,
          //kebabConnectionName,
        );

        // 3. First "Test Connection" attempt: Expect "Save first?" dialog, click "No".
        ft = ft.consoleLog(
          'Attempt 1: Click Test. Expect "Save first?" dialog. Click NO.',
        );
        ft = ft
          .waitOnElementToBecomeEnabled('#btnTestDbConnection')
          .click('#btnTestDbConnection');

        if (dbVendor !== 'sqlite') {
          ft = ft.infoDialogShouldBeVisible()
            .clickYesDoThis()
            .click('#btnClearLogsDbConnection')
            .confirmDialogShouldBeVisible()
            .clickYesDoThis()
            .waitOnElementToBecomeDisabled('#btnClearLogsDbConnection')
            .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
            .appStatusShouldBeGreatNoErrorsNoWarnings()
            .click('#btnTestDbConnection');
        }

        ft = ft.waitOnElementToContainText(
          '#confirmDialog .modal-body',
          'The connection must be saved before being able to test it. Save now?',
        );
        ft = ft.clickNoDontDoThis(); // Clicks PrimeNG "No"
        ft = ft.waitOnElementToBecomeInvisible(Constants.BTN_DECLINE_SELECTOR); // PrimeNG No button
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection'); // Ensure main modal is still open

        // 4. Second "Test Connection" attempt: Expect "Save first?" dialog, click "Yes".
        //    This saves the connection and then runs the test.
        ft = ft.consoleLog(
          'Attempt 2: Click Test. Expect "Save first?" dialog. Click YES.',
        );
        ft = ft
          .waitOnElementToBecomeEnabled('#btnTestDbConnection')
          .click('#btnTestDbConnection');
        ft = ft.confirmDialogShouldBeVisible();
        ft = ft.waitOnElementToContainText(
          '#confirmDialog .modal-body',
          'The connection must be saved before being able to test it. Save now?',
        );
        ft = ft.clickYesDoThis(); // Clicks PrimeNG "Yes", triggers save, then test.


        ft = ft.waitOnToastToBecomeVisible(
          'success',
          'Successfully connected to the database', Constants.DELAY_HUNDRED_SECONDS
        );

        // 5. Assertions after "Save first? YES" (connection saved and tested)
        //    Similar to the (EXISTING) test after a successful test.
        ft = ft.consoleLog(
          'Assertions after "Save first? YES": Toast and Schema should appear.',
        );

        // Verify schema information section is displayed
        ft = ft
          .click('#databaseSchemaTab-link') // Ensure the tab is active
          .waitOnElementToBecomeInvisible(
            'span:has-text("To load the schema, please ensure your connection details are configured")',
          );
        ft = ft.waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer');
        ft = ft.waitOnElementToBecomeVisible('#btnRefreshDatabaseSchema');

        // 6. Interact with "Refresh Database Schema" button (similar to EXISTING test)
        ft = ft.consoleLog('Interacting with "Refresh Database Schema" button.');
        ft = ft
          .click('#btnRefreshDatabaseSchema')
          .waitOnElementToContainText(
            '#confirmDialog .modal-body', // PrimeNG confirm dialog message
            'This will refresh the Database Schema. Continue?',
          )
          .clickNoDontDoThis() // Click "No" on the confirmation
          .waitOnElementToBecomeInvisible('#confirmDialog');

        ft = ft
          .click('#btnRefreshDatabaseSchema') // Click "Refresh" again
          .waitOnElementToContainText(
            '#confirmDialog .modal-body',
            'This will refresh the Database Schema. Continue?',
          )
          .clickYesDoThis() // Click "Yes" on the confirmation
          .waitOnElementToHaveClass(
            // Check for spinner
            '#btnRefreshDatabaseSchema .fa-refresh', // Selector for the icon within the button
            'fa-spin',
          )
          .waitOnElementNotToHaveClass(
            // Check spinner disappears
            '#btnRefreshDatabaseSchema .fa-refresh',
            'fa-spin',
          );

        ft = ft.waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer')
          .sleep(Constants.DELAY_ONE_SECOND)
          .click('#toolsTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .waitOnElementToBecomeVisible('#vannaTrainingIncludeDbSchema')
          .waitOnElementToBecomeEnabled('#vannaTrainingIncludeDbSchema')
          .waitOnElementToBecomeVisible('#vannaTrainingIncludeDomainGroupedSchema')
          .waitOnElementToBecomeDisabled('#vannaTrainingIncludeDomainGroupedSchema')
          .waitOnElementToBecomeVisible('#vannaTrainingIncludeErDiagram')
          .waitOnElementToBecomeDisabled('#vannaTrainingIncludeErDiagram')
          .waitOnElementToBecomeVisible('#vannaTrainingIncludeUbiquitousLanguage')
          .waitOnElementToBecomeDisabled('#vannaTrainingIncludeUbiquitousLanguage')
          ; // Ensure picklist is still/again visible

        // 7. Save and Close the modal (using the modal's main OK button as it's a new connection)
        ft = ft.consoleLog('Finalizing: Clicking modal OK to close.');
        ft = ft
          .waitOnElementToBecomeEnabled('#btnOKConfirmationDbConnectionModal')
          .click('#btnOKConfirmationDbConnectionModal');

        // 8. Clean up: Delete the connection from the connections list
        ft = ft.consoleLog('Cleaning up: Deleting the created connection.');
        ft = ft.gotoConnections(); // Ensure on connections page before attempting delete helper
        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          fileNameAndId,
          dbVendor,
        );

        ft = ft.consoleLog(
          `Successfully tested (NEW) connection and cleaned up for vendor: ${dbVendor}`,
        );

        // Stop starter-pack when done
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
        }

        return ft;
      },
    );

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] 'Database Schema' Tab: Loading, Picklist, AI, Refresh, Save Button State (Vendor Agnostic)`,
      async function ({ beforeAfterEach: firstPage }) {
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS); // Generous timeout
        let ft = new FluentTester(firstPage);

        //const dbVendor = ConnectionsTestHelper.getRandomDbVendor();
        ft = ft.consoleLog(
          `STEP 0.0: Testing 'Information Schema' Tab for randomly selected vendor: ${dbVendor}`,
        );

        // Start starter-pack only for non-sqlite vendors
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
        }

        const connectionName = `InfoSchemaTest-${dbVendor}-${Date.now()}`;
        const dbConnectionFileNameAndId = `db-${_.kebabCase(connectionName)}\\.xml`;

        // --- STEP 0.1: Setup - Create and Test a new connection for the random vendor ---
        // This helper needs to ensure the connection is viable for schema fetching.
        // It will internally handle creating a test DB (like Northwind for SQLite) or
        // using appropriate connection strings for other vendors.
        ft = ft.gotoConnections();
        ft = ft
          .waitOnElementToBecomeEnabled('#btnNewDropdown')
          .click('#btnNewDropdown');
        ft = ft
          .waitOnElementToBecomeVisible('#btnNewDatabase')
          .click('#btnNewDatabase');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.waitOnElementToBecomeEnabled('#dbConnectionName'); // Wait for modal to be ready

        ft = ft.elementShouldBeDisabled('#btnTestDbConnection');
        ft = ft
          .click('#databaseSchemaTab-link')
          .waitOnElementToBecomeVisible('#schemaNotLoadedDatabaseSchema')
          .click('#domainGroupedDatabaseSchemaTab-link')
          .waitOnElementToBecomeVisible('#schemaNotLoadedDomainGroupedSchema')
          .click('#databaseDiagramTab-link')
          .waitOnElementToBecomeVisible('#schemaNotLoadedERDiagram')
          .click('#toolsTab-link')
          .waitOnElementToBecomeVisible('#schemaNotLoadedChat2DB')
          .click('#connectionDetailsTab-link')
          .waitOnElementToBecomeEnabled('#dbConnectionName');

        ft = ft.consoleLog(
          `STEP 0.1: Setting up new connection '${connectionName}' for vendor ${dbVendor}.`,
        );
        ft = ConnectionsTestHelper.fillNewDatabaseConnectionDetails(
          ft,
          connectionName,
          dbVendor,
          //kebabConnectionName,
        );

        // 3. First "Test Connection" attempt: Expect "Save first?" dialog, click "No".
        ft = ft
          .waitOnElementToBecomeEnabled('#btnTestDbConnection')
          .click('#btnTestDbConnection');

        if (dbVendor !== 'sqlite') {
          ft = ft.infoDialogShouldBeVisible()
            .clickYesDoThis()
            .click('#btnClearLogsDbConnection')
            .confirmDialogShouldBeVisible()
            .clickYesDoThis()
            .waitOnElementToBecomeDisabled('#btnClearLogsDbConnection')
            .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
            .appStatusShouldBeGreatNoErrorsNoWarnings()
            .click('#btnTestDbConnection');
        }

        ft = ft
          .waitOnElementToContainText(
            '#confirmDialog .modal-body',
            'The connection must be saved before being able to test it. Save now?',
          )
          .elementShouldNotHaveClass('#btnTestDbConnectionIcon', 'fa-spin');

        ft = ft
          .clickYesDoThis() // Clicks PrimeNG "Yes", triggers save, then test.
          .waitOnElementToHaveClass('#btnTestDbConnectionIcon', 'fa-spin')
          .waitOnElementNotToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');

        // --- STEP 1: Navigate to 'Information Schema' Tab & Initial Assertions ---
        ft = ft.consoleLog(
          'STEP 1: Navigating to Information Schema tab and performing initial assertions.',
        );
        ft = ft.click('#databaseSchemaTab-link');
        ft = ft.waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer');

        ft = ft.waitOnElementToBecomeEnabled(
          '#btnOKConfirmationDbConnectionModal',
        );

        ft = ft.waitOnElementToBecomeVisible('#chooseTableLabelDbSchema');
        ft = ft.waitOnElementToBecomeDisabled('#btnGenerateWithAIDbSchema');

        //right is empty
        ft = ft.waitOnElementToBecomeVisible(
          '#targetTreedatabaseSchemaPicklist .p-tree-empty-message',
        );
        ft = ft.elementShouldNotBeVisible(
          '#sourceTreedatabaseSchemaPicklist .p-tree-empty-message',
        );

        //left is populated with schema objects
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        ft = ft.consoleLog('STEP 2: Test Picklist Functionality');
        //Test 'Searching' Type "Test" into the search filter
        ft = ft.setValue('#filterInputsourceTreedatabaseSchemaPicklist', 'Test');

        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        ft = ft.setValue('#filterInputsourceTreedatabaseSchemaPicklist', '');

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        ft = ft.setValue(
          '#filterInputsourceTreedatabaseSchemaPicklist',
          'Products',
        );

        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        ft = ft.setValue('#filterInputsourceTreedatabaseSchemaPicklist', '');

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        // Test all 4x picklist buttons
        ft = ft.click('#treeNodeCategoriessourceTreedatabaseSchemaPicklist');
        ft = ft.click('#treeNodeProductssourceTreedatabaseSchemaPicklist');

        ft = ft.click('#btnMoveToTargetdatabaseSchemaPicklist');

        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeCategoriestargetTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeProductstargetTreedatabaseSchemaPicklist',
        );

        ft = ft.click('#treeNodeCategoriestargetTreedatabaseSchemaPicklist');
        ft = ft.click('#treeNodeProductstargetTreedatabaseSchemaPicklist');

        ft = ft.click('#btnMoveToSourcedatabaseSchemaPicklist');

        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeCategoriestargetTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeProductstargetTreedatabaseSchemaPicklist',
        );

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        ft = ft.click('#btnMoveAllToTargetdatabaseSchemaPicklist');

        ft = ft.waitOnElementToBecomeInvisible('#chooseTableLabelDbSchema');
        ft = ft.waitOnElementToBecomeEnabled('#btnGenerateWithAIDbSchema');

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeCategoriestargetTreedatabaseSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#sourceTreedatabaseSchemaPicklist .p-tree-empty-message',
        );

        ft = ft.click('#btnMoveAllToSourcedatabaseSchemaPicklist');

        ft = ft.waitOnElementToBecomeVisible('#chooseTableLabelDbSchema');
        ft = ft.waitOnElementToBecomeDisabled('#btnGenerateWithAIDbSchema');

        ft = ft.waitOnElementToBecomeInvisible(
          '#sourceTreedatabaseSchemaPicklist .p-tree-empty-message',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeCategoriessourceTreedatabaseSchemaPicklist',
        );

        ft = ft.waitOnElementToBecomeVisible(
          '#targetTreedatabaseSchemaPicklist .p-tree-empty-message',
        );

        ft = ft.consoleLog('STEP 3: Testing AI Copilot integration');

        ft = ft.click('#treeNodeProductssourceTreedatabaseSchemaPicklist');
        ft = ft.click('#btnMoveToTargetdatabaseSchemaPicklist');

        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodeProductssourceTreedatabaseSchemaPicklist',
        );

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodeProductstargetTreedatabaseSchemaPicklist',
        );

        ft = ft.waitOnElementToBecomeInvisible('#chooseTableLabelDbSchema');
        ft = ft.waitOnElementToBecomeEnabled('#btnGenerateWithAIDbSchema');

        ft = ft.click('#btnGenerateWithAIDbSchema');
        ft = ft.waitOnElementToBecomeVisible('#btnCopyPromptText');

        ft = ft
          .click('#btnCopyPromptText')
          .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
          .click('.dburst-button-question-confirm')
          .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

        ft = ft.clipboardShouldContainText('You are an expert SQL Developer');

        ft = ft.clipboardShouldContainText('"tableName": "Products"');
        ft = ft.clipboardShouldContainText('"columnName": "Discontinued"');

        ft = ft
          .click('#btnCloseAiCopilotModal')
          .waitOnElementToBecomeInvisible('#btnCopyPromptText')
          .click('#btnCloseDbConnectionModal');

        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          dbConnectionFileNameAndId,
          dbVendor,
        );

        // Stop starter-pack when done
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
        }

        return ft;
      },
    );

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] 'Domain-Grouped Schema' Tab: Functionality, AI Schema Gen, JSON Edit, Picklist, AI SQL Gen (Vendor Agnostic)`,
      async function ({ beforeAfterEach: firstPage }) {
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS); // Generous timeout
        let ft = new FluentTester(firstPage);

        //const dbVendor = ConnectionsTestHelper.getRandomDbVendor();
        ft = ft.consoleLog(
          `STEP 0.0: Testing 'Domain-Grouped Schema' Tab for randomly selected vendor: ${dbVendor}`,
        );

        // Start starter-pack only for non-sqlite vendors
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
        }

        const connectionName = `DomainSchemaTest-${dbVendor}-${Date.now()}`;
        const dbConnectionFileNameAndId = `db-${_.kebabCase(connectionName)}\\.xml`;

        // --- STEP 0.1: Setup - Create a new connection for the random vendor (DO NOT TEST YET) ---
        ft = ft.gotoConnections();
        ft = ft
          .waitOnElementToBecomeEnabled('#btnNewDropdown')
          .click('#btnNewDropdown');
        ft = ft
          .waitOnElementToBecomeVisible('#btnNewDatabase')
          .click('#btnNewDatabase');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.waitOnElementToBecomeEnabled('#dbConnectionName');

        ft = ft.consoleLog(
          `STEP 0.1: Setting up new connection '${connectionName}' for vendor ${dbVendor}.`,
        );
        ft = ConnectionsTestHelper.fillNewDatabaseConnectionDetails(
          ft,
          connectionName,
          dbVendor,
          //kebabConnectionName,
        );

        // 3. First "Test Connection" attempt: Expect "Save first?" dialog, click "No".
        ft = ft
          .waitOnElementToBecomeEnabled('#btnTestDbConnection')
          .click('#btnTestDbConnection');

        if (dbVendor !== 'sqlite') {
          ft = ft.infoDialogShouldBeVisible()
            .clickYesDoThis()
            .click('#btnClearLogsDbConnection')
            .confirmDialogShouldBeVisible()
            .clickYesDoThis()
            .waitOnElementToBecomeDisabled('#btnClearLogsDbConnection')
            .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
            .appStatusShouldBeGreatNoErrorsNoWarnings()
            .click('#btnTestDbConnection');
        }

        ft = ft
          .waitOnElementToContainText(
            '#confirmDialog .modal-body',
            'The connection must be saved before being able to test it. Save now?',
          )
          .elementShouldNotHaveClass('#btnTestDbConnectionIcon', 'fa-spin');

        ft = ft
          .clickYesDoThis() // Clicks PrimeNG "Yes", triggers save, then test.
          .waitOnElementToHaveClass('#btnTestDbConnectionIcon', 'fa-spin')
          .waitOnElementNotToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');

        ft = ft
          .click('#domainGroupedDatabaseSchemaTab-link')
          .waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist')
          .waitOnElementToBecomeEnabled('#btnToggleDomainGroupedCodeView')
          .waitOnElementToBecomeEnabled('#btnGenerateWithAIDomainGroupedSchema')
          .click('#btnToggleDomainGroupedCodeView')
          .waitOnElementToBecomeInvisible('#domainGroupedSchemaPicklist')
          .waitOnElementToBecomeVisible('#domainGroupedCodeEditor')
          .click('#btnToggleDomainGroupedCodeView')
          .waitOnElementToBecomeInvisible('#domainGroupedCodeEditor')
          .waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist');

        ft = ft
          .click('#btnGenerateWithAIDomainGroupedSchema')
          .waitOnElementToBecomeVisible('#btnCopyPromptText')
          .click('#btnCopyPromptText')
          .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
          .click('.dburst-button-question-confirm')
          .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

        ft = ft.clipboardShouldContainText(
          'You are an expert Database Modeler and Data Architect.',
        );

        ft = ft.clipboardShouldContainText('"tableName": "Order Details"');
        ft = ft
          .clipboardShouldContainText('"columnName": "UnitPrice"')
          .click('#btnCloseAiCopilotModal')
          .waitOnElementToBecomeInvisible('#btnCopyPromptText');

        const northwindDomainGroupedSchemaExample = `{
  "originalSchema": [
    {
      "tableName": "Customers",
      "columns": [
        { "name": "CustomerID", "dataType": "NCHAR(5)", "isPrimaryKey": true },
        { "name": "CompanyName", "dataType": "NVARCHAR(40)" },
        { "name": "ContactName", "dataType": "NVARCHAR(30)" },
        { "name": "Country", "dataType": "NVARCHAR(15)" }
      ]
    },
    {
      "tableName": "Orders",
      "columns": [
        { "name": "OrderID", "dataType": "INT", "isPrimaryKey": true },
        { "name": "CustomerID", "dataType": "NCHAR(5)", "isForeignKey": true, "references": "Customers" },
        { "name": "OrderDate", "dataType": "DATETIME" },
        { "name": "ShipCountry", "dataType": "NVARCHAR(15)" }
      ]
    },
    {
      "tableName": "Order Details",
      "columns": [
        { "name": "OrderID", "dataType": "INT", "isPrimaryKey": true, "isForeignKey": true, "references": "Orders" },
        { "name": "ProductID", "dataType": "INT", "isPrimaryKey": true, "isForeignKey": true, "references": "Products" },
        { "name": "UnitPrice", "dataType": "MONEY" },
        { "name": "Quantity", "dataType": "SMALLINT" }
      ]
    },
    {
      "tableName": "Products",
      "columns": [
        { "name": "ProductID", "dataType": "INT", "isPrimaryKey": true },
        { "name": "ProductName", "dataType": "NVARCHAR(40)" },
        { "name": "SupplierID", "dataType": "INT", "isForeignKey": true, "references": "Suppliers" },
        { "name": "CategoryID", "dataType": "INT", "isForeignKey": true, "references": "Categories" },
        { "name": "UnitPrice", "dataType": "MONEY" }
      ]
    },
    {
      "tableName": "Categories",
      "columns": [
        { "name": "CategoryID", "dataType": "INT", "isPrimaryKey": true },
        { "name": "CategoryName", "dataType": "NVARCHAR(15)" },
        { "name": "Description", "dataType": "NTEXT" }
      ]
    }
  ],
  "domainGroupedSchema": [
    {
      "label": "Customer Management",
      "children": [
        {
          "tableName": "Customers",
          "columns": [
            { "name": "CustomerID", "dataType": "NCHAR(5)", "isPrimaryKey": true },
            { "name": "CompanyName", "dataType": "NVARCHAR(40)" },
            { "name": "ContactName", "dataType": "NVARCHAR(30)" },
            { "name": "Country", "dataType": "NVARCHAR(15)" }
          ]
        }
      ]
    },
    {
      "label": "Sales & Orders",
      "children": [
        {
          "tableName": "Orders",
          "columns": [
            { "name": "OrderID", "dataType": "INT", "isPrimaryKey": true },
            { "name": "CustomerID", "dataType": "NCHAR(5)", "isForeignKey": true, "references": "Customers" },
            { "name": "OrderDate", "dataType": "DATETIME" },
            { "name": "ShipCountry", "dataType": "NVARCHAR(15)" }
          ]
        },
        {
          "tableName": "Order Details",
          "columns": [
            { "name": "OrderID", "dataType": "INT", "isPrimaryKey": true, "isForeignKey": true, "references": "Orders" },
            { "name": "ProductID", "dataType": "INT", "isPrimaryKey": true, "isForeignKey": true, "references": "Products" },
            { "name": "UnitPrice", "dataType": "MONEY" },
            { "name": "Quantity", "dataType": "SMALLINT" }
          ]
        }
      ]
    },
    {
      "label": "Product Catalog",
      "children": [
        {
          "tableName": "Products",
          "columns": [
            { "name": "ProductID", "dataType": "INT", "isPrimaryKey": true },
            { "name": "ProductName", "dataType": "NVARCHAR(40)" },
            { "name": "SupplierID", "dataType": "INT", "isForeignKey": true, "references": "Suppliers" },
            { "name": "CategoryID", "dataType": "INT", "isForeignKey": true, "references": "Categories" },
            { "name": "UnitPrice", "dataType": "MONEY" }
          ]
        },
        {
          "tableName": "Categories",
          "columns": [
            { "name": "CategoryID", "dataType": "INT", "isPrimaryKey": true },
            { "name": "CategoryName", "dataType": "NVARCHAR(15)" },
            { "name": "Description", "dataType": "NTEXT" }
          ]
        }
      ]
    }
  ]
}`;

        //set the Domain-Grouped Schema Editor content
        ft = ft
          .click('#btnToggleDomainGroupedCodeView')
          .waitOnElementToBecomeInvisible('#domainGroupedSchemaPicklist')
          .waitOnElementToBecomeVisible('#domainGroupedCodeEditor')
          .waitOnElementToBecomeEnabled('#domainGroupedCodeEditor')
          .setCodeJarContentSingleShot(
            '#domainGroupedCodeEditor',
            northwindDomainGroupedSchemaExample,
          )
          .click('#btnToggleDomainGroupedCodeView')
          .waitOnElementToBecomeInvisible('#domainGroupedCodeEditor')
          .waitOnElementToBecomeInvisible('#btnGenerateWithAIDomainGroupedSchema')
          .waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist')
          .waitOnElementToBecomeVisible(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          )
          .waitOnElementToBecomeVisible('#btnToggleDomainGroupedCodeViewDropdown')
          .click('#btnToggleDomainGroupedCodeViewDropdown')
          .waitOnElementToBecomeVisible('#liAToggleDomainGroupedCodeView')
          .waitOnElementToBecomeEnabled('#liAToggleDomainGroupedCodeView')
          .click('#liAToggleDomainGroupedCodeView')
          .waitOnElementToBecomeInvisible('#domainGroupedSchemaPicklist')
          .waitOnElementToBecomeEnabled('#domainGroupedCodeEditor')
          .waitOnElementToBecomeEnabled('#btnToggleDomainGroupedCodeView')
          .click('#btnToggleDomainGroupedCodeView')
          .waitOnElementToBecomeInvisible('#domainGroupedCodeEditor')
          .waitOnElementToBecomeInvisible('#btnGenerateWithAIDomainGroupedSchema')
          .waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist')
          .waitOnElementToBecomeVisible(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          );

        //save the Domain-Grouped Schema
        ft = ft
          .click('#btnOKConfirmationDbConnectionModal')
          .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');

        ft = ft
          .gotoConnections()
          .waitOnElementToHaveText(
            `#${dbConnectionFileNameAndId} td:first-child`,
            connectionName,
          )
          .clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`)
          .waitOnElementToBecomeEnabled('#btnEdit')
          .click('#btnEdit')
          .waitOnElementToBecomeVisible('#dbConnectionName')
          .inputShouldHaveValue('#dbConnectionName', connectionName) // Ensure on connections page before attempting delete helper
          .click('#databaseSchemaTab-link')
          .waitOnElementToBecomeVisible('#chooseTableLabelDomainGroupedSchema')
          .waitOnElementToBecomeDisabled(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          )
          .waitOnElementToBecomeVisible(
            '#treeNodeCustomerDemographicssourceTreedatabaseSchemaPicklist',
          )
          .click('#domainGroupedDatabaseSchemaTab-link')
          .waitOnElementToBecomeVisible(
            '#treeNodedomain_Sales_\\&_OrderssourceTreedomainGroupedSchemaPicklist',
          );

        // Test all 4x picklist buttons and AI SQL Gen for Domain-Grouped Schema
        ft = ft.consoleLog(
          'STEP X: Testing Domain-Grouped Schema Picklist (Domain-Level Selection) and AI SQL Generation',
        );

        // Ensure the picklist is visible and populated.
        // The domainGroupedSchemaExists should be true at this point.
        ft = ft.waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist');
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Customer_ManagementsourceTreedomainGroupedSchemaPicklist',
        ).click(
          '#treeNodedomain_Customer_ManagementsourceTreedomainGroupedSchemaPicklist',
        ).consoleLog(
          'STEP X.1: Moving "Customer Management" domain to Target',
        );

        // Click "Move to Target" button
        ft = ft.click('#btnMoveToTargetdomainGroupedSchemaPicklist');

        // Verify "Customer Management" domain (and its children like "Customers" table) is no longer in source
        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodedomain_Customer_ManagementsourceTreedomainGroupedSchemaPicklist',
        );

        // Verify "Customer Management" domain and its child "Customers" table are in target, preserving hierarchy
        ft = ft
          .waitOnElementToBecomeVisible(
            '#treeNodedomain_Customer_ManagementtargetTreedomainGroupedSchemaPicklist',
          )
          .waitOnElementToBecomeInvisible('#chooseTableLabelDomainGroupedSchema')
          .waitOnElementToBecomeEnabled(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          );

        // --- Test 2: Move selected Domain Group ("Customer Management") back to Source ---
        ft = ft.consoleLog(
          'STEP X.2: Moving "Customer Management" domain back to Source',
        );

        // Select "Customer Management" domain in the target list
        ft = ft.click(
          '#treeNodedomain_Customer_ManagementtargetTreedomainGroupedSchemaPicklist',
        );

        // Click "Move to Source" button
        ft = ft.click('#btnMoveToSourcedomainGroupedSchemaPicklist');

        // Verify "Customer Management" domain (and its children) is no longer in target
        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodedomain_Customer_ManagementtargetTreedomainGroupedSchemaPicklist',
        );

        // Verify "Customer Management" domain and its child "Customers" table are back in source
        ft = ft
          .waitOnElementToBecomeVisible(
            '#treeNodedomain_Customer_ManagementsourceTreedomainGroupedSchemaPicklist',
          )
          .waitOnElementToBecomeVisible('#chooseTableLabelDomainGroupedSchema')
          .waitOnElementToBecomeDisabled(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          );

        // --- Test 3: Move All Domain Groups to Target ---
        ft = ft.consoleLog('STEP X.3: Moving all domain groups to Target');
        ft = ft.click('#btnMoveAllToTargetdomainGroupedSchemaPicklist');

        // Verify source list is empty
        ft = ft.waitOnElementToBecomeVisible(
          '#sourceTreedomainGroupedSchemaPicklist .p-tree-empty-message',
        );

        // Verify all domain groups and their children are in target
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Customer_ManagementtargetTreedomainGroupedSchemaPicklist',
        );

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Sales_\\&_OrderstargetTreedomainGroupedSchemaPicklist',
        ); // Escaped '&'

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Product_CatalogtargetTreedomainGroupedSchemaPicklist',
        );

        ft = ft
          .waitOnElementToBecomeInvisible('#chooseTableLabelDomainGroupedSchema')
          .waitOnElementToBecomeEnabled(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          );

        // --- Test 4: Move All Domain Groups back to Source ---
        ft = ft.consoleLog('STEP X.4: Moving all domain groups back to Source');
        ft = ft.click('#btnMoveAllToSourcedomainGroupedSchemaPicklist');

        // Verify target list is empty
        ft = ft.waitOnElementToBecomeVisible(
          '#targetTreedomainGroupedSchemaPicklist .p-tree-empty-message',
        );

        // Verify source list has all domain groups and children again
        ft = ft.waitOnElementToBecomeInvisible(
          '#sourceTreedomainGroupedSchemaPicklist .p-tree-empty-message',
        );

        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Customer_ManagementsourceTreedomainGroupedSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Sales_\\&_OrderssourceTreedomainGroupedSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Product_CatalogsourceTreedomainGroupedSchemaPicklist',
        );

        ft = ft
          .waitOnElementToBecomeVisible('#chooseTableLabelDomainGroupedSchema')
          .waitOnElementToBecomeDisabled(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          );

        // --- Test 5: AI Copilot SQL Generation with a selected Domain Group ---
        ft = ft.consoleLog(
          'STEP X.5: Testing AI Copilot SQL Generation with "Sales & Orders" domain',
        );

        // Move "Sales & Orders" domain to the target list
        ft = ft.click(
          '#treeNodedomain_Sales_\\&_OrderssourceTreedomainGroupedSchemaPicklist',
        );
        ft = ft.click('#btnMoveToTargetdomainGroupedSchemaPicklist');
        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodedomain_Sales_\\&_OrderssourceTreedomainGroupedSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Sales_\\&_OrderstargetTreedomainGroupedSchemaPicklist',
        );

        ft = ft
          .waitOnElementToBecomeInvisible('#chooseTableLabelDomainGroupedSchema')
          .waitOnElementToBecomeEnabled(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          );

        // Click the "Generate SQL Query with Help From AI" button
        // This ID is used when domainGroupedSchemaExists is true
        ft = ft.click('#btnGenerateSqlQueryWithAIDomainGroupedSchema');

        ft = ft.waitOnElementToBecomeVisible('#btnCopyPromptText');

        // Verify clipboard content for SQL Generation prompt
        ft = ft
          .click('#btnCopyPromptText')
          .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
          .click('.dburst-button-question-confirm')
          .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

        ft = ft.clipboardShouldContainText('You are an expert SQL Developer');
        // Check for tables from "Sales & Orders" domain
        ft = ft.clipboardShouldContainText('"tableName": "Orders"');
        ft = ft.clipboardShouldContainText('"tableName": "Order Details"');
        // Check for a column from each table
        ft = ft.clipboardShouldContainText('"columnName": "OrderDate"'); // From Orders table
        ft = ft.clipboardShouldContainText('"columnName": "UnitPrice"'); // From Order Details table

        ft = ft
          .click('#btnCloseAiCopilotModal')
          .waitOnElementToBecomeInvisible('#btnCopyPromptText');

        // Clean up: move "Sales & Orders" back to source for subsequent tests if any
        // Ensure it's selected in target to be moved
        ft = ft.click(
          '#treeNodedomain_Sales_\\&_OrderstargetTreedomainGroupedSchemaPicklist',
        );
        ft = ft.click('#btnMoveToSourcedomainGroupedSchemaPicklist');
        ft = ft.waitOnElementToBecomeInvisible(
          '#treeNodedomain_Sales_\\&_OrderstargetTreedomainGroupedSchemaPicklist',
        );
        ft = ft.waitOnElementToBecomeVisible(
          '#treeNodedomain_Sales_\\&_OrderssourceTreedomainGroupedSchemaPicklist',
        );

        // AI button should be disabled again, and label visible
        ft = ft
          .waitOnElementToBecomeVisible('#chooseTableLabelDomainGroupedSchema')
          .waitOnElementToBecomeDisabled(
            '#btnGenerateSqlQueryWithAIDomainGroupedSchema',
          );

        ft = ft
          .sleep(Constants.DELAY_ONE_SECOND)
          .click('#toolsTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .waitOnElementToBecomeVisible('#vannaTrainingIncludeDomainGroupedSchema')
          .waitOnElementToBecomeEnabled('#vannaTrainingIncludeDomainGroupedSchema')
          .click('#btnCloseDbConnectionModal')
          .waitOnElementToBecomeInvisible('#btnCloseDbConnectionModal');

        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          dbConnectionFileNameAndId,
          dbVendor,
        );

        // Stop starter-pack when done
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
        }

        return ft;
      },
    );

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] 'ER Diagram' Tab: Functionality, Edit, Save, Load, AI (Vendor Agnostic)`,
      async function ({ beforeAfterEach: firstPage }) {
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS * 3); // Generous timeout
        let ft = new FluentTester(firstPage);

        //const dbVendor = ConnectionsTestHelper.getRandomDbVendor();
        ft = ft.consoleLog(
          `STEP 0.0: Testing 'ER Diagram' Tab with vendor: ${dbVendor}`,
        );

        // Start starter-pack only for non-sqlite vendors
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
        }

        const connectionName = `ErDiagramTest-${dbVendor}-${Date.now()}`;
        const kebabConnectionName = _.kebabCase(connectionName);
        const dbConnectionFileNameAndId = `db-${kebabConnectionName}\\.xml`;
        const connectionCode = `db-${kebabConnectionName}`;

        // --- STEP 0.1: Setup - Create a new connection ---
        ft = ft.consoleLog(
          `STEP 0.1: Setting up new connection '${connectionName}' for vendor ${dbVendor}.`,
        );

        // --- STEP 0.1: Setup - Create a new connection for the random vendor (DO NOT TEST YET) ---
        ft = ft.gotoConnections();
        ft = ft
          .waitOnElementToBecomeEnabled('#btnNewDropdown')
          .click('#btnNewDropdown');
        ft = ft
          .waitOnElementToBecomeVisible('#btnNewDatabase')
          .click('#btnNewDatabase');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.waitOnElementToBecomeEnabled('#dbConnectionName');

        ft = ft.consoleLog(
          `STEP 0.1: Setting up new connection '${connectionName}' for vendor ${dbVendor}.`,
        );
        ft = ConnectionsTestHelper.fillNewDatabaseConnectionDetails(
          ft,
          connectionName,
          dbVendor,
          //kebabConnectionName,
        );

        ft = ft
          .click('#databaseSchemaTab-link')
          .waitOnElementToBecomeVisible('#schemaNotLoadedDatabaseSchema')
          .click('#domainGroupedDatabaseSchemaTab-link')
          .waitOnElementToBecomeVisible('#schemaNotLoadedDomainGroupedSchema')
          .click('#databaseDiagramTab-link')
          .waitOnElementToBecomeVisible('#schemaNotLoadedERDiagram')
          .click('#connectionDetailsTab-link')
          .waitOnElementToBecomeEnabled('#dbConnectionName');

        // 3. First "Test Connection" attempt: Expect "Save first?" dialog, click "No".
        ft = ft
          .waitOnElementToBecomeEnabled('#btnTestDbConnection')
          .click('#btnTestDbConnection');

        if (dbVendor !== 'sqlite') {
          ft = ft.infoDialogShouldBeVisible()
            .clickYesDoThis()
            .click('#btnClearLogsDbConnection')
            .confirmDialogShouldBeVisible()
            .clickYesDoThis()
            .waitOnElementToBecomeDisabled('#btnClearLogsDbConnection')
            .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
            .appStatusShouldBeGreatNoErrorsNoWarnings()
            .click('#btnTestDbConnection');
        }

        ft = ft
          .waitOnElementToContainText(
            '#confirmDialog .modal-body',
            'The connection must be saved before being able to test it. Save now?',
          )
          .elementShouldNotHaveClass('#btnTestDbConnectionIcon', 'fa-spin');

        ft = ft
          .clickYesDoThis() // Clicks PrimeNG "Yes", triggers save, then test.
          .waitOnElementToHaveClass('#btnTestDbConnectionIcon', 'fa-spin')
          .waitOnElementNotToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');

        ft = ft
          .sleep(Constants.DELAY_ONE_SECOND)
          .click('#databaseDiagramTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .waitOnElementToBecomeVisible('#noErDiagramAvailable')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeVisible('#btnGenerateWithAIErDiagram')
          .elementShouldBeDisabled('#btnDatabaseDiagramViewInBrowser')
          .click('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramViewDiagram')
          .click('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode');

        // Click the "Generate SQL Query with Help From AI" button
        // This ID is used when domainGroupedSchemaExists is true
        ft = ft.click('#btnGenerateWithAIErDiagram');

        ft = ft.waitOnElementToBecomeVisible('#btnCopyPromptText');

        // Verify clipboard content for SQL Generation prompt
        ft = ft
          .click('#btnCopyPromptText')
          .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
          .click('.dburst-button-question-confirm')
          .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

        ft = ft.clipboardShouldContainText(
          'You are an expert Database Modeler and Visual Designer specializing in Entity-Relationship (ER) diagrams using PlantUML.',
        );
        // Check for tables from "Sales & Orders" domain
        ft = ft.clipboardShouldContainText('"tableName": "CustomerDemographics"');
        ft = ft.clipboardShouldContainText('"tableName": "Customers"');
        // Check for a column from each table
        ft = ft.clipboardShouldContainText('"columnName": "Fax"'); // From Orders table
        ft = ft.clipboardShouldContainText('"columnName": "ContactTitle"'); // From Order Details table

        ft = ft
          .click('#btnCloseAiCopilotModal')
          .waitOnElementToBecomeInvisible('#btnCopyPromptText');

        const erDiagramPuml = `@startuml
entity "Categories" {
  +CategoryID : INTEGER
  CategoryName : VARCHAR
  Description : CLOB
  Picture : BLOB
}
entity "CustomerCustomerDemo" {
  +CustomerID : VARCHAR
  +CustomerTypeID : VARCHAR
}
entity "CustomerDemographics" {
  +CustomerTypeID : VARCHAR
  CustomerDesc : CLOB
}
entity "Customers" {
  +CustomerID : VARCHAR
  PostalCode : VARCHAR
  City : VARCHAR
  Country : VARCHAR
  Region : VARCHAR
  Fax : VARCHAR
  Phone : VARCHAR
  ContactName : VARCHAR
  ContactTitle : VARCHAR
  CompanyName : VARCHAR
  Address : VARCHAR
  Email : VARCHAR
}
entity "EmployeeTerritories" {
  +EmployeeID : INTEGER
  +TerritoryID : VARCHAR
}
entity "Employees" {
  BirthDate : DATE
  +EmployeeID : INTEGER
  Extension : VARCHAR
  HireDate : DATE
  ReportsTo : INTEGER
  FirstName : VARCHAR
  PostalCode : VARCHAR
  City : VARCHAR
  Country : VARCHAR
  Region : VARCHAR
  LastName : VARCHAR
  HomePhone : VARCHAR
  Mobile : VARCHAR
  TitleOfCourtesy : VARCHAR
  Title : VARCHAR
  Address : VARCHAR
  Email : VARCHAR
  Notes : CLOB
  Photo : BLOB
  PhotoPath : VARCHAR
}
entity "Order Details" {
  Discount : NUMERIC
  +OrderID : INTEGER
  +ProductID : INTEGER
  Quantity : SMALLINT
  UnitPrice : NUMERIC
}
entity "Orders" {
  EmployeeID : INTEGER
  Freight : NUMERIC
  +OrderID : INTEGER
  ShipVia : INTEGER
  CustomerID : VARCHAR
  OrderDate : TIMESTAMP
  RequiredDate : TIMESTAMP
  ShippedDate : TIMESTAMP
  ShipPostalCode : VARCHAR
  ShipCity : VARCHAR
  ShipCountry : VARCHAR
  ShipRegion : VARCHAR
  ShipName : VARCHAR
  ShipAddress : VARCHAR
}
entity "Products" {
  CategoryID : INTEGER
  Discontinued : BOOLEAN
  +ProductID : INTEGER
  ReorderLevel : SMALLINT
  SupplierID : INTEGER
  UnitPrice : NUMERIC
  UnitsInStock : SMALLINT
  UnitsOnOrder : SMALLINT
  QuantityPerUnit : VARCHAR
  ProductName : VARCHAR
}
entity "Region" {
  +RegionID : INTEGER
  RegionDescription : VARCHAR
}
entity "Shippers" {
  +ShipperID : INTEGER
  Phone : VARCHAR
  CompanyName : VARCHAR
}
entity "Suppliers" {
  +SupplierID : INTEGER
  PostalCode : VARCHAR
  City : VARCHAR
  Country : VARCHAR
  Region : VARCHAR
  Fax : VARCHAR
  Phone : VARCHAR
  ContactName : VARCHAR
  ContactTitle : VARCHAR
  CompanyName : VARCHAR
  Address : VARCHAR
  Email : VARCHAR
  HomePage : CLOB
}
entity "Territories" {
  RegionID : INTEGER
  +TerritoryID : VARCHAR
  TerritoryDescription : VARCHAR
}

Orders }o--|| Customers : "CustomerID"
Orders }o--|| Employees : "EmployeeID"
Orders }o--|| Shippers : "ShipVia"
"Order Details" }|--|| Orders : "OrderID"
"Order Details" }|--|| Products : "ProductID"
Products }o--|| Categories : "CategoryID"
Products }o--|| Suppliers : "SupplierID"
Employees }o--|| Employees : "ReportsTo"
EmployeeTerritories }|--|| Employees : "EmployeeID"
EmployeeTerritories }|--|| Territories : "TerritoryID"
Territories }|--|| Region : "RegionID"
CustomerCustomerDemo }|--|| Customers : "CustomerID"
CustomerCustomerDemo }|--|| CustomerDemographics : "CustomerTypeID"
@enduml`;

        ft = ft
          .elementShouldBeDisabled('#btnDatabaseDiagramViewInBrowser')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeEnabled('#btnDatabaseDiagramShowCode')
          .click('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeVisible('#plantUmlEditor')
          .waitOnElementToBecomeEnabled('#plantUmlEditor')
          .setCodeJarContentSingleShot('#plantUmlEditor', erDiagramPuml)
          .click('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeInvisible('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeInvisible('#plantUmlEditor')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramViewInBrowserLink')
          .waitOnElementToBecomeEnabled('#btnDatabaseDiagramShowCode')
          .click('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeInvisible('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeEnabled('#plantUmlEditor')
          .click('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeInvisible('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeInvisible('#plantUmlEditor');

        // Save the ER Diagram
        ft = ft
          .click('#btnOKConfirmationDbConnectionModal')
          .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');

        ft = ft
          .gotoConnections()
          .waitOnElementToHaveText(
            `#${dbConnectionFileNameAndId} td:first-child`,
            connectionName,
          )
          .clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`)
          .waitOnElementToBecomeEnabled('#btnEdit')
          .click('#btnEdit')
          .waitOnElementToBecomeVisible('#ibmDb2Label')
          .waitOnElementToBecomeVisible('#dbConnectionName')
          .inputShouldHaveValue('#dbConnectionName', connectionName) // Ensure on connections page before attempting delete helper
          .waitOnElementToBecomeVisible('#databaseDiagramTab-link')
          .waitOnElementToBecomeEnabled('#databaseDiagramTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .click('#databaseDiagramTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .waitOnElementToBecomeVisible('#plantUmlDiagram')
          .waitOnElementToBecomeEnabled('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeEnabled('#btnDatabaseDiagramViewInBrowserLink')
          .waitOnElementToBecomeEnabled('#btnGenerateWithAIErDiagram')
          .elementShouldHaveClass('#btnGenerateWithAIErDiagram', 'btn-default')
          .click('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeInvisible('#btnDatabaseDiagramShowCode')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeEnabled('#plantUmlEditor')
          .codeJarShouldContainText(
            '#plantUmlEditor',
            '"Order Details" }|--|| Orders : "OrderID"',
          )
          .click('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeInvisible('#btnDatabaseDiagramViewDiagram')
          .waitOnElementToBecomeInvisible('#plantUmlEditor')
          .waitOnElementToBecomeVisible('#btnDatabaseDiagramViewInBrowserLink')
          .sleep(Constants.DELAY_ONE_SECOND)
          .click('#toolsTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .waitOnElementToBecomeVisible('#vannaTrainingIncludeErDiagram')
          .waitOnElementToBecomeEnabled('#vannaTrainingIncludeErDiagram');

        ft = ft
          .click('#btnCloseDbConnectionModal')
          .waitOnElementToBecomeInvisible('#btnCloseDbConnectionModal');

        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          dbConnectionFileNameAndId,
          dbVendor,
        );

        // Stop starter-pack when done
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
        }

        return ft;
      },
    );

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] 'Ubiquitous Language' Tab: Functionality (Edit, Save, Load)`,
      async function ({ beforeAfterEach: firstPage }) {
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS * 2);
        let ft = new FluentTester(firstPage);

        //const dbVendor = ConnectionsTestHelper.getRandomDbVendor(); // Or a fixed one like 'sqlite' for simplicity
        ft = ft.consoleLog(
          `STEP 0.0: Testing 'Ubiquitous Language' Tab with vendor: ${dbVendor}`,
        );

        // Start starter-pack only for non-sqlite vendors
        // if (dbVendor !== 'sqlite') {
        //   ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
        // }

        const connectionName = `UbLangTest-${dbVendor}-${Date.now()}`;
        const kebabConnectionName = _.kebabCase(connectionName);
        const dbConnectionFileNameAndId = `db-${kebabConnectionName}\\.xml`;

        // --- STEP 1: Setup - Create a new database connection ---
        ft = ft.consoleLog(
          `STEP 1: Creating new connection '${connectionName}' for vendor ${dbVendor}.`,
        );

        ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
          ft,
          connectionName,
          dbVendor,
        );

        // --- STEP 2: Open connection and navigate to Ubiquitous Language tab ---
        ft = ft.consoleLog(
          'STEP 2: Opening connection and navigating to Ubiquitous Language tab.',
        );
        ft = ft.gotoConnections();
        ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
        ft = ft.waitOnElementToBecomeEnabled('#btnEdit').click('#btnEdit');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseUbiquitousLanguageTab-link').sleep(Constants.DELAY_ONE_SECOND);

        ft = ft
          .waitOnElementToBecomeVisible('#noUbiquitousLanguageContentInfo')
          .waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing')
          .waitOnElementToBecomeEnabled('#btnUbiquitousLanguageStartEditing')
          .elementShouldNotBeVisible('#ubiquitousLanguageEditor')
          .elementShouldNotBeVisible('#ubiquitousLanguageViewer');

        // --- STEP 3: Toggle to Edit Mode ---
        ft = ft.consoleLog('STEP 3: Toggling to Edit Mode.');

        ft = ft.click('#btnUbiquitousLanguageStartEditing');
        ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
        ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEditDone');
        ft = ft.elementShouldNotBeVisible('#btnUbiquitousLanguageEdit');

        // --- STEP 4: Enter Markdown, switch to View, and Save ---
        const initialMarkdown = `# Test Header\n\nThis is a test paragraph for Ubiquitous Language.`;
        const updatedMarkdown = `# Updated Header\n\nThis content has been updated.`;

        ft = ft.consoleLog(
          'STEP 4: Entering Markdown, switching to View, and Saving.',
        );
        ft = ft.setCodeJarContentSingleShot(
          '#ubiquitousLanguageEditor',
          initialMarkdown,
        );
        ft = ft.click('#btnUbiquitousLanguageEditDone'); // Switch back to view mode
        ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEdit'); // View mode
        ft = ft.elementShouldNotBeVisible('#ubiquitousLanguageEditor');

        // Verify rendered markdown - selectors depend on how <markdown> component renders
        ft = ft.waitOnElementToContainText('.markdown-content h1', 'Test Header');
        ft = ft.waitOnElementToContainText(
          '.markdown-content p',
          'This is a test paragraph for Ubiquitous Language.',
        );

        // Save the UL
        ft = ft
          .click('#btnOKConfirmationDbConnectionModal')
          .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');

        // --- STEP 5: Load Existing Content ---
        ft = ft.consoleLog(
          'STEP 5: Re-opening connection to load existing Ubiquitous Language.',
        );
        ft = ft.gotoConnections();
        ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
        ft = ft.click('#btnEdit');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseUbiquitousLanguageTab-link').sleep(Constants.DELAY_ONE_SECOND);
        ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEdit'); // Should be in view mode
        // Verify loaded markdown
        ft = ft.waitOnElementToContainText('.markdown-content h1', 'Test Header');
        ft = ft.waitOnElementToContainText(
          '.markdown-content p',
          'This is a test paragraph for Ubiquitous Language.',
        );

        // --- STEP 6: Edit again, but Cancel (changes should not persist) ---
        ft = ft.consoleLog('STEP 6: Editing again, then cancelling.');
        ft = ft.click('#btnUbiquitousLanguageEdit'); // To edit mode
        ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
        ft = ft.setCodeJarContentSingleShot(
          '#ubiquitousLanguageEditor',
          updatedMarkdown,
        );
        ft = ft.click('#btnUbiquitousLanguageEditDone'); // To view mode with updated (but unsaved) content
        ft = ft.waitOnElementToContainText(
          '.markdown-content h1',
          'Updated Header',
        );
        ft = ft.click('#btnCloseDbConnectionModal'); // Cancel changes
        ft = ft.waitOnElementToBecomeInvisible('#btnCloseDbConnectionModal');

        // --- STEP 7: Verify Content Was Not Saved After Cancel ---
        ft = ft.consoleLog(
          'STEP 7: Verifying content was not saved after cancel.',
        );
        ft = ft.gotoConnections();
        ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
        ft = ft.click('#btnEdit');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.sleep(Constants.DELAY_ONE_SECOND);
        ft = ft.click('#databaseUbiquitousLanguageTab-link');
        ft = ft.sleep(Constants.DELAY_ONE_SECOND);
        // Should still be the initial saved markdown
        ft = ft.waitOnElementToContainText('.markdown-content h1', 'Test Header');
        ft = ft.waitOnElementToContainText(
          '.markdown-content p',
          'This is a test paragraph for Ubiquitous Language.',
        );

        // --- STEP 8: Edit to Empty Content and Save (should delete file) ---
        ft = ft.consoleLog('STEP 8: Editing to empty content and saving.');
        ft = ft.click('#btnUbiquitousLanguageEdit');
        ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
        ft = ft.setCodeJarContentSingleShot('#ubiquitousLanguageEditor', '');
        ft = ft.click('#btnUbiquitousLanguageEditDone');
        // Markdown view area should now be hidden due to ngIf="isStringAndNotEmpty(...)"
        ft = ft
          .waitOnElementToBecomeVisible('#noUbiquitousLanguageContentInfo')
          .waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing');

        ft = ft
          .click('#btnOKConfirmationDbConnectionModal')
          .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');

        // --- STEP 9: Verify Empty Content on Load (after deletion/empty save) ---
        ft = ft.consoleLog('STEP 9: Verifying empty content on load.');
        ft = ft.gotoConnections();
        ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
        ft = ft.click('#btnEdit');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft
          .sleep(Constants.DELAY_ONE_SECOND)
          .click('#databaseUbiquitousLanguageTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .waitOnElementToBecomeVisible('#noUbiquitousLanguageContentInfo')
          .waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing');
        ft = ft.elementShouldNotBeVisible('#btnUbiquitousLanguageEdit');
        ft = ft.elementShouldNotBeVisible('.markdown-content')
          .sleep(Constants.DELAY_ONE_SECOND)
          .click('#toolsTab-link')
          .sleep(Constants.DELAY_ONE_SECOND)
          .waitOnElementToBecomeVisible('#schemaNotLoadedChat2DB')
          .elementShouldNotBeVisible('#vannaTrainingIncludeUbiquitousLanguage');

        ft = ft
          .click('#btnCloseDbConnectionModal')
          .waitOnElementToBecomeInvisible('#btnCloseDbConnectionModal');

        // --- STEP 10: Cleanup ---
        ft = ft.consoleLog('STEP 10: Cleaning up the test connection.');
        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          dbConnectionFileNameAndId,
          dbVendor,
        );

        // Stop starter-pack when done
        // if (dbVendor !== 'sqlite') {
        //   ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
        // }

        return ft;
      },
    );

    electronBeforeAfterAllTest(
      `(database-connection) [${dbVendor}] 'Chat2DB' Tab: Functionality tests (all UI elements, Vanna AI, Training Plan, Table Selection, Dropdowns)`,
      async function ({ beforeAfterEach: firstPage }) {
        test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS * 3);

        let ft = new FluentTester(firstPage);

        // --- STEP 1: Create and test a new database connection (this is the only way to unlock Chat2DB tab) ---
        //const dbVendor = ConnectionsTestHelper.getRandomDbVendor();

        ft = ft.consoleLog(
          `Chat2DB Tab with vendor: ${dbVendor}`,
        );

        // Start starter-pack only for non-sqlite vendors
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
        }

        const connectionName = `Chat2DBTest-${dbVendor}-${Date.now()}`;
        const kebabConnectionName = _.kebabCase(connectionName);
        const fileNameAndId = `db-${kebabConnectionName}\\.xml`;

        ft = ft.consoleLog('STEP 1: Create and test new DB connection');
        ft = ft.gotoConnections();
        ft = ft.waitOnElementToBecomeEnabled('#btnNewDropdown').click('#btnNewDropdown');
        ft = ft.waitOnElementToBecomeVisible('#btnNewDatabase').click('#btnNewDatabase');
        ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
        ft = ft.waitOnElementToBecomeEnabled('#dbConnectionName');
        ft = ConnectionsTestHelper.fillNewDatabaseConnectionDetails(
          ft,
          connectionName,
          dbVendor,
          //kebabConnectionName,
        );

        // Test Connection (save if needed)
        ft = ft.waitOnElementToBecomeEnabled('#btnTestDbConnection').click('#btnTestDbConnection');

        if (dbVendor !== 'sqlite') {
          ft = ft.infoDialogShouldBeVisible()
            .clickYesDoThis()
            .click('#btnClearLogsDbConnection')
            .confirmDialogShouldBeVisible()
            .clickYesDoThis()
            .waitOnElementToBecomeDisabled('#btnClearLogsDbConnection')
            .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
            .appStatusShouldBeGreatNoErrorsNoWarnings()
            .click('#btnTestDbConnection');
        }

        ft = ft.waitOnElementToContainText(
          '#confirmDialog .modal-body',
          'The connection must be saved before being able to test it. Save now?',
        );

        ft = ft.clickYesDoThis();
        ft = ft.waitOnElementToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');
        ft = ft.waitOnElementNotToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');
        ft = ft.waitOnToastToBecomeVisible('success', 'Successfully connected to the database', Constants.DELAY_HUNDRED_SECONDS);

        // --- STEP 2: Prepare Domain-Grouped Schema (so checkbox is enabled in Chat2DB) ---
        ft = ft.consoleLog('STEP 2: Prepare Domain-Grouped Schema');

        ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#domainGroupedDatabaseSchemaTab-link').sleep(Constants.DELAY_ONE_SECOND);

        ft = ft.waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist');
        ft = ft.waitOnElementToBecomeEnabled('#btnToggleDomainGroupedCodeView');
        ft = ft.click('#btnToggleDomainGroupedCodeView');
        ft = ft.waitOnElementToBecomeVisible('#domainGroupedCodeEditor');

        // Use a minimal valid domain-grouped schema
        const domainGroupedSchema = `{"domainGroups":[{"label":"TestDomain","tables":[{"tableName":"Products","columns":[{"name":"ProductID"}]}]}]}`;
        ft = ft.setCodeJarContentSingleShot('#domainGroupedCodeEditor', domainGroupedSchema);
        ft = ft.click('#btnToggleDomainGroupedCodeView');
        ft = ft.waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist');

        // --- STEP 3: Prepare ER Diagram (so checkbox is enabled in Chat2DB) ---
        ft = ft.consoleLog('STEP 3: Prepare ER Diagram');

        ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseDiagramTab-link').sleep(Constants.DELAY_ONE_SECOND);

        ft = ft.waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode');
        ft = ft.click('#btnDatabaseDiagramShowCode');
        ft = ft.waitOnElementToBecomeVisible('#plantUmlEditor');
        const erDiagramPuml = '@startuml\nentity "Products" { ProductID }\n@enduml';
        ft = ft.setCodeJarContentSingleShot('#plantUmlEditor', erDiagramPuml);
        ft = ft.click('#btnDatabaseDiagramViewDiagram');
        ft = ft.waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode');

        // --- STEP 4: Prepare Ubiquitous Language (so checkbox is enabled in Chat2DB) ---
        ft = ft.consoleLog('STEP 4: Prepare Ubiquitous Language');

        ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseUbiquitousLanguageTab-link').sleep(Constants.DELAY_ONE_SECOND);

        ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing');
        ft = ft.click('#btnUbiquitousLanguageStartEditing');
        ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
        ft = ft.setCodeJarContentSingleShot('#ubiquitousLanguageEditor', '# Test UL');
        ft = ft.click('#btnUbiquitousLanguageEditDone');
        ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEdit');

        // --- STEP 5: Go to Chat2DB tab and assert all UI elements and states ---
        ft = ft.consoleLog('STEP 5: Chat2DB tab assertions');

        ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#toolsTab-link').sleep(Constants.DELAY_ONE_SECOND);

        ft = ft.waitOnElementToBecomeVisible('#btnChatWithDb').elementShouldBeDisabled('#btnChatWithDb');
        ft = ft.waitOnElementToBecomeDisabled('#btnTrainVannaAi');

        ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
        ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeDbSchema');
        ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeDomainGroupedSchema');
        ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeErDiagram');
        ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeUbiquitousLanguage');
        ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeSqlQueries');


        ft = ft.consoleLog('STEP 6: Vanna.AI Start/Stop UI assertions');

        // Start Vanna.AI
        ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
        ft = ft.click('#btnToggleVannaAi');
        ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Start Vanna.AI?');
        ft = ft.clickYesDoThis();

        ft = ft.waitOnElementToBecomeEnabled('#btnChatWithDb');
        ft = ft.waitOnElementToBecomeEnabled('#btnTrainVannaAi');

        // Assert button label and icon color when started
        ft = ft.waitOnElementToContainText('#btnToggleVannaAi', 'Stop Vanna.AI');

        ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
        ft = ft.elementShouldHaveClass('#btnToggleVannaAi .fa', 'fa-stop');

        ft = ft.click('#btnToggleVannaAi');
        ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Stop Vanna.AI?');
        ft = ft.clickYesDoThis();
        ft = ft.waitOnElementToContainText('#btnToggleVannaAi', 'Start Vanna.AI');

        ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
        ft = ft.elementShouldHaveClass('#btnToggleVannaAi .fa', 'fa-play');

        ft = ft.waitOnElementToBecomeDisabled('#btnChatWithDb');
        ft = ft.waitOnElementToBecomeDisabled('#btnTrainVannaAi');
        // The color check is not directly supported, but you can check for the icon class

        // --- STEP 7: Generate Vanna.AI Training Plan with different checkbox combinations ---
        ft = ft.consoleLog('STEP 7: Generate Vanna.AI Training Plan - 1,3,5 checked');

        // 1. Only 1, 3, 5 checked
        ft = ft.setCheckboxState('#vannaTrainingIncludeDbSchema', true);
        ft = ft.setCheckboxState('#vannaTrainingIncludeDomainGroupedSchema', false);
        ft = ft.setCheckboxState('#vannaTrainingIncludeErDiagram', true);
        ft = ft.setCheckboxState('#vannaTrainingIncludeUbiquitousLanguage', false);
        ft = ft.setCheckboxState('#vannaTrainingIncludeSqlQueries', true);

        ft = ft.click('#btnGenerateVannaTrainingPlan');


        ft = ft.waitOnElementToBecomeVisible('dburst-ai-manager').waitOnElementToBecomeVisible('#btnCopyPromptText');

        ft = ft
          .click('#btnCopyPromptText')
          .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
          .click('.dburst-button-question-confirm')
          .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

        ft = ft.clipboardShouldContainText('You are an expert Vanna.AI consultant.');

        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING DB SCHEMA]');
        ft = ft.clipboardShouldContainText('[VANNA TRAINING DOMAIN GROUPED SCHEMA]');
        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING ER DIAGRAM]');
        ft = ft.clipboardShouldContainText('[VANNA TRAINING UBIQUITOUS LANGUAGE]');
        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING EXISTING SQL QUERIES]');

        ft = ft
          .click('#btnCloseAiCopilotModal')
          .waitOnElementToBecomeInvisible('#btnCopyPromptText');



        // 2. All 5 checked
        ft = ft.consoleLog('STEP 8: Generate Vanna.AI Training Plan - all checked');
        ft = ft.setCheckboxState('#vannaTrainingIncludeDbSchema', true);
        ft = ft.setCheckboxState('#vannaTrainingIncludeDomainGroupedSchema', true);
        ft = ft.setCheckboxState('#vannaTrainingIncludeErDiagram', true);
        ft = ft.setCheckboxState('#vannaTrainingIncludeUbiquitousLanguage', true);
        ft = ft.setCheckboxState('#vannaTrainingIncludeSqlQueries', true);

        ft = ft.click('#btnGenerateVannaTrainingPlan');

        ft = ft.waitOnElementToBecomeVisible('dburst-ai-manager').waitOnElementToBecomeVisible('#btnCopyPromptText');

        ft = ft
          .click('#btnCopyPromptText')
          .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
          .click('.dburst-button-question-confirm')
          .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

        ft = ft.clipboardShouldContainText('You are an expert Vanna.AI consultant.');

        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING DB SCHEMA]');
        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING DOMAIN GROUPED SCHEMA]');
        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING ER DIAGRAM]');
        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING UBIQUITOUS LANGUAGE]');
        ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING EXISTING SQL QUERIES]');

        ft = ft
          .click('#btnCloseAiCopilotModal')
          .waitOnElementToBecomeInvisible('#btnCopyPromptText');

        // --- STEP 12: Apps Manager assertions ---
        ft = ft.consoleLog('STEP 9: Apps Manager assertions');

        // 1. Open dropdown to access CloudBeaver (works regardless of position)
        ft = ft.click('#appsManagerDropdownToggle');
        ft = ft.waitOnElementToBecomeVisible('#appsManagerAppcloudbeaver');

        // 2. Assert CloudBeaver is present and shows stopped
        ft = ft.elementShouldContainText('#appsManagerAppNamecloudbeaver', 'CloudBeaver');
        ft = ft.elementShouldContainText('#appsManagerAppStatecloudbeaver', 'stopped');

        // 3. Click Start button for CloudBeaver
        ft = ft.waitOnElementToBecomeVisible('#appsManagerAppStartBtncloudbeaver');
        ft = ft.click('#appsManagerAppStartBtncloudbeaver');
        ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Start CloudBeaver');
        ft = ft.clickYesDoThis();

        // 4. Dropdown closes after confirm - reopen to check status
        ft = ft.click('#appsManagerDropdownToggle');
        ft = ft.waitOnElementToBecomeVisible('#appsManagerAppcloudbeaver');
        ft = ft.waitOnElementToContainText('#appsManagerAppStatecloudbeaver', 'running');

        // 5. Stop button should now be visible, start button hidden
        ft = ft.waitOnElementToBecomeVisible('#appsManagerAppStopBtncloudbeaver');
        ft = ft.click('#appsManagerAppStopBtncloudbeaver');
        ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Stop CloudBeaver');
        ft = ft.clickYesDoThis();
        ft = ft.waitOnProcessingToStart(Constants.CHECK_PROCESSING_STATUS_BAR);
        ft = ft.waitOnProcessingToFinish(Constants.CHECK_PROCESSING_STATUS_BAR);
        ft = ft.appShouldBeReadyToRunNewJobs();
        ft = ft.appStatusShouldBeGreatNoErrorsNoWarnings();
          
        // 6. Dropdown closes after confirm - reopen to verify stopped
        ft = ft.click('#appsManagerDropdownToggle');
        ft = ft.waitOnElementToBecomeVisible('#appsManagerAppcloudbeaver');
        ft = ft.waitOnElementToContainText('#appsManagerAppStatecloudbeaver', 'stopped');

        // --- STEP 10: Save and close modal, cleanup ---
        ft = ft.consoleLog('STEP 10: Save and cleanup');
        ft = ft.waitOnElementToBecomeEnabled('#btnOKConfirmationDbConnectionModal');
        ft = ft.click('#btnOKConfirmationDbConnectionModal');
        ft = ft.waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');
        ft = ft.gotoConnections();
        ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
          ft,
          fileNameAndId,
          dbVendor,
        );

        // Stop starter-pack when done
        if (dbVendor !== 'sqlite') {
          ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
        }

        return ft;
      });
  }

});
