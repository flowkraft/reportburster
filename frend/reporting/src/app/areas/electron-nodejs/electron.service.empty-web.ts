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
}
