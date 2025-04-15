import * as jetpack from 'fs-jetpack';

import * as PATHS from '../utils/paths';

import helpers from './updater.helpers';

describe('updater: now-db-server tests', function () {
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  });

  beforeEach(async () => {
    helpers.updateDestinationDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/ReportBurster`;

    await jetpack.dirAsync(PATHS.EXECUTABLE_DIR_PATH, { empty: true });
  });

  it('update-now-db-server-and-assert-everything-worked-well', async function () {
    const baselineVersionFilePath = `${PATHS.E2E_RESOURCES_PATH}/upgrade/_baseline/db-server-baseline-8.7.2.zip`;
    const newVersionFilePath = `${PATHS.E2E_RESOURCES_PATH}/upgrade/_new/rb-server-new-version-9.9.9.zip`;

    return helpers._updateNowAndAssertEverythingWorkedWell(
      baselineVersionFilePath,
      newVersionFilePath
    );
  });
});
