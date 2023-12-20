import { test } from '@playwright/test';
import _ from 'lodash';

import { FluentTester } from '../../helpers/fluent-tester';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import * as PATHS from '../../utils/paths';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import { ConnectionsTestHelper } from '../../helpers/areas/connections-test-helper';

test.describe('', async () => {
  electronBeforeAfterAllTest(
    '(email-connection) should correctly CRUD create, read, update, duplicate and delete',
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = _createAndAssertNewEmailConnection(ft, 'Test Email Connection');
      ft = _readUpdateAndAssertEmailConnection(ft, 'Test Email Connection');
      ft = _duplicateAndAssertEmailConnection(ft, 'Test Email Connection');
      ft = _deleteAndAssertEmailConnection(
        ft,
        'eml-test-email-connection\\.xml'
      );
      ft = _deleteAndAssertEmailConnection(
        ft,
        'eml-test-email-connection-duplicated\\.xml'
      );

      return ft;
    }
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
          'Default Email Connection'
        )
        .elementShouldContainText(
          `#${PATHS.EML_CONTACT_FILE} td:nth-child(2)`,
          'email-connection'
        )
        .elementShouldContainText(
          `#${PATHS.EML_CONTACT_FILE} td:nth-child(3)`,
          'My Reports'
        )
        .elementShouldBeVisible(`#btnDefault_${PATHS.EML_CONTACT_FILE}`)
        .elementShouldNotBeVisible(`#btnActions_${PATHS.EML_CONTACT_FILE}`)
        .click(`#btnDefault_${PATHS.EML_CONTACT_FILE}`)
        .waitOnElementToBecomeVisible(
          `#btnSendTestEmail_${PATHS.EML_CONTACT_FILE}`
        )
        .elementShouldNotBeVisible(`#btnSeparator_${PATHS.EML_CONTACT_FILE}`)
        .elementShouldNotBeVisible(
          `#btnToggleDefault_${PATHS.EML_CONTACT_FILE}`
        )
        //#btnDelete should be disabled for Default | usedBy != empty
        .elementShouldHaveClass('#btnDelete', 'disabled');

      //create 2nd email connection and assert it is not default and other basic things
      const secondEmailConnectionName = 'Second Email Connection';
      const secondEmailConnectionFileName = `eml-${_.kebabCase(
        secondEmailConnectionName
      )}\\.xml`;

      ft = _createAndAssertNewEmailConnection(ft, secondEmailConnectionName);
      ft.gotoConnections()
        .clickAndSelectTableRow(`#${secondEmailConnectionFileName}`)
        .waitOnElementToBecomeEnabled('#btnNew')
        .waitOnElementToBecomeEnabled('#btnEdit')
        .waitOnElementToBecomeEnabled('#btnDuplicate')
        //#btnDelete should be enable for NonDefault && usedBy == empty
        .waitOnElementToBecomeEnabled('#btnDelete')
        .elementShouldContainText(
          `#${secondEmailConnectionFileName} td:first-child`,
          secondEmailConnectionName
        )
        .elementShouldContainText(
          `#${secondEmailConnectionFileName} td:nth-child(2)`,
          'email-connection'
        )
        .elementShouldHaveText(
          `#${secondEmailConnectionFileName} td:nth-child(3)`,
          ''
        );
      //toggle 1st time default and assert it worked
      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        secondEmailConnectionFileName
      );

      //toggle 2nd tine default and assert it worked
      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        PATHS.EML_CONTACT_FILE
      );

      ft = _deleteAndAssertEmailConnection(ft, secondEmailConnectionFileName);

      return ft;
    }
  );

  electronBeforeAfterAllTest(
    '(email-connection) should correctly handle Configuration -> Email -> Connection Settings -> "Re-use existing email connection"',
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage); //asser basic "default" connection things

      //asser basic "default" connection things
      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'burst',
        'Default Email Connection',
        'yes-default-connection'
      );

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'First Test Configuration'
      );
      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'first-test-configuration',
        'Default Email Connection',
        'yes-default-connection'
      );

      ft = ConnectionsTestHelper.createAndAssertNewEmailConnection(
        ft,
        'Test Contact Information'
      );

      ft = ConnectionsTestHelper.makeConnectionAsDefault(
        ft,
        'eml-test-contact-information\\.xml'
      );

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Second Test Configuration'
      );

      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'second-test-configuration',
        'Test Contact Information',
        'yes-default-connection'
      );

      ft = ft
        .goToBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`
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
        .goToBurstScreen();

      ft = ConnectionsTestHelper.assertConfigurationUsesEmailConnection(
        ft,
        'second-test-configuration',
        'Default Email Connection',
        'no-default-connection'
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
        .goToBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`
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
          'disabled'
        )
        .elementShouldNotHaveAttribute(
          '#btnFromEmailAddressVariables button',
          'disabled'
        )
        .elementShouldNotHaveAttribute(
          '#btnEmailServerHostVariables button',
          'disabled'
        )
        .elementShouldNotHaveAttribute(
          '#btnSmtpPortVariables button',
          'disabled'
        )
        .elementShouldNotHaveAttribute(
          '#btnUserNameVariables button',
          'disabled'
        )
        .elementShouldNotHaveAttribute(
          '#btnSmtpPasswordVariables button',
          'disabled'
        );

      //check back "Re-use existing email connection" and then "Manage Email Connections" and change email host and port
      //and come back to Connection and check things are working correctly
      ft = ft
        .goToBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`
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
          'Default Email Connection'
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
        PATHS.EML_CONTACT_FILE
      );

      //assert that changes are reflected accurately
      ft = ft
        .click('#btnGoBack')
        .waitOnElementToBecomeVisible('#selectedEmailConnectionDefault')
        .waitOnElementToContainText(
          '#btnSelectedEmailConnection',
          'Default Email Connection'
        )
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Modified')
        .inputShouldHaveValue('#smtpPort', '999')
        .elementShouldBeDisabled('#emailServerHost')
        .elementShouldBeDisabled('#smtpPort');

      ft = ft
        .goToBurstScreen()
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_second-test-configuration_${PATHS.SETTINGS_CONFIG_FILE}`
        )
        .click('#leftMenuEmailSettings')
        .elementCheckBoxShouldBeSelected('#btnUseExistingEmailConnection')
        .waitOnElementToBecomeVisible('#selectedEmailConnectionDefault')
        .waitOnElementToContainText(
          '#btnSelectedEmailConnection',
          'Default Email Connection'
        )
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Modified')
        .inputShouldHaveValue('#smtpPort', '999')
        .elementShouldBeDisabled('#emailServerHost')
        .elementShouldBeDisabled('#smtpPort');

      ft = ConfTemplatesTestHelper.deleteTemplate(
        ft,
        'first-test-configuration'
      );

      ft = ConfTemplatesTestHelper.deleteTemplate(
        ft,
        'second-test-configuration'
      );

      ft = ConnectionsTestHelper.deleteAndAssertEmailConnection(
        ft,
        'eml-test-contact-information\\.xml'
      );

      return ft;
    }
  );
});

