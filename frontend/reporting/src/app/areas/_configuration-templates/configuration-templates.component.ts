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
import { FsService } from '../../providers/fs.service';
import Utilities from '../../helpers/utilities';

@Component({
  selector: 'dburst-configuration-templates',
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
export class ConfigurationTemplatesComponent implements OnInit {
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
    protected fsService: FsService,
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
      await this.settingsService.loadAllSettingsFilesAsync();
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
        if (selectedConfiguration.type == 'config-burst-legacy') {
          await this.fsService.removeAsync(selectedConfiguration.filePath);
        } else {
          await this.fsService.removeAsync(
            `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${selectedConfiguration.folderName}`,
          );
        }

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
        let configurationValues: any;
        const currentTemplateName = selectedConfiguration.templateName;
        configurationValues = await this.settingsService.loadSettingsFileAsync(
          this.settingsService.getDefaultsConfigurationValuesFilePath(),
        );

        //don't do this for config-burst-legacy and config-samples
        if (selectedConfiguration.type == 'config-reports') {
          await this.fsService.copyAsync(
            `${this.settingsService.CONFIGURATION_DEFAULTS_FOLDER_PATH}/reporting.xml`,
            `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${selectedConfiguration.folderName}/reporting.xml`,
            {
              overwrite: true,
            },
          );

          /*
          await this.fsService.copyAsync(
            `${this.settingsService.CONFIGURATION_DEFAULTS_FOLDER_PATH}/datatables.xml`,
            `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${selectedConfiguration.folderName}/datatables.xml`
          );
          */
        }

        configurationValues.documentburster.settings.template =
          currentTemplateName;
        configurationValues.documentburster.settings.visibility = 'visible';

        await this.settingsService.saveSettingsFileAsync(
          selectedConfiguration.filePath,
          configurationValues,
        );

        this.getSelectedConfiguration().visibility = 'visible';

        await this.settingsService.loadAllSettingsFilesAsync({
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
        const settingsXmlConfigurationValues =
          await this.settingsService.loadSettingsFileAsync(
            selectedConfiguration.filePath,
          );

        if (visibility == 'hidden') {
          visibility = 'visible';
        } else {
          visibility = 'hidden';
        }

        settingsXmlConfigurationValues.documentburster.settings.visibility =
          visibility;

        await this.settingsService.saveSettingsFileAsync(
          selectedConfiguration.filePath,
          settingsXmlConfigurationValues,
        );

        //console.log(
        //  `toggleVisibility selectedConfiguration.filePath: ${selectedConfiguration.filePath}`,
        //);

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
        await this.settingsService.loadSettingsFileAsync(
          selectedConfiguration.filePath,
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
          await this.settingsService.loadDefaultSettingsFileAsync();
      } else {
        const selectedConfiguration = this.getSelectedConfiguration();
        this.modalConfigurationTemplateInfo.modalTitle = `Create Report by Duplicating '${selectedConfiguration.templateName}' Configuration Values`;

        this.modalConfigurationTemplateInfo.copyFromPath =
          selectedConfiguration.filePath;

        copyFromXmlConfigurationValues =
          await this.settingsService.loadSettingsFileAsync(
            this.modalConfigurationTemplateInfo.copyFromPath,
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

      // tslint:disable-next-line:max-line-length
      this.modalConfigurationTemplateInfo.templateFilePathExists =
        await this.fsService.existsAsync(
          this.modalConfigurationTemplateInfo.fileInfo.filePath,
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
  async checkForAValidCopyFromPath() {
    if (this.modalConfigurationTemplateInfo.copyFromPath) {
      const fileExists = await this.fsService.existsAsync(
        this.modalConfigurationTemplateInfo.copyFromPath
      );

      this.modalConfigurationTemplateInfo.invalidCopyFromPath =
        fileExists !== 'file' ||
        !this.modalConfigurationTemplateInfo.copyFromPath.endsWith('.xml');
    } else {
      this.modalConfigurationTemplateInfo.invalidCopyFromPath = false;
    }
  }
  */

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
      const settingsXmlConfigurationValues =
        await this.settingsService.loadSettingsFileAsync(
          this.modalConfigurationTemplateInfo.copyFromPath,
        );
      settingsXmlConfigurationValues.documentburster.settings.template =
        this.modalConfigurationTemplateInfo.fileInfo.templateName;

      settingsXmlConfigurationValues.documentburster.settings.capabilities.reportdistribution =
        this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution;

      settingsXmlConfigurationValues.documentburster.settings.capabilities.reportgenerationmailmerge =
        this.modalConfigurationTemplateInfo.fileInfo.capReportGenerationMailMerge;

      settingsXmlConfigurationValues.documentburster.settings.visibility =
        this.modalConfigurationTemplateInfo.fileInfo.visibility;

      settingsXmlConfigurationValues.documentburster.settings.notes =
        this.modalConfigurationTemplateInfo.fileInfo.notes;

      if (this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution) {
        if (!this.modalConfigurationTemplateInfo.duplicate) {
          settingsXmlConfigurationValues.documentburster.settings.emailserver.useconn =
            true;
          settingsXmlConfigurationValues.documentburster.settings.emailserver.conncode =
            this.settingsService.defaultEmailConnectionFile.connectionCode;
        }
      }

      //const folderName = this.electronService.path.basename(
      //  this.electronService.path.dirname(
      //    this.modalConfigurationTemplateInfo.templateFilePath
      //  )
      //);

      //console.log(JSON.stringify(settingsXmlConfigurationValues));

      //console.log(
      //  `modalConfigurationTemplateInfo = ${JSON.stringify(
      //    this.modalConfigurationTemplateInfo,
      //  )}`,
      //);

      const folderName = Utilities.basename(
        Utilities.dirname(
          this.modalConfigurationTemplateInfo.fileInfo.filePath,
        ),
      );

      //console.log(
      //  `FOLDER_PATH = ${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${folderName}`,
      //);

      await this.fsService.dirAsync(
        `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${folderName}`,
      );
      //console.log('BEFORE SAVE');

      await this.settingsService.saveSettingsFileAsync(
        this.modalConfigurationTemplateInfo.fileInfo.filePath,
        settingsXmlConfigurationValues,
      );

      //console.log(this.modalConfigurationTemplateInfo.copyFromPath);
      //console.log(
      //  this.settingsService.getDefaultsConfigurationValuesFilePath()
      //);

      if (
        this.modalConfigurationTemplateInfo.copyFromPath ==
        this.settingsService.getDefaultsConfigurationValuesFilePath()
      ) {
        // console.log('config/_defaults');
        await this.fsService.copyAsync(
          `${this.settingsService.CONFIGURATION_DEFAULTS_FOLDER_PATH}/reporting.xml`,
          `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${folderName}/reporting.xml`,
        );

        /*
        await this.fsService.copyAsync(
          `${this.settingsService.CONFIGURATION_DEFAULTS_FOLDER_PATH}/datatables.xml`,
          `${this.modalConfigurationTemplateInfo.templateFolderPath}/datatables.xml`
        );
        */
      } else {
        //console.log('config/reports');

        let copyFromFolderName = Utilities.basename(
          Utilities.dirname(this.modalConfigurationTemplateInfo.copyFromPath),
        );

        if (copyFromFolderName != 'burst')
          await this.fsService.copyAsync(
            `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${copyFromFolderName}/reporting.xml`,
            `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${folderName}/reporting.xml`,
          );
        else
          await this.fsService.copyAsync(
            `${this.settingsService.CONFIGURATION_DEFAULTS_FOLDER_PATH}/reporting.xml`,
            `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${folderName}/reporting.xml`,
          );

        /*
        await this.fsService.copyAsync(
          `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${copyFromFolderName}/datatables.xml`,
          `${this.modalConfigurationTemplateInfo.templateFolderPath}/datatables.xml`
        );
        */
      }

      const capReportGenerationMailMerge =
        this.modalConfigurationTemplateInfo.fileInfo
          .capReportGenerationMailMerge;

      this.settingsService.configurationFiles.push({
        fileName: Utilities.basename(
          this.modalConfigurationTemplateInfo.fileInfo.filePath,
        ),
        filePath: this.modalConfigurationTemplateInfo.fileInfo.filePath,
        templateName: this.modalConfigurationTemplateInfo.fileInfo.templateName,
        capReportDistribution:
          this.modalConfigurationTemplateInfo.fileInfo.capReportDistribution,
        capReportGenerationMailMerge: capReportGenerationMailMerge,
        dsInputType: capReportGenerationMailMerge ? 'ds.csvfile' : '',
        folderName: folderName,
        relativeFilePath:
          this.modalConfigurationTemplateInfo.fileInfo.relativeFilePath,
        isFallback: false,
        visibility: this.modalConfigurationTemplateInfo.fileInfo.visibility,
        type: 'config-reports',
        notes: '',
      });
    } else if (this.modalConfigurationTemplateInfo.crudMode == 'update') {
      // if Edit mode

      let loadingValuesFilePath =
        this.modalConfigurationTemplateInfo.fileInfo.filePath;

      if (this.modalConfigurationTemplateInfo.copyFromPath) {
        loadingValuesFilePath =
          this.modalConfigurationTemplateInfo.copyFromPath;
      }
      const configurationValues =
        await this.settingsService.loadSettingsFileAsync(loadingValuesFilePath);

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

      await this.settingsService.saveSettingsFileAsync(
        this.modalConfigurationTemplateInfo.fileInfo.filePath,
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
