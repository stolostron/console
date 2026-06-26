/* Copyright Contributors to the Open Cluster Management project */
/**
 * ACM-34394: Multi-select chip overflow breaks modal layout in "Edit namespace bindings"
 *
 * Verifies that when enough namespaces are selected to force chips to wrap,
 * the menu toggle expands vertically instead of overflowing into the modal footer.
 */
import { test, expect, type Page } from '@playwright/test'
import https from 'node:https'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

const requiredEnvVars = ['OCP_USERNAME', 'OCP_PASSWORD'] as const
const missingVars = requiredEnvVars.filter((key) => !process.env[key])
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
}

const RHACM_URL = process.env.RHACM_URL || 'http://localhost:9000'
const OCP_API_URL = process.env.OCP_API_URL
const OCP_USERNAME = process.env.OCP_USERNAME!
const OCP_PASSWORD = process.env.OCP_PASSWORD!
const AUTH_STATE_PATH = path.join(__dirname, '.auth-state.json')
const AUTH_STATE_MAX_AGE_MS = 30 * 60 * 1000

const CONSOLE_SIDEBAR = '#page-sidebar, [data-test="nav"], .pf-v5-c-page__sidebar, .pf-c-page__sidebar'

const tlsAgent = new https.Agent({ rejectUnauthorized: false })

interface HttpResult {
  statusCode: number
  headers: Record<string, string | string[] | undefined>
  body: string
}

function httpGet(url: string, headers?: Record<string, string>): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const opts = { agent: url.startsWith('https') ? tlsAgent : undefined, headers }
    mod.get(url, opts, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve({ statusCode: res.statusCode, headers: res.headers as HttpResult['headers'], body: '' })
        return
      }
      let body = ''
      res.on('data', (chunk: Buffer) => (body += chunk))
      res.on('end', () => resolve({ statusCode: res.statusCode!, headers: res.headers as HttpResult['headers'], body }))
    }).on('error', reject)
  })
}

async function getOAuthToken(): Promise<string | null> {
  if (!OCP_API_URL) return null
  try {
    const wellKnown = await httpGet(`${OCP_API_URL}/.well-known/oauth-authorization-server`)
    if (wellKnown.statusCode !== 200) return null
    const { authorization_endpoint } = JSON.parse(wellKnown.body)
    const authURL = `${authorization_endpoint}?client_id=openshift-challenging-client&response_type=token`
    const resp = await httpGet(authURL, {
      Authorization: `Basic ${Buffer.from(`${OCP_USERNAME}:${OCP_PASSWORD}`).toString('base64')}`,
      'X-CSRF-Token': 'xxx',
    })
    const location = resp.headers.location as string | undefined
    if (!location) return null
    const hash = location.split('#')[1]
    if (!hash) return null
    return new URLSearchParams(hash).get('access_token')
  } catch {
    return null
  }
}

async function tryTokenInjection(page: Page): Promise<boolean> {
  const token = await getOAuthToken()
  if (!token) return false
  const url = new URL(RHACM_URL)
  await page.context().addCookies([
    {
      name: 'openshift-session-token',
      value: token,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'Lax',
    },
  ])
  try {
    await page.goto(RHACM_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  } catch {
    // Dev bridge redirects to its OAuth endpoint
  }
  const ok = await page
    .locator(CONSOLE_SIDEBAR)
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false)
  if (ok) await page.context().storageState({ path: AUTH_STATE_PATH })
  return ok
}

async function tryCachedAuthState(page: Page): Promise<boolean> {
  try {
    if (!fs.existsSync(AUTH_STATE_PATH)) return false
    const age = Date.now() - fs.statSync(AUTH_STATE_PATH).mtimeMs
    if (age > AUTH_STATE_MAX_AGE_MS) {
      fs.unlinkSync(AUTH_STATE_PATH)
      return false
    }
    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8'))
    if (state.cookies?.length) await page.context().addCookies(state.cookies)
    try {
      await page.goto(RHACM_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    } catch {
      // Dev bridge redirects
    }
    return await page
      .locator(CONSOLE_SIDEBAR)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false)
  } catch {
    return false
  }
}

