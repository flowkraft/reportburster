import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';

// ============================================================
// DASHBOARDS E2E TESTS
// Verifies the CFO Analytics Dashboard renders correctly with
// all KPI cards, chart panels, and tabulator panels on both
// Grails and Next.js playgrounds.
//
// All asserted values come from known sources:
// - KPI card values: hardcoded in the dashboard HTML/JSX
// - Chart panels: data from dashboard-cfo-script.groovy
// - Tabulator panel: 5 customers from dashboard-cfo-script.groovy
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

// ── KPI Cards ──
// Values are hardcoded in the dashboard markup (not fetched from API).
// Each card has a known value and a detail snippet we can assert.
const KPI_CARDS = [
  // Row 1 — Financial KPIs
  { id: 'kpi-revenue', label: 'Total Revenue', value: '$847,320', detail: '12.5%' },
  { id: 'kpi-profit', label: 'Gross Profit', value: '$292,180', detail: '34.5%' },
  { id: 'kpi-orders', label: 'Total Orders', value: '1,247', detail: '8.3%' },
  { id: 'kpi-ar', label: 'Outstanding AR', value: '$128,450', detail: '23 invoices' },

  // Row 2 — Operational KPIs
  { id: 'kpi-top-customer', label: 'Top Customer', value: 'Save-a-lot Markets', detail: '$89,340' },
  // "Côte de Blaye" — HTML entity renders as "ô", partial match avoids encoding issues
  { id: 'kpi-top-product', label: 'Top Product', value: 'te de Blaye', detail: '89 units' },
  { id: 'kpi-dso', label: 'Days Sales Outstanding', value: '28', detail: 'target: 30' },
  { id: 'kpi-top-region', label: 'Top Region', value: 'Germany', detail: '$198,520' },
];

// ── Chart Panels ──
// Each panel contains an rb-chart that fetches data from the
// dashboard-cfo report and renders a Chart.js canvas.
const CHART_PANELS = [
  { panelId: 'panel-revenueTrend', chartId: 'rb-revenueTrend', title: 'Revenue Trend' },
  { panelId: 'panel-revenueByCategory', chartId: 'rb-revenueByCategory', title: 'Revenue by Category' },
  { panelId: 'panel-arAging', chartId: 'rb-arAging', title: 'Accounts Receivable Aging' },
  { panelId: 'panel-revenueByCountry', chartId: 'rb-revenueByCountry', title: 'Revenue by Country' },
];

// ── Tabulator Panel ──
// Top 5 Customers table with data from dashboard-cfo-script.groovy:
// Save-a-lot Markets ($89,340), Ernst Handel ($76,890), QUICK-Stop ($68,450),
// Hungry Owl All-Night ($62,120), Chop-suey Chinese ($58,780)
const TABULATOR_PANEL = {
  panelId: 'panel-topCustomers',
  tabulatorId: 'rb-topCustomers',
  title: 'Top 5 Customers',
  expectedRows: 5,
  // Spot-check the top 3 customer names to confirm correct dataset
  expectedNames: ['Save-a-lot Markets', 'Ernst Handel', 'QUICK-Stop'],
};

// ============================================================
// TEST SUITE
// ============================================================

