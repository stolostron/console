/* Copyright Contributors to the Open Cluster Management project */
import { defineConfig } from '@playwright/test'

/**
 * Minimal Playwright config for sanity-checking the @playwright/test package.
 * Run via: npm run test:playwright:sanity
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'playwright-sanity.spec.ts',
  timeout: 30_000,
  retries: 0,
  use: {
    headless: true,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  reporter: [['list']],
})
