import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StateStoreService } from './state-store.service';
import { RbElectronService } from '../areas/electron-nodejs/electron.service';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  constructor(
    private stateStore: StateStoreService,
    private electronService: RbElectronService,
    private apiService: ApiService,
    private http: HttpClient,
  ) { }

  async initialize(): Promise<void> {
    if (this.electronService.isElectron) {
      const backendUrl = await this.electronService.getBackendUrl();
      this.stateStore.configSys.sysInfo.setup.BACKEND_URL = backendUrl;
      // Set API service URL after initialization
      this.apiService.BACKEND_URL = backendUrl;

      // Read API key from file system (secure - no HTTP endpoint exposed)
      const apiKey = await this.electronService.getApiKey();
      if (apiKey) {
        // TEMP: API key disabled during rollback - not setting on ApiService
        // this.apiService.setApiKey(apiKey);
      }

      const systemInfo = await this.electronService.getSystemInfo();
      this.stateStore.configSys.sysInfo.setup.chocolatey = {
        ...systemInfo.chocolatey,
      };
      this.stateStore.configSys.sysInfo.setup.java = { ...systemInfo.java };
      this.stateStore.configSys.sysInfo.setup.env = { ...systemInfo.env };
    } else {
      // TEMP (2025-12-19): API key handling is present below but intentionally skipped in web mode during rollback.
      // We return early to avoid accidentally setting an API key in normal web usage until a proper reimplementation is scheduled.
      return;

      try {
        const config = await firstValueFrom(
          this.http.get<{ apiKey?: string }>('/assets/config.json')
        );

        if (config?.apiKey) {
          // API key present: would set if rollback was not active
          this.apiService.setApiKey(config.apiKey);
        } else {
          //console.warn('No API key found in config.json');
        }
      } catch (error) {
          // Fallback API key (dev): would set if rollback not active
          this.apiService.setApiKey("123");
      }

    }
  }
}
