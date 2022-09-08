/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse, IncomingHttpHeaders } from 'http2'

export function parseCookies(req: Http2ServerRequest): Record<string, string> {
    return parseCookiesFromHeaders(req.headers)
}

export function parseCookiesFromHeaders(headers: IncomingHttpHeaders): Record<string, string> {
    const cookieHeader = headers.cookie
    if (cookieHeader !== undefined) {
        const cookies: { [key: string]: string } = {}
        const cookieArray = cookieHeader.split(';').map((cookie) => cookie.trim().split('='))
        for (const cookie of cookieArray) {
            if (cookie.length === 2) {
                cookies[cookie[0]] = cookie[1]
            }
        }
        return cookies
    }
    return {}
}

export function setCookie(res: Http2ServerResponse, cookie: string, value: string, path?: string): void {
    const cookieString = `${cookie}=${value}; Secure; HttpOnly; Path=${path ? path : '/'}`
    const cookieHeader = res.getHeader('Set-Cookie')
    if (cookieHeader) {
        if (Array.isArray(cookieHeader)) {
            res.setHeader('Set-Cookie', [...cookieHeader, cookieString])
        } else {
            res.setHeader('Set-Cookie', [cookieHeader, cookieString])
        }
    } else {
        res.setHeader('Set-Cookie', cookieString)
    }
}

export function deleteCookie(
    res: Http2ServerResponse,
    options: { cookie: string; path?: string; domain?: string }
): void {
    let cookieString = `${options.cookie}=; Secure; HttpOnly; Path=${options.path ? options.path : '/'}` + `; max-age=0`
    if (options.domain) cookieString += `; Domain=${options.domain}`
    const cookieHeader = res.getHeader('Set-Cookie')
    if (cookieHeader) {
        if (Array.isArray(cookieHeader)) {
            res.setHeader('Set-Cookie', [...cookieHeader, cookieString])
        } else {
            res.setHeader('Set-Cookie', [cookieHeader, cookieString])
        }
    } else {
        res.setHeader('Set-Cookie', cookieString)
    }
}
