import { Http2ServerRequest, Http2ServerResponse } from 'http2'

export function parseCookies(req: Http2ServerRequest): Record<string, string> | undefined {
    const cookieHeader = req.headers.cookie
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
    return undefined
}

export function setCookie(res: Http2ServerResponse, cookie: string, value: string, path?: string): void {
    res.setHeader('Set-Cookie', `${cookie}=${value}; 'Secure; HttpOnly; Path=${path ? path : '/'}`)
}
