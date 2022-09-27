/* Copyright Contributors to the Open Cluster Management project */
import { constants } from 'http2'
import rawBody from 'raw-body'
import { getDecodeStream } from '../../src/lib/compression'
import { request } from '../mock-request'

describe(`serve Route`, function () {
    it(`serves index.html with correct headers`, async function () {
        const res = await request('GET', '/')
        expect(res.statusCode).toEqual(200)
        const expectedHeaders = ['cache-control', 'content-security-policy', 'last-modified']
        expectedHeaders.every((header) => expect(res.hasHeader(header)).toBeTruthy())
        const bodyString = await rawBody(getDecodeStream(res.stream, res.getHeader(constants.HTTP2_HEADER_CONTENT_ENCODING)), {
            length: res.getHeader('content-length'),
            limit: 1 * 1024 * 1024,
            encoding: true,
        })
        expect(bodyString).toContain("<!DOCTYPE html>")
    })
})
