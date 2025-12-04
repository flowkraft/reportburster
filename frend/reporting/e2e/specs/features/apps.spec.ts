import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { AppsTestHelper, VISIBLE_APPS } from '../../helpers/apps-test-helper';

test.describe('Apps Manager Tests', () => {

  // Test 1: Navigate to CMS WebPortal tab and start/stop the WebPortal app
  electronBeforeAfterAllTest(
    'should start and stop CMS WebPortal app from Processing → CMS Web Portal tab',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

      let ft = new FluentTester(firstPage);

      // Navigate to CMS Web Portal tab
      ft = ft.gotoCmsWebPortal();

      // Start, wait for running, stop, wait for stopped
      ft = AppsTestHelper.startWaitStopWaitApp(
        ft,
        'cms-webportal',
        'WebPortal',
      );

      await ft;
    },
  );

  // Test 2: Navigate to Apps tab and start/stop each visible app one by one
  electronBeforeAfterAllTest(
    'should start and stop all visible apps from Help → Apps tab',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      // Navigate to Apps tab (Help → Apps / Starter Packs / Extra Utils)
      ft = ft.gotoApps();

      // For each visible app, start it, wait for running, stop it, wait for stopped
      for (const app of VISIBLE_APPS) {
        ft = AppsTestHelper.startWaitStopWaitApp(
          ft,
          app.id,
          app.name,
          Constants.DELAY_FIVE_THOUSANDS_SECONDS,
          app.launch !== false, // hasLaunchButton - false for headless apps
        );
      }

      await ft;
    },
  );

});
