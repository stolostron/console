/* Copyright Contributors to the Open Cluster Management project */
import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch'

export function fetchRetry(url: RequestInfo, init?: RequestInit, retry?: number): Promise<Response> {
    let retries: number
    switch (init?.method) {
        case undefined:
        case 'GET':
            retries = retry ?? 4
            break
        default:
            retries = 0
    }

    let delay = 1000

    return new Promise(function (resolve, reject) {
        async function fetchAttempt() {
            try {
                const response = await fetch(url, init)
                switch (response.status) {
                    case 429: // Too Many Requests
                        {
                            const retryAfter = Number(response.headers.get('retry-after'))
                            if (!Number.isInteger(retryAfter)) delay = retryAfter
                            setTimeout(fetchAttempt, delay)
                        }
                        break

                    case 408: // Request Timeout
                    case 500: // Internal Server Error
                    case 502: // Bad Gateway
                    case 503: // Service Unavailable
                    case 504: // Gateway Timeout
                    case 522: // Connection timed out
                    case 524: // A Timeout Occurred
                        {
                            const retryAfter = Number(response.headers.get('retry-after'))
                            if (!Number.isInteger(retryAfter)) delay = retryAfter
                            if (retries > 0) {
                                retries--
                                setTimeout(fetchAttempt, delay)
                            } else {
                                resolve(response)
                            }
                        }
                        break

                    default:
                        resolve(response)
                }
            } catch (err) {
                if (err instanceof Error) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                    switch ((err as any).code) {
                        case 'ETIMEDOUT':
                        case 'ECONNRESET':
                        case 'ENOTFOUND':
                            if (retries > 0) {
                                retries--
                                setTimeout(fetchAttempt, delay)
                            } else {
                                reject(err)
                            }
                            break
                        default:
                            if (err.message === 'Network Error') {
                                if (retries > 0) {
                                    retries--
                                    setTimeout(fetchAttempt, delay)
                                } else {
                                    reject(err)
                                }
                            } else {
                                reject(err)
                            }
                            break
                    }
                } else {
                    reject(err)
                }
            } finally {
                if (delay === 0) delay = 100
                else delay *= 2
            }
        }
        void fetchAttempt()
    })
}
