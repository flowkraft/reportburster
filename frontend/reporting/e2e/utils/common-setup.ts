import { ElectronApplication, Page } from 'playwright';
import { test as base } from '@playwright/test';

import { Helpers } from './helpers';
import { FluentTester } from '../helpers/fluent-tester';

export const electronBeforeAfterAllTest = base.extend<
  {
    beforeAfterEach: Page;
  },
  {
    beforeAfterAll: ElectronApplication;
  }
>({
  beforeAfterAll: [
    async ({}, run) => {
      const electronApp = await Helpers.electronAppLaunch('../..');

      await run(electronApp);

      await Helpers.electronAppClose(electronApp);
    },
    { scope: 'worker' },
  ],
  beforeAfterEach: [
    async ({ beforeAfterAll: electronApp }, run) => {
      //const shouldDeactivateLicenseKey = true;
      const shouldDeactivateLicenseKey = false;

      //reload default "clean" configuration

      await Helpers.restoreDocumentBursterCleanState(
        shouldDeactivateLicenseKey
      );

      const firstPage = await electronApp.firstWindow();

      //await firstPage.reload();
      //await firstPage.waitForLoadState('domcontentloaded');

      const ft = new FluentTester(firstPage);

      await ft.gotoStartScreen();
      await run(firstPage);
      //await Helpers.killHangingJavaProcesses();
    },
    { scope: 'test' },
  ],
});

/*
export const electronBeforeAfterEachTest = base.extend<{
  beforeAfterEach: Page;
}>({
  beforeAfterEach: [
    async ({}, run) => {
      //reload default "clean" configuration
      const shouldDeactivateLicenseKey = false;
      await Helpers.restoreDocumentBursterCleanState(
        shouldDeactivateLicenseKey
      );

      const electronApp = await Helpers.electronAppLaunch('../..');

      const firstPage = await electronApp.firstWindow();

      const ft = new FluentTester(firstPage);

      await ft.gotoStartScreen();

      await run(firstPage);
      await Helpers.killHangingJavaProcesses();

      await Helpers.electronAppClose(electronApp);
    },
    { scope: 'test' },
  ],
});
*/
