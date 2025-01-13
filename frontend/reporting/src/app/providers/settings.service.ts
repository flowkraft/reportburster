import { Injectable } from '@angular/core';
import * as semver from 'semver';
import { ApiService } from './api.service';
import { APP_CONFIG } from '../../environments/environment';
import Utilities from '../helpers/utilities';

export interface ExtConnection {
  fileName: string;
  filePath: string;
  connectionCode: string;
  connectionName: string;
  connectionType: string;
  activeClicked: boolean;
  defaultConnection: boolean;
  usedBy?: string;
  emailserver: {
    host: string;
    port: string;
    userid: string;
    userpassword: string;
    usessl: boolean;
    usetls: boolean;
    fromaddress: string;
    name: string;
  };
}

export const newEmailServer = {
  host: 'Email Server Host',
  port: '25',
  userid: 'From Email User ID',
  userpassword: 'From Email Password',
  usessl: false,
  usetls: false,
  fromaddress: 'from@emailaddress.com',
  name: 'From Name',
};

export interface TmplFileInfo {
  fileName: string;
  filePath: string;
  type: string;
  content?: string;
  folderName: string;
  relativeFilePath: string;
}

export interface CfgTmplFileInfo {
  fileName: string;
  filePath: string;
  templateName: string;
  capReportGenerationMailMerge: boolean;
  capReportDistribution: boolean;
  dsInputType: string;
  notes: string;
  visibility: string;
  type: string;
  folderName: string;
  relativeFilePath: string;
  isFallback: boolean;
  activeClicked?: boolean;
  useEmlConn?: boolean;
  emlConnCode?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  xmlInternalSettings = {
    documentburster: {
      settings: {
        skin: 'skin-blue',
        backendurl: 'http://localhost:9090',
      },
    },
  };

  //PORTABLE_EXECUTABLE_DIR: string;
  RUNNING_IN_E2E: boolean;
  SHOULD_SEND_STATS: boolean;

  LOGS_FOLDER_PATH: string;
  QUARANTINE_FOLDER_PATH: string;
  SAMPLES_FOLDER_PATH: string;

  JOBS_FOLDER_PATH: string;

  CONFIGURATION_FOLDER_PATH: string;

  CONFIGURATION_BURST_FOLDER_PATH: string;

  CONFIGURATION_REPORTS_FOLDER_PATH: string;

  CONFIGURATION_CONNECTIONS_FOLDER_PATH: string;

  CONFIGURATION_DEFAULTS_FOLDER_PATH: string;

  CONFIGURATION_SAMPLES_FOLDER_PATH: string;
  CONFIGURATION_TEMPLATES_FOLDER_PATH: string;

  INTERNAL_SETTINGS_FILE_PATH: string;

  UPDATE_JAR_FILE_PATH: string;

  currentConfigurationTemplatePath: string;
  currentConfigurationTemplateName: string;

  currentConfigurationTemplate: TmplFileInfo;

  configurationFiles: Array<CfgTmplFileInfo> = [];
  templateFiles: Array<TmplFileInfo> = [];

  defaultEmailConnectionFile: ExtConnection;
  connectionFiles: Array<ExtConnection> = [];

  numberOfUserVariables: number;

  isWindows: boolean = false;
  isServerVersion: boolean = false;

  isJServerStarted: boolean = false;

  product: string = 'DocumentBurster';

  version: semver.SemVer;

  connectionsLoading: number = 0;

  //activeWebSocketSubcriptions: SocketOptions[] = [];

