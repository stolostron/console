/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { FilterCounts } from '../../lib/pagination'
import { getAuthorizedResources } from '../events'
import { AppColumns, ICompressedResource, ITransformedResource } from './applications'
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
  getItems: () => ICompressedResource[]
): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', async () => {
    const body = chucks.join()
    const { clusters = [] } = JSON.parse(body) as IRequestStatuses
    let items = getItems()

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

    // count types
    const filterCounts: FilterCounts = { type: {}, cluster: {} }
    authorizedItems.forEach((item) => {
      if (item.transform) {
        incFilterCounts(filterCounts, 'type', item.transform[AppColumns.type])
        incFilterCounts(filterCounts, 'cluster', item.transform[AppColumns.clusters])
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
