const slash = require('slash');

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { FluentTester } from '../../helpers/fluent-tester';
import path from 'path';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should show the screen correctly in the initial state',
    async function ({ beforeAfterEach: firstPage }) {
      const ft = new FluentTester(firstPage);

      await ft
        .gotoProcessingMergeBurstScreen()
        .inputShouldHaveValue('#mergedFileName', 'merged.pdf')
        .elementShouldBeVisible('#twoOrMoreRequired')
        .click('#mergedFileName')
        .typeText('')
        .typeText('merge')
        .waitOnElementToBecomeVisible('#mergedFileNamePdfExtensionRequired')
        .typeText('999.pdf')
        .click('#topMenuBurst')
        .gotoProcessingMergeBurstScreen()
        .inputShouldHaveValue('#mergedFileName', '999.pdf');
    },
  );

  electronBeforeAfterAllTest(
    'should allow to add, delete, edit, up, down and clear PDF files',
    async function ({ beforeAfterEach: firstPage }) {
      const ft = new FluentTester(firstPage);

      await ft
        .gotoProcessingMergeBurstScreen()
        .elementShouldBeVisible('#twoOrMoreRequired')
        .setInputFiles(
          '#mergeFilesUploadInput',
          slash(
            path.resolve(
              `${process.env.PORTABLE_EXECUTABLE_DIR}/samples/burst/Invoices-Oct.pdf`,
            ),
          ),
        )
        .elementShouldBeVisible('#twoOrMoreRequired')
        .setInputFiles(
          '#mergeFilesUploadInput',
          slash(
            path.resolve(
              `${process.env.PORTABLE_EXECUTABLE_DIR}/samples/burst/Invoices-Nov.pdf`,
            ),
          ),
        )
        .waitOnElementToBecomeInvisible('#twoOrMoreRequired')
        .click('#filesTable tbody tr:last-child td:first-child')
        .click('#btnDeletePdfFile')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#twoOrMoreRequired')
        .setInputFiles(
          '#mergeFilesUploadInput',
          slash(
            path.resolve(
              `${process.env.PORTABLE_EXECUTABLE_DIR}/samples/burst/Invoices-Nov.pdf`,
            ),
          ),
        )
        .setInputFiles(
          '#mergeFilesUploadInput',
          slash(
            path.resolve(
              `${process.env.PORTABLE_EXECUTABLE_DIR}/samples/burst/Invoices-Dec.pdf`,
            ),
          ),
        )
        .click('#filesTable tbody tr:last-child td:first-child')
        .click('#btnUpPdfFile')
        .click('#btnUpPdfFile')
        .click('#filesTable tbody tr:nth-child(2) td:first-child')
        .click('#btnDownPdfFile')
        .click('#filesTable tbody tr:last-child td:first-child')
        .elementShouldContainText(
          '#filesTable tbody tr:nth-child(1) td:nth-child(1)',
          'Invoices-Dec.pdf',
        )
        .elementShouldContainText(
          '#filesTable tbody tr:nth-child(2) td:nth-child(1)',
          'Invoices-Nov.pdf',
        )
        .elementShouldContainText(
          '#filesTable tbody tr:nth-child(3) td:nth-child(1)',
          'Invoices-Oct.pdf',
        )
        .click('#btnClearPdfFiles')
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#twoOrMoreRequired');
    },
  );
});