  constructor(
    public apiService: ApiService,
    //protected fsService: FsService,
    //protected unixCliService: UnixCliService,
  ) {
    let process = undefined;

    if (typeof window.require === 'function') {
      process = window.require('process');
    }
    if (process) {
      //this.PORTABLE_EXECUTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR;

      this.RUNNING_IN_E2E = new Boolean(process.env.RUNNING_IN_E2E).valueOf();
      this.SHOULD_SEND_STATS = new Boolean(
        process.env.SHOULD_SEND_STATS,
      ).valueOf();
    } //else {
    //console.log(
    //  `window.require('process') NOT AVAILABLE ==> PORTABLE_EXECUTABLE_DIR could not be read (why Virgil, in a Web App, are you using window.require('process')?! instead of using the Java Server for this stuff!!!!)`,
    //);
    //}

    //this.LOGS_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.logs}`;
    //this.QUARANTINE_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.quarantine}`;

    this.LOGS_FOLDER_PATH = `${APP_CONFIG.folders.logs}`;
    this.QUARANTINE_FOLDER_PATH = `${APP_CONFIG.folders.quarantine}`;
    this.SAMPLES_FOLDER_PATH = 'samples';

    //console.log(`PORTABLE_EXECUTABLE_DIR = ${this.PORTABLE_EXECUTABLE_DIR}`);

    //console.log(`LOGS_FOLDER_PATH = ${this.LOGS_FOLDER_PATH}`);

    //this.JOBS_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.temp}`;
    this.JOBS_FOLDER_PATH = `${APP_CONFIG.folders.temp}`;

    //this.CONFIGURATION_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.config}`;

    this.CONFIGURATION_FOLDER_PATH = `${APP_CONFIG.folders.config}`;
    this.INTERNAL_SETTINGS_FILE_PATH = `${this.CONFIGURATION_FOLDER_PATH}/_internal/settings.xml`;

    this.CONFIGURATION_DEFAULTS_FOLDER_PATH = `${this.CONFIGURATION_FOLDER_PATH}/_defaults`;

    //this.CONFIGURATION_BURST_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.config}/burst`;

    //this.CONFIGURATION_REPORTS_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.config}/reports`;

    //this.CONFIGURATION_SAMPLES_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.config}/samples`;

    //this.CONFIGURATION_CONNECTIONS_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/${APP_CONFIG.folders.config}/connections`;

    //this.CONFIGURATION_TEMPLATES_FOLDER_PATH = `${this.PORTABLE_EXECUTABLE_DIR}/templates`;

    this.CONFIGURATION_BURST_FOLDER_PATH = `${APP_CONFIG.folders.config}/burst`;

    this.CONFIGURATION_REPORTS_FOLDER_PATH = `${APP_CONFIG.folders.config}/reports`;

    this.CONFIGURATION_SAMPLES_FOLDER_PATH = `${APP_CONFIG.folders.config}/samples`;

    this.CONFIGURATION_CONNECTIONS_FOLDER_PATH = `${APP_CONFIG.folders.config}/connections`;

    this.CONFIGURATION_TEMPLATES_FOLDER_PATH = `templates`;
  }

  getDefaultsConfigurationValuesFilePath(): string {
    return `${this.CONFIGURATION_DEFAULTS_FOLDER_PATH}/settings.xml`;
  }

  getMyReportsConfigurationValuesFilePath(): string {
    return `${this.CONFIGURATION_BURST_FOLDER_PATH}/settings.xml`;
  }

  async loadDefaultSettingsFileAsync(): Promise<any> {
    const systemInfo = await this.apiService.get('/jobman/system/info');

    if (!systemInfo) {
      return;
    }

    this.isWindows = systemInfo.osName.startsWith('Windows');

    this.product = systemInfo.product;

    if (this.product.toLowerCase().includes('server')) {
      this.isServerVersion = true;
    }

    let xmlSettings = {
      documentburster: {
        settings: null,
      },
    };

    xmlSettings.documentburster = await this.apiService.get('/cfgman/rb/load', {
      path: this.getDefaultsConfigurationValuesFilePath(),
    });

    this.version = xmlSettings.documentburster.settings.version;

    return xmlSettings;
  }

  async saveSettingsFileAsync(
    filePath: string,
    xmlSettings: {
      documentburster: any;
    },
  ) {
    const path = encodeURIComponent(filePath);

    //console.log(
    //  `saveSettingsFileAsync filePath = ${path}, xmlSettings.documentburster = ${JSON.stringify(xmlSettings.documentburster)}`,
    //);

    xmlSettings.documentburster.settings.attachments.items.attachmentItems.forEach(
      (item: { selected: boolean }) => {
        delete item.selected;
      },
    );

    return this.apiService.post(
      `/cfgman/rb/save?path=${path}`,
      xmlSettings.documentburster,
    );
  }

  async loadSettingsFileAsync(filePath: string): Promise<{
    documentburster: {
      settings: any;
    };
  }> {
    let xmlSettings = {
      documentburster: { settings: {} },
    };

    //console.log(`loadSettingsFileAsync filePath = ${filePath}`);

    xmlSettings.documentburster = await this.apiService.get('/cfgman/rb/load', {
      path: filePath,
    });

    //console.log(
    //  `loadSettingsFileAsync filePath = ${filePath}, settings = ${JSON.stringify(
    //    xmlSettings,
    //  )}`,
    //);

    return xmlSettings;
  }

