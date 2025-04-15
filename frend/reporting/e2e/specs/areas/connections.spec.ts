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

      //asser basic "default" connection things
      ft.gotoConnections()
        .clickAndSelectTableRow(`#${PATHS.EML_CONTACT_FILE}`)
        .waitOnElementToBecomeEnabled('#btnNew')
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
        .waitOnElementToBecomeEnabled('#btnNew')
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
});
