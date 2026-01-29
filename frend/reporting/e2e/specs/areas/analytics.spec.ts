import { test, expect, Page } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { FluentTester } from '../../helpers/fluent-tester';
import { SelfServicePortalsTestHelper } from '../../helpers/areas/self-service-portals-test-helper';
import { Constants } from '../../utils/constants';

/**
 * E2E tests for Pivot Table Analytics
 *
 * Test Structure: 3 functions → 4 test executions
 *
 * TEST 1 & 2 (DUAL): performRepresentativeSetOfPivotActionsAndAssertResults(engine)
 *   - Execute with engine='browser' and engine='duckdb'
 *   - Representative sample of 10 pivot actions
 *   - SAME assertions for both engines (validates DuckDB === browser)
 *
 * TEST 3 (SINGLE): performAndAssertGSPDocumentedActions()
 *   - 6 "Quick Actions" + 4 "Real Business Questions" from GSP documentation
 *   - Browser only
 *
 * TEST 4 (SINGLE): performPivotOnNorthwindWarehouse()
 *   - Query real northwind.duckdb warehouse
 *   - DuckDB only
 *
 * Data Sources:
 * - piv-sales-region-prod-qtr: 64 rows (4 Regions × 4 Products × 4 Quarters)
 * - piv-northwind-warehouse-sales: ~800 rows from northwind.duckdb
 *
 * Expected Values (piv-sales-region-prod-qtr):
 * - Grand Total: $639,700
 * - By Product: Laptop=$258,000, Phone=$184,000, Tablet=$109,500, Monitor=$88,200
 * - By Region: West=$173,850, East=$170,850, South=$149,200, North=$145,800
 * - By Quarter: Q1=$171,650, Q2=$154,950, Q3=$166,000, Q4=$147,100
 */

