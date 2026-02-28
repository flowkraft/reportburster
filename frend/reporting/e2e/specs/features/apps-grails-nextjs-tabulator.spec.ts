import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';

// ============================================================
// TABULATOR GALLERY E2E TESTS
// Verifies each rb-tabulator example loads and renders data
// on both Grails and Next.js playgrounds, plus Configuration
// and Usage tabs.
//
// Scope: Our web component fetches data and renders a table.
// Out of scope: Tabulator.js internal features (virtual DOM,
// responsive hiding, etc.) — those are Tabulator's job.
// ============================================================

const PLAYGROUND_APPS = [
  {
    appId: SelfServicePortalsTestHelper.APP_ID_GRAILS,
    appName: 'grails' as const,
    name: 'Grails',
  },
  {
    appId: SelfServicePortalsTestHelper.APP_ID_NEXT,
    appName: 'nextjs' as const,
    name: 'Next.js',
  },
];

/**
 * Tabulator examples with expected minimum row counts.
 * Row counts derived from tab-examples-script.groovy.
 * Order matches the UI rendering order (Layout → Data → Interaction).
 */
const EXAMPLES: { id: string; minRows: number }[] = [
  // ── Layout (23) ──
  { id: 'virtualDomVertical', minRows: 15 },
  { id: 'virtualDomHorizontal', minRows: 5 },
  { id: 'fitToData', minRows: 5 },
  { id: 'fitToDataAndFill', minRows: 5 },
  { id: 'fitToDataAndStretchLastColumn', minRows: 5 },
  { id: 'fitTableAndColumnsToData', minRows: 5 },
  { id: 'fitToWidth', minRows: 7 },
  { id: 'responsiveLayout', minRows: 7 },
  { id: 'responsiveLayoutCollapsedList', minRows: 5 },
  { id: 'automaticColumnGeneration', minRows: 5 },
  { id: 'resizableColumns', minRows: 5 },
  { id: 'resizeGuides', minRows: 6 },
  { id: 'columnGroups', minRows: 5 },
  { id: 'verticalColumnHeaders', minRows: 5 },
  { id: 'rowHeader', minRows: 6 },
  { id: 'frozenColumns', minRows: 7 },
  { id: 'frozenRows', minRows: 13 },
  { id: 'nestedDataTrees', minRows: 2 },
  { id: 'formatters', minRows: 7 },
  { id: 'persistentConfiguration', minRows: 6 },
  { id: 'columnCalculations', minRows: 7 },
  { id: 'noColumnHeaders', minRows: 6 },
  { id: 'rtlTextDirection', minRows: 5 },

  // ── Data (6) ──
  { id: 'editableData', minRows: 5 },
  { id: 'validateUserInput', minRows: 5 },
  { id: 'filterDataInHeader', minRows: 10 },
  { id: 'sorters', minRows: 8 },
  { id: 'groupingData', minRows: 5 },
  { id: 'pagination', minRows: 5 },

  // ── Interaction (6) ──
  { id: 'selectableRows', minRows: 5 },
  { id: 'selectableRowsWithTickbox', minRows: 3 },
  { id: 'selectableCellRange', minRows: 5 },
  { id: 'selectableCellRangeWithClipboard', minRows: 3 },
  { id: 'movableRows', minRows: 6 },
  { id: 'movableRowsWithGroups', minRows: 6 },
];

/**
 * Assert that an rb-tabulator web component rendered with data.
 */
async function assertTabulatorRendered(
  page: Page,
  example: { id: string; minRows: number },
): Promise<void> {
  const { id, minRows } = example;

  // 1. Our web component is present and visible
  await expect(page.locator(`#rb-${id}`)).toBeVisible({ timeout: 20000 });
  console.log(`  #rb-${id} web component visible PASSED`);

  // 2. Tabulator initialized — .tabulator-tableholder is Tabulator's main container
  const card = page.locator(`#example-${id}`);
  await expect(
    card.locator('.tabulator-tableholder').first(),
  ).toBeVisible({ timeout: 20000 });
  console.log(`  #example-${id} Tabulator initialized PASSED`);

  // 3. Data loaded — .tabulator-row elements represent rendered data rows
  await expect(card.locator('.tabulator-row').first()).toBeVisible({ timeout: 20000 });
  const rowCount = await card.locator('.tabulator-row').count();
  expect(rowCount).toBeGreaterThanOrEqual(minRows);
  console.log(`  #example-${id} data rendered: ${rowCount} rows (expected >=${minRows}) PASSED`);
}

