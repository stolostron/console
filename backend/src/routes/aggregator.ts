/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { notFound, unauthorized } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { FilterCounts, paginate } from '../lib/pagination'
import { aggregateApplications, filterApplications } from './aggregators/applications'
import { IResource } from '../resources/resource'

export type AggregateCache = { data: IResource[]; filterCounts: FilterCounts }
export type AggregatedCacheType = {
  [type: string]: AggregateCache
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
  stopping = true
}

export async function aggregate(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return unauthorized(req, res)
  const type = req.url.split('?')[0].split('/')
  if (type.length < 3) return notFound(req, res)
  switch (type[2]) {
    case 'applications':
      return paginate(req, res, token, aggregatedCache['applications'], filterApplications)
  }
  return notFound(req, res)
}