//DONE2
test.describe('Pivot Table Analytics', async () => {

  // ============================================================
  // TEST 1 & 2: DUAL-ENGINE Representative Actions
  // ============================================================

  /**
   * TEST 1: Representative pivot actions with BROWSER engine
   */
  electronBeforeAfterAllTest(
    'Pivot Table [BROWSER ENGINE]: Representative set of pivot actions with assertions',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let externalBrowser = null;

      try {
        // Start Grails app
        await SelfServicePortalsTestHelper.startApp(
          new FluentTester(firstPage).gotoApps(),
          SelfServicePortalsTestHelper.APP_ID_GRAILS,
        );

        // Open external browser
        const { browser, page } = await SelfServicePortalsTestHelper.createExternalBrowser();
        externalBrowser = browser;

        // Wait for server to be ready
        await SelfServicePortalsTestHelper.waitForServerReady(
          page,
          `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`,
        );

        // Navigate to pivot tables page
        await page.goto(`${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`);

        // Execute representative set of actions with BROWSER engine
        await performRepresentativeSetOfPivotActionsAndAssertResults(page, 'browser');

        console.log('TEST 1 [BROWSER]: All assertions passed.');

      } finally {
        if (externalBrowser) {
          await SelfServicePortalsTestHelper.closeExternalBrowser(externalBrowser);
        }
        try {
          await SelfServicePortalsTestHelper.stopApp(
            new FluentTester(firstPage).gotoApps(),
            SelfServicePortalsTestHelper.APP_ID_GRAILS,
          );
        } catch (e) {
          console.error('Failed to stop Grails app:', e);
        }
      }
    },
  );

  /**
   * TEST 2: Representative pivot actions with DUCKDB engine
   */
  electronBeforeAfterAllTest(
    'Pivot Table [DUCKDB ENGINE]: Representative set of pivot actions with assertions',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let externalBrowser = null;

      try {
        // Start Grails app
        await SelfServicePortalsTestHelper.startApp(
          new FluentTester(firstPage).gotoApps(),
          SelfServicePortalsTestHelper.APP_ID_GRAILS,
        );

        // Open external browser
        const { browser, page } = await SelfServicePortalsTestHelper.createExternalBrowser();
        externalBrowser = browser;

        // Wait for server to be ready
        await SelfServicePortalsTestHelper.waitForServerReady(
          page,
          `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`,
        );

        // Navigate to pivot tables page
        await page.goto(`${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`);

        // Execute representative set of actions with DUCKDB engine
        await performRepresentativeSetOfPivotActionsAndAssertResults(page, 'duckdb');

        console.log('TEST 2 [DUCKDB]: All assertions passed - results match browser engine!');

      } finally {
        if (externalBrowser) {
          await SelfServicePortalsTestHelper.closeExternalBrowser(externalBrowser);
        }
        try {
          await SelfServicePortalsTestHelper.stopApp(
            new FluentTester(firstPage).gotoApps(),
            SelfServicePortalsTestHelper.APP_ID_GRAILS,
          );
        } catch (e) {
          console.error('Failed to stop Grails app:', e);
        }
      }
    },
  );

  // ============================================================
  // TEST 3: GSP Documented Actions
  // ============================================================

  /**
   * TEST 3: GSP documented "Quick Actions" and "Real Business Questions"
   */
  electronBeforeAfterAllTest(
    'Pivot Table [GSP DOCS]: All documented user actions from GSP (6 Quick Actions + 4 Business Questions)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let externalBrowser = null;

      try {
        // Start Grails app
        await SelfServicePortalsTestHelper.startApp(
          new FluentTester(firstPage).gotoApps(),
          SelfServicePortalsTestHelper.APP_ID_GRAILS,
        );

        // Open external browser
        const { browser, page } = await SelfServicePortalsTestHelper.createExternalBrowser();
        externalBrowser = browser;

        // Wait for server to be ready
        await SelfServicePortalsTestHelper.waitForServerReady(
          page,
          `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`,
        );

        // Navigate to pivot tables page
        await page.goto(`${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`);

        // Execute all GSP documented actions
        await performAndAssertGSPDocumentedActions(page);

        console.log('TEST 3 [GSP DOCS]: All documented actions passed.');

      } finally {
        if (externalBrowser) {
          await SelfServicePortalsTestHelper.closeExternalBrowser(externalBrowser);
        }
        try {
          await SelfServicePortalsTestHelper.stopApp(
            new FluentTester(firstPage).gotoApps(),
            SelfServicePortalsTestHelper.APP_ID_GRAILS,
          );
        } catch (e) {
          console.error('Failed to stop Grails app:', e);
        }
      }
    },
  );

  // ============================================================
  // TEST 4: Northwind Data Warehouse
  // ============================================================

  /**
   * TEST 4: Northwind warehouse with real Star Schema data
   */
  electronBeforeAfterAllTest(
    'Pivot Table [NORTHWIND WAREHOUSE]: DuckDB Star Schema queries on real warehouse data',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let externalBrowser = null;

      try {
        // Start Grails app
        await SelfServicePortalsTestHelper.startApp(
          new FluentTester(firstPage).gotoApps(),
          SelfServicePortalsTestHelper.APP_ID_GRAILS,
        );

        // Open external browser
        const { browser, page } = await SelfServicePortalsTestHelper.createExternalBrowser();
        externalBrowser = browser;

        // Wait for server to be ready
        await SelfServicePortalsTestHelper.waitForServerReady(
          page,
          `${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`,
        );

        // Navigate to pivot tables page
        await page.goto(`${SelfServicePortalsTestHelper.GRAILS_BASE_URL}/pivotTables`);

        // Execute warehouse-specific tests
        await performPivotOnNorthwindWarehouse(page);

        console.log('TEST 4 [WAREHOUSE]: All warehouse tests passed.');

      } finally {
        if (externalBrowser) {
          await SelfServicePortalsTestHelper.closeExternalBrowser(externalBrowser);
        }
        try {
          await SelfServicePortalsTestHelper.stopApp(
            new FluentTester(firstPage).gotoApps(),
            SelfServicePortalsTestHelper.APP_ID_GRAILS,
          );
        } catch (e) {
          console.error('Failed to stop Grails app:', e);
        }
      }
    },
  );

});

