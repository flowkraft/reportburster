import { Injectable } from '@angular/core';
import { Changelog, Release } from 'keep-a-changelog';
import { ConfigInfo } from '../models/config-info.model';
import { SystemInfo } from '../models/system-info.model';
import { BlogPostInfo } from '../models/blog-post-info.model';

@Injectable({
  providedIn: 'root',
})
export class StateStoreService {
  //Configuration
  configSys = {
    currentConfigFile: ConfigInfo,
    allConfigFiles: [ConfigInfo],
    sysInfo: SystemInfo,
    info: {
      SHOULD_SEND_STATS: true,
      PORTABLE_EXECUTABLE_DIR: '',
      CONFIGURATION_FOLDER_PATH: '',
      LOGS_FOLDER_PATH: '',
      JOBS_FOLDER_PATH: '',
      QUARANTINED_FOLDER_PATH: '',
      UPDATE_JAR_FILE_PATH: '',
      FRONTEND: 'electron',
      isServerVersion: false,
      product: 'DocumentBurster',
      version: '9.1',
    },
  };

  //Execution Stats
  exec = {
    logStats: {
      infoLogFilePath: '',
      errorsLogFilePath: '',
      warningsLogFilePath: '',
      bashServiceLogFilePath: '',
      updateErrMessage: '',
      infoLogFileIsLocked: false,
      errorsLogFileIsLocked: false,
      warningsLogFileIsLocked: false,
      bashServiceLogFileIsLocked: false,
      infoLogFileSize: -1,
      errorsLogFileSize: -1,
      warningsLogFileSize: -1,
      bashServiceLogFileSize: -1,
    },
    jobStats: {
      progressValue: 0,
      numberOfActiveJobs: 0,
      progressJobFileExists: 0,
      pauseJobFileExists: 0,
      cancelJobFileExists: 0,
      workingOnJobs: [
        {
          fileName: '',
          jobFilePath: '',
        },
      ],
      workingOnFileNames: [],
      niceWorkingOnFileNames: '',
      jobsToResume: [],
    },
  };

  areas = {
    processing: {
      tabs: {
        burst: {
          filePath: '',
        },
      },
    },
  };

  license = {
    key: '',
    status: '',
    customerName: '',
  };

  product = {
    name: 'DocumentBurster',
    version: '8.8.1',
    latestVersion: '',
    changeLog:
      '# DocumentBurster<br><br>All notable changes to this project will be documented in this file.',
    isNewerVersionAvailable: false,
  };

  modals = {
    htmlCodeToPreview: '',
    modalSMSInfo: {
      isModalSMSVisible: false,
      fromNumber: '',
      toNumber: '',
    },
  };

  terminal = {
    readOnly: true,
    availableCommandsVisible: false,
  };

  whatsNew = {
    blogPosts: [BlogPostInfo],
    visibleBlogPost: BlogPostInfo,
    visibleBlogPostIndex: -1,
    changeLogMarkdown: '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    changeLog: Changelog,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    visibleRelease: Release,
    visibleReleaseIndex: -1,
    visibleReleaseDate: '',
    visibleReleaseBlogPostAnnouncement: [BlogPostInfo],
  };

  clearCurrentConfiguration = () => {
    this.configSys.currentConfigFile.fileName = '';
    this.configSys.currentConfigFile.filePath = '';
    this.configSys.currentConfigFile.configuration.settings.template = '';
  };
}
