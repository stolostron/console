/* Copyright Contributors to the Open Cluster Management project */
import { IncomingMessage, OutgoingHttpHeaders } from 'http'
import { constants } from 'http2'
import { Agent, request, RequestOptions } from 'https'
import { AbortSignal } from 'node-fetch/externals'
import { logger } from './logger'

const agent = new Agent({ rejectUnauthorized: false })

const { HTTP2_HEADER_CONTENT_LENGTH, HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_AUTHORIZATION, HTTP2_HEADER_ACCEPT } =
    constants

// TODO  HTTP2_HEADER_ACCEPT_ENCODING

export function requestRetry(options: {
    url: string
    method?: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'
    headers?: OutgoingHttpHeaders
    token?: string
    timeout?: number // Milliseconds before a request times out.
    body?: unknown
    onResponse: (response: IncomingMessage) => void
    onClose: () => void
    onError: (err: Error) => void
    signal?: AbortSignal
}): void {
    const body = options.body ? JSON.stringify(options.body) : undefined
    options.headers = options.headers ?? {}
    options.headers[HTTP2_HEADER_ACCEPT] = 'application/json'
    if (body) {
        options.headers[HTTP2_HEADER_CONTENT_TYPE] = 'application/json'
        options.headers[HTTP2_HEADER_CONTENT_LENGTH] = body.length.toString()
    }
    if (options.token) {
        options.headers[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${options.token}`
    }
    const requestOptions = options as RequestOptions
    requestOptions.agent = agent

    let delay = 10000
    let retries = 0

    function requestAttempt(url: string, requestOptions: RequestOptions): void {
        function handleError(err: Error) {
            let retry = false
            if (err instanceof Error) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                switch ((err as any)?.code) {
                    case 'ETIMEDOUT':
                    case 'ECONNRESET':
                    case 'ENOTFOUND':
                        retry = true
                        break
                    default:
                        switch (err.message) {
                            case 'Network Error':
                                retry = true
                                break
                        }
                        break
                }
            }

            if (retry) {
                retries--
                setTimeout(requestAttempt, delay)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                logger.warn({ msg: 'retrying request', code: (err as any)?.code, url: options.url })
            } else {
                options.onError(err)
                options.onClose()
            }
        }

        try {
            const clientRequest = request(options.url, requestOptions)
                .on('response', (response: IncomingMessage) => {
                    const retryAfter = Number(response.headers['retry-after'])
                    if (!Number.isInteger(retryAfter)) delay = retryAfter
                    switch (response.statusCode) {
                        case 429: // Too Many Requests
                            setTimeout(requestAttempt, delay)
                            logger.warn({ msg: 'retrying request', status: response.statusCode, url: options.url })
                            break

                        case 408: // Request Timeout
                        case 500: // Internal Server Error
                        case 502: // Bad Gateway
                        case 503: // Service Unavailable
                        case 504: // Gateway Timeout
                        case 522: // Connection timed out
                        case 524: // A Timeout Occurred
                            if (retries > 0) {
                                retries--
                                setTimeout(requestAttempt, delay)
                                logger.warn({ msg: 'retrying request', status: response.statusCode, url: options.url })
                            } else {
                                options.onError(new Error(`response error  statusCode:${response.statusCode}`))
                                options.onClose()
                            }
                            break

                        default:
                            clientRequest.removeListener('error', handleError)
                            response.on('error', options.onError)
                            response.on('close', options.onClose)
                            options.onResponse(response)
                    }
                })
                .on('timeout', () => {
                    // Emitted when the underlying socket times out from inactivity.
                    // This only notifies that the socket has been idle.
                    // The request must be aborted manually. - which should be destroy()
                    clientRequest.destroy()
                })
            clientRequest.addListener('error', handleError)

            if (options.signal) {
                options.signal.addEventListener('abort', () => {
                    clientRequest.destroy()
                })
            }

            clientRequest.end(body)
        } catch (err) {
            handleError(err)
        } finally {
            if (delay === 0) delay = 100
            else delay *= 2
        }
    }

    try {
        requestAttempt(options.url, requestOptions)
    } catch (err) {
        options.onError(err)
        throw err
    }
}
