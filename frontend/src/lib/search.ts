/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'
import { getBackendUrl, IRequestResult, postRequest } from '../resources/utils'

export const apiSearchUrl = '/proxy/search'
const searchFilterQuery =
  'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}'

export type ISearchResult = {
  data: {
    [searchResult: string]: {
      items?: any
      count?: number
      related?: {
        count: number
        kind: string
      }[]
    }[]
  }
}

export type SearchQuery = {
  operationName: string
  variables: {
    [input: string]: {
      filters: { property: string; values: string[] | string }[]
      relatedKinds?: string[]
      limit?: number
    }[]
  }
  query: string
}

export function querySearchDisabledManagedClusters(): IRequestResult<ISearchResult> {
  return postRequest<SearchQuery, ISearchResult>(getBackendUrl() + apiSearchUrl, {
    operationName: 'searchResult',
    variables: {
      input: [
        {
          filters: [
            { property: 'kind', values: ['Cluster'] },
            { property: 'addon', values: ['search-collector=false'] },
            { property: 'name', values: ['!local-cluster'] },
          ],
        },
      ],
    },
    query: searchFilterQuery,
  })
}

export function useSearchParams() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}
