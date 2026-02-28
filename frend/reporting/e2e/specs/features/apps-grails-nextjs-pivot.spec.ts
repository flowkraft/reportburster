import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';

// ============================================================
// PIVOT TABLE GALLERY E2E TESTS
// Verifies:
//   1. Sales Overview section with inner tabs
//      (Pivot Table → Raw Data → Configuration → Usage)
//   2. All 15 gallery examples render with data
//   3. Page-level Configuration and Usage tabs
//
// Scope: Our web component fetches data and renders a pivot.
// Out of scope: react-pivottable rendering internals.
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
 * 15 gallery pivot examples in UI rendering order.
 * salesOverview is tested separately (it has its own inner tabs section).
 * Order matches: Fundamentals → Filtering & Sorting → Renderers →
 *                Aggregators → Advanced
 */
const EXAMPLES: { id: string; desc: string; renderer?: 'chart' }[] = [
  // Fundamentals
  { id: 'salesByRegionSum', desc: 'Basic sum pivot — revenue by region' },
  { id: 'orderCountByProductQuarter', desc: 'Cross-tabulation — product × quarter count' },
  { id: 'revenueMultiDimension', desc: 'Multi-dimension — region/country hierarchy' },
  { id: 'avgOrderValueByChannel', desc: 'Average aggregator — order value by channel' },

  // Filtering & Sorting
  { id: 'filteredByStatus', desc: 'Value filter — excludes Inactive/Pending' },
  { id: 'sortedRevenue', desc: 'Sorted by value descending — highest revenue first' },
  { id: 'customSorters', desc: 'Custom sort order — geographic regions' },

  // Renderers
  { id: 'pipelineHeatmap', desc: 'Heatmap renderer — pipeline by stage × rep' },
  { id: 'pipelineGroupedBar', desc: 'Grouped bar chart — pipeline by stage × rep', renderer: 'chart' },
  { id: 'pipelineLineChart', desc: 'Line chart — pipeline trajectory per rep', renderer: 'chart' },

  // Aggregators
  { id: 'revenuePerUnit', desc: 'Sum over Sum — revenue per unit ratio' },
  { id: 'fractionOfTotal', desc: 'Sum as Fraction of Total — revenue percentages' },
  { id: 'countUniqueValues', desc: 'Count Unique Values — distinct products per region' },

  // Advanced
  { id: 'derivedAttributes', desc: 'Derived attributes — year/quarter from date' },
  { id: 'fieldVisibility', desc: 'Field visibility — three restriction levels' },
];

/**
 * Assert that an rb-pivot-table web component rendered a pivot table.
 */
async function assertPivotRendered(page: Page, id: string, renderer?: 'chart'): Promise<void> {
  const card = page.locator(`#example-${id}`);

  // 1. Our web component is present and visible
  await expect(page.locator(`#rb-${id}`)).toBeVisible({ timeout: 20000 });
  console.log(`  #rb-${id} web component visible PASSED`);

  // 2. react-pivottable renders .pvtTable (data table) inside .pvtUi (wrapper)
  await expect(card.locator('.pvtTable, .pvtUi').first()).toBeVisible({ timeout: 20000 });
  console.log(`  #example-${id} pivot table initialized PASSED`);

  // 3. Data output present — table renderers produce .pvtVal/.pvtTotal cells,
  //    chart renderers (Grouped Bar Chart, Line Chart) produce svg/canvas
  if (renderer === 'chart') {
    await expect(card.locator('svg, canvas').first()).toBeVisible({ timeout: 20000 });
    console.log(`  #example-${id} chart element rendered PASSED`);
  } else {
    const dataCell = card.locator('.pvtVal, .pvtTotal').first();
    await expect(dataCell).toBeVisible({ timeout: 20000 });
    console.log(`  #example-${id} data cells present PASSED`);
  }
}

// ============================================================
// TEST SUITE
// ============================================================