// ============================================================
// TEST SUITE
// ============================================================

test.describe('Tabulator Gallery Tests', () => {
  for (const app of PLAYGROUND_APPS) {
    electronBeforeAfterAllTest(
      `${app.name}: All tabulator examples render with data`,
      async ({ beforeAfterEach: firstPage }) => {
        test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);
        let externalBrowser = null;

        try {
          // Start the playground app via Electron UI
          await SelfServicePortalsTestHelper.startApp(
            new FluentTester(firstPage).gotoApps(),
            app.appId,
          );

          // Open external Chromium browser for page assertions
          const { browser, page } =
            await SelfServicePortalsTestHelper.createExternalBrowser();
          externalBrowser = browser;

          const baseUrl =
            app.appName === 'grails'
              ? SelfServicePortalsTestHelper.GRAILS_BASE_URL
              : SelfServicePortalsTestHelper.NEXT_BASE_URL;

          await SelfServicePortalsTestHelper.waitForServerReady(page, baseUrl);

          // ── Navigate to /tabulator gallery ──
          console.log(
            `\n=== [${app.name}] Tabulator Gallery: Testing ${EXAMPLES.length} examples ===\n`,
          );
          await page.goto(`${baseUrl}/tabulator`, { timeout: 30000 });
          await page.waitForLoadState('networkidle');
          await expect(page.locator('h4')).toContainText('Data Tables');
          console.log(`${app.name}: Data Tables page loaded ✓`);

          // ── Examples tab: test each example ──
          for (const example of EXAMPLES) {
            await assertTabulatorRendered(page, example);
          }

          // ── Data identity spot-checks ──
          console.log('\n  --- Data Identity Spot-Checks ---');

          // frozenRows: the summary row "*** TOTALS ***"
          const frozenText = await page
            .locator('#example-frozenRows .tabulator-row')
            .first()
            .textContent();
          expect(frozenText).toContain('TOTALS');
          console.log('  #example-frozenRows data identity: contains "TOTALS" summary row PASSED');

          // fitToData: "Nora Keane" — first person in fillData
          const fitText = await page
            .locator('#example-fitToData .tabulator-row')
            .first()
            .textContent();
          expect(fitText).toContain('Nora Keane');
          console.log('  #example-fitToData data identity: first row contains "Nora Keane" PASSED');

          // rtlTextDirection: Arabic name
          const rtlText = await page.locator('#example-rtlTextDirection').textContent();
          expect(rtlText).toContain('طارق نصر');
          console.log('  #example-rtlTextDirection data identity: contains Arabic name PASSED');

          // formatters: "Nora Keane" with known progress/rating data
          const formattersText = await page.locator('#example-formatters').textContent();
          expect(formattersText).toContain('Nora Keane');
          console.log('  #example-formatters data identity: contains "Nora Keane" PASSED');

          // ── Configuration tab ──
          console.log('\n  --- Page Tabs ---');
          await page.click('#config-tab');
          await page.waitForTimeout(500);
          await expect(page.locator('#configCode')).not.toContainText('Loading configuration...', { timeout: 10000 });
          const configText = await page.locator('#configCode').textContent();
          expect(configText?.length).toBeGreaterThan(50);
          expect(configText?.toLowerCase()).toMatch(/tabulator|columns|field|title/i);
          console.log('  #config-tab Configuration tab: DSL loaded (length > 50, contains tabulator keywords) PASSED');

          // ── Usage tab ──
          await page.click('#usage-tab');
          await page.waitForTimeout(300);
          const usageText = await page.locator('#usageCode').textContent();
          expect(usageText).toContain('rb-tabulator');
          console.log('  #usage-tab Usage tab: contains "rb-tabulator" HTML snippet PASSED');

          console.log(
            `\n=== [${app.name}] Tabulator Gallery: ALL ${EXAMPLES.length} PASSED ✓ ===\n`,
          );
        } finally {
          if (externalBrowser) {
            try {
              await SelfServicePortalsTestHelper.closeExternalBrowser(
                externalBrowser,
              );
            } catch (e) {
              console.error('Failed to close external browser:', e);
            }
          }
          try {
            await SelfServicePortalsTestHelper.stopApp(
              new FluentTester(firstPage).gotoApps(),
              app.appId,
            );
          } catch (e) {
            console.error(`Failed to stop ${app.name} app:`, e);
          }
        }
      },
    );
  }
});
