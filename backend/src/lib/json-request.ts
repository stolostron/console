import { IncomingMessage, OutgoingHttpHeaders } from 'http'
import { constants } from 'http2'
import { Agent, get, request, RequestOptions } from 'https'
import { parseJsonBody } from './body-parser'
import { logger } from './logger'

const {
    HTTP2_HEADER_CONTENT_TYPE,
    HTTP2_HEADER_AUTHORIZATION,
    HTTP2_HEADER_ACCEPT,
    HTTP2_HEADER_ACCEPT_ENCODING,
} = constants

export function jsonRequest<T>(url: string): Promise<T> {
    return new Promise((resolve) =>
        get(url, { headers: { accept: 'application/json' }, agent: new Agent({ rejectUnauthorized: false }) }, resolve)
    ).then(async (res: IncomingMessage) => await parseJsonBody(res))
}

export function jsonPost<T = unknown>(url: string, body: unknown, token?: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
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
            if (res.statusCode < 300) {
                try {
                    const data: T = await parseJsonBody(res)
                    resolve(data)
                } catch (err) {
                    logger.error(err)
                    reject()
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
