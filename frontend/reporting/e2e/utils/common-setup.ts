import { exec } from 'child_process';
import {
  Browser,
  BrowserContext,
  ElectronApplication,
  Page,
  test as base,
} from '@playwright/test';

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

const isElectron = process.env.TEST_ENV === 'electron';

export const electronBeforeAfterAllTest = isElectron
  ? base.extend<
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
              shouldDeactivateLicenseKey,
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
    })
  : base.extend<
      {
        beforeAfterEach: Page;
      },
      {
        beforeAfterAll: { browser: Browser; context: BrowserContext };
      }
    >({
      beforeAfterAll: [
        async ({}, run) => {
          const { browser, context } = await Helpers.browserLaunch();

          await run({ browser, context });

          await Helpers.browserClose(browser, context);
        },
        { scope: 'worker' },
      ],
      beforeAfterEach: [
        async ({ beforeAfterAll: { browser, context } }, run) => {
          const shouldDeactivateLicenseKey = false;

          await Helpers.restoreDocumentBursterCleanState(
            shouldDeactivateLicenseKey,
          );

          const [firstPage] = context.pages();

          const ft = new FluentTester(firstPage);

          await ft.gotoStartScreen();
          await run(firstPage);
        },
        { scope: 'test' },
      ],
    });

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
      },
    );
  });
}
