/* Copyright Contributors to the Open Cluster Management project */
/**
 * Playwright E2E test for ACM-30521: Azure HCP cluster creation UI.
 *
 * Verifies:
 * 1. Clicking Azure in the cluster catalog navigates to the control plane type selection page.
 * 2. The control plane selection page shows Hosted and Standalone cards.
 * 3. Clicking Hosted navigates to the Azure HCP CLI instructions page.
 * 4. The CLI instructions page shows all required steps and code blocks.
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

  const alreadyLoggedIn = await page
    .locator('#page-sidebar, [data-test="nav"], .pf-v5-c-page__sidebar, .pf-c-page__sidebar')
    .first()
    .isVisible({ timeout: 3_000 })
    .catch(() => false)
  if (alreadyLoggedIn) return

  const providerLink = page.locator('a.idp')
  const hasProviderSelection = await providerLink.first().isVisible({ timeout: 10_000 }).catch(() => false)
  if (hasProviderSelection) {
    const providerCount = await providerLink.count()
    if (providerCount === 1) {
      await providerLink.first().click()
    } else {
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

  const usernameField = page.locator('#inputUsername, input[name="username"], input[type="text"]').first()
  await usernameField.waitFor({ state: 'visible', timeout: 15_000 })
  await usernameField.fill(OCP_USERNAME)

  const passwordField = page.locator('#inputPassword, input[name="password"], input[type="password"]').first()
  await passwordField.fill(OCP_PASSWORD)

  await page.locator('button[type="submit"]').click()

  const approveButton = page.locator(
    'input[name="approve"], button:has-text("Allow selected permissions"), button[type="submit"]:has-text("Log in")'
  )
  const needsApproval = await approveButton.first().isVisible({ timeout: 5_000 }).catch(() => false)
  if (needsApproval) {
    await approveButton.first().click()
  }

  await page.waitForLoadState('load', { timeout: 30_000 })
  await expect(
    page.locator('#page-sidebar, [data-test="nav"], .pf-v5-c-page__sidebar, .pf-c-page__sidebar').first()
  ).toBeVisible({ timeout: 30_000 })
}

test.describe('ACM-30521: Azure HCP cluster creation UI', () => {
  test.use({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
  })

  test.setTimeout(120_000)

  test('should navigate from cluster catalog to Azure control plane selection page', async ({ page }) => {
    await loginToOCP(page)

    // Navigate to the cluster creation catalog
    await page.goto(`${RHACM_URL}/multicloud/infrastructure/clusters/create`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await page.waitForLoadState('load')

    // Find and click the Azure card
    const azureCard = page.locator('[data-testid="azure"]')
    await expect(azureCard).toBeVisible({ timeout: 15_000 })
    await azureCard.click()

    // Verify we land on the Azure control plane selection page
    await expect(page).toHaveURL(/\/create\/azure\/control-plane/, { timeout: 15_000 })

    // Verify the page title
    await expect(page.getByText('Control plane type - Azure')).toBeVisible({ timeout: 10_000 })

    // Verify both control plane cards are visible
    const hostedCard = page.locator('[data-testid="hosted"]')
    const standaloneCard = page.locator('[data-testid="standalone"]')
    await expect(hostedCard).toBeVisible({ timeout: 10_000 })
    await expect(standaloneCard).toBeVisible({ timeout: 10_000 })

    // Verify the Hosted card has Technology Preview badge
    await expect(page.getByText('Technology Preview')).toBeVisible()

    // Verify the Hosted card has CLI-based badge
    await expect(page.getByText('CLI-based')).toBeVisible()
  })

  test('should navigate to Azure HCP CLI instructions page when clicking Hosted', async ({ page }) => {
    await loginToOCP(page)

    // Navigate directly to the Azure control plane selection page
    await page.goto(`${RHACM_URL}/multicloud/infrastructure/clusters/create/azure/control-plane`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await page.waitForLoadState('load')

    // Click the Hosted card (only works if hypershift is enabled on the cluster)
    const hostedCard = page.locator('[data-testid="hosted"]')
    await expect(hostedCard).toBeVisible({ timeout: 15_000 })

    // Check if hosted card is clickable (hypershift enabled)
    const isClickable = await hostedCard.evaluate((el) => {
      return el.getAttribute('tabindex') !== '-1' && !el.classList.contains('pf-m-disabled')
    })

    if (isClickable) {
      await hostedCard.click()

      // Verify we land on the Azure CLI instructions page
      await expect(page).toHaveURL(/\/create\/azure\/cli/, { timeout: 15_000 })

      // Verify all CLI instruction steps are visible
      await expect(page.getByText('Prerequisites and configuration')).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Prepare environment variables and Azure credentials')).toBeVisible()
      await expect(page.getByText('Configure OIDC issuer')).toBeVisible()
      await expect(page.getByText('Create workload identities')).toBeVisible()
      await expect(page.getByText('Create Azure infrastructure')).toBeVisible()
      await expect(page.getByText('Create the Hosted Control Plane')).toBeVisible()

      // Verify the main cluster creation command is present
      await expect(page.getByText('hcp create cluster azure')).toBeVisible()

      // Verify the help command is present
      await expect(page.getByText('hcp create cluster azure --help')).toBeVisible()

      // Verify the breadcrumbs show the correct path
      await expect(page.getByText('Clusters')).toBeVisible()
      await expect(page.getByText('Infrastructure')).toBeVisible()
    }
  })
})
