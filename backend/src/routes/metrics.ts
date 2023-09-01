/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import Prometheus, { register } from 'prom-client'

interface PageData {
  page: string
}

const acm_console_page_count = new Prometheus.Counter({
  name: 'acm_console_page_count',
  help: 'Capture ACM page visit counts',
  labelNames: ['page'],
})
register.registerMetric(acm_console_page_count)

export async function metrics(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  if (req.method === 'POST' && req.url.includes('?')) {
    // POSTs originate from an ACM page - get the page from req url params and increase that pages count
    const page = req.url.split('?')[1]
    acm_console_page_count.labels({ page }).inc()
  } else {
    res.setHeader('Content-Type', register.contentType)
    await register.metrics().then((data) => res.end(data))
  }
}