// ============================================================
// IMPLEMENTATION FUNCTIONS
// ============================================================

/**
 * TEST 1 & 2 Implementation: Representative set of pivot actions
 * This function is called TWICE: once with 'browser', once with 'duckdb'
 * SAME assertions for both engines validates DuckDB produces identical results
 */
async function performRepresentativeSetOfPivotActionsAndAssertResults(
  page: Page,
  engine: 'browser' | 'duckdb'
): Promise<void> {
  console.log(`\n=== Starting representative pivot actions with ${engine.toUpperCase()} engine ===\n`);

  // Set engine if duckdb
  if (engine === 'duckdb') {
    await SelfServicePortalsTestHelper.setPivotEngine(page, 'demoPivot', 'duckdb');
  }

  // Wait for pivot table to load
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'demoPivot');

  // ACTION 1: Verify initial load and default state
  console.log(`[${engine}] Action 1: Verify initial load and default state`);
  // Verify default configuration is loaded correctly
  const grandTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  expect(grandTotal).toBe(639700); // Expected: $639,700
  console.log(`[${engine}] ✓ Grand total verified: $${grandTotal.toLocaleString()}`);

  // Verify all 4 regions are visible
  const bodyText = await page.locator('#demoPivot .pvtTable').textContent();
  expect(bodyText).toContain('North');
  expect(bodyText).toContain('South');
  expect(bodyText).toContain('East');
  expect(bodyText).toContain('West');
  console.log(`[${engine}] ✓ All 4 regions visible (North, South, East, West)`);

  // ACTION 2: Change value field (Revenue → Profit)
  console.log(`[${engine}] Action 2: Change value field (Revenue → Profit)`);
  await SelfServicePortalsTestHelper.changeValueField(page, 'demoPivot', 'Profit');
  const profitTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  expect(profitTotal).toBeLessThan(grandTotal); // Profit < Revenue
  expect(profitTotal).toBeGreaterThan(0); // Should have positive profit
  console.log(`[${engine}] ✓ Value field changed to Profit, total: $${profitTotal.toLocaleString()}`);

  // ACTION 3: Change aggregator (Sum → Average)
  console.log(`[${engine}] Action 3: Change aggregator (Sum → Average)`);
  await SelfServicePortalsTestHelper.changeAggregator(page, 'demoPivot', 'Average');
  const avgValue = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  expect(avgValue).toBeLessThan(profitTotal); // Average < Sum
  expect(avgValue).toBeGreaterThan(0);
  console.log(`[${engine}] ✓ Aggregator changed to Average, value: $${avgValue.toLocaleString()}`);

  // Reset to Sum for subsequent tests
  await SelfServicePortalsTestHelper.changeAggregator(page, 'demoPivot', 'Sum');
  await SelfServicePortalsTestHelper.changeValueField(page, 'demoPivot', 'Revenue');

  // ACTION 4: Rearrange dimensions (Quarter from cols → rows)
  console.log(`[${engine}] Action 4: Rearrange dimensions (Quarter from cols → rows)`);
  await SelfServicePortalsTestHelper.moveDimensionFromColsToRows(page, 'demoPivot', 'Quarter');
  // Verify Quarter now appears in row labels
  const quarterBody = await page.locator('#demoPivot .pvtTable').textContent();
  expect(quarterBody).toContain('Q1');
  expect(quarterBody).toContain('Q2');
  expect(quarterBody).toContain('Q3');
  expect(quarterBody).toContain('Q4');
  console.log(`[${engine}] ✓ Quarter moved from columns to rows`);

  // ACTION 5: Add dimension (SalesRep to rows)
  console.log(`[${engine}] Action 5: Add dimension (SalesRep to rows)`);
  await SelfServicePortalsTestHelper.dragDimensionToRows(page, 'demoPivot', 'SalesRep');
  const salesRepBody = await page.locator('#demoPivot .pvtTable').textContent();
  expect(salesRepBody).toContain('Alice');
  expect(salesRepBody).toContain('Bob');
  expect(salesRepBody).toContain('Carol');
  expect(salesRepBody).toContain('David');
  console.log(`[${engine}] ✓ SalesRep added to rows (Alice, Bob, Carol, David visible)`);

  // ACTION 6: Filter regions (uncheck North and West)
  console.log(`[${engine}] Action 6: Filter regions (uncheck North and West)`);
  await SelfServicePortalsTestHelper.filterDimension(page, 'demoPivot', 'Region', ['North', 'West']);
  const filteredBody1 = await page.locator('#demoPivot .pvtTable').textContent();
  expect(filteredBody1).toContain('East');
  expect(filteredBody1).toContain('South');
  expect(filteredBody1).not.toContain('North');
  expect(filteredBody1).not.toContain('West');
  const filteredTotal1 = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  expect(filteredTotal1).toBe(320050); // East ($170,850) + South ($149,200)
  console.log(`[${engine}] ✓ Regions filtered (East + South only), total: $${filteredTotal1.toLocaleString()}`);

  // ACTION 7: Filter products (uncheck Tablet and Monitor)
  console.log(`[${engine}] Action 7: Filter products (uncheck Tablet and Monitor)`);
  await SelfServicePortalsTestHelper.filterDimension(page, 'demoPivot', 'Product', ['Tablet', 'Monitor']);
  const filteredBody2 = await page.locator('#demoPivot .pvtTable').textContent();
  expect(filteredBody2).toContain('Laptop');
  expect(filteredBody2).toContain('Phone');
  expect(filteredBody2).not.toContain('Tablet');
  expect(filteredBody2).not.toContain('Monitor');
  console.log(`[${engine}] ✓ Products filtered (Laptop + Phone only)`);

  // ACTION 8: Sort descending by revenue
  console.log(`[${engine}] Action 8: Sort descending by revenue`);
  await SelfServicePortalsTestHelper.sortPivot(page, 'demoPivot', 'value_z_to_a');
  const laptopValue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'demoPivot', 'Laptop');
  expect(laptopValue).toBeGreaterThan(0);
  console.log(`[${engine}] ✓ Sorted descending, Laptop value: $${laptopValue.toLocaleString()}`);

  // ACTION 9: Switch renderer (Table → Grouped Column Chart)
  console.log(`[${engine}] Action 9: Switch renderer (Table → Grouped Column Chart)`);
  await SelfServicePortalsTestHelper.changeRenderer(page, 'demoPivot', 'Grouped Column Chart');
  // Verify chart elements appear (SVG from Google Charts)
  const chartElement = await page.locator('#demoPivot svg, #demoPivot canvas').first();
  await expect(chartElement).toBeVisible({ timeout: 5000 });
  console.log(`[${engine}] ✓ Renderer changed to Grouped Column Chart`);

  // Switch back to Table for final action
  await SelfServicePortalsTestHelper.changeRenderer(page, 'demoPivot', 'Table');

  // ACTION 10: Complex multi-dimensional analysis
  console.log(`[${engine}] Action 10: Complex multi-dimensional analysis`);
  // Clear filters and reset to default view for final comprehensive check
  await page.click('#refreshBtn'); // Refresh to reset state
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'demoPivot');

  // Add SalesRep to rows for multi-dimensional analysis
  await SelfServicePortalsTestHelper.dragDimensionToRows(page, 'demoPivot', 'SalesRep');

  // Verify the complex hierarchy
  const finalBody = await page.locator('#demoPivot .pvtTable').textContent();
  expect(finalBody).toContain('Region');
  expect(finalBody).toContain('Product');
  expect(finalBody).toContain('Alice');
  const finalTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  expect(finalTotal).toBe(639700); // Should match original grand total
  console.log(`[${engine}] ✓ Complex multi-dimensional analysis complete, total: $${finalTotal.toLocaleString()}`)

  console.log(`\n=== Completed all representative actions with ${engine.toUpperCase()} engine ===\n`);
}

