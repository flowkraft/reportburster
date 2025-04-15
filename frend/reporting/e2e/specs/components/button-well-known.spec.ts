import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly load and save settings for one Well Known Email Provider (My Report)',
    async ({ beforeAfterEach: firstPage }) => {
      const ft = new FluentTester(firstPage);
      await ft
        .gotoConfigurationEmailSettings()
        //.click('#btnUseExistingEmailConnection')
        .click('#btnWellKnownEmailProviders')
        .click('#btnShowMoreProviders')
        .click('#QQex')
        .click('#btnOKConfirmation')
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
        .inputShouldHaveValue('#smtpPort', '465')
        .elementCheckBoxShouldBeSelected('#btnSSL')
        .elementCheckBoxShouldNotBeSelected('#btnTLS')
        .click('#topMenuBurst')
        .gotoConfigurationEmailSettings()
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
        .inputShouldHaveValue('#smtpPort', '465')
        .elementCheckBoxShouldBeSelected('#btnSSL')
        .elementCheckBoxShouldNotBeSelected('#btnTLS');
    },
  );
});
