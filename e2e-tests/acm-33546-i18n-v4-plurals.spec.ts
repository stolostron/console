/* Copyright Contributors to the Open Cluster Management project */
/**
 * E2E test for ACM-33546: Verify i18next v4 plural format migration.
 *
 * Validates that:
 * 1. The console loads and renders correctly after the i18n migration.
 * 2. Plural strings display correctly (singular and plural forms).
 * 3. Plugin namespace translations load correctly.
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
    // Dev bridge redirects to its OAuth endpoint — "navigation interrupted".
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
      // Dev bridge redirects to its OAuth endpoint — "navigation interrupted".
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
    // Dev bridge redirects to its OAuth endpoint — "navigation interrupted".
  }
  const kubeAdmin = page.locator('a:has-text("kube:admin")')
  const sidebar = page.locator(CONSOLE_SIDEBAR).first()
  const firstVisible = await Promise.race([
    kubeAdmin.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'provider' as const),
    sidebar.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'sidebar' as const),
  ]).catch(() => 'timeout' as const)
  if (firstVisible === 'sidebar') return
  if (firstVisible === 'provider') {
    await kubeAdmin.click()
    await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {})
  } else {
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
  await page.locator('button[type="submit"]').click()
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

test.describe('ACM-33546: i18next v4 plural format migration', () => {
  test.use({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
  })

  test.setTimeout(120_000)

  test('console loads and Infrastructure page renders after i18n migration', async ({ page }) => {
    await loginToOCP(page)

    // Verify the console loaded — sidebar navigation is visible
    await expect(page.locator(CONSOLE_SIDEBAR).first()).toBeVisible({ timeout: 15_000 })

    // Verify translation files load without errors by checking the console for i18next warnings
    const i18nErrors: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('i18next') && (text.includes('error') || text.includes('warning'))) {
        i18nErrors.push(text)
      }
    })

    // Navigate to Infrastructure > Clusters via URL (avoids submenu click issues)
    await page.goto(`${RHACM_URL}/multicloud/infrastructure/clusters`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})

    // Verify the page rendered (no blank screen from i18n failure)
    // Use broad selectors covering PF v5 and v6 page main areas
    const pageContent = page.locator('main, [role="main"], .pf-v5-c-page__main, .pf-v6-c-page__main').first()
    await expect(pageContent).toBeVisible({ timeout: 15_000 })

    // Verify no i18next errors were logged
    expect(i18nErrors).toHaveLength(0)
  })

  test('plural strings resolve correctly at runtime', async ({ page }) => {
    await loginToOCP(page)

    await page.goto(`${RHACM_URL}/multicloud/infrastructure/clusters`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})

    // Verify i18next resolves v4 plural keys correctly via the runtime t() function
    const pluralResult = await page.evaluate(() => {
      // Access the i18next instance from the window (exposed by the plugin runtime)
      const i18n = (window as any).i18next ?? (window as any).__i18next
      if (!i18n || typeof i18n.t !== 'function') return null
      return {
        singular: i18n.t('{{count}} cluster', { count: 1 }),
        plural: i18n.t('{{count}} cluster', { count: 5 }),
        hasLegacyPlural: i18n.exists('{{count}} cluster_plural'),
        hasV4One: i18n.exists('{{count}} cluster_one'),
        hasV4Other: i18n.exists('{{count}} cluster_other'),
      }
    })

    // If i18next isn't exposed globally, verify the page rendered without raw keys instead
    if (pluralResult) {
      expect(pluralResult.singular).toBe('1 cluster')
      expect(pluralResult.plural).toBe('5 clusters')
      expect(pluralResult.hasLegacyPlural).toBe(false)
      expect(pluralResult.hasV4One).toBe(true)
      expect(pluralResult.hasV4Other).toBe(true)
    } else {
      // Fallback: verify no raw translation keys are visible on the page
      const bodyText = await page.locator('body').innerText()
      expect(bodyText).not.toContain('_plural')
      expect(bodyText).not.toContain('{{count}} cluster_one')
      expect(bodyText).not.toContain('{{count}} cluster_other')
    }
  })

  test('Governance page renders without translation errors', async ({ page }) => {
    await loginToOCP(page)

    // Navigate to Governance via URL
    await page.goto(`${RHACM_URL}/multicloud/governance/policies`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})

    // Verify page content rendered using broad selectors
    const pageContent = page.locator('main, [role="main"], .pf-v5-c-page__main, .pf-v6-c-page__main').first()
    await expect(pageContent).toBeVisible({ timeout: 15_000 })

    // Verify no untranslated keys are visible (keys shown as raw text indicate broken i18n)
    // Check that no visible text contains the _one or _other suffix pattern
    // (which would indicate the key is being displayed instead of the translation)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('_one}}')
    expect(bodyText).not.toContain('_other}}')
  })
})
