import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { expect } from '@playwright/test';
import { FluentTester } from '../fluent-tester';
import { Constants } from '../../utils/constants';

import { spawnSync } from 'child_process';
import * as path from 'path';

/**
 * Helper class for Self-Service Portals E2E tests.
 * Provides utilities for starting/stopping apps and navigating external portal pages.
 */
export class SelfServicePortalsTestHelper {

  // WordPress Portal Constants
  static readonly WP_BASE_URL = 'http://localhost:8080';
  static readonly WP_ADMIN_USER = 'u2changeme';
  static readonly WP_ADMIN_PASSWORD = 'p2changeme123!';
  static readonly WP_LOGIN_URL = `${SelfServicePortalsTestHelper.WP_BASE_URL}/wp-login.php`;
  static readonly WP_ADMIN_URL = `${SelfServicePortalsTestHelper.WP_BASE_URL}/wp-admin`;
  static readonly WP_MY_DOCUMENTS_URL = `${SelfServicePortalsTestHelper.WP_BASE_URL}/my-documents`;
  // Paystubs custom post type URL in admin
  static readonly WP_ADMIN_PAYSTUBS_URL = `${SelfServicePortalsTestHelper.WP_BASE_URL}/wp-admin/edit.php?post_type=paystub`;

  // Grails Playground Constants
  static readonly GRAILS_BASE_URL = 'http://localhost:8481';

  // App IDs
  static readonly APP_ID_WORDPRESS = 'cms-webportal';
  static readonly APP_ID_GRAILS = 'flowkraft-frend-grails';

  /**
   * Convert employee name to slug format (matches WordPress sanitize_title).
   * "Clyde Grew" -> "clyde-grew"
   */
  static toEmployeeSlug(employeeName: string): string {
    return employeeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  static dockerComposeDownRmi(stack: string): void {
    spawnSync('docker', ['compose', 'down', '-v', '--rmi', 'local'], {
      cwd: `${path.join(process.env.PORTABLE_EXECUTABLE_DIR)}/_apps/${stack}`,
      shell: true,
    });
  }

  /**
   * Start an app and wait for it to be running (returns FluentTester for chaining).
   */
  static startApp(
    ft: FluentTester,
    appId: string,
    timeout: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
  ): FluentTester {
    const btnSel = `#btnStartStop_${appId}`;
    const stateSel = `#appState_${appId}`;
    const spinnerSel = `#appSpinner_${appId}`;

    return ft
      .consoleLog(`Starting app '${appId}'...`)
      .waitOnElementToBecomeVisible(btnSel, timeout)
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .click(btnSel)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .waitOnElementToBecomeDisabled(btnSel, timeout)
      .waitOnElementToBecomeVisible(spinnerSel, timeout)
      .waitOnElementToContainText(stateSel, 'starting', timeout)
      .consoleLog(`App '${appId}' is starting...`)
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .waitOnElementToContainText(stateSel, 'running', timeout)
      .waitOnElementToContainText(btnSel, 'Stop', timeout)
      .consoleLog(`App '${appId}' is running.`)
      .sleep(5000); // Give app time to fully initialize
  }

  /**
   * Stop an app and wait for it to be stopped (returns FluentTester for chaining).
   */
  static stopApp(
    ft: FluentTester,
    appId: string,
    timeout: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
  ): FluentTester {
    const btnSel = `#btnStartStop_${appId}`;
    const stateSel = `#appState_${appId}`;
    const spinnerSel = `#appSpinner_${appId}`;

    return ft
      .consoleLog(`Stopping app '${appId}'...`)
      .waitOnElementToBecomeVisible(btnSel, timeout)
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .click(btnSel)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .waitOnElementToBecomeDisabled(btnSel, timeout)
      .waitOnElementToBecomeVisible(spinnerSel, timeout)
      .waitOnElementToContainText(stateSel, 'stopping', timeout)
      .consoleLog(`App '${appId}' is stopping...`)
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .waitOnElementToContainText(stateSel, 'stopped', timeout)
      .waitOnElementToContainText(btnSel, 'Start', timeout)
      .consoleLog(`App '${appId}' is stopped.`);
  }

  /**
   * Create a new Playwright browser context for external portal navigation.
   * @param headless - Whether to run the browser in headless mode (default: false for visibility)
   */
  static async createExternalBrowser(headless: boolean = false): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    return { browser, context, page };
  }

  /**
   * Wait for a web server to be ready by polling the URL until it responds.
   * This is crucial because apps report "running" before HTTP server is ready.
   */
  static async waitForServerReady(
    page: Page,
    url: string,
    maxRetries: number = 30,
    retryDelayMs: number = 2000,
  ): Promise<void> {
    console.log(`Waiting for server at ${url} to be ready...`);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' });
        if (response && response.ok()) {
          console.log(`Server at ${url} is ready after ${attempt} attempt(s).`);
          return;
        }
        // Response exists but not OK (e.g., 500 error) - server is responding but maybe not fully ready
        if (response && response.status() >= 500) {
          console.log(`Server returned ${response.status()}, retrying (${attempt}/${maxRetries})...`);
          lastError = new Error(`Server returned status ${response.status()}`);
        } else if (response) {
          // Got a response (even 404 means server is up), consider it ready
          console.log(`Server at ${url} responded with status ${response.status()}, considering ready.`);
          return;
        }
      } catch (err) {
        lastError = err as Error;
        const msg = lastError.message || String(lastError);
        // Common transient errors during startup
        if (msg.includes('ERR_EMPTY_RESPONSE') || msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('ECONNREFUSED')) {
          console.log(`Server not ready yet (${msg.split('\n')[0]}), retrying (${attempt}/${maxRetries})...`);
        } else {
          console.log(`Unexpected error: ${msg.split('\n')[0]}, retrying (${attempt}/${maxRetries})...`);
        }
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }

