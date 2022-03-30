/* Copyright Contributors to the Open Cluster Management project */
import { createReadStream, Stats } from 'fs'
import { stat } from 'fs/promises'
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { extname } from 'path'
import { pipeline } from 'stream'
import { logger } from '../lib/logger'

const cacheControl = process.env.NODE_ENV === 'production' ? 'public, max-age=604800' : 'no-store'

export async function serve(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    try {
        let url = req.url.split('?')[0]

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
        } else if (url === '/plugin-entry.js' || url === '/plugin-manifest.json') {
            res.setHeader('Cache-Control', 'no-cache')
        } else {
            res.setHeader('Cache-Control', cacheControl)
        }

        const acceptEncoding = (req.headers['accept-encoding'] as string) ?? ''
        const contentType = contentTypes[ext]
        if (contentType === undefined) {
            logger.debug('unknown content type', `ext=${ext}`)
            res.writeHead(404).end()
            return
        }

        const filePath = './public' + url
        let stats: Stats
        try {
            stats = await stat(filePath)
        } catch {
            res.writeHead(404).end()
            return
        }

        if (/\bbr\b/.test(acceptEncoding)) {
            try {
                const brStats = await stat(filePath + '.br')
                const readStream = createReadStream('./public' + url + '.br', { autoClose: true })
                readStream
                    .on('open', () => {
                        res.writeHead(200, {
                            [constants.HTTP2_HEADER_CONTENT_ENCODING]: 'br',
                            [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
                            [constants.HTTP2_HEADER_CONTENT_LENGTH]: brStats.size.toString(),
                        })
                    })
                    .on('error', (err) => {
                        // logger.error(err)
                        res.writeHead(404).end()
                    })
                pipeline(readStream, res as unknown as NodeJS.WritableStream, (err) => {
                    // if (err) logger.error(err)
                })
                return
            } catch {
                // Do nothing
            }
        }

        if (/\bgzip\b/.test(acceptEncoding)) {
            try {
                const gzStats = await stat(filePath + '.gz')
                const readStream = createReadStream('./public' + url + '.gz', { autoClose: true })
                readStream
                    .on('open', () => {
                        res.writeHead(200, {
                            [constants.HTTP2_HEADER_CONTENT_ENCODING]: 'gzip',
                            [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
                            [constants.HTTP2_HEADER_CONTENT_LENGTH]: gzStats.size.toString(),
                        })
                    })
                    .on('error', (err) => {
                        // logger.error(err)
                        res.writeHead(404).end()
                    })
                pipeline(readStream, res as unknown as NodeJS.WritableStream, (err) => {
                    // if (err) logger.error(err)
                })
                return
            } catch {
                // Do nothing
            }
        }

        const readStream = createReadStream('./public' + url, { autoClose: true })
        readStream
            .on('open', () => {
                res.writeHead(200, {
                    [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
                    [constants.HTTP2_HEADER_CONTENT_LENGTH]: stats.size.toString(),
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
        res.writeHead(404).end()
        return
    }
}

const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.map': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
}
