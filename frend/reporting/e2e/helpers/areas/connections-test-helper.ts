import _ from 'lodash';

import { FluentTester } from '../fluent-tester';
import * as PATHS from '../../utils/paths';

export class ConnectionsTestHelper {
  static deleteAndAssertEmailConnection(
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

  static duplicateAndAssertEmailConnection(
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

  static readUpdateAndAssertEmailConnection(
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

  static createAndAssertNewEmailConnection(
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

  static makeConnectionAsDefault(
    ft: FluentTester,
    connectionFileName: string
  ): FluentTester {
    return ft
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnActions_${connectionFileName}`)
      .click(`#btnActions_${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnToggleDefault_${connectionFileName}`)
      .click(`#btnToggleDefault_${connectionFileName}`)
      .clickNoDontDoThis()
      .click(`#btnActions_${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnToggleDefault_${connectionFileName}`)
      .click(`#btnToggleDefault_${connectionFileName}`)
      .clickYesDoThis()
      .waitOnElementToBecomeInvisible(`#btnActions_${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnDefault_${connectionFileName}`)
      .waitOnElementToHaveClass('#btnDelete', 'disabled');
  }

  static assertConfigurationUsesEmailConnection(
    ft: FluentTester,
    folderName: string,
    emailConnectionName: string,
    shouldBeTheDefaultEmailConnection: string
  ): FluentTester {
    ft = ft
      .gotoConfiguration()
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`
      )
      .click('#leftMenuEmailSettings') // email SMTP settings
      .elementCheckBoxShouldBeSelected('#btnUseExistingEmailConnection')
      .elementShouldBeEnabled('#btnSelectedEmailConnection')
      .elementShouldContainText(
        '#btnSelectedEmailConnection',
        emailConnectionName
      );

    if (shouldBeTheDefaultEmailConnection == 'yes-default-connection')
      ft = ft.elementShouldBeVisible('#selectedEmailConnectionDefault');
    else ft = ft.elementShouldNotBeVisible('#selectedEmailConnectionDefault');

    if (emailConnectionName == 'Email Contact Information') {
      ft = ft
        .inputShouldHaveValue('#fromName', 'From Name')
        .inputShouldHaveValue('#fromEmailAddress', 'from@emailaddress.com')
        .inputShouldHaveValue('#emailServerHost', 'Email Server Host')
        .inputShouldHaveValue('#smtpPort', '25')
        .inputShouldHaveValue('#userName', 'From Email User ID')
        .inputShouldHaveValue('#smtpPassword', 'From Email Password')
        .elementCheckBoxShouldNotBeSelected('#btnSSL')
        .elementCheckBoxShouldNotBeSelected('#btnTLS');
    } else if (emailConnectionName == 'Test Contact Information') {
      ft = ft
        .inputShouldHaveValue('#fromName', '${var0}')
        .inputShouldHaveValue('#fromEmailAddress', '${var1}')
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
        .inputShouldHaveValue('#smtpPort', '465')
        .inputShouldHaveValue('#userName', '${var2}')
        .inputShouldHaveValue('#smtpPassword', '${var3}')
        .elementCheckBoxShouldBeSelected('#btnSSL')
        .elementCheckBoxShouldNotBeSelected('#btnTLS');
    }
    ft = ft
      .elementShouldBeDisabled('#fromName')
      .elementShouldBeDisabled('#fromEmailAddress')
      .elementShouldBeDisabled('#emailServerHost')
      .elementShouldBeDisabled('#smtpPort')
      .elementShouldBeDisabled('#userName')
      .elementShouldBeDisabled('#smtpPassword')
      .elementShouldBeDisabled('#btnTLS')
      .elementShouldBeDisabled('#btnSSL')
      .elementShouldHaveAttribute('#btnFromNameVariables button', 'disabled')
      .elementShouldHaveAttribute(
        '#btnFromEmailAddressVariables button',
        'disabled'
      )
      .elementShouldHaveAttribute(
        '#btnEmailServerHostVariables button',
        'disabled'
      )
      .elementShouldHaveAttribute('#btnSmtpPortVariables button', 'disabled')
      .elementShouldHaveAttribute('#btnUserNameVariables button', 'disabled')
      .elementShouldHaveAttribute(
        '#btnSmtpPasswordVariables button',
        'disabled'
      );

    return ft;
  }
}