  async saveConnectionFileAsync(
    filePath: string,
    xmlConnectionSettings: {
      documentburster: {};
    },
  ) {
    const path = encodeURIComponent(filePath);

    return this.apiService.post(
      `/cfgman/rb/save-connection?path=${path}`,
      xmlConnectionSettings.documentburster,
    );
  }

  async loadConnectionFileAsync(filePath: string): Promise<{
    documentburster: {
      connection: any;
    };
  }> {
    let xmlConnectionSettings = {
      documentburster: { connection: {} },
    };

    xmlConnectionSettings.documentburster = await this.apiService.get(
      '/cfgman/rb/load-connection',
      {
        path: filePath,
      },
    );

    //console.log(
    //  `loadSettingsFileAsync filePath = ${filePath}, settings = ${JSON.stringify(
    //    xmlConnectionSettings,
    //  )}`,
    //);
    return xmlConnectionSettings;
  }

  async loadPreferencesFileAsync(filePath: string): Promise<any> {
    return this.apiService.get('/cfgman/rb/load-internal', {
      path: filePath,
    });
  }
  async savePreferencesFileAsync(
    filePath: string,
    xmlSettings: {
      documentburster: {};
    },
  ): Promise<any> {
    const path = encodeURIComponent(filePath);

    return this.apiService.post(
      `/cfgman/rb/save-internal?path=${path}`,
      xmlSettings.documentburster,
    );
  }

  async loadAllSettingsFilesAsync({
    forceReload = false,
  }: { forceReload?: boolean } = {}): Promise<Array<CfgTmplFileInfo>> {
    if (
      !forceReload &&
      this.configurationFiles &&
      this.configurationFiles.length > 0
    )
      return this.configurationFiles;

    this.configurationFiles = await this.apiService.get('/cfgman/rb/load-all');

    return this.configurationFiles;
  }

  async refreshConnectionsUsedByInformation(
    filePath: string,
    xmlSettings: {
      documentburster: any;
    },
  ) {
    // Find and update the specific configuration file
    const configToUpdate = this.configurationFiles.find(
      (config) => config.filePath === filePath,
    );

    if (configToUpdate) {
      configToUpdate.useEmlConn =
        xmlSettings?.documentburster.settings.emailserver.useconn;
      configToUpdate.emlConnCode =
        xmlSettings?.documentburster.settings.emailserver.conncode;
    }

    // Recalculate "Used By" using the updated configuration
    this.connectionFiles = this.connectionFiles.map((connFile) => {
      const matchingConfigs = this.configurationFiles
        .filter(
          (conf) =>
            conf.useEmlConn && conf.emlConnCode == connFile.connectionCode,
        )
        .map((conf) => conf.templateName);

      return {
        ...connFile,
        usedBy: matchingConfigs.join(', ') || '--not used--',
      };
    });
  }

  async loadAllConnectionFilesAsync() {
    if (this.connectionsLoading == 1) return;

    this.connectionsLoading = 1;

    const connFiles = await this.apiService.get(
      '/cfgman/rb/load-connection-all',
    );

    //console.log(
    //  `this.configurationFiles = ${JSON.stringify(this.configurationFiles)}`,
    //);

    if (connFiles && connFiles.length > 0) {
      this.connectionFiles = connFiles.map((connFile) => {
        const matchingConfigs = this.configurationFiles
          .filter(
            (conf) =>
              conf.useEmlConn &&
              conf.emlConnCode == connFile.connectionCode &&
              conf.type != 'config-samples',
          )
          .map((conf) => conf.templateName);

        //console.log(
        //  `Matching configs for ${connFile.connectionCode}:`,
        //  matchingConfigs,
        //); // Debugging log

        return {
          ...connFile,
          usedBy: matchingConfigs.join(', ') || '--not used--', // Temporary change to identify empty matches
        };
      });

      //console.log(
      //  `this.connectionFiles = ${JSON.stringify(this.connectionFiles)}`,
      //);

      this.defaultEmailConnectionFile = this.getConnectionDetails({
        connectionType: 'email-connection',
        defaultConnection: true,
        connectionCode: '',
      });
    }
    this.connectionsLoading = 0;
    return this.connectionFiles;
  }

