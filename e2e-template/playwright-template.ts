/* Copyright Contributors to the Open Cluster Management project */
/**
 * Playwright E2E template for RHACM console bug verification.
 *
 * Usage: Copy this file, rename it for your test, and fill in the
 * "Bug-specific verification" section. Do NOT hardcode credentials or URLs.
 */
import { test, expect, type Page } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config()

const RHACM_URL = process.env.RHACM_URL!
const OCP_USERNAME = process.env.OCP_USERNAME!
const OCP_PASSWORD = process.env.OCP_PASSWORD!

async function loginToOCP(page: Page) {
  await page.goto(RHACM_URL, { waitUntil: 'networkidle' })

  // OCP OAuth login page — may redirect through an identity provider.
  // 1. If a "Log in with…" provider link is shown (e.g. kube:admin), click it.
  const providerLink = page.locator('a:has-text("kube:admin")')
  if (await providerLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await providerLink.click()
    await page.waitForLoadState('networkidle')
  }

  // 2. Fill the login form.
  await page.waitForSelector('#inputUsername', { timeout: 15_000 })
  await page.fill('#inputUsername', OCP_USERNAME)
  await page.fill('#inputPassword', OCP_PASSWORD)
  await page.click('button[type="submit"]')

  // 3. Wait for the redirect back into the console.
  await page.waitForURL(`${RHACM_URL}/**`, { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
}

test.describe('ACM-XXXX: <short bug title>', () => {
  test.use({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
  })

  test('should <expected behavior after fix>', async ({ page }) => {
    await loginToOCP(page)

    // ── Bug-specific verification ──────────────────────────────
    // Navigate to the affected page, reproduce the scenario, and
    // assert the correct behavior. Example:
    //
    //   await page.click('nav >> text=Infrastructure')
    //   await page.click('text=Clusters')
    //   await expect(page.locator('.pf-c-table')).toBeVisible()
    //   await expect(page.locator('.pf-c-empty-state')).not.toBeVisible()
    //
    // Replace the block above with your actual verification steps.
  })
})
