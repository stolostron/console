/* Copyright Contributors to the Open Cluster Management project */
/**
 * Playwright sanity check — verifies that the @playwright/test package is
 * functional after install or version bump. This does NOT require a running
 * application; it exercises Playwright's core capabilities in isolation.
 *
 * Run via: npm run test:playwright:sanity
 */
import { test, expect } from '@playwright/test'

test.describe('Playwright sanity check', () => {
  test('browser launches and can render a page', async ({ page }) => {
    await page.setContent('<h1>Sanity Check</h1><p id="status">ok</p>')
    await expect(page.locator('h1')).toHaveText('Sanity Check')
    await expect(page.locator('#status')).toHaveText('ok')
  })

  test('basic navigation and JavaScript execution work', async ({ page }) => {
    await page.setContent('<div id="app"></div>')
    const result = await page.evaluate(() => {
      document.getElementById('app')!.textContent = 'evaluated'
      return document.getElementById('app')!.textContent
    })
    expect(result).toBe('evaluated')
    await expect(page.locator('#app')).toHaveText('evaluated')
  })

  test('network interception works', async ({ page }) => {
    await page.route('https://localhost/api/health', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'healthy' }) })
    )
    await page.goto('about:blank')
    const response = await page.evaluate(async () => {
      const res = await fetch('https://localhost/api/health')
      return res.json()
    })
    expect(response).toEqual({ status: 'healthy' })
  })

  test('selectors and assertions work', async ({ page }) => {
    await page.setContent(`
      <button disabled>Disabled</button>
      <button>Enabled</button>
      <input type="text" placeholder="Type here" />
    `)
    await expect(page.locator('button', { hasText: 'Disabled' })).toBeDisabled()
    await expect(page.locator('button', { hasText: 'Enabled' })).toBeEnabled()
    await page.locator('input[placeholder="Type here"]').fill('hello')
    await expect(page.locator('input')).toHaveValue('hello')
  })
})