function _deleteAndAssertEmailConnection(
  ft: FluentTester,
  connectionFileName: string
): FluentTester {
  return ft
    .gotoConnections()
    .waitOnElementToBecomeVisible(`#${connectionFileName}`)
    .clickAndSelectTableRow(`#${connectionFileName}`)
    .waitOnElementToBecomeEnabled('#btnDelete')
    .click('#btnDelete')
    .clickNoDontDoThis()
    .click('#btnDelete')
    .clickYesDoThis()
    .waitOnElementToBecomeInvisible(`#${connectionFileName}`)
    .gotoConnections()
    .elementShouldNotBeVisible(`#${connectionFileName}`);
}

function _duplicateAndAssertEmailConnection(
  ft: FluentTester,
  connectionName: string
): FluentTester {
  const connectionFileName = `eml-${_.kebabCase(connectionName)}\\.xml`;
  const newConnectionName = `${connectionName} Duplicated`;
  const newConnectionFileName = `eml-${_.kebabCase(newConnectionName)}\\.xml`;

  return ft
    .gotoConnections()
    .waitOnElementToHaveText(
      `#${connectionFileName} td:first-child`,
      `${connectionName} Modified`
    )
    .clickAndSelectTableRow(`#${connectionFileName}`)
    .waitOnElementToBecomeEnabled('#btnDuplicate')
    .click('#btnDuplicate')
    .waitOnElementToBecomeEnabled('#connectionName')
    .click('#connectionName')
    .typeText(`${connectionName}`)
    .waitOnElementToContainText('#alreadyExistsWarning', 'already exists')
    .waitOnElementToBecomeDisabled('#btnOKConfirmationConnectionModal')
    .click('#connectionName')
    .typeText('')
    .waitOnElementToBecomeInvisible('#alreadyExistsWarning')
    .elementShouldBeDisabled('#btnOKConfirmationConnectionModal')
    .typeText(`${newConnectionName}`)
    .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
    .click('#emailServerHost')
    .typeText('smtp.exmail.qq.com Duplicated')
    .click('#smtpPort')
    .typeText('777')
    .pageShouldContainText('Create Email Connection')
    .click('#btnOKConfirmationConnectionModal')
    .waitOnElementToHaveText(
      `#${newConnectionFileName} td:first-child`,
      `${newConnectionName}`
    )
    .gotoConnections()
    .waitOnElementToHaveText(
      `#${connectionFileName} td:first-child`,
      `${connectionName} Modified`
    )
    .waitOnElementToHaveText(
      `#${newConnectionFileName} td:first-child`,
      `${newConnectionName}`
    )
    .clickAndSelectTableRow(`#${newConnectionFileName}`)
    .waitOnElementToBecomeEnabled('#btnEdit')
    .click('#btnEdit')
    .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
    .inputShouldHaveValue('#connectionName', `${newConnectionName}`)
    .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Duplicated')
    .inputShouldHaveValue('#smtpPort', '777')
    .click('#btnCloseConnectionModal');
}

