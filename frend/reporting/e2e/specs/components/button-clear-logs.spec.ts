import * as path from 'path';
const slash = require('slash');

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import _ from 'lodash';
import { Helpers } from '../../utils/helpers';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'Bursting should not be allowed when dirty logs. Once the logs are cleared, bursting should be allowed',
    async ({ beforeAfterEach: firstPage }) => {
      await Helpers.generateRandomLogFiles();

      await new FluentTester(firstPage)
        .waitOnElementToBecomeVisible('#logsViewerBurstReportsTab')
        .elementShouldBeDisabled('#btnBurst')
        .click('#burstFile')
        .setInputFiles(
          '#burstFileUploadInput',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR +
                '/samples/burst/Payslips.pdf',
            ),
          ),
        )
        .waitOnElementToBecomeEnabled('#btnBurst')
        .waitOnElementToBecomeInvisible('#qaReminderLink')
        .click('#btnBurst')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogsBurstReportsTab')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis()
        .click('#btnBurst')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogsBurstReportsTab')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#qaReminderLink')
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnBurst')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis();
    },
  );

  electronBeforeAfterAllTest(
    'Merging Bursting should not be allowed when dirty logs. Once the logs are cleared, merging should be allowed',
    async ({ beforeAfterEach: firstPage }) => {
      await Helpers.generateRandomLogFiles();

      await new FluentTester(firstPage)
        .click('#leftMenuMergeBurst')
        .appShouldBeReadyToRunNewJobs()
        .elementShouldBeVisible('#twoOrMoreRequired')
        .setInputFiles(
          '#mergeFilesUploadInput',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR + '/samples/Invoices-Oct.pdf',
            ),
          ),
        )
        .setInputFiles(
          '#mergeFilesUploadInput',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR + '/samples/Invoices-Nov.pdf',
            ),
          ),
        )
        .setInputFiles(
          '#mergeFilesUploadInput',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR + '/samples/Invoices-Dec.pdf',
            ),
          ),
        )
        .click('#btnRun')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnRun')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis();
    },
  );

  electronBeforeAfterAllTest(
    'Quality Assurance should not allow Run Test if dirty logs. Once logs are cleared, running tests should be fine',
    async ({ beforeAfterEach: firstPage }) => {
      await Helpers.generateRandomLogFiles();

      await new FluentTester(firstPage)
        .click('#leftMenuQualityAssurance')
        .setInputFiles(
          '#qaFileUploadInput',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR + '/samples/Payslips.pdf',
            ),
          ),
        )
        .click('#testTokensRandom')
        .click('#numberOfRandomTokens')
        .typeText('2')
        .click('#btnRunTest')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis()
        .click('#btnRunTest')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnRunTest')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis();
    },
  );

  electronBeforeAfterAllTest(
    'SMTP screen should not allow Send Test Email if dirty logs. Once logs are cleared, Send Test Email should be fine',
    async ({ beforeAfterEach: firstPage }) => {
      await Helpers.generateRandomLogFiles();

      await new FluentTester(firstPage)
        .gotoConfigurationEmailSettings()
        .click('#btnSendTestEmail')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis()
        .click('#btnSendTestEmail')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnSendTestEmail')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis();
    },
  );

  electronBeforeAfterAllTest(
    'SMS screen should not allow Send Test SMS if dirty logs. Once logs are cleared, Send Test SMS should be fine',
    async ({ beforeAfterEach: firstPage }) => {
      await Helpers.generateRandomLogFiles();
      await new FluentTester(firstPage)
        .gotoConfigurationSMSSettings()
        .click('#accountSid')
        .typeText('11')
        .click('#authToken')
        .typeText('22')
        .click('#btnSendTestSMS')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickNoDontDoThis()
        .click('#btnSendTestSMS')
        .infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogs')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnSendTestSMS')
        .click('#fromNumber')
        .typeText('(777)-7777')
        .click('#toNumber')
        .typeText('(999)-8888')
        .clickNoDontDoThis();
    },
  );
});
