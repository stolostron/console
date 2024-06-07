/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { IResource } from '../resources/resource'

export interface IRequestView {
  page: number
  perPage: number
  search?: string
  // filter?: any
  // sort?: any
}

export interface IResultView {
  page: number
  items: IResource[]
  itemCount: number
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
    const { page, perPage } = JSON.parse(body) as IRequestView
    const startIndex = (page - 1) * perPage
    const endIndex = page * perPage

    const items = data.slice(startIndex, endIndex) as IResource[]

    // if (endIndex < data.length) {
    //   results.next = {
    //     page: page + 1,
    //     limit: perPage,
    //   }
    // }

    // if (startIndex > 0) {
    //   results.previous = {
    //     page: page - 1,
    //     limit: perPage,
    //   }
    // }

    const results: IResultView = {
      page,
      items,
      itemCount: data.length,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  })
}
