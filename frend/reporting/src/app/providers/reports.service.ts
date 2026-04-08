import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { APP_CONFIG } from '../../environments/environment';

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
  visibility: string;
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

  // Parsed Tabulator DSL options -- flat map matching tabulator.info constructor options
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
export class ReportsService {

  configurationFiles: Array<CfgTmplFileInfo> = [];
  templateFiles: Array<TmplFileInfo> = [];

  CONFIGURATION_FOLDER_PATH: string;
  CONFIGURATION_REPORTS_FOLDER_PATH: string;
  CONFIGURATION_DEFAULTS_FOLDER_PATH: string;
  CONFIGURATION_SAMPLES_FOLDER_PATH: string;
  CONFIGURATION_BURST_FOLDER_PATH: string;
  CONFIGURATION_TEMPLATES_FOLDER_PATH: string;
  INTERNAL_SETTINGS_FILE_PATH: string;

  currentConfigurationTemplatePath: string;
  currentConfigurationTemplateName: string;
  currentConfigurationTemplate: CfgTmplFileInfo;

  product: string = 'DocumentBurster';
  version: any;
  isWindows: boolean = false;
  isServerVersion: boolean = false;
  numberOfUserVariables: number;

  // Cache for loaded DSL details to avoid re-parsing
  private configDetailsCache: Map<string, {
    reportParameters?: ReportParameter[];
    tabulatorOptions?: any;
    chartOptions?: any;
    pivotTableOptions?: any;
  }> = new Map();

  constructor(public apiService: ApiService) {
    this.CONFIGURATION_FOLDER_PATH = `${APP_CONFIG.folders.config}`;
    this.INTERNAL_SETTINGS_FILE_PATH = `${this.CONFIGURATION_FOLDER_PATH}/_internal/settings.xml`;
    this.CONFIGURATION_DEFAULTS_FOLDER_PATH = `${this.CONFIGURATION_FOLDER_PATH}/_defaults`;
    this.CONFIGURATION_BURST_FOLDER_PATH = `${APP_CONFIG.folders.config}/burst`;
    this.CONFIGURATION_REPORTS_FOLDER_PATH = `${APP_CONFIG.folders.config}/reports`;
    this.CONFIGURATION_SAMPLES_FOLDER_PATH = `${APP_CONFIG.folders.config}/samples`;
    this.CONFIGURATION_TEMPLATES_FOLDER_PATH = `templates`;
  }

  getDefaultsConfigurationValuesFilePath(): string {
    return `${this.CONFIGURATION_DEFAULTS_FOLDER_PATH}/settings.xml`;
  }

  getMyReportsConfigurationValuesFilePath(): string {
    return `${this.CONFIGURATION_BURST_FOLDER_PATH}/settings.xml`;
  }

