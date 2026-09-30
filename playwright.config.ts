import { defineConfig, devices } from '@playwright/test';

// Playwright base URL.
//
// Overridable so the same suite can run against a dev server, a container, or
// any deployed server — the app must never assume localhost.
const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e/playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only manage a dev server when one was not supplied via E2E_BASE_URL.
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npx ng serve --port 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
