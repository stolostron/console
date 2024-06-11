/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import Fuse from 'fuse.js'
import { IResource } from '../resources/resource'
import { isAuth } from '../routes/events'
import { AggregateCache } from '../routes/aggregator'

export type FilterSelections = {
  [filter: string]: string[]
}

export type FilterCounts = {
  [filter: string]: number
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
  filterItems: (filters: FilterSelections, items: IResource[]) => IResource[]
): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', () => {
    const body = chucks.join()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { page, perPage, search, sortBy, filters } = JSON.parse(body) as IRequestListView

    const { data, filterCounts } = cache
    let items = data
    let itemCount = items.length
    let rpage = page
    let emptyResult = true
    if (data.length) {
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
                return [item.transform[0], item.transform[2]]
              },
            },
          ],
        })
        items = fuse.search({ search }).map((result) => result.item)
      }

      // authorize
      items = items.filter((item) => isAuth(item, token))

      // sort
      if (sortBy && sortBy.index >= 0) {
        items = items.sort((a, b) => {
          return a.transform[sortBy.index].localeCompare(b.transform[sortBy.index])
        })
        if (sortBy.direction === 'desc') {
          items = items.reverse()
        }

        // adjust page if now past end of items
        const start = (page - 1) * perPage
        if (start >= items.length) {
          rpage = Math.max(1, Math.ceil(items.length / perPage))
        }
      }

      itemCount = items.length
      emptyResult = itemCount === 0
      // slice and dice
      const startIndex = (rpage - 1) * perPage
      const endIndex = rpage * perPage
      items = items.slice(startIndex, endIndex)
    }

    const results: IResultListView = {
      page: rpage,
      items,
      itemCount,
      filterCounts,
      emptyResult,
      isPreProcessed: true,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}
