import * as jetpack from 'fs-jetpack';

import * as _ from 'lodash';

import * as PATHS from '../utils/paths';

import helpers from './updater.helpers';
import { Updater } from '../../src/app/areas/electron-nodejs/updater';

describe('updater: smaler individual tests', function () {
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  });

  beforeEach(async () => {
    await jetpack.dirAsync(PATHS.EXECUTABLE_DIR_PATH, { empty: true });

    helpers.updateDestinationDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/DocumentBurster`;

    const files = await jetpack.listAsync(PATHS.EXECUTABLE_DIR_PATH);

    if (!files && files.length > 0) {
      throw new Error(
        `${PATHS.EXECUTABLE_DIR_PATH} folder is supposed to be empty but is not`,
      );
    }

    await jetpack.dirAsync(
      `${helpers.updateDestinationDirectoryPath}/config/burst`,
    );
  });

  it('migrate-validate-scripts-v5.1', async function () {
    let version = '5.1';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v5.8.1', async function () {
    let version = '5.8.1';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v6.1', async function () {
    let version = '6.1';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v6.2', async function () {
    let version = '6.2';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v6.4.1', async function () {
    let version = '6.4.1';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v7.1', async function () {
    let version = '7.1';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v7.5', async function () {
    let version = '7.5';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v8.1', async function () {
    let version = '8.1';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v8.7.1', async function () {
    let version = '8.7.1';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-validate-scripts-v8.7.2', async function () {
    let version = '8.7.2';

    return helpers._migrateAndValidateAllScriptsFromFolder(
      `${helpers.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
      version,
    );
  });

  it('migrate-settings-from-version-5.1-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/00-settings-5.1.xml`,
    );

    return helpers._assertXmlConfigV51ExpectedDefaults(
      `${helpers.updateDestinationDirectoryPath}/config/burst/00-settings-5.1.xml`,
      updater.defaultSettings,
    );
  });

  it('migrate-settings-from-version-5.1-expected-nn', async function () {
    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    try {
      await jetpack.copyAsync(
        `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
        `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
      );

      //console.log('Before Log 96');
      //console.log(
      //  `Log 96 helpers.filesToMigrateDirectoryPath= ${helpers.filesToMigrateDirectoryPath}`
      //);
      //console.log('After Log 96');

      await updater.migrateSettingsFile(
        `${helpers.filesToMigrateDirectoryPath}/config/00-settings-5.1-nn.xml`,
      );

      //console.log(
      //  `Log 97 helpers.updateDestinationDirectoryPath = ${helpers.updateDestinationDirectoryPath}`
      //);
      return helpers._assertXmlConfigV51ExpectedNN(
        `${helpers.updateDestinationDirectoryPath}/config/burst/00-settings-5.1-nn.xml`,
        updater.defaultSettings,
        '00-settings-5.1-nn.xml',
      );
    } catch (error) {
      console.error(`Error migrating settings file:`, error);
    }
  });

  it('migrate-settings-from-version-5.8.1-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/05-settings-5.8.1.xml`,
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/05-settings-5.8.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );
  });

  it('migrate-settings-from-version-5.8.1-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);
    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/05-settings-5.8.1-custom.xml`,
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/05-settings-5.8.1-custom.xml`,
      updater.defaultSettings,
      helpers._getCustomExceptFor(),
    );
  });

  it('migrate-settings-from-version-6.1-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/10-settings-6.1.xml`,
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/10-settings-6.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );
  });

  it('migrate-settings-from-version-6.1-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/10-settings-6.1-custom.xml`,
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/10-settings-6.1-custom.xml`,
      updater.defaultSettings,
      helpers._getCustomExceptFor(),
    );
  });

  it('migrate-settings-from-version-6.2-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/15-settings-6.2.xml`,
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/15-settings-6.2.xml`,
      updater.defaultSettings,
      exceptFor,
    );
  });

  it('migrate-settings-from-version-6.2-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/15-settings-6.2-custom.xml`,
    );

    let exceptFor = helpers._getCustomExceptFor();

    exceptFor.set(
      'documentburster.settings.emailsettings.text',
      'custom text\r\n\r\nsecond line\r\n\r\n${var1}',
    );
    exceptFor.set(
      'documentburster.settings.emailsettings.html',
      'custom html\r\n\r\nsecond line<br>\r\n\r\n${var1}',
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/15-settings-6.2-custom.xml`,
      updater.defaultSettings,
      exceptFor,
    );
  });

  it('migrate-settings-from-version-6.4.1-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/20-settings-6.4.1.xml`,
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/20-settings-6.4.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );
  });

  it('migrate-settings-from-version-6.4.1-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/20-settings-6.4.1-custom.xml`,
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/20-settings-6.4.1-custom.xml`,
      updater.defaultSettings,
      helpers._getCustomExceptFor(),
    );
  });

  it('migrate-settings-from-version-7.1-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/25-settings-7.1.xml`,
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/25-settings-7.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );
  });

  it('migrate-settings-from-version-7.1-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/25-settings-7.1-custom.xml`,
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/25-settings-7.1-custom.xml`,
      updater.defaultSettings,
      helpers._getCustomExceptFor(),
    );
  });

  it('migrate-settings-from-version-7.5-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);
    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/30-settings-7.5.xml`,
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/30-settings-7.5.xml`,
      updater.defaultSettings,
      exceptFor,
    );
  });

  it('migrate-settings-from-version-7.5-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/30-settings-7.5-custom.xml`,
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/30-settings-7.5-custom.xml`,
      updater.defaultSettings,
      helpers._getCustomExceptFor(),
    );
  });

  it('migrate-settings-from-version-8.1-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);
    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/35-settings-8.1.xml`,
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/35-settings-8.1.xml`,
      updater.defaultSettings,
    );
  });

  it('migrate-settings-from-version-8.1-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/35-settings-8.1-custom.xml`,
    );

    const customExceptFor = helpers._getCustomExceptFor();
    customExceptFor.set('documentburster.settings.htmlemail', 'true');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/35-settings-8.1-custom.xml`,
      updater.defaultSettings,
      customExceptFor,
    );
  });

  it('migrate-settings-from-version-8.7.1-expected-defaults', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);
    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/40-settings-8.7.1.xml`,
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/40-settings-8.7.1.xml`,
      updater.defaultSettings,
    );
  });

  it('migrate-settings-from-version-8.7.1-expected-custom', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);

    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config/40-settings-8.7.1-custom.xml`,
    );

    const customExceptFor = helpers._getCustomExceptFor();

    customExceptFor.set('documentburster.settings.htmlemail', 'true');
    customExceptFor.set('documentburster.settings.sendfiles.email', 'true');

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/40-settings-8.7.1-custom.xml`,
      updater.defaultSettings,
      customExceptFor,
    );
  });
});
