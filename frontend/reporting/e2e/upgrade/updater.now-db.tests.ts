import * as jetpack from 'fs-jetpack';

import * as PATHS from '../utils/paths';

import helpers from './updater.helpers';

describe('updater: now-db tests', function () {
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  });

  beforeEach(async () => {
    helpers.updateDestinationDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/DocumentBurster`;

    await jetpack.dirAsync(PATHS.EXECUTABLE_DIR_PATH, { empty: true });
  });

  it('update-now-db-and-assert-everything-worked-well', async function () {
    const baselineVersionFilePath = `${PATHS.E2E_RESOURCES_PATH}/upgrade/_baseline/db-baseline-8.7.2.zip`;
    const newVersionFilePath = `${PATHS.E2E_RESOURCES_PATH}/upgrade/_new/db-new-version-9.9.9.zip`;

    return helpers._updateNowAndAssertEverythingWorkedWell(
      baselineVersionFilePath,
      newVersionFilePath
    );
  });
});
