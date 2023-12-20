import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

import { ElectronLog } from 'electron-log';

//import * as jetpack from 'fs-jetpack';

//const exec = require('util').promisify(require('child_process').exec);

//import { spawn } from 'child_process';

//import * as uniqueFilename from 'unique-filename';

//import * as path from 'path';

//import * as slash from 'slash';
import { ToastrMessagesService } from './toastr-messages.service';
import { ExecutionStatsService } from './execution-stats.service';
import { Subscription, interval } from 'rxjs';
import Utilities from '../helpers/utilities';
import { ElectronService } from '../core/services';
import { ChildProcessWithoutNullStreams } from 'child_process';

@Injectable()
export class ShellService {
  //log: ElectronLog = require('electron-log');
  logFilePath: string;
  isJavaOk = true;

  checkJavaSubscription: Subscription;

  constructor(
    protected settingsService: SettingsService,
    protected messagesService: ToastrMessagesService,
    protected executionStatsService: ExecutionStatsService,
    protected electronService: ElectronService
  ) {
    this.logFilePath = Utilities.slash(
      this.electronService.path.resolve(
        this.electronService.PORTABLE_EXECUTABLE_DIR + '/logs/bash.service.log'
      )
    );

    this.electronService.log.transports.file.resolvePath = () =>
      this.logFilePath;

    //FIXME define a constant CHECK_INTERVAL = 333 to be reused across all ).subscribe
    this.checkJavaSubscription = interval(1000).subscribe((x) => {
      this.checkJavaVersion();
    });
  }

  async checkJavaVersion() {
    try {
      const { stdout, stderr } = await this.electronService.util.promisify(
        this.electronService.exec
      )('java -version');
      this.isJavaOk = true;
    } catch (error) {
      //console.log(`error java1 - version: ${error}`);
      //Errors => Java is either not installed or the installation has a problem
      this.isJavaOk = false;
    }
  }

  runBatFile(
    arrguments: string[],
    workItemName?: string,
    exitCallback?: Function
  ) {
    let currentWorkingDirPath = '.';

    currentWorkingDirPath = this.electronService.PORTABLE_EXECUTABLE_DIR;
    //console.log(`runBatFile arguments: ${arrguments}`);
    const batScript = this.electronService.spawn(
      'documentburster.bat',
      ['/c'].concat(arrguments),
      {
        cwd: this.electronService.path.resolve(
          Utilities.slash(currentWorkingDirPath)
        ),
        shell: true,
      }
    );
    this.handleScriptEvents(batScript, workItemName, exitCallback);
  }

  startStopTestEmailServer(command: string) {
    const currentWorkingDirPath = Utilities.slash(
      this.electronService.PORTABLE_EXECUTABLE_DIR + '/tools/test-email-server/'
    );
    const batFile = command + 'TestEmailServer.bat';

    this.electronService.log.debug(
      'batFile: "' +
        batFile +
        '", currentWorkingDirPath: "' +
        currentWorkingDirPath +
        '", action: "' +
        command +
        '"'
    );

    const batScript = this.electronService.spawn(batFile, ['/c'], {
      cwd: this.electronService.path.resolve(currentWorkingDirPath),
      shell: true,
    });

    this.handleScriptEvents(batScript, null, null);
  }

  async doKillOldExeThenCopyAndStartNewExe(
    jobFilePath: string,
    newExeFilePath: string,
    upgDbTempFolderPath: string
  ) {
    const jfp = Utilities.slash(this.electronService.path.resolve(jobFilePath));
    const nefp = Utilities.slash(
      this.electronService.path.resolve(newExeFilePath)
    );
    const tfp = Utilities.slash(
      this.electronService.path.resolve(upgDbTempFolderPath)
    );

    this.electronService.log.debug(
      `doKillOldExeThenCopyAndStartNewExe - ujp: ${this.settingsService.UPDATE_JAR_FILE_PATH} jfp: ${jfp} nefp: ${nefp} tfp: ${tfp}`
    );

    const script = this.electronService.spawn(
      'java',
      [
        '-cp',
        this.settingsService.UPDATE_JAR_FILE_PATH,
        'com.sourcekraft.documentburster.update.KillOldExeThenCopyAndStartNewExe',
        '-jfp',
        jfp,
        '-nefp',
        nefp,
        '-tfp',
        tfp,
        '2>&1',
        '>>',
        this.logFilePath,
      ],
      {
        cwd: Utilities.slash(
          this.electronService.path.resolve(
            this.electronService.PORTABLE_EXECUTABLE_DIR
          )
        ),
        shell: true,
      }
    );

    script.stderr.on('data', (data) => {
      this.messagesService.showError(data);
    });
  }

