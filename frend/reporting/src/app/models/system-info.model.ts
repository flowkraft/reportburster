export const SystemInfo = {
  operatingSystem: 'Windows',
  setup: {
    BACKEND_URL: '/api',
    isRestartRequired: false,
    chocolatey: {
      isChocoOk: true,
      version: '',
    },
    java: {
      isJavaOk: true,
      version: '',
    },
    docker: {
      //isDockerOk: false,
      isDockerOk: true,
      isDockerInstalled: true,
      isDockerDaemonRunning: true,
      version: '',
    },
    portal: {
      isProvisioned: true,
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
