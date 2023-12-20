//import * as jetpack from 'fs-jetpack';
//import * as path from 'path';

import { Injectable } from '@angular/core';

import { SettingsService } from './settings.service';
import { TranslateService } from '@ngx-translate/core';
import Utilities from '../helpers/utilities';
import { ElectronService } from '../core/services';

@Injectable({
  providedIn: 'root',
})
export class ExecutionStatsService {
  logStats = {
    infoLogFilePath: undefined,
    errorsLogFilePath: undefined,
    warningsLogFilePath: undefined,
    bashServiceLogFilePath: undefined,
    infoLogFileIsLocked: false,
    errorsLogFileIsLocked: false,
    warningsLogFileIsLocked: false,
    bashServiceLogFileIsLocked: false,
    infoLogFileSize: -1,
    errorsLogFileSize: -1,
    warningsLogFileSize: -1,
    bashServiceLogFileSize: -1,
    updateErrMessage: undefined,
  };

  jobStats = {
    progressValue: 0,
    numberOfActiveUpdateJobs: 0,
    numberOfActiveJobs: 0,
    progressJobFileExists: 0,
    pauseJobFileExists: 0,
    cancelJobFileExists: 0,
    workingOnJobs: [],
    workingOnFileNames: [],
    niceWorkingOnFileNames: '',
    jobsToResume: [],
  };

  constructor(
    protected settingsService: SettingsService,
    protected translate: TranslateService,
    protected electronService: ElectronService
  ) {}

  async checkLogsFolder() {
    try {
      const logsFolderExists = await this.electronService.jetpack.existsAsync(
        this.settingsService.LOGS_FOLDER_PATH
      );

      if (logsFolderExists != 'dir') return;

      // errors log
      this.logStats.errorsLogFilePath =
        this.settingsService.LOGS_FOLDER_PATH + 'errors.log';

      let exists = await this.electronService.jetpack.existsAsync(
        this.logStats.errorsLogFilePath
      );
      if (exists) {
        const stats = await this.electronService.jetpack.inspectAsync(
          this.logStats.errorsLogFilePath
        );

        if (stats) {
          this.logStats.errorsLogFileSize = stats.size;
        }

        const locked =
          false; /*await this.electronService.checkLockFilePromisified(
          this.logStats.errorsLogFilePath
        );
        */
        this.logStats.errorsLogFileIsLocked = locked;
      } else {
        this.logStats.errorsLogFileSize = -1;
      }
      // info log

      this.logStats.infoLogFilePath =
        this.settingsService.LOGS_FOLDER_PATH + 'info.log';

      exists = await this.electronService.jetpack.existsAsync(
        this.logStats.infoLogFilePath
      );

      if (exists) {
        const stats = await this.electronService.jetpack.inspectAsync(
          this.logStats.infoLogFilePath
        );
        if (stats) {
          this.logStats.infoLogFileSize = stats.size;
        }

        const locked =
          false; /*await this.electronService.checkLockFilePromisified(
          this.logStats.infoLogFilePath
        );*/
        this.logStats.infoLogFileIsLocked = locked;
      } else {
        this.logStats.infoLogFileSize = -1;
      }

      // warnings log
      this.logStats.warningsLogFilePath =
        this.settingsService.LOGS_FOLDER_PATH + 'warnings.log';

      exists = await this.electronService.jetpack.existsAsync(
        this.logStats.warningsLogFilePath
      );
      if (exists) {
        const stats = await this.electronService.jetpack.inspectAsync(
          this.logStats.warningsLogFilePath
        );

        if (stats) {
          this.logStats.warningsLogFileSize = stats.size;
        }

        const locked =
          false; /*await this.electronService.checkLockFilePromisified(
          this.logStats.warningsLogFilePath
        );
        */
        this.logStats.warningsLogFileIsLocked = locked;
      } else {
        this.logStats.warningsLogFileSize = -1;
      }

      // bash.service log

      this.logStats.bashServiceLogFilePath = Utilities.slash(
        `${this.electronService.PORTABLE_EXECUTABLE_DIR}/logs/bash.service.log`
      );

      exists = await this.electronService.jetpack.existsAsync(
        this.logStats.bashServiceLogFilePath
      );

      if (exists) {
        const bashServiceLogLogContent =
          await this.electronService.jetpack.readAsync(
            this.logStats.bashServiceLogFilePath
          );

        if (bashServiceLogLogContent) {
          const stats = await this.electronService.jetpack.inspectAsync(
            this.logStats.bashServiceLogFilePath
          );
          if (stats) {
            this.logStats.bashServiceLogFileSize = stats.size;
          }

          if (bashServiceLogLogContent.includes('unsupported zip')) {
            this.logStats.updateErrMessage = await this.translate
              .get('AREAS.STATUS-BAR.UPDATE-DOWNLOAD-ERROR')
              .toPromise();
            // console.log(this.logStats.updateErrMessage);
          } else this.logStats.updateErrMessage = '';
        }
        const locked =
          false; /*await this.electronService.checkLockFilePromisified(
          this.logStats.bashServiceLogFilePath
        );
        */
        this.logStats.bashServiceLogFileIsLocked = locked;
      } else {
        this.logStats.updateErrMessage = '';
        this.logStats.bashServiceLogFileSize = -1;
      }
    } catch (error) {
      console.log(`error checkLogsFolder: ${error}`);
    }
  }

