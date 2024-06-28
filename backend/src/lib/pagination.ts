/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import Fuse from 'fuse.js'
import { IResource } from '../resources/resource'
import { getAuthorizedLocalResources, getAuthorizedRemoteResources } from '../routes/events'
import { AggregateCache } from '../routes/aggregator'

export type FilterSelections = {
  [filter: string]: string[]
}

export type FilterCounts = {
  [id: string]: { [filter: string]: number }
}

export interface ISortBy {
  index?: number
  direction?: 'asc' | 'desc'
}

export interface IRequestListView {
  page: number
  perPage: number
  sortBy?: ISortBy
  search?: string
  filters?: FilterSelections
}

export interface IResultListView {
  page: number
  items: IResource[]
  itemCount: number
  filterCounts: FilterCounts
  emptyResult: boolean
  isPreProcessed: boolean
}

export interface ITransformedResource extends IResource {
  transform?: string[][]
}

export interface PaginatedResults {
  next?: {
    page: number
    limit: number
  }
  previous?: {
    page: number
    limit: number
  }
  results?: IResource[]
}

export function paginate(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
  token: string,
  cache: AggregateCache,
  filterItems: (filters: FilterSelections, items: ITransformedResource[]) => IResource[]
): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', async () => {
    const body = chucks.join()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { page, perPage, search, sortBy, filters } = JSON.parse(body) as IRequestListView

    // filter based on rbac
    // TODO to speed up local check, cache rbac check in ServerSideEvents and use here
    const { locals, remotes, filterCounts } = cache
    let items = (await getAuthorizedLocalResources(locals, token)) as unknown as ITransformedResource[]
    items = items.concat(await getAuthorizedRemoteResources(remotes, token)) as unknown as ITransformedResource[]

    let itemCount = items.length
    let rpage = page
    let emptyResult = false
    let isPreProcessed = itemCount === 0 // if false, we pass all data and frontend does the filter/search/sort
    if (itemCount > 500) {
      isPreProcessed = true // else we do filter/search/sort/paging here
      // filter
      if (filters) {
        items = filterItems(filters, items)
      }

      // search
      if (search) {
        const fuse = new Fuse(items, {
          ignoreLocation: true,
          threshold: 0.3,
          keys: [
            {
              name: 'search',
              getFn: (item) => {
                return [item.transform[0][0], item.transform[2][0]]
              },
            },
          ],
        })
        items = fuse.search({ search }).map((result) => result.item)
      }

      // sort
      if (sortBy && sortBy.index >= 0) {
        items = items.sort((a, b) => {
          return a.transform[sortBy.index][0].localeCompare(b.transform[sortBy.index][0])
        })
        if (sortBy.direction === 'desc') {
          items = items.reverse()
        }
      }

      // adjust page if now past end of items
      const start = (page - 1) * perPage
      if (start >= items.length) {
        rpage = Math.max(1, Math.ceil(items.length / perPage))
      }

      // if item count is 0 it's then search/filter returned no results
      // id data,length is 0 there are no resources and we show create resource button
      itemCount = items.length
      emptyResult = itemCount === 0

      // slice and dice
      const startIndex = (rpage - 1) * perPage
      const endIndex = rpage * perPage
      items = items.slice(startIndex, endIndex)

      // remove the transform work attribute
      items = items.map(({ transform, ...keepAttrs }) => keepAttrs)
    }

    const results: IResultListView = {
      page: rpage,
      items,
      itemCount,
      filterCounts,
      emptyResult,
      isPreProcessed,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}