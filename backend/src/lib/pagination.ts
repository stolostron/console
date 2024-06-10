/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import Fuse from 'fuse.js'
import { IResource } from '../resources/resource'

export interface ISortBy {
  index?: number
  direction?: 'asc' | 'desc'
}

export interface IRequestListView {
  page: number
  perPage: number
  sortBy?: ISortBy
  search?: string
  // filter?: any
}

export interface IResultListView {
  page: number
  items: IResource[]
  itemCount: number
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

export function paginate(req: Http2ServerRequest, res: Http2ServerResponse, data: unknown[]): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', () => {
    const body = chucks.join()
    const { page, perPage, search, sortBy } = JSON.parse(body) as IRequestListView

    let items = data as IResource[]
    let itemCount = data.length
    if (data.length) {
      // filter

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
        itemCount = items.length
      }

      // sort
      if (sortBy && sortBy.index >= 0) {
        items = items.sort((a, b) => {
          return a.transform[sortBy.index].localeCompare(b.transform[sortBy.index])
        })
        if (sortBy.direction === 'desc') {
          items = items.reverse()
        }
      }

      // slice and dice
      const startIndex = (page - 1) * perPage
      const endIndex = page * perPage
      items = items.slice(startIndex, endIndex)
    }

    const results: IResultListView = {
      page,
      items,
      itemCount,
      isPreProcessed: true,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}
