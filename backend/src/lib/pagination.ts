/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'

export interface PaginatedResults {
  next?: {
    page: number
    limit: number
  }
  previous?: {
    page: number
    limit: number
  }
  results?: unknown[]
}

export function paginate(req: Http2ServerRequest, res: Http2ServerResponse, data: unknown[]): void {
  const urlParams = new URLSearchParams(req.url.split('?')[1])
  const page = parseInt(urlParams.get('page'))
  const limit = parseInt(urlParams.get('limit'))
  const filter = urlParams.get('filter')

  const startIndex = (page - 1) * limit
  const endIndex = page * limit

  const results: PaginatedResults = {}

  if (endIndex < data.length) {
    results.next = {
      page: page + 1,
      limit: limit,
    }
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    }
  }

  results.results = data.slice(startIndex, endIndex)
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(results))
}
