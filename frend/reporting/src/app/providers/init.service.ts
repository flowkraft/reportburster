import { Injectable } from '@angular/core';
import { StateStoreService } from './state-store.service';
import { RbElectronService } from '../areas/electron-nodejs/electron.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  constructor(
    private stateStore: StateStoreService,
    private electronService: RbElectronService,
    private apiService: ApiService,
  ) {}

  async initialize(): Promise<void> {
    if (this.electronService.isElectron) {
      const backendUrl = await this.electronService.getBackendUrl();
      this.stateStore.configSys.sysInfo.setup.BACKEND_URL = backendUrl;
      // Set API service URL after initialization
      this.apiService.BACKEND_URL = backendUrl;

      const systemInfo = await this.electronService.getSystemInfo();
      this.stateStore.configSys.sysInfo.setup.chocolatey = {
        ...systemInfo.chocolatey,
      };
      this.stateStore.configSys.sysInfo.setup.java = { ...systemInfo.java };
      this.stateStore.configSys.sysInfo.setup.env = { ...systemInfo.env };
    }
  }
}
