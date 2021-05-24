/* Copyright Contributors to the Open Cluster Management project */
import { createReadStream } from 'fs'
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { extname } from 'path'
import { pipeline } from 'stream'
import { parseCookies } from '../lib/cookies'
import { logger } from '../lib/logger'
import { redirect } from '../lib/respond'

const cacheControl = process.env.NODE_ENV === 'production' ? 'public, max-age=604800' : 'no-store'

export function serve(req: Http2ServerRequest, res: Http2ServerResponse): void {
    try {
        let url = req.url

        let ext = extname(url)
        if (ext === '') {
            ext = '.html'
            url = '/index.html'
        }

        // Security headers
        if (url === '/index.html') {
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Strict-Transport-Security', 'max-age=31536000')
            res.setHeader('X-Frame-Options', 'deny')
            res.setHeader('X-XSS-Protection', '1; mode=block')
            res.setHeader('X-Content-Type-Options', 'nosniff')
            res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
            res.setHeader('Referrer-Policy', 'no-referrer')
            res.setHeader('X-DNS-Prefetch-Control', 'off')
            res.setHeader('Expect-CT', 'enforce, max-age=30')
            // res.setHeader('Content-Security-Policy', ["default-src 'self'"].join(';'))
        } else {
            res.setHeader('Cache-Control', cacheControl)
        }

        const acceptEncoding = (req.headers['accept-encoding'] as string) ?? ''
        const contentType = contentTypes[ext]
        if (contentType === undefined) {
            logger.debug('unknown content type', `ext=${ext}`)
            return res.writeHead(404).end()
        }
        if (/\bgzip\b/.test(acceptEncoding)) {
            try {
                const readStream = createReadStream('./public' + url + '.gz', { autoClose: true })
                readStream
                    .on('open', () => {
                        res.writeHead(200, {
                            [constants.HTTP2_HEADER_CONTENT_ENCODING]: 'gzip',
                            [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
                            // [constants.HTTP2_HEADER_CONTENT_LENGTH]: stats.size.toString(),
                        })
                    })
                    .on('error', (err) => {
                        // logger.error(err)
                        res.writeHead(404).end()
                    })
                pipeline(readStream, res as unknown as NodeJS.WritableStream, (err) => {
                    // if (err) logger.error(err)
                })
            } catch (err) {
                logger.error(err)
                return res.writeHead(404).end()
            }
        } else {
            const readStream = createReadStream('./public' + url, { autoClose: true })
            readStream
                .on('open', () => {
                    res.writeHead(200, {
                        [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
                    })
                })
                .on('error', (err) => {
                    // logger.error(err)
                    res.writeHead(404).end()
                })
            pipeline(readStream, res as unknown as NodeJS.WritableStream, (err) => {
                // if (err) logger.error(err)
            })
        }
        return
    } catch (err) {
        logger.error(err)
        return res.writeHead(404).end()
    }
}

const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.map': 'application/json; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
}
