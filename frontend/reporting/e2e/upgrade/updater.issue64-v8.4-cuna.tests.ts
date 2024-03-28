import * as jetpack from 'fs-jetpack';

import helpers from './updater.helpers';

import * as PATHS from '../utils/paths';

import { Updater } from '../../src/app/areas/install-setup-upgrade/updater';

/*

https://github.com/sourcekraft/documentburster/issues/64
Problems with the "auto-update" from v8.4

  1. Manual update takes 10 minutes even if the 48 xml files seem to be copied very fast (what is doing after?)

  2. After the 10 minutes, once the 48 files are updated, it takes 1 minute to load the list of templates in DocumentBurster -> Configuration menu

  3. $now;format="yyyy.MM.dd_HH.mm.ss.SSS"$ is not updated (I had to manually replace it with ${now?string["yyyy.MM.dd_HH.mm.ss.SSS"]})

  4. $now;format="yyyy.MM.dd"$ is not updated (I had to manually replace it with ${now?string["yyyy.MM.dd"]})

  5. _stats-$num_pages$pages-$num_files_extracted$extracted-$num_files_distributed$distributed.log is not updated (I had to manually replace it with _stats-${stats_info}.log)
*/

describe("updater: issue64 - Problems with the 'auto-update' from v8.4 (CUNA)", function () {
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  });

  beforeEach(async () => {
    helpers.updateDestinationDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/DocumentBurster`;

    await jetpack.dirAsync(PATHS.EXECUTABLE_DIR_PATH, { empty: true });

    return jetpack.dirAsync(
      `${helpers.updateDestinationDirectoryPath}/config/burst`
    );
  });

  it('migrate-settings-37-advertisement-test-cuna-8.4', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`
    );

    let updater = new Updater(helpers.updateDestinationDirectoryPath);
    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config-cuna/37-advertisement-test-cuna-8.4.xml`
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.template', 'Advertisement Test');

    exceptFor.set(
      'documentburster.settings.outputfolder',
      'output/${input_document_name}/${now?string["yyyy.MM.dd"]}'
    );

    exceptFor.set('documentburster.settings.sendfiles.email', 'true');
    exceptFor.set(
      'documentburster.settings.emailserver.host',
      'smtp.office365.com'
    );

    exceptFor.set('documentburster.settings.emailserver.port', '587');
    exceptFor.set(
      'documentburster.settings.emailserver.userid',
      'noreply@corp.company.com'
    );

    exceptFor.set(
      'documentburster.settings.emailserver.userpassword',
      '********'
    );

    exceptFor.set('documentburster.settings.emailserver.usetls', 'true');

    exceptFor.set(
      'documentburster.settings.emailserver.fromaddress',
      'MARKETING@company.com'
    );

    exceptFor.set('documentburster.settings.emailserver.name', 'Marketing');

    exceptFor.set('documentburster.settings.htmlemaileditcode', 'true');

    exceptFor.set(
      'documentburster.settings.emailsettings.to',
      'kevans@company.com'
    );

    exceptFor.set(
      'documentburster.settings.emailsettings.bcc',
      'kevans@company.com'
    );

    exceptFor.set(
      'documentburster.settings.emailsettings.subject',
      'Test The Family Indemnity Plan - CUNA Caribbean Insurance'
    );

    exceptFor.set(
      'documentburster.settings.emailsettings.html',
      '<img src="images/FIP_Flyer.jpg">'
    );

    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/37-advertisement-test-cuna-8.4.xml`,
      updater.defaultSettings,
      exceptFor
    );
  });
});
