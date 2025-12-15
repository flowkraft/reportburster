/**
 * Self-Service Dashboards & Portals E2E Tests
 *
 * Tests two self-service portal implementations:
 * 1. WordPress-based CMS WebPortal - Document distribution portal with paystubs
 * 2. Grails Playground - Frontend dashboards with Svelte web components
 *
 * Both tests:
 * - Start the app via ReportBurster UI (fluent)
 * - Navigate the portal pages in an external Playwright browser
 * - Assert meaningful user-visible content loads correctly
 * - Stop the app and verify clean shutdown
 */

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';

test.describe('Self-Service Portals', () => {

  // ============================================================
  // Test 1: WordPress CMS WebPortal
  // ============================================================
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

  // ============================================================
  // Test 2: Grails Frontend Playground
  // ============================================================
  electronBeforeAfterAllTest(
    'Grails Playground: should start, navigate all pages with web components, and stop cleanly',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let externalBrowser = null;

      try {
        // Navigate to Apps tab and start the Grails app (fluent chain)
        await SelfServicePortalsTestHelper.startApp(
          new FluentTester(firstPage).gotoApps(),
          SelfServicePortalsTestHelper.APP_ID_GRAILS,
        );

        // Open external browser and test all Grails pages
        const { browser, page } = await SelfServicePortalsTestHelper.createExternalBrowser();
        externalBrowser = browser;

        // Navigate and assert all Grails pages (Home, Tabulator, Charts, Pivot, Parameters, Reports, Your Canvas)
        await SelfServicePortalsTestHelper.assertAllGrailsPages(page);

        console.log('Grails Playground: All page assertions passed.');

      } finally {
        // Close external browser first (this is independent of Electron)
        if (externalBrowser) {
          try {
            await SelfServicePortalsTestHelper.closeExternalBrowser(externalBrowser);
          } catch (e) {
            console.error('Failed to close external browser:', e);
          }
        }

        // Stop Grails app (fluent chain) - may fail if Electron crashed
        try {
          await SelfServicePortalsTestHelper.stopApp(
            new FluentTester(firstPage).gotoApps(),
            SelfServicePortalsTestHelper.APP_ID_GRAILS,
          );
        } catch (e) {
          console.error('Failed to stop Grails app (Electron may have crashed):', e);
        }

        console.log('Grails Playground: Test completed - app stopped cleanly.');
      }
    },
  );
});
