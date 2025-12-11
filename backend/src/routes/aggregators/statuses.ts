/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { FilterCounts } from '../../lib/pagination'
import { getAuthorizedResources } from '../events'
import {
  AppColumns,
  ApplicationStatusMap,
  getStatusFilterKey,
  ICompressedResource,
  ITransformedResource,
  TransformColumns,
} from './applications'
import { systemAppNamespacePrefixes } from './utils'

export interface IRequestStatuses {
  clusters?: string[]
}

export interface IResultStatuses {
  itemCount: string
  filterCounts: FilterCounts
  systemAppNSPrefixes: string[]
  loading: boolean
}

export function requestAggregatedStatuses(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
  token: string,
  getItems: () => Promise<ICompressedResource[]>
): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', async () => {
    const body = chucks.join()
    const { clusters = [] } = JSON.parse(body) as IRequestStatuses
    let items = await getItems()

    // should we filter count by provided cluster names
    if (clusters.length) {
      items = items.filter((item) => {
        return clusters.some((value: string) => item.transform[AppColumns.clusters].indexOf(value) !== -1)
      })
    }
    // filter by rbac
    const authorizedItems = (await getAuthorizedResources(
      token,
      items,
      0,
      items.length
    )) as unknown as ITransformedResource[]

    // count filter entries
    const filterCounts: FilterCounts = { type: {}, cluster: {}, podStatuses: {}, healthStatus: {}, syncStatus: {} }
    authorizedItems.forEach((item) => {
      if (item.transform) {
        incFilterCounts(filterCounts, 'type', item.transform[TransformColumns.type] as string[])
        incFilterCounts(filterCounts, 'cluster', item.transform[TransformColumns.clusters] as string[])
        incStatusCounts(filterCounts, 'healthStatus', item as unknown as ICompressedResource, AppColumns.health)
        incStatusCounts(filterCounts, 'syncStatus', item as unknown as ICompressedResource, AppColumns.synced)
        incStatusCounts(filterCounts, 'podStatuses', item as unknown as ICompressedResource, AppColumns.deployed)
      }
    })

    const results: IResultStatuses = {
      itemCount: authorizedItems.length.toString(),
      filterCounts,
      systemAppNSPrefixes: systemAppNamespacePrefixes,
      loading: false,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}

// add to filters count that appears in filter dropdown
function incFilterCounts(mapmap: FilterCounts, id: string, keys: string[]) {
  let map = mapmap[id]
  if (!map) map = mapmap[id] = {}
  keys.forEach((key) => {
    if (key in map) {
      map[key]++
    } else {
      map[key] = 1
    }
  })
}

// add to filters count that appears in filter dropdown
function incStatusCounts(mapmap: FilterCounts, id: string, item: ICompressedResource, index: AppColumns) {
  let map = mapmap[id]
  if (!map) map = mapmap[id] = {}
  const type = (item.transform[TransformColumns.type] as string[])[0]
  // don't count health or sync for non-argo apps
  if ((index === AppColumns.health || index === AppColumns.synced) && (type === 'appset' || type === 'argo')) {
    const statuses = (item.transform[TransformColumns.statuses] as ApplicationStatusMap[])[0]
    if (Object.keys(statuses).length) {
      const key = getStatusFilterKey(item, index)
      if (key in map) {
        map[key]++
      } else {
        map[key] = 1
      }
    }
  }
}
