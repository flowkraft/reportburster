import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as semver from 'semver';
import { ApiService } from './api.service';
import { APP_CONFIG } from '../../environments/environment';

export interface ExtConnection {
  fileName: string;
  filePath: string;
  connectionCode: string;
  connectionName: string;
  connectionType: 'email-connection' | 'database-connection';
  activeClicked: boolean;
  defaultConnection: boolean;
  useForJasperReports: boolean;
  usedBy: string;
  // True for synthesized sample DB connections (Northwind SQLite/DuckDB/ClickHouse)
  isSample?: boolean;
  emailserver?: {
    host: string;
    port: string;
    userid: string;
    userpassword: string;
    usessl: boolean;
    usetls: boolean;
    fromaddress: string;
    name: string;
    oauth2provider?: string;
    oauth2clientid?: string;
    oauth2tenantid?: string;
    oauth2authorizeurl?: string;
    oauth2tokenurl?: string;
    oauth2scope?: string;
    oauth2refreshtoken?: string;
    oauth2useremail?: string;
  };
  dbserver?: {
    type: string; // mysql, postgresql, sqlserver, oracle
    host: string;
    port: string;
    database: string;
    userid: string;
    userpassword: string;
    usessl: boolean;
    defaultquery: string;
  };
}

export const newEmailServer: {
  host: string;
  port: string;
  userid: string;
  userpassword: string;
  usessl: boolean;
  usetls: boolean;
  fromaddress: string;
  name: string;
  oauth2provider?: string;
  oauth2clientid?: string;
  oauth2tenantid?: string;
  oauth2authorizeurl?: string;
  oauth2tokenurl?: string;
  oauth2scope?: string;
  oauth2refreshtoken?: string;
  oauth2useremail?: string;
} = {
  host: 'Email Server Host',
  port: '25',
  userid: 'From Email User ID',
  userpassword: 'From Email Password',
  usessl: false,
  usetls: false,
  fromaddress: 'from@emailaddress.com',
  name: 'From Name',
  oauth2provider: 'NONE',
  oauth2clientid: '',
  oauth2tenantid: '',
  oauth2authorizeurl: '',
  oauth2tokenurl: '',
  oauth2scope: '',
  oauth2refreshtoken: '',
  oauth2useremail: '',
};

export const newDatabaseServer = {
  type: 'oracle',
  host: 'Database Server Host',
  port: '1521', // SQL Server 1433, MySQL 3306, PostgreSQL 5432, Oracle 1521
  database: 'Database Name',
  userid: 'Database Username',
  userpassword: 'Database Password',
  usessl: false,
  defaultquery: 'SELECT 1 AS connection_test',
};

export interface TmplFileInfo {
  fileName: string;
  filePath: string;
  type: string;
  content?: string;
  folderName: string;
  relativeFilePath: string;
}

export interface ReportParameter {
  id: string;
  type: string;
  value?: any;
  label?: string;
  description?: string;
  defaultValue?: any;
  constraints?: {
    [key: string]: any;
    required?: boolean;
    min?: number | string;
    max?: number | string;
    pattern?: string;
  };
  uiHints?: {
    [key: string]: any;
    control?: string;
    list?: any[];
    sql?: string;
  };
}

export interface CfgTmplFileInfo {
  fileName: string;
  filePath: string;
  templateName: string;
  capReportGenerationMailMerge: boolean;
  capReportDistribution: boolean;
  dsInputType: string;
  notes: string;
  type: string;
  folderName: string;
  relativeFilePath: string;
  isFallback: boolean;
  scriptOptionsSelectFileExplorer: string;
  activeClicked?: boolean;
  useEmlConn?: boolean;
  emlConnCode?: string;

  // For JasperReports: DB connection code (from datasource.properties or default)
  dbConnectionCode?: string;

  reportParameters: ReportParameter[];
  