  isDefaultEmailConnectionConfigured(): boolean {
    return (
      this.defaultEmailConnectionFile &&
      this.defaultEmailConnectionFile.emailserver &&
      this.defaultEmailConnectionFile.emailserver.host != 'Email Server Host' &&
      this.defaultEmailConnectionFile.emailserver.name != 'From Name' &&
      this.defaultEmailConnectionFile.emailserver.fromaddress !=
        'from@emailaddress.com' &&
      this.defaultEmailConnectionFile.emailserver.userid !=
        'From Email User ID' &&
      this.defaultEmailConnectionFile.emailserver.userpassword !=
        'From Email Password'
    );
  }

  async loadAllReportTemplatesFilesAsync() {
    this.templateFiles = await this.apiService.get(
      '/cfgman/rb/load-templates-all',
    );

    return this.templateFiles;
  }

  async saveReportingFileAsync(
    filePath: string,
    xmlReporting: { documentburster: {} },
  ) {
    //console.log(
    //  `saveReportingFileAsynce xmlReporting = ${JSON.stringify(xmlReporting)}`,
    //);
    return this.apiService.post(
      `/cfgman/rb/save-reporting?path=${filePath}`,
      xmlReporting.documentburster,
    );
  }

  async loadReportingFileAsync(filePath: string): Promise<any> {
    return this.apiService.get('/cfgman/rb/load-reporting', {
      path: filePath,
    });
  }

  async saveTemplateFileAsync(filePath: string, content: string) {
    const encodedPath = encodeURIComponent(Utilities.slash(filePath));
    return this.apiService.post(
      `/cfgman/rb/save-template?path=${encodedPath}`,
      content,
      new Headers({
        'Content-Type': 'text/plain',
      }),
    );
  }

  async loadTemplateFileAsync(filePath: string): Promise<any> {
    return this.apiService.get(
      '/cfgman/rb/load-template',
      { path: encodeURIComponent(filePath) },
      new Headers({
        Accept: 'text/plain',
        'Content-Type': 'application/json',
      }),
    );
  }

  getConfigurations(visibility?: string) {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter((configuration) => {
        let filterCondition = configuration.type != 'config-samples';

        if (visibility)
          filterCondition =
            filterCondition && configuration.visibility === visibility;

        return filterCondition;
      });
    }
  }

  getMailMergeConfigurations(filter?: {
    visibility?: string;
    samples?: boolean;
  }) {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter((configuration) => {
        let filterCondition = configuration.capReportGenerationMailMerge;

        if (filter && filter.visibility)
          filterCondition =
            filterCondition && configuration.visibility === filter.visibility;

        if (filter && !filter.samples)
          filterCondition =
            filterCondition && !configuration.filePath.includes('samples');

        return filterCondition;
      });
    }
  }

  getReportTemplates(outputType: string, filter: { samples: boolean }) {
    return this.templateFiles.filter((template) => {
      let filterConditionDocx = false;
      let filterConditionHtml = false;

      if (outputType == 'output.docx') {
        if (filter.samples)
          filterConditionDocx = template.fileName.endsWith('.docx');
        else
          filterConditionDocx =
            template.fileName.endsWith('.docx') &&
            !template.type.includes('-sample');
      }

      if (outputType == 'output.html') {
        if (filter.samples)
          filterConditionHtml = template.fileName.endsWith('.html');
        else
          filterConditionHtml =
            template.fileName.endsWith('.html') &&
            !template.type.includes('-sample');
      }

      return filterConditionDocx || filterConditionHtml;
    });
  }

  getSampleConfigurations(visibility?: string) {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter((configuration) => {
        let filterCondition = configuration.type == 'config-samples';

        if (visibility)
          filterCondition =
            filterCondition && configuration.visibility === visibility;

        return filterCondition;
      });
    }
  }

  getConnectionDetails({
    connectionType,
    defaultConnection,
    connectionCode,
  }: {
    connectionType: string;
    defaultConnection: boolean;
    connectionCode: string;
  }) {
    //console.log(
    //  `this.connectionFiles = ${JSON.stringify(this.connectionFiles)}`
    //);
    let connFiles = [];

    if (this.connectionFiles.length > 0) {
      connFiles = this.connectionFiles.filter((connection: ExtConnection) => {
        return connection.connectionType == connectionType;
      });

      if (defaultConnection) {
        connFiles = connFiles.filter((connection: ExtConnection) => {
          return connection.defaultConnection;
        });
      }

      if (connectionCode && connectionCode.length > 0) {
        connFiles = connFiles.filter((connection: ExtConnection) => {
          return connection.connectionCode == connectionCode;
        });
      }

      if (connFiles && connFiles.length == 1) {
        return connFiles[0];
      }
    }
    return undefined;
  }
}
