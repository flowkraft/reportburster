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
    env: {
      SHOULD_SEND_STATS: true,
      PORTABLE_EXECUTABLE_DIR: '',
      CONFIGURATION_FOLDER_PATH: '',
      LOGS_FOLDER_PATH: '',
      JOBS_FOLDER_PATH: '',
      QUARANTINED_FOLDER_PATH: '',
      UPDATE_JAR_FILE_PATH: '',
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

  setup = {
    isRestartRequired: false,
    chocolatey: {
      isChocoOk: false,
      version: 'v0.10.15',
    },
    java: {
      isJavaOk: false,
      version: '1.8.271',
      javaHomeFolderExists: false,
      pathIncludesJavaHomeBin: false,
      javaExeExists: false,
      JAVA_HOME: 'C:/Program Files/OpenJDK/jdk-14.0.2',
      JAVA_HOME_REGISTRY: 'C:/Program Files/OpenJDK/jdk-14.0.2',
    },
    env: {
      PATH: 'C:/Python39/Scripts/;C:/Python39/;C:/Windows/system32;C:/Windows;C:/Windows/System32/Wbem;C:/Windows/System32/WindowsPowerShell/v1.0/;C:/Windows/System32/OpenSSH/;C:/Program Files (x86)/NVIDIA Corporation/PhysX/Common;C:/Program Files/NVIDIA Corporation/NVIDIA NvDLISR;C:/Programs/Node.js12/;C:/Projects/documentburster/src/tools;C:/Programs/WinMerge;C:/Program Files/Git/cmd;C:/Program Files/Git/mingw64C:/Program Files/Git/usr;C:/ProgramData/chocolatey/bin;%M2_HOME%/bin;%JRE_HOME%/bin;C:/Go/bin;C:/Program Files (x86)/Yarn/bin/;C:/tools/php74;C:/ProgramData/ComposerSetup/bin;C:/Users/Virgil/AppData/Roaming/npm;C:/Program Files/OpenJDK/jdk-14.0.2/bin;',
      PATH_REGISTRY:
        'C:/Python39/Scripts/;C:/Python39/;C:/Windows/system32;C:/Windows;C:/Windows/System32/Wbem;C:/Windows/System32/WindowsPowerShell/v1.0/;C:/Windows/System32/OpenSSH/;C:/Program Files (x86)/NVIDIA Corporation/PhysX/Common;C:/Program Files/NVIDIA Corporation/NVIDIA NvDLISR;C:/Programs/Node.js12/;C:/Projects/documentburster/src/tools;C:/Programs/WinMerge;C:/Program Files/Git/cmd;C:/Program Files/Git/mingw64C:/Program Files/Git/usr;C:/ProgramData/chocolatey/bin;%M2_HOME%/bin;%JRE_HOME%/bin;C:/Go/bin;C:/Program Files (x86)/Yarn/bin/;C:/tools/php74;C:/ProgramData/ComposerSetup/bin;C:/Users/Virgil/AppData/Roaming/npm;C:/Program Files/OpenJDK/jdk-14.0.2/bin;',
    },
    update: {
      succint: true,
      letMeUpdateManually: false,
      letMeUpdateSourceDirectoryPath: '',
      homeDirectoryPath: '',
      info: {
        errorMsg: '',
        updateSourceDirectoryPath: '',
        updateSourceVersion: '',
        migrateConfigFiles: [['', '']],
        migrateScriptFiles: [['', '']],
        templatesFolders: [['', '']],
      },
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