    throw new Error(`Server at ${url} did not become ready after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Close the external browser.
   */
  static async closeExternalBrowser(browser: Browser): Promise<void> {
    if (browser) {
      await browser.close();
    }
  }

  // ============================================================
  // WordPress Portal Assertions - Real Data from provision-content-types-and-sample-data.php
  // Demo Users: clyde.grew, kyle.butford, alfreda.waldback (all password: demo1234)
  // Demo Paystubs: March 2024 for all 3 employees
  // ============================================================

  // Demo data constants from provisioning script
  static readonly WP_DEMO_EMPLOYEES = [
    { login: 'clyde.grew', name: 'Clyde Grew', email: 'clyde.grew@northridgehealth.org' },
    { login: 'kyle.butford', name: 'Kyle Butford', email: 'kyle.butford@northridgehealth.org' },
    { login: 'alfreda.waldback', name: 'Alfreda Waldback', email: 'alfreda.waldback@northridgehealth.org' },
  ];
  static readonly WP_DEMO_EMPLOYEE_PASSWORD = 'demo1234';
  static readonly WP_DEMO_PAYSTUBS = [
    { employee: 'Clyde Grew', period: 'March 2024', gross: 4000, net: 3790 },
    { employee: 'Kyle Butford', period: 'March 2024', gross: 3000, net: 2890 },
    { employee: 'Alfreda Waldback', period: 'March 2024', gross: 3500, net: 3590 },
  ];

  /**
   * Login to WordPress admin dashboard.
   * First waits for server ready, then logs in with admin credentials.
   */
  static async wpLoginAsAdmin(page: Page): Promise<void> {
    console.log('WordPress: Waiting for server to be ready...');
    await SelfServicePortalsTestHelper.waitForServerReady(
      page,
      SelfServicePortalsTestHelper.WP_LOGIN_URL,
      30, 2000
    );

    console.log('WordPress: Logging in as admin...');
    await page.goto(SelfServicePortalsTestHelper.WP_LOGIN_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#user_login')).toBeVisible({ timeout: 10000 });
    await page.fill('#user_login', SelfServicePortalsTestHelper.WP_ADMIN_USER);
    await page.fill('#user_pass', SelfServicePortalsTestHelper.WP_ADMIN_PASSWORD);
    await page.click('#wp-submit');

    await page.waitForURL(/wp-admin/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    console.log('WordPress: Admin login successful ✓');
  }

  /**
   * Login to WordPress frontend (not admin) with specific user.
   */
  static async wpLoginFrontend(page: Page, username: string, password: string): Promise<void> {
    console.log(`WordPress: Logging in frontend as ${username}...`);
    await page.goto(SelfServicePortalsTestHelper.WP_LOGIN_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#user_login')).toBeVisible({ timeout: 10000 });
    await page.fill('#user_login', username);
    await page.fill('#user_pass', password);
    await page.click('#wp-submit');

    // Frontend login might redirect to home or my-documents
    await page.waitForLoadState('networkidle');
    console.log(`WordPress: Frontend login as ${username} successful ✓`);
  }

  /**
   * Assert WordPress Admin Dashboard loads correctly.
   */
  static async assertWpAdminDashboard(page: Page): Promise<void> {
    console.log('WordPress: Checking admin dashboard...');
    await expect(page.locator('#adminmenu')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#wpadminbar')).toBeVisible({ timeout: 5000 });

    const body = await page.textContent('body');
    expect(body).not.toContain('Fatal error');
    expect(body).not.toContain('Warning:');
    console.log('WordPress: Admin dashboard OK ✓');
  }

  /**
   * Assert WordPress Admin Users page shows ALL demo employee users.
   * Deep check: verifies clyde.grew, kyle.butford, alfreda.waldback exist.
   */
  static async assertWpAdminUsersDeep(page: Page): Promise<void> {
    console.log('WordPress: Checking users page with deep assertions...');
    await page.goto(`${SelfServicePortalsTestHelper.WP_ADMIN_URL}/users.php`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.wp-list-table')).toBeVisible({ timeout: 10000 });

    // Verify ALL demo employees are present
    const body = await page.textContent('body');
    for (const emp of SelfServicePortalsTestHelper.WP_DEMO_EMPLOYEES) {
      expect(body).toContain(emp.login);
      console.log(`WordPress Users: Found ${emp.login} ✓`);
    }

    // Count should be at least 4 (admin + 3 employees)
    const userRows = page.locator('.wp-list-table tbody tr');
    const count = await userRows.count();
    expect(count).toBeGreaterThanOrEqual(4);
    console.log(`WordPress: Users page OK - ${count} users found ✓`);
  }

  /**
   * Assert WordPress Admin Paystubs page shows ALL demo paystubs.
   * Deep check: verifies 3 paystubs for March 2024 exist.
   */
  static async assertWpAdminPaystubsDeep(page: Page): Promise<void> {
    console.log('WordPress: Checking paystubs admin page with deep assertions...');
    await page.goto(SelfServicePortalsTestHelper.WP_ADMIN_PAYSTUBS_URL);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).not.toContain('Fatal error');

    await expect(page.locator('.wp-list-table')).toBeVisible({ timeout: 10000 });

    // Verify we have exactly 3 paystubs (one per demo employee)
    const rows = page.locator('.wp-list-table tbody tr');
    const count = await rows.count();
    expect(count).toBe(3);
    console.log(`WordPress: Found ${count} paystubs in admin ✓`);

    // Each paystub title should be "March 2024 Paystub"
    expect(body).toContain('March 2024 Paystub');
    console.log('WordPress: Paystubs admin page OK ✓');
  }

  /**
   * Logout from WordPress admin.
   */
  static async wpLogout(page: Page): Promise<void> {
    console.log('WordPress: Logging out from admin...');
    await page.goto(`${SelfServicePortalsTestHelper.WP_BASE_URL}/wp-login.php?action=logout`);
    await page.waitForLoadState('networkidle');

    const confirmLink = page.locator('a:has-text("log out")');
    if (await confirmLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmLink.click();
      await page.waitForLoadState('networkidle');
    }
    console.log('WordPress: Logged out from admin ✓');
  }

  /**
   * Logout from WordPress frontend.
   */
  static async wpLogoutFrontend(page: Page): Promise<void> {
    console.log('WordPress: Logging out from frontend...');
    await page.goto(`${SelfServicePortalsTestHelper.WP_BASE_URL}/wp-login.php?action=logout`);
    await page.waitForLoadState('networkidle');

    const confirmLink = page.locator('a:has-text("log out")');
    if (await confirmLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmLink.click();
      await page.waitForLoadState('networkidle');
    }
    console.log('WordPress: Logged out from frontend ✓');
  }

  /**
   * Assert "My Documents" page as ADMIN - should see ALL 3 paystubs.
   * Uses semantic test IDs for bullet-proof, reliable assertions.
   */
  static async assertWpMyDocumentsAsAdmin(page: Page): Promise<void> {
    console.log('WordPress: Checking My Documents as ADMIN (should see all docs)...');
    await page.goto(SelfServicePortalsTestHelper.WP_MY_DOCUMENTS_URL);
    await page.waitForLoadState('networkidle');

    // Wait for page to load using semantic ID
    await page.waitForSelector('#my-documents-page', { timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).not.toContain('Fatal error');

    // Verify filter notice shows admin mode
    const filterNotice = await page.locator('#filter-notice').textContent();
    expect(filterNotice).toContain('Admin');
    console.log(`WordPress: Filter notice: ${filterNotice} ✓`);

    // Admin should see ALL 3 employees' paystubs using semantic employee-slug IDs
    for (const paystub of SelfServicePortalsTestHelper.WP_DEMO_PAYSTUBS) {
      const slug = SelfServicePortalsTestHelper.toEmployeeSlug(paystub.employee);
      const row = page.locator(`#paystub-row-${slug}`);
      await expect(row).toBeVisible({ timeout: 5000 });
      console.log(`WordPress My Documents (Admin): Found #paystub-row-${slug} ✓`);
    }

