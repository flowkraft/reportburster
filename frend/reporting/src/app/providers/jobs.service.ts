import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

/**
 * Jobs domain service — wraps /api/jobs/* endpoints.
 * Handles file uploads for processing, job control (pause/cancel),
 * and quarantine management.
 * Mirrors the backend JobsController.
 */
@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(protected apiService: ApiService) {}

  async uploadSingle(formData: FormData): Promise<any> {
    const customHeaders = new Headers({ Accept: 'application/json' });
    return this.apiService.post(
      '/jobs/upload/process-single',
      formData,
      customHeaders,
    );
  }

  async uploadMultiple(formData: FormData): Promise<any> {
    const customHeaders = new Headers({ Accept: 'application/json' });
    return this.apiService.post(
      '/jobs/upload/process-multiple',
      formData,
      customHeaders,
    );
  }

  async uploadQa(formData: FormData): Promise<any> {
    const customHeaders = new Headers({ Accept: 'application/json' });
    return this.apiService.post(
      '/jobs/upload/process-qa',
      formData,
      customHeaders,
    );
  }

  async pauseOrCancel(command: string, jobFilePath: string): Promise<any> {
    return this.apiService.post('/jobs/pause/cancel', {
      id: command,
      info: jobFilePath,
    });
  }

  async clearQuarantine(): Promise<any> {
    return this.apiService.delete('/jobs/files/quarantine');
  }
}
