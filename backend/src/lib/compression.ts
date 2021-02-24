import { Readable, Writable } from 'stream'
import {
    createBrotliCompress,
    createBrotliDecompress,
    createDeflate,
    createGunzip,
    createGzip,
    createInflate,
} from 'zlib'

export function getDecodeStream(stream: Readable, contentEncoding?: string | string[]): Readable {
    switch (contentEncoding) {
        case undefined:
        case 'identity':
            return stream
        case 'deflate':
            return stream.pipe(createDeflate())
        case 'br':
            return stream.pipe(createBrotliDecompress())
        case 'gzip':
            return stream.pipe(createGunzip())
        default:
            throw new Error('Unknown content encoding')
    }
}

export function getEncodeStream(
    stream: NodeJS.WritableStream,
    acceptEncoding?: string | string[]
): [NodeJS.WritableStream, string] {
    let encoding = 'identity'
    if (acceptEncoding.includes('br')) encoding = 'br'
    else if (acceptEncoding.includes('gzip')) encoding = 'gzip'
    else if (acceptEncoding.includes('deflate')) encoding = 'deflate'

    switch (encoding) {
        case 'br': {
            const compressionStream = createBrotliCompress()
            compressionStream.pipe(stream)
            return [compressionStream, encoding]
        }
        case 'gzip': {
            const compressionStream = createGzip()
            compressionStream.pipe(stream)
            return [compressionStream, encoding]
        }
        case 'deflate': {
            const compressionStream = createInflate()
            compressionStream.pipe(stream)
            return [compressionStream, encoding]
        }
        default:
            return [stream, 'identity']
    }
}

export function flushStream(stream: NodeJS.WritableStream): void {
    if ((stream as any).flush) {
        ;(stream as any).flush()
    }
}