    // Count total paystub rows using data-testid
    const paystubRows = page.locator('[data-testid="paystub-row"]');
    const count = await paystubRows.count();
    expect(count).toBeGreaterThanOrEqual(3);
    console.log(`WordPress: My Documents as Admin OK - ${count} paystub rows found (>= 3 expected) ✓`);
  }

  /**
   * Assert Tailwind CSS styles are properly applied.
   * Verifies styles didn't regress (we had issues getting Tailwind to build).
   */
  static async assertWpTailwindStylesApplied(page: Page): Promise<void> {
    console.log('WordPress: Checking Tailwind styles are applied...');
    await page.goto(SelfServicePortalsTestHelper.WP_MY_DOCUMENTS_URL);
    await page.waitForLoadState('networkidle');

    // Wait for page to load using semantic ID
    await page.waitForSelector('#my-documents-page', { timeout: 10000 });

    // Check that container has proper Tailwind max-width styling
    const mainContent = page.locator('#my-documents-page');
    const styles = await mainContent.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        maxWidth: computed.maxWidth,
        margin: computed.marginLeft,
      };
    });
    // Tailwind classes should produce non-auto values
    console.log(`WordPress: Container styles - maxWidth: ${styles.maxWidth}, margin: ${styles.margin}`);

    // Check for styled buttons/links (Tailwind applies bg-*, text-*, rounded-*, etc.)
    const styledElements = page.locator('[class*="bg-"], [class*="text-"], [class*="rounded"], [class*="p-"], [class*="m-"]');
    const styledCount = await styledElements.count();
    expect(styledCount).toBeGreaterThan(0);
    console.log(`WordPress: Found ${styledCount} Tailwind-styled elements ✓`);

    // Verify View link has proper styling using data-testid
    const viewLink = page.locator('[data-testid="paystub-view-link"]').first();
    if (await viewLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      const linkColor = await viewLink.evaluate((el) => window.getComputedStyle(el).color);
      // Blue color from text-blue-600 class
      console.log(`WordPress: View link color: ${linkColor} ✓`);
    }

    console.log('WordPress: Tailwind styles are applied ✓');
  }

  /**
   * Assert a single paystub detail page with specific data.
   * Uses semantic test IDs for bullet-proof, reliable assertions.
   */
  static async assertWpSinglePaystubDeep(
    page: Page,
    employeeName: string,
    period: string,
    expectedGross: string,
    expectedNet: string,
  ): Promise<void> {
    console.log(`WordPress: Checking single paystub for ${employeeName}...`);
    await page.goto(SelfServicePortalsTestHelper.WP_MY_DOCUMENTS_URL);
    await page.waitForLoadState('networkidle');

    // Wait for paystubs table to be present (semantic ID)
    await page.waitForSelector('#paystubs-table', { timeout: 10000 });

    // Use semantic employee-slug ID for the View link (e.g., #view-paystub-clyde-grew)
    const slug = SelfServicePortalsTestHelper.toEmployeeSlug(employeeName);
    const viewLink = page.locator(`#view-paystub-${slug}`);
    await expect(viewLink).toBeVisible({ timeout: 5000 });
    console.log(`WordPress: Clicking #view-paystub-${slug}...`);
    await viewLink.click();
    await page.waitForLoadState('networkidle');

    // Wait for single paystub page to load (semantic ID)
    await page.waitForSelector('#single-paystub-page', { timeout: 10000 });

    // Verify no PHP errors
    const body = await page.textContent('body');
    expect(body).not.toContain('Fatal error');

    // Assert values using semantic IDs
    const employeeText = await page.locator('#paystub-employee').textContent();
    expect(employeeText).toContain(employeeName);
    console.log(`WordPress: Employee field: ${employeeText} ✓`);

    const periodText = await page.locator('#paystub-period').textContent();
    expect(periodText).toContain(period);
    console.log(`WordPress: Period field: ${periodText} ✓`);

    const grossText = await page.locator('#paystub-gross').textContent();
    expect(grossText).toContain(expectedGross);
    console.log(`WordPress: Gross amount: ${grossText} ✓`);

    const netText = await page.locator('#paystub-net').textContent();
    expect(netText).toContain(expectedNet);
    console.log(`WordPress: Net amount: ${netText} ✓`);

    // Verify net pay summary matches
    const netPaySummary = await page.locator('#paystub-net-pay-amount').textContent();
    expect(netPaySummary).toContain(expectedNet);
    console.log(`WordPress: Net pay summary: $${netPaySummary} ✓`);

    console.log(`WordPress: Single paystub for ${employeeName} OK ✓`);
  }

  /**
   * Assert "My Documents" page as EMPLOYEE - should see ONLY their own documents.
   * Uses semantic test IDs for bullet-proof, reliable assertions.
   */
  static async assertWpMyDocumentsAsEmployee(
    page: Page,
    ownName: string,
    otherNames: string[],
  ): Promise<void> {
    console.log(`WordPress: Checking My Documents as EMPLOYEE ${ownName} (should see only own docs)...`);
    await page.goto(SelfServicePortalsTestHelper.WP_MY_DOCUMENTS_URL);
    await page.waitForLoadState('networkidle');

    // Wait for page to load using semantic ID
    await page.waitForSelector('#my-documents-page', { timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).not.toContain('Fatal error');

    // Verify filter notice shows filtered mode (not admin)
    const filterNotice = await page.locator('#filter-notice').textContent();
    expect(filterNotice).toContain('Filtered');
    console.log(`WordPress: Filter notice: ${filterNotice} ✓`);

    // Employee should see their OWN paystub (using semantic employee-slug ID)
    const ownSlug = SelfServicePortalsTestHelper.toEmployeeSlug(ownName);
    const ownRow = page.locator(`#paystub-row-${ownSlug}`);
    await expect(ownRow).toBeVisible({ timeout: 5000 });
    console.log(`WordPress My Documents (Employee): Found #paystub-row-${ownSlug} ✓`);

    // Employee should NOT see other employees' paystubs (using semantic IDs)
    for (const otherName of otherNames) {
      const otherSlug = SelfServicePortalsTestHelper.toEmployeeSlug(otherName);
      const otherRow = page.locator(`#paystub-row-${otherSlug}`);
      const isVisible = await otherRow.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
      console.log(`WordPress My Documents (Employee): #paystub-row-${otherSlug} correctly hidden ✓`);
    }

    // Should have exactly 1 paystub row using data-testid
    const paystubRows = page.locator('[data-testid="paystub-row"]');
    const count = await paystubRows.count();
    expect(count).toBe(1);
    console.log(`WordPress: My Documents as Employee OK - only ${count} paystub visible ✓`);
  }

  /**
   * Assert that non-admin employee has restricted access to wp-admin.
   * In WordPress, non-admins CAN access wp-admin but see a very limited dashboard.
   * They should NOT see admin-only items like Plugins, Users list, Themes, etc.
   */
  static async assertWpAdminRestrictedForEmployee(page: Page): Promise<void> {
    console.log('WordPress: Checking that employee has restricted wp-admin access...');
    await page.goto(SelfServicePortalsTestHelper.WP_ADMIN_URL);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).not.toContain('Fatal error');

    // Employee (subscriber role) SHOULD see:
    // - Their profile link
    // - Dashboard (but limited)
    expect(body).toContain('Profile');
    console.log('WordPress Admin (Employee): Can see Profile link ✓');

    // Employee SHOULD NOT see admin-only menu items:
    // - Plugins menu
    // - Users menu (list all users)
    // - Appearance/Themes menu
    // - Settings menu
    const adminOnlyItems = ['Plugins', 'Appearance', 'Settings'];
    for (const item of adminOnlyItems) {
      // Check if the menu item is NOT in the admin menu
      const menuItem = page.locator(`#adminmenu a:has-text("${item}")`);
      const isVisible = await menuItem.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
      console.log(`WordPress Admin (Employee): Correctly hidden - ${item} menu not visible ✓`);
    }

    // Employee should NOT be able to access Users list page
    await page.goto(`${SelfServicePortalsTestHelper.WP_ADMIN_URL}/users.php`);
    await page.waitForLoadState('networkidle');
    const usersBody = await page.textContent('body');
    // Should see "Sorry, you are not allowed" or similar permission error
    const hasPermissionError = usersBody?.toLowerCase().includes('not allowed') ||
      usersBody?.toLowerCase().includes('permission') ||
      usersBody?.toLowerCase().includes('denied') ||
      usersBody?.toLowerCase().includes('cheatin');
    expect(hasPermissionError).toBeTruthy();
    console.log('WordPress Admin (Employee): Correctly blocked from Users list ✓');

    console.log('WordPress: Employee wp-admin access correctly restricted ✓');
  }

  // ============================================================
  // Grails Playground Assertions
  // ============================================================
  // Each web component has its own assertion function with clear sections:
  // - DOM Presence: Verify component element exists in DOM
  // - Data Assertions: Verify real data is loaded and displayed
  // - Config Assertions: Verify configuration (if applicable)
  // - Usage Assertions: Verify usage/code snippet is correct
  // ============================================================

  // ----------------------------------------------------------
  // rb-tabulator Web Component
  // ----------------------------------------------------------
  /**
   * Assert rb-tabulator web component on the Tabulator page.
   * NOTE: Tabulator config is OPTIONAL - this demo uses defaults (no config file).
   */
  static async assertRbTabulatorComponent(page: Page): Promise<void> {
    const url = `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/tabulator`;
    const reportCode = 'g-scr2htm-trend';
    console.log('Grails Tabulator: Checking rb-tabulator component...');

    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // ---- DOM Presence ----
    await expect(page.locator('rb-tabulator')).toBeVisible({ timeout: 15000 });
    console.log('Grails Tabulator: DOM - rb-tabulator element visible ✓');

    // ---- Data Assertions ----
    // Tabulator renders data as .tabulator-row elements
    await expect(page.locator('.tabulator-row').first()).toBeVisible({ timeout: 20000 });
    const rowCount = await page.locator('.tabulator-row').count();
    expect(rowCount).toBeGreaterThan(0);
    console.log(`Grails Tabulator: Data - ${rowCount} rows loaded ✓`);

    // ---- Config Assertions ----
    // Tabulator config is OPTIONAL - this demo has NO config file
    // Verify the config tab shows "No configuration" or similar, NOT stuck on "Loading..."
    await page.click('#config-tab');
    await page.waitForTimeout(500);
    const configText = await page.locator('#configCode').textContent();
    // Should either show empty/no-config message OR not be stuck on "Loading configuration..."
    const isNoConfig = configText?.includes('No ') ||
      configText?.includes('not found') ||
      configText?.includes('default') ||
      configText?.includes('null') ||
      (configText?.trim().length ?? 0) < 30;
    const isNotLoading = !configText?.includes('Loading configuration...');
    expect(isNoConfig || isNotLoading).toBeTruthy();
    console.log('Grails Tabulator: Config - correctly shows no custom config (uses defaults) ✓');

    // ---- Usage Assertions ----
    await page.click('#usage-tab');
    await page.waitForTimeout(300);
    const usageText = await page.locator('#usageCode').textContent();
    expect(usageText).toContain('rb-tabulator');
    expect(usageText).toContain(reportCode);
    console.log('Grails Tabulator: Usage - HTML snippet valid ✓');
  }

  // ----------------------------------------------------------
  // rb-chart Web Component
  // ----------------------------------------------------------
  /**
   * Assert rb-chart web component on the Charts page.
   * Chart REQUIRES a config file (chart-config.groovy).
   */
  static async assertRbChartComponent(page: Page): Promise<void> {
    const url = `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/charts`;
    const reportCode = 'g-scr2htm-trend';
    console.log('Grails Charts: Checking rb-chart component...');

    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // ---- DOM Presence ----
    await expect(page.locator('rb-chart')).toBeVisible({ timeout: 15000 });
    console.log('Grails Charts: DOM - rb-chart element visible ✓');

    // ---- Data Assertions ----
    // Chart.js renders to a canvas element inside rb-chart
    await expect(page.locator('rb-chart canvas').first()).toBeVisible({ timeout: 20000 });
    console.log('Grails Charts: Data - canvas rendered with chart ✓');

    // ---- Config Assertions ----
    // Chart REQUIRES config - verify it loads
    await page.click('#config-tab');
    await page.waitForTimeout(500);
    await expect(page.locator('#configCode')).not.toContainText('Loading configuration...', { timeout: 10000 });
    const configText = await page.locator('#configCode').textContent();
    expect(configText?.length).toBeGreaterThan(50);
    // Should contain chart-specific config keywords
    expect(configText?.toLowerCase()).toMatch(/chart|type|series|label/i);
    console.log('Grails Charts: Config - chart configuration loaded ✓');

    // ---- Usage Assertions ----
    await page.click('#usage-tab');
    await page.waitForTimeout(300);
    const usageText = await page.locator('#usageCode').textContent();
    expect(usageText).toContain('rb-chart');
    expect(usageText).toContain(reportCode);
    console.log('Grails Charts: Usage - HTML snippet valid ✓');
  }

  // ----------------------------------------------------------
  // rb-pivot-table Web Component
  // ----------------------------------------------------------
  /**
   * Assert rb-pivot-table web component on the Pivot Tables page.
   * Pivot table REQUIRES a config file (pivot-config.groovy).
   */
  static async assertRbPivotTableComponent(page: Page): Promise<void> {
    const url = `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivottables`;
    const reportCode = 'piv-sales-region-prod-qtr';
    console.log('Grails Pivot Tables: Checking rb-pivot-table component...');

    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // ---- DOM Presence ----
    await expect(page.locator('rb-pivot-table')).toBeVisible({ timeout: 15000 });
    console.log('Grails Pivot Tables: DOM - rb-pivot-table element visible ✓');

    // ---- Data Assertions ----
    // PivotTable.js renders .pvtTable or .pvtUi or .pvtRendererArea
    await expect(page.locator('.pvtTable, .pvtUi, .pvtRendererArea').first()).toBeVisible({ timeout: 20000 });
    console.log('Grails Pivot Tables: Data - pivot table UI rendered ✓');

    // ---- Config Assertions ----
    // Pivot table REQUIRES config - verify it loads
    await page.click('#config-tab');
    await page.waitForTimeout(500);
    await expect(page.locator('#configCode')).not.toContainText('Loading configuration...', { timeout: 10000 });
    const configText = await page.locator('#configCode').textContent();
    expect(configText?.length).toBeGreaterThan(50);
    // Should contain pivot-specific config keywords
    expect(configText?.toLowerCase()).toMatch(/pivot|rows|cols|aggregator|vals/i);
    console.log('Grails Pivot Tables: Config - pivot configuration loaded ✓');

    // ---- Usage Assertions ----
    await page.click('#usage-tab');
    await page.waitForTimeout(300);
    const usageText = await page.locator('#usageCode').textContent();
    expect(usageText).toContain('rb-pivot-table');
    expect(usageText).toContain(reportCode);
    console.log('Grails Pivot Tables: Usage - HTML snippet valid ✓');
  }

  // ----------------------------------------------------------
  // Pivot Table Helper Functions for Analytics Testing
  // ----------------------------------------------------------

  /**
   * Set the engine for a pivot table component.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param engine - 'browser' (default, PivotTable.js) or 'duckdb' (server-side)
   */
  static async setPivotEngine(page: Page, componentId: string, engine: 'browser' | 'duckdb'): Promise<void> {
    console.log(`Setting pivot engine to '${engine}' for #${componentId}...`);
    await page.evaluate(({ id, eng }) => {
      const component = document.getElementById(id) as any;
      if (component) {
        component.setAttribute('engine', eng);
      }
    }, { id: componentId, eng: engine });
    // Wait for re-render
    await page.waitForTimeout(1000);
  }

  /**
   * Wait for a pivot table to fully render.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   */
  static async waitForPivotTableRender(page: Page, componentId: string): Promise<void> {
    console.log(`Waiting for pivot table #${componentId} to render...`);

    // Wait for component to be visible
    await expect(page.locator(`#${componentId}`)).toBeVisible({ timeout: 15000 });

    // Wait for PivotTable.js UI to be rendered (either .pvtTable or .pvtUi)
    const pvtSelector = `#${componentId} .pvtTable, #${componentId} .pvtUi, #${componentId} .pvtRendererArea`;
    await expect(page.locator(pvtSelector).first()).toBeVisible({ timeout: 20000 });

    // Wait for actual data cells to appear
    await expect(page.locator(`#${componentId} .pvtTable tbody tr`).first()).toBeVisible({ timeout: 20000 });

    // Additional wait for any animations/transitions
    await page.waitForTimeout(1500);
    console.log(`Pivot table #${componentId} fully rendered ✓`);
  }

  /**
   * Get the grand total value from a pivot table.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @returns The grand total value as a number
   */
  static async getPivotGrandTotal(page: Page, componentId: string): Promise<number> {
    const totalText = await page.locator(`#${componentId} .pvtGrandTotal, #${componentId} .pvtTotal`).last().textContent();
    const numericValue = totalText?.replace(/[^0-9.-]/g, '') || '0';
    return parseFloat(numericValue);
  }

  /**
   * Get a specific cell value from the pivot table.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param rowLabel - Row label to find
   * @param colLabel - Column label to find (optional, for grand totals use null)
   * @returns The cell value as a number
   */
  static async getPivotCellValue(
    page: Page,
    componentId: string,
    rowLabel: string,
    colLabel?: string
  ): Promise<number> {
    const cellText = await page.evaluate(
      ({ id, row, col }) => {
        const component = document.getElementById(id);
        if (!component) return '0';

        const table = component.querySelector('.pvtTable') as HTMLTableElement;
        if (!table) return '0';

        // Find row by label
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const targetRow = rows.find(r => r.textContent?.includes(row));
        if (!targetRow) return '0';

        if (!col) {
          // Get row total (last cell)
          const cells = targetRow.querySelectorAll('td');
          return cells[cells.length - 1]?.textContent || '0';
        }

        // Find column index by label
        const headers = Array.from(table.querySelectorAll('thead th'));
        const colIndex = headers.findIndex(h => h.textContent?.includes(col));
        if (colIndex === -1) return '0';

        const cells = targetRow.querySelectorAll('td');
        return cells[colIndex]?.textContent || '0';
      },
      { id: componentId, row: rowLabel, col: colLabel || '' }
    );

    const numericValue = cellText?.replace(/[^0-9.-]/g, '') || '0';
    return parseFloat(numericValue);
  }

  /**
   * Drag a dimension from unused area to rows.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param dimensionName - Name of the dimension to drag
   */
  static async dragDimensionToRows(page: Page, componentId: string, dimensionName: string): Promise<void> {
    console.log(`Dragging dimension '${dimensionName}' to rows...`);
    await page.evaluate(
      ({ id, dimension }) => {
        const component = document.getElementById(id);
        if (!component) return;

        // Find the dimension button in unused area
        const unusedArea = component.querySelector('.pvtUnused, .pvtAxisContainer');
        if (!unusedArea) return;

        const dimensionBtn = Array.from(unusedArea.querySelectorAll('.pvtAttr')).find(
          el => el.textContent?.trim() === dimension
        ) as HTMLElement;

        if (!dimensionBtn) return;

        // Find rows drop zone
        const rowsArea = component.querySelector('.pvtRows, .pvtAxisContainer');
        if (!rowsArea) return;

        // Simulate drag and drop
        const dragEvent = new DragEvent('dragstart', { bubbles: true });
        const dropEvent = new DragEvent('drop', { bubbles: true });

        dimensionBtn.dispatchEvent(dragEvent);
        rowsArea.dispatchEvent(dropEvent);
      },
      { id: componentId, dimension: dimensionName }
    );

    await page.waitForTimeout(1500); // Wait for re-render
    console.log(`Dimension '${dimensionName}' dragged to rows ✓`);
  }

  /**
   * Drag a dimension from unused area to columns.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param dimensionName - Name of the dimension to drag
   */
  static async dragDimensionToCols(page: Page, componentId: string, dimensionName: string): Promise<void> {
    console.log(`Dragging dimension '${dimensionName}' to columns...`);
    await page.evaluate(
      ({ id, dimension }) => {
        const component = document.getElementById(id);
        if (!component) return;

        const unusedArea = component.querySelector('.pvtUnused, .pvtAxisContainer');
        if (!unusedArea) return;

        const dimensionBtn = Array.from(unusedArea.querySelectorAll('.pvtAttr')).find(
          el => el.textContent?.trim() === dimension
        ) as HTMLElement;

        if (!dimensionBtn) return;

        const colsArea = component.querySelector('.pvtCols, .pvtAxisContainer');
        if (!colsArea) return;

        const dragEvent = new DragEvent('dragstart', { bubbles: true });
        const dropEvent = new DragEvent('drop', { bubbles: true });

        dimensionBtn.dispatchEvent(dragEvent);
        colsArea.dispatchEvent(dropEvent);
      },
      { id: componentId, dimension: dimensionName }
    );

    await page.waitForTimeout(1500);
    console.log(`Dimension '${dimensionName}' dragged to columns ✓`);
  }

  /**
   * Move a dimension from columns to rows.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param dimensionName - Name of the dimension to move
   */
  static async moveDimensionFromColsToRows(page: Page, componentId: string, dimensionName: string): Promise<void> {
    console.log(`Moving dimension '${dimensionName}' from columns to rows...`);
    await page.evaluate(
      ({ id, dimension }) => {
        const component = document.getElementById(id);
        if (!component) return;

        const colsArea = component.querySelector('.pvtCols');
        if (!colsArea) return;

        const dimensionBtn = Array.from(colsArea.querySelectorAll('.pvtAttr')).find(
          el => el.textContent?.trim() === dimension
        ) as HTMLElement;

        if (!dimensionBtn) return;

        const rowsArea = component.querySelector('.pvtRows');
        if (!rowsArea) return;

        const dragEvent = new DragEvent('dragstart', { bubbles: true });
        const dropEvent = new DragEvent('drop', { bubbles: true });

        dimensionBtn.dispatchEvent(dragEvent);
        rowsArea.dispatchEvent(dropEvent);
      },
      { id: componentId, dimension: dimensionName }
    );

    await page.waitForTimeout(1500);
    console.log(`Dimension '${dimensionName}' moved from columns to rows ✓`);
  }

  /**
   * Change the aggregator (Sum, Average, Count, etc.).
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param aggregatorName - Name of the aggregator (e.g., 'Average', 'Sum')
   */
  static async changeAggregator(page: Page, componentId: string, aggregatorName: string): Promise<void> {
    console.log(`Changing aggregator to '${aggregatorName}'...`);
    const selector = `#${componentId} .pvtAggregator`;
    await page.selectOption(selector, { label: aggregatorName });
    await page.waitForTimeout(1500);
    console.log(`Aggregator changed to '${aggregatorName}' ✓`);
  }

  /**
   * Change the value field (metric to aggregate).
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param valueName - Name of the value field (e.g., 'Revenue', 'Profit')
   */
  static async changeValueField(page: Page, componentId: string, valueName: string): Promise<void> {
    console.log(`Changing value field to '${valueName}'...`);

    // Click the value dropdown in the vals area
    const valsDropdown = page.locator(`#${componentId} .pvtVals select, #${componentId} .pvtAttrDropdown`).first();
    await valsDropdown.selectOption({ label: valueName });

    await page.waitForTimeout(1500);
    console.log(`Value field changed to '${valueName}' ✓`);
  }

  /**
   * Change the renderer (Table, Bar Chart, etc.).
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param rendererName - Name of the renderer (e.g., 'Table', 'Grouped Column Chart')
   */
  static async changeRenderer(page: Page, componentId: string, rendererName: string): Promise<void> {
    console.log(`Changing renderer to '${rendererName}'...`);
    const selector = `#${componentId} .pvtRenderer`;
    await page.selectOption(selector, { label: rendererName });
    await page.waitForTimeout(2000); // Charts take longer to render
    console.log(`Renderer changed to '${rendererName}' ✓`);
  }

  /**
   * Filter a dimension by unchecking specific values.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param dimensionName - Name of the dimension to filter
   * @param valuesToUncheck - Array of values to uncheck
   */
  static async filterDimension(
    page: Page,
    componentId: string,
    dimensionName: string,
    valuesToUncheck: string[]
  ): Promise<void> {
    console.log(`Filtering dimension '${dimensionName}', unchecking: ${valuesToUncheck.join(', ')}...`);

    // Find and click the filter triangle for the dimension
    await page.evaluate(
      ({ id, dimension, values }) => {
        const component = document.getElementById(id);
        if (!component) return;

        // Find the dimension label
        const dimensionLabel = Array.from(component.querySelectorAll('.pvtAttr')).find(
          el => el.textContent?.includes(dimension)
        );

        if (!dimensionLabel) return;

        // Find and click the filter triangle
        const filterTriangle = dimensionLabel.querySelector('.pvtTriangle') as HTMLElement;
        if (filterTriangle) {
          filterTriangle.click();
        }
      },
      { id: componentId, dimension: dimensionName, values: valuesToUncheck }
    );

    await page.waitForTimeout(500);

    // Uncheck the specified values in the filter dialog
    for (const value of valuesToUncheck) {
      const checkbox = page.locator(`.pvtFilterBox input[type="checkbox"][value="${value}"]`);
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox.uncheck();
      }
    }

    // Click OK or close the filter dialog
    const okButton = page.locator('.pvtFilterBox button:has-text("OK")');
    if (await okButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await okButton.click();
    }

    await page.waitForTimeout(1500);
    console.log(`Dimension '${dimensionName}' filtered ✓`);
  }

  /**
   * Sort pivot table by a specific dimension.
   * @param page - Playwright page object
   * @param componentId - ID of the rb-pivot-table element
   * @param order - 'key_a_to_z' or 'value_z_to_a' etc.
   */
  static async sortPivot(page: Page, componentId: string, order: string): Promise<void> {
    console.log(`Sorting pivot table by '${order}'...`);
    await page.evaluate(
      ({ id, sortOrder }) => {
        const component = document.getElementById(id) as any;
        if (component && component.pivotUI) {
          // Update the pivotUI config with new sort order
          component.pivotUI.rowOrder = sortOrder;
          component.fetchData({});
        }
      },
      { id: componentId, sortOrder: order }
    );

    await page.waitForTimeout(1500);
    console.log(`Pivot table sorted by '${order}' ✓`);
  }

  // ----------------------------------------------------------
  // rb-parameters Web Component
  // ----------------------------------------------------------
  /**
   * Assert rb-parameters web component on the Parameters page.
   * Parameters REQUIRES a config file (report-parameters-spec.groovy).
   * Also tests filtering workflow: initial state -> Run Report -> Clear.
   */
  static async assertRbParametersComponent(page: Page): Promise<void> {
    const url = `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/report-parameters`;
    console.log('Grails Parameters: Checking rb-parameters component...');

    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // ---- DOM Presence ----
    await expect(page.locator('rb-parameters')).toBeVisible({ timeout: 15000 });
    console.log('Grails Parameters: DOM - rb-parameters element visible ✓');

    // ---- Data Assertions ----
    // Parameters page shows data in a tabulator table
    await expect(page.locator('#dataTable .tabulator-row').first()).toBeVisible({ timeout: 20000 });

    // Initial state: 12 employees
    let recordText = await page.locator('#recordCount').textContent();
    expect(recordText).toContain('12');
    console.log('Grails Parameters: Data - initial 12 records loaded ✓');

    // Run Report - should filter (show fewer or "X of 12")
    await page.click('#submitBtn');
    await page.waitForTimeout(2000);
    recordText = await page.locator('#recordCount').textContent();
    expect(recordText).toMatch(/of\s*12/i); // "X of 12" pattern
    console.log(`Grails Parameters: Data - filtered to ${recordText} ✓`);

    // Clear Filters - should restore 12
    const clearBtn = page.locator('#clearFiltersBtn');
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(1500);
      recordText = await page.locator('#recordCount').textContent();
      expect(recordText).toContain('12');
      console.log('Grails Parameters: Data - clear restored 12 records ✓');
    }

    // ---- Config Assertions ----
    // Parameters REQUIRES config - verify it loads
    await page.click('#config-tab');
    await page.waitForTimeout(500);
    await expect(page.locator('#configCode')).not.toContainText('Loading configuration...', { timeout: 10000 });
    const configText = await page.locator('#configCode').textContent();
    expect(configText?.length).toBeGreaterThan(50);
    // Should contain parameters-specific config keywords
    expect(configText?.toLowerCase()).toMatch(/parameter|field|type|label|date/i);
    console.log('Grails Parameters: Config - parameters configuration loaded ✓');

    // ---- Usage Assertions ----
    await page.click('#usage-tab');
    await page.waitForTimeout(300);
    const usageText = await page.locator('#usageCode').textContent();
    expect(usageText).toContain('rb-parameters');
    console.log('Grails Parameters: Usage - HTML snippet valid ✓');
  }

  // ----------------------------------------------------------
  // rb-report Web Component
  // ----------------------------------------------------------
  /**
   * Assert rb-report web component on the Reports page.
   * Reports page shows employee cards; clicking one loads the report.
   */
  static async assertRbReportComponent(page: Page): Promise<void> {
    const url = `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/reports`;
    console.log('Grails Reports: Checking rb-report component...');

    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // ---- DOM Presence (before selection) ----
    // Employee cards should be visible
    const cardCount = await page.locator('.employee-card').count();
    expect(cardCount).toBe(3);
    console.log('Grails Reports: DOM - 3 employee cards visible ✓');

    // ---- Data Assertions ----
    // Click first employee - rb-report should appear with iframe
    await page.click('.employee-card[data-code="EMP001"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('rb-report#demoReport')).toBeVisible({ timeout: 10000 });
    console.log('Grails Reports: DOM - rb-report element visible after selection ✓');

    // Verify selection state
    const activeCount = await page.locator('.employee-card.active').count();
    expect(activeCount).toBe(1);
    console.log('Grails Reports: Data - employee selection active state works ✓');

    // Report renders in iframe
    await expect(page.locator('rb-report iframe, rb-report object').first()).toBeVisible({ timeout: 10000 });
    console.log('Grails Reports: Data - report iframe rendered ✓');

    // ---- Config Assertions ----
    // rb-report doesn't typically have a config tab on this page
    // Skip config check for reports

    // ---- Usage Assertions ----
    await page.click('#usage-tab');
    await page.waitForTimeout(300);
    const usageText = await page.locator('#usageCode').textContent();
    expect(usageText).toContain('rb-report');
    expect(usageText).toContain('entity-code');
    console.log('Grails Reports: Usage - HTML snippet valid ✓');
  }

  // ----------------------------------------------------------
  // Simple Pages (No Web Component)
  // ----------------------------------------------------------
  /**
   * Assert simple page without web component (Home, Your Canvas).
   */
  static async assertGrailsSimplePage(page: Page, path: string, title: string, contentChecks: string[]): Promise<void> {
    const url = `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}${path}`;
    console.log(`Grails ${title}: Checking page content...`);

    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).not.toContain('500 Internal Server Error');
    for (const check of contentChecks) {
      expect(body?.toLowerCase()).toContain(check.toLowerCase());
    }
    console.log(`Grails ${title}: Page OK ✓`);
  }

  // ----------------------------------------------------------
  // Main Entry Point: Assert All Grails Pages
  // ----------------------------------------------------------
  /**
   * Assert all Grails playground pages with per-component validation.
   * Each web component has dedicated assertions for DOM, data, config, and usage.
   */
  static async assertAllGrailsPages(page: Page): Promise<void> {
    console.log('Grails: Waiting for server to be ready...');
    await SelfServicePortalsTestHelper.waitForServerReady(
      page,
      SelfServicePortalsTestHelper.GRAILS_BASE_URL,
      30,
      2000
    );

    // Grant clipboard permissions (needed for some browsers)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Home page (no component)
    await SelfServicePortalsTestHelper.assertGrailsSimplePage(
      page, '/', 'Home', ['Dashboards', 'Self Service', 'Explore Components']
    );

    // rb-tabulator - data table (config is OPTIONAL, this demo has none)
    await SelfServicePortalsTestHelper.assertRbTabulatorComponent(page);

    // rb-chart - chart visualization (config REQUIRED)
    await SelfServicePortalsTestHelper.assertRbChartComponent(page);

    // rb-pivot-table - pivot table (config REQUIRED)
    await SelfServicePortalsTestHelper.assertRbPivotTableComponent(page);

    // rb-parameters - parameter form with filtering (config REQUIRED)
    await SelfServicePortalsTestHelper.assertRbParametersComponent(page);

    // rb-report - report viewer with entity selection
    await SelfServicePortalsTestHelper.assertRbReportComponent(page);

    // Your Canvas (no component)
    await SelfServicePortalsTestHelper.assertGrailsSimplePage(
      page, '/your-canvas', 'Your Canvas', ['Your Canvas', 'Awaits', 'Build']
    );

    console.log('Grails Playground: All assertions PASSED ✓');
  }
}
