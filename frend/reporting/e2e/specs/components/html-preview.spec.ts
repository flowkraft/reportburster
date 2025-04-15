import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    'should correctly handle the relevant buttons related with HTML email code (My Report)',
    async ({ beforeAfterEach: firstPage }) => {
      const ft = new FluentTester(firstPage);
      await ft
        .gotoConfigurationEmailSettings()
        .click('#emailMessageTab-link')
        .elementShouldNotBeVisible('#htmlCodeEmailMessage')
        .click('#leftMenuAdvancedSettings')
        .click('#btnHTMLEmailEditCode')
        .click('#leftMenuEmailSettings')
        .click('#emailMessageTab-link')
        .click('#htmlCodeEmailMessage')
        .typeText('<h1>Hello World</h1>')
        .click('#btnHtmlCodeEmailMessageVariables')
        .click('#\\$\\{var0\\}')
        .clickYesDoThis()
        .click('#topMenuBurst')
        .gotoConfigurationEmailSettings()
        .click('#emailMessageTab-link')
        .waitOnElementToBecomeVisible('#htmlCodeEmailMessage')
        /*
        .elementAttributeShouldHaveValue(
          '#htmlCodeEmailMessage',
          'ng-reflect-model',
          '<h1>Hello World</h1>${var0}'
        )*/
        .click('#btnHtmlEmailPreview')
        .waitOnElementToBecomeVisible('#previewIframe')
        .elementAttributeShouldHaveValue(
          '#previewIframe',
          'srcdoc',
          '<h1>Hello World</h1>${var0}',
        )
        .click('#btnClose');
    },
  );
});