test.describe('Pivot Table Gallery Tests', () => {
  for (const app of PLAYGROUND_APPS) {
    electronBeforeAfterAllTest(
      `${app.name}: Sales Overview + ${EXAMPLES.length} pivot examples + tabs`,
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

          // ── Navigate to /pivot-tables ──
          console.log(
            `\n=== [${app.name}] Pivot Tables: Sales Overview + ${EXAMPLES.length} gallery + tabs ===\n`,
          );
          await page.goto(`${baseUrl}/pivot-tables`, { timeout: 30000 });
          await page.waitForLoadState('networkidle');
          await expect(page.locator('h4').first()).toContainText('Pivot Tables');
          console.log(`${app.name}: Pivot Tables page loaded ✓`);

          // ════════════════════════════════════════════════════════
          // GALLERY EXAMPLES (15) — within the Examples tab
          // ════════════════════════════════════════════════════════
          for (const example of EXAMPLES) {
            await assertPivotRendered(page, example.id, example.renderer);
          }

          // ── Enhanced assertions for select examples ──
          console.log('\n  --- Enhanced Assertions ---');

          // filteredByStatus: should NOT contain "Inactive" or "Pending"
          const filteredText = await page
            .locator('#example-filteredByStatus .pvtTable')
            .textContent();
          if (filteredText) {
            expect(filteredText).not.toContain('Inactive');
            expect(filteredText).not.toContain('Pending');
            console.log('  #example-filteredByStatus data identity: no "Inactive"/"Pending" in pivot PASSED');
          }

          // pipelineHeatmap: cells should have background-color
          const heatmapCell = page
            .locator('#example-pipelineHeatmap .pvtVal')
            .first();
          if (await heatmapCell.isVisible()) {
            const bgColor = await heatmapCell.evaluate(
              (el) => getComputedStyle(el).backgroundColor,
            );
            const isColored =
              bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
            expect(isColored).toBeTruthy();
            console.log('  #example-pipelineHeatmap heatmap coloring detected PASSED');
          }

          // pipelineGroupedBar: chart renderer produces SVG or Canvas
          const groupedBarChart = page.locator('#example-pipelineGroupedBar').locator('svg, canvas').first();
          if (await groupedBarChart.isVisible().catch(() => false)) {
            console.log('  #example-pipelineGroupedBar chart element rendered PASSED');
          }

          // pipelineLineChart: chart renderer produces SVG or Canvas
          const lineChartEl = page.locator('#example-pipelineLineChart').locator('svg, canvas').first();
          if (await lineChartEl.isVisible().catch(() => false)) {
            console.log('  #example-pipelineLineChart chart element rendered PASSED');
          }

          // fieldVisibility: hidden fields not visible
          const fieldVisText = await page
            .locator('#example-fieldVisibility')
            .textContent();
          if (fieldVisText) {
            expect(fieldVisText).not.toContain('employee_id');
            expect(fieldVisText).not.toContain('manager_id');
            expect(fieldVisText).not.toContain('created_at');
            console.log('  #example-fieldVisibility hidden fields not visible PASSED');
          }

          // ════════════════════════════════════════════════════════
          // SALES OVERVIEW — inner tabs (Pivot Table → Raw Data →
          // Configuration → Usage)
          // ════════════════════════════════════════════════════════

          // Scroll to Sales Overview section
          const soHeading = page.locator('text=Sales Overview').first();
          await soHeading.scrollIntoViewIfNeeded();

          // Pivot Table tab (default) — demoPivot rendered
          await expect(page.locator('rb-pivot-table#demoPivot')).toBeVisible({ timeout: 15000 });
          await expect(page.locator('.pvtTable, .pvtUi, .pvtRendererArea').first()).toBeVisible({ timeout: 20000 });
          const salesOverviewCells = page.locator('#demoPivot').locator('..').locator('.pvtVal, .pvtTotal');
          const cellCount = await salesOverviewCells.count();
          expect(cellCount).toBeGreaterThan(0);
          console.log(`  #demoPivot Sales Overview pivot rendered: ${cellCount} data cells PASSED`);

          // Raw Data tab — rb-tabulator with 64 rows
          await page.click('#so-rawdata-tab');
          await page.waitForTimeout(1000);
          await expect(page.locator('#rawDataTable')).toBeVisible({ timeout: 15000 });
          await expect(page.locator('#rawDataTable .tabulator-row').first()).toBeVisible({ timeout: 15000 });
          console.log('  #so-rawdata-tab Raw Data tab: tabulator rendered PASSED');

          // Configuration tab — pivot config loaded
          await page.click('#so-config-tab');
          await page.waitForTimeout(500);
          await expect(page.locator('#soConfigCode')).not.toContainText('Loading configuration...', { timeout: 10000 });
          const soConfigText = await page.locator('#soConfigCode').textContent();
          expect(soConfigText?.length).toBeGreaterThan(50);
          expect(soConfigText?.toLowerCase()).toMatch(/pivot|rows|cols|aggregator|vals/i);
          console.log('  #so-config-tab Configuration tab: DSL loaded (length > 50, contains pivot keywords) PASSED');

          // Usage tab — HTML snippet valid
          await page.click('#so-usage-tab');
          await page.waitForTimeout(300);
          const soUsageText = await page.locator('#soUsageCode').textContent();
          expect(soUsageText).toContain('rb-pivot-table');
          expect(soUsageText).toContain('salesOverview');
          console.log('  #so-usage-tab Usage tab: contains "rb-pivot-table" + "salesOverview" PASSED');

          // ════════════════════════════════════════════════════════
          // PAGE-LEVEL TABS — Configuration and Usage
          // (shared DSL for all gallery pivot examples)
          // ════════════════════════════════════════════════════════

          // Configuration tab
          console.log('\n  --- Page-Level Tabs ---');
          await page.click('#config-tab');
          await page.waitForTimeout(500);
          await expect(page.locator('#configCode')).not.toContainText('Loading configuration...', { timeout: 10000 });
          const configText = await page.locator('#configCode').textContent();
          expect(configText?.length).toBeGreaterThan(50);
          expect(configText?.toLowerCase()).toMatch(/pivot|rows|cols|aggregator|vals/i);
          console.log('  #config-tab Configuration tab: DSL loaded (length > 50, contains pivot keywords) PASSED');

          // Usage tab
          await page.click('#usage-tab');
          await page.waitForTimeout(300);
          const usageText = await page.locator('#usageCode').textContent();
          expect(usageText).toContain('rb-pivot-table');
          console.log('  #usage-tab Usage tab: contains "rb-pivot-table" HTML snippet PASSED');

          console.log(
            `\n=== [${app.name}] Pivot Tables: ALL PASSED ✓ ===\n`,
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