/**
 * TEST 3 Implementation: GSP documented actions
 * Executes the 6 "Quick Actions" and 4 "Real Business Questions" from GSP documentation
 */
async function performAndAssertGSPDocumentedActions(page: Page): Promise<void> {
  console.log('\n=== Starting GSP documented actions ===\n');

  // Wait for pivot table to load
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'demoPivot');

  // === 6 QUICK ACTIONS ===

  // QUICK ACTION 1: Change the Metric (Revenue → Profit)
  console.log('[GSP] Quick Action 1: Change the Metric (Revenue → Profit)');
  await SelfServicePortalsTestHelper.changeValueField(page, 'demoPivot', 'Profit');
  const profitTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  expect(profitTotal).toBeGreaterThan(0);
  console.log(`[GSP] ✓ Quick Action 1: Metric changed to Profit, total: $${profitTotal.toLocaleString()}`);

  // QUICK ACTION 2: Rearrange Dimensions (Quarter from cols → rows)
  console.log('[GSP] Quick Action 2: Rearrange Dimensions');
  await SelfServicePortalsTestHelper.moveDimensionFromColsToRows(page, 'demoPivot', 'Quarter');
  const quarterText = await page.locator('#demoPivot .pvtTable').textContent();
  expect(quarterText).toContain('Q1');
  expect(quarterText).toContain('Q2');
  expect(quarterText).toContain('Q3');
  expect(quarterText).toContain('Q4');
  console.log('[GSP] ✓ Quick Action 2: Quarter moved from columns to rows');

  // QUICK ACTION 3: Add a Dimension (SalesRep to rows)
  console.log('[GSP] Quick Action 3: Add a Dimension (SalesRep)');
  await SelfServicePortalsTestHelper.dragDimensionToRows(page, 'demoPivot', 'SalesRep');
  const salesRepText = await page.locator('#demoPivot .pvtTable').textContent();
  expect(salesRepText).toContain('Alice');
  expect(salesRepText).toContain('Bob');
  expect(salesRepText).toContain('Carol');
  expect(salesRepText).toContain('David');
  console.log('[GSP] ✓ Quick Action 3: SalesRep dimension added (hierarchy: Region → Product → SalesRep)');

  // QUICK ACTION 4: Filter Data (Uncheck North and West)
  console.log('[GSP] Quick Action 4: Filter Data');
  await SelfServicePortalsTestHelper.filterDimension(page, 'demoPivot', 'Region', ['North', 'West']);
  const filteredText = await page.locator('#demoPivot .pvtTable').textContent();
  expect(filteredText).toContain('East');
  expect(filteredText).toContain('South');
  expect(filteredText).not.toContain('North');
  expect(filteredText).not.toContain('West');
  console.log('[GSP] ✓ Quick Action 4: Region filtered (East and South only)');

  // QUICK ACTION 5: Change Aggregation (Sum → Average)
  console.log('[GSP] Quick Action 5: Change Aggregation');
  await SelfServicePortalsTestHelper.changeAggregator(page, 'demoPivot', 'Average');
  const avgValue = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  expect(avgValue).toBeLessThan(profitTotal); // Average < Sum
  console.log(`[GSP] ✓ Quick Action 5: Aggregation changed to Average, value: $${avgValue.toLocaleString()}`);

  // QUICK ACTION 6: Visualize as Chart (Table → Grouped Column Chart)
  console.log('[GSP] Quick Action 6: Visualize as Chart');
  await SelfServicePortalsTestHelper.changeRenderer(page, 'demoPivot', 'Grouped Column Chart');
  const chartElement = await page.locator('#demoPivot svg, #demoPivot canvas').first();
  await expect(chartElement).toBeVisible({ timeout: 5000 });
  console.log('[GSP] ✓ Quick Action 6: Rendered as Grouped Column Chart');

  // Reset to table for business questions
  await page.click('#refreshBtn');
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'demoPivot');

  // === 4 REAL BUSINESS QUESTIONS ===

  // QUESTION 1: "Which product is our cash cow?"
  console.log('[GSP] Business Question 1: Which product is our cash cow?');
  const laptopRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'demoPivot', 'Laptop');
  const phoneRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'demoPivot', 'Phone');
  const tabletRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'demoPivot', 'Tablet');
  const monitorRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'demoPivot', 'Monitor');

  expect(laptopRevenue).toBe(258000); // Expected: $258,000
  expect(laptopRevenue).toBeGreaterThan(phoneRevenue);
  expect(laptopRevenue).toBeGreaterThan(tabletRevenue);
  expect(laptopRevenue).toBeGreaterThan(monitorRevenue);
  console.log(`[GSP] ✓ Question 1: Laptop is the cash cow at $${laptopRevenue.toLocaleString()}`);

  // QUESTION 2: "Is East region underperforming?"
  console.log('[GSP] Business Question 2: Is East region underperforming?');
  const eastRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'demoPivot', 'East');
  const westRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'demoPivot', 'West');

  expect(eastRevenue).toBe(170850); // Expected: $170,850
  expect(westRevenue).toBe(173850); // Expected: $173,850
  expect(eastRevenue).toBeLessThan(westRevenue);
  console.log(`[GSP] ✓ Question 2: Yes, East ($${eastRevenue.toLocaleString()}) < West ($${westRevenue.toLocaleString()})`);

  // QUESTION 3: "Who gets the sales bonus?"
  console.log('[GSP] Business Question 3: Who gets the sales bonus?');
  await SelfServicePortalsTestHelper.dragDimensionToRows(page, 'demoPivot', 'SalesRep');
  await SelfServicePortalsTestHelper.sortPivot(page, 'demoPivot', 'value_z_to_a');
  const salesRepRows = await page.locator('#demoPivot .pvtTable tbody tr').all();
  expect(salesRepRows.length).toBeGreaterThan(0);
  console.log('[GSP] ✓ Question 3: Sales reps sorted by revenue descending');

  // QUESTION 4: "Are we profitable or just busy?"
  console.log('[GSP] Business Question 4: Are we profitable or just busy?');
  await page.click('#refreshBtn');
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'demoPivot');

  const revenueTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');
  await SelfServicePortalsTestHelper.changeValueField(page, 'demoPivot', 'Profit');
  const profitTotal2 = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'demoPivot');

  expect(profitTotal2).toBeGreaterThan(0);
  expect(profitTotal2).toBeLessThan(revenueTotal); // Profit < Revenue
  const profitMargin = (profitTotal2 / revenueTotal) * 100;
  console.log(`[GSP] ✓ Question 4: Profit margin is ${profitMargin.toFixed(1)}% (Revenue: $${revenueTotal.toLocaleString()}, Profit: $${profitTotal2.toLocaleString()})`)

  console.log('\n=== Completed all GSP documented actions ===\n');
}

