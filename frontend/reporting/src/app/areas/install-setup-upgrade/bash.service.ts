import { Injectable } from '@angular/core';
import { TerminalService } from 'primeng/terminal';

import { ApiService } from '../../providers/api.service';
import Utilities from '../../helpers/utilities';
import { SettingsService } from '../../providers/settings.service';
import { FsService } from '../../providers/fs.service';
import UtilitiesElectron from '../../helpers/utilities-electron';

@Injectable({
  providedIn: 'root',
})
export class BashService {
  logFilePath = `${this.settingService.PORTABLE_EXECUTABLE_DIR}/logs/bash.service.log`;

  pTerminalInput: HTMLInputElement;

  constructor(
    protected apiService: ApiService,
    protected fsService: FsService,
    protected settingService: SettingsService,
    public terminalService: TerminalService,
  ) {}

  typeCommandOnTerminalAndThenPressEnter(command: string) {
    this.pTerminalInput.value = command;
    this.pTerminalInput.dispatchEvent(new Event('input'));
    this.pTerminalInput.dispatchEvent(
      new KeyboardEvent('keydown', {
        keyCode: 13,
      } as KeyboardEventInit),
    );
    this.pTerminalInput.focus();
  }

  async createJobFile(jobType: string): Promise<string> {
    let filePath = '';
    if (jobType === 'update')
      filePath = `${this.settingService.PORTABLE_EXECUTABLE_DIR}/updating DocumentBurster, please wait`;

    const jobFileName = Utilities.getRandomJobFileName();

    const jobFilePath = `${this.settingService.PORTABLE_EXECUTABLE_DIR}/temp/${jobFileName}`;
    const jobFileContent = Utilities.getJobFileContent(
      filePath,
      jobType,
      '14234234324324',
    );

    await UtilitiesElectron.writeAsync(jobFilePath, jobFileContent);
    return jobFilePath;
  }

  async emptyLogFile() {
    return this.fsService.writeAsync(this.logFilePath, '');
  }

  async installChocolatey(): Promise<void> {
    return this.apiService.post('/jobman/system/install/chocolatey');
  }

  async unInstallChocolatey(): Promise<void> {
    return this.apiService.post('/jobman/system/uninstall/chocolatey');
  }

  async log(message: string) {}

  async deleteJobFile(jobFilePath: string) {
    return this.fsService.removeAsync(jobFilePath);
  }

  restartElectronApp() {
    //this should call the RUST writen program rb_rust_updater
    //with the Electron APIs the restartElectronApp() never worked properly
  }
}
