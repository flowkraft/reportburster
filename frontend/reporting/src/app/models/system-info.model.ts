export const SystemInfo = {
  operatingSystem: 'Windows',
  setup: {
    BACKEND_URL: '',
    isRestartRequired: false,
    chocolatey: {
      isChocoOk: false,
      version: '',
    },
    java: {
      isJavaOk: false,
      version: '',
    },
    env: {
      PATH: '',
      JAVA_HOME: '',
      JRE_HOME: '',
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
  },
};
