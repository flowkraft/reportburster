const slash = require('slash');

import { test } from '@playwright/test';
import _ from 'lodash';

import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Helpers } from '../../utils/helpers';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly not display any log when there is no log file to show',
    async function ({ beforeAfterEach: firstPage }) {
      const ft = new FluentTester(firstPage);

      await ft
        .gotoBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .elementShouldNotBeVisible(
          'dburst-log-files-viewer-separate-tabs #infoLog',
        )
        .elementShouldNotBeVisible(
          'dburst-log-files-viewer-separate-tabs #errorsLog',
        )
        .elementShouldNotBeVisible(
          'dburst-log-files-viewer-separate-tabs #warningsLog',
        );
    },
  );

  electronBeforeAfterAllTest(
    'should correctly display the correct log viewers depending on which log files are found',
    async function ({ beforeAfterEach: firstPage }) {
      const randomLogFiles = await Helpers.generateRandomLogFiles();
      randomLogFiles.sort();

      const ft = new FluentTester(firstPage);

      await ft.gotoBurstScreen().appShouldBeReadyToRunNewJobs();

      if (randomLogFiles.includes('info.log')) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #infoLog',
          );
      }

      if (randomLogFiles.includes('errors.log')) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #errorsLog',
          )
          .appStatusShouldShowErrors();
      }

      if (randomLogFiles.includes('warnings.log')) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #warningsLog',
          );

        if (!randomLogFiles.includes('errors.log'))
          await ft.appStatusShouldShowWarnings();
        else await ft.appStatusShouldShowErrors();
      }

      if (!randomLogFiles.includes('info.log')) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .elementShouldNotBeVisible(
            'dburst-log-files-viewer-separate-tabs #infoLog',
          );
      }

      if (!randomLogFiles.includes('errors.log')) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .elementShouldNotBeVisible(
            'dburst-log-files-viewer-separate-tabs #errorsLog',
          );

        if (!randomLogFiles.includes('warnings.log'))
          await ft.appStatusShouldBeGreatNoErrorsNoWarnings();
        else await ft.appStatusShouldShowWarnings();
      }

      if (!randomLogFiles.includes('warnings.log')) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .elementShouldNotBeVisible(
            'dburst-log-files-viewer-separate-tabs #warningsLog',
          );

        if (!randomLogFiles.includes('errors.log'))
          await ft.appStatusShouldBeGreatNoErrorsNoWarnings();
        else await ft.appStatusShouldShowErrors();
      }
    },
  );
});
