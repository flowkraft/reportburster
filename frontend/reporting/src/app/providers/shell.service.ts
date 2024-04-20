import { Injectable } from '@angular/core';
import Utilities from '../helpers/utilities';
import { ApiService } from './api.service';
import { ToastrMessagesService } from './toastr-messages.service';
import { SettingsService } from './settings.service';
import { FsService } from './fs.service';

interface ProcessOutputResult {
  success: boolean;
  outputLines: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ShellService {
  //logFilePath: string;

  constructor(
    protected settingsService: SettingsService,
    protected messagesService: ToastrMessagesService,
    protected fsService: FsService,
    protected apiService: ApiService,
  ) {}

  async doKillOldExeThenCopyAndStartNewExe(
    jobFilePath: string,
    newExeFilePath: string,
    upgDbTempFolderPath: string,
  ) {
    const jblFilePath = Utilities.slash(
      await this.apiService.get('/jobman/system/fs/resolve', {
        paths: jobFilePath,
      }),
    );

    const script = await this.apiService.post(
      '/jobman/system/child-process/spawn',
      {
        command: 'rb_rust_updater',
        args: ['--job_file_path', jblFilePath, '2>&1'],
        options: {
          //cwd: this.settingsService.PORTABLE_EXECUTABLE_DIR,
          shell: true,
        },
      },
    );

    script.data.stderr.on('data', (data) => {
      this.messagesService.showError(data);
    });
  }

  async runBatFile(
    arrguments: string[],
    workItemName?: string,
    exitCallback?: Function,
  ) {
    let message = 'Working ... Please wait.';
    if (workItemName) {
      message = 'Working on ' + workItemName + '. Please wait.';
    }
    this.messagesService.showInfo(message, '', {
      messageClass: 'java-started',
    });

    const commands = ['documentburster.bat'].concat(arrguments);
    const batScript = await this.apiService.post(
      '/jobman/system/child-process/spawn',
      commands,
    );

    //console.log(`batScript = ${JSON.stringify(batScript)}`);
    this.handleScriptEvents(batScript, workItemName, exitCallback);
  }

  async generateMergeFileInTempFolder(filePaths: string[]): Promise<string> {
    console.log(`generateMergeFileInTempFolder filePaths = ${filePaths}`);

    //const dir = `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/temp/`;
    const dir = `temp/`;

    const uniqueId =
      Date.now().toString(36) + Math.random().toString(36).substring(2);
    const mergeFilePath = `${dir}merge-files-${uniqueId}`;

    const content = filePaths.join('\n');

    await this.fsService.writeAsync(mergeFilePath, content);
    return mergeFilePath;
  }

  async startStopTestEmailServer(command: string) {
    const message = 'Working ... Please wait.';

    this.messagesService.showInfo(message, '', {
      messageClass: 'java-started',
    });

    //const currentWorkingDirPath = `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/tools/test-email-server`;
    const currentWorkingDirPath = `tools/test-email-server`;
    const batFile = command + 'TestEmailServer.bat';

    const batScript = await this.apiService.post(
      `/jobman/system/child-process/spawn?cwdPath=${encodeURIComponent(
        Utilities.slash(currentWorkingDirPath),
      )}`,
      [batFile],
    );

    this.handleScriptEvents(batScript, null, null);
  }

  async clearResumeJob(jobFilePath: string) {
    await this.fsService.removeAsync(jobFilePath);
    this.messagesService.showInfo('Job was cleared.');
  }

  handleScriptEvents(
    result: ProcessOutputResult,
    workItemName?: string,
    exitCallback?: Function,
  ) {
    // Handle the result here. This will be called when the process has finished executing.
    let message = 'Done';
    if (workItemName) {
      message = 'Done ' + workItemName;
    }
    if (result.success) {
      this.messagesService.showInfo(message, '', {
        messageClass: 'java-exited',
      });
    } else {
      this.messagesService.showError('Error', '', {
        messageClass: 'java-exited',
      });
    }
    if (exitCallback) {
      exitCallback();
    }
  }
}
