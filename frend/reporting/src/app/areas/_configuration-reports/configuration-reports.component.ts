import { Component, OnInit } from '@angular/core';

//import * as slash from 'slash';
//import * as path from 'path';

//import * as jetpack from 'fs-jetpack';
import _ from 'lodash';

import { ToastrMessagesService } from '../../providers/toastr-messages.service';

import { leftMenuTemplate } from './templates/_left-menu';
import { tabsTemplate } from './templates/_tabs';
import { CfgTmplFileInfo } from '../../providers/settings.service';
import { tabConfigurationTemplatesTemplate } from './templates/tab-conf-templates';
import { tabConfTemplatesSamples } from './templates/tab-conf-templates-samples';

import { tabLicenseTemplate } from './templates/tab-license';

import { modalConfigurationTemplateTemplate } from './templates/modal-conf-template';
import { ConfirmService } from '../../components/dialog-confirm/confirm.service';
import { SamplesService } from '../../providers/samples.service';
import { SettingsService } from '../../providers/settings.service';
import { ReportsService } from '../../providers/reports.service';
import Utilities from '../../helpers/utilities';

@Component({
  selector: 'dburst-configuration-reports',
  template: /*html*/ `
    <aside class="main-sidebar">
      <section class="sidebar">${leftMenuTemplate}</section>
    </aside>
    <div class="content-wrapper">
      <section class="content"><div>${tabsTemplate}</div></section>
    </div>
    ${tabConfigurationTemplatesTemplate} ${tabConfTemplatesSamples}
    ${tabLicenseTemplate} ${modalConfigurationTemplateTemplate}
  `,
})
export class ConfigurationReportsComponent implements OnInit {
  isModalConfigurationTemplateVisible = false;

  modalConfigurationTemplateInfo: {
    fileInfo: CfgTmplFileInfo;
    copyFromPath: string;
    //invalidCopyFromPath: {};
    templateFilePathExists: boolean | string;
    templateHowTo: string;
    crudMode: string;
    duplicate: boolean;
    modalTitle: string;
  };

  constructor(
    protected confirmService: ConfirmService,
    protected messagesService: ToastrMessagesService,
    protected reportsService: ReportsService,
    protected settingsService: SettingsService,
    protected samplesService: SamplesService,
  ) {
    this.modalConfigurationTemplateInfo = {
      fileInfo: {
        fileName: '',
        filePath: '',
        templateName: '',
        capReportGenerationMailMerge: false,
        capReportDistribution: false,
        dsInputType: '',
        notes: '',
        visibility: 'visible',
        type: 'config-reports',
        folderName: '',
        relativeFilePath: '',
        isFallback: false,
        scriptOptionsSelectFileExplorer: 'notused',
        reportParameters: [],
      },
      copyFromPath: '',
      //invalidCopyFromPath: {},
      templateFilePathExists: false,
      templateHowTo: '',
      crudMode: 'create',
      duplicate: false,
      modalTitle: '',
    };
  }

  async ngOnInit() {
    this.settingsService.currentConfigurationTemplateName = '';
    this.settingsService.currentConfigurationTemplatePath = '';

    this.settingsService.configurationFiles =
      await this.settingsService.loadAllReports();
  }

  onConfTemplateClick(confTemplateClicked: { templateName: string }) {
    for (const configurationFile of this.settingsService.configurationFiles) {
      configurationFile.activeClicked =
        configurationFile.templateName === confTemplateClicked.templateName
          ? true
          : false;
    }
  }

