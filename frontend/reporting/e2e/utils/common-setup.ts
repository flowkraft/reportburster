import { exec } from 'child_process';
import { ElectronApplication, Page } from 'playwright';
import { test as base } from '@playwright/test';

import { Helpers } from './helpers';
import { FluentTester } from '../helpers/fluent-tester';

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
  throw err;
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  // Throw the error to get a stack trace
  throw reason;
});

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
      try {
        //const shouldDeactivateLicenseKey = true;
        const shouldDeactivateLicenseKey = false;

        //reload default "clean" configuration

        await Helpers.restoreDocumentBursterCleanState(
          shouldDeactivateLicenseKey
        );

        const firstPage = await electronApp.firstWindow();

        //await firstPage.reload();

        const ft = new FluentTester(firstPage);

        await ft.gotoStartScreen();
        await run(firstPage);
      } catch (error) {
        // Rethrow the error to fail the test
        throw error;
      }
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

function findLockingProcess(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `wmic process where "CommandLine Like '%${filePath}%'" get Commandline, ProcessId`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else if (stderr) {
          reject(new Error(stderr));
        } else {
          resolve(stdout);
        }
      }
    );
  });
}
