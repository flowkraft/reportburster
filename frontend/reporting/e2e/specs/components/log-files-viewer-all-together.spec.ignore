import * as path from 'path';
const slash = require('slash');

import {
  ElectronApplication,
  Page,
  test,
  _electron as electron,
} from '@playwright/test';
import * as jetpack from 'fs-jetpack';

import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import * as PATHS from '../../utils/paths';
import { Helpers } from '../../utils/helpers';
import * as fsExtra from 'fs-extra';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';

test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly, at runtime when already started, pick-up and display log files which contain data',
    async function ({ beforeAfterEach: firstPage }) {
      const shouldRestartApp = false;
      return _shouldCorrectlyDisplayLogFiles(shouldRestartApp, firstPage);
    }
  );

  electronBeforeAfterAllTest(
    'should correctly display the log viewers in the initial "Empty" state',
    async function ({ beforeAfterEach: firstPage }) {
      const ft = new FluentTester(firstPage);

      await ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#logsTab-link')
        .elementShouldBeVisible('dburst-log-files-viewer-all-together #infoLog')
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #errorsLog'
        )
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #warningsLog'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        );
    }
  );

  electronBeforeAfterAllTest(
    'should correctly, when (re)starting, pick-up and display log files which contain data',
    async function ({
      beforeAfterAll: electronApp,
      beforeAfterEach: firstPage,
    }) {
      const shouldRestartApp = true;
      return _shouldCorrectlyDisplayLogFiles(shouldRestartApp, firstPage);
    }
  );

  electronBeforeAfterAllTest(
    'should correctly, at runtime when app runs, handle deleted log files and when log files reappear should work fine',
    async function ({ beforeAfterEach: firstPage }) {
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-123data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/errors.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-1234data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/warnings.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/info-with-12data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/info.log'
          )
        )
      );

      const ft = new FluentTester(firstPage);
      await ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnErrors')
        .appStatusShouldShowErrors()
        .click('#logsTab-link')
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '4321'
        );

      await jetpack.dirAsync(
        path.resolve(
          slash(process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH)
        ),
        { empty: true }
      );

      await ft
        .waitOnElementToBecomeInvisible('#btnErrors')
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-123data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/errors.log'
          )
        )
      );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-123456789data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/warnings.log'
          )
        )
      );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/info-with-12data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/info.log'
          )
        )
      );

      await ft
        .waitOnElementToBecomeVisible('#btnErrors')
        .appStatusShouldShowErrors()
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '987654321'
        );
    }
  );

  electronBeforeAfterAllTest(
    'should handle correctly pressing the Clear Info button',
    async function ({ beforeAfterEach: firstPage }) {
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/info-with-12data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/info.log'
          )
        )
      );

      const ft = new FluentTester(firstPage);

      await ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#logsTab-link')
        .elementShouldBeVisible('dburst-log-files-viewer-all-together #infoLog')
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #errorsLog'
        )
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #warningsLog'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        )
        .click('#btnClearLogFiles')
        .click('#btnClearInfoLog')
        .clickYesDoThis()
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        )
        .appStatusShouldBeGreatNoErrorsNoWarnings();
    }
  );

  electronBeforeAfterAllTest(
    'should correctly, at runtime when already started, handle log files which are constantly updated',
    async function ({ beforeAfterEach: firstPage }) {
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-123data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/errors.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-1234data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/warnings.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/info-with-12data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/info.log'
          )
        )
      );

      const ft = new FluentTester(firstPage);
      await ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnErrors')
        .appStatusShouldShowErrors()
        .click('#logsTab-link')
        .elementShouldBeVisible('dburst-log-files-viewer-all-together #infoLog')
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #errorsLog'
        )
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #warningsLog'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '4321'
        );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-123456789data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/warnings.log'
          )
        ),
        {
          overwrite: true,
        }
      );

      await ft
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnErrors')
        .appStatusShouldShowErrors()
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '987654321'
        );
    }
  );

  electronBeforeAfterAllTest(
    'should handle correctly pressing the Clear Warnings button',
    async function ({ beforeAfterEach: firstPage }) {
      await fsExtra.emptyDir(
        path.resolve(
          slash(process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH)
        )
      );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-1234data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/warnings.log'
          )
        ),
        {
          overwrite: true,
        }
      );

      const ft = new FluentTester(firstPage);

      return ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnWarnings')
        .appStatusShouldShowWarnings()
        .click('#logsTab-link')
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '4321'
        )
        .click('#btnClearLogFiles')
        .click('#btnClearWarningsLog')
        .clickYesDoThis()
        .waitOnElementToBecomeInvisible('#btnWarnings')
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        );
    }
  );

  electronBeforeAfterAllTest(
    'should handle correctly pressing the Clear Errors button',
    async function ({ beforeAfterEach: firstPage }) {
      await jetpack.dirAsync(
        path.resolve(
          slash(process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH)
        ),
        { empty: true }
      );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-123data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/errors.log'
          )
        )
      );

      const ft = new FluentTester(firstPage);

      return ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnErrors')
        .appStatusShouldShowErrors()
        .click('#logsTab-link')
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .click('#btnClearLogFiles')
        .click('#btnClearErrorsLog')
        .clickYesDoThis()
        .waitOnElementToBecomeInvisible('#btnErrors')
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        );
    }
  );

  electronBeforeAfterAllTest(
    'should handle correctly pressing the Clear Quarantined Files button',
    async function ({ beforeAfterEach: firstPage }) {
      await jetpack.dirAsync(
        path.resolve(
          slash(process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH)
        ),
        { empty: true }
      );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/quarantine',
        path.resolve(
          slash(process.env.PORTABLE_EXECUTABLE_DIR + PATHS.QUARANTINE_PATH)
        ),
        {
          overwrite: true,
        }
      );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-123data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/errors.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-1234data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/warnings.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/info-with-12data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/info.log'
          )
        )
      );

      const ft = new FluentTester(firstPage);
      await ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnErrors')
        .appStatusShouldShowErrors()
        .click('#logsTab-link')
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '4321'
        )
        .processingShouldHaveGeneratedQuarantineFiles([
          'alfreda.waldback@northridgehealth.org.pdf',
          'clyde.grew@northridgehealth.org.pdf',
          'kyle.butford@northridgehealth.org.pdf',
        ])
        .click('#btnClearLogFiles')
        .click('#btnClearQuarantinedFiles')
        .clickYesDoThis()
        .appStatusShouldShowErrors()
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .elementShouldHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '4321'
        )
        .processingShouldHaveGeneratedQuarantineFiles([]);
    }
  );

  electronBeforeAfterAllTest(
    'should handle correctly pressing the Clear All Quarantined and Log Files button',
    async function ({ beforeAfterEach: firstPage }) {
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/quarantine',
        path.resolve(
          slash(process.env.PORTABLE_EXECUTABLE_DIR + PATHS.QUARANTINE_PATH)
        ),
        {
          overwrite: true,
        }
      );

      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-123data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/errors.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-1234data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR +
              PATHS.LOGS_PATH +
              '/warnings.log'
          )
        )
      );
      await jetpack.copyAsync(
        PATHS.E2E_RESOURCES_PATH + '/logs/info-with-12data.log',
        path.resolve(
          slash(
            process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/info.log'
          )
        )
      );

      const ft = new FluentTester(firstPage);

      await ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .waitOnElementToBecomeVisible('#btnErrors')
        .appStatusShouldShowErrors()
        .click('#logsTab-link')
        .elementShouldBeVisible('dburst-log-files-viewer-all-together #infoLog')
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #errorsLog'
        )
        .elementShouldBeVisible(
          'dburst-log-files-viewer-all-together #warningsLog'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          '21'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          '321'
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          '4321'
        )
        .processingShouldHaveGeneratedQuarantineFiles([
          'alfreda.waldback@northridgehealth.org.pdf',
          'clyde.grew@northridgehealth.org.pdf',
          'kyle.butford@northridgehealth.org.pdf',
        ])
        .click('#btnClearLogFiles')
        .click('#btnClearAllLogQuarantinedFiles')
        .clickYesDoThis()
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToHaveText(
          'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
          ''
        )
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedQuarantineFiles([]);
    }
  );

  /*  
  
 */
});

