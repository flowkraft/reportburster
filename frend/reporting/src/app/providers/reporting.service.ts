import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ReportParameter, SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class ReportingService {
  constructor(
    protected apiService: ApiService,
    protected settingsService: SettingsService,
  ) {}

  async testSqlQuery(sqlQuery: string, parameters: { [key: string]: any }) {
    // Create URLSearchParams object
    const params = new URLSearchParams();

    // Add required parameters
    params.set('sqlQuery', sqlQuery);
    params.set(
      'configurationFilePath',
      this.settingsService.currentConfigurationTemplatePath,
    );

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

    console.log('Sending parameters:', paramsObj);

    // Make GET request with query parameters
    return this.apiService.get('/jobman/reporting/test-sql-query', paramsObj);
  }

  async processGroovyParametersDsl(
    groovyDslCode: string,
  ): Promise<ReportParameter[]> {
    console.log('Processing Groovy DSL parameters:', {
      code: groovyDslCode,
      configPath: this.settingsService.currentConfigurationTemplatePath,
    });

    try {
      const result = await this.apiService.post(
        '/jobman/reporting/parse-parameters',
        groovyDslCode,
      );

      console.log('Received parameters from backend:', result);
      return result;
    } catch (error) {
      console.error('Error processing Groovy DSL:', error);
      throw error;
    }
  }
}
