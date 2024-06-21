import _ from 'lodash';

import { FluentTester } from '../fluent-tester';
import * as PATHS from '../../utils/paths';
import { Constants } from '../../utils/constants';

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
        .click('#btnUseExistingEmailConnection')
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
      //tab DataSource - assert the default values
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
      //do some changes and assert that UI is updated correctly
      .dropDownSelectOptionHavingLabel('#selectHeader', 'First Line')
      .waitOnInputToHaveValue('#skipLines', '1')
      .dropDownSelectOptionHavingLabel('#selectHeader', 'Multiple Lines')
      .waitOnElementToBecomeEnabled('#skipLines')
      .waitOnInputToHaveValue('#skipLines', '2')
      .dropDownSelectOptionHavingLabel('#selectHeader', 'No Header')
      .waitOnElementToBecomeDisabled('#skipLines')
      .waitOnInputToHaveValue('#skipLines', '0')
      //btnShowMoreCsvOptions
      .click('#lblShowMoreCsvOptions')
      .waitOnElementToBecomeVisible('#quotationChar')
      .waitOnElementToBecomeVisible('#escapeChar')
      .waitOnElementToBecomeVisible('#btnStrictQuotations')
      .waitOnElementToBecomeVisible('#btnIgnoreQuotations')
      .waitOnElementToBecomeVisible('#btnIgnoreLeadingWhitespace')
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
      //tab Output/Template - assert the default values
      .click('#reportingTemplateOutputTab-link')
      .waitOnElementToBecomeVisible('#reportOutputType')
      .selectedOptionShouldContainText('#reportOutputType', 'None')
      .elementShouldNotBeVisible('#reportTemplate')
      .dropDownSelectOptionHavingLabel(
        '#reportOutputType',
        'Microsoft Word Documents',
      )
      .waitOnElementToBecomeVisible('#reportTemplate')
      .waitOnElementToBecomeVisible('#selectTemplateFile')
      .click('.ng-clear-wrapper')
      .click('.ng-arrow-wrapper')
      .pageShouldContainText('payslips-template.docx')
      .click('span :text("payslips-template.docx")')
      .click('.ng-clear-wrapper')
      .dropDownSelectOptionHavingLabel('#reportOutputType', 'None')
      .waitOnElementToBecomeInvisible('#reportTemplate')
      .waitOnElementToBecomeInvisible('#selectTemplateFile');

    return ft;
  }

  static changeSaveLoadAssertSavedReportingConfiguration(
    ft: FluentTester,
    folderName: string,
  ): FluentTester {
    return (
      ft
        .gotoBurstScreen()
        .click('#topMenuConfiguration')
        .click(
          `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuReportingSettings')
        //tab DataSource
        .waitOnElementToBecomeVisible('#dsTypes')
        .inputShouldHaveValue('#separatorChar', ',')
        .click('#separatorChar')
        .typeText('')
        .typeText('|')
        .dropDownSelectOptionHavingLabel('#selectHeader', 'Multiple Lines')
        .waitOnElementToBecomeEnabled('#skipLines')
        .waitOnInputToHaveValue('#skipLines', '2')
        .click('#skipLines')
        .typeText('')
        .typeText('8')
        //btnShowMoreCsvOptions
        .click('#lblShowMoreCsvOptions')
        .waitOnElementToBecomeVisible('#quotationChar')
        .waitOnElementToBecomeVisible('#escapeChar')
        .waitOnElementToBecomeVisible('#btnStrictQuotations')
        .waitOnElementToBecomeVisible('#btnIgnoreQuotations')
        .waitOnElementToBecomeVisible('#btnIgnoreLeadingWhitespace')
        .inputShouldHaveValue('#quotationChar', '"')
        .click('#quotationChar')
        .typeText('')
        .typeText("'")
        .inputShouldHaveValue('#escapeChar', '\\')
        .click('#escapeChar')
        .typeText('')
        .typeText('#')
        .elementCheckBoxShouldNotBeSelected('#btnStrictQuotations')
        .elementCheckBoxShouldNotBeSelected('#btnIgnoreQuotations')
        .elementCheckBoxShouldBeSelected('#btnIgnoreLeadingWhitespace')
        .click('#btnStrictQuotations')
        .click('#btnIgnoreQuotations')
        .click('#btnIgnoreLeadingWhitespace')
        //tab Output/Template
        .click('#reportingTemplateOutputTab-link')
        .waitOnElementToBecomeVisible('#reportOutputType')
        .dropDownSelectOptionHavingLabel(
          '#reportOutputType',
          'Microsoft Word Documents',
        )
        .waitOnElementToBecomeVisible('#reportTemplate')
        .waitOnElementToBecomeVisible('#selectTemplateFile')
        .click('.ng-clear-wrapper')
        .click('.ng-arrow-wrapper')
        .pageShouldContainText('payslips-template.docx')
        .click('span :text("payslips-template.docx")')
        .dropDownSelectOptionHavingLabel('#reportOutputType', 'None')
        .dropDownSelectOptionHavingLabel(
          '#reportOutputType',
          'Microsoft Word Documents',
        )
        .gotoConfiguration()
        .click(
          `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuReportingSettings')
        //tab DataSource - assert the default values
        .waitOnElementToBecomeVisible('#dsTypes')
        .selectedOptionShouldContainText('#dsTypes', 'CSV File')
        .inputShouldHaveValue('#separatorChar', '|')
        .selectedOptionShouldContainText('#selectHeader', 'Multiple Lines')
        .elementShouldBeEnabled('#skipLines')
        .inputShouldHaveValue('#skipLines', '8')
        .elementShouldBeVisible('#quotationChar')
        .elementShouldBeVisible('#escapeChar')
        .elementShouldBeVisible('#btnStrictQuotations')
        .elementShouldBeVisible('#btnIgnoreQuotations')
        .elementShouldBeVisible('#btnIgnoreLeadingWhitespace')
        .inputShouldHaveValue('#quotationChar', "'")
        .inputShouldHaveValue('#escapeChar', '#')
        .elementCheckBoxShouldBeSelected('#btnStrictQuotations')
        .elementCheckBoxShouldBeSelected('#btnIgnoreQuotations')
        .elementCheckBoxShouldNotBeSelected('#btnIgnoreLeadingWhitespace')
        //tab Output/Template
        .click('#reportingTemplateOutputTab-link')
        .waitOnElementToBecomeVisible('#reportTemplate')
        .waitOnElementToBecomeVisible('#selectTemplateFile')
        .selectedOptionShouldContainText(
          '#reportOutputType',
          'Microsoft Word Documents',
        )
        .pageShouldContainText('payslips-template.docx')
    );
  }
}
