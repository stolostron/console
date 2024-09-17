/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import Fuse from 'fuse.js'
import { IResource } from '../resources/resource'
import { getAuthorizedResources } from '../routes/events'
import { AppColumns } from '../routes/aggregators/applications'

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
  processedItemCount: number
  emptyResult: boolean
  isPreProcessed: boolean
  request: IRequestListView
}

export interface ITransformedResource extends IResource {
  transform?: string[][]
  isRemote?: boolean
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

export const PREPROCESS_BREAKPOINT = 500

export function paginate(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
  token: string,
  getItems: () => ITransformedResource[],
  filterItems: (filters: FilterSelections, items: ITransformedResource[]) => IResource[]
): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', async () => {
    const body = chucks.join()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = JSON.parse(body) as IRequestListView
    const { page, perPage, search, sortBy, filters } = request
    let items = getItems()
    let itemCount = items.length
    let rpage = page
    let emptyResult = false
    let isPreProcessed = itemCount === 0 // if false, we pass all data and frontend does the filter/search/sort
    const backendLimit = process.env.NODE_ENV === 'test' ? 0 : PREPROCESS_BREAKPOINT
    let startIndex = 0
    let endIndex = itemCount
    if (itemCount > backendLimit) {
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
                return [
                  item.transform[AppColumns.name][0],
                  item.transform[AppColumns.namespace][0],
                  item.transform[AppColumns.clusters][0],
                ]
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
      startIndex = (rpage - 1) * perPage
      endIndex = rpage * perPage
    }

    // because rbac is expensive. perform it only on the resources the user wants to see
    items = (await getAuthorizedResources(token, items, startIndex, endIndex)) as unknown as ITransformedResource[]

    // remove the transform work attribute
    items = items.map(({ transform, isRemote, ...keepAttrs }) => keepAttrs)

    const results: IResultListView = {
      page: rpage,
      items,
      processedItemCount: itemCount,
      emptyResult,
      isPreProcessed,
      request,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}
