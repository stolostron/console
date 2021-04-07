/* Copyright Contributors to the Open Cluster Management project */
import { IncomingMessage, OutgoingHttpHeaders } from 'http'
import { constants } from 'http2'
import { Agent, get, request, RequestOptions } from 'https'
import { parseJsonBody } from './body-parser'

const {
    HTTP2_HEADER_CONTENT_TYPE,
    HTTP2_HEADER_AUTHORIZATION,
    HTTP2_HEADER_ACCEPT,
    HTTP2_HEADER_ACCEPT_ENCODING,
} = constants

export function jsonRequest<T>(url: string, token?: string): Promise<T> {
    const headers: OutgoingHttpHeaders = { accept: 'application/json' }
    if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
    return new Promise((resolve) =>
        get(url, { headers, agent: new Agent({ rejectUnauthorized: false }) }, resolve)
    ).then(async (res: IncomingMessage) => await parseJsonBody(res))
}

export interface PostResponse<T> {
    statusCode: number
    body?: T
}

export function jsonPost<T = unknown>(url: string, body: unknown, token?: string): Promise<PostResponse<T>> {
    return new Promise<PostResponse<T>>((resolve, reject) => {
        const headers: OutgoingHttpHeaders = {
            [HTTP2_HEADER_ACCEPT]: 'application/json',
            [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
            [HTTP2_HEADER_ACCEPT_ENCODING]: 'br, gzip, deflate',
        }
        const options: RequestOptions = {
            method: 'POST',
            headers,
            agent: new Agent({ rejectUnauthorized: false }),
        }
        if (token) headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`

        const clientRequest = request(process.env.CLUSTER_API_URL + url, options, async (res: IncomingMessage) => {
            if (res.statusCode) {
                try {
                    const body: T = await parseJsonBody(res)
                    resolve({ statusCode: res.statusCode, body })
                } catch (err) {
                    resolve({ statusCode: res.statusCode })
                }
            } else {
                reject()
            }
        })
        clientRequest.on('error', (err) => {
            // logger.error(err)
            reject(err)
        })
        clientRequest.write(JSON.stringify(body))
        clientRequest.end()
    })
}
