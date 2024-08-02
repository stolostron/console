/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { notFound, unauthorized } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { FilterCounts, ITransformedResource, paginate } from '../lib/pagination'
import {
  startAggregatingApplications,
  stopAggregatingApplications,
  filterApplications,
} from './aggregators/applications'
import { requestAggregatedStatuses, startAggregatingStatuses, stopAggregatingStatuses } from './aggregators/statuses'

export type AggregateListCache = {
  items: ITransformedResource[]
  filterCounts: FilterCounts
}
export type AggregateStatusCache = {
  applicationCount: number
}
export type AggregatedCacheType = {
  [type: string]: AggregateListCache | AggregateStatusCache
}

export enum CacheKeys {
  applications = 'applications',
  statuses = 'statuses',
}

const aggregatedCache: AggregatedCacheType = {}

export function getAggregatedCache(): AggregatedCacheType {
  return aggregatedCache
}

export function startAggregating(): void {
  void startAggregatingApplications(aggregatedCache)
  void startAggregatingStatuses(aggregatedCache)
}

export function stopAggregating(): void {
  stopAggregatingApplications()
  stopAggregatingStatuses()
}

export async function aggregate(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return unauthorized(req, res)
  const type = req.url.split('?')[0].split('/')
  if (type.length < 3) return notFound(req, res)
  switch (type[2]) {
    case 'applications':
      return paginate(
        req,
        res,
        token,
        aggregatedCache[CacheKeys.applications] as AggregateListCache,
        filterApplications
      )
    case 'statuses':
      return requestAggregatedStatuses(req, res, token, aggregatedCache)
  }
  return notFound(req, res)
}
