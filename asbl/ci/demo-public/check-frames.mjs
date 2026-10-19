// Opens the three framed dashboards of the demo the way a visitor does and presses every control, then walks the tour.
// Fails (exit 1) when a request to the demo itself is answered with anything but 200 - which is how a missing allowlist line,
// a refused origin or a dead share link shows up - or when the Country Sales page has no "Take the Tour" button.
//
//   DEMO_BASE=https://demo.datapallas.com DEMO_TOKEN_COUNTRY_SALES=... DEMO_TOKEN_DASHBOARD_DEMOS=... DEMO_TOKEN_CUBE_STORIES=... node check-frames.mjs
//   DEMO_INSECURE=1      accept a self-signed certificate (the throwaway chain of test-chain.sh)
//   DEMO_SHOTS=<dir>     keep a screenshot of each page there
// Run it where Playwright is installed (test-chain.sh runs it in the Playwright image). Tokens are never printed.
import fs from "node:fs";

const { chromium } = await import(process.env.PW_MODULE || "/home/pwuser/node_modules/playwright/index.mjs");

const base = (process.env.DEMO_BASE || "").replace(/\/$/, "");
const pages = [
  ["g-cube-country-sales", process.env.DEMO_TOKEN_COUNTRY_SALES, true],
  ["g-dashboard-demos", process.env.DEMO_TOKEN_DASHBOARD_DEMOS, false],
  ["g-cube-stories", process.env.DEMO_TOKEN_CUBE_STORIES, false],
];
if (!base || pages.some(([, t]) => !t)) {
  console.error("DEMO_BASE and the three DEMO_TOKEN_* variables are needed");
  process.exit(2);
}
const origin = new URL(base).origin;

const browser = await chromium.launch({ args: process.env.DEMO_INSECURE ? ["--ignore-certificate-errors"] : [] });
const failures = [];
for (const [id, token, wantTour] of pages) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, ignoreHTTPSErrors: !!process.env.DEMO_INSECURE });
  const page = await context.newPage();
  let requests = 0;
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin !== origin) return; // map tiles, the Leaflet stylesheet: not ours
    requests++;
    if (response.status() !== 200) failures.push(`${id}: ${response.status()} ${response.request().method()} ${url.pathname}`);
  });
  await page.goto(`${base}/dashboard/${id}?token=${token}`, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(6000);

  // press everything a visitor can press, twice around; a "Show Me" asks Yes/No, say yes
  for (let round = 0; round < 2; round++) {
    const controls = page.locator('button:visible, summary:visible, [role="tab"]:visible, [aria-expanded="false"]:visible');
    const count = Math.min(await controls.count(), 80);
    for (let i = 0; i < count; i++) {
      try {
        const control = controls.nth(i);
        const label = ((await control.innerText({ timeout: 500 })) || "").trim();
        if (/reset|clear/i.test(label) && round === 0) continue;
        await control.click({ timeout: 1500, noWaitAfter: true });
        await page.waitForTimeout(350);
        const yes = page.locator('[id^="btnShowMeYes"]:visible').first();
        if (await yes.count()) await yes.click({ timeout: 1000 }).catch(() => {});
      } catch {
        /* a control that moved or went away: the next one */
      }
    }
    await page.waitForTimeout(2500);
  }

  const tour = page.locator("rb-dashboard-tour");
  if (wantTour && (await tour.count()) === 0) failures.push(`${id}: no "Take the Tour" button on the page`);
  const start = tour.locator("button, a").first();
  if (await start.count()) {
    await start.click({ timeout: 2000 }).catch(() => {});
    for (let i = 0; i < 30; i++) {
      const next = page.locator("button:visible", { hasText: /^(Next|Done|Finish|Got it)/i }).first();
      if (!(await next.count())) break;
      await next.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  await page.waitForTimeout(1500);
  if (process.env.DEMO_SHOTS) await page.screenshot({ path: `${process.env.DEMO_SHOTS}/${id}.png` });
  console.log(`${id}: ${requests} requests to ${origin}, tour button ${(await tour.count()) ? "present" : "absent"}`);
  await context.close();
}
await browser.close();

if (failures.length) {
  for (const f of [...new Set(failures)]) console.log("FAIL  " + f);
  console.log("FRAMES result=fail");
  process.exit(1);
}
console.log("FRAMES result=pass");