  // Parsed Tabulator DSL options — flat map matching tabulator.info constructor options
  tabulatorOptions?: {
    columns?: Array<{ title?: string; field?: string; [k: string]: any }>;
    data?: Array<Record<string, any>>;
    [k: string]: any; // all other tabulator.info options (layout, height, pagination, etc.)
  };
  
  // Parsed Chart DSL options (type, labelField, options, labels, datasets, data)
  chartOptions?: {
    type?: string;
    labelField?: string;
    options?: any;
    labels?: string[];
    datasets?: Array<{ field?: string; label?: string; color?: string; type?: string; [k: string]: any }>;
    data?: Array<Record<string, any>>;
  };

  // Parsed Pivot Table DSL options
  pivotTableOptions?: {
    rows?: string[];
    cols?: string[];
    vals?: string[];
    aggregatorName?: string;
    rendererName?: string;
    rowOrder?: string;
    colOrder?: string;
    valueFilter?: Record<string, any>;
    options?: any;
    data?: Array<Record<string, any>>;
    hiddenAttributes?: string[];
    hiddenFromAggregators?: string[];
    hiddenFromDragDrop?: string[];
    unusedOrientationCutoff?: number;
    menuLimit?: number;
    sorters?: Record<string, any>;
    derivedAttributes?: Record<string, string>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  
  xmlInternalSettings = {
    documentburster: {
      settings: {
        skin: 'skin-black',
        backendurl: 'http://localhost:9090',
        copiloturl: 'https://chatgpt.com/',
        showsamples: false,
      },
    },
  };

  // Emits whenever the showsamples preference changes.
  // CRUD list views (Connections, Reports, Cube Definitions) subscribe and reload.
  showSamples$ = new BehaviorSubject<boolean>(false);

  get showSamples(): boolean {
    const v: any = this.xmlInternalSettings?.documentburster?.settings?.showsamples;
    // Robust to both boolean and string XML representations
    return v === true || v === 'true';
  }

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

  currentConfigurationTemplate: CfgTmplFileInfo;

  configurationFiles: Array<CfgTmplFileInfo> = [];
  templateFiles: Array<TmplFileInfo> = [];

  defaultEmailConnectionFile: ExtConnection;
  defaultDatabaseConnectionFile: ExtConnection;

  _emailConnectionsFiles: ExtConnection[] | null = null;
  _databaseConnectionsFiles: ExtConnection[] | null = null;
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

  /**
   * MINIMAL LOADING - Fast startup.
   * Returns only basic metadata needed for UI menus (no DSL parsing).
   * DSL options are loaded on-demand via loadReportDetails().
   */
  async loadAllReports({
    forceReload = false,
    fullLoad = false,  // Set to true for backward-compat scenarios needing all details upfront
  }: { forceReload?: boolean; fullLoad?: boolean } = {}): Promise<Array<CfgTmplFileInfo>> {
    if (
      !forceReload &&
      this.configurationFiles &&
      this.configurationFiles.length > 0
    )
      return this.configurationFiles;

    // Clear cache on force reload
    if (forceReload) {
      this.configDetailsCache.clear();
    }

    // Use minimal endpoint for fast startup, full endpoint only when explicitly needed
    const endpoint = fullLoad ? '/reports/load-all' : '/reports/load-all-minimal';
    this.configurationFiles = await this.apiService.get(endpoint);

    return this.configurationFiles;
  }

  /**
   * FULL DETAILS LOADING - On-demand for a specific configuration.
   * Loads and caches DSL options (reportParameters, tabulatorOptions, etc.)
   * Merges the loaded details into the existing configurationFiles entry.
   *
   * @param configFile The configuration to load details for
   * @returns The updated configuration with DSL options populated
   */
  async loadReportDetails(configFile: CfgTmplFileInfo): Promise<CfgTmplFileInfo> {
    // Only reports, samples, and jasper reports have details to load
    if (configFile.type !== 'config-reports' && configFile.type !== 'config-samples' && configFile.type !== 'config-jasper-reports') {
      return configFile;
    }

    const cacheKey = configFile.filePath;

    // Check cache first
    if (this.configDetailsCache.has(cacheKey)) {
      const cached = this.configDetailsCache.get(cacheKey);
      configFile.reportParameters = cached.reportParameters || [];
      configFile.tabulatorOptions = cached.tabulatorOptions;
      configFile.chartOptions = cached.chartOptions;
      configFile.pivotTableOptions = cached.pivotTableOptions;
      return configFile;
    }

    try {
      const details = await this.apiService.get('/reports/load-config-details', {
        path: configFile.filePath,
      });

      if (details) {
        // Merge loaded details into the config
        configFile.reportParameters = details.reportParameters || [];
        configFile.tabulatorOptions = details.tabulatorOptions;
        configFile.chartOptions = details.chartOptions;
        configFile.pivotTableOptions = details.pivotTableOptions;

        // Cache the results
        this.configDetailsCache.set(cacheKey, {
          reportParameters: configFile.reportParameters,
          tabulatorOptions: configFile.tabulatorOptions,
          chartOptions: configFile.chartOptions,
          pivotTableOptions: configFile.pivotTableOptions,
        });
      }
    } catch (error) {
      console.error(`Failed to load config details for ${configFile.folderName}:`, error);
    }

    return configFile;
  }

  /**
   * Invalidate cached details for a specific configuration.
   * Call this when DSL files are saved/modified to ensure fresh data on next load.
   */
  invalidateConfigDetailsCache(filePath?: string): void {
    if (filePath) {
      this.configDetailsCache.delete(filePath);
    } else {
      // Clear entire cache
      this.configDetailsCache.clear();
    }
  }

  async resolveAbsolutePath(relativePath: string): Promise<string> {
    // Normalize relativePath by removing leading slash if present
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }

    // Call the backend API to resolve the path
    const response = await this.apiService.get(
      '/system/fs/resolve-absolute-path',
      {
        path: relativePath,
      },
    );

    return response.absolutePath;
  }

