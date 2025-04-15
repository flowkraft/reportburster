import { Injectable } from '@angular/core';
import { TerminalService } from 'primeng/terminal';

import { ApiService } from '../../providers/api.service';
import Utilities from '../../helpers/utilities';
import { FsService } from '../../providers/fs.service';
import { RbElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class BashService {
  logFilePath = `${this.electronService.PORTABLE_EXECUTABLE_DIR}/logs/bash.service.log`;

  pTerminalInput: HTMLInputElement;

  constructor(
    protected apiService: ApiService,
    protected fsService: FsService,
    protected electronService: RbElectronService,
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
      filePath = `samples/burst/updating DocumentBurster, please wait`;

    const jobFileName = Utilities.getRandomJobFileName();

    const jobFilePath = `temp/${jobFileName}`;
    const jobFileContent = Utilities.getJobFileContent(
      filePath,
      jobType,
      '14234234324324',
    );

    await this.fsService.writeAsync(jobFilePath, jobFileContent);
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
}
