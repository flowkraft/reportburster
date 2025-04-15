export const APP_CONFIG = {
  production: false,
  environment: 'WEB',
  folders: {
    config: 'config',
    logs: 'logs',
    quarantine: 'quarantine',
    temp: 'temp',
    PORTABLE_EXECUTABLE_DIR: './testground/e2e',
  },
  backend: {
    base_url: 'http://localhost',
    port: '9090',
  },
  SHOULD_SEND_STATS: false,
};