  async loadPreferences(): Promise<any> {
    const loaded = await this.apiService.get('/system/preferences');
    // Defensive default: if the loaded XML doesn't have the new field, it's false
    if (loaded?.settings && loaded.settings.showsamples === undefined) {
      loaded.settings.showsamples = false;
    }
    // Sync the BehaviorSubject with the loaded value (robust to bool/string)
    const v = loaded?.settings?.showsamples;
    this.showSamples$.next(v === true || v === 'true');
    return loaded;
  }

  async savePreferences(
    xmlSettings: {
      documentburster: {};
    },
  ): Promise<any> {
    const result = await this.apiService.post(
      '/system/preferences',
      xmlSettings.documentburster,
    );

    // Notify subscribers (CRUD list views) that the preference may have changed
    this.showSamples$.next(this.showSamples);

    return result;
  }

  // ===== Backward-compatible deprecated wrappers =====

  /**
   * Extract reportId (folder name) from a file path.
   * e.g. "config/reports/my-report/settings.xml" -> "my-report"
   */
  // Cache for loaded DSL details to avoid re-parsing
  private configDetailsCache: Map<string, {
    reportParameters?: ReportParameter[];
    tabulatorOptions?: any;
    chartOptions?: any;
    pivotTableOptions?: any;
  }> = new Map();

