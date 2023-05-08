/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { catchInternalServerError, unauthorized } from './respond'
import { getToken, isAuthenticated } from './token'

export function authenticated(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const token = getToken(req)
  if (!token) return unauthorized(req, res)
  isAuthenticated(token)
    .then((response) => {
      res.writeHead(response.status).end()
      void response.blob()
    })
    .catch(catchInternalServerError(res))
}