async function _shouldCorrectlyDisplayLogFiles(
  shouldRestartApp: boolean,
  firstPage: Page
) {
  let fPage = firstPage;
  await jetpack.copyAsync(
    PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-123data.log',
    path.resolve(
      slash(
        process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/errors.log'
      )
    )
  );
  await jetpack.copyAsync(
    PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-1234data.log',
    path.resolve(
      slash(
        process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/warnings.log'
      )
    )
  );
  await jetpack.copyAsync(
    PATHS.E2E_RESOURCES_PATH + '/logs/info-with-12data.log',
    path.resolve(
      slash(process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH + '/info.log')
    )
  );

  let electronApp: ElectronApplication;

  if (shouldRestartApp) {
    electronApp = await Helpers.electronAppLaunch('../..');
    await electronApp.context().tracing.start({
      screenshots: true,
      snapshots: true,
    });
    fPage = await electronApp.firstWindow();
    await fPage.waitForLoadState('domcontentloaded');
  }

  const ft = new FluentTester(fPage);
  await ft
    .goToBurstScreen()
    .appShouldBeReadyToRunNewJobs()
    .waitOnElementToBecomeVisible('#btnErrors')
    .appStatusShouldShowErrors()
    .click('#logsTab-link')
    .elementShouldBeVisible('dburst-log-files-viewer-all-together #infoLog')
    .elementShouldBeVisible('dburst-log-files-viewer-all-together #errorsLog')
    .elementShouldBeVisible('dburst-log-files-viewer-all-together #warningsLog')
    .waitOnElementToHaveText(
      'dburst-log-files-viewer-all-together #infoLog dburst-log-file-viewer div',
      '21'
    )
    .waitOnElementToHaveText(
      'dburst-log-files-viewer-all-together #errorsLog dburst-log-file-viewer div',
      '321'
    )
    .waitOnElementToHaveText(
      'dburst-log-files-viewer-all-together #warningsLog dburst-log-file-viewer div',
      '4321'
    );

  if (electronApp) {
    await Helpers.electronAppClose(electronApp);
  }
}
