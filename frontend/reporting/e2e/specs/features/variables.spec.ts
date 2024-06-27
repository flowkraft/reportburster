import * as path from 'path';
const slash = require('slash');

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import * as PATHS from '../../utils/paths';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should split Invoices-Oct.pdf and, with the help of User Variables, and the output files should be "Customer name-Invoice number-Invoice date.pdf" convention (My Report)',
    async ({ beforeAfterEach: firstPage }) => {
      const expectedOutputFiles = [
        'Alpha Electric-0011-Oct 10, 2011.pdf',
        'General Industries Co.-0012-Oct 13, 2011.pdf',
        'Goldstream Fuel-0013-Oct 15, 2011.pdf',
        'Red Valley Mining-0014-Oct 16, 2011.pdf',
      ];

      const ft = new FluentTester(firstPage);
      await ft
        .click('#topMenuConfiguration')
        .click('#topMenuConfigurationLoad_burst_' + PATHS.SETTINGS_CONFIG_FILE)
        .click('#burstFileName')
        .typeText('')
        .click('#btnBurstFileNameVariables')
        .click('#\\$\\{var1\\}')
        .clickYesDoThis()
        .click('#burstFileName')
        .pressKey('End')
        .pressKey('-')
        .click('#btnBurstFileNameVariables')
        .click('#\\$\\{burst_token\\}')
        .clickYesDoThis()
        .click('#burstFileName')
        .pressKey('End')
        .pressKey('-')
        .click('#btnBurstFileNameVariables')
        .click('#\\$\\{var0\\}')
        .clickYesDoThis()
        .click('#burstFileName')
        .pressKey('End')
        .pressKey('.')
        .click('#btnBurstFileNameVariables')
        .click('#\\$\\{input_document_extension\\}')
        .clickYesDoThis()
        .click('#topMenuBurst')
        .click('#burstFile')
        .setInputFiles(
          '#burstFileUploadInput',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR +
                '/samples/burst/Invoices-Oct.pdf',
            ),
          ),
        )
        .waitOnElementToBecomeVisible('#qaReminderLink')
        .click('#btnBurst')
        .clickYesDoThis()
        //.waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
        //.waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
        .waitOnProcessingToStart(Constants.CHECK_PROCESSING_STATUS_BAR)
        .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_STATUS_BAR)
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .processingShouldHaveGeneratedOutputFiles(expectedOutputFiles);
    },
  );
});
