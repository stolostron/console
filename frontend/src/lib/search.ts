/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getBackendUrl, IRequestResult, postRequest } from '../resources'

export const apiSearchUrl = '/proxy/search'
export const searchFilterQuery =
  'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}'

export type ISearchResult = {
  data: {
    searchResult: {
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
    input: {
      filters: { property: string; values: string[] | string }[]
      relatedKinds?: string[]
      limit?: number
    }[]
  }
  query: string
}

export function queryStatusCount(cluster: string): IRequestResult<ISearchResult> {
  return postRequest<SearchQuery, ISearchResult>(getBackendUrl() + apiSearchUrl, {
    operationName: 'searchResult',
    variables: {
      input: [
        {
          filters: [
            { property: 'compliant', values: ['!Compliant'] },
            { property: 'kind', values: ['Policy'] },
            { property: 'namespace', values: [cluster] },
            { property: 'cluster', values: ['local-cluster'] },
          ],
        },
      ],
    },
    query:
      'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    related {\n      kind\n      count\n      __typename\n    }\n    __typename\n  }\n}\n',
  })
}

export function queryRemoteArgoApps(): IRequestResult<ISearchResult> {
  return postRequest<SearchQuery, ISearchResult>(getBackendUrl() + apiSearchUrl, {
    operationName: 'searchResult',
    variables: {
      input: [
        {
          filters: [
            { property: 'kind', values: ['application'] },
            { property: 'apigroup', values: ['argoproj.io'] },
            { property: 'cluster', values: ['!local-cluster'] },
          ],
        },
      ],
    },
    query: searchFilterQuery,
  })
}

export function queryOCPAppResources(): IRequestResult<ISearchResult> {
  return postRequest<SearchQuery, ISearchResult>(getBackendUrl() + apiSearchUrl, {
    operationName: 'searchResult',
    variables: {
      input: [
        {
          filters: [
            {
              property: 'kind',
              values: ['cronjob', 'daemonset', 'deployment', 'deploymentconfig', 'job', 'statefulset'],
            },
          ],
          limit: 6500, // search said not to use unlimited results so use this for now until pagination is available
        },
      ],
    },
    query: searchFilterQuery,
  })
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
