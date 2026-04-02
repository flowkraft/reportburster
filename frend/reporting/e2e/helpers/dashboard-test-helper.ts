import { expect, Page } from '@playwright/test';

/**
 * Shared dashboard assertion helper.
 * When country is undefined, asserts "-- All --" (unfiltered) totals.
 * When country is provided (e.g. 'Germany'), asserts country-filtered data.
 */
export async function assertDashboardRendersCorrectly(
  page: Page,
  reportCode: string,
  country?: string,
) {
  const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';

  // ── 1. Header & layout ──
  await expect(page.locator('text=Northwind Sales Dashboard')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('text=Wholesale distribution')).toBeVisible({ timeout: 10000 });

  // All web component containers are present
  await expect(page.locator('rb-value')).toHaveCount(4, { timeout: 15000 });
  await expect(page.locator('rb-chart')).toHaveCount(2, { timeout: 15000 });
  await expect(page.locator('rb-tabulator')).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator('rb-pivot-table')).toHaveCount(1, { timeout: 15000 });

  // ── 2. rb-value (KPI cards) ──
  const atomicData = await page.evaluate(async ({ rc, cp }) => {
    const resp = await fetch(`/api/reporting/reports/${rc}/data?componentId=atomicValues${cp}`);
    return resp.json();
  }, { rc: reportCode, cp: countryParam });
  expect(atomicData.data).toBeDefined();
  expect(atomicData.data.length).toBe(1);
  const kpi = atomicData.data[0];

  if (!country) {
    // Known Northwind totals (all countries): revenue ~58153, orders 79, avg ~736, customers 25
    expect(Math.round(Number(kpi.revenue))).toBe(58153);
    expect(Number(kpi.orders)).toBe(79);
    expect(Math.round(Number(kpi.avgOrderValue))).toBe(736);
    expect(Number(kpi.customers)).toBe(25);
  } else {
    // Filtered: values must be positive but less than the global totals
    expect(Number(kpi.revenue)).toBeGreaterThan(0);
    expect(Number(kpi.revenue)).toBeLessThan(58153);
    expect(Number(kpi.orders)).toBeGreaterThan(0);
    expect(Number(kpi.orders)).toBeLessThan(79);
    expect(Number(kpi.avgOrderValue)).toBeGreaterThan(0);
    expect(Number(kpi.customers)).toBeGreaterThan(0);
    expect(Number(kpi.customers)).toBeLessThan(25);
  }

  // ── 3. rb-chart (revenueTrend) — monthly revenue ──
  const revenueTrendData = await page.evaluate(async ({ rc, cp }) => {
    const resp = await fetch(`/api/reporting/reports/${rc}/data?componentId=revenueTrend${cp}`);
    return resp.json();
  }, { rc: reportCode, cp: countryParam });
  expect(revenueTrendData.data).toBeDefined();
  expect(revenueTrendData.data.length).toBeGreaterThan(0);
  const trendRow = revenueTrendData.data[0];
  expect(trendRow.month).toBeDefined();
  expect(Number(trendRow.revenue)).toBeGreaterThan(0);

  if (!country) {
    expect(revenueTrendData.data.length).toBeGreaterThan(5); // 18 months of data
  }

  // ── 4. rb-chart (revenueByCategory) — category breakdown ──
  const categoryData = await page.evaluate(async ({ rc, cp }) => {
    const resp = await fetch(`/api/reporting/reports/${rc}/data?componentId=revenueByCategory${cp}`);
    return resp.json();
  }, { rc: reportCode, cp: countryParam });
  expect(categoryData.data).toBeDefined();
  expect(categoryData.data.length).toBeGreaterThan(0);

  if (!country) {
    // All 8 product categories present when unfiltered
    expect(categoryData.data.length).toBe(8);
    const categories = categoryData.data.map((r: any) => r.category);
    expect(categories).toContain('Beverages');
    expect(categories).toContain('Dairy Products');
  }

  // ── 5. rb-tabulator (topCustomers) ──
  const topCustomersData = await page.evaluate(async ({ rc, cp }) => {
    const resp = await fetch(`/api/reporting/reports/${rc}/data?componentId=topCustomers${cp}`);
    return resp.json();
  }, { rc: reportCode, cp: countryParam });
  expect(topCustomersData.data).toBeDefined();
  expect(topCustomersData.data.length).toBeGreaterThan(0);

  if (!country) {
    expect(topCustomersData.data.length).toBe(10); // top 10 limit
    // Known #1: Cactus Comidas para llevar, Argentina
    const top1 = topCustomersData.data[0];
    expect(top1.company).toBe('Cactus Comidas para llevar');
    expect(top1.country).toBe('Argentina');
    expect(top1.contact).toBe('Patricio Simpson');
    expect(Number(top1.orders)).toBe(3);
    expect(Number(top1.revenue)).toBeCloseTo(4567.80, 0);
    // Known #2: Blauer See Delikatessen
    expect(topCustomersData.data[1].company).toBe('Blauer See Delikatessen');
    expect(topCustomersData.data[1].country).toBe('Germany');
    // Known last (#10): LILA-Supermercado
    expect(topCustomersData.data[9].company).toBe('LILA-Supermercado');
    expect(topCustomersData.data[9].country).toBe('Venezuela');
  } else {
    // When filtered by country, ALL customers must be from that country
    for (const row of topCustomersData.data) {
      expect(row.country).toBe(country);
    }
    // Germany has 11 customers in the DB, so top 10 should be full
    if (country === 'Germany') {
      expect(topCustomersData.data.length).toBe(10);
      // All must be German companies
      const companies = topCustomersData.data.map((r: any) => r.company);
      expect(companies).toContain('Alfreds Futterkiste');
      expect(companies).toContain('Blauer See Delikatessen');
    }
  }

  // ── 6. rb-pivot-table (orderExplorer) — pivot source data ──
  const pivotData = await page.evaluate(async ({ rc, cp }) => {
    const resp = await fetch(`/api/reporting/reports/${rc}/data?componentId=orderExplorer${cp}`);
    return resp.json();
  }, { rc: reportCode, cp: countryParam });
  expect(pivotData.data).toBeDefined();
  expect(pivotData.data.length).toBeGreaterThan(0);
  const pivotRow = pivotData.data[0];
  expect(pivotRow.country).toBeDefined();
  expect(pivotRow.category).toBeDefined();
  expect(pivotRow.year).toBeDefined();
  expect(Number(pivotRow.revenue)).toBeGreaterThan(0);

  if (!country) {
    expect(pivotData.data.length).toBeGreaterThan(10); // many country x category x year combos
    // Germany has the highest total revenue
    const germanyRows = pivotData.data.filter((r: any) => r.country === 'Germany');
    expect(germanyRows.length).toBeGreaterThan(0);
    const germanyTotal = germanyRows.reduce((sum: number, r: any) => sum + Number(r.revenue), 0);
    expect(Math.round(germanyTotal)).toBeCloseTo(27256, -1); // ~27,256
  } else {
    // When filtered, ALL rows must be from the selected country
    for (const row of pivotData.data) {
      expect(row.country).toBe(country);
    }
  }
}
