/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { notFound, unauthorized } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { paginate } from '../lib/pagination'
import { aggregateApplications } from './aggregators/applications'

export type AggregatedCacheType = {
  [type: string]: unknown[]
}

const aggregatedCache: AggregatedCacheType = {}

let intervalTimer: NodeJS.Timer | undefined
export function startAggregating(): void {
  intervalTimer = setInterval(async () => {
    await aggregateApplications(aggregatedCache, 'applications')
  }, 15 * 1000).unref()
}

let stopping = false
export function stopAggregating(): void {
  // for (const request of requests) {
  //   request.cancel()
  // }

  stopping = true
}

export async function getAggregation(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return unauthorized(req, res)
  const type = req.url.split('?')[0].split('/')
  if (type.length < 3) return notFound(req, res)
  switch (type[2]) {
    case 'applications':
      return paginate(req, res, aggregatedCache['applications'])
  }
  return notFound(req, res)
}
