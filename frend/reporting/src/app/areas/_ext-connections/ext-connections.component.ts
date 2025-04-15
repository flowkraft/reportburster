import { Component, OnInit } from '@angular/core';
import _ from 'lodash';

import { leftMenuTemplate } from './templates/_left-menu';
import { tabsTemplate } from './templates/_tabs';
import { tabExternalConnectionsTemplate } from './templates/tab-ext-connection';
import { tabLogsTemplate } from './templates/tab-logs';

import { tabLicenseTemplate } from './templates/tab-license';
import { ConfirmService } from '../../components/dialog-confirm/confirm.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

import { modalExtConnectionsTemplate } from './templates/modal-ext-connection';
import { EmailProviderSettings } from '../../components/button-well-known/button-well-known.component';
import { ActivatedRoute, Router } from '@angular/router';
import Utilities from '../../helpers/utilities';
import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { InfoService } from '../../components/dialog-info/info.service';
import { SettingsService } from '../../providers/settings.service';
import { ShellService } from '../../providers/shell.service';
import { FsService } from '../../providers/fs.service';
import { newEmailServer } from '../../providers/settings.service';

@Component({
  selector: 'dburst-ext-connections',
  template: `
    <aside class="main-sidebar">
      <section class="sidebar">${leftMenuTemplate}</section>
    </aside>
    <div class="content-wrapper">
      <section class="content"><div>${tabsTemplate}</div></section>
    </div>
    ${tabExternalConnectionsTemplate} ${modalExtConnectionsTemplate}
    ${tabLogsTemplate} ${tabLicenseTemplate}
  `,
})
export class ExternalConnectionsComponent implements OnInit {
  isModalExtConnectionVisible = false;

  goBackLocation = '';
  configurationFilePath = '';
  configurationFileName = '';

  modalConnectionInfo = {
    crudMode: 'create',
    duplicate: false,
    modalTitle: 'Create Email Connection',
    //connectionCode: '',
    //connectionName: '',
    filePath: '',
    connectionFilePathExists: '' as boolean | string,
    email: {
      documentburster: {
        connection: {
          code: '',
          name: '',
          defaultConnection: false,
          emailserver: { ...newEmailServer },
        },
      },
    },
  };

  constructor(
    protected confirmService: ConfirmService,
    protected messagesService: ToastrMessagesService,
    protected fsService: FsService,
    protected settingsService: SettingsService,
    protected infoService: InfoService,
    protected executionStatsService: ExecutionStatsService,
    protected shellService: ShellService,
    protected route: ActivatedRoute,
    protected router: Router,
  ) {}

  async ngOnInit() {
    this.settingsService.numberOfUserVariables = 20;
    this.settingsService.currentConfigurationTemplateName = '';
    this.settingsService.currentConfigurationTemplatePath = '';

    this.settingsService.configurationFiles =
      await this.settingsService.loadAllSettingsFilesAsync();

    await this.settingsService.loadAllConnectionFilesAsync();

    if (!this.settingsService.defaultEmailConnectionFile) {
      if (
        this.settingsService.connectionFiles &&
        this.settingsService.connectionFiles.length > 0
      ) {
        this.messagesService.showWarning(
          'Choose a single email connection to be the `Default` email cnnection',
        );
      } else {
        this.messagesService.showInfo(
          'Multiple email connections can be configured and one should be selected to be the `Default` email connection`',
        );
      }
    }

    this.route.params.subscribe(async (params) => {
      if (params.goBackLocation) {
        this.goBackLocation = params.goBackLocation;
        this.configurationFilePath = params.configurationFilePath;
        this.configurationFileName = params.configurationFileName;
      }
    });
  }

  //generate inline a function at this location

  onItemClick(item: { filePath: string }) {
    //console.log(item.filePath);

    for (const connectionFile of this.settingsService.connectionFiles) {
      connectionFile.activeClicked =
        connectionFile.filePath === item.filePath ? true : false;
    }
  }

