import { Http2ServerRequest, Http2ServerResponse, constants } from 'http2'
/* Copyright Contributors to the Open Cluster Management project */
import { Stats, createReadStream } from 'fs'

import { extname } from 'path'
import { logger } from '../lib/logger'
import { pipeline } from 'stream'
import { stat } from 'fs/promises'
import { catchInternalServerError } from '../lib/respond'

const cacheControl = process.env.NODE_ENV === 'production' ? 'public, max-age=604800' : 'no-store'
const localesCacheControl = process.env.NODE_ENV === 'production' ? 'public, max-age=3600' : 'no-store'
const publicFolder = process.env.PUBLIC_FOLDER || './public'

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
      res.setHeader('X-Frame-Options', 'deny')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
      res.setHeader('Referrer-Policy', 'no-referrer')
      res.setHeader('X-DNS-Prefetch-Control', 'off')
      res.setHeader('Expect-CT', 'enforce, max-age=30')
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "connect-src 'self' https://api.github.com",
          "base-uri 'self'",
          'block-all-mixed-content',
          "font-src 'self' https: data:",
          "frame-ancestors 'self'",
          "img-src 'self' data:",
          "object-src 'none'",
          "script-src 'self' 'unsafe-eval'",
          "script-src-attr 'none'",
          "style-src 'self' https: 'unsafe-inline'",
          'upgrade-insecure-requests',
        ].join(';')
      )
    } else if (url === '/plugin/plugin-entry.js' || url === '/plugin/plugin-manifest.json') {
      res.setHeader('Cache-Control', 'no-cache')
    } else if (url.includes('/locales/')) {
      res.setHeader('Cache-Control', localesCacheControl)
    } else {
      res.setHeader('Cache-Control', cacheControl)
    }

    const acceptEncoding = (req.headers[constants.HTTP2_HEADER_ACCEPT_ENCODING] as string) ?? ''
    const contentType = contentTypes[ext]
    if (contentType === undefined) {
      logger.debug('unknown content type', `ext=${ext}`)
      res.writeHead(404).end()
      return
    }

    const filePath = `${publicFolder}${url}`
    let stats: Stats
    try {
      stats = await stat(filePath)
    } catch {
      res.writeHead(404).end()
      return
    }

    const modificationTime = stats.mtime.toUTCString()
    res.setHeader(constants.HTTP2_HEADER_LAST_MODIFIED, modificationTime)
    // Don't send content for cache revalidation
    if (req.headers['if-modified-since'] === modificationTime) {
      res.writeHead(constants.HTTP_STATUS_NOT_MODIFIED).end()
    }

    if (/\bbr\b/.test(acceptEncoding)) {
      try {
        const brFilePath = `${filePath}.br`
        const brStats = await stat(brFilePath)
        const readStream = createReadStream(brFilePath, { autoClose: true })
        readStream
          .on('open', () => {
            res.writeHead(200, {
              [constants.HTTP2_HEADER_CONTENT_ENCODING]: 'br',
              [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
              [constants.HTTP2_HEADER_CONTENT_LENGTH]: brStats.size.toString(),
            })
          })
          .on('error', (err) => {
            logger.error(err)
            res.writeHead(404).end()
          })
        pipeline(readStream, res as unknown as NodeJS.WritableStream, (err) => {
          if (err) logger.error(err)
        })
        return
      } catch {
        // Do nothing
      }
    }

    if (/\bgzip\b/.test(acceptEncoding)) {
      try {
        const gzFilePath = `${filePath}.gz`
        const gzStats = await stat(gzFilePath)
        const readStream = createReadStream(gzFilePath, { autoClose: true })
        readStream
          .on('open', () => {
            res.writeHead(200, {
              [constants.HTTP2_HEADER_CONTENT_ENCODING]: 'gzip',
              [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
              [constants.HTTP2_HEADER_CONTENT_LENGTH]: gzStats.size.toString(),
            })
          })
          .on('error', (err) => {
            logger.error(err)
            res.writeHead(404).end()
          })
        pipeline(readStream, res as unknown as NodeJS.WritableStream, (err) => {
          if (err) logger.error(err)
        })
        return
      } catch {
        // Do nothing
      }
    }

    const readStream = createReadStream(`${publicFolder}${url}`, { autoClose: true })
    readStream
      .on('open', () => {
        res.writeHead(200, {
          [constants.HTTP2_HEADER_CONTENT_TYPE]: contentType,
          [constants.HTTP2_HEADER_CONTENT_LENGTH]: stats.size.toString(),
        })
      })
      .on('error', (err) => {
        logger.error(err)
        res.writeHead(404).end()
      })
    pipeline(readStream, res as unknown as NodeJS.WritableStream, (err) => {
      if (err) logger.error(err)
    })
  } catch (err) {
    logger.error(err)
    res.writeHead(404).end()
    return
  }
}

export function serveHandler(req: Http2ServerRequest, res: Http2ServerResponse): void {
  serve(req, res).catch(catchInternalServerError(res))
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
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}
