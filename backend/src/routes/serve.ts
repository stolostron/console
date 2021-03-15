/* Copyright Contributors to the Open Cluster Management project */
import { createReadStream } from 'fs'
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { extname } from 'path'
import { pipeline } from 'stream'
import { logger } from '../lib/logger'

const cacheControl = process.env.NODE_ENV === 'production' ? 'public, max-age=604800' : 'no-store'

export function serve(req: Http2ServerRequest, res: Http2ServerResponse): void {
    try {
        let url = req.url

        let ext = extname(url)
        if (ext === '') {
            ext = '.html'
            url = '/index.html'
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
                            [constants.HTTP2_HEADER_CACHE_CONTROL]: cacheControl,
                            // [constants.HTTP2_HEADER_CONTENT_LENGTH]: stats.size.toString(),
                        })
                    })
                    .on('error', (err) => {
                        // logger.error(err)
                        res.writeHead(404).end()
                    })
                pipeline(readStream, (res as unknown) as NodeJS.WritableStream, (err) => {
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
                        [constants.HTTP2_HEADER_CACHE_CONTROL]: cacheControl,
                    })
                })
                .on('error', (err) => {
                    // logger.error(err)
                    res.writeHead(404).end()
                })
            pipeline(readStream, (res as unknown) as NodeJS.WritableStream, (err) => {
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
