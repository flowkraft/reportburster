import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RbElectronService {
  cet: any;

  get isElectron(): boolean {
    return false;
  }

  async getSystemInfo(): Promise<any> {
    return {};
  }

  async getBackendUrl(): Promise<string> {
    return '';
  }

  async getApiKey(): Promise<string | null> {
    // Web mode uses session + CSRF (Spring Security standard pattern)
    // No API key needed - XSRF-TOKEN cookie is used instead
    return null;
  }
}
