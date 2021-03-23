/* Copyright Contributors to the Open Cluster Management project */
import { pipeline, Readable, Transform } from 'stream'
import {
    createBrotliCompress,
    createBrotliDecompress,
    createDeflate,
    createGunzip,
    createGzip,
    createInflate,
    Zlib,
} from 'zlib'
import { logger } from './logger'

export function getDecodeStream(stream: Readable, contentEncoding?: string | string[]): Readable {
    switch (contentEncoding) {
        case undefined:
        case 'identity':
            return stream
        case 'deflate':
            return pipeline(stream, createDeflate(), (err) => {
                if (err) logger.warn(err)
            })
        case 'br':
            return pipeline(stream, createBrotliDecompress(), (err) => {
                if (err) logger.warn(err)
            })
        case 'gzip':
            return pipeline(stream, createGunzip(), (err) => {
                if (err) logger.warn(err)
            })
        default:
            throw new Error('Unknown content encoding')
    }
}

export function getEncodeStream(
    stream: NodeJS.WritableStream,
    acceptEncoding?: string | string[],
    disabled = false
): [NodeJS.WritableStream, (Transform & Zlib) | undefined, string] {
    let encoding = 'identity'

    if (!disabled) {
        // Firefox tells us it supports 'br' but it does not... disabling
        // if (acceptEncoding?.includes('br')) encoding = 'br' else
        if (acceptEncoding?.includes('gzip')) encoding = 'gzip'
        else if (acceptEncoding?.includes('deflate')) encoding = 'deflate'
    }

    let compressionStream: (Transform & Zlib) | undefined
    switch (encoding) {
        case 'br':
            compressionStream = createBrotliCompress()
            break
        case 'gzip':
            compressionStream = createGzip()
            break
        case 'deflate':
            compressionStream = createInflate()
            break
    }

    if (compressionStream) {
        pipeline(compressionStream, stream, (err) => {
            // Client might close stream while we are still writing to it
            // ignore it for now as there is no issue here
            // TODO - long term should we close the compression stream
            // when client request ends?
            // if (err) logger.warn(err)
        })
    }
    return [stream, compressionStream, encoding]
}
