/* Copyright Contributors to the Open Cluster Management project */

import { fetchRetry, ResourceErrorCode } from './resource-request'
import { fetchWithCsrf, getCookie } from './utils'

describe('csrf', () => {
  const originalFetch = global.fetch
  const originalCookie = Object.getOwnPropertyDescriptor(document, 'cookie')
  let cookie = ''

  beforeEach(() => {
    cookie = 'csrf-token=token-a'
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookie,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (originalCookie) Object.defineProperty(document, 'cookie', originalCookie)
  })

  function csrfDenied() {
    return new Response('invalid CSRFToken: CSRF token does not match CSRF cookie\n', {
      status: 403,
      headers: { 'content-type': 'text/plain' },
    })
  }

  it('returns the last cookie when the name is duplicated', () => {
    cookie = 'csrf-token=old-token; csrf-token=new-token'
    expect(getCookie('csrf-token')).toBe('new-token')
  })

  it('retries a search POST once after the console rotates the csrf cookie', async () => {
    let calls = 0
    const sentTokens: Array<string | null> = []
    const fetchMock = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1
      sentTokens.push(new Headers(init?.headers).get('X-CSRFToken'))
      if (calls === 1) {
        cookie = 'csrf-token=token-b'
        return csrfDenied()
      }
      return new Response('{"data":{}}', { status: 200, headers: { 'content-type': 'application/json' } })
    })
    global.fetch = fetchMock as typeof fetch

    const response = await fetchWithCsrf('/proxy/search', { method: 'POST' })

    expect(response.status).toBe(200)
    expect(sentTokens).toEqual(['token-a', 'token-b'])
  })

  it('does not retry a CSRF mismatch when the cookie did not change', async () => {
    const fetchMock = jest.fn(async () => csrfDenied())
    global.fetch = fetchMock as typeof fetch

    const response = await fetchWithCsrf('/proxy/search', { method: 'POST' })

    expect(response.status).toBe(403)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetchRetry retries a CSRF 403 once with the new token', async () => {
    let calls = 0
    const sentTokens: Array<string | null> = []
    const fetchMock = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1
      sentTokens.push(new Headers(init?.headers).get('X-CSRFToken'))
      if (calls === 1) {
        cookie = 'csrf-token=token-b'
        return csrfDenied()
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    global.fetch = fetchMock as typeof fetch

    const result = await fetchRetry<{ ok: boolean }>({ method: 'POST', url: '/multicloud/hub', data: { a: 1 } })

    expect(result.status).toBe(200)
    expect(result.data).toEqual({ ok: true })
    expect(sentTokens).toEqual(['token-a', 'token-b'])
  })

  it('fetchRetry does not retry a CSRF 403 when the cookie is unchanged', async () => {
    const fetchMock = jest.fn(async () => csrfDenied())
    global.fetch = fetchMock as typeof fetch

    await expect(fetchRetry({ method: 'POST', url: '/multicloud/hub' })).rejects.toMatchObject({
      code: ResourceErrorCode.Forbidden,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