function _readUpdateAndAssertEmailConnection(
  ft: FluentTester,
  connectionName: string
): FluentTester {
  const connectionFileName = `eml-${_.kebabCase(connectionName)}\\.xml`;

  return ft
    .gotoConnections()
    .waitOnElementToHaveText(
      `#${connectionFileName} td:first-child`,
      connectionName
    )
    .clickAndSelectTableRow(`#${connectionFileName}`)
    .waitOnElementToBecomeEnabled('#btnEdit')
    .click('#btnEdit')
    .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
    .inputShouldHaveValue('#connectionName', connectionName)
    .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
    .inputShouldHaveValue('#smtpPort', '465')
    .elementCheckBoxShouldBeSelected('#btnSSL')
    .elementCheckBoxShouldNotBeSelected('#btnTLS')
    .inputShouldHaveValue('#fromName', '${var0}')
    .inputShouldHaveValue('#fromEmailAddress', '${var1}')
    .inputShouldHaveValue('#userName', '${var2}')
    .inputShouldHaveValue('#smtpPassword', '${var3}')
    .pageShouldContainText('Update Email Connection')
    .click('#btnCloseConnectionModal')
    .elementShouldHaveText(
      `#${connectionFileName} td:first-child`,
      connectionName
    )
    .click('#btnEdit')
    .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
    .click('#connectionName')
    .typeText(`${connectionName} Modified`)
    .click('#emailServerHost')
    .typeText('smtp.exmail.qq.com Modified')
    .click('#smtpPort')
    .typeText('999')
    .click('#btnSSL')
    .click('#btnTLS')
    .click('#fromName')
    .typeText('${var0} Modified')
    .click('#fromEmailAddress')
    .typeText('${var1} Modified')
    .click('#userName')
    .typeText('${var2} Modified')
    .click('#smtpPassword')
    .typeText('${var3} Modified')
    .click('#btnOKConfirmationConnectionModal')
    .waitOnElementToHaveText(
      `#${connectionFileName} td:first-child`,
      `${connectionName} Modified`
    )
    .gotoConnections()
    .waitOnElementToHaveText(
      `#${connectionFileName} td:first-child`,
      `${connectionName} Modified`
    )
    .clickAndSelectTableRow(`#${connectionFileName}`)
    .waitOnElementToBecomeEnabled('#btnEdit')
    .click('#btnEdit')
    .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
    .inputShouldHaveValue('#connectionName', `${connectionName} Modified`)
    .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Modified')
    .inputShouldHaveValue('#smtpPort', '999')
    .elementCheckBoxShouldNotBeSelected('#btnSSL')
    .elementCheckBoxShouldBeSelected('#btnTLS')
    .inputShouldHaveValue('#fromName', '${var0} Modified')
    .inputShouldHaveValue('#fromEmailAddress', '${var1} Modified')
    .inputShouldHaveValue('#userName', '${var2} Modified')
    .inputShouldHaveValue('#smtpPassword', '${var3} Modified')
    .click('#btnCloseConnectionModal');
}