  refreshConnectionsUsedByInformation(
    filePath: string,
    xmlSettings: {
      documentburster: any;
    },
  ) {
    //console.log(
    //  `refreshConnectionsUsedByInformation filePath = ${filePath}, useConn = ${xmlSettings?.documentburster.settings.emailserver.useconn}, connCode = ${xmlSettings?.documentburster.settings.emailserver.conncode}`,
    //);

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

  getCopilotUrl(): string {
    return (
      this.xmlInternalSettings?.documentburster?.settings?.copiloturl ||
      'https://copilot.microsoft.com'
    );
  }

  getEmailConnectionFiles(): ExtConnection[] {
    if (!this._emailConnectionsFiles) {
      this._emailConnectionsFiles = this.connectionFiles.filter(
        (conn) => conn.connectionType === 'email-connection',
      );
    }
    return this._emailConnectionsFiles;
  }

  getDatabaseConnectionFiles(): ExtConnection[] {
    if (!this._databaseConnectionsFiles) {
      this._databaseConnectionsFiles = this.connectionFiles.filter(
        (conn) => conn.connectionType === 'database-connection',
      );
    }
    return this._databaseConnectionsFiles;
  }

  async loadSqlOptionsAsync(sql: string) {
    return this.apiService.get('/reports/load-sql-options', { sql });
  }

  async loadAllConnections() {
    if (this.connectionsLoading == 1) return;

    this.connectionsLoading = 1;

    const emailConnFiles = await this.apiService.get(
      '/connections/email',
    );
    const dbConnFiles = await this.apiService.get(
      '/connections/database',
    );

    // Combine all connection files
    const connFiles = [...(emailConnFiles || []), ...(dbConnFiles || [])];

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

      this.defaultDatabaseConnectionFile = this.getConnectionDetails({
        connectionType: 'database-connection',
        defaultConnection: true,
        connectionCode: '',
      });
    } else {
      this.connectionFiles = [];
      this.defaultEmailConnectionFile = null;
      this.defaultDatabaseConnectionFile = null;
    }

    // Invalidate derived caches so they recompute from fresh connectionFiles
    this._emailConnectionsFiles = null;
    this._databaseConnectionsFiles = null;

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

  async loadAllReportTemplates() {
    this.templateFiles = await this.apiService.get(
      '/reports/load-templates-all',
    );

    return this.templateFiles;
  }

  getConfigurations() {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter(
        (configuration) => configuration.type != 'config-samples',
      );
    }
  }


  getMailMergeConfigurations(filter?: { samples?: boolean }) {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter((configuration) => {
        let filterCondition = configuration.capReportGenerationMailMerge;

        if (filterCondition)
          filterCondition =
            filterCondition && configuration.dsInputType !== 'ds.dashboard';

        if (filter && !filter.samples)
          filterCondition =
            filterCondition && !configuration.filePath.includes('samples');

        return filterCondition;
      });
    }
  }

  getJasperReportConfigurations() {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter(
        (configuration) => configuration.type === 'config-jasper-reports',
      );
    }
    return [];
  }

  getReportTemplates(outputType: string, options: any = {}) {
    // Filter templates by output type
    const templatesOfType = this.templateFiles.filter((tplFile) => {
      if (outputType === 'output.docx' && tplFile.fileName.endsWith('.docx'))
        return true;
      if (
        (outputType === 'output.html' ||
          outputType === 'output.dashboard' ||
          outputType === 'output.pdf' ||
          outputType === 'output.xlsx') &&
        tplFile.fileName.endsWith('.html')
      )
        return true;
      
      if (
        outputType === 'output.fop2pdf' &&
        (tplFile.fileName.endsWith('.fo') || tplFile.fileName.endsWith('.xsl') || tplFile.fileName.endsWith('.xslt'))
      )
        return true;

      return false;
    });

    // Further filter by configuration folder for DOCX templates only
    let filteredTemplates = templatesOfType;
    if (
      outputType === 'output.docx' &&
      this.currentConfigurationTemplate?.folderName
    ) {
      const folderToMatch = `/reports/${this.currentConfigurationTemplate.folderName}/`;
      filteredTemplates = templatesOfType.filter((tplFile) => {
        // Only include templates that are in the specific subfolder matching the current configuration
        return tplFile.filePath.includes(folderToMatch);
      });
    }

    // Apply sample filter if needed
    if (options && options.hasOwnProperty('samples')) {
      return filteredTemplates.filter((tplFile) => {
        if (options.samples) return tplFile.type.includes('-sample');
        return !tplFile.type.includes('-sample');
      });
    }

    return filteredTemplates;
  }

  getSampleConfigurations() {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter(
        (configuration) => configuration.type == 'config-samples',
      );
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
