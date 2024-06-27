import * as path from 'path';
const slash = require('slash');

import { Page, test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE1
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should properly merge Invoices-Oct.pdf, Invoices-Nov.pdf and Invoices-Dec.pdf PDF files',
    async ({ beforeAfterEach: firstPage }) => {
      const burstMergedFile = false;
      const ft = _mergeInvoiceOctNovDecFiles(firstPage, burstMergedFile);
      await ft.processingShouldHaveGeneratedOutputFiles(['merged.pdf']);
    },
  );

  electronBeforeAfterAllTest(
    'should merge then burst merged.pdf for Invoices-Oct.pdf, Invoices-Nov.pdf and Invoices-Dec.pdf PDF files',
    async ({ beforeAfterEach: firstPage }) => {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const burstMergedFile = true;
      const ft = _mergeInvoiceOctNovDecFiles(firstPage, burstMergedFile);
      await ft.processingShouldHaveGeneratedOutputFiles([
        '0011.pdf',
        '0012.pdf',
        '0013.pdf',
        '0014.pdf',
        '0015.pdf',
        '0016.pdf',
        '0017.pdf',
        '0018.pdf',
        '0019.pdf',
        'merged.pdf',
      ]);
    },
  );
});

const _mergeInvoiceOctNovDecFiles = (
  firstPage: Page,
  burstMergedFile: boolean,
): FluentTester => {
  let ft = new FluentTester(firstPage);
  ft.click('#leftMenuMergeBurst');
  ft.elementShouldBeVisible('#twoOrMoreRequired');

  /*
  if (!burstMergedFile) {
    //.sleep(Configuration.DELAY_FIVE_THOUSANDS_SECONDS);
    ft.elementShouldBeVisible('#twoOrMoreRequired');
  } else {
    ft.click('#btnClearPdfFiles')
      .clickYesDoThis()
      .waitOnElementToBecomeVisible('#twoOrMoreRequired');
  }
  */

  ft.setInputFiles(
    '#mergeFilesUploadInput',
    slash(
      path.resolve(
        process.env.PORTABLE_EXECUTABLE_DIR + '/samples/burst/Invoices-Oct.pdf',
      ),
    ),
  )
    .elementShouldBeVisible('#twoOrMoreRequired')
    .setInputFiles(
      '#mergeFilesUploadInput',
      slash(
        path.resolve(
          process.env.PORTABLE_EXECUTABLE_DIR +
            '/samples/burst/Invoices-Nov.pdf',
        ),
      ),
    )
    .waitOnElementToBecomeInvisible('#twoOrMoreRequired')
    .setInputFiles(
      '#mergeFilesUploadInput',
      slash(
        path.resolve(
          process.env.PORTABLE_EXECUTABLE_DIR +
            '/samples/burst/Invoices-Dec.pdf',
        ),
      ),
    )
    .click('#mergedFileName')
    .typeText('merged.pdf');

  if (burstMergedFile) ft.click('#btnBurstMergedFile');

  ft.click('#btnRun').clickYesDoThis();

  if (burstMergedFile) {
    ft.waitOnProcessingToStart(Constants.CHECK_PROCESSING_STATUS_BAR);
    ft.waitOnProcessingToFinish(Constants.CHECK_PROCESSING_STATUS_BAR);
  } else {
    ft.waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA);
    ft.waitOnProcessingToFinish(Constants.CHECK_PROCESSING_JAVA);
  }
  //.waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
  ft.appStatusShouldBeGreatNoErrorsNoWarnings();

  return ft;
};
