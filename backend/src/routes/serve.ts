import { createReadStream, stat, Stats } from 'fs'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { extname } from 'path'
import { pipeline } from 'stream'
import { logger } from '../lib/logger'

const cacheControl = process.env.NODE_ENV === 'production' ? 'public, max-age=604800' : 'no-store'

export async function serve(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
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
                const stats = await new Promise<Stats>((resolve, reject) =>
                    stat('./public' + url + '.gz', (err, stats) => {
                        if (err) return reject(err)
                        return resolve(stats)
                    })
                )
                const readStream = createReadStream('./public' + url + '.gz', { autoClose: true })
                readStream
                    .on('open', () => {
                        res.writeHead(200, {
                            'Content-Encoding': 'gzip',
                            'Content-Type': contentType,
                            'Cache-Control': cacheControl,
                            'Content-Length': stats.size.toString(),
                        })
                    })
                    .on('error', (err) => res.writeHead(404).end())
                pipeline(readStream, res.stream, (err) => {
                    if (err) logger.error(err)
                })
            } catch (err) {
                return res.writeHead(404).end()
            }
        } else {
            const readStream = createReadStream('./public' + url, { autoClose: true })
            readStream
                .on('open', () => {
                    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl })
                })
                .on('error', (err) => res.writeHead(404).end())
            pipeline(readStream, res.stream, (err) => {
                if (err) logger.error(err)
            })
        }
        return
    } catch (err) {
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
