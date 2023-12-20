import * as jetpack from 'fs-jetpack';
import { promises as fs } from 'fs';

import helpers from './updater.helpers';

import * as PATHS from '../utils/paths';

import { Updater } from '../../src/app/areas/install-setup-upgrade/updater';

describe("updater: 'update' from v8.4 (LEIDOS)", function () {
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

  it('migrate-99-coi-cert-email3-test-leidos-8.4', async function () {
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${helpers.updateDestinationDirectoryPath}/config/_defaults/settings.xml`
    );

    let updater = new Updater(
      helpers.updateDestinationDirectoryPath,
      jetpack,
      fs
    );
    await updater.migrateSettingsFile(
      `${helpers.filesToMigrateDirectoryPath}/config-leidos/99-coi-cert-email3.xml`
    );

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.template', '99-coi-cert-email3');

    exceptFor.set('documentburster.settings.numberofuservariables', '100');

    exceptFor.set('documentburster.settings.sendfiles.email', 'true');

    exceptFor.set('documentburster.settings.emailserver.host', '');
    exceptFor.set('documentburster.settings.emailserver.userid', '');
    exceptFor.set('documentburster.settings.emailserver.userpassword', '');
    exceptFor.set(
      'documentburster.settings.emailserver.fromaddress',
      'Leidos-Ethics-and-Compliance@leidos.com'
    );

    exceptFor.set(
      'documentburster.settings.emailserver.name',
      'Leidos Ethics and Compliance'
    );

    exceptFor.set('documentburster.settings.htmlemaileditcode', 'true');

    exceptFor.set('documentburster.settings.emailsettings.to', '${var0}');
    exceptFor.set('documentburster.settings.emailsettings.cc', '${var1}');

    exceptFor.set(
      'documentburster.settings.emailsettings.subject',
      'Requirement Outstanding: Conflicts of Interest Certification Status Report'
    );

    exceptFor.set(
      'documentburster.settings.emailsettings.html',
      '<img src="images/bla.jpg">'
    );

    /*
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
    */
    await helpers._expectEqualConfigurationValuesExceptFor(
      `${helpers.updateDestinationDirectoryPath}/config/burst/99-coi-cert-email3.xml`,
      updater.defaultSettings,
      exceptFor
    );
  });
});
