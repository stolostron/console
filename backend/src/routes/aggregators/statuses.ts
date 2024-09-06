/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { FilterCounts, ITransformedResource } from '../../lib/pagination'
import { getAuthorizedResources } from '../events'

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

export function requestAggregatedStatuses(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
  token: string,
  getItems: () => { items: ITransformedResource[]; filterCounts: FilterCounts }
): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', async () => {
    const body = chucks.join()
    const { clusters = [] } = JSON.parse(body) as IRequestStatuses
    let { items } = getItems()

    // should we filter count by provided cluster names
    if (clusters.length) {
      items = items.filter((item) => {
        return clusters.some((value: string) => item.transform[3].indexOf(value) !== -1)
      })
    }
    // filter by rbac
    items = (await getAuthorizedResources(token, items, 0, items.length)) as unknown as ITransformedResource[]

    const results: IResultStatuses = {
      applicationCount: items.length.toString(),
      loading: false,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}
