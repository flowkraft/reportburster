// ═══════════════════════════════════════════════════════════════════════════════
// canvas-dashboard-demos-low-code.spec.ts
// The "(low-code)" twins: a Dashboard Demo built AGAIN in the Canvas with less code (Visual tab,
// cubes, the filter form and the chart pickers where the original pastes SQL or DSL), published,
// and held to its original's checks (plan-dashboard-demos-low-code.md, TODO 8, P9).
//
// Per twin, the same four steps as file 34 (canvas-dashboard-demos.spec.ts): a fresh canvas; the
// twin's recipe done through the UI by `runRecipe`; the canvas the server saved compared with the
// twin's own shipped `g-<id>-low-code.canvas.json`; then the published dashboard held to the
// ORIGINAL's `checks.json` (`assertDemoDashboard`, `runInteractions`). A widget the twin builds
// otherwise names its own columns, so its claims read it by position under the original's names
// (`DemoWidget.columns`, asked of the original's own published dashboard).
//
// Sameness (TODO 9 of the low-code plan), in its order: 1. the original's checks; 2. the original's
// structure (`canvasDifferences` with the data source left out and a widget built otherwise read
// under the original's column names); 3. the original's rows in every tile the twin builds
// otherwise, at the defaults and under every interaction (the Java `DashboardDemosTwinsTest` holds
// every tile to them on the frozen rows); 4. the twin's own shipped canvas.
//
// A twin whose canvas is not shipped yet is being built: its test prints the canvas it saved
// (`TWIN_CANVAS <report id> <base64 JSON>`), skips the comparison and still runs every check.
//
// How to run:
//   E2E_SPEC='canvas-dashboard-demos-low-code' bash asbl/ci/dp-ci.sh e2e
//   E2E_SPEC='canvas-dashboard-demos-low-code' E2E_GREP='DD13 ' bash asbl/ci/dp-ci.sh e2e   (one twin)
//   E2E_DD_SCREENSHOTS=1 ... also takes the twin's "How it was built" pictures, in <nn>-<id>-low-code/.
// ═══════════════════════════════════════════════════════════════════════════════

import { expect, type Browser, type Page } from '@playwright/test';

import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { Helpers } from '../../utils/helpers';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';
import { reseedDashDemoData, type AdminFetch } from '../../helpers/dashboard-demos-test-helper';
import {
  demoOf,
  loadCanvas,
  loadChecks,
  loadTwinCanvas,
  pad,
  rebuiltWidgetsOf,
  widgetsOf,
  type Demo,
} from '../../helpers/dashboard-demos/demo-catalog';
import {
  askData,
  assertDemoDashboard,
  columnsOf,
  openPublished,
  rowsDifference,
  runInteractions,
  watchForErrors,
} from '../../helpers/dashboard-demos/published-dashboard-checks';
import { assertSameCanvas, normalizeCanvas, stateOf } from '../../helpers/dashboard-demos/canvas-parity';
import { runRecipe } from '../../helpers/dashboard-demos/recipe-runner';
import { createBuildShots } from '../../helpers/dashboard-demos/build-shots';
import type { Recipe } from '../../helpers/dashboard-demos/recipe';
import { LOW_CODE_RECIPES } from '../../dashboard-demos/recipes';
import {
  AI_HUB_APP_ID,
  AI_HUB_BASE_URL,
  SERVER_URL,
  canvasIdOf,
  deleteReportAsAdmin,
  readCanvas,
  readShowSamples,
  setShowSamples,
  withFreshCanvas,
} from '../../helpers/dashboard-demos/canvas-mechanics-helper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const test = electronBeforeAfterAllTest as any;

const adminFetch: AdminFetch = (url, init = {}) =>
  fetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), ...Helpers.apiKeyHeader() } });

const TWIN_TITLE = (recipe: Recipe) =>
  `(dashboard demos low-code) DD${pad(recipe.nn)} ${recipe.title}`
  + ' — the same dashboard with less code, held to its original\'s checks';