  async loadImageAsDataUrl(imagePath: string): Promise<string> {
    // Important: Explicitly set Accept header to image/*
    const response = await fetch(
      `/api/reports/serve-asset?path=${encodeURIComponent(imagePath)}`,
      {
        headers: {
          Accept: 'image/*', // This is critical
        },
      },
    );

    if (!response.ok) {
      console.error(
        `Failed to load image: ${imagePath}, status: ${response.status}`,
      );
      return null;
    }

    const blob = await response.blob();

    // Convert blob to data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  // ===== NEW ID-based methods =====

  async loadDefaults(): Promise<any> {
    const systemInfo = await this.apiService.get('/system/info');

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

    xmlSettings.documentburster = await this.apiService.get('/reports/load', {
      path: this.getDefaultsConfigurationValuesFilePath(),
    });

    this.version = xmlSettings.documentburster.settings.version;

    return xmlSettings;
  }

  async loadReportSettings(reportId: string): Promise<{
    documentburster: {
      settings: any;
    };
  }> {
    let xmlSettings = {
      documentburster: { settings: {} },
    };

    xmlSettings.documentburster = await this.apiService.get(
      `/reports/${encodeURIComponent(reportId)}/settings`,
    );

    return xmlSettings;
  }

  async loadSettingsByPath(configFilePath: string): Promise<{
    documentburster: {
      settings: any;
    };
  }> {
    let xmlSettings = {
      documentburster: { settings: {} },
    };

    xmlSettings.documentburster = await this.apiService.get(
      '/reports/load',
      { path: configFilePath },
    );

    return xmlSettings;
  }

  async saveReportSettings(
    reportId: string,
    xmlSettings: {
      documentburster: any;
    },
  ) {
    xmlSettings.documentburster.settings.attachments.items.attachmentItems.forEach(
      (item: { selected: boolean }) => {
        delete item.selected;
      },
    );

    return this.apiService.put(
      `/reports/${encodeURIComponent(reportId)}/settings`,
      xmlSettings.documentburster,
    );
  }

  async loadReportDataSource(reportId: string): Promise<any> {
    return this.apiService.get(
      `/reports/${encodeURIComponent(reportId)}/datasource`,
    );
  }

  async saveReportDataSource(
    reportId: string,
    xmlReporting: { documentburster: {} },
  ) {
    return this.apiService.put(
      `/reports/${encodeURIComponent(reportId)}/datasource`,
      xmlReporting.documentburster,
    );
  }

  /**
   * Load a template file by its path. Used when the path is known
   * (e.g., per-output-type templates: payslips-html.html, payslips-pdf.html).
   */
  async loadTemplateByPath(templatePath: string): Promise<string> {
    const textHeaders = new Headers({ Accept: 'text/plain' });
    return this.apiService.get(
      `/reports/load-template`,
      { path: templatePath },
      textHeaders,
      'text',
    );
  }

  /**
   * Save a template file by its path. Used when the path is known
   * (e.g., per-output-type templates).
   */
  async saveTemplateByPath(templatePath: string, content: string): Promise<void> {
    const textHeaders = new Headers({ 'Content-Type': 'text/plain' });
    return this.apiService.post(
      `/reports/save-template?path=${encodeURIComponent(templatePath)}`,
      content,
      textHeaders,
    );
  }

  /**
   * Load template content for a specific output type.
   * Backend computes the path: templates/reports/{reportId}/{reportId}-{type}.{ext}
   * Each output type has its own template file.
   */
  async loadReportTemplateByType(reportId: string, outputType: string): Promise<string> {
    const textHeaders = new Headers({ Accept: 'text/plain' });
    return this.apiService.get(
      `/reports/${encodeURIComponent(reportId)}/template/${encodeURIComponent(outputType)}`,
      undefined,
      textHeaders,
      'text',
    );
  }

  /**
   * Save template content for a specific output type.
   */
  async saveReportTemplateByType(reportId: string, outputType: string, content: string): Promise<{ documentpath?: string }> {
    const textHeaders = new Headers({ 'Content-Type': 'text/plain' });
    return this.apiService.put(
      `/reports/${encodeURIComponent(reportId)}/template/${encodeURIComponent(outputType)}`,
      content,
      textHeaders,
    );
  }

  /**
   * Load template content for a report.
   * Backend resolves the template path from the report's config — no type needed.
   */
  async loadReportTemplate(reportId: string): Promise<string> {
    const result = await this.apiService.get(
      `/reports/${encodeURIComponent(reportId)}/template`,
      undefined,
      new Headers({
        Accept: 'text/plain',
        'Content-Type': 'application/json',
      }),
      'text',
    );

    return result || '';
  }

  /**
   * Save template content for a report.
   * Backend resolves the template path from the report's config.
   */
  /**
   * Load a Groovy DSL script (tabulator, chart, pivot, datasource, etc.) by reportId and type.
   */
  async loadReportScript(reportId: string, scriptType: string): Promise<string> {
    const textHeaders = new Headers({ Accept: 'text/plain' });
    return this.apiService.get(
      `/reports/${encodeURIComponent(reportId)}/script/${encodeURIComponent(scriptType)}`,
      undefined,
      textHeaders,
      'text',
    );
  }

  /**
   * Save a Groovy DSL script by reportId and type.
   */
  async saveReportScript(reportId: string, scriptType: string, content: string) {
    const textHeaders = new Headers({ 'Content-Type': 'text/plain' });
    return this.apiService.put(
      `/reports/${encodeURIComponent(reportId)}/script/${encodeURIComponent(scriptType)}`,
      content,
      textHeaders,
    );
  }

  async saveReportTemplate(reportId: string, content: string) {
    const textHeaders = new Headers({ 'Content-Type': 'text/plain' });
    return this.apiService.put(
      `/reports/${encodeURIComponent(reportId)}/template`,
      content,
      textHeaders,
    );
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

  // ===== Gallery template methods (ID-based, no paths) =====

  /**
   * Load gallery template HTML content + asset base directory.
   */
  async loadGalleryTemplateContent(
    templateId: string,
    variant: number = 0,
  ): Promise<{ content: string; assetBaseDir: string }> {
    return this.apiService.get(`/gallery/templates/${encodeURIComponent(templateId)}/content`, { variant });
  }

  /**
   * Load gallery template README.
   */
  async loadGalleryTemplateReadme(templateId: string, variant: number = 0): Promise<string> {
    const textHeaders = new Headers({ Accept: 'text/plain' });
    return this.apiService.get(
      `/gallery/templates/${encodeURIComponent(templateId)}/readme`,
      { variant },
      textHeaders,
      'text',
    );
  }

  /**
   * Load gallery template AI prompt (type: 'modify' or 'scratch').
   */
  async loadGalleryTemplateAiPrompt(
    templateId: string,
    type: 'modify' | 'scratch',
    variant: number = 0,
  ): Promise<string> {
    const textHeaders = new Headers({ Accept: 'text/plain' });
    return this.apiService.get(
      `/gallery/templates/${encodeURIComponent(templateId)}/ai-prompt`,
      { type, variant },
      textHeaders,
      'text',
    );
  }

  /**
   * Get the URL to view a gallery template in the browser.
   */
  getGalleryTemplateViewUrl(templateId: string, variant: number = 0): string {
    return `/api/gallery/templates/${encodeURIComponent(templateId)}/view?variant=${variant}`;
  }

  async loadAllReportTemplates() {
    this.templateFiles = await this.apiService.get(
      '/reports/load-templates-all',
    );

    return this.templateFiles;
  }

  async loadSqlOptionsAsync(sql: string) {
    return this.apiService.get('/reports/load-sql-options', { sql });
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

  getJasperReportConfigurations() {
    if (this.configurationFiles && this.configurationFiles.length > 0) {
      return this.configurationFiles.filter(
        (configuration) => configuration.type === 'config-jasper-reports' && configuration.visibility === 'visible',
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

  // --- NEW atomic methods for report CRUD operations ---

  async createReport(
    reportId: string,
    templateName: string,
    capReportDistribution: boolean,
    capReportGenerationMailMerge: boolean,
    copyFromReportId?: string,
  ): Promise<CfgTmplFileInfo> {
    return this.apiService.post('/reports/configurations', {
      reportId,
      templateName,
      capReportDistribution,
      capReportGenerationMailMerge,
      copyFromReportId,
    });
  }

  async duplicateReport(
    sourceReportId: string,
    targetReportId: string,
    templateName: string,
    capReportDistribution: boolean,
    capReportGenerationMailMerge: boolean,
  ): Promise<CfgTmplFileInfo> {
    return this.apiService.post(
      `/reports/configurations/${sourceReportId}/duplicate`,
      {
        targetReportId,
        templateName,
        capReportDistribution,
        capReportGenerationMailMerge,
      },
    );
  }

  async deleteReport(reportId: string): Promise<void> {
    return this.apiService.delete(`/reports/configurations/${reportId}`);
  }

  async restoreDefaults(reportId: string): Promise<void> {
    return this.apiService.post(
      `/reports/configurations/${reportId}/restore-defaults`,
    );
  }

  async toggleVisibility(reportId: string, visibility: string): Promise<any> {
    return this.apiService.put(
      `/reports/configurations/${reportId}/visibility`,
      { visibility },
    );
  }
}
