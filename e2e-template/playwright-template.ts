/* Copyright Contributors to the Open Cluster Management project */
/**
 * Playwright E2E template for RHACM console bug verification.
 *
 * Usage: Copy this file, rename it for your test, and fill in the
 * "Bug or Feature verification" section. Do NOT hardcode credentials or URLs.
 */
import { test, expect, type Page } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config()

const requiredEnvVars = ['OCP_USERNAME', 'OCP_PASSWORD'] as const
const missingVars = requiredEnvVars.filter((key) => !process.env[key])
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
}

const RHACM_URL = process.env.RHACM_URL || 'http://localhost:9000'
const OCP_USERNAME = process.env.OCP_USERNAME!
const OCP_PASSWORD = process.env.OCP_PASSWORD!

async function loginToOCP(page: Page): Promise<void> {
  await page.goto(RHACM_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForLoadState('load')

  // Already logged in — console content is showing, skip login flow.
  const alreadyLoggedIn = await page
    .locator('#page-sidebar, [data-test="nav"], .pf-v5-c-page__sidebar, .pf-c-page__sidebar')
    .first()
    .isVisible({ timeout: 3_000 })
    .catch(() => false)
  if (alreadyLoggedIn) return

  // OCP OAuth login page — may redirect through an identity provider.
  // If a provider selection page is shown, click the matching provider link.
  // Handles common provider names: "kube:admin", "htpasswd_provider", "my_htpasswd_provider", etc.
  const providerLink = page.locator('a.idp')
  const hasProviderSelection = await providerLink.first().isVisible({ timeout: 10_000 }).catch(() => false)
  if (hasProviderSelection) {
    const providerCount = await providerLink.count()
    if (providerCount === 1) {
      await providerLink.first().click()
    } else {
      // Prefer kube:admin, then any htpasswd variant, then fall back to the first link.
      const kubeAdmin = page.locator('a.idp:has-text("kube:admin")')
      const htpasswd = page.locator('a.idp:text-matches("htpasswd", "i")')
      if (await kubeAdmin.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await kubeAdmin.click()
      } else if (await htpasswd.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
        await htpasswd.first().click()
      } else {
        await providerLink.first().click()
      }
    }
    await page.waitForLoadState('load')
  }

  // Fill the login form — wait for either the standard OCP login form or a generic form.
  const usernameField = page.locator('#inputUsername, input[name="username"], input[type="text"]').first()
  await usernameField.waitFor({ state: 'visible', timeout: 15_000 })
  await usernameField.fill(OCP_USERNAME)

  const passwordField = page.locator('#inputPassword, input[name="password"], input[type="password"]').first()
  await passwordField.fill(OCP_PASSWORD)

  await page.locator('button[type="submit"]').click()

  // Handle the OAuth "authorize access" approval page if it appears.
  const approveButton = page.locator(
    'input[name="approve"], button:has-text("Allow selected permissions"), button[type="submit"]:has-text("Log in")'
  )
  const needsApproval = await approveButton.first().isVisible({ timeout: 5_000 }).catch(() => false)
  if (needsApproval) {
    await approveButton.first().click()
  }

  // Wait for the console to load after login redirect.
  await page.waitForLoadState('load', { timeout: 30_000 })

  // Verify login succeeded by checking for console page elements.
  await expect(
    page.locator('#page-sidebar, [data-test="nav"], .pf-v5-c-page__sidebar, .pf-c-page__sidebar').first()
  ).toBeVisible({ timeout: 30_000 })
}

test.describe('ACM-XXXX: <short bug title>', () => {
  test.use({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
  })

  // Generous timeout for environments with slow OAuth redirects.
  test.setTimeout(120_000)

  test('should <expected behavior after fix>', async ({ page }) => {
    await loginToOCP(page)

    // ── Bug or Feature verification ──────────────────────────────
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
