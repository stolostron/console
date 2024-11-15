/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'
import { OCPAppResource } from '../resources'
import { getBackendUrl, IRequestResult, postRequest } from '../resources/utils'
import { flatten, uniqBy } from 'lodash'

export const apiSearchUrl = '/proxy/search'
const searchFilterQuery =
  'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}'
const searchFilterQueryCount =
  'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n  }\n}'
const searchMatchAndFilterQuery =
  'query searchResult($byNameInput: [SearchInput], $byNamespaceInput: [SearchInput])  {\n  searchResultByName: search(input: $byNameInput) {\n    items\n  }\n  searchResultByNamespace: search(input: $byNamespaceInput) {\n    items\n  }\n}'
const searchMatchAndFilterQueryCount =
  'query searchResult($byNameInput: [SearchInput], $byNamespaceInput: [SearchInput])  {\n  searchResultByName: search(input: $byNameInput) {\n    count\n  }\n  searchResultByNamespace: search(input: $byNamespaceInput) {\n    count\n  }\n}'
const searchMatchWithClusterAndFilterQuery =
  'query searchResult($byNameInput: [SearchInput], $byNamespaceInput: [SearchInput], $byClusterInput: [SearchInput])  {\n  searchResultByName: search(input: $byNameInput) {\n    items\n  }\n  searchResultByNamespace: search(input: $byNamespaceInput) {\n    items\n  }\n  searchResultByCluster: search(input: $byClusterInput) {\n    items\n  }\n}'
const searchMatchWithClusterAndFilterQueryCount =
  'query searchResult($byNameInput: [SearchInput], $byNamespaceInput: [SearchInput], $byClusterInput: [SearchInput])  {\n  searchResultByName: search(input: $byNameInput) {\n    count\n  }\n  searchResultByNamespace: search(input: $byNamespaceInput) {\n    count\n  }\n  searchResultByCluster: search(input: $byClusterInput) {\n    count\n  }\n}'

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

export type DiscoveredAppsParams = {
  clusters?: string[]
  types?: string[]
  search?: string
  searchLimit?: number
}

function getOCPAppResourceLabelValues({
  types = [],
  name,
}: Pick<DiscoveredAppsParams, 'types'> & { name?: DiscoveredAppsParams['search'] }) {
  const allTypes = types.length === 0
  const searchString = name ? `*${name}*` : '*'
  const convertToLabelSearch = (label: string) => `${label}=${searchString}`
  return [
    ...(allTypes || types.includes('openshift') || types.includes('openshift-default')
      ? ['app', 'app.kubernetes.io/part-of'].map(convertToLabelSearch)
      : []),
    ...(allTypes || types.includes('flux')
      ? ['kustomize.toolkit.fluxcd.io/name', 'helm.toolkit.fluxcd.io/name'].map(convertToLabelSearch)
      : []),
  ]
}

function getOCPAppResourceFilters({
  cluster,
  clusters = [],
  name,
  namespace,
  types = [],
}: Pick<DiscoveredAppsParams, 'clusters' | 'types'> & {
  cluster?: DiscoveredAppsParams['search']
  name?: DiscoveredAppsParams['search']
  namespace?: DiscoveredAppsParams['search']
}) {
  const filtersArr = [
    {
      property: 'kind',
      values: ['CronJob', 'DaemonSet', 'Deployment', 'DeploymentConfig', 'Job', 'StatefulSet'],
    },
    {
      property: 'label',
      values: getOCPAppResourceLabelValues({ types, name }),
    },
    ...(namespace ? [{ property: 'namespace', values: [`*${namespace}*`] }] : []),
  ]

  if (clusters.length) {
    filtersArr.push({
      property: 'cluster',
      values: clusters,
    })
  } else if (cluster) {
    filtersArr.push({
      property: 'cluster',
      values: [`*${cluster}*`],
    })
  }

  return filtersArr
}

export async function queryOCPAppResources(params: DiscoveredAppsParams): Promise<OCPAppResource[]>
export async function queryOCPAppResources(params: DiscoveredAppsParams & { countOnly: true }): Promise<number>
export async function queryOCPAppResources(
  params: DiscoveredAppsParams & { countOnly?: true }
): Promise<OCPAppResource[] | number> {
  const { clusters = [], types = [], search, searchLimit, countOnly = false } = params

  let variables: SearchQuery['variables']
  let query: string

  const limitObject = countOnly ? {} : { limit: searchLimit }

  if (search) {
    variables = {
      byNameInput: [
        {
          filters: getOCPAppResourceFilters({ clusters, types, name: search }),
          ...limitObject,
        },
      ],
      byNamespaceInput: [
        {
          filters: getOCPAppResourceFilters({ clusters, types, namespace: search }),
          ...limitObject,
        },
      ],
      ...(clusters.length
        ? {}
        : {
            byClusterInput: [
              {
                filters: getOCPAppResourceFilters({ types, cluster: search }),
                ...limitObject,
              },
            ],
          }),
    }
    if (clusters.length) {
      query = countOnly ? searchMatchAndFilterQueryCount : searchMatchAndFilterQuery
    } else {
      query = countOnly ? searchMatchWithClusterAndFilterQueryCount : searchMatchWithClusterAndFilterQuery
    }
  } else {
    variables = {
      input: [
        {
          filters: getOCPAppResourceFilters({ clusters, types }),
          ...limitObject,
        },
      ],
    }
    query = countOnly ? searchFilterQueryCount : searchFilterQuery
  }

  const { promise } = postRequest<SearchQuery, ISearchResult>(getBackendUrl() + apiSearchUrl, {
    operationName: 'searchResult',
    variables,
    query,
  })
  return promise.then((result) => {
    if (countOnly) {
      return Math.max(...Object.values(result.data).map((value) => value?.[0]?.count || 0))
    } else {
      return uniqBy(
        flatten(Object.values(result.data).map((value) => value?.[0]?.items || [])),
        (item) => item._uid
      ) as OCPAppResource[]
    }
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