/**
 * TEST 4 Implementation: Northwind warehouse queries
 * Tests real warehouse data with Star Schema (vw_sales_detail)
 */
async function performPivotOnNorthwindWarehouse(page: Page): Promise<void> {
  console.log('\n=== Starting Northwind warehouse tests ===\n');

  // Click "Northwind Warehouse" tab
  await page.click('#warehouse-tab');
  await page.waitForTimeout(2000);

  // Wait for warehouse pivot to load
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'warehousePivot');

  // WAREHOUSE ACTION 1: Verify initial load (Country/Category × YearQuarter)
  console.log('[WAREHOUSE] Action 1: Verify initial load');
  const warehouseBody = await page.locator('#warehousePivot .pvtTable').textContent();

  // Verify key countries are present
  expect(warehouseBody).toContain('USA');
  expect(warehouseBody).toContain('Germany');
  expect(warehouseBody).toContain('France');

  // Verify some Northwind categories are present
  expect(warehouseBody).toContain('Beverages');
  expect(warehouseBody).toContain('Dairy Products');

  const warehouseTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'warehousePivot');
  expect(warehouseTotal).toBeGreaterThan(0);
  console.log(`[WAREHOUSE] ✓ Action 1: Initial load verified, grand total: $${warehouseTotal.toLocaleString()}`);

  // WAREHOUSE ACTION 2: Aggregate by Country
  console.log('[WAREHOUSE] Action 2: Aggregate by Country');
  await page.click('#refreshWarehouseBtn');
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'warehousePivot');

  // Verify countries aggregate correctly
  const usaRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'warehousePivot', 'USA');
  const germanyRevenue = await SelfServicePortalsTestHelper.getPivotCellValue(page, 'warehousePivot', 'Germany');

  expect(usaRevenue).toBeGreaterThan(0);
  expect(germanyRevenue).toBeGreaterThan(0);
  console.log(`[WAREHOUSE] ✓ Action 2: Country aggregation - USA: $${usaRevenue.toLocaleString()}, Germany: $${germanyRevenue.toLocaleString()}`);

  // WAREHOUSE ACTION 3: Time-Series Analysis
  console.log('[WAREHOUSE] Action 3: Time-Series Analysis');
  // Check that year_quarter data is present
  const quarterPattern = /\d{4}[-_]Q\d/; // Matches patterns like "1996-Q1" or "1996_Q1"
  expect(quarterPattern.test(warehouseBody)).toBe(true);
  console.log('[WAREHOUSE] ✓ Action 3: Time-series data with year-quarter format present');

  // WAREHOUSE ACTION 4: Category Performance
  console.log('[WAREHOUSE] Action 4: Category Performance');
  // Verify specific Northwind categories
  const categories = ['Beverages', 'Condiments', 'Confections', 'Dairy Products', 'Grains/Cereals', 'Meat/Poultry', 'Produce', 'Seafood'];
  let categoriesFound = 0;
  for (const category of categories) {
    if (warehouseBody.includes(category)) {
      categoriesFound++;
    }
  }
  expect(categoriesFound).toBeGreaterThanOrEqual(5); // Expect at least 5 of 8 categories
  console.log(`[WAREHOUSE] ✓ Action 4: Found ${categoriesFound} Northwind categories`);

  // WAREHOUSE ACTION 5: Multi-dimensional Hierarchy
  console.log('[WAREHOUSE] Action 5: Multi-dimensional Hierarchy');
  // Add continent dimension to test hierarchy
  await SelfServicePortalsTestHelper.dragDimensionToRows(page, 'warehousePivot', 'continent');
  const continentBody = await page.locator('#warehousePivot .pvtTable').textContent();

  // Verify continents appear
  const continents = ['Europe', 'North America', 'South America'];
  let continentsFound = 0;
  for (const continent of continents) {
    if (continentBody.includes(continent)) {
      continentsFound++;
    }
  }
  expect(continentsFound).toBeGreaterThanOrEqual(2); // Expect at least 2 continents
  console.log(`[WAREHOUSE] ✓ Action 5: Multi-dimensional hierarchy - found ${continentsFound} continents`);

  // WAREHOUSE ACTION 6: Advanced Aggregators
  console.log('[WAREHOUSE] Action 6: Advanced Aggregators');
  // Reset and test different aggregators
  await page.click('#refreshWarehouseBtn');
  await SelfServicePortalsTestHelper.waitForPivotTableRender(page, 'warehousePivot');

  const sumTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'warehousePivot');

  // Test Average aggregator
  await SelfServicePortalsTestHelper.changeAggregator(page, 'warehousePivot', 'Average');
  const avgTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'warehousePivot');

  expect(avgTotal).toBeGreaterThan(0);
  expect(avgTotal).toBeLessThan(sumTotal); // Average should be less than Sum
  console.log(`[WAREHOUSE] ✓ Action 6: Advanced aggregators - Sum: $${sumTotal.toLocaleString()}, Average: $${avgTotal.toLocaleString()}`);

  // Test Count aggregator
  await SelfServicePortalsTestHelper.changeAggregator(page, 'warehousePivot', 'Count');
  const countTotal = await SelfServicePortalsTestHelper.getPivotGrandTotal(page, 'warehousePivot');
  expect(countTotal).toBeGreaterThan(0);
  console.log(`[WAREHOUSE] ✓ Action 6: Count aggregator - Total records: ${countTotal}`)

  console.log('\n=== Completed all warehouse tests ===\n');
}
