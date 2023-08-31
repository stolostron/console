/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import Prometheus, { register } from 'prom-client'
import { logger } from '../lib/logger'

const acm_console_page_visit_counter = new Prometheus.Counter({
  name: 'acm_console_page_visit_counter',
  help: 'Capture ACM page visit counts',
  labelNames: ['page'],
  registers: [register],
})
register.registerMetric(acm_console_page_visit_counter)

export function metrics(req: Http2ServerRequest, res: Http2ServerResponse): void {
  if (req.method === 'POST') {
    // POSTs originate from the ACM page - get the page from req data and increase that pages count
    let data: string = undefined
    const chucks: string[] = []
    req.on('data', (chuck: string) => {
      chucks.push(chuck)
    })
    req.on('end', async () => {
      data = chucks.join()
      logger.info({ msg: 'Updating acm_console_page_visit_counter metric', page: JSON.parse(data).page })
      acm_console_page_visit_counter.labels({ page: JSON.parse(data).page }).inc()
    })
  }

  res.setHeader('Content-Type', register.contentType)
  register.metrics().then((data) => res.end(data))
}