test.describe('Dashboards Tests', () => {
  for (const app of PLAYGROUND_APPS) {
    electronBeforeAfterAllTest(
      `${app.name}: CFO Dashboard — KPIs, charts, and tabulator`,
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

          // ── Navigate to /dashboards ──
          console.log(
            `\n=== [${app.name}] Dashboards: CFO Analytics Dashboard ===\n`,
          );
          await page.goto(`${baseUrl}/dashboards`, { timeout: 30000 });
          await page.waitForLoadState('networkidle');

          // Page structure: dashboard selector should be visible
          await expect(page.locator('#dashboard-select')).toBeVisible({ timeout: 10000 });
          console.log(`  #dashboard-select visible PASSED`);

          // ════════════════════════════════════════════════════════
          // KPI CARDS
          // Each card's values are hardcoded in the HTML/JSX.
          // We assert the exact known values are displayed.
          // ════════════════════════════════════════════════════════
          console.log('\nKPI Cards:');
          for (const kpi of KPI_CARDS) {
            const card = page.locator(`#${kpi.id}`);
            await expect(card).toBeVisible({ timeout: 10000 });
            console.log(`  #${kpi.id} card visible PASSED`);

            const cardText = await card.textContent();
            expect(cardText).toContain(kpi.value);
            expect(cardText).toContain(kpi.detail);
            console.log(`  #${kpi.id} values: "${kpi.value}" + "${kpi.detail}" PASSED`);
          }

          // ════════════════════════════════════════════════════════
          // CHART PANELS
          // Each panel has an rb-chart that fetches data from the
          // dashboard-cfo report. We verify the chart rendered a
          // canvas with real dimensions.
          // ════════════════════════════════════════════════════════
          console.log('\nChart Panels:');
          for (const panel of CHART_PANELS) {
            const panelEl = page.locator(`#${panel.panelId}`);
            await expect(panelEl).toBeVisible({ timeout: 10000 });
            console.log(`  #${panel.panelId} panel visible PASSED`);

            // rb-chart web component visible
            const chart = page.locator(`#${panel.chartId}`);
            await expect(chart).toBeVisible({ timeout: 20000 });
            console.log(`  #${panel.chartId} web component visible PASSED`);

            // Chart.js canvas rendered with non-zero dimensions
            const canvas = panelEl.locator('canvas').first();
            await expect(canvas).toBeVisible({ timeout: 20000 });
            const box = await canvas.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.width).toBeGreaterThan(50);
            expect(box!.height).toBeGreaterThan(50);
            console.log(`  #${panel.panelId} canvas dimensions: ${Math.round(box!.width)}x${Math.round(box!.height)} PASSED`);

            // Chart has actual data — not just empty axes/gridlines.
            // rb-chart exposes `data` as a custom-element property (Svelte export).
            const dataInfo = await chart.evaluate((el: any) => {
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
            console.log(`  #${panel.chartId} chart data: ${dataInfo.datasets} dataset(s), ${dataInfo.labels} labels, ${dataInfo.points} points PASSED`);
          }

          // ════════════════════════════════════════════════════════
          // TABULATOR PANEL: Top 5 Customers
          // Data from dashboard-cfo-script.groovy — 5 named customers
          // with known revenue amounts.
          // ════════════════════════════════════════════════════════
          console.log('\nTabulator Panel:');
          const tabPanel = page.locator(`#${TABULATOR_PANEL.panelId}`);
          await expect(tabPanel).toBeVisible({ timeout: 10000 });
          console.log(`  #${TABULATOR_PANEL.panelId} panel visible PASSED`);

          // rb-tabulator web component visible
          const tabElement = page.locator(`#${TABULATOR_PANEL.tabulatorId}`);
          await expect(tabElement).toBeVisible({ timeout: 20000 });
          console.log(`  #${TABULATOR_PANEL.tabulatorId} web component visible PASSED`);

          // Data rows loaded
          await expect(
            tabPanel.locator('.tabulator-row').first(),
          ).toBeVisible({ timeout: 20000 });
          const rowCount = await tabPanel.locator('.tabulator-row').count();
          expect(rowCount).toBe(TABULATOR_PANEL.expectedRows);
          console.log(`  #${TABULATOR_PANEL.panelId} data rendered: ${rowCount} rows (expected ${TABULATOR_PANEL.expectedRows}) PASSED`);

          // Verify known customer names — confirms correct dataset loaded
          const tableText = await tabPanel.textContent();
          for (const name of TABULATOR_PANEL.expectedNames) {
            expect(tableText).toContain(name);
            console.log(`  Customer "${name}" present PASSED`);
          }

          console.log(
            `\n=== [${app.name}] Dashboards: ALL PASSED ===\n`,
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