test.describe('Dashboard Demos (low-code) twins rebuilt in the Canvas', () => {
  let externalBrowser: Browser | null = null;
  let electronPage: Page | null = null;
  let page: Page;
  let showedSamplesBefore = false;

  test.beforeAll(async ({ beforeAfterAll }: { beforeAfterAll: unknown }) => {
    test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = beforeAfterAll as any;
    electronPage = process.env.TEST_ENV === 'electron' ? await app.firstWindow() : app.context.pages()[0];
    await Helpers.signInIfLoginFormIsShown(electronPage!);

    await reseedDashDemoData(adminFetch, SERVER_URL);

    await SelfServicePortalsTestHelper.startApp(new FluentTester(electronPage!).gotoApps(), AI_HUB_APP_ID);
    const result = await SelfServicePortalsTestHelper.createExternalBrowser();
    externalBrowser = result.browser;
    await Helpers.signInBrowserContext(result.context);
    await SelfServicePortalsTestHelper.waitForServerReady(result.page, AI_HUB_BASE_URL);
    page = result.page;

    showedSamplesBefore = await readShowSamples(page);
    await setShowSamples(page, true);
  });

  test.afterAll(async () => {
    test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);
    if (page && !showedSamplesBefore) await setShowSamples(page, false);
    if (externalBrowser) await externalBrowser.close();
    if (electronPage) {
      await SelfServicePortalsTestHelper.stopApp(new FluentTester(electronPage).gotoApps(), AI_HUB_APP_ID);
    }
  });

  for (const recipe of LOW_CODE_RECIPES) {
    test(TWIN_TITLE(recipe), async () => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);
      // The twin's id is its original's with `-low-code`; everything it is held to is the original's.
      const original = demoOf(recipe.id.replace(/-low-code$/, ''));
      expect(recipe.nn, `${recipe.id} carries its original's number`).toBe(original.nn);
      const twinReportId = `g-${recipe.id}`;
      const canvasName = `E2E DD${pad(recipe.nn)} ${recipe.title}`;
      let reportId: string | undefined;

      try {
        await withFreshCanvas(page, canvasName, async (canvasId) => {
          // 1. Everything done through the UI, as a person does it.
          const shots = createBuildShots(page, recipe, original, { folder: `${pad(recipe.nn)}-${recipe.id}` });
          await shots.start();
          const published = await runRecipe(page, recipe, { capture: shots.capture });
          reportId = published.reportId;
          expect(canvasIdOf(page), 'the recipe stayed on its canvas').toBe(canvasId);

          // 2. Same as its own shipped canvas; a twin still being built prints the one it saved.
          const rebuilt = await readCanvas(page, canvasId);
          const shipped = loadTwinCanvas(twinReportId);
          if (shipped) assertSameCanvas(rebuilt, shipped);
          else console.log(`TWIN_CANVAS ${twinReportId} ${Buffer.from(JSON.stringify(rebuilt)).toString('base64')}`);

          // 3. Works like its original: the original's checks, on the dashboard the recipe published.
          const widgets = rebuiltWidgetsOf(original.id, stateOf(rebuilt));
          const checks = loadChecks(original.id);
          const watch = watchForErrors(page);
          const body = await openPublished(page, published.reportId);
          const shippedWidgets = widgetsOf(original.id);
          const theirs = normalizeCanvas(loadCanvas(original.id)).widgets;
          const ours = normalizeCanvas(rebuilt).widgets;
          const asBuilt: Demo = { ...original, reportId: published.reportId, rebuilt: widgets };
          const builtOtherwise: number[] = [];
          const columnNames: Array<Record<string, string> | undefined> = [];
          for (const [i, widget] of widgets.entries()) {
            if (JSON.stringify(theirs[i]?.dataSource) === JSON.stringify(ours[i]?.dataSource)) continue;
            if (!theirs[i]?.dataSource) continue;
            builtOtherwise.push(i);
            widget.columns = await columnsOf(body, original, shippedWidgets[i], checks.defaults);
            const own = await columnsOf(body, asBuilt, widget, checks.defaults);
            columnNames[i] = Object.fromEntries(own.map((name, k) => [name, widget.columns![k]]).filter(([a, b]) => a !== b));
          }
          await assertDemoDashboard(body, asBuilt, checks);
          await runInteractions(body, asBuilt, checks);
          watch.assertNone(`${recipe.id} rebuilt, on its own page`);

          // Its original's structure: the same filters, widgets, grid and display; only where the
          // data comes from may differ, and a display names the twin's columns at the same places.
          assertSameCanvas(rebuilt, loadCanvas(original.id), { withoutDataSource: true, columnNames });

          // Its original's rows in every tile built otherwise, at the defaults and under every
          // interaction. A tile that runs its original's own query answers its rows by itself.
          const unlike: string[] = [];
          for (const moment of [{ id: 'defaults', params: checks.defaults }, ...checks.interactions]) {
            for (const i of builtOtherwise) {
              const want = await askData(body, original, shippedWidgets[i], moment.params);
              const got = await askData(body, asBuilt, widgets[i], moment.params);
              const difference = rowsDifference(want, got);
              if (difference) unlike.push(`${moment.id} / ${shippedWidgets[i].key}: ${difference}`);
            }
          }
          expect(unlike, `${recipe.id} answers other rows than its original:\n  ${unlike.join('\n  ')}\n`).toEqual([]);

          // 4. The last pictures: the published dashboard, and a story answered on it.
          await shots.finish(published);
        });
      } finally {
        if (reportId) await deleteReportAsAdmin(reportId);
      }
    });
  }
});