  async checkJobsFolder() {
    try {
      const jobsFolderExists = await this.electronService.jetpack.existsAsync(
        this.settingsService.JOBS_FOLDER_PATH
      );

      if (jobsFolderExists != 'dir') return;

      // pause job files
      const pauseJobFiles = await this.electronService.jetpack.findAsync(
        this.settingsService.JOBS_FOLDER_PATH,
        {
          matching: ['*.pause'],
        }
      );

      if (pauseJobFiles && pauseJobFiles.length) {
        if (this.jobStats.pauseJobFileExists != pauseJobFiles.length)
          this.jobStats.pauseJobFileExists = pauseJobFiles.length;
      } else {
        if (this.jobStats.pauseJobFileExists != 0)
          this.jobStats.pauseJobFileExists = 0;
      }

      // cancel job files
      const cancelJobFiles = await this.electronService.jetpack.findAsync(
        this.settingsService.JOBS_FOLDER_PATH,
        {
          matching: ['*.cancel'],
        }
      );

      if (cancelJobFiles && cancelJobFiles.length) {
        if (this.jobStats.cancelJobFileExists != cancelJobFiles.length)
          this.jobStats.cancelJobFileExists = cancelJobFiles.length;
      } else {
        if (this.jobStats.cancelJobFileExists != 0)
          this.jobStats.cancelJobFileExists = 0;
      }

      // job files
      const activeJobs = await this.electronService.jetpack.findAsync(
        this.settingsService.JOBS_FOLDER_PATH,
        {
          matching: ['*.job'],
        }
      );

      if (activeJobs && activeJobs.length > 0) {
        if (this.jobStats.progressValue < 100) {
          this.jobStats.progressValue += 10;
        } else {
          this.jobStats.progressValue = 0;
        }
        this.jobStats.numberOfActiveJobs = activeJobs.length;

        if (this.jobStats.workingOnFileNames.length !== activeJobs.length) {
          this.jobStats.workingOnJobs = [];
          this.jobStats.workingOnFileNames = [];
        }

        const allJobFilesPromises = [];

        for (let jobFilePath of activeJobs) {
          const jobFileExists = await this.electronService.jetpack.existsAsync(
            jobFilePath
          );

          if (jobFileExists != 'file') continue;

          const jobFilePromise = this.loadJobFileAsync(jobFilePath).then(
            (jobDetailsXML) => {
              let fileName = this.electronService.path.basename(
                jobDetailsXML.job.filepath
              );

              if (fileName === 'license.xml') {
                fileName = 'license';
              }
              if (fileName === 'email.groovy') {
                fileName = 'email';
              }

              if (fileName === 'twilio.groovy') {
                fileName = 'twilio';
              }

              if (this.jobStats.workingOnFileNames.indexOf(fileName) < 0) {
                this.jobStats.workingOnFileNames.push(fileName);

                this.jobStats.workingOnJobs.push({
                  jobFilePath: jobFilePath,
                  fileName: fileName,
                });
              }

              return new Promise((resolve, reject) => {
                resolve(jobDetailsXML);
              });
            }
          );
          allJobFilesPromises.push(jobFilePromise);
        }

        Promise.all(allJobFilesPromises).then(() => {
          const newNiceList = this.niceList(
            this.jobStats.workingOnFileNames.sort()
          );

          if (newNiceList !== this.jobStats.niceWorkingOnFileNames) {
            this.jobStats.niceWorkingOnFileNames = newNiceList;
            this.jobStats.numberOfActiveJobs = activeJobs.length;
          }
        });
      } else {
        this.jobStats.workingOnJobs = [];
        this.jobStats.workingOnFileNames = [];

        this.jobStats.niceWorkingOnFileNames = '';

        this.jobStats.progressValue = 0;
        this.jobStats.numberOfActiveJobs = 0;
      }

      // progress job files
      const progressJobFiles = await this.electronService.jetpack.findAsync(
        this.settingsService.JOBS_FOLDER_PATH,
        {
          matching: ['*.progress'],
        }
      );

      if (progressJobFiles && progressJobFiles.length) {
        if (this.jobStats.progressJobFileExists != progressJobFiles.length)
          this.jobStats.progressJobFileExists = progressJobFiles.length;
      } else {
        if (this.jobStats.progressJobFileExists != 0)
          this.jobStats.progressJobFileExists = 0;
      }
    } catch (error) {
      console.log(`error checkJobsFolder: ${error}`);
    }
  }

