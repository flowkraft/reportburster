import _ from 'lodash';

import { FluentTester } from '../fluent-tester';
import * as PATHS from '../../utils/paths';
import { Constants } from '../../utils/constants';
import { sep } from 'path';

export class ConfigurationTestHelper {
  static rollbackChangesToDefaultDocumentBursterConfiguration(
    ft: FluentTester,
    folderName: string,
  ): FluentTester {
    //const escapedWhich = PATHS.SETTINGS_CONFIG_FILE; //.replace('.', '\\.');

    return ft
      .gotoConfigurationTemplates()
      .click(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .waitOnElementToHaveClass(
        `#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        'info',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS,
      )
      .click(`#btnActions_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .click(`#btnActionRestore_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .clickNoDontDoThis()
      .click(`#btnActions_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .click(`#btnActionRestore_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .clickYesDoThis();
  }

  static assertDefaultDocumentBursterConfiguration(
    ft: FluentTester,
    folderName: string,
  ): FluentTester {
    ft = ft.gotoBurstScreen().click('#topMenuConfiguration');

    if (folderName == 'burst') {
      ft = ft.waitOnElementToHaveText(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        'My Reports',
      );
    }

    ft = ft.click(
      `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
    ); // general settings

    if (folderName == 'burst') {
      ft = ft
        .waitOnElementToHaveText(
          '#topMenuConfiguration',
          'Configuration (My Reports) ',
        )
        .waitOnElementToHaveText(
          '.sidebar-menu .header',
          'CONFIGURATION (My Reports)',
        );
    }

    return ft
      .inputShouldHaveValue(
        '#burstFileName',
        '${burst_token}.${output_type_extension}',
      )
      .inputShouldHaveValue(
        '#outputFolder',
        'output/${input_document_name}/${now?string["yyyy.MM.dd_HH.mm.ss.SSS"]}',
      )
      .inputShouldHaveValue(
        '#quarantineFolder',
        'quarantine/${input_document_name}/${now?string["yyyy.MM.dd_HH.mm.ss.SSS"]}',
      )
      .click('#btnEnableDisableDistribution') // Enable / Disable checkbox settings
      .elementCheckBoxShouldNotBeSelected('#btnSendDocumentsEmail')
      .elementCheckBoxShouldNotBeSelected('#btnSendDocumentsUpload')
      .elementCheckBoxShouldNotBeSelected('#btnSendDocumentsWeb')
      .elementCheckBoxShouldNotBeSelected('#btnSendDocumentsSMS')
      .elementCheckBoxShouldNotBeSelected('#btnDeleteDocuments')
      .elementCheckBoxShouldBeSelected('#btnQuarantineDocuments')
      .click('#leftMenuEmailSettings') // email SMTP settings
      .inputShouldHaveValue('#fromName', 'From Name')
      .inputShouldHaveValue('#fromEmailAddress', 'from@emailaddress.com')
      .inputShouldHaveValue('#emailServerHost', 'Email Server Host')
      .inputShouldHaveValue('#userName', 'From Email User ID')
      .inputShouldHaveValue('#smtpPassword', 'From Email Password')
      .inputShouldHaveValue('#smtpPort', '25')
      .elementCheckBoxShouldNotBeSelected('#btnSSL')
      .elementCheckBoxShouldNotBeSelected('#btnTLS')
      .click('#emailMessageTab-link') // email message settings
      .inputShouldHaveValue('#emailToAddress', '${burst_token}')
      .inputShouldHaveValue('#emailCcAddress', '')
      .inputShouldHaveValue('#emailBccAddress', '')
      .inputShouldHaveValue('#emailSubject', '')
      .elementShouldHaveText('#wysiwygEmailMessage', '')
      .click('#attachmentsTab-link') // email attachments settings
      .elementShouldContainText(
        'tbody tr:first-child td',
        '${extracted_file_path}',
      )
      .elementShouldContainText(
        'tbody tr:last-child td',
        '${extracted_file_path}',
      )
      .elementCheckBoxShouldNotBeSelected('#btnArchiveAttachmentsTogether')
      .inputShouldHaveValue('#archiveFileName', 'reports-${burst_token}.zip')
      .click('#leftMenuUploadSettings') // Upload settings
      .click('#ftpTab-link') // FTP settings
      .inputShouldHaveValue('#ftpCommand', '')
      .click('#fileShareTab-link') // File Share settings
      .inputShouldHaveValue('#fileShareCommand', '')
      .click('#ftpsTab-link') // FTPS settings
      .inputShouldHaveValue('#ftpsCommand', '')
      .click('#sftpTab-link') // SFTP settings
      .inputShouldHaveValue('#sftpCommand', '')
      .click('#httpTab-link') // HTTPS settings
      .inputShouldHaveValue('#httpCommand', '')
      .click('#cloudUploadTab-link') // Cloud settings
      .inputShouldHaveValue('#cloudUploadCommand', '')
      .click('#leftMenuDocuments2WebSettings') // documents2web settings
      .click('#documentBursterWebTab-link') // documents2web settings
      .inputShouldHaveValue('#documentBursterWebCommand', '')
      .click('#sharePointTab-link') // SharePoint settings
      .inputShouldHaveValue('#sharePointCommand', '')
      .click('#wordPressTab-link') // WordPress settings
      .inputShouldHaveValue('#wordPressCommand', '')
      .click('#drupalTab-link') // Drupal settings
      .inputShouldHaveValue('#drupalCommand', '')
      .click('#joomlaTab-link') // Joomla settings
      .inputShouldHaveValue('#joomlaCommand', '')
      .click('#otherWebPlatformsTab-link') // Other Web Platforms settings
      .inputShouldHaveValue('#otherWebPlatformsCommand', '')
      .click('#leftMenuSMSSettings') // SMS settings
      .inputShouldHaveValue('#accountSid', '')
      .inputShouldHaveValue('#authToken', '')
      .click('#leftMenuTwilioSettings') // Twilio settings
      .inputShouldHaveValue('#accountSid', '')
      .inputShouldHaveValue('#authToken', '')
      .click('#smsMessageTab-link') // SMS Message settings
      .inputShouldHaveValue('#fromTelephoneNumber', '')
      .inputShouldHaveValue('#toTelephoneNumber', '')
      .inputShouldHaveValue('#smsText', '')
      .click('#leftMenuQualitySettings') // QA settings
      .inputShouldHaveValue('#qaFromName', 'From Name')
      .inputShouldHaveValue('#qaFromEmailAddress', 'from@emailaddress.com')
      .inputShouldHaveValue('#qaEmailServerHost', 'localhost')
      .inputShouldHaveValue('#qaUserName', '')
      .inputShouldHaveValue('#qaPassword', '')
      .inputShouldHaveValue('#qaPort', '1025')
      .elementCheckBoxShouldNotBeSelected('#btnQASSL')
      .elementCheckBoxShouldNotBeSelected('#btnQATLS')
      .click('#leftMenuTestEmailServerSettings')
      .inputShouldHaveValue('#qaFromName', 'From Name')
      .inputShouldHaveValue('#qaFromEmailAddress', 'from@emailaddress.com')
      .inputShouldHaveValue('#qaEmailServerHost', 'localhost')
      .inputShouldHaveValue('#qaUserName', '')
      .inputShouldHaveValue('#qaPassword', '')
      .inputShouldHaveValue('#qaPort', '1025')
      .elementCheckBoxShouldNotBeSelected('#btnQASSL')
      .elementCheckBoxShouldNotBeSelected('#btnQATLS')
      .click('#leftMenuAdvancedSettings') // Advanced settings
      .inputShouldHaveValue('#delayEachDistributionBy', '0')
      .inputShouldHaveValue('#numberOfUserVariables', '20')
      .inputShouldHaveValue('#burstTokenDelimitersStart', '{')
      .inputShouldHaveValue('#burstTokenDelimitersEnd', '}')
      .elementCheckBoxShouldNotBeSelected('#btnReuseToken')
      .elementCheckBoxShouldNotBeSelected('#btnHTMLEmailEditCode')
      .elementCheckBoxShouldNotBeSelected('#btnSplit2ndTime')
      .inputShouldHaveValue('#burstTokenDelimitersStart2nd', '[')
      .inputShouldHaveValue('#burstTokenDelimitersEnd2nd', ']')
      .elementCheckBoxShouldNotBeSelected('#btnEnableIncubatingFeatures')
      .click('#leftMenuErrorHandlingSettings') // Error Handling settings
      .elementCheckBoxShouldBeSelected('#stopImmediatelyOnError')
      .elementCheckBoxShouldNotBeSelected('#continueOnError')
      .elementCheckBoxShouldNotBeSelected('#btnEnableRetryPolicy')
      .elementShouldBeVisible('#disabled1')
      .elementShouldBeVisible('#disabled2')
      .elementShouldBeVisible('#disabled3')
      .elementShouldBeVisible('#disabled4')
      .elementShouldBeVisible('#disabled5')
      .elementShouldBeVisible('#disabled6')
      .click('#leftMenuAdvancedSettings') // Advanced settings
      .click('#btnEnableIncubatingFeatures') // Show the Incubating Features
      .click('#emailAddressValidationTab-link') // Email Address Validation
      .elementCheckBoxShouldBeSelected('#btnAllowQuotedIdentifiers')
      .elementCheckBoxShouldBeSelected('#btnAllowParensInLocalPart')
      .elementCheckBoxShouldNotBeSelected('#btnAllowDomainLiterals')
      .elementCheckBoxShouldNotBeSelected('#btnAllowDotInaText')
      .elementCheckBoxShouldNotBeSelected('#btnAllowSquareBracketsInaText')
      .inputShouldHaveValue('#txtSkipValidationFor', '')
      .click('#emailTuningTab-link') // Email Tuning
      .elementCheckBoxShouldNotBeSelected('#btnSJMActive')
      .inputShouldHaveValue('#replyToAddress', '')
      .inputShouldHaveValue('#replyToName', '')
      .inputShouldHaveValue('#bounceToAddress', '')
      .inputShouldHaveValue('#bounceToName', '')
      .inputShouldHaveValue('#receiptToAddress', '')
      .inputShouldHaveValue('#receiptToName', '')
      .inputShouldHaveValue('#dispositionNotificationToAddress', '')
      .inputShouldHaveValue('#dispositionNotificationToName', '')
      .inputShouldHaveValue('#dispositionNotificationToAddress', '')
      .inputShouldHaveValue('#dispositionNotificationToName', '')
      .inputShouldHaveValue('#textCustomEmailHeaders', '')
      .inputShouldHaveValue('#textCustomEmailHeaders', '')
      .inputShouldHaveValue('#textCustomSessionProperties', '')
      .elementCheckBoxShouldNotBeSelected('#btnJavaxMailDebug')
      .elementCheckBoxShouldNotBeSelected('#btnTransportModeLoggingOnly')
      .inputShouldHaveValue('#proxyHost', '')
      .inputShouldHaveValue('#proxyUserName', '')
      .inputShouldHaveValue('#proxyPort', '1080')
      .inputShouldHaveValue('#proxyPassword', '')
      .inputShouldHaveValue('#proxySocks5BridgePort', '1081');
  }

  static changeSaveLoadAssertSavedConfiguration(
    ft: FluentTester,
  ): FluentTester {
    const escapedWhich = PATHS.SETTINGS_CONFIG_FILE; //;.replace('.', '\\.');

    return (
      ft
        .gotoBurstScreen()
        .click('#topMenuConfiguration')
        .click('#topMenuConfigurationLoad_burst_' + escapedWhich) // STEP0 - CHANGE VALUES general settings
        .setValue('#burstFileName', '00')
        .setValue('#outputFolder', '01')
        .setValue('#quarantineFolder', '02')
        .click('#btnEnableDisableDistribution') // send checkbox settings
        .click('#btnSendDocumentsEmail')
        .elementShouldBeVisible('#btnEmailConfiguration')
        .click('#btnSendDocumentsUpload')
        .elementShouldBeVisible('#btnUploadConfiguration')
        .click('#btnSendDocumentsWeb')
        .elementShouldBeVisible('#btnWebConfiguration')
        .click('#btnSendDocumentsSMS')
        .elementShouldBeVisible('#btnSMSConfiguration')
        .click('#btnDeleteDocuments')
        .click('#btnQuarantineDocuments')
        .click('#leftMenuEmailSettings') // email SMTP settings
        //.click('#btnUseExistingEmailConnection')
        .setValue('#fromName', '00')
        .setValue('#fromEmailAddress', '01')
        .setValue('#emailServerHost', '02')
        .setValue('#userName', '03')
        .setValue('#smtpPassword', '04')
        .setValue('#smtpPort', '05')
        .click('#btnSSL')
        .click('#btnTLS')
        .click('#emailMessageTab-link') // email message settings
        .setValue('#emailToAddress', '00')
        .setValue('#emailCcAddress', '01')
        .setValue('#emailBccAddress', '02')
        .setValue('#emailSubject', '03')
        .click('#attachmentsTab-link') // .setValue('#wysiwygEmailMessage', '04') email attachments settings
        .click('#btnArchiveAttachmentsTogether')
        .setValue('#archiveFileName', '01')
        .click('#leftMenuUploadSettings') // upload settings
        .click('#ftpTab-link') // FTP settings
        .setValue('#ftpCommand', 'ftp')
        .click('#fileShareTab-link') // File Share settings
        .setValue('#fileShareCommand', 'fileshare')
        .click('#ftpsTab-link') // FTPS settings
        .setValue('#ftpsCommand', 'ftps')
        .click('#sftpTab-link') // SFTP settings
        .setValue('#sftpCommand', 'sftp')
        .click('#httpTab-link') // HTTPS settings
        .setValue('#httpCommand', 'http')
        .click('#cloudUploadTab-link') // Cloud settings
        .setValue('#cloudUploadCommand', 'cloud')
        .click('#leftMenuDocuments2WebSettings') // documents2web settings
        .click('#documentBursterWebTab-link') // documents2web settings
        .setValue('#documentBursterWebCommand', 'documentbursterweb')
        .click('#sharePointTab-link') // SharePoint settings
        .setValue('#sharePointCommand', 'sharepoint')
        .click('#wordPressTab-link') // WordPress settings
        .setValue('#wordPressCommand', 'wordpress')
        .click('#drupalTab-link') // Drupal settings
        .setValue('#drupalCommand', 'drupal')
        .click('#joomlaTab-link') // Joomla settings
        .setValue('#joomlaCommand', 'joomla')
        .click('#otherWebPlatformsTab-link') // Other Web Platforms settings
        .setValue('#otherWebPlatformsCommand', 'otherwebplatforms')
        .click('#leftMenuSMSSettings') // SMS settings
        .setValue('#accountSid', '00')
        .setValue('#authToken', '01')
        .click('#leftMenuTwilioSettings') // Twilio settings
        .setValue('#accountSid', '00')
        .setValue('#authToken', '01')
        .click('#smsMessageTab-link') // SMS Message settings
        .setValue('#fromTelephoneNumber', '00')
        .setValue('#toTelephoneNumber', '01')
        .setValue('#smsText', '02')
        .click('#leftMenuQualitySettings') // QA settings
        .setValue('#qaFromName', '00')
        .setValue('#qaFromEmailAddress', '01')
        .setValue('#qaEmailServerHost', '02')
        .setValue('#qaUserName', '03')
        .setValue('#qaPassword', '04')
        .setValue('#qaPort', '05')
        .click('#btnQASSL')
        .click('#btnQATLS')
        .click('#leftMenuTestEmailServerSettings')
        .setValue('#qaFromName', '00')
        .setValue('#qaFromEmailAddress', '01')
        .setValue('#qaEmailServerHost', '02')
        .setValue('#qaUserName', '03')
        .setValue('#qaPassword', '04')
        .setValue('#qaPort', '05')
        .click('#leftMenuAdvancedSettings') // Advanced settings
        .setValue('#delayEachDistributionBy', '0')
        .setValue('#numberOfUserVariables', '1')
        .setValue('#burstTokenDelimitersStart', '02')
        .setValue('#burstTokenDelimitersEnd', '03')
        .click('#btnReuseToken')
        // .click('#btnHTMLEmailEditCode')
        .click('#btnSplit2ndTime')
        .setValue('#burstTokenDelimitersStart2nd', '04')
        .setValue('#burstTokenDelimitersEnd2nd', '05')
        .click('#leftMenuErrorHandlingSettings') // Error Handling settings
        .click('#continueOnError')
        .click('#btnEnableRetryPolicy')
        .elementShouldBeEnabled('#retryPolicyDelay')
        .elementShouldBeEnabled('#retryPolicyMaxDelay')
        .elementShouldBeEnabled('#retryPolicyMaxRetries')
        .setValue('#retryPolicyDelay', '1')
        .setValue('#retryPolicyMaxDelay', '2')
        .setValue('#retryPolicyMaxRetries', '3')
        .click('#leftMenuAdvancedSettings') // Advanced settings
        .click('#btnEnableIncubatingFeatures') // Show the Incubating Features
        .click('#emailAddressValidationTab-link') // Email Address Validation
        .click('#btnAllowQuotedIdentifiers')
        .click('#btnAllowParensInLocalPart')
        .click('#btnAllowDomainLiterals')
        .click('#btnAllowDotInaText')
        .click('#btnAllowSquareBracketsInaText')
        .setValue('#txtSkipValidationFor', '00')
        .click('#emailTuningTab-link') // Email Tuning
        .click('#btnSJMActive')
        .setValue('#replyToAddress', '00')
        .setValue('#replyToName', '01')
        .setValue('#bounceToAddress', '02')
        .setValue('#bounceToName', '03')
        .setValue('#receiptToAddress', '04')
        .setValue('#receiptToName', '05')
        .setValue('#dispositionNotificationToAddress', '06')
        .setValue('#dispositionNotificationToName', '07')
        .setValue('#textCustomEmailHeaders', '08')
        .setValue('#textCustomSessionProperties', '09')
        .click('#btnJavaxMailDebug')
        .click('#btnTransportModeLoggingOnly')
        .setValue('#proxyHost', '10')
        .setValue('#proxyUserName', '11')
        .setValue('#proxyPort', '12')
        .setValue('#proxyPassword', '13')
        .setValue('#proxySocks5BridgePort', '14')
        // values are supposed to be saved at this moment ==> go away and click burst top menu
        .click('#topMenuBurst')
        // STEP1 - load and assert the saved values
        .click('#topMenuConfiguration')
        .elementShouldHaveText(
          '#topMenuConfigurationLoad_burst_' + escapedWhich,
          'My Reports',
        )
        // general settings
        .click('#topMenuConfigurationLoad_burst_' + escapedWhich)
        .elementShouldHaveText(
          '#topMenuConfiguration',
          'Configuration (My Reports) ',
        )
        .elementShouldHaveText(
          '.sidebar-menu .header',
          'CONFIGURATION (My Reports)',
        )
        .inputShouldHaveValue('#burstFileName', '00')
        .inputShouldHaveValue('#outputFolder', '01')
        .inputShouldHaveValue('#quarantineFolder', '02')
        // send checkbox settings
        .click('#btnEnableDisableDistribution')
        .elementCheckBoxShouldBeSelected('#btnSendDocumentsEmail')
        .elementShouldBeVisible('#btnEmailConfiguration')
        .elementShouldBeVisible('#btnUploadConfiguration')
        .elementCheckBoxShouldBeSelected('#btnSendDocumentsWeb')
        .elementShouldBeVisible('#btnWebConfiguration')
        .elementCheckBoxShouldBeSelected('#btnSendDocumentsSMS')
        .elementShouldBeVisible('#btnSMSConfiguration')
        .elementCheckBoxShouldBeSelected('#btnDeleteDocuments')
        .elementCheckBoxShouldNotBeSelected('#btnQuarantineDocuments')
        // email SMTP settings
        .click('#leftMenuEmailSettings')
        .inputShouldHaveValue('#fromName', '00')
        .inputShouldHaveValue('#fromEmailAddress', '01')
        .inputShouldHaveValue('#emailServerHost', '02')
        .inputShouldHaveValue('#userName', '03')
        .inputShouldHaveValue('#smtpPassword', '04')
        .inputShouldHaveValue('#smtpPort', '05')
        .elementCheckBoxShouldBeSelected('#btnSSL')
        .elementCheckBoxShouldBeSelected('#btnTLS')
        // email message settings
        .click('#emailMessageTab-link')
        .inputShouldHaveValue('#emailToAddress', '00')
        .inputShouldHaveValue('#emailCcAddress', '01')
        .inputShouldHaveValue('#emailBccAddress', '02')
        .inputShouldHaveValue('#emailSubject', '03')
        .elementShouldHaveText('#wysiwygEmailMessage', '')
        // email attachments settings
        .click('#attachmentsTab-link')
        .elementShouldHaveText(
          'tbody tr:first-child td',
          '${extracted_file_path}',
        )
        .elementShouldHaveText(
          'tbody tr:last-child td',
          '${extracted_file_path}',
        )
        .elementCheckBoxShouldBeSelected('#btnArchiveAttachmentsTogether')
        .inputShouldHaveValue('#archiveFileName', '01')
        // upload settings
        .click('#leftMenuUploadSettings')
        .click('#ftpTab-link')
        .inputShouldHaveValue('#ftpCommand', 'ftp')
        // File Share settings
        .click('#fileShareTab-link')
        .inputShouldHaveValue('#fileShareCommand', 'fileshare')
        // FTPS settings
        .click('#ftpsTab-link')
        .inputShouldHaveValue('#ftpsCommand', 'ftps')
        // SFTP settings
        .click('#sftpTab-link')
        .inputShouldHaveValue('#sftpCommand', 'sftp')
        // HTTPS settings
        .click('#httpTab-link')
        .inputShouldHaveValue('#httpCommand', 'http')
        // Cloud settings
        .click('#cloudUploadTab-link')
        .inputShouldHaveValue('#cloudUploadCommand', 'cloud')
        // documents2web settings
        .click('#leftMenuDocuments2WebSettings')
        .click('#documentBursterWebTab-link')
        .inputShouldHaveValue(
          '#documentBursterWebCommand',
          'documentbursterweb',
        )
        // SharePoint settings
        .click('#sharePointTab-link')
        .inputShouldHaveValue('#sharePointCommand', 'sharepoint')
        // WordPress settings
        .click('#wordPressTab-link')
        .inputShouldHaveValue('#wordPressCommand', 'wordpress')
        // Drupal settings
        .click('#drupalTab-link')
        .inputShouldHaveValue('#drupalCommand', 'drupal')
        // Joomla settings
        .click('#joomlaTab-link')
        .inputShouldHaveValue('#joomlaCommand', 'joomla')
        // Other Web Platforms settings
        .click('#otherWebPlatformsTab-link')
        .inputShouldHaveValue('#otherWebPlatformsCommand', 'otherwebplatforms')
        // SMS settings
        .click('#leftMenuSMSSettings')
        .inputShouldHaveValue('#accountSid', '00')
        .inputShouldHaveValue('#authToken', '01')
        // Twilio settings
        .click('#leftMenuTwilioSettings')
        .inputShouldHaveValue('#accountSid', '00')
        .inputShouldHaveValue('#authToken', '01')
        // SMS Message settings
        .click('#smsMessageTab-link')
        .inputShouldHaveValue('#fromTelephoneNumber', '00')
        .inputShouldHaveValue('#toTelephoneNumber', '01')
        .inputShouldHaveValue('#smsText', '02')
        // QA settings
        .click('#leftMenuQualitySettings')
        .inputShouldHaveValue('#qaFromName', '00')
        .inputShouldHaveValue('#qaFromEmailAddress', '01')
        .inputShouldHaveValue('#qaEmailServerHost', '02')
        .inputShouldHaveValue('#qaUserName', '03')
        .inputShouldHaveValue('#qaPassword', '04')
        .inputShouldHaveValue('#qaPort', '05')
        .elementCheckBoxShouldBeSelected('#btnQASSL')
        .elementCheckBoxShouldBeSelected('#btnQATLS')
        .click('#leftMenuTestEmailServerSettings')
        .inputShouldHaveValue('#qaFromName', '00')
        .inputShouldHaveValue('#qaFromEmailAddress', '01')
        .inputShouldHaveValue('#qaEmailServerHost', '02')
        .inputShouldHaveValue('#qaUserName', '03')
        .inputShouldHaveValue('#qaPassword', '04')
        .inputShouldHaveValue('#qaPort', '05')
        .elementCheckBoxShouldBeSelected('#btnQASSL')
        .elementCheckBoxShouldBeSelected('#btnQATLS')
        // Advanced settings
        .click('#leftMenuAdvancedSettings')
        .inputShouldHaveValue('#delayEachDistributionBy', '0')
        .inputShouldHaveValue('#numberOfUserVariables', '1')
        .inputShouldHaveValue('#burstTokenDelimitersStart', '02')
        .inputShouldHaveValue('#burstTokenDelimitersEnd', '03')
        .elementCheckBoxShouldBeSelected('#btnReuseToken')
        // .isSelectedShouldEventuallyEqual('#btnHTMLEmailEditCode', true)
        .elementCheckBoxShouldBeSelected('#btnSplit2ndTime')
        .inputShouldHaveValue('#burstTokenDelimitersStart2nd', '04')
        .inputShouldHaveValue('#burstTokenDelimitersEnd2nd', '05')
        // Error Handling settings
        .click('#leftMenuErrorHandlingSettings')
        .elementCheckBoxShouldNotBeSelected('#stopImmediatelyOnError')
        .elementCheckBoxShouldBeSelected('#continueOnError')
        .elementCheckBoxShouldBeSelected('#btnEnableRetryPolicy')
        .inputShouldHaveValue('#retryPolicyDelay', '1')
        .inputShouldHaveValue('#retryPolicyMaxDelay', '2')
        .inputShouldHaveValue('#retryPolicyMaxRetries', '3')
        .click('#leftMenuAdvancedSettings') // Advanced settings
        .click('#emailAddressValidationTab-link') // Email Address Validation
        .elementCheckBoxShouldNotBeSelected('#btnAllowQuotedIdentifiers')
        .elementCheckBoxShouldNotBeSelected('#btnAllowParensInLocalPart')
        .elementCheckBoxShouldBeSelected('#btnAllowDomainLiterals')
        .elementCheckBoxShouldBeSelected('#btnAllowDotInaText')
        .elementCheckBoxShouldBeSelected('#btnAllowSquareBracketsInaText')
        .inputShouldHaveValue('#txtSkipValidationFor', '00')
        .click('#emailTuningTab-link') // Email Tuning
        .elementCheckBoxShouldBeSelected('#btnSJMActive')
        .inputShouldHaveValue('#replyToAddress', '00')
        .inputShouldHaveValue('#replyToName', '01')
        .inputShouldHaveValue('#bounceToAddress', '02')
        .inputShouldHaveValue('#bounceToName', '03')
        .inputShouldHaveValue('#receiptToAddress', '04')
        .inputShouldHaveValue('#receiptToName', '05')
        .inputShouldHaveValue('#dispositionNotificationToAddress', '06')
        .inputShouldHaveValue('#dispositionNotificationToName', '07')
        .inputShouldHaveValue('#textCustomEmailHeaders', '08')
        .inputShouldHaveValue('#textCustomSessionProperties', '09')
        .elementCheckBoxShouldBeSelected('#btnJavaxMailDebug')
        .elementCheckBoxShouldBeSelected('#btnTransportModeLoggingOnly')
        .inputShouldHaveValue('#proxyHost', '10')
        .inputShouldHaveValue('#proxyUserName', '11')
        .inputShouldHaveValue('#proxyPort', '12')
        .inputShouldHaveValue('#proxyPassword', '13')
        .inputShouldHaveValue('#proxySocks5BridgePort', '14')
    );
  }

  static assertDefaultDocumentBursterReportingConfiguration(
    ft: FluentTester,
    folderName: string,
  ): FluentTester {
    ft = ft
      .gotoConfiguration()
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
      .click('#leftMenuReportingSettings')
      // Test CSV Default Settings
      .waitOnElementToBecomeVisible('#dsTypes')
      .selectedOptionShouldContainText('#dsTypes', 'CSV File')
      .inputShouldHaveValue('#separatorChar', ',')
      .selectedOptionShouldContainText('#selectHeader', 'No Header')
      .inputShouldHaveValue('#skipLines', '0')
      .elementShouldBeDisabled('#skipLines')
      .elementCheckBoxShouldNotBeSelected('#btnShowMoreCsvOptions')
      .elementShouldNotBeVisible('#quotationChar')
      .elementShouldNotBeVisible('#escapeChar')
      .elementShouldNotBeVisible('#btnStrictQuotations')
      .elementShouldNotBeVisible('#btnIgnoreQuotations')
      .elementShouldNotBeVisible('#btnIgnoreLeadingWhitespace')

      // Test CSV header interaction behavior
      .dropDownSelectOptionHavingLabel('#selectHeader', 'First Line')
      .waitOnInputToHaveValue('#skipLines', '1')
      .dropDownSelectOptionHavingLabel('#selectHeader', 'Multiple Lines')
      .waitOnElementToBecomeEnabled('#skipLines')
      .waitOnInputToHaveValue('#skipLines', '2')
      .dropDownSelectOptionHavingLabel('#selectHeader', 'No Header')
      .waitOnElementToBecomeDisabled('#skipLines')
      .waitOnInputToHaveValue('#skipLines', '0')

      // Test CSV advanced options
      .click('#lblShowMoreCsvOptions')
      .waitOnElementToBecomeVisible('#csvIdColumn')
      .waitOnElementToBecomeVisible('#quotationChar')
      .waitOnElementToBecomeVisible('#escapeChar')
      .waitOnElementToBecomeVisible('#btnStrictQuotations')
      .waitOnElementToBecomeVisible('#btnIgnoreQuotations')
      .waitOnElementToBecomeVisible('#btnIgnoreLeadingWhitespace')
      .selectedOptionShouldContainText('#csvIdColumn', 'Not Used')
      .inputShouldHaveValue('#quotationChar', '"')
      .inputShouldHaveValue('#escapeChar', '\\')
      .elementCheckBoxShouldNotBeSelected('#btnStrictQuotations')
      .elementCheckBoxShouldNotBeSelected('#btnIgnoreQuotations')
      .elementCheckBoxShouldBeSelected('#btnIgnoreLeadingWhitespace')
      .click('#lblShowMoreCsvOptions')
      .waitOnElementToBecomeInvisible('#quotationChar')
      .waitOnElementToBecomeInvisible('#escapeChar')
      .waitOnElementToBecomeInvisible('#btnStrictQuotations')
      .waitOnElementToBecomeInvisible('#btnIgnoreQuotations')
      .waitOnElementToBecomeInvisible('#btnIgnoreLeadingWhitespace')

      // Test TSV Default Settings
      .dropDownSelectOptionHavingLabel(
        '#dsTypes',
        'TSV File (local file containing tab-separated values)',
      )
      .waitOnElementToBecomeVisible('#separatorChar')
      .inputShouldHaveValue('#separatorChar', '→ [tab character]')
      .elementAttributeShouldHaveValue('#separatorChar', 'readonly', '')
      .selectedOptionShouldContainText('#selectHeader', 'No Header')
      .inputShouldHaveValue('#skipLines', '0')
      .elementShouldBeDisabled('#skipLines')

      // Test TSV header interaction behavior
      .dropDownSelectOptionHavingLabel('#selectHeader', 'First Line')
      .waitOnInputToHaveValue('#skipLines', '1')
      .dropDownSelectOptionHavingLabel('#selectHeader', 'Multiple Lines')
      .waitOnElementToBecomeEnabled('#skipLines')
      .waitOnInputToHaveValue('#skipLines', '2')

      // Test TSV advanced options (using same IDs as CSV)
      .click('#lblShowMoreCsvOptions')
      .waitOnElementToBecomeVisible('#quotationChar')
      .waitOnElementToBecomeVisible('#escapeChar')
      .elementCheckBoxShouldNotBeSelected('#btnStrictQuotations')
      .elementCheckBoxShouldNotBeSelected('#btnIgnoreQuotations')
      .elementCheckBoxShouldBeSelected('#btnIgnoreLeadingWhitespace')
      .click('#lblShowMoreCsvOptions')
      .waitOnElementToBecomeInvisible('#quotationChar')

      // Test Excel Default Settings
      .dropDownSelectOptionHavingLabel('#dsTypes', 'Excel File (local file)')
      .selectedOptionShouldContainText('#selectExcelHeader', 'No Header')
      .inputShouldHaveValue('#excelSkipLines', '0')
      .inputShouldHaveValue('#excelSheetIndex', '0')
      .elementCheckBoxShouldNotBeSelected('#btnShowMoreExcelOptions')

      // Test Excel advanced options
      .click('#lblShowMoreExcelOptions')
      .waitOnElementToBecomeVisible('#excelIdColumn')
      .waitOnElementToBecomeVisible('#btnExcelIgnoreLeadingWhitespace')
      .waitOnElementToBecomeVisible('#btnExcelUseFormulaResults')
      .selectedOptionShouldContainText('#excelIdColumn', 'Not Used')
      .elementCheckBoxShouldBeSelected('#btnExcelIgnoreLeadingWhitespace')
      .elementCheckBoxShouldBeSelected('#btnExcelUseFormulaResults')

      // Test Excel header interaction behavior
      .dropDownSelectOptionHavingLabel('#selectExcelHeader', 'First Line')
      .waitOnInputToHaveValue('#excelSkipLines', '1')
      .waitOnElementToBecomeDisabled('#excelSkipLines')
      .dropDownSelectOptionHavingLabel('#selectExcelHeader', 'Multiple Lines')
      .waitOnElementToBecomeEnabled('#excelSkipLines')
      .waitOnInputToHaveValue('#excelSkipLines', '2')
      .click('#excelSkipLines')
      .typeText('5') // Test editing when enabled
      .waitOnInputToHaveValue('#excelSkipLines', '5')
      .dropDownSelectOptionHavingLabel('#selectExcelHeader', 'No Header')
      .waitOnElementToBecomeDisabled('#excelSkipLines')
      .waitOnInputToHaveValue('#excelSkipLines', '0')

      // Test Excel ID column options
      .dropDownSelectOptionHavingLabel('#excelIdColumn', 'First Column')
      .dropDownSelectOptionHavingLabel('#excelIdColumn', 'Last Column')
      .dropDownSelectOptionHavingLabel(
        '#excelIdColumn',
        'Custom Column Index...',
      )
      .dropDownSelectOptionHavingLabel('#excelIdColumn', 'Not Used')

      // Hide Excel options again
      .click('#lblShowMoreExcelOptions')
      .waitOnElementToBecomeInvisible('#excelIdColumn')
      .waitOnElementToBecomeInvisible('#btnExcelIgnoreLeadingWhitespace')
      .waitOnElementToBecomeInvisible('#btnExcelUseFormulaResults')

      // Test Fixed Width Default Settings
      .dropDownSelectOptionHavingLabel(
        '#dsTypes',
        'Fixed-Width File (local file containing fixed-width columns)',
      )
      .waitOnElementToBecomeVisible('#fixedWidthColumns')
      .elementShouldBeVisible('#selectFixedWidthHeader')
      .elementShouldBeVisible('#fixedWidthSkipLines')
      .inputShouldHaveValue('#fixedWidthColumns', '')
      .selectedOptionShouldContainText('#selectFixedWidthHeader', 'No Header')
      .inputShouldHaveValue('#fixedWidthSkipLines', '0')
      .elementCheckBoxShouldNotBeSelected('#btnShowMoreFixedWidthOptions')
      .elementShouldNotBeVisible('#btnFixedWidthIgnoreLeadingWhitespace')

      // Test Fixed Width header interaction behavior
      .dropDownSelectOptionHavingLabel('#selectFixedWidthHeader', 'First Line')
      .waitOnInputToHaveValue('#fixedWidthSkipLines', '1')
      .waitOnElementToBecomeDisabled('#fixedWidthSkipLines') // Should be disabled
      .dropDownSelectOptionHavingLabel('#selectFixedWidthHeader', 'No Header')
      .waitOnInputToHaveValue('#fixedWidthSkipLines', '0') // Value should remain 0
      .waitOnElementToBecomeDisabled('#fixedWidthSkipLines') // Should still be disabled

      // Test Fixed Width columns format
      .click('#fixedWidthColumns')
      .typeText('Column1, 10\nColumn2, 15')

      // Test Fixed Width advanced options
      .click('#lblShowMoreFixedWidthOptions')
      .waitOnElementToBecomeVisible('#btnFixedWidthIgnoreLeadingWhitespace')
      .waitOnElementToBecomeVisible('#fixedWidthIdColumn')
      .selectedOptionShouldContainText('#fixedWidthIdColumn', 'Not Used')
      .elementCheckBoxShouldBeSelected('#btnFixedWidthIgnoreLeadingWhitespace')
      .click('#btnFixedWidthIgnoreLeadingWhitespace')
      .elementCheckBoxShouldNotBeSelected(
        '#btnFixedWidthIgnoreLeadingWhitespace',
      )
      .click('#btnFixedWidthIgnoreLeadingWhitespace')
      .elementCheckBoxShouldBeSelected('#btnFixedWidthIgnoreLeadingWhitespace')

      // Hide options again
      .click('#lblShowMoreFixedWidthOptions')
      .waitOnElementToBecomeInvisible('#btnFixedWidthIgnoreLeadingWhitespace')

      // Test Google Sheets feature request modal
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.gsheet')
      .waitOnElementToBecomeVisible('#btnCloseAskForFeatureModal')
      .click('#btnCloseAskForFeatureModal')

      // Test Office 365 feature request modal
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.o365sheet')
      .waitOnElementToBecomeVisible('#btnCloseAskForFeatureModal')
      .click('#btnCloseAskForFeatureModal')

      // Test Database feature request modal
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.database')
      .waitOnElementToBecomeVisible('#btnCloseAskForFeatureModal')
      .click('#btnCloseAskForFeatureModal')

      // Return to CSV format to reset for other tests
      .dropDownSelectOptionHavingLabel(
        '#dsTypes',
        'CSV File (local file containing comma-separated values)',
      );

    // Test Template/Output tab basic functionality and UI elements
    ft = ft
      .click('#reportingTemplateOutputTab-link')
      .waitOnElementToBecomeVisible('#reportOutputType')
      .selectedOptionShouldContainText('#reportOutputType', 'None')
      .waitOnElementToBecomeInvisible('#reportTemplateContainer')
      .elementShouldNotBeVisible('#reportTemplateContainer')
      // Test for help text presence when 'None' is selected
      .waitOnElementToBecomeVisible('#noneOutputTypeHelp')
      .elementShouldContainText(
        '#noneOutputTypeHelp',
        "Output Type 'None' is useful for sending emails without attachments",
      )
      // Test PDF output type
      .dropDownSelectOptionHavingLabel(
        '#reportOutputType',
        'PDF Documents (html_template2pdf_documents)',
      )
      .waitOnElementToBecomeVisible('#reportTemplateContainer')
      .elementShouldBeVisible('#codeJarHtmlTemplateEditor')
      // Test AI and Gallery buttons exist
      .elementShouldBeVisible('#btnAiCopilot')
      .elementShouldBeVisible('#btnAiDropdownToggle')
      .elementShouldBeVisible('#btnOpenTemplateGallery')
      .elementShouldBeVisible('#divTruncatedAbsoluteTemplateFolderPath')
      .elementShouldBeVisible('#btnCopyTemplatePathToClipboard')

      // Test preview toggle - should be visible by default
      .waitOnElementToBecomeVisible('#reportPreviewPane')
      .waitOnElementToBecomeVisible('#btnToggleHtmlPreviewHide')

      // Test hiding preview
      .click('#btnToggleHtmlPreviewHide')
      .waitOnElementToBecomeInvisible('#reportPreviewPane')
      .waitOnElementToBecomeVisible('#btnToggleHtmlPreviewShow')

      // Test showing preview again
      .click('#btnToggleHtmlPreviewShow')
      .waitOnElementToBecomeVisible('#reportPreviewPane')
      .waitOnElementToBecomeVisible('#btnToggleHtmlPreviewHide')

      // Test Excel output type
      .dropDownSelectOptionHavingLabel(
        '#reportOutputType',
        'Microsoft Excel Documents (html_template2xlsx_documents)',
      )
      .waitOnElementToBecomeVisible('#reportTemplateContainer')
      .elementShouldBeVisible('#codeJarHtmlTemplateEditor')
      .elementShouldBeVisible('#btnAiCopilot')
      .elementShouldBeVisible('#btnAiDropdownToggle')
      .elementShouldBeVisible('#btnOpenTemplateGallery')
      .elementShouldBeVisible('#divTruncatedAbsoluteTemplateFolderPath')
      .elementShouldBeVisible('#btnCopyTemplatePathToClipboard')
      .waitOnElementToBecomeVisible('#reportPreviewPane')

      // Test HTML output type
      .dropDownSelectOptionHavingLabel(
        '#reportOutputType',
        'HTML Documents (html_template2html_documents)',
      )
      .waitOnElementToBecomeVisible('#reportTemplateContainer')
      .elementShouldBeVisible('#codeJarHtmlTemplateEditor')
      .elementShouldBeVisible('#btnAiCopilot')
      .elementShouldBeVisible('#btnAiDropdownToggle')
      .elementShouldBeVisible('#btnOpenTemplateGallery')
      .elementShouldBeVisible('#divTruncatedAbsoluteTemplateFolderPath')
      .elementShouldBeVisible('#btnCopyTemplatePathToClipboard')
      .waitOnElementToBecomeVisible('#reportPreviewPane');

    // Test DOCX Output Type UI elements
    ft = ft
      .dropDownSelectOptionHavingValue('#reportOutputType', 'output.docx')
      .waitOnElementToBecomeVisible('#reportTemplateContainer')
      .waitOnElementToBecomeVisible('#selectTemplateFile')
      .click('.ng-select-container') // Open dropdown to see "no templates found" message
      .waitOnElementToBecomeVisible('#noDocxTemplatesFound')
      .waitOnElementToBecomeVisible('#noDocxTemplatesFoundCode')
      .elementShouldContainText(
        '#noDocxTemplatesFoundCode',
        '/templates/reports/payslips',
      )
      .pressKey('Escape') // Close the dropdown
      .waitOnElementToBecomeVisible('#divTruncatedAbsoluteTemplateFolderPath')
      .elementShouldBeVisible('#divTruncatedAbsoluteTemplateFolderPath')
      .elementShouldContainText(
        '#divTruncatedAbsoluteTemplateFolderPath',
        `/templates/reports/${folderName}`,
      )
      .elementShouldBeVisible('#btnCopyTemplatePathToClipboard')
      .click('#btnCopyTemplatePathToClipboard')
      .waitOnElementWithTextToBecomeVisible('Copied to clipboard');

    // Reset to None for clean state
    ft = ft
      .dropDownSelectOptionHavingLabel('#reportOutputType', 'None')
      .waitOnElementToBecomeInvisible('#reportTemplateContainer')
      .waitOnElementToBecomeInvisible('#selectTemplateFile');

    return ft;
  }

  static changeSaveLoadAssertSavedReportingConfiguration(
    ft: FluentTester,
    folderName: string,
    reportOutputType: string,
    galleryTemplateCount: number,
  ): FluentTester {
    // Global counter for all text/numeric fields
    let globalCounter = 1;

    // First, handle the datasource tab
    ft = ft
      .gotoBurstScreen()
      .click('#topMenuConfiguration')
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
      .click('#leftMenuReportingSettings')
      .click('#reportingDataSourceDataTablesTab-link');

    // Start with CSV datasource to verify separator is editable
    ft = ft
      .waitOnElementToBecomeVisible('#separatorChar')
      // Verify separator is editable for CSV
      .elementShouldNotHaveAttribute('#separatorChar', 'readonly')
      // Set separator char to deterministic value using global counter
      .setValue('#separatorChar', `Field Value ${globalCounter++}`)

      // Select "Multiline" for header so we can set skipLines
      .dropDownSelectOptionHavingValue('#selectHeader', 'multiline')

      // Set Skip Lines value - should be enabled with multiline
      .setValue('#skipLines', `${globalCounter++}`)

      // Show more CSV options to access additional settings
      .click('#lblShowMoreCsvOptions')

      // Set ID Column to "Not Used"
      .dropDownSelectOptionHavingValue('#csvIdColumn', 'notused')

      // Set text values for quotation and escape characters
      .setValue('#quotationChar', `Field Value ${globalCounter++}`)
      .setValue('#escapeChar', `Field Value ${globalCounter++}`)

      // Set checkbox states using the new API
      .setCheckboxState('#btnStrictQuotations', globalCounter++ % 2 === 0)
      .setCheckboxState('#btnIgnoreQuotations', globalCounter++ % 2 === 0)
      .setCheckboxState(
        '#btnIgnoreLeadingWhitespace',
        globalCounter++ % 2 === 0,
      );

    // Store expected values for later verification of both CSV and TSV (since they share the model)
    const csvTsvSeparatorCharValue = 'Field Value 1';
    const csvTsvSkipLinesValue = '2';
    const csvTsvQuotationCharValue = 'Field Value 3';
    const csvTsvEscapeCharValue = 'Field Value 4';
    const csvTsvStrictQuotationsState = 5 % 2 === 0; // true
    const csvTsvIgnoreQuotationsState = 6 % 2 === 0; // false
    const csvTsvIgnoreLeadingWhitespaceState = 7 % 2 === 0; // true

    // Change to TSV to verify the readonly separator char (the only difference)
    ft = ft
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.tsvfile')
      .waitOnElementToBecomeReadonly('#separatorChar')
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.csvfile')
      .waitOnElementToBecomeEditable('#separatorChar')
      .sleep(Constants.DELAY_HALF_SECOND) // Wait for the value to be set
      .setValue('#separatorChar', csvTsvSeparatorCharValue)
      .sleep(Constants.DELAY_HALF_SECOND); // Wait for the value to be set
    //.waitOnToastToBecomeVisible('success', 'Saved');

    // Change to Fixed Width datasource and test its settings
    ft = ft
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.fixedwidthfile')

      // Set column definitions using the specified format
      .setValue(
        '#fixedWidthColumns',
        `Column 1, 10\nColumn 2, 20\nColumn 3, 15`,
      )

      // Select "No Header" option for Fixed Width Header dropdown
      .dropDownSelectOptionHavingValue('#selectFixedWidthHeader', 'noheader')

      // Show more Fixed Width options to access additional settings
      .click('#lblShowMoreFixedWidthOptions')

      // Set ID Column to "Not Used" (consistent with requirement)
      .dropDownSelectOptionHavingValue('#fixedWidthIdColumn', 'notused')

      // Set Trim Whitespaces checkbox state using global counter for deterministic testing
      .setCheckboxState(
        '#btnFixedWidthIgnoreLeadingWhitespace',
        globalCounter++ % 2 === 0,
      );

    // Store expected values for Fixed Width verification
    const fixedWidthColumnsValue = 'Column 1, 10\nColumn 2, 20\nColumn 3, 15';
    const fixedWidthSkipLinesValue = '0'; // Always 0 for noheader, regardless of what we tried to set
    const fixedWidthIgnoreLeadingWhitespaceState = 8 % 2 === 0; // false

    // Change to Excel
    ft = ft
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.excelfile')
      // Excel options
      .dropDownSelectOptionHavingValue('#selectExcelHeader', 'multiline')
      .setValue('#excelSkipLines', `${globalCounter++}`)
      .setValue('#excelSheetIndex', `${globalCounter++}`)
      // Excel toggle options - set specific state
      .click('#lblShowMoreExcelOptions')
      // Excel dropdown and numeric - use counter
      .dropDownSelectOptionHavingValue('#excelIdColumn', 'custom')
      .setValue('#excelCustomIdColumnIndex', `${globalCounter++}`)
      // More Excel toggle options - set specific states
      .setCheckboxState('#btnExcelIgnoreLeadingWhitespace', true)
      .setCheckboxState('#btnExcelUseFormulaResults', true);

    // Store expected values for Excel verification
    const excelSkipLinesValue = '9';
    const excelSheetIndexValue = '10';
    const excelCustomIdColumnIndexValue = '11';

    ft = ft
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.csvfile')
      .waitOnElementToBecomeVisible('#separatorChar')
      .setValue('#separatorChar', csvTsvSeparatorCharValue);

    // Now move to Template Output tab
    ft = ft.click('#reportingTemplateOutputTab-link');

    // Define HTML-based output types (exclude DOCX)
    const htmlBasedOutputTypes = ['output.pdf', 'output.xlsx', 'output.html'];

    // Log the output type being used (passed from outside)
    ft = ft.consoleLog(
      `Using output type: ${reportOutputType} for gallery test`,
    );

    // First switch to our output type for gallery test
    ft = ft
      .dropDownSelectOptionHavingValue('#reportOutputType', reportOutputType)
      .waitOnElementToBecomeVisible('#reportTemplateContainer');

    // Test the gallery for the specified output type
    ft = ft
      .waitOnElementToBecomeVisible('#btnOpenTemplateGallery')
      .click('#btnOpenTemplateGallery')
      // If there are initial instructions, confirm them
      .waitOnElementToBecomeVisible('#btnConfirmAiGalleryInstructions')
      .click('#btnConfirmAiGalleryInstructions')
      // Wait for template gallery to load
      .waitOnElementToBecomeVisible('.p-carousel-next');

    // Choose a random template from the available ones
    const randomTemplateIndex =
      Math.floor(Math.random() * galleryTemplateCount) + 1;
    ft = ft.consoleLog(
      `Will select random template #${randomTemplateIndex} from gallery`,
    );

    // Navigate to that random template (if not already on the first one)
    if (randomTemplateIndex > 1) {
      for (let i = 1; i < randomTemplateIndex; i++) {
        ft = ft.click('.p-carousel-next').sleep(Constants.DELAY_HALF_SECOND);
      }
    }

    // Use the selected template
    ft = ft
      .click('#btnUseSelectedTemplate')
      .waitOnElementToBecomeVisible('.p-confirm-dialog-accept')
      //click "Yes" to confirm using the selected template
      .click('.p-confirm-dialog-accept')
      .waitOnElementToBecomeInvisible('.p-confirm-dialog-accept')
      .waitOnElementToBecomeVisible('#codeJarHtmlTemplateEditor');

    // a) Verify template is correctly loaded in the code editor
    ft = ft.codeJarShouldContainText('#codeJarHtmlTemplateEditor', '<html');

    // b) Verify the template is correctly previewed in the iframe
    ft = ft
      .waitOnElementToBecomeVisible('#reportPreviewPane')
      .elementShouldBeVisible('#reportPreviewPane');

    // c) Test view in browser button
    ft = ft
      .click('#btnViewHtmlInBrowser')
      // When view in browser is clicked, we stay on the same page
      // so we need to check that the view still exists
      .waitOnElementToBecomeVisible('#codeJarHtmlTemplateEditor');

    // Test the preview toggle functionality
    ft = ft
      .elementShouldBeVisible('#btnToggleHtmlPreviewHide')
      .click('#btnToggleHtmlPreviewHide')
      .waitOnElementToBecomeVisible('#btnToggleHtmlPreviewShow')
      .waitOnElementToBecomeInvisible('#reportPreviewPane')
      .elementShouldNotBeVisible('#reportPreviewPane')
      .click('#btnToggleHtmlPreviewShow')
      .waitOnElementToBecomeVisible('#reportPreviewPane')
      .waitOnElementToBecomeVisible('#btnToggleHtmlPreviewHide')
      .elementShouldBeVisible('#reportPreviewPane');

    // Test the splitter functionality
    ft = ft
      .elementShouldBeVisible('.as-split-gutter-icon')
      .click('.as-split-gutter-icon')
      .hover('.as-split-gutter-icon')
      .hover('#codeJarHtmlTemplateEditor')
      .hover('#reportPreviewPane');

    // For the other HTML-based output types, set simple HTML content
    const remainingHtmlOutputTypes = htmlBasedOutputTypes.filter(
      (type) => type !== reportOutputType,
    );
    for (const outputType of remainingHtmlOutputTypes) {
      ft = ft
        .dropDownSelectOptionHavingValue('#reportOutputType', outputType)
        .waitOnElementToBecomeVisible('#codeJarHtmlTemplateEditor')
        .sleep(Constants.DELAY_ONE_SECOND)
        // Use setCodeJarContent instead of keyboard simulation
        .setCodeJarContent(
          '#codeJarHtmlTemplateEditor',
          `<html><body><h1>Hello ${outputType}</h1></body></html>`,
        )
        // Wait for preview to update
        .sleep(Constants.DELAY_ONE_SECOND);
    }

    // Now test the DOCX output type specifically
    ft = ft
      .dropDownSelectOptionHavingValue('#reportOutputType', 'output.docx')
      .waitOnElementToBecomeVisible('#selectTemplateFile')
      .selectNgOption('#selectTemplateFile', 'payslips-template.docx');

    // Test trying to use HTML template with DOCX output type
    ft = ft
      .waitOnElementToBecomeVisible('#btnOpenTemplateGallery')
      .click('#btnOpenTemplateGallery')
      // If there are initial instructions, confirm them
      .waitOnElementToBecomeVisible('#btnConfirmAiGalleryInstructions')
      .click('#btnConfirmAiGalleryInstructions')
      // Wait for gallery to load and try to use first template
      .waitOnElementToBecomeVisible('.p-carousel-next')
      .click('#btnUseSelectedTemplate')
      .waitOnToastToBecomeVisible(
        'warning',
        'HTML templates cannot be used with DOCX output type',
      )
      .click('#btnCloseTemplateGalleryX')
      .sleep(Constants.DELAY_TEN_SECONDS); // Wait for the value to be set

    ft = ft
      .gotoBurstScreen()
      .click('#topMenuConfiguration')
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
      .click('#leftMenuReportingSettings')
      .click('#reportingDataSourceDataTablesTab-link');

    // Verify the CSV datasource settings were correctly saved
    ft = ft
      //.dropDownSelectOptionHavingValue('#dsTypes', 'ds.csvfile')
      // Verify separator char
      .dropDownShouldHaveSelectedOption('#dsTypes', 'ds.csvfile')
      .waitOnElementToBecomeVisible('#separatorChar')
      .inputShouldHaveValue('#separatorChar', csvTsvSeparatorCharValue)
      // Verify "Show More Options" is checked
      .elementCheckBoxShouldBeSelected('#btnShowMoreCsvOptions')
      // Verify ID Column is "notused" (by checking custom input is not visible)
      .elementShouldNotBeVisible('#csvCustomIdColumnIndex')
      // Verify quotation char and escape char
      .inputShouldHaveValue('#quotationChar', csvTsvQuotationCharValue)
      .inputShouldHaveValue('#escapeChar', csvTsvEscapeCharValue);

    // Verify checkboxes based on calculated states
    if (csvTsvStrictQuotationsState) {
      ft = ft.elementCheckBoxShouldBeSelected('#btnStrictQuotations');
    } else {
      ft = ft.elementCheckBoxShouldNotBeSelected('#btnStrictQuotations');
    }

    if (csvTsvIgnoreQuotationsState) {
      ft = ft.elementCheckBoxShouldBeSelected('#btnIgnoreQuotations');
    } else {
      ft = ft.elementCheckBoxShouldNotBeSelected('#btnIgnoreQuotations');
    }

    if (csvTsvIgnoreLeadingWhitespaceState) {
      ft = ft.elementCheckBoxShouldBeSelected('#btnIgnoreLeadingWhitespace');
    } else {
      ft = ft.elementCheckBoxShouldNotBeSelected('#btnIgnoreLeadingWhitespace');
    }

    // Verify TSV datasource settings - only check TSV-specific aspects
    // (readonly separator and that it retained the multiline header option)
    ft = ft
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.tsvfile')
      // Verify separator is readonly for TSV
      .waitOnElementToBecomeReadonly('#separatorChar')
      // Verify header dropdown for TSV
      .dropDownShouldHaveSelectedOption('#selectHeader', 'multiline')
      // Verify skipLines value
      .inputShouldHaveValue('#skipLines', csvTsvSkipLinesValue);

    // Verify Fixed Width datasource settings were correctly saved
    ft = ft
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.fixedwidthfile')
      .waitOnElementToBecomeVisible('#fixedWidthColumns')
      // Verify columns text content
      .inputShouldHaveValue('#fixedWidthColumns', fixedWidthColumnsValue)
      // Verify header dropdown option
      .dropDownShouldHaveSelectedOption('#selectFixedWidthHeader', 'noheader')
      // Verify skip lines is 0 and disabled (as expected with noheader)
      .inputShouldHaveValue('#fixedWidthSkipLines', fixedWidthSkipLinesValue)
      // Verify "Show More Options" is checked
      .elementCheckBoxShouldBeSelected('#btnShowMoreFixedWidthOptions')
      // Verify ID Column is "notused"
      .dropDownShouldHaveSelectedOption('#fixedWidthIdColumn', 'notused')
      // Verify Trim Whitespaces checkbox state
      .elementShouldBeVisible('#btnFixedWidthIgnoreLeadingWhitespace');

    // Verify Fixed Width checkbox state based on calculated value
    if (fixedWidthIgnoreLeadingWhitespaceState) {
      ft = ft.elementCheckBoxShouldBeSelected(
        '#btnFixedWidthIgnoreLeadingWhitespace',
      );
    } else {
      ft = ft.elementCheckBoxShouldNotBeSelected(
        '#btnFixedWidthIgnoreLeadingWhitespace',
      );
    }

    // Excel - verify values
    ft = ft
      .dropDownSelectOptionHavingValue('#dsTypes', 'ds.excelfile')
      .waitOnElementToBecomeVisible('#excelSkipLines')
      .inputShouldHaveValue('#excelSkipLines', excelSkipLinesValue)
      .inputShouldHaveValue('#excelSheetIndex', excelSheetIndexValue)
      .elementCheckBoxShouldBeSelected('#btnShowMoreExcelOptions')
      .inputShouldHaveValue(
        '#excelCustomIdColumnIndex',
        excelCustomIdColumnIndexValue,
      )
      .elementCheckBoxShouldBeSelected('#btnExcelIgnoreLeadingWhitespace')
      .elementCheckBoxShouldBeSelected('#btnExcelUseFormulaResults');

    // Verify the template output settings
    ft = ft.click('#reportingTemplateOutputTab-link');

    // IMPROVED: First check the gallery-selected template (should have complex HTML content)
    ft = ft
      .waitOnElementToBecomeVisible('#reportOutputType')
      .dropDownShouldHaveSelectedOption('#reportOutputType', 'output.docx')
      .elementShouldContainText('.ng-value', 'payslips-template.docx')
      .dropDownSelectOptionHavingValue('#reportOutputType', reportOutputType)
      .sleep(Constants.DELAY_HALF_SECOND)
      .waitOnElementToBecomeVisible('#codeJarHtmlTemplateEditor')
      // Verify it starts with <html, this confirms it's HTML content
      .codeJarShouldContainText('#codeJarHtmlTemplateEditor', '<html')
      // Verify it contains other HTML structural elements (more robust than just checking for <html)
      .codeJarShouldContainText('#codeJarHtmlTemplateEditor', '<body')
      .codeJarShouldContainText('#codeJarHtmlTemplateEditor', '<head')
      // Check for common template elements that indicate complexity
      .codeJarShouldContainText('#codeJarHtmlTemplateEditor', '<div')
      .codeJarShouldContainText('#codeJarHtmlTemplateEditor', '<style')
      // Make sure the preview is visible, confirming template renders correctly
      .elementShouldBeVisible('#reportPreviewPane')
      .sleep(Constants.DELAY_ONE_SECOND); // Wait for the value to be set

    // IMPROVED: Check the simple templates match their expected format exactly
    for (const outputType of remainingHtmlOutputTypes) {
      ft = ft
        .dropDownSelectOptionHavingValue('#reportOutputType', outputType)
        .sleep(Constants.DELAY_HALF_SECOND)
        .waitOnElementToBecomeVisible('#codeJarHtmlTemplateEditor')
        // Verify the exact content matches our simple template format
        .codeJarShouldContainText(
          '#codeJarHtmlTemplateEditor',
          `<html><body><h1>Hello ${outputType}</h1></body></html>`,
        )
        .sleep(Constants.DELAY_ONE_SECOND); // Wait for the value to be set
    }

    return ft;
  }

  static assertTemplateOutputAIToolbarAndGalleryFeatures(
    ft: FluentTester,
    outputTypeCode: string,
    galleryTemplateCount: number,
  ): FluentTester {
    // Map output type codes to their dropdown label equivalents
    const outputTypeLabels = {
      'output.pdf': 'PDF Documents (html_template2pdf_documents)',
      'output.xlsx': 'Microsoft Excel Documents (html_template2xlsx_documents)',
      'output.html': 'HTML Documents (html_template2html_documents)',
      'output.docx': 'Microsoft Word Documents (docx_template2docx_documents)',
      'output.none': 'None',
    };

    // We're already on the template output tab, select the requested output type
    ft = ft
      .waitOnElementToBecomeVisible('#reportOutputType')
      .dropDownSelectOptionHavingLabel(
        '#reportOutputType',
        outputTypeLabels[outputTypeCode],
      );

    // Wait for appropriate element based on output type
    if (outputTypeCode === 'output.docx') {
      ft = ft.waitOnElementToBecomeVisible('#selectTemplateFile');
    } else if (outputTypeCode !== 'output.none') {
      ft = ft.waitOnElementToBecomeVisible('#codeJarHtmlTemplateEditor');
    }

    // Step 1: Verify AI Copilot button exists
    ft = ft.elementShouldBeVisible('#btnAiCopilot');

    // Step 2: Test "Hey AI" workflow
    ft = ft
      .click('#btnAiDropdownToggle')
      .waitOnElementToBecomeVisible('#btnAskAiForHelp')
      .click('#btnAskAiForHelp')
      .waitOnElementToBecomeVisible('#aiInstructionsContainer')
      .elementShouldBeVisible('#aiInstructionsContent')
      .elementShouldBeVisible('#btnConfirmAiHelp')
      .click('#btnCloseTemplateGalleryX')
      .waitOnElementToBecomeVisible('#btnOpenTemplateGallery')
      .click('#btnOpenTemplateGallery')
      .waitOnElementToBecomeVisible('#aiInstructionsContainer')
      .elementShouldBeVisible('#aiInstructionsContent')
      .click('#btnConfirmAiGalleryInstructions')
      .waitOnElementToBecomeVisible('.p-carousel-next')
      .pageShouldContainText('View Template'); // Verify at least one template exists

    // Calculate random template index based on provided count
    const randomTemplateIndex =
      Math.floor(Math.random() * galleryTemplateCount) + 1;

    ft = ft.consoleLog(
      `Will browse ${galleryTemplateCount} templates and test random template #${randomTemplateIndex}`,
    );

    // Assert the first template's title before starting navigation
    ft = ft
      .elementShouldContainText('#galleryDialogTitle', 'Examples (Gallery)')
      .elementShouldBeVisible('.template-tags');

    // Navigate through all templates
    for (let i = 1; i < galleryTemplateCount; i++) {
      ft = ft
        .click('.p-carousel-next')
        .waitOnElementToBecomeVisible('.template-footer')
        // Verify each template has a title and tags
        .elementShouldContainText('#galleryDialogTitle', 'Examples (Gallery)')
        .elementShouldBeVisible('.template-tags');

      // When we reach our randomly selected template, test all interactive elements
      if (i === randomTemplateIndex) {
        // Test zoom controls for the random template
        ft = ft.elementShouldBeVisible('.iframe-zoom-controls');
        //not uniquely identifiable, so we skip for now
        //.click('.iframe-zoom-controls button[title="Zoom In"]:visible')
        //.click('.iframe-zoom-controls button[title="Zoom Out"]:visible')
        //.click('.iframe-zoom-controls button[title="Reset Zoom"]:visible');

        // Step 4: Test "Get AI Prompt" functionality for modify
        ft = ft
          .elementShouldBeVisible('#btnGetAiPrompt')
          .click('#btnGetAiPrompt')
          .waitOnElementToBecomeVisible('#aiPromptContainer')
          .waitOnElementToBecomeVisible('#aiPromptContent')
          .elementShouldContainText(
            '#aiPromptSteps',
            'Tailor Customization Instructions',
          )
          .waitOnElementToBecomeVisible('#btnCopyTemplatePromptToClipboardTop')
          .click('#btnCopyTemplatePromptToClipboardTop')
          .waitOnElementWithTextToBecomeVisible('Copied to clipboard')
          .waitOnElementToBecomeVisible('#btnBackToTemplate')
          .click('#btnBackToTemplate')
          .waitOnElementToBecomeVisible('#galleryTemplateCarousel');

        // Step 5: Test "Get AI Prompt" with rebuild option
        ft = ft
          .elementShouldBeVisible('#btnAiPromptDropdownToggle')
          .click('#btnAiPromptDropdownToggle')
          .waitOnElementToBecomeVisible('#btnAiPromptRebuild')
          .click('#btnAiPromptRebuild')
          .waitOnElementToBecomeVisible('#aiPromptContainer')
          .waitOnElementToBecomeVisible('#aiPromptContent')
          .elementShouldContainText('#aiPromptSteps', 'tailor the prompt')
          .waitOnElementToBecomeVisible('#btnBackToTemplate')
          .click('#btnBackToTemplate')
          .waitOnElementToBecomeVisible('#galleryTemplateCarousel');

        // Step 6: Test README button if it exists
        ft = ft
          .elementShouldBeVisible('.template-footer')
          .elementShouldBeVisible('#btnViewTemplateReadme')
          .click('#btnViewTemplateReadme')
          .waitOnElementToBecomeVisible('#readmeDialogContainer')
          .waitOnElementToBecomeVisible('#templateReadmeContent')
          .elementShouldBeVisible('#templateReadmeContent')
          .click('#btnBackToTemplate')
          .waitOnElementToBecomeVisible('#galleryTemplateCarousel');

        // Step 7: Test "View in Browser" button exists
        ft = ft.elementShouldBeVisible('#btnViewHtmlInBrowserModal');
      }
    }

    // Step 8: Close the gallery modal
    ft = ft.click('#btnCloseTemplateGalleryX');

    // Return to original state - set output type to None
    return ft
      .waitOnElementToBecomeVisible('#reportOutputType')
      .dropDownSelectOptionHavingLabel('#reportOutputType', 'None')
      .waitOnElementToBecomeInvisible('#reportTemplateContainer');
  }
}
