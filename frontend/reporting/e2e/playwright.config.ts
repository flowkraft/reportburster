/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 90000,
  use: {
    headless: false,
    viewport: { width: 1400, height: 1000 },
    launchOptions: {
      slowMo: 500,
    },
    trace: 'on',
  },
  expect: {
    toMatchSnapshot: { threshold: 0.2 },
  },
  // Give failing tests 3 retry attempts
  retries: 3,
  // Limit the number of workers on CI, use default locally
  workers: 1,
};

module.exports = config;
