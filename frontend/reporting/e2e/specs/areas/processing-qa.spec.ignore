import * as path from 'path';
const slash = require('slash');

import { test } from '@playwright/test';
import { Page } from 'playwright';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import * as PATHS from '../../utils/paths';
import { FluentTester } from '../../helpers/fluent-tester';
//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly split-test-all samples/burst/Payslips.pdf (My Report)',
    async function ({ beforeAfterEach: firstPage }) {
      const sendEmails = false;
      await _splitSendVerifyEmails(firstPage, Constants.QA_TA, sendEmails);
    },
  );

  electronBeforeAfterAllTest(
    'should correctly split-test-random2 samples/burst/Payslips.pdf (My Report)',
    async function ({ beforeAfterEach: firstPage }) {
      const sendEmails = false;
      await _splitSendVerifyEmails(firstPage, Constants.QA_TR, sendEmails);
    },
  );

  electronBeforeAfterAllTest(
    'should correctly split-test-tokenlist samples/burst/Payslips.pdf (My Report)',
    async function ({ beforeAfterEach: firstPage }) {
      const sendEmails = false;
      await _splitSendVerifyEmails(firstPage, Constants.QA_TL, sendEmails);
    },
  );

  electronBeforeAfterAllTest(
    'should correctly split-email-test-all samples/burst/Payslips.pdf (My Report)',
    async function ({ beforeAfterEach: firstPage }) {
      const sendEmails = true;
      await _splitSendVerifyEmails(firstPage, Constants.QA_TA, sendEmails);
    },
  );

  electronBeforeAfterAllTest(
    'should correctly split-email-test-random2 samples/burst/Payslips.pdf (My Report)',
    async function ({ beforeAfterEach: firstPage }) {
      const sendEmails = true;
      await _splitSendVerifyEmails(firstPage, Constants.QA_TR, sendEmails);
    },
  );

  electronBeforeAfterAllTest(
    'should correctly split-email-test-tokenlist samples/burst/Payslips.pdf (My Report)',
    async function ({ beforeAfterEach: firstPage }) {
      const sendEmails = true;
      await _splitSendVerifyEmails(firstPage, Constants.QA_TL, sendEmails);
    },
  );
});

const _splitSendVerifyEmails = (
  firstPage: Page,
  mode: string,
  sendEmails: boolean,
  //expectedOutputEmailFiles: string[]
): FluentTester => {
  const qaFlowOptions = ['PROC_2_QA', 'QA_DIRECTLY'];
  const randomQAFlowChoice =
    qaFlowOptions[Math.floor(Math.random() * qaFlowOptions.length)];

  const ft = new FluentTester(firstPage);

  ft.click('#topMenuBurst');

  if (sendEmails) {
    ft.click('#topMenuConfiguration')
      // STEP0 - CHANGE VALUES
      // enable email distribution
      .click('#topMenuConfigurationLoad_burst_' + PATHS.SETTINGS_CONFIG_FILE)
      .click('#btnEnableDisableDistribution')
      .click('#btnSendDocumentsEmail')
      // email message settings
      .click('#leftMenuEmailSettings') // email message settings
      .click('#emailMessageTab-link')
      .click('#emailSubject')
      .typeText('Subject $burst_token$')
      // email message settings
      .click('.ql-editor')
      .typeText('Message $burst_token$')
      .click('#topMenuBurst');
  }
  ft.appShouldBeReadyToRunNewJobs().appStatusShouldBeGreatNoErrorsNoWarnings();

  if (randomQAFlowChoice == 'PROC_2_QA') {
    ft.setInputFiles(
      '#burstFileUploadInput',
      path.resolve(
        slash(
          process.env.PORTABLE_EXECUTABLE_DIR + '/samples/burst/Payslips.pdf',
        ),
      ),
    )
      .elementShouldBeVisible('#qaReminderLink')
      .click('#qaReminderLink')
      .elementShouldBeVisible('#goToQa')
      .click('#goToQa');
  }

  if (randomQAFlowChoice == 'QA_DIRECTLY') {
    ft.click('#leftMenuQualityAssurance');
    ft.setInputFiles(
      '#qaFileUploadInput',
      path.resolve(
        slash(
          process.env.PORTABLE_EXECUTABLE_DIR + '/samples/burst/Payslips.pdf',
        ),
      ),
    );
  }

  if (mode === Constants.QA_TR) {
    ft.click('#testTokensRandom');
  } else if (mode === Constants.QA_TL) {
    ft.click('#testTokensList').setValue(
      '#listOfTokens',
      'clyde.grew@northridgehealth.org,alfreda.waldback@northridgehealth.org',
    );
  }

  if (sendEmails && mode !== Constants.QA_TA) {
    ft.click('#startTestEmailServer')
      .clickYesDoThis()
      .waitOnElementToBecomeVisible(
        '#stopTestEmailServer',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS,
      )
      .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_STATUS_BAR);
  }

  ft.click('#btnRunTest')
    .clickNoDontDoThis()
    .click('#btnRunTest')
    .clickYesDoThis()
    .waitOnProcessingToStart(Constants.CHECK_PROCESSING_STATUS_BAR)
    .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_STATUS_BAR)
    .appStatusShouldBeGreatNoErrorsNoWarnings();

  if (mode === Constants.QA_TA) {
    ft.processingShouldHaveGeneratedOutputFiles(
      Constants.PAYSLIPS_PDF_BURST_TOKENS.map(function (burstToken) {
        return burstToken + '.pdf';
      }),
    );
  } else if (mode === Constants.QA_TR)
    ft.processingShouldHaveGeneratedNFilesHavingSuffix(2, '.pdf');
  else if (mode === Constants.QA_TL) {
    ft.processingShouldHaveGeneratedOutputFiles([
      'clyde.grew@northridgehealth.org.pdf',
      'alfreda.waldback@northridgehealth.org.pdf',
    ]);
  }

  if (sendEmails) {
    if (mode === Constants.QA_TA)
      ft.shouldHaveSentNCorrectEmails(
        mode,
        Constants.PAYSLIPS_PDF_BURST_TOKENS.length,
        Constants.ATTACHMENTS_DEFAULT,
      );
    else
      ft.shouldHaveSentNCorrectEmails(mode, 2, Constants.ATTACHMENTS_DEFAULT);
  }

  if (sendEmails && mode !== Constants.QA_TA) {
    ft.click('#stopTestEmailServer')
      .clickYesDoThis()
      .waitOnElementToBecomeVisible(
        '#startTestEmailServer',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS,
      )
      .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_STATUS_BAR);
  }

  return ft;
};
