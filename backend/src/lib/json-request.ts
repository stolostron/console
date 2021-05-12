/* Copyright Contributors to the Open Cluster Management project */
import { constants } from 'http2'
import { Agent } from 'https'
import { HeadersInit } from 'node-fetch'
import { fetchRetry } from './fetch-retry'

const { HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_AUTHORIZATION, HTTP2_HEADER_ACCEPT, HTTP2_HEADER_ACCEPT_ENCODING } =
    constants

const agent = new Agent({ rejectUnauthorized: false })

export function jsonRequest<T>(url: string, token?: string): Promise<T> {
    const headers: HeadersInit = { [HTTP2_HEADER_ACCEPT]: 'application/json' }
    if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
    return fetchRetry(url, { headers, agent, compress: true }).then(
        (response) => response.json() as unknown as Promise<T>
    )
}

export interface PostResponse<T> {
    statusCode: number
    body?: T
}

export function jsonPost<T = unknown>(url: string, body: unknown, token?: string): Promise<PostResponse<T>> {
    const headers: HeadersInit = {
        [HTTP2_HEADER_ACCEPT]: 'application/json',
        [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
    }
    if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
    return fetchRetry(url, { method: 'POST', headers, agent, body: JSON.stringify(body), compress: true }).then(
        async (response) => {
            const result = {
                statusCode: response.status,
                body: (await response.json()) as unknown as T,
            }
            return result
        }
    )
}
