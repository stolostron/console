/* Copyright Contributors to the Open Cluster Management project */
import { constants } from 'http2'
import { Agent } from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HeadersInit } from 'node-fetch'
import { fetchRetry } from './fetch-retry'
import { getCACertificate } from './serviceAccountToken'

const { HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_AUTHORIZATION, HTTP2_HEADER_ACCEPT, HTTP2_HEADER_USER_AGENT } =
  constants

const agent = new Agent({ rejectUnauthorized: false })

export function jsonRequest<T>(url: string, token?: string, retry?: number): Promise<T> {
  const headers: HeadersInit = { [HTTP2_HEADER_ACCEPT]: 'application/json' }
  if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
  return fetchRetry(url, { headers, agent, compress: true }, retry).then(
    (response) => response.json() as unknown as Promise<T>
  )
}

export interface PostResponse<T> {
  statusCode: number
  body?: T
}

export interface PutResponse {
  statusCode?: number
  body?: {
    kind?: string
    name?: string
    message?: string
    reason?: string
    code?: number
  }
}

export function jsonPost<T = unknown>(
  url: string,
  body: unknown,
  token?: string,
  userAgent?: string,
  proxyAgent?: HttpsProxyAgent<string>
): Promise<PostResponse<T>> {
  const headers: HeadersInit = {
    [HTTP2_HEADER_ACCEPT]: 'application/json',
    [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
  }
  if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
  if (userAgent) headers[HTTP2_HEADER_USER_AGENT] = userAgent
  return fetchRetry(url, {
    method: 'POST',
    headers,
    agent: proxyAgent || agent,
    body: JSON.stringify(body),
    compress: true,
  }).then(async (response) => {
    const result = {
      statusCode: response.status,
      body: (await response.json()) as unknown as T,
    }
    return result
  })
}

export function jsonPut(url: string, body: unknown, token?: string): Promise<PutResponse> {
  const headers: HeadersInit = {
    [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
  }
  if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
  return fetchRetry(url, {
    method: 'PUT',
    headers,
    agent: new Agent({ ca: getCACertificate() }),
    body: JSON.stringify(body),
    compress: true,
  })
    .then(async (response) => {
      let responseData = undefined
      if (response.headers.get('content-type')?.includes('text/plain')) {
        try {
          responseData = await response.text()
          return {
            statusCode: response.status,
            body: responseData,
          }
        } catch (err) {
          return {
            statusCode: response.status,
            body: 'Error getting resource text response.',
          }
        }
      } else {
        try {
          responseData = (await response.json()) as unknown
          return {
            statusCode: response.status,
            body: responseData,
          }
        } catch (err) {
          return {
            statusCode: response.status,
            body: 'Error getting resource json response.',
          }
        }
      }
    })
    .catch((err: Error) => {
      const errResult = {
        body: {
          name: err.name,
          message: err.message,
        },
      }
      return errResult
    })
}
