/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import Prometheus, { register } from 'prom-client'
import { catchInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'

const acm_console_page_count = new Prometheus.Counter({
  name: 'acm_console_page_count',
  help: 'Capture ACM page visit counts',
  labelNames: ['page'],
})
register.registerMetric(acm_console_page_count)

export function metrics(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const errorCatcher = catchInternalServerError(res)
  getAuthenticatedToken(req, res)
    .then(async () => {
      if (req.method === 'POST' && req.url.includes('?')) {
        // POSTs originate from an ACM page - get the page from req url params and increase that pages count
        const page = req.url.split('?')[1]
        acm_console_page_count.labels({ page }).inc()
        res.end(`Increased ${page} label count for metric acm_console_page_count`)
      } else {
        res.setHeader('Content-Type', register.contentType)
        await register.metrics().then((data) => res.end(data))
      }
    })
    .catch(errorCatcher)
}
