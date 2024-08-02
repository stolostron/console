/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { AggregatedCacheType, AggregateListCache, CacheKeys } from '../aggregator'

export interface IRequestStatuses {
  clusters?: string[]
}

export interface IResultStatuses {
  applicationCount: string
  loading: boolean
}

let stopping = false
export function stopAggregatingStatuses(): void {
  stopping = true
}

export async function startAggregatingStatuses(aggregatedCache: AggregatedCacheType): Promise<void> {
  aggregatedCache[CacheKeys.statuses] = {
    applicationCount: 0,
  }

  while (!stopping) {
    await aggregateStatuses(aggregatedCache)
  }
}
export async function aggregateStatuses(aggregatedCache: AggregatedCacheType): Promise<void> {
  await new Promise((r) => setTimeout(r, 5000))
}

export function requestAggregatedStatuses(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
  token: string,
  aggregatedCache: AggregatedCacheType
): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', () => {
    const body = chucks.join()
    const { clusters = [] } = JSON.parse(body) as IRequestStatuses
    const applicationCache = aggregatedCache[CacheKeys.applications] as AggregateListCache
    const { items } = applicationCache
    let applicationCount = items.length
    if (clusters.length) {
      applicationCount = items.filter((item) => {
        return clusters.some((value: string) => item.transform[3].indexOf(value) !== -1)
      }).length
    }
    const results: IResultStatuses = {
      applicationCount: applicationCount.toString(),
      loading: false,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}
