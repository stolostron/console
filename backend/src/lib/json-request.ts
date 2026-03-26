/* Copyright Contributors to the Open Cluster Management project */
import { constants } from 'node:http2'
import type { Agent } from 'node:https'
import type { HeadersInit } from 'node-fetch'
import { fetchRetry } from './fetch-retry'
import type { IResource } from '../resources/resource'
import { join } from 'node:path'
import pluralize from 'pluralize'

const { HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_AUTHORIZATION, HTTP2_HEADER_ACCEPT, HTTP2_HEADER_USER_AGENT } =
  constants

export function jsonRequest<T>(url: string, token?: string, retry?: number): Promise<T> {
  const headers: HeadersInit = { [HTTP2_HEADER_ACCEPT]: 'application/json' }
  if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
  return fetchRetry(url, { headers, compress: true }, retry).then(
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
  agent?: Agent
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
    agent,
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

export function jsonPut(url: string, body: unknown, token?: string, agent?: Agent): Promise<PutResponse> {
  const headers: HeadersInit = {}
  if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
  return fetchRetry(url, {
    method: 'PUT',
    headers,
    agent,
    body: JSON.stringify(body),
    compress: true,
  })
    .then((response) => ({
      // No response body from cluster-proxy kubevirt requests.
      statusCode: response.status,
    }))
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

export function resourceUrl(resource: IResource) {
  if (!resource.apiVersion) {
    throw new Error('resource.apiVersion is required')
  }
  let path: string = process.env.CLUSTER_API_URL ?? ''
  if (resource.apiVersion?.includes('/')) {
    path = join(path, '/apis', resource.apiVersion)
  } else {
    path = join(path, '/api', resource.apiVersion)
  }

  const namespace = resource.metadata?.namespace
  if (namespace) {
    path = join(path, 'namespaces', namespace)
  }

  if (resource.kind) {
    path = join(path, pluralize(resource.kind.toLowerCase()))
  }

  const name = resource.metadata?.name
  if (name) {
    path = join(path, name)
  }

  return path.replaceAll('\\', '/')
}