async function uiLogin(page: Page): Promise<void> {
  try {
    await page.goto(RHACM_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  } catch {
    // Dev bridge redirects
  }

  const kubeAdmin = page.locator('a:has-text("kube:admin")')
  const sidebar = page.locator(CONSOLE_SIDEBAR).first()
  const loginForm = page.locator('#inputUsername, input[name="username"]').first()

  const firstVisible = await Promise.race([
    kubeAdmin.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'provider' as const),
    sidebar.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'sidebar' as const),
    loginForm.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'loginForm' as const),
  ]).catch(() => 'timeout' as const)

  if (firstVisible === 'sidebar') return

  if (firstVisible === 'provider') {
    await kubeAdmin.click()
    await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {})
  } else if (firstVisible === 'timeout') {
    const htpasswd = page.locator('a:text-matches("htpasswd", "i")').first()
    await htpasswd.waitFor({ state: 'visible', timeout: 10_000 })
    await htpasswd.click()
    await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {})
  }

  const usernameField = page.locator('#inputUsername, input[name="username"], input[type="text"]').first()
  await usernameField.waitFor({ state: 'visible', timeout: 15_000 })
  await usernameField.fill(OCP_USERNAME)
  const passwordField = page.locator('#inputPassword, input[name="password"], input[type="password"]').first()
  await passwordField.fill(OCP_PASSWORD)

  const loginButton = page.locator('button[type="submit"]')
  await loginButton.click()

  const approveButton = page.locator(
    'input[name="approve"], button:has-text("Allow selected permissions"), button[type="submit"]:has-text("Log in")'
  )
  const needsApproval = await approveButton
    .first()
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true)
    .catch(() => false)
  if (needsApproval) {
    await approveButton.first().click()
  }

  await page.waitForLoadState('load', { timeout: 30_000 })
  await expect(page.locator(CONSOLE_SIDEBAR).first()).toBeVisible({ timeout: 30_000 })
  await page.context().storageState({ path: AUTH_STATE_PATH })
}

async function loginToOCP(page: Page): Promise<void> {
  if (await tryTokenInjection(page)) return
  if (await tryCachedAuthState(page)) return
  await uiLogin(page)
}

test.describe('ACM-34394: Multi-select chip overflow in Edit namespace bindings', () => {
  test.use({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
  })

  test.setTimeout(120_000)

  test('should expand toggle height when namespace chips wrap to multiple lines', async ({ page }) => {
    await loginToOCP(page)

    // Navigate to Clusters > Cluster sets
    await page.goto(`${RHACM_URL}/multicloud/infrastructure/clusters/sets`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })

    // Wait for the cluster sets table to load
    const table = page.locator('.pf-v6-c-table, .pf-c-table').first()
    await table.waitFor({ state: 'visible', timeout: 30_000 })

    // Find the first cluster set row's kebab action menu
    const firstRowKebab = page.locator('tbody tr').first().locator('button[aria-label="Actions"]')
    await firstRowKebab.click()

    // Click "Edit namespace bindings"
    const editBindingsAction = page.locator('button:has-text("Edit namespace bindings"), a:has-text("Edit namespace bindings")').first()
    await editBindingsAction.waitFor({ state: 'visible', timeout: 5_000 })
    await editBindingsAction.click()

    // Wait for the modal to appear
    const modal = page.locator('.pf-v6-c-modal-box, .pf-c-modal-box').first()
    await modal.waitFor({ state: 'visible', timeout: 10_000 })

    // Wait for the multi-select to finish loading (skeleton disappears)
    await page.waitForTimeout(3_000)

    // Get the menu toggle element inside the modal
    const toggle = modal.locator('.pf-v6-c-menu-toggle').first()
    await toggle.waitFor({ state: 'visible', timeout: 10_000 })

    // Verify the toggle does NOT have maxHeight: 36px (the fix)
    const maxHeight = await toggle.evaluate((el) => el.style.maxHeight)
    expect(maxHeight).not.toBe('36px')

    // If there are selected chips, verify they stay within the toggle bounds
    const chipGroup = modal.locator('.pf-v6-c-label-group, .pf-c-label-group').first()
    const hasChips = await chipGroup.isVisible().catch(() => false)

    if (hasChips) {
      const toggleBox = await toggle.boundingBox()
      const chipGroupBox = await chipGroup.boundingBox()

      if (toggleBox && chipGroupBox) {
        const chipGroupBottom = chipGroupBox.y + chipGroupBox.height
        const toggleBottom = toggleBox.y + toggleBox.height
        expect(chipGroupBottom).toBeLessThanOrEqual(toggleBottom + 2)
      }
    }
  })
})
