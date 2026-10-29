/* Copyright Contributors to the Open Cluster Management project */
export const convertStringToQuery = (searchText: string, queryResultLimit: number) => {
  const searchTokens = searchText.split(' ')
  const keywords = searchTokens.filter((token) => token !== '' && token.indexOf(':') < 0)
  const filters = searchTokens
    .filter((token) => token.indexOf(':') >= 0)
    .map((f) => {
      const splitIdx = f.indexOf(':')
      const property = f.substring(0, splitIdx)
      const values = f.substring(splitIdx + 1)
      return { property, values: values.split(',') }
    })

  return {
    keywords,
    filters,
    limit: queryResultLimit,
  }
}

// Last match wins. OpenShift console does the same, and a newer csrf-token
// with the same name is the one the bridge compares on /api requests.
export function getCookie(name: string) {
  if (!document?.cookie) return undefined
  const prefix = `${name}=`
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(prefix))
    .map((part) => part.slice(prefix.length))
    .pop()
}

const CSRF_MISMATCH_BODY = 'CSRF token does not match'
const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

function headersWithCsrf(method: string, headers: Headers) {
  if (CSRF_SAFE_METHODS.has(method)) return headers
  const token = getCookie('csrf-token')
  if (token) headers.set('X-CSRFToken', token)
  else headers.delete('X-CSRFToken')
  return headers
}

// Reads the console csrf-token at send time. If the bridge rotated the cookie
// after an earlier read, the first POST is rejected before it is proxied, so
// one retry with the new token is safe.
export function fetchWithCsrf(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const credentials = init?.credentials ?? 'same-origin'
  const firstHeaders = headersWithCsrf(method, new Headers(init?.headers))
  const send = (headers: Headers) => fetch(input, { ...init, headers, credentials })

  return send(firstHeaders).then(async (response) => {
    if (response.status !== 403 || CSRF_SAFE_METHODS.has(method)) return response
    const body = await response.clone().text()
    if (!body.includes(CSRF_MISMATCH_BODY)) return response
    const retryHeaders = headersWithCsrf(method, new Headers(init?.headers))
    if (retryHeaders.get('X-CSRFToken') === firstHeaders.get('X-CSRFToken')) return response
    return send(retryHeaders)
  })
}
