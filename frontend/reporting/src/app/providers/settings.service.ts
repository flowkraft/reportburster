import { Injectable } from '@angular/core';

import * as semver from 'semver';

//import * as Squire from 'squire-rte';

//import * as jetpack from 'fs-jetpack';

//import * as slash from 'slash';
//import * as path from 'path';
//import * as isWindows from 'is-windows';

import { APP_CONFIG } from '../../environments/environment';
//import { Settings } from './settings';
import Utilities from '../helpers/utilities';
import { Settings } from '../helpers/settings';
import { ElectronService } from '../core/services';
import { WritableData } from 'fs-jetpack/types';

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
        skin: '',
      },
    },
  };

  //SHOULD_SEND_STATS: boolean = true;

  PORTABLE_EXECUTABLE_DIR: string;
  CONFIGURATION_FOLDER_PATH: string;
  CONFIGURATION_DEFAULTS_FOLDER_PATH: string;
  CONFIGURATION_BURST_FOLDER_PATH: string;
  CONFIGURATION_REPORTS_FOLDER_PATH: string;
  CONFIGURATION_SAMPLES_FOLDER_PATH: string;

  CONFIGURATION_CONNECTIONS_FOLDER_PATH: string;
  CONFIGURATION_TEMPLATES_FOLDER_PATH: string;

  INTERNAL_SETTINGS_FILE_PATH: string;

  LOGS_FOLDER_PATH: string;
  JOBS_FOLDER_PATH: string;
  QUARANTINED_FOLDER_PATH: string;

  UPDATE_JAR_FILE_PATH: string;

  isWindows: boolean = false;
  isServerVersion: boolean = false;

  product: string = 'DocumentBurster';

  version: semver.SemVer;
  skin: string;

  //xmlSettings: any;
  connectionsLoading: number = 0;
  connectionFiles: Array<ExtConnection> = [];
  defaultEmailConnectionFile: ExtConnection;

  templateFiles: Array<TmplFileInfo> = [];

  configurationFiles: Array<CfgTmplFileInfo> = [];
  currentConfigurationTemplatePath: string;
  currentConfigurationTemplateName: string;
  currentConfigurationTemplate: any;

  numberOfUserVariables: number;
  settingsApi: Settings;

  constructor(protected electronService: ElectronService) {
    //if (process.env.SHOULD_SEND_STATS) this.SHOULD_SEND_STATS = false;
    //this.SHOULD_SEND_STATS = electronService.SHOULD_SEND_STATS;

    //console.log(
    //  `this.electronService.PORTABLE_EXECUTABLE_DIR: ` + this.electronService.PORTABLE_EXECUTABLE_DIR
    //);

    this.PORTABLE_EXECUTABLE_DIR = electronService.PORTABLE_EXECUTABLE_DIR;

    this.CONFIGURATION_FOLDER_PATH = Utilities.slash(
      this.electronService.PORTABLE_EXECUTABLE_DIR + APP_CONFIG.folders.config
    );

    //this.CONFIGURATION_FOLDER_PATH = Utilities.slash(APP_CONFIG.folders.config);

    this.INTERNAL_SETTINGS_FILE_PATH = Utilities.slash(
      `${this.CONFIGURATION_FOLDER_PATH}/_internal/settings.xml`
    );

    this.CONFIGURATION_DEFAULTS_FOLDER_PATH = Utilities.slash(
      `${this.CONFIGURATION_FOLDER_PATH}/_defaults`
    );

    this.CONFIGURATION_BURST_FOLDER_PATH = Utilities.slash(
      `${this.CONFIGURATION_FOLDER_PATH}/burst`
    );

    this.CONFIGURATION_REPORTS_FOLDER_PATH = Utilities.slash(
      `${this.CONFIGURATION_FOLDER_PATH}/reports`
    );

    this.CONFIGURATION_SAMPLES_FOLDER_PATH = Utilities.slash(
      `${this.CONFIGURATION_FOLDER_PATH}/samples`
    );

    this.CONFIGURATION_CONNECTIONS_FOLDER_PATH = Utilities.slash(
      `${this.CONFIGURATION_FOLDER_PATH}/connections`
    );

    this.CONFIGURATION_TEMPLATES_FOLDER_PATH = Utilities.slash(
      `${this.electronService.PORTABLE_EXECUTABLE_DIR}/templates`
    );

    this.JOBS_FOLDER_PATH = Utilities.slash(
      this.electronService.PORTABLE_EXECUTABLE_DIR + APP_CONFIG.folders.temp
    );

    this.LOGS_FOLDER_PATH = Utilities.slash(
      this.electronService.PORTABLE_EXECUTABLE_DIR +
        APP_CONFIG.folders.logs +
        '/'
    );

    this.QUARANTINED_FOLDER_PATH = Utilities.slash(
      this.electronService.PORTABLE_EXECUTABLE_DIR +
        APP_CONFIG.folders.quarantine
    );

    this.settingsApi = new Settings(this.electronService.fs);
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

  async saveSettingsFileAsync(xmlSettings: {}, filePath: string) {
    return this.settingsApi.saveSettingsFileAsync(xmlSettings, filePath);
  }

  async saveReportingFileAsync(xmlReporting: {}, filePath: string) {
    const configFolderPath = Utilities.dirname(filePath);

    const configReportingFilePath = `${configFolderPath}/reporting.xml`;

    return this.settingsApi.saveSettingsFileAsync(
      xmlReporting,
      configReportingFilePath
    );
  }

  async saveFileAsync(data: WritableData, filePath: string) {
    this.electronService.jetpack.writeAsync(filePath, data);
  }

  async loadFileContentAsync(filePath: string): Promise<string> {
    return this.settingsApi.loadFileContentAsync(filePath);
  }

  async loadDefaultSettingsFileAsync(): Promise<any> {
    this.isWindows = Utilities.isWindows();

    const startServerScripts = await this.electronService.jetpack.findAsync(
      this.electronService.PORTABLE_EXECUTABLE_DIR,
      { matching: 'startServer.*', recursive: false }
    );

    if (startServerScripts && startServerScripts.length > 0) {
      this.isServerVersion = true;
      this.product = 'DocumentBurster Server';
    }

    const xmlSettings = await this.loadSettingsFileAsync(
      this.getDefaultsConfigurationValuesFilePath()
    );

    this.version = xmlSettings.documentburster.settings.version;

    return xmlSettings;
  }

  async loadReportingFileAsync(filePath: string): Promise<any> {
    return this.settingsApi.loadReportingFileAsync(filePath);
  }

  async loadSettingsFileAsync(filePath: string): Promise<any> {
    return this.settingsApi.loadSettingsFileAsync(filePath);
  }

  async loadPreferencesFileAsync(filePath: string): Promise<any> {
    return this.settingsApi.loadPreferencesFileAsync(filePath);
  }

  async parseXmlFileAsync(filePath: string): Promise<any> {
    return this.settingsApi.parseXmlFileAsync(filePath);
  }

  async loadAllSettingsFilesAsync(): Promise<Array<CfgTmplFileInfo>> {
    //console.log(`loadAllSettingsFilesAsync`);

    let ujf = await this.electronService.jetpack.findAsync(
      this.electronService.PORTABLE_EXECUTABLE_DIR,
      {
        matching: 'lib/burst/update-*.jar',
      }
    );
    let ujfp = ujf[0];

    if (ujfp) this.UPDATE_JAR_FILE_PATH = Utilities.slash(ujfp);

    const configurationFiles: Array<CfgTmplFileInfo> = [];

    const burstConfigFilePaths = await this.electronService.jetpack.findAsync(
      this.CONFIGURATION_BURST_FOLDER_PATH,
      {
        matching: '*.xml',
        recursive: false,
        files: true,
        directories: false,
      }
    );

    const reportsConfigFilePaths = await this.electronService.jetpack.findAsync(
      this.CONFIGURATION_REPORTS_FOLDER_PATH,
      {
        matching: 'settings.xml',
        recursive: true,
        files: true,
        directories: false,
      }
    );

    const samplesConfigFilePaths = await this.electronService.jetpack.findAsync(
      this.CONFIGURATION_SAMPLES_FOLDER_PATH,
      {
        matching: 'settings.xml',
        recursive: true,
        files: true,
        directories: false,
      }
    );

    const configFilePaths = burstConfigFilePaths
      .concat(reportsConfigFilePaths)
      .concat(samplesConfigFilePaths);

    //console.log(`configFilePaths = ${JSON.stringify(configFilePaths)}`);

    for (let filePath of configFilePaths) {
      const configurationFilePath = Utilities.slash(filePath);
      //console.log(`configurationFilePath: ${configurationFilePath}`);
      const configurationFileName = this.electronService.path.basename(
        configurationFilePath
      );

      const isFallbackSettings =
        configurationFilePath.endsWith('burst/settings.xml');

      //if (isFallbackSettings) {
      //  this.version = settingsConfiguration.documentburster.settings.version;
      //  this.skin = settingsConfiguration.documentburster.settings.skin;
      //}

      const isNotSettings =
        configurationFilePath.endsWith('_defaults/settings.xml') ||
        configurationFilePath.endsWith('preferences/settings.xml');

      if (isNotSettings) continue;

      const settingsFileContent = await this.electronService.jetpack.readAsync(
        configurationFilePath
      );

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
        JSON.parse(settingsFileContent.substring(startPos, endPos).trim())
      );

      startPos =
        settingsFileContent.indexOf('<reportgenerationmailmerge>') +
        '<reportgenerationmailmerge>'.length;
      endPos = settingsFileContent.indexOf('</reportgenerationmailmerge>');
      const boolReportGenerationMailMerge = Boolean(
        JSON.parse(settingsFileContent.substring(startPos, endPos).trim())
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
        JSON.parse(settingsFileContent.substring(startPos, endPos).trim())
      );

      startPos =
        settingsFileContent.indexOf('<conncode>') + '<conncode>'.length;
      endPos = settingsFileContent.indexOf('</conncode>');
      const strEmailConnectionCode = settingsFileContent
        .substring(startPos, endPos)
        .trim();

      let templateRelativeFilePath = `./config/burst/${configurationFileName}`;
      let typeOfConfiguration = 'config-burst-legacy';

      const folderName = this.electronService.path.basename(
        this.electronService.path.dirname(configurationFilePath)
      );

      let dsInputType = '';

      if (configurationFilePath.includes(`config/reports/${folderName}`)) {
        typeOfConfiguration = 'config-reports';
        templateRelativeFilePath = `./config/reports/${folderName}/settings.xml`;

        if (boolReportGenerationMailMerge) {
          const reportingXmlFileContent =
            await this.electronService.jetpack.readAsync(
              `${this.electronService.path.dirname(
                configurationFilePath
              )}/reporting.xml`
            );
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

    /*
    console.log(
      `configurationFiles = ${JSON.stringify(this.configurationFiles)}`
    );
    */

    return configurationFiles;
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

  getSampleConfigurations(visibility?: string) {
    return this.configurationFiles.filter((configuration) => {
      let filterCondition = configuration.type == 'config-samples';

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

  getDefaultsConfigurationValuesFilePath(): string {
    return `${this.CONFIGURATION_DEFAULTS_FOLDER_PATH}/settings.xml`;
  }

  readFileAsync(filePath: string) {
    return this.electronService.jetpack.readAsync(filePath);
  }

  async loadAllConnectionFilesAsync() {
    //console.log(`loadAllConnectionFilesAsync`);

    if (this.connectionsLoading == 1) return;

    this.connectionsLoading = 1;

    /*
    if (this.connectionFiles && this.connectionFiles.length > 0) {
      this.connectionsLoading = 0;
      return this.connectionFiles;
    }
    */

    this.defaultEmailConnectionFile = undefined;

    const connectionFiles: Array<ExtConnection> = [];

    console.log(
      `this.CONFIGURATION_CONNECTIONS_FOLDER_PATH = ${this.CONFIGURATION_CONNECTIONS_FOLDER_PATH}`
    );

    const connectionFilePaths = await this.electronService.jetpack.findAsync(
      this.CONFIGURATION_CONNECTIONS_FOLDER_PATH,
      {
        matching: '*.xml',
        recursive: false,
        files: true,
        directories: false,
      }
    );

    //console.log(`connectionFilePaths = ${JSON.stringify(connectionFilePaths)}`);

    for (let filePath of connectionFilePaths) {
      const connectionFilePath = Utilities.slash(filePath);
      const connectionFileName =
        this.electronService.path.basename(connectionFilePath);

      const xml = await this.parseXmlFileAsync(connectionFilePath);

      const connXml = xml.documentburster.connection;

      //console.log(`usedByConfs = ${JSON.stringify(usedByConfs)}`);

      connectionFiles.push({
        fileName: connectionFileName,
        filePath: connectionFilePath,
        connectionCode: connXml.code,
        connectionName: connXml.name,
        connectionType: connectionFileName.startsWith('eml-')
          ? 'email-connection'
          : 'database-connection',
        activeClicked: false,
        defaultConnection: connXml.default,
        usedBy: this.configurationFiles
          .filter((conf) => conf.useEmlConn && conf.emlConnCode == connXml.code)
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

    /*
    console.log(
      `this.connectionFiles = ${JSON.stringify(this.connectionFiles)}`
    );
      */

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

  async loadAllReportTemplatesFilesAsync() {
    let relativeFilePath: string, tplType: string;
    const emailsTemplateFiles: Array<TmplFileInfo> = [];

    /*
    
    
    let emailsTemplateFilePaths = await this.electronService.jetpack.findAsync(
      `${this.CONFIGURATION_TEMPLATES_FOLDER_PATH}/emails`,
      {
        matching: '*.html',
        recursive: true,
        files: true,
        directories: false,
      }
    );

    const samplesEmailsTemplateFilePaths =
      await this.electronService.jetpack.findAsync(
        `${this.CONFIGURATION_TEMPLATES_FOLDER_PATH}/samples/emails`,
        {
          matching: '*.html',
          recursive: true,
          files: true,
          directories: false,
        }
      );

    emailsTemplateFilePaths = emailsTemplateFilePaths.concat(
      samplesEmailsTemplateFilePaths
    );
    //console.log(`connectionFilePaths = ${JSON.stringify(connectionFilePaths)}`);
    
    for (let filePath of emailsTemplateFilePaths) {
      const emailTemplateFilePath = Utilities.slash(
        filePath
      );

      const emailTemplateFileName = this.electronService.path.basename(
        emailTemplateFilePath
      );

      const folderName = this.electronService.path.basename(
        this.electronService.path.dirname(emailTemplateFilePath)
      );

      const content = await this.electronService.jetpack.readAsync(
        emailTemplateFilePath
      );

      if (emailTemplateFilePath.includes('samples/emails')) {
        tplType = 'template-email-sample';
        relativeFilePath = emailTemplateFilePath.replace(
          `${this.electronService.PORTABLE_EXECUTABLE_DIR}/templates/samples/emails/`,
          ''
        );
      } else {
        tplType = 'template-email';
        relativeFilePath = emailTemplateFilePath.replace(
          `${this.electronService.PORTABLE_EXECUTABLE_DIR}/templates/emails/`,
          ''
        );
      }

      emailsTemplateFiles.push({
        fileName: emailTemplateFileName,
        filePath: emailTemplateFilePath,
        type: tplType,
        content: content,
        folderName: folderName,
        relativeFilePath: relativeFilePath,
      });
    }
    */
    //reports

    const reportsTemplateFiles: Array<TmplFileInfo> = [];

    //console.log(
    //  `this.CONFIGURATION_CONNECTIONS_FOLDER_PATH = ${this.CONFIGURATION_CONNECTIONS_FOLDER_PATH}`
    //);

    let reportsTemplateFilePaths = await this.electronService.jetpack.findAsync(
      `${this.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports`,
      {
        matching: ['*.docx', '*.html'],
        recursive: true,
        files: true,
        directories: false,
      }
    );

    console.log(`reportsTemplateFilePaths = ${reportsTemplateFilePaths}`);

    const samplesReportsTemplateFilePaths = [];
    /*
    const samplesReportsTemplateFilePaths =
      await this.electronService.jetpack.findAsync(
        `${this.CONFIGURATION_TEMPLATES_FOLDER_PATH}/samples/reports`,
        {
          matching: '*.docx',
          recursive: true,
          files: true,
          directories: false,
        }
      );
    */

    reportsTemplateFilePaths = reportsTemplateFilePaths.concat(
      samplesReportsTemplateFilePaths
    );

    //console.log(`connectionFilePaths = ${JSON.stringify(connectionFilePaths)}`);

    for (let filePath of reportsTemplateFilePaths) {
      const reportTemplateFilePath = Utilities.slash(
        this.electronService.path.resolve(filePath)
      );
      const reportTemplateFileName = this.electronService.path.basename(
        reportTemplateFilePath
      );

      //console.log(`reportTemplateFileName = ${reportTemplateFileName}`);

      const folderName = this.electronService.path.basename(
        this.electronService.path.dirname(reportTemplateFilePath)
      );

      if (reportTemplateFilePath.includes('samples/reports')) {
        tplType = 'template-report-sample';
        relativeFilePath = reportTemplateFilePath.replace(
          `${this.electronService.PORTABLE_EXECUTABLE_DIR}/templates/samples/reports/`,
          ''
        );
      } else {
        tplType = 'template-report';
        relativeFilePath = reportTemplateFilePath.replace(
          `${this.electronService.PORTABLE_EXECUTABLE_DIR}/templates/reports/`,
          ''
        );
      }

      reportsTemplateFiles.push({
        fileName: reportTemplateFileName,
        filePath: reportTemplateFilePath,
        type: tplType,
        folderName: folderName,
        relativeFilePath: relativeFilePath,
      });
    }

    const templateFiles = emailsTemplateFiles.concat(reportsTemplateFiles);

    this.templateFiles = templateFiles;
    //console.log(`this.templateFiles = ${JSON.stringify(this.templateFiles)}`);
    return templateFiles;
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
          connection.connectionCode == connectionCode;
        });
      }

      if (connFiles && connFiles.length == 1) {
        return connFiles[0];
      }
    }
    return undefined;
  }
}
