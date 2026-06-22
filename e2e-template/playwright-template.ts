/* Copyright Contributors to the Open Cluster Management project */
/**
 * Playwright E2E template for RHACM console bug verification.
 *
 * Usage: Copy this file, rename it for your test, and fill in the
 * "Bug or Feature verification" section. Do NOT hardcode credentials or URLs.
 *
 * Authentication strategy (tried in order):
 *   1. Session token injection via OCP OAuth API — no browser interaction at all.
 *      Requires OCP_API_URL env var (e.g. https://api.cluster.example.com:6443).
 *   2. Cached auth state — reuses cookies from a previous successful login (<30 min old).
 *   3. UI-based login — fills the OCP OAuth form as a last resort.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test'
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
const OCP_API_URL = process.env.OCP_API_URL // e.g. https://api.cluster.example.com:6443
const OCP_USERNAME = process.env.OCP_USERNAME!
const OCP_PASSWORD = process.env.OCP_PASSWORD!
const AUTH_STATE_PATH = path.join(__dirname, '.auth-state.json')
const AUTH_STATE_MAX_AGE_MS = 30 * 60 * 1000

const CONSOLE_SIDEBAR = '#page-sidebar, [data-test="nav"], .pf-v5-c-page__sidebar, .pf-c-page__sidebar'

// ── Strategy 1: OAuth token injection ────────────────────────────────────────
// Uses OCP's "openshift-challenging-client" to obtain an access token via
// HTTP Basic Auth — then injects it as the `openshift-session-token` cookie.
// This bypasses every browser-rendered login page entirely.

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

// ── Strategy 2: Cached auth state ────────────────────────────────────────────
// Restores cookies and local-storage from a previous successful login.

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

// ── Strategy 3: UI-based login (fallback) ────────────────────────────────────

async function uiLogin(page: Page): Promise<void> {
  try {
    await page.goto(RHACM_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  } catch {
    // Dev bridge redirects to its OAuth endpoint — "navigation interrupted".
  }

  // Wait for either the sidebar (already authed) or a provider link to appear.
  // Using waitFor instead of isVisible — isVisible is an instant check that
  // returns false before the bridge redirect and page render complete.
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

// ── Combined login entrypoint ────────────────────────────────────────────────

async function loginToOCP(page: Page): Promise<void> {
  // 1. Try token injection (fastest, most reliable — requires OCP_API_URL)
  if (await tryTokenInjection(page)) return

  // 2. Try cached auth state from a previous run
  if (await tryCachedAuthState(page)) return

  // 3. Fall back to UI login
  await uiLogin(page)
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
