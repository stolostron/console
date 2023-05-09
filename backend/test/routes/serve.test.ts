import { createBrotliCompress, createGzip } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'

/* Copyright Contributors to the Open Cluster Management project */
import { constants } from 'http2'
import { getDecodeStream } from '../../src/lib/compression'
import { pipeline } from 'stream'
import rawBody from 'raw-body'
import { request } from '../mock-request'
import { unlink } from 'fs/promises'

describe(`serve Route`, function () {
  it(`serves index.html with correct headers`, async function () {
    const res = await request('GET', '/')
    expect(res.statusCode).toEqual(200)
    const expectedHeaders = ['cache-control', 'content-security-policy', 'last-modified']
    expectedHeaders.every((header) => expect(res.hasHeader(header)))
    const bodyString = await rawBody(getDecodeStream(res.stream), {
      limit: 1 * 1024 * 1024,
      encoding: true,
    })
    expect(bodyString).toContain('<!DOCTYPE html>')
  })

  it(`serves index.html with br compression`, async function () {
    const indexPath = `${process.env.PUBLIC_FOLDER}/index.html`
    const indexPathCompressed = `${indexPath}.br`
    try {
      // Temporarily create .br version
      const index = createReadStream(indexPath)
      const indexCompressed = createWriteStream(indexPathCompressed)
      const br = createBrotliCompress()
      await new Promise<void>((resolve, reject) => {
        pipeline(index, br, indexCompressed, (err) => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
      })

      const res = await request('GET', '/', null, {
        [constants.HTTP2_HEADER_ACCEPT_ENCODING]: ['br'],
      })
      expect(res.statusCode).toEqual(200)
      const bodyString = await rawBody(getDecodeStream(res.stream, 'br'), {
        limit: 1 * 1024 * 1024,
        encoding: true,
      })
      expect(bodyString).toContain('<!DOCTYPE html>')
    } finally {
      await unlink(indexPathCompressed)
    }
  })

  it(`serves index.html with gzip compression`, async function () {
    const indexPath = `${process.env.PUBLIC_FOLDER}/index.html`
    const indexPathCompressed = `${indexPath}.gz`
    try {
      // Temporarily create .gz version
      const index = createReadStream(indexPath)
      const indexCompressed = createWriteStream(indexPathCompressed)
      const gz = createGzip()
      await new Promise<void>((resolve, reject) => {
        pipeline(index, gz, indexCompressed, (err) => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
      })

      const res = await request('GET', '/', null, {
        [constants.HTTP2_HEADER_ACCEPT_ENCODING]: ['gzip'],
      })
      expect(res.statusCode).toEqual(200)
      const bodyString = await rawBody(getDecodeStream(res.stream, 'gzip'), {
        limit: 1 * 1024 * 1024,
        encoding: true,
      })
      expect(bodyString).toContain('<!DOCTYPE html>')
    } finally {
      await unlink(indexPathCompressed)
    }
  })
})