  async checkResumeJobs() {
    try {
      if (this.jobStats.numberOfActiveJobs > 0) return;

      const jobsFolderExists = await this.electronService.jetpack.existsAsync(
        this.settingsService.JOBS_FOLDER_PATH
      );

      if (jobsFolderExists != 'dir') return;

      // progress job files
      const jobProgressFilePaths = await this.electronService.jetpack.findAsync(
        this.settingsService.JOBS_FOLDER_PATH,
        {
          matching: ['*.progress'],
        }
      );

      if (!jobProgressFilePaths || jobProgressFilePaths.length === 0) {
        if (this.jobStats.jobsToResume && this.jobStats.jobsToResume.length > 0)
          this.jobStats.jobsToResume = [];
      } else {
        if (this.jobStats.jobsToResume.length !== jobProgressFilePaths.length) {
          if (
            this.jobStats.jobsToResume &&
            this.jobStats.jobsToResume.length > 0
          )
            this.jobStats.jobsToResume = [];
        }

        for (let jobFilePath of jobProgressFilePaths) {
          const existingJob = this.jobStats.jobsToResume.filter(
            (job) => job.jobFilePath === jobFilePath
          );

          if (!existingJob || !existingJob.length) {
            const jobProgressDetailsXML = await this.loadJobFileAsync(
              jobFilePath
            );

            this.jobStats.jobsToResume.push({
              jobFilePath: jobFilePath,
              jobDate: jobProgressDetailsXML.jobprogress.currentdate,
              filePath: jobProgressDetailsXML.jobprogress.filepath,
              lastTokenProcessed:
                jobProgressDetailsXML.jobprogress.lasttokenprocessed,
              lastTokenInDocument:
                jobProgressDetailsXML.jobprogress.lasttokenindocument,
              testAll: jobProgressDetailsXML.jobprogress.testall,
              listOfTestTokens:
                jobProgressDetailsXML.jobprogress.listoftesttokens,
              numberOfRandomTestTokens:
                jobProgressDetailsXML.jobprogress.numberofrandomtesttokens,
              tokensCount: jobProgressDetailsXML.jobprogress.tokenscount,
              pagesCount: jobProgressDetailsXML.jobprogress.pagescount,
              numberOfRemainingTokens:
                jobProgressDetailsXML.jobprogress.numberofremainingtokens,
              indexOfLastTokenProcessed:
                jobProgressDetailsXML.jobprogress.indexoflasttokenprocessed,
            });
          }
        }
      }
    } catch (error) {
      console.log(`error checkResumeJobs: ${error}`);
    }
  }

  foundDirtyLogFiles() {
    return (
      this.logStats.infoLogFileSize > 0 ||
      this.logStats.errorsLogFileSize > 0 ||
      this.logStats.warningsLogFileSize > 0
    );
  }

  async loadJobFileAsync(jobFilePath: string): Promise<any> {
    return this.electronService.jetpack
      .readAsync(jobFilePath)
      .then((content) => {
        return Utilities.parseStringPromise(content, {
          trim: true,
          explicitArray: false,
        });
      });
  }

  niceList(arr: string[]) {
    return [arr.slice(0, -1).join(', '), arr.slice(-1)[0]].join(
      arr.length < 2 ? '' : ' and '
    );
  }
}
