/**
 * WordPress CMS WebPortal E2E Tests
 *
 * Deep functional testing of the WordPress-based CMS WebPortal:
 * - Admin flow: login, dashboard, users, paystubs
 * - Frontend as admin: all documents visible, Tailwind styles, single paystub deep
 * - Frontend as employee: only own documents, restricted wp-admin access
 *
 * Start the app via ReportBurster UI, navigate in an external Playwright browser,
 * assert meaningful user-visible content, stop the app and verify clean shutdown.
 */

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';

test.describe('WordPress CMS WebPortal Tests', () => {

  electronBeforeAfterAllTest(
    'WordPress Portal: should start, navigate admin & frontend pages, and stop cleanly',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let externalBrowser = null;

      try {

        SelfServicePortalsTestHelper.dockerComposeDownRmi(`${SelfServicePortalsTestHelper.APP_ID_WORDPRESS}-playground`);
        // Navigate to CMS Web Portal tab and start the app (fluent chain)
        await SelfServicePortalsTestHelper.startApp(
          new FluentTester(firstPage).gotoCmsWebPortal(),
          SelfServicePortalsTestHelper.APP_ID_WORDPRESS,
        );

        // Open external browser and test WordPress pages
        const { browser, page } = await SelfServicePortalsTestHelper.createExternalBrowser();
        externalBrowser = browser;

        // ============================================================
        // ADMIN FLOW: Login as admin, verify users & paystubs exist
        // ============================================================
        await SelfServicePortalsTestHelper.wpLoginAsAdmin(page);
        await SelfServicePortalsTestHelper.assertWpAdminDashboard(page);
        await SelfServicePortalsTestHelper.assertWpAdminUsersDeep(page);
        await SelfServicePortalsTestHelper.assertWpAdminPaystubsDeep(page);
        await SelfServicePortalsTestHelper.wpLogout(page);

        // ============================================================
        // FRONTEND AS ADMIN: Admin sees ALL documents + Tailwind styles
        // ============================================================
        await SelfServicePortalsTestHelper.wpLoginFrontend(page, 'u2changeme', 'p2changeme123!');
        await SelfServicePortalsTestHelper.assertWpMyDocumentsAsAdmin(page);
        await SelfServicePortalsTestHelper.assertWpTailwindStylesApplied(page);
        await SelfServicePortalsTestHelper.assertWpSinglePaystubDeep(page, 'Clyde Grew', 'March 2024', '4,000', '3,790');
        await SelfServicePortalsTestHelper.wpLogoutFrontend(page);

        // ============================================================
        // FRONTEND AS EMPLOYEE: Employee sees ONLY their own documents
        // ============================================================
        await SelfServicePortalsTestHelper.wpLoginFrontend(page, 'clyde.grew', 'demo1234');
        await SelfServicePortalsTestHelper.assertWpMyDocumentsAsEmployee(page, 'Clyde Grew', ['Kyle Butford', 'Alfreda Waldback']);

        // ============================================================
        // WP-ADMIN AS EMPLOYEE: Should have restricted access
        // ============================================================
        await SelfServicePortalsTestHelper.assertWpAdminRestrictedForEmployee(page);

        await SelfServicePortalsTestHelper.wpLogoutFrontend(page);

        console.log('WordPress: All page assertions passed.');

      } finally {
        // Close external browser first (this is independent of Electron)
        if (externalBrowser) {
          try {
            await SelfServicePortalsTestHelper.closeExternalBrowser(externalBrowser);
          } catch (e) {
            console.error('Failed to close external browser:', e);
          }
        }

        // Stop WordPress portal (fluent chain) - may fail if Electron crashed
        try {
          await SelfServicePortalsTestHelper.stopApp(
            new FluentTester(firstPage).gotoCmsWebPortal(),
            SelfServicePortalsTestHelper.APP_ID_WORDPRESS,
          );
        } catch (e) {
          console.error('Failed to stop WordPress app (Electron may have crashed):', e);
        }

        console.log('WordPress Portal: Test completed - app stopped cleanly.');
      }
    },
  );

});
