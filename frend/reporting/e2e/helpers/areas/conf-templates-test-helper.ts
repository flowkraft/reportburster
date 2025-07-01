import { FluentTester } from '../fluent-tester';
import * as PATHS from '../../utils/paths';
import _ from 'lodash';

export class ConfTemplatesTestHelper {
  static createNewTemplate = (
    ft: FluentTester,
    templateName: string,
    mailMergeCapability?: string,
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
        `settings/${PATHS.SETTINGS_CONFIG_FILE}`,
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
        `/reports/${folderName}/${PATHS.SETTINGS_CONFIG_FILE}`,
      );
    }
    return ft
      .clickYesDoThis()
      .waitOnElementToHaveText(
        `#${folderName}_${PATHS.SETTINGS_CONFIG_FILE} td:first-child`,
        templateName,
      );
  };

  static assertShowHideWorksFine = (
    ft: FluentTester,
    folderName: string,
  ): FluentTester => {
    const selector = `${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`;

    ft = ft
      .clickAndSelectTableRow(`#${selector}`)
      .click(`#btnActions_${selector}`)
      .click(`#btnActionHideShow_${selector}`)
      .clickNoDontDoThis()
      .elementShouldContainText(`#btnActions_${selector} button`, 'Visible')
      .click(`#btnActions_${selector}`)
      .click(`#btnActionHideShow_${selector}`)
      .clickYesDoThis()
      .waitOnElementToContainText(`#btnActions_${selector} button`, 'Hidden')
      .click('#topMenuBurst')
      .click('#topMenuConfiguration')
      .elementShouldNotBeVisible(`#topMenuConfigurationLoad_${selector}`);

    return ft
      .gotoConfigurationTemplates()
      .elementShouldContainText(`#btnActions_${selector} button`, 'Hidden')
      .click(`#btnActions_${selector}`)
      .click(`#btnActionHideShow_${selector}`)
      .clickNoDontDoThis()
      .elementShouldContainText(`#btnActions_${selector} button`, 'Hidden')
      .click(`#btnActions_${selector}`)
      .click(`#btnActionHideShow_${selector}`)
      .clickYesDoThis()
      .waitOnElementToContainText(`#btnActions_${selector} button`, 'Visible')
      .click('#topMenuBurst')
      .click('#topMenuConfiguration')
      .elementShouldBeVisible(`#topMenuConfigurationLoad_${selector}`);
  };

  static assertBCCSubjectValues = (
    ft: FluentTester,
    folderName: string,
    value: string,
  ): FluentTester => {
    let bccValue = '';
    let subjectValue = '';

    if (value) {
      bccValue = `BCC ${value}`;
      subjectValue = `Subject ${value}`;
    }

    return ft
      .gotoConfiguration()
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
      .click('#leftMenuEmailSettings') // email SMTP settings
      .click('#emailMessageTab-link') // email message settings
      .inputShouldHaveValue('#emailBccAddress', bccValue)
      .inputShouldHaveValue('#emailSubject', subjectValue);
  };

  static modifyEmailBCCAndSubjectAndAssertCorrectValues = (
    ft: FluentTester,
    folderName: string,
    templateName: string,
  ): FluentTester => {
    ft = ft
      .gotoConfiguration()
      // STEP0 - CHANGE VALUES
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
      .click('#leftMenuEmailSettings') // email SMTP settings
      .click('#emailMessageTab-link') // email message settings
      .click('#emailBccAddress')
      .typeText(`BCC ${templateName}`)
      //.waitOnElementWithTextToBecomeVisible('Saved')
      //.waitOnElementWithTextToBecomeInvisible('Saved')
      .click('#emailSubject')
      .typeText(`Subject ${templateName}`);
    //.waitOnElemewaitOnElementWithTextToBecomeVisible('Saved')
    //.waitOnElementWithTextToBecomeInvisible('Saved');

    return ConfTemplatesTestHelper.assertBCCSubjectValues(
      ft,
      folderName,
      templateName,
    );
  };

  static modifyConfigurationValuesAssertSavedValues = (
    ft: FluentTester,
    folderName: string,
  ): FluentTester => {
    return (
      ft
        .gotoStartScreen()
        .click('#topMenuConfiguration')
        // STEP0 - CHANGE VALUES
        // general settings
        .click(
          `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#burstFileName')
        .typeText('00')
        .click('#outputFolder')
        .typeText('01')
        .click('#quarantineFolder')
        .typeText('02')
        .click('#leftMenuEnableDisableDistribution')
        .click('#btnSendDocumentsEmail')
        //.waitOnElementWithTextToBecomeVisible('Saved')
        //.waitOnElementWithTextToBecomeInvisible('Saved')
        .click('#btnDeleteDocuments')
        //.waitOnElementWithTextToBecomeVisible('Saved')
        //.waitOnElementWithTextToBecomeInvisible('Saved')
        .click('#btnQuarantineDocuments')
        //.waitOnElementWithTextToBecomeVisible('Saved')
        // values are supposed to be saved at this moment ==> go away and click burst top menu
        .gotoStartScreen()
        // STEP1 - load and assert the saved values
        .click('#topMenuConfiguration')
        // general settings
        .click(
          `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .inputShouldHaveValue('#burstFileName', '00')
        .inputShouldHaveValue('#outputFolder', '01')
        .inputShouldHaveValue('#quarantineFolder', '02')
        .click('#leftMenuEnableDisableDistribution')
        .elementCheckBoxShouldBeSelected('#btnSendDocumentsEmail')
        .elementCheckBoxShouldBeSelected('#btnDeleteDocuments')
        .elementCheckBoxShouldNotBeSelected('#btnQuarantineDocuments')
    );
  };

  static duplicateTemplate = (
    ft: FluentTester,
    folderName: string,
    newTemplateName: string,
    mailMergeCapability?: string,
  ): FluentTester => {
    const newFolderName = _.kebabCase(newTemplateName);
    ft = ft
      .gotoConfigurationTemplates()
      .clickAndSelectTableRow(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .waitOnElementToBecomeEnabled('#btnDuplicate')
      .click('#btnDuplicate')
      .waitOnElementToBecomeVisible('#btnCapReportDistribution')
      .elementCheckBoxShouldBeSelected('#btnCapReportDistribution');

    if (mailMergeCapability) {
      ft = ft
        .waitOnElementToBecomeVisible('#btnCapReportGenerationMailMerge')
        .elementCheckBoxShouldBeSelected('#btnCapReportGenerationMailMerge');
    }
    ft = ft.click('#templateName').typeText(newTemplateName);

    if (!mailMergeCapability) {
      ft = ft.waitOnInputValueToContainText(
        '#templateHowTo',
        `/reports/${newFolderName}/${PATHS.SETTINGS_CONFIG_FILE}`,
      );
    }
    return ft
      .clickYesDoThis()
      .waitOnElementToHaveText(
        `#${newFolderName}_${PATHS.SETTINGS_CONFIG_FILE} td:first-child`,
        newTemplateName,
      );
  };

  static rollbackChangesToDefaultDocumentBursterConfiguration = (
    ft: FluentTester,
    folderName: string,
  ): FluentTester => {
    return ft
      .gotoStartScreen()
      .gotoConfigurationTemplates()
      .clickAndSelectTableRow(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .click(`#btnActions_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .click(`#btnActionRestore_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .clickNoDontDoThis()
      .click(`#btnActions_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .click(`#btnActionRestore_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .clickYesDoThis();
  };

  static assertTemplate = (
    ft: FluentTester,
    folderName: string,
    templateName: string,
    mailMergeCapability?: string,
  ): FluentTester => {
    ft = ft
      .gotoStartScreen()
      .gotoConfiguration()
      .elementShouldContainText(
        `#topMenuConfigurationLoad_burst_${PATHS.SETTINGS_CONFIG_FILE}`,
        'My Report',
      )
      .elementShouldContainText(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        templateName,
      )
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
      .waitOnElementToHaveText(
        '.sidebar-menu .header',
        `CONFIGURATION (${templateName})`,
      );

    if (mailMergeCapability) {
      ft = ft.elementShouldBeVisible('#leftMenuReportingSettings');
    } else {
      ft = ft.elementShouldNotBeVisible('#leftMenuReportingSettings');
    }

    ft = ft
      .gotoConfigurationTemplates()
      .waitOnElementToHaveText(
        `#${folderName}_${PATHS.SETTINGS_CONFIG_FILE} td:first-child`,
        templateName,
      )
      .clickAndSelectTableRow(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeVisible('#templateName')
      .waitOnInputToHaveValue('#templateName', templateName)
      .waitOnElementToBecomeVisible('#btnCapReportDistribution')
      .elementCheckBoxShouldBeSelected('#btnCapReportDistribution')
      .waitOnElementToBecomeVisible('#btnCapReportGenerationMailMerge');
    if (mailMergeCapability) {
      ft = ft
        .elementCheckBoxShouldBeSelected('#btnCapReportGenerationMailMerge')
        .elementShouldNotBeVisible('#templateHowTo');
    } else {
      ft = ft
        .elementCheckBoxShouldNotBeSelected('#btnCapReportGenerationMailMerge')
        .waitOnElementToBecomeVisible('#templateHowTo')
        .inputValueShouldContainText(
          '#templateHowTo',
          `/reports/${folderName}/${PATHS.SETTINGS_CONFIG_FILE}`,
        );
    }

    return ft.clickNoDontDoThis();
  };

  static assertDefaultConfigurationValues = (
    ft: FluentTester,
    folderName: string,
  ): FluentTester => {
    return (
      ft
        .gotoStartScreen()
        // STEP1 - load and assert the saved values
        .click('#topMenuConfiguration')
        // general settings
        .click(
          `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
        )
        .click('#leftMenuGeneralSettings')
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
        .click('#quarantineFolder')
        .click('#leftMenuEnableDisableDistribution')
        .elementCheckBoxShouldNotBeSelected('#btnSendDocumentsEmail')
        .elementCheckBoxShouldNotBeSelected('#btnDeleteDocuments')
        .elementCheckBoxShouldBeSelected('#btnQuarantineDocuments')
    );
  };

  static deleteTemplate = (
    ft: FluentTester,
    folderName: string,
  ): FluentTester => {
    return ft
      .gotoStartScreen()
      .gotoConfigurationTemplates()
      .clickAndSelectTableRow(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .waitOnElementToBecomeEnabled('#btnDelete')
      .click('#btnDelete')
      .clickNoDontDoThis()
      .elementShouldBeVisible(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .clickAndSelectTableRow(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .waitOnElementToBecomeEnabled('#btnDelete')
      .click('#btnDelete')
      .clickYesDoThis()
      .waitOnElementToBecomeInvisible(
        `#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
      .click('#topMenuBurst')
      .click('#topMenuConfiguration')
      .elementShouldNotBeVisible(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      );
  };

  static modifyTemplateName = (
    ft: FluentTester,
    folderName: string,
    newTemplateName: string,
  ): FluentTester => {
    return ft
      .gotoStartScreen()
      .gotoConfigurationTemplates()
      .clickAndSelectTableRow(`#${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .click('#templateName')
      .typeText(newTemplateName)
      .clickYesDoThis()
      .waitOnElementToContainText(
        `#${folderName}_${PATHS.SETTINGS_CONFIG_FILE} td:first-child`,
        newTemplateName,
      );
  };

  static assertFallbackTemplate = (
    ft: FluentTester,
    templateName: string,
  ): FluentTester => {
    return ft
      .gotoConfigurationTemplates()
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeVisible('#templateName')
      .click('#templateName')
      .elementShouldBeVisible('#fallbackTemplateSpan')
      .elementShouldContainText(
        '#fallbackTemplateSpan',
        'used automatically when no other (more specific) configuration is defined',
      )
      .click('#btnClose')
      .elementShouldContainText(
        `#burst_${PATHS.SETTINGS_CONFIG_FILE} td:first-child`,
        templateName + ' (fallback)',
      )
      .elementShouldContainText(
        `#burst_${PATHS.SETTINGS_CONFIG_FILE} td:nth-child(3)`,
        'used automatically when no other (more specific) configuration is defined',
      );
  };
}
