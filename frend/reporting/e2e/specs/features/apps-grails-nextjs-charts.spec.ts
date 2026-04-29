import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';

// ============================================================
// CHART GALLERY E2E TESTS
// Verifies each of the 11 rb-chart examples loads and renders
// a Chart.js canvas on both Grails and Next.js playgrounds,
// plus Configuration and Usage tabs.
//
// Scope: Our web component fetches data and renders a chart.
// Out of scope: Chart.js rendering correctness — that's
// Chart.js's job. We verify canvas exists with real dimensions.
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
 * All 11 chart examples in UI rendering order.
 * IDs match component-id values in charts-examples-script.groovy.
 */
const EXAMPLES = [
  { id: 'monthlySalesTrend', desc: 'Line Chart — 12 months revenue trend' },
  { id: 'salesByRegion', desc: 'Bar Chart — 6 regions compared' },
  { id: 'revenueVsExpenses', desc: 'Grouped Bar Chart — quarterly R vs E' },
  { id: 'expenseBreakdown', desc: 'Pie Chart — 5 expense categories' },
  { id: 'revenueAndProfitMargin', desc: 'Dual Y-Axis Mixed Chart — bars + line' },
  { id: 'quarterlyRevenueByProduct', desc: 'Stacked Bar Chart — 3 product lines' },
  { id: 'portfolioAllocation', desc: 'Doughnut Chart — 5 asset classes' },
  { id: 'budgetVsActual', desc: 'Area Chart — 8 months budget vs actual' },
  { id: 'topCustomersByRevenue', desc: 'Horizontal Bar Chart — 10 customers' },
  { id: 'employeePerformance', desc: 'Radar Chart — 7 skill dimensions' },
  { id: 'customerSatisfaction', desc: 'Polar Area Chart — 5 support channels' },
];

/**
 * Assert that an rb-chart web component rendered a Chart.js canvas WITH data.
 * Validates: component visible → canvas rendered → canvas has real dimensions
 *            → chart datasets contain actual data points.
 *
 * Why step 4 matters: Chart.js renders axes, gridlines, and titles even with
 * empty datasets, so canvas dimensions >50×50 alone does NOT prove data loaded.
 * Checking the web component's `data` property (a Svelte export → custom element
 * property) confirms the API returned rows and the chart transformed them.
 */
async function assertChartRendered(page: Page, id: string): Promise<void> {
  const card = page.locator(`#example-${id}`);

  // 1. Our web component is present and visible
  await expect(page.locator(`#rb-${id}`)).toBeVisible({ timeout: 20000 });
  console.log(`  #rb-${id} web component visible PASSED`);

  // 2. Chart.js renders to a <canvas> element inside the web component
  const canvas = card.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 20000 });
  console.log(`  #example-${id} Chart.js canvas rendered PASSED`);

  // 3. Canvas has non-zero dimensions — confirms the chart actually drew something
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(50);
  expect(box!.height).toBeGreaterThan(50);
  console.log(`  #example-${id} canvas dimensions: ${box!.width}x${box!.height} PASSED`);

  // 4. Chart has actual data — not just empty axes/gridlines.
  //    rb-chart exposes `data` as a custom-element property (Svelte export).
  //    After self-fetch, `data` is a Chart.js object: { labels: [...], datasets: [...] }.
  const dataInfo = await page.locator(`#rb-${id}`).evaluate((el: any) => {
    const d = el.data;
    if (!d) return { hasData: false, labels: 0, datasets: 0, points: 0 };
    const labels = d.labels?.length || 0;
    const datasets = d.datasets?.length || 0;
    const points = (d.datasets || []).reduce(
      (sum: number, ds: any) => sum + (ds.data?.length || 0), 0,
    );
    return { hasData: labels > 0 && points > 0, labels, datasets, points };
  });
  expect(dataInfo.hasData).toBe(true);
  console.log(`  #example-${id} chart data: ${dataInfo.datasets} dataset(s), ${dataInfo.labels} labels, ${dataInfo.points} data points PASSED`);
}

// ============================================================
// TEST SUITE
// ============================================================

test.describe('Chart Gallery Tests', () => {
  for (const app of PLAYGROUND_APPS) {
    electronBeforeAfterAllTest(
      `${app.name}: All 11 chart examples render with canvas`,
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

          // ── Navigate to /charts gallery ──
          console.log(
            `\n=== [${app.name}] Chart Gallery: Testing 11 examples ===\n`,
          );
          await page.goto(`${baseUrl}/charts`, { timeout: 30000 });
          await page.waitForLoadState('networkidle');
          await expect(page.locator('h4')).toContainText('Charts');
          console.log(`${app.name}: Charts page loaded ✓`);

          // ── Examples tab: test each chart ──
          for (const example of EXAMPLES) {
            await assertChartRendered(page, example.id);
          }

          // ── Configuration tab ──
          console.log('\n  --- Page Tabs ---');
          await page.click('#config-tab');
          await page.waitForTimeout(500);
          await expect(page.locator('#configCode')).not.toContainText('Loading configuration...', { timeout: 10000 });
          const configText = await page.locator('#configCode').textContent();
          expect(configText?.length).toBeGreaterThan(50);
          expect(configText?.toLowerCase()).toMatch(/chart|type|datasets|labels/i);
          console.log('  #config-tab Configuration tab: DSL loaded (length > 50, contains chart keywords) PASSED');

          // ── Usage tab ──
          await page.click('#usage-tab');
          await page.waitForTimeout(300);
          const usageText = await page.locator('#usageCode').textContent();
          expect(usageText).toContain('rb-chart');
          console.log('  #usage-tab Usage tab: contains "rb-chart" HTML snippet PASSED');

          // ── All examples verified ──
          console.log(
            `\n=== [${app.name}] Chart Gallery: ALL 11 PASSED ✓ ===\n`,
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
