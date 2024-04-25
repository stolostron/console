/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useRef, useState } from 'react'
import { DiscoveredAppsParams, queryOCPAppResources, queryRemoteArgoApps } from '../lib/search'
import { useSharedAtoms } from '../shared-recoil'
import { useSharedReactQuery } from './shared-react-query'
import { debounce } from 'debounce'
import { SEARCH_DEBOUNCE_TIME } from '../ui-components/AcmTable'

const POLLING_INTERVAL = process.env.NODE_ENV !== 'test' ? false : 15 * 1000

const ocpAppCountQuery = () => queryOCPAppResources({ countOnly: true })

export function useDiscoveredOCPApps({
  clusters = [],
  types = [],
  search: searchText,
}: Omit<DiscoveredAppsParams, 'searchLimit'> = {}) {
  const { useQuery } = useSharedReactQuery()
  const { useAppOCPSearchResultLimit } = useSharedAtoms()
  const ocpSearchResultLimit = useAppOCPSearchResultLimit()

  const [search, setSearch] = useState<string | undefined>(searchText)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setSearchWithDebounce = useCallback(
    process.env.NODE_ENV !== 'test'
      ? debounce((search?: string) => {
          setSearch(search)
        }, SEARCH_DEBOUNCE_TIME)
      : setSearch,
    [setSearch]
  )

  useEffect(() => {
    if (searchText !== search) {
      setSearchWithDebounce(searchText)
    }
    return () => {
      if ('clear' in setSearchWithDebounce) {
        setSearchWithDebounce.clear()
      }
    }
  }, [search, searchText, setSearchWithDebounce])

  const filtered = !!(clusters.length || types.length || search)

  const allTypes = types.length === 0
  const enabled = allTypes || ['openshift', 'openshift-default', 'flux'].some((appType) => types.includes(appType))

  const ocpAppFilteredCountQuery = useCallback(
    () => queryOCPAppResources({ searchLimit: ocpSearchResultLimit, clusters, types, search, countOnly: true }),
    [ocpSearchResultLimit, clusters, types, search]
  )

  const ocpAppQuery = useCallback(
    () => queryOCPAppResources({ searchLimit: ocpSearchResultLimit, clusters, types, search }),
    [ocpSearchResultLimit, clusters, types, search]
  )

  const { data: count } = useQuery({
    queryKey: ['discovered-ocp-apps-count'],
    queryFn: ocpAppCountQuery,
    refetchInterval: POLLING_INTERVAL,
  })

  const initialFilteredCount = useRef(count)
  const { data: filteredCount } = useQuery({
    queryKey: ['discovered-ocp-apps-filtered-count', clusters, types, search],
    queryFn: ocpAppFilteredCountQuery,
    initialData: initialFilteredCount.current, // avoid reverting to full count when filter/search terms change
    refetchInterval: POLLING_INTERVAL,
    enabled: enabled && filtered,
    keepPreviousData: true,
  })
  initialFilteredCount.current = filteredCount

  const results = useQuery({
    queryKey: ['discovered-ocp-apps', clusters, types, search],
    queryFn: ocpAppQuery,
    refetchInterval: POLLING_INTERVAL,
    enabled,
    keepPreviousData: true,
  })

  const currentCount = filtered ? filteredCount : count

  const limitExceeded = !enabled || currentCount === undefined ? undefined : currentCount > ocpSearchResultLimit
  const hasResults = count === undefined ? undefined : count > 0

  return {
    ...results,
    limitExceeded,
    hasResults,
  }
}

const argoAppCountQuery = () => queryRemoteArgoApps({ countOnly: true })

export function useDiscoveredArgoApps({
  clusters = [],
  types = [],
  search: searchText,
}: Omit<DiscoveredAppsParams, 'searchLimit'> = {}) {
  const { useQuery } = useSharedReactQuery()
  const { useAppArgoSearchResultLimit } = useSharedAtoms()
  const argoSearchResultLimit = useAppArgoSearchResultLimit()

  const [search, setSearch] = useState<string | undefined>(searchText)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setSearchWithDebounce = useCallback(
    process.env.NODE_ENV !== 'test'
      ? debounce((search?: string) => {
          setSearch(search)
        }, SEARCH_DEBOUNCE_TIME)
      : setSearch,
    [setSearch]
  )

  useEffect(() => {
    if (searchText !== search) {
      setSearchWithDebounce(searchText)
    }
    return () => {
      if ('clear' in setSearchWithDebounce) {
        setSearchWithDebounce.clear()
      }
    }
  }, [search, searchText, setSearchWithDebounce])

  const filtered = !!(clusters.length || types.length || search)

  const allTypes = types.length === 0
  const enabled = allTypes || (types.includes('argo') && !(clusters.length === 1 && clusters[0] === 'local-cluster'))

  const argoAppFilteredCountQuery = useCallback(
    () => queryRemoteArgoApps({ searchLimit: argoSearchResultLimit, clusters, types, search, countOnly: true }),
    [argoSearchResultLimit, clusters, search, types]
  )

  const argoAppQuery = useCallback(
    () => queryRemoteArgoApps({ searchLimit: argoSearchResultLimit, clusters, types, search }),
    [argoSearchResultLimit, clusters, search, types]
  )

  const { data: count } = useQuery({
    queryKey: ['discovered-argo-apps-count'],
    queryFn: argoAppCountQuery,
    refetchInterval: POLLING_INTERVAL,
  })

  const initialFilteredCount = useRef(count)
  const { data: filteredCount } = useQuery({
    queryKey: ['discovered-argo-apps-filtered-count', clusters, types, search],
    queryFn: argoAppFilteredCountQuery,
    initialData: initialFilteredCount.current, // avoid reverting to full count when filter/search terms change
    refetchInterval: POLLING_INTERVAL,
    enabled: enabled && filtered,
    keepPreviousData: true,
  })
  initialFilteredCount.current = filteredCount

  const results = useQuery({
    queryKey: ['discovered-argo-apps', clusters, types, search],
    queryFn: argoAppQuery,
    refetchInterval: POLLING_INTERVAL,
    enabled,
    keepPreviousData: true,
  })

  const currentCount = filtered ? filteredCount : count

  const limitExceeded = !enabled || currentCount === undefined ? undefined : currentCount > argoSearchResultLimit
  const hasResults = count === undefined ? undefined : count > 0

  return {
    ...results,
    limitExceeded,
    hasResults,
  }
}
