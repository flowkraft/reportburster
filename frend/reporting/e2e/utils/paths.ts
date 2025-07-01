const path = require('path');

import { APP_CONFIG } from '../../src/environments/environment';

export const CONFIG_PATH = APP_CONFIG.folders.config;
export const LOGS_PATH = APP_CONFIG.folders.logs;
export const TEMP_PATH = APP_CONFIG.folders.temp;
export const QUARANTINE_PATH = APP_CONFIG.folders.quarantine;

export const E2E_RESOURCES_PATH = 'e2e/_resources';
export const E2E_SAMPLE_PAYSLIPS_PATH =
  E2E_RESOURCES_PATH + '/samples/burst/Payslips.pdf';

export const BKEND_REPORTING_FOLDER_PATH = '../../bkend/reporting';

export const E2E_ASSEMBLY_EXTERNAL_RESOURCES_FOLDER_PATH =
  '../../asbl/src/main/external-resources';

export const E2E_ASSEMBLY_FOLDER_PATH =
  '../../asbl/target/package/verified-db-noexe';

export const SETTINGS_CONFIG_FILE = 'settings\\.xml';

export const EML_CONTACT_FILE = 'eml-contact\\.xml';

export const TEST_CONFIG_FILE = 'test\\.xml';

export const EXECUTABLE_DIR_PATH = path.resolve(
  process.env.PORTABLE_EXECUTABLE_DIR,
);
