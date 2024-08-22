/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request } from 'https'
import { pipeline } from 'stream'
import { logger } from '../lib/logger'
import { notFound } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { getSearchOptions } from '../lib/search'

const proxyHeaders = [
  constants.HTTP2_HEADER_ACCEPT,
  constants.HTTP2_HEADER_ACCEPT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_TYPE,
]

export async function search(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}` }
    for (const header of proxyHeaders) {
      if (req.headers[header]) headers[header] = req.headers[header]
    }
    const options = await getSearchOptions(headers)
    pipeline(
      req,
      request(options, (response) => {
        if (!response) return notFound(req, res)
        res.writeHead(response.statusCode, response.headers)
        pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
      }),
      (err) => {
        if (err) {
          logger.error(err)
        }
      }
    )
  }
}