  getSelectedConnection() {
    if (!this.settingsService.connectionFiles) {
      return undefined;
    }

    return this.settingsService.connectionFiles.find(
      (connection) => connection.activeClicked,
    );
  }

  onDeleteSelectedConnection() {
    if (!this.getSelectedConnection()) {
      return;
    }
    const dialogQuestion = 'Delete selected item?';
    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        const filePath = this.getSelectedConnection().filePath;

        //console.log(`filePath = ${filePath}`);

        await this.fsService.removeAsync(filePath);

        _.remove(
          this.settingsService.connectionFiles,
          (o) => o.filePath === filePath,
        );

        this.messagesService.showInfo('Done');
      },
    });
  }

  async showCrudModal(crudMode: string, duplicate?: boolean) {
    this.modalConnectionInfo.crudMode = crudMode;

    this.modalConnectionInfo.modalTitle = 'Create Email Connection';

    this.modalConnectionInfo.connectionFilePathExists = false;
    this.modalConnectionInfo.email.documentburster.connection.code = '';
    this.modalConnectionInfo.email.documentburster.connection.name = '';

    this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
      false;

    if (crudMode == 'update' || duplicate) {
      const selectedConnection = this.getSelectedConnection();

      if (crudMode == 'update') {
        this.modalConnectionInfo.filePath = selectedConnection.filePath;

        this.modalConnectionInfo.modalTitle = 'Update Email Connection';

        this.modalConnectionInfo.email.documentburster.connection.code =
          selectedConnection.connectionCode;

        this.modalConnectionInfo.email.documentburster.connection.name =
          selectedConnection.connectionName;

        this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
          selectedConnection.defaultConnection;
      }

      this.modalConnectionInfo.email.documentburster.connection.emailserver = {
        ...selectedConnection.emailserver,
      };
    } else {
      this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
        false;

      this.modalConnectionInfo.email.documentburster.connection.emailserver = {
        ...newEmailServer,
      };
    }
    this.isModalExtConnectionVisible = true;
  }

  updateFormControlWithSelectedVariable(
    id: string,
    selectedVariableValue: string,
  ) {
    const formControl = document.getElementById(id) as HTMLInputElement;
    const caretPos = formControl.selectionStart;
    const oldValue = formControl.value;
    formControl.value =
      oldValue.substring(0, caretPos) +
      selectedVariableValue +
      oldValue.substring(caretPos);

    formControl.dispatchEvent(new Event('input'));
  }

  async updateSMTPFormControlsWithSelectedProviderSettings(
    selectedProviderSettings: EmailProviderSettings,
  ) {
    this.modalConnectionInfo.email.documentburster.connection.emailserver.usessl =
      false;
    this.modalConnectionInfo.email.documentburster.connection.emailserver.usetls =
      false;

    this.modalConnectionInfo.email.documentburster.connection.emailserver.host =
      selectedProviderSettings.host;
    this.modalConnectionInfo.email.documentburster.connection.emailserver.port =
      selectedProviderSettings.port;

    if (selectedProviderSettings.secure === true) {
      this.modalConnectionInfo.email.documentburster.connection.emailserver.usessl =
        true;
    }

    if (selectedProviderSettings.tls) {
      this.modalConnectionInfo.email.documentburster.connection.emailserver.usetls =
        true;
    }
  }

  async onModalOK() {
    // if New mode
    if (
      this.modalConnectionInfo.crudMode == 'create' ||
      this.modalConnectionInfo.duplicate
    ) {
      const connectionCode = `eml-${_.kebabCase(
        this.modalConnectionInfo.email.documentburster.connection.name,
      )}`;

      this.modalConnectionInfo.email.documentburster.connection.code =
        connectionCode;
      this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
        false;

      const connectionFileName = `${connectionCode}.xml`;

      this.settingsService.connectionFiles.push({
        fileName: connectionFileName,
        filePath: this.modalConnectionInfo.filePath,
        connectionCode: connectionCode,
        connectionName:
          this.modalConnectionInfo.email.documentburster.connection.name,
        connectionType: connectionFileName.startsWith('eml-')
          ? 'email-connection'
          : 'database-connection',
        activeClicked: false,
        defaultConnection: false,
        emailserver:
          this.modalConnectionInfo.email.documentburster.connection.emailserver,
      });
    } else if (this.modalConnectionInfo.crudMode == 'update') {
      const selectedConnection = this.getSelectedConnection();
      selectedConnection.connectionName =
        this.modalConnectionInfo.email.documentburster.connection.name;

      selectedConnection.emailserver =
        this.modalConnectionInfo.email.documentburster.connection.emailserver;
    }

    await this.settingsService.saveConnectionFileAsync(
      this.modalConnectionInfo.filePath,
      this.modalConnectionInfo.email,
    );

    await this.settingsService.loadAllConnectionFilesAsync();

    this.messagesService.showInfo('Saved');

    this.isModalExtConnectionVisible = false;
  }

  async updateModelAndForm() {
    if (this.modalConnectionInfo.crudMode != 'update') {
      const connectionCode = `eml-${_.kebabCase(
        this.modalConnectionInfo.email.documentburster.connection.name,
      )}`;

      const connectionFileName = `${connectionCode}.xml`;
      this.modalConnectionInfo.filePath = `${this.settingsService.CONFIGURATION_CONNECTIONS_FOLDER_PATH}/${connectionFileName}`;

      this.modalConnectionInfo.connectionFilePathExists =
        await this.fsService.existsAsync(this.modalConnectionInfo.filePath);
      //console.log(
      //  `this.modalConnectionInfo.connectionFilePathExists = ${this.modalConnectionInfo.connectionFilePathExists}`,
      //);
    }
  }

  onModalClose() {
    this.isModalExtConnectionVisible = false;
  }

  goBack() {
    this.router.navigate(
      [
        '/configuration',
        'emailSettingsMenuSelected',
        this.configurationFilePath,
        this.configurationFileName,
        true,
      ],
      { skipLocationChange: true },
    );
  }

  doTestSMTPConnection() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      const dialogQuestion = 'Send test email?';

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: () => {
          const selectedConnection = this.getSelectedConnection();

          this.shellService.runBatFile([
            'system',
            'test-email',
            '-c',
            '"' +
              Utilities.slash(selectedConnection.filePath).replace(
                '/config/',
                'PORTABLE_EXECUTABLE_DIR_PATH/config/',
              ) +
              '"',
          ]);
        },
      });
    }
  }

  async toggleDefault() {
    const selectedConnection = this.getSelectedConnection();

    let dialogQuestion = `Make '${selectedConnection.connectionName}' connection the 'Default' ${selectedConnection.connectionType}?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        const previousDefaultConnection =
          this.settingsService.connectionFiles.find(
            (connection) =>
              connection.defaultConnection &&
              connection.connectionType == selectedConnection.connectionType,
          );

        //previous
        if (previousDefaultConnection) {
          this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
            false;
          this.modalConnectionInfo.email.documentburster.connection.code =
            previousDefaultConnection.connectionCode;
          this.modalConnectionInfo.email.documentburster.connection.name =
            previousDefaultConnection.connectionName;
          this.modalConnectionInfo.email.documentburster.connection.emailserver =
            previousDefaultConnection.emailserver;

          previousDefaultConnection.defaultConnection = false;

          await this.settingsService.saveConnectionFileAsync(
            previousDefaultConnection.filePath,
            this.modalConnectionInfo.email,
          );
        }
        //selected

        this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
          true;
        this.modalConnectionInfo.email.documentburster.connection.code =
          selectedConnection.connectionCode;
        this.modalConnectionInfo.email.documentburster.connection.name =
          selectedConnection.connectionName;
        this.modalConnectionInfo.email.documentburster.connection.emailserver =
          selectedConnection.emailserver;

        selectedConnection.defaultConnection = true;

        this.settingsService.defaultEmailConnectionFile = selectedConnection;

        await this.settingsService.saveConnectionFileAsync(
          selectedConnection.filePath,
          this.modalConnectionInfo.email,
        );
      },
    });
  }
}