  onDeleteSelectedTemplate() {
    const selectedConfiguration = this.getSelectedConfiguration();

    if (!selectedConfiguration || selectedConfiguration.isFallback) {
      return;
    }

    const dialogQuestion = 'Delete selected item?';
    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.reportsService.deleteReport(selectedConfiguration.folderName);

        // Invalidate cache for the deleted configuration
        this.settingsService.invalidateConfigDetailsCache(selectedConfiguration.filePath);

        _.remove(
          this.settingsService.configurationFiles,
          (o) => o.filePath === selectedConfiguration.filePath,
        );

        this.messagesService.showInfo('Done');
      },
    });
  }

  async restoreDefaultConfigurationValues() {
    const selectedConfiguration = this.getSelectedConfiguration();

    let dialogQuestion = `Restore the default configuration values and override the existing "${selectedConfiguration.templateName}" configuration?`;
    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.reportsService.restoreDefaults(selectedConfiguration.folderName);

        this.getSelectedConfiguration().visibility = 'visible';

        this.settingsService.configurationFiles =
          await this.settingsService.loadAllReports({
            forceReload: true,
          });
        this.messagesService.showInfo('Saved');
      },
    });
  }

  async toggleVisibility() {
    const selectedConfiguration = this.getSelectedConfiguration();

    let visibility = this.getSelectedConfiguration().visibility;

    let dialogQuestion = `Show '${selectedConfiguration.templateName}' configuration in the menu?`;

    if (visibility == 'visible')
      dialogQuestion = `Hide '${selectedConfiguration.templateName}' configuration from the menu?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        if (visibility == 'hidden') {
          visibility = 'visible';
        } else {
          visibility = 'hidden';
        }

        await this.reportsService.toggleVisibility(selectedConfiguration.folderName, visibility);

        this.getSelectedConfiguration().visibility = visibility;
        await this.samplesService.fillSamplesNotes();
      },
    });
  }

  async showCrudModal(crudMode: string, duplicate?: boolean) {
    this.modalConfigurationTemplateInfo.crudMode = crudMode;
    this.modalConfigurationTemplateInfo.duplicate = duplicate;

    //this.modalConfigurationTemplateInfo.invalidCopyFromPath = false;

    if (crudMode == 'update') {
      this.modalConfigurationTemplateInfo.modalTitle = 'Update Report';

      const selectedConfiguration = this.getSelectedConfiguration();

      /*
      if (this.modalConfigurationTemplateInfo.default) {
        this.modalConfigurationTemplateInfo.templateHowTo =
          'Used when no other configuration template is configured.';
      }
      */

      this.modalConfigurationTemplateInfo.fileInfo.isFallback =
        selectedConfiguration.isFallback;
      this.modalConfigurationTemplateInfo.fileInfo.templateName =
        selectedConfiguration.templateName;

      this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution =
        selectedConfiguration.capReportDistribution;
      this.modalConfigurationTemplateInfo.fileInfo.capReportGenerationMailMerge =
        selectedConfiguration.capReportGenerationMailMerge;
      this.modalConfigurationTemplateInfo.fileInfo.type =
        selectedConfiguration.type;

      this.modalConfigurationTemplateInfo.fileInfo.visibility =
        selectedConfiguration.visibility;

      this.modalConfigurationTemplateInfo.fileInfo.filePath =
        selectedConfiguration.filePath;

      this.modalConfigurationTemplateInfo.fileInfo.relativeFilePath =
        selectedConfiguration.relativeFilePath;

      if (
        !selectedConfiguration.isFallback &&
        !selectedConfiguration.capReportGenerationMailMerge
      )
        this.modalConfigurationTemplateInfo.templateHowTo = `<config>${selectedConfiguration.relativeFilePath}</config>`;

      const settingsXmlConfigurationValues =
        await this.reportsService.loadReportSettings(
          selectedConfiguration.folderName,
        );

      this.modalConfigurationTemplateInfo.fileInfo.notes =
        settingsXmlConfigurationValues.documentburster.settings.notes;
    } else if (crudMode == 'create') {
      this.modalConfigurationTemplateInfo.fileInfo.type = 'config-reports';

      this.modalConfigurationTemplateInfo.modalTitle = 'Create Report';

      this.modalConfigurationTemplateInfo.fileInfo.templateName = '';
      this.modalConfigurationTemplateInfo.fileInfo.isFallback = false;
      let copyFromXmlConfigurationValues: any;

      //console.log(`duplicate = ${duplicate}`);

      if (!duplicate) {
        this.modalConfigurationTemplateInfo.copyFromPath =
          this.settingsService.getDefaultsConfigurationValuesFilePath();

        copyFromXmlConfigurationValues =
          await this.reportsService.loadDefaults();
      } else {
        const selectedConfiguration = this.getSelectedConfiguration();
        this.modalConfigurationTemplateInfo.modalTitle = `Create Report by Duplicating '${selectedConfiguration.templateName}' Configuration Values`;

        this.modalConfigurationTemplateInfo.copyFromPath =
          selectedConfiguration.filePath;

        copyFromXmlConfigurationValues =
          await this.reportsService.loadReportSettings(
            Utilities.basename(Utilities.dirname(this.modalConfigurationTemplateInfo.copyFromPath)),
          );
      }

      //console.log(
      //  `copyFromXmlConfigurationValues = ${JSON.stringify(
      //    copyFromXmlConfigurationValues,
      //  )}`,
      //);

      this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution =
        copyFromXmlConfigurationValues.documentburster.settings.capabilities.reportdistribution;
      this.modalConfigurationTemplateInfo.fileInfo.capReportGenerationMailMerge =
        copyFromXmlConfigurationValues.documentburster.settings.capabilities.reportgenerationmailmerge;

      this.modalConfigurationTemplateInfo.fileInfo.visibility =
        copyFromXmlConfigurationValues.documentburster.settings.visibility;

      this.modalConfigurationTemplateInfo.fileInfo.notes =
        copyFromXmlConfigurationValues.documentburster.settings.notes;
    }

    await this.updateModelAndForm();

    this.isModalConfigurationTemplateVisible = true;
  }

  async updateModelAndForm() {
    if (this.modalConfigurationTemplateInfo.crudMode == 'create') {
      // if New mode
      // tslint:disable-next-line:max-line-length
      const folderName = this.modalConfigurationTemplateInfo.fileInfo
        .templateName
        ? _.kebabCase(this.modalConfigurationTemplateInfo.fileInfo.templateName)
        : '${folder-name}';

      this.modalConfigurationTemplateInfo.fileInfo.filePath = `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${folderName}/settings.xml`;
      // tslint:disable-next-line:max-line-length
      this.modalConfigurationTemplateInfo.fileInfo.relativeFilePath = `./config/reports/${folderName}/settings.xml`;
      this.modalConfigurationTemplateInfo.fileInfo.folderName = folderName;

      // Check if report already exists by looking at local configuration list
      this.modalConfigurationTemplateInfo.templateFilePathExists =
        this.settingsService.configurationFiles.some(
          (c) => c.folderName === folderName,
        );

      this.modalConfigurationTemplateInfo.templateHowTo = '';

      if (
        !this.modalConfigurationTemplateInfo.fileInfo
          .capReportGenerationMailMerge &&
        !this.modalConfigurationTemplateInfo.fileInfo.isFallback
      ) {
        this.modalConfigurationTemplateInfo.templateHowTo =
          '<config>' +
          this.modalConfigurationTemplateInfo.fileInfo.relativeFilePath +
          '</config>';
      }

      //this.modalConfigurationTemplateInfo.copyFromPath = Utilities.slash(
      //  this.settingsService.getDefaultsConfigurationValuesFilePath()
      //);
    } else if (this.modalConfigurationTemplateInfo.crudMode == 'update') {
      // if Edit mode
      //delete this.modalConfigurationTemplateInfo.copyFromPath;
      delete this.modalConfigurationTemplateInfo.templateFilePathExists;
    }
  }


  /*
  onConfigurationClick(variable) {
    this.settingsService.configurationFiles.forEach((element) => {
      element.activeClicked = element.name === variable.name ? true : false;
    });
  }
  */

  getSelectedConfiguration() {
    if (!this.settingsService.configurationFiles) {
      return undefined;
    }

    return this.settingsService.configurationFiles.find((configuration) => {
      return configuration.activeClicked;
    });
  }

  /*
  onSelectCopyFromFile(filePath: string) {
    this.modalConfigurationTemplateInfo.copyFromPath =
      Utilities.slash(filePath);
    this.checkForAValidCopyFromPath();
  }
  */

  onModalClose() {
    this.isModalConfigurationTemplateVisible = false;
  }

  async onModalOK() {
    // if New mode
    if (this.modalConfigurationTemplateInfo.crudMode == 'create') {
      const folderName = Utilities.basename(
        Utilities.dirname(
          this.modalConfigurationTemplateInfo.fileInfo.filePath,
        ),
      );

      // Determine copyFromReportId for duplicate operations
      let copyFromReportId: string = undefined;
      if (this.modalConfigurationTemplateInfo.duplicate) {
        copyFromReportId = Utilities.basename(
          Utilities.dirname(this.modalConfigurationTemplateInfo.copyFromPath),
        );
        // "burst" is the legacy fallback — backend treats it as "copy from defaults"
      }

      // Single atomic API call replaces: dirAsync + saveSettingsFileAsync + copyAsync
      const result = await this.reportsService.createReport(
        folderName,
        this.modalConfigurationTemplateInfo.fileInfo.templateName,
        this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution,
        this.modalConfigurationTemplateInfo.fileInfo.capReportGenerationMailMerge,
        copyFromReportId,
      );

      // Add the new config to the local list
      this.settingsService.configurationFiles.push(result);
    } else if (this.modalConfigurationTemplateInfo.crudMode == 'update') {
      // if Edit mode

      let loadingValuesFilePath =
        this.modalConfigurationTemplateInfo.fileInfo.filePath;

      if (this.modalConfigurationTemplateInfo.copyFromPath) {
        loadingValuesFilePath =
          this.modalConfigurationTemplateInfo.copyFromPath;
      }
      const configurationValues =
        await this.reportsService.loadReportSettings(
          Utilities.basename(Utilities.dirname(loadingValuesFilePath)),
        );

      configurationValues.documentburster.settings.template =
        this.modalConfigurationTemplateInfo.fileInfo.templateName;

      configurationValues.documentburster.settings.capabilities.reportdistribution =
        this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution;

      configurationValues.documentburster.settings.capabilities.reportgenerationmailmerge =
        this.modalConfigurationTemplateInfo.fileInfo.capReportGenerationMailMerge;

      configurationValues.documentburster.settings.visibility =
        this.modalConfigurationTemplateInfo.fileInfo.visibility;

      configurationValues.documentburster.settings.notes =
        this.modalConfigurationTemplateInfo.fileInfo.notes;

      await this.reportsService.saveReportSettings(
        Utilities.basename(Utilities.dirname(this.modalConfigurationTemplateInfo.fileInfo.filePath)),
        configurationValues,
      );

      this.getSelectedConfiguration().templateName =
        this.modalConfigurationTemplateInfo.fileInfo.templateName;
      this.getSelectedConfiguration().visibility =
        this.modalConfigurationTemplateInfo.fileInfo.visibility;

      this.getSelectedConfiguration().capReportDistribution =
        this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution;

      this.getSelectedConfiguration().capReportGenerationMailMerge =
        this.modalConfigurationTemplateInfo.fileInfo.capReportGenerationMailMerge;
    }

    this.isModalConfigurationTemplateVisible = false;
    this.messagesService.showInfo('Saved');
  }
}