  handleScriptEvents(
    script: ChildProcessWithoutNullStreams,
    workItemName?: string,
    exitCallback?: Function
  ) {
    script.stdout.on('data', (data) => {
      //console.log(`handleScriptEvents - script.stdout.on('data'`);

      let message = 'Working ... Please wait.';
      if (workItemName) {
        message = 'Working on ' + workItemName + '. Please wait.';
      }

      this.messagesService.showInfo(message, '', {
        messageClass: 'java-started',
      });
    });

    script.stderr.on('data', (data) => {
      console.log(`handleScriptEvents - data: ${data}`);
      this.messagesService.showError('Error');
    });

    script.on('exit', (code) => {
      //console.log(`handleScriptEvents - script.on('exit'`);
      if (exitCallback) {
        exitCallback();
      }

      let message = 'Done';

      if (workItemName) {
        message = 'Done ' + workItemName;
      }

      if (code === 0) {
        this.messagesService.showInfo(message, '', {
          messageClass: 'java-exited',
        });
      } else {
        this.messagesService.showError('Error', '', {
          messageClass: 'java-exited',
        });
      }
    });
  }

  async generateMergeFileInTempFolder(
    filePaths: { path: string }[]
  ): Promise<string> {
    // returns something like: /tmp/my-test-912ec803b2ce49e4a541068d495ab570
    const mergeFilePath = this.electronService.uniqueFilename(
      Utilities.slash(this.electronService.PORTABLE_EXECUTABLE_DIR + '/temp/'),
      'merge-files'
    );

    const pdfFilePaths = filePaths
      .map(function (obj) {
        return obj.path;
      })
      .join('\n');

    await this.electronService.jetpack.writeAsync(mergeFilePath, pdfFilePaths);

    return Promise.resolve(
      this.electronService.path.resolve(Utilities.slash(mergeFilePath))
    );
  }

  async clearQuarantinedFiles() {
    this.electronService.jetpack.dirAsync(
      this.settingsService.QUARANTINED_FOLDER_PATH,
      {
        empty: true,
      }
    );
  }

  async clearLogs(logFileName?: string) {
    const allAsyncCommands = [];
    if (logFileName) {
      allAsyncCommands.push(
        this.electronService.jetpack.writeAsync(
          this.settingsService.LOGS_FOLDER_PATH + logFileName,
          ''
        )
      );
    } else {
      const logFiles = await this.electronService.jetpack.findAsync(
        this.settingsService.LOGS_FOLDER_PATH,
        {
          matching: '*log*',
          recursive: false,
          files: true,
          directories: false,
          ignoreCase: true,
        }
      );
      if (logFiles) {
        logFiles.forEach((file) => {
          if (
            !file.includes('documentburster.') &&
            !file.includes('service.')
          ) {
            allAsyncCommands.push(
              this.electronService.jetpack.writeAsync(file, '')
            );
          }
        });
      }
    }
    await Promise.all(allAsyncCommands);
    await this.executionStatsService.checkLogsFolder();

    if (logFileName) {
      this.messagesService.showInfo(logFileName + ' was cleared.');
    } else {
      this.messagesService.showInfo('Logs cleared.');
    }
  }

  async clearResumeJob(jobFilePath: string) {
    await this.electronService.jetpack.removeAsync(jobFilePath);
    this.messagesService.showInfo('Job was cleared.');
  }
}
