import { Injectable } from '@angular/core';
import * as semver from 'semver';
import { ApiService } from './api.service';
import Utilities from '../helpers/utilities';
import { APP_CONFIG } from '../../environments/environment';
import { SocketOptions } from '../helpers/websocket-endpoint';
import { FsService } from './fs.service';
import { UnixCliService } from './unix-cli.service';

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

  activeWebSocketSubcriptions: SocketOptions[] = [];

  constructor(
    public apiService: ApiService,
    protected fsService: FsService,
    protected unixCliService: UnixCliService,
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

  async loadDefaultSettingsFileAsync(): Promise<any> {
    const systemInfo = await this.apiService.get('/jobman/system/info');

    if (!systemInfo) {
      return;
    }

    this.isWindows = systemInfo.osName.startsWith('Windows');

    const startServerScripts = await this.unixCliService.findAsync('.', {
      matching: ['startServer.*'],
    });

    if (startServerScripts && startServerScripts.length > 0) {
      this.isServerVersion = true;
      this.product = 'DocumentBurster Server';
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
      documentburster: {};
    },
  ) {
    const path = encodeURIComponent(filePath);

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

    xmlSettings.documentburster = await this.apiService.get('/cfgman/rb/load', {
      path: filePath,
    });

    //console.log(
    //  `loadSettingsFileAsync filePath = ${filePath}, settings = ${JSON.stringify(
    //    xmlSettings
    //  )}`
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

    console.log(
      `loadSettingsFileAsync filePath = ${filePath}, settings = ${JSON.stringify(
        xmlConnectionSettings,
      )}`,
    );
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

    //console.log(
    //  `this.CONFIGURATION_BURST_FOLDER_PATH = ${this.CONFIGURATION_BURST_FOLDER_PATH}`
    //);

    const burstConfigFilePaths = await this.unixCliService.findAsync(
      this.CONFIGURATION_BURST_FOLDER_PATH,
      {
        matching: ['*.xml'],
      },
    );

    if (!burstConfigFilePaths || burstConfigFilePaths.length == 0) {
      return [];
    }

    //console.log(
    //  `burstConfigFilePaths1 = ${JSON.stringify(burstConfigFilePaths)}`
    //);

    const reportsConfigFilePaths = await this.unixCliService.findAsync(
      this.CONFIGURATION_REPORTS_FOLDER_PATH,
      {
        matching: ['settings.xml'],
        recursive: true,
      },
    );

    //console.log(
    //  `reportsConfigFilePaths2 = ${JSON.stringify(reportsConfigFilePaths)}`
    //);

    const samplesConfigFilePaths = await this.unixCliService.findAsync(
      this.CONFIGURATION_SAMPLES_FOLDER_PATH,
      {
        matching: ['settings.xml'],
        recursive: true,
      },
    );

    // console.log(
    //   `samplesConfigFilePaths3 = ${JSON.stringify(samplesConfigFilePaths)}`
    // );

    const configFilePaths = burstConfigFilePaths
      .concat(reportsConfigFilePaths)
      .concat(samplesConfigFilePaths);

    const configurationFiles: Array<CfgTmplFileInfo> = [];

    for (let filePath of configFilePaths) {
      const configurationFilePath = filePath;
      const configurationFileName = Utilities.basename(configurationFilePath);

      const isFallbackSettings =
        configurationFilePath.endsWith('burst/settings.xml');

      const isNotSettings =
        configurationFilePath.endsWith('_defaults/settings.xml') ||
        configurationFilePath.endsWith('preferences/settings.xml');

      if (isNotSettings) continue;

      //console.log(
      //  `configurationFilePath4 = ${JSON.stringify(configurationFilePath)}`
      // );

      const settingsFileContent = await this.unixCliService.catAsync(filePath);

      let startPos =
        settingsFileContent.indexOf('<template>') + '<template>'.length;
      let endPos = settingsFileContent.indexOf('</template>');
      const settingsTemplateName = settingsFileContent
        .substring(startPos, endPos)
        .trim();

      startPos =
        settingsFileContent.indexOf('<reportdistribution>') +
        '<reportdistribution>'.length;
      endPos = settingsFileContent.indexOf('</reportdistribution>');
      const boolReportDistribution = Boolean(
        JSON.parse(settingsFileContent.substring(startPos, endPos).trim()),
      );

      startPos =
        settingsFileContent.indexOf('<reportgenerationmailmerge>') +
        '<reportgenerationmailmerge>'.length;
      endPos = settingsFileContent.indexOf('</reportgenerationmailmerge>');
      const boolReportGenerationMailMerge = Boolean(
        JSON.parse(settingsFileContent.substring(startPos, endPos).trim()),
      );

      startPos =
        settingsFileContent.indexOf('<visibility>') + '<visibility>'.length;
      endPos = settingsFileContent.indexOf('</visibility>');
      const strVisibility = settingsFileContent
        .substring(startPos, endPos)
        .trim();

      startPos = settingsFileContent.indexOf('<useconn>') + '<useconn>'.length;
      endPos = settingsFileContent.indexOf('</useconn>');
      const boolUseEmailConnection = Boolean(
        JSON.parse(settingsFileContent.substring(startPos, endPos).trim()),
      );

      startPos =
        settingsFileContent.indexOf('<conncode>') + '<conncode>'.length;
      endPos = settingsFileContent.indexOf('</conncode>');
      const strEmailConnectionCode = settingsFileContent
        .substring(startPos, endPos)
        .trim();

      let templateRelativeFilePath = `./config/burst/${configurationFileName}`;
      let typeOfConfiguration = 'config-burst-legacy';

      const folderName = Utilities.basename(
        Utilities.dirname(configurationFilePath),
      );

      let dsInputType = '';

      if (configurationFilePath.includes(`config/reports/${folderName}`)) {
        typeOfConfiguration = 'config-reports';
        templateRelativeFilePath = `./config/reports/${folderName}/settings.xml`;

        if (boolReportGenerationMailMerge) {
          const reportingXmlFilePath = `${Utilities.dirname(
            configurationFilePath,
          )}/reporting.xml`;

          const reportingXmlFileContent =
            await this.unixCliService.catAsync(reportingXmlFilePath);
          startPos =
            reportingXmlFileContent.indexOf('<type>') + '<type>'.length;
          endPos = reportingXmlFileContent.indexOf('</type>');
          dsInputType = reportingXmlFileContent
            .substring(startPos, endPos)
            .trim();
        }
      } else if (
        configurationFilePath.includes(`config/samples/${folderName}`)
      ) {
        typeOfConfiguration = 'config-samples';
        templateRelativeFilePath = `./config/samples/${folderName}/settings.xml`;
      }

      configurationFiles.push({
        fileName: configurationFileName,
        filePath: Utilities.slash(configurationFilePath),
        relativeFilePath: templateRelativeFilePath,
        templateName: settingsTemplateName,
        isFallback: isFallbackSettings,
        capReportDistribution: boolReportDistribution,
        capReportGenerationMailMerge: boolReportGenerationMailMerge,
        dsInputType: dsInputType,
        visibility: strVisibility,
        notes: '',
        folderName: folderName,
        type: typeOfConfiguration,
        activeClicked: false,
        useEmlConn: boolUseEmailConnection,
        emlConnCode: strEmailConnectionCode,
      });
    }

    this.configurationFiles = configurationFiles;

    // console.log(
    //   `this.configurationFiles = ${JSON.stringify(this.configurationFiles)}`
    // );
    return configurationFiles;
  }

  async loadAllConnectionFilesAsync() {
    if (this.connectionsLoading == 1) return;

    this.connectionsLoading = 1;

    this.defaultEmailConnectionFile = undefined;

    const connectionFiles: Array<ExtConnection> = [];

    const connectionFilePaths = await this.unixCliService.findAsync(
      this.CONFIGURATION_CONNECTIONS_FOLDER_PATH,
      {
        matching: ['*.xml'],
      },
    );

    if (!connectionFilePaths || connectionFilePaths.length == 0) {
      this.connectionsLoading = 0;
      return;
    }

    for (let connectionFilePath of connectionFilePaths) {
      let connectionSettings = {
        documentburster: {
          connection: null,
        },
      };

      // console.log(`connectionFilePath = ${JSON.stringify(connectionFilePath)}`);

      connectionSettings.documentburster = await this.apiService.get(
        '/cfgman/rb/load-connection',
        {
          path: connectionFilePath,
        },
      );
      const connXml = connectionSettings.documentburster.connection;

      //console.log(`connXml = ${JSON.stringify(connXml)}`);

      const connectionFileName = Utilities.basename(connectionFilePath);
      console.log(
        `this.configurationFiles = ${JSON.stringify(this.configurationFiles)}`,
      );
      connectionFiles.push({
        fileName: connectionFileName,
        filePath: connectionFilePath,
        connectionCode: connXml.code,
        connectionName: connXml.name,
        connectionType: connectionFileName.startsWith('eml-')
          ? 'email-connection'
          : 'database-connection',
        activeClicked: false,
        defaultConnection: connXml.defaultConnection,
        usedBy: this.configurationFiles
          .filter(
            (conf) =>
              conf.useEmlConn &&
              conf.emlConnCode == connXml.code &&
              conf.type != 'config-samples',
          )
          .map((conf) => conf.templateName)
          .join(', '),
        emailserver: {
          host: connXml.emailserver.host,
          port: connXml.emailserver.port,
          userid: connXml.emailserver.userid,
          userpassword: connXml.emailserver.userpassword,
          usessl: connXml.emailserver.usessl,
          usetls: connXml.emailserver.usetls,
          fromaddress: connXml.emailserver.fromaddress,
          name: connXml.emailserver.name,
        },
      });
    }

    this.connectionFiles = connectionFiles;

    this.defaultEmailConnectionFile = this.getConnectionDetails({
      connectionType: 'email-connection',
      defaultConnection: true,
      connectionCode: '',
    });

    //console.log(
    //  `this.defaultEmailConnectionFile = ${JSON.stringify(
    //    this.defaultEmailConnectionFile
    //  )}`
    //);

    this.connectionsLoading = 0;
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
    let relativeFilePath: string, tplType: string;
    const emailsTemplateFiles: Array<TmplFileInfo> = [];
    const reportsTemplateFiles: Array<TmplFileInfo> = [];

    let reportsTemplateFilePaths = await this.unixCliService.findAsync(
      `${this.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports`,
      {
        matching: ['*.docx', '*.html'],
        files: true,
        directories: false,
        recursive: true,
      },
    );

    //console.log(
    //  `reportsTemplateFilePaths = ${JSON.stringify(reportsTemplateFilePaths)}`
    //);

    //const samplesReportsTemplateFilePaths = [];

    //reportsTemplateFilePaths = reportsTemplateFilePaths.concat(
    //  samplesReportsTemplateFilePaths
    //);

    for (let filePath of reportsTemplateFilePaths) {
      console.log(`filePath = ${filePath}`);

      const reportTemplateFileName = Utilities.basename(filePath);

      const folderName = Utilities.basename(Utilities.dirname(filePath));

      if (filePath.includes('samples/reports')) {
        tplType = 'template-report-sample';
        relativeFilePath = filePath.replace(
          //`${this.PORTABLE_EXECUTABLE_DIR}/templates/samples/reports/`,
          `templates/samples/reports/`,
          '',
        );
      } else {
        tplType = 'template-report';
        relativeFilePath = filePath.replace(
          //`${this.PORTABLE_EXECUTABLE_DIR}/templates/reports/`,
          `templates/reports/`,
          '',
        );
      }

      reportsTemplateFiles.push({
        fileName: reportTemplateFileName,
        filePath: filePath,
        type: tplType,
        folderName: folderName,
        relativeFilePath: relativeFilePath,
      });
    }

    const templateFiles = emailsTemplateFiles.concat(reportsTemplateFiles);

    this.templateFiles = templateFiles;
    return templateFiles;
  }

  async saveReportingFileAsync(
    filePath: string,
    xmlReporting: { documentburster: {} },
  ) {
    console.log(
      `saveReportingFileAsynce xmlReporting = ${JSON.stringify(xmlReporting)}`,
    );
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

  getConfigurations(visibility?: string) {
    return this.configurationFiles.filter((configuration) => {
      let filterCondition = configuration.type != 'config-samples';

      if (visibility)
        filterCondition =
          filterCondition && configuration.visibility === visibility;

      return filterCondition;
    });
  }

  getMailMergeConfigurations(visibility?: string) {
    return this.configurationFiles.filter((configuration) => {
      let filterCondition = configuration.capReportGenerationMailMerge;

      if (visibility)
        filterCondition =
          filterCondition && configuration.visibility === visibility;

      return filterCondition;
    });
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
    return this.configurationFiles.filter((configuration) => {
      let filterCondition = configuration.type == 'config-samples';

      if (visibility)
        filterCondition =
          filterCondition && configuration.visibility === visibility;

      return filterCondition;
    });
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