function _createAndAssertNewEmailConnection(
  ft: FluentTester,
  connectionName: string
): FluentTester {
  const connectionFileName = `eml-${_.kebabCase(connectionName)}\\.xml`;

  return ft
    .gotoConnections()
    .click('#btnNew')
    .waitOnElementToBecomeVisible('#connectionName')
    .elementShouldBeDisabled('#btnOKConfirmationConnectionModal')
    .clickNoDontDoThis()
    .click('#btnNew')
    .waitOnElementToBecomeVisible('#connectionName')
    .click('#connectionName')
    .typeText('Contact')
    .waitOnElementToContainText('#alreadyExistsWarning', 'already exists')
    .typeText(connectionName)
    .waitOnElementToBecomeInvisible('#alreadyExistsWarning')
    .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
    .click('#btnWellKnownEmailProviders')
    .waitOnElementToBecomeVisible('#btnShowMoreProviders')
    .click('#modalWellKnownEmailProviders *[id=btnClose]')
    .waitOnElementToBecomeInvisible('#btnShowMoreProviders')
    .click('#btnWellKnownEmailProviders')
    .waitOnElementToBecomeVisible('#btnShowMoreProviders')
    .click('#btnShowMoreProviders')
    .click('#QQex')
    .click('#modalWellKnownEmailProviders *[id=btnOKConfirmation]')
    .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
    .inputShouldHaveValue('#smtpPort', '465')
    .elementCheckBoxShouldBeSelected('#btnSSL')
    .elementCheckBoxShouldNotBeSelected('#btnTLS')
    .click('#fromName')
    .typeText('')
    .click('#btnFromNameVariables')
    .click('#\\$\\{var0\\}')
    .click('#modalSelectVariable *[id=btnOKConfirmation]')
    .click('#fromEmailAddress')
    .typeText('')
    .click('#btnFromEmailAddressVariables')
    .click('#\\$\\{var1\\}')
    .click('#modalSelectVariable *[id=btnOKConfirmation]')
    .click('#userName')
    .typeText('')
    .click('#btnUserNameVariables')
    .click('#\\$\\{var2\\}')
    .click('#modalSelectVariable *[id=btnOKConfirmation]')
    .click('#smtpPassword')
    .typeText('')
    .click('#btnSmtpPasswordVariables')
    .click('#btnShowMoreVariables')
    .waitOnElementToBecomeVisible('#\\$\\{var3\\}')
    .click('#\\$\\{var3\\}')
    .click('#modalSelectVariable *[id=btnOKConfirmation]')
    .pageShouldContainText('Create Email Connection')
    .click('#btnOKConfirmationConnectionModal')
    .waitOnElementToHaveText(
      `#${connectionFileName} td:first-child`,
      connectionName
    );
}

/*
const _createNewTemplate = (
  ft: FluentTester,
  templateName: string,
  mailMergeCapability?: string
): FluentTester => {
  const folderName = _.kebabCase(templateName);

  ft = ft
    .gotoConfigurationTemplates()
    .click('#btnNew')
    .waitOnElementToBecomeVisible('#templateHowTo')
    .waitOnInputValueToContainText('#templateHowTo', 'folder-name');

  if (mailMergeCapability) {
    ft = ft
      .click('#btnCapReportGenerationMailMerge')
      .waitOnElementToBecomeInvisible('#templateHowTo')
      .waitOnElementToBecomeInvisible('#templateHowToSnipped');
  } else {
    ft = ft
      .click('#btnCapReportGenerationMailMerge')
      .waitOnElementToBecomeInvisible('#templateHowTo')
      .waitOnElementToBecomeInvisible('#templateHowToSnipped')
      .click('#btnCapReportGenerationMailMerge')
      .waitOnElementToBecomeVisible('#templateHowTo')
      .waitOnElementToBecomeVisible('#templateHowToSnipped');
  }

  ft = ft.click('#templateName').typeText('Settings');
  if (!mailMergeCapability) {
    ft = ft.waitOnInputValueToContainText(
      '#templateHowTo',
      `settings/${PATHS.SETTINGS_CONFIG_FILE}`
    );
  }
  ft = ft.typeText('');
  if (!mailMergeCapability) {
    ft = ft.waitOnInputValueToContainText('#templateHowTo', 'folder-name');
  }
  ft = ft.typeText(templateName);
  if (!mailMergeCapability) {
    ft = ft.waitOnInputValueToContainText(
      '#templateHowTo',
      `/reports/${folderName}/${PATHS.SETTINGS_CONFIG_FILE}`
    );
  }
  return ft
    .clickYesDoThis()
    .waitOnElementToHaveText(
      `#${folderName}_${PATHS.SETTINGS_CONFIG_FILE} td:first-child`,
      templateName
    );
};
*/
