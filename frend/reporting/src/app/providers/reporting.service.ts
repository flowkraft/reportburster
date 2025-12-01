import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ReportParameter, SettingsService } from './settings.service';

export interface ReportDataResult {
  reportData: Array<Record<string, any>>;
  reportColumnNames: string[];
  executionTimeMillis: number;
  isPreview: boolean;
  totalRows: number;
}

export interface TabulatorOptionsDto {
  layoutOptions?: any;
  columns?: Array<{ title?: string; field?: string; [k: string]: any }>;
  data?: Array<Record<string, any>>;
}

export interface ChartOptionsDto {
  type?: string;
  labelField?: string; // Which column from reportData to use for X-axis labels
  options?: any; // Chart.js options passthrough
  labels?: string[]; // Explicit labels override
  datasets?: Array<{ field?: string; label?: string; color?: string; type?: string; [k: string]: any }>; // Series/dataset configurations
  data?: Array<Record<string, any>>; // Optional data override (defaults to reportData)
}

@Injectable({
  providedIn: 'root',
})
export class ReportingService {
  constructor(
    protected apiService: ApiService,
    protected settingsService: SettingsService,
  ) {}

  async testFetchData(
    parameters: { [key: string]: any },
    configurationFilePath: string = this.settingsService
      .currentConfigurationTemplatePath,
  ) {
    //console.log(
    //  `testFetchData parameters: ${JSON.stringify(parameters)}, configurationFilePath: ${configurationFilePath}`,
    //);

    // Create URLSearchParams object
    const params = new URLSearchParams();

    // Add required parameters
    params.set('configurationFilePath', configurationFilePath);

    // Add optional parameters
    Object.entries(parameters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value.toString());
      }
    });

    // Convert URLSearchParams to plain object for serialization
    const paramsObj = {};
    params.forEach((value, key) => {
      paramsObj[key] = value;
    });

    //console.log('Sending parameters:', JSON.stringify(paramsObj));

    // Make GET request with query parameters
    // console.log('[DEBUG] testFetchData: calling API with params:', paramsObj);
    const result = await this.apiService.get('/jobman/reporting/test-fetch-data', paramsObj);
    // console.log('[DEBUG] testFetchData: received response:', result);
    return result;
  }

  async processGroovyParametersDsl(
    groovyDslCode: string,
  ): Promise<ReportParameter[]> {
    //console.log('Processing Groovy DSL parameters:', {
    //  code: groovyDslCode,
    //  configPath: this.settingsService.currentConfigurationTemplatePath,
    //});

    try {
      const result = await this.apiService.post(
        '/jobman/reporting/parse-parameters',
        groovyDslCode,
      );

      //console.log('Received parameters from backend:', result);
      return result;
    } catch (error) {
      //console.error('Error processing Groovy DSL:', error);
      throw error;
    }
  }

  async processGroovyTabulatorDsl(
    groovyDslCode: string,
  ): Promise<TabulatorOptionsDto> {
    try {
      const result = await this.apiService.post(
        '/jobman/reporting/parse-tabulator',
        groovyDslCode,
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  async processGroovyChartDsl(
    groovyDslCode: string,
  ): Promise<ChartOptionsDto> {
    try {
      const result = await this.apiService.post(
        '/jobman/reporting/parse-chart',
        groovyDslCode,
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
}
