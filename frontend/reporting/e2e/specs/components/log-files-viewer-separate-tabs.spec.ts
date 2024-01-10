const slash = require('slash');

import { test } from '@playwright/test';
import _ from 'lodash';

import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Helpers } from '../../utils/helpers';
import { FluentTester } from '../../helpers/fluent-tester';

test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly not display any log when there is no log file to show',
    async function ({ beforeAfterEach: firstPage }) {
      const ft = new FluentTester(firstPage);

      await ft
        .goToBurstScreen()
        .appShouldBeReadyToRunNewJobs()
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .elementShouldNotBeVisible(
          'dburst-log-files-viewer-separate-tabs #infoLog'
        )
        .elementShouldNotBeVisible(
          'dburst-log-files-viewer-separate-tabs #errorsLog'
        )
        .elementShouldNotBeVisible(
          'dburst-log-files-viewer-separate-tabs #warningsLog'
        );
    }
  );

  electronBeforeAfterAllTest(
    'should correctly display the correct log viewers depending on which log files are found',
    async function ({ beforeAfterEach: firstPage }) {
      const randomLogFiles = await Helpers.generateRandomLogFiles();
      randomLogFiles.sort();

      const ft = new FluentTester(firstPage);

      await ft.goToBurstScreen().appShouldBeReadyToRunNewJobs();

      if (_.isEqual(randomLogFiles, ['info.log'])) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #infoLog'
          )
          .appStatusShouldBeGreatNoErrorsNoWarnings();
      } else if (_.isEqual(randomLogFiles, ['errors.log'])) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #errorsLog'
          )
          .appStatusShouldShowErrors();
      } else if (_.isEqual(randomLogFiles, ['warnings.log'])) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #warningsLog'
          )
          .appStatusShouldShowWarnings();
      } else if (_.isEqual(randomLogFiles, ['info.log', 'errors.log'].sort())) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #infoLog'
          )
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #errorsLog'
          )
          .appStatusShouldShowErrors();
      } else if (
        _.isEqual(randomLogFiles, ['info.log', 'warnings.log'].sort())
      ) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #infoLog'
          )
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #warningsLog'
          )
          .appStatusShouldShowWarnings();
      } else if (
        _.isEqual(randomLogFiles, ['errors.log', 'warnings.log'].sort())
      ) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #errorsLog'
          )
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #warningsLog'
          )
          .appStatusShouldShowErrors();
      } else if (
        _.isEqual(
          randomLogFiles,
          ['info.log', 'errors.log', 'warnings.log'].sort()
        )
      ) {
        await ft
          .waitOnElementToBecomeVisible('dburst-log-files-viewer-separate-tabs')
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #infoLog'
          )
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #errorsLog'
          )
          .waitOnElementToBecomeVisible(
            'dburst-log-files-viewer-separate-tabs #warningsLog'
          )
          .appStatusShouldShowErrors();
      } else {
        await ft.elementShouldBeVisible('#itShouldNotComeHere');
      }
    }
  );
});
