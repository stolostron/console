/* Copyright Contributors to the Open Cluster Management project */
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { useCallback, useMemo } from 'react'
import { AdvancedSearchFilter, SearchResult } from '../types/search'
import { searchClient } from '../internal/search/search-client'
import { convertSearchItemToResource } from '../internal/search/convertSearchItemToResource'
import { FleetWatchK8sResource } from '../types'

// Constants for polling interval configuration
const DEFAULT_POLL_INTERVAL_SECONDS = 30

/**
 * A React hook that provides fleet-wide search functionality using the ACM search API.
 *
 * @template T - The type of Kubernetes resource(s) to search for, extending K8sResourceCommon
 *
 * @param watchOptions - Configuration options for the resource watch; no search query is performed if this value is null or if `kind` of `groupVersionKind` is not specified
 * @param watchOptions.cluster - The managed cluster on which the resource resides; unspecified to search all clusters
 * @param watchOptions.groupVersionKind - The group, version, and kind of the resource to search for
 * @param watchOptions.limit - Maximum number of results to return (defaults to -1 for no limit)
 * @param watchOptions.namespace - Namespace to search in (only used if namespaced is true)
 * @param watchOptions.namespaced - Whether the resource is namespaced
 * @param watchOptions.name - Specific resource name to search for (exact match)
 * @param watchOptions.isList - Whether to return results as a list or single item
 *
 * @param advancedSearch - Optional array of additional search filters
 * @param advancedSearch[].property - The property name to filter on
 * @param advancedSearch[].values - Array of values to match for the property
 *
 * @param pollInterval - Optional polling interval in seconds. Defaults to 30 seconds (polling enabled).
 *   - Not specified: polls every 30 seconds
 *   - 0-30 inclusive: polls every 30 seconds (minimum interval)
 *   - >30: polls at the given interval in seconds
 *   - false or negative: disables polling
 *
 * @returns A tuple containing:
 * - `data`: The search results formatted as Kubernetes resources, or undefined if no results
 * - `loaded`: Boolean indicating if the search has completed (opposite of loading)
 * - `error`: Any error that occurred during the search, or undefined if successful
 * - `refetch`: A callback that enables you to re-execute the query
 *
 * @example
 * ```typescript
 * // Search for all Pods in a specific namespace with default 30-second polling
 * const [pods, loaded, error] = useFleetSearchPoll({
 *   groupVersionKind: { group: '', version: 'v1', kind: 'Pod' },
 *   namespace: 'default',
 *   namespaced: true,
 *   isList: true
 * });
 *
 * // Search for a specific Deployment with polling every 60 seconds
 * const [deployment, loaded, error] = useFleetSearchPoll({
 *   groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
 *   name: 'my-deployment',
 *   namespace: 'default',
 *   namespaced: true,
 *   isList: false
 * }, [
 *   { property: 'label', values: ['app=my-app'] }
 * ], 60);
 *
 * // Search without polling (one-time query)
 * const [services, loaded, error] = useFleetSearchPoll({
 *   groupVersionKind: { group: '', version: 'v1', kind: 'Service' },
 *   namespaced: true,
 *   isList: true
 * }, undefined, false);
 * ```
 *
 * @remarks
 * - The hook automatically handles the transformation of flattened search results back into
 *   properly structured Kubernetes resources
 * - Special handling is provided for VirtualMachine and VirtualMachineInstance resources
 * - Watch options filters take precedence over advanced search filters
 * - The search is skipped if no `kind` is specified in the groupVersionKind
 * - Results include cluster information for multi-cluster environments
 * - Polling is enabled by default with a 30-second interval; use false to disable
 * - Minimum polling interval is 30 seconds for performance reasons
 */
export function useFleetSearchPoll<T extends K8sResourceCommon | K8sResourceCommon[]>(
  watchOptions?: FleetWatchK8sResource,
  advancedSearchFilters?: AdvancedSearchFilter,
  pollInterval?: number | false
): [SearchResult<T> | undefined, boolean, Error | undefined, () => void] {
  const { cluster, groupVersionKind, limit, namespace, namespaced, name, isList } = watchOptions ?? {}

  const { group, version, kind } = groupVersionKind ?? {}

  // Calculate the actual polling interval in milliseconds
  const actualPollInterval = useMemo(() => {
    // Disable polling for false or negative values
    if (pollInterval === false || (typeof pollInterval === 'number' && pollInterval < 0)) {
      return undefined
    }

    // Default to 30 seconds if not specified, or use minimum of 30 seconds for specified values
    const intervalInSeconds =
      pollInterval === undefined || pollInterval <= DEFAULT_POLL_INTERVAL_SECONDS
        ? DEFAULT_POLL_INTERVAL_SECONDS
        : pollInterval

    return intervalInSeconds * 1000
  }, [pollInterval])

  const searchInput = useMemo(() => {
    const filters: Array<{ property: string; values: string[] }> = []

    // Add filters from watchOptions (these take precedence)
    const watchOptionsProperties = new Set<string>()

    if (cluster) {
      filters.push({ property: 'cluster', values: [cluster] })
      watchOptionsProperties.add('cluster')
    }

    if (group) {
      filters.push({ property: 'apigroup', values: [group] })
      watchOptionsProperties.add('apigroup')
    }
    if (version) {
      filters.push({ property: 'apiversion', values: [version] })
      watchOptionsProperties.add('apiversion')
    }
    if (kind) {
      filters.push({ property: 'kind', values: [kind] })
      watchOptionsProperties.add('kind')
    }
    if (namespaced && namespace) {
      filters.push({ property: 'namespace', values: [namespace] })
      watchOptionsProperties.add('namespace')
    }
    if (name && name.trim()) {
      // Use exact match instead of wildcard
      filters.push({ property: 'name', values: [name] })
      watchOptionsProperties.add('name')
    }

    // Add filters from advancedSearch, excluding properties already specified in watchOptions
    if (advancedSearchFilters) {
      for (const { property, values } of advancedSearchFilters) {
        if (property && values !== undefined && !watchOptionsProperties.has(property)) {
          filters.push({ property, values })
        }
      }
    }

    return {
      filters,
      limit: limit ?? -1,
    }
  }, [cluster, group, version, kind, namespaced, namespace, name, advancedSearchFilters, limit])

  const {
    data: result,
    loading,
    error,
    refetch,
  } = useSearchResultItemsQuery({
    client: searchClient,
    skip: kind === undefined,
    pollInterval: actualPollInterval,
    variables: {
      input: [searchInput],
    },
  })

  const triggerRefetch: () => void = useCallback(() => {
    refetch()
  }, [refetch])

  const data = useMemo(() => {
    const convertedResources = result?.searchResult?.[0]?.items?.map(convertSearchItemToResource<T>)
    return (isList ? convertedResources : convertedResources?.[0]) as SearchResult<T>
  }, [isList, result])

  const nullResponse = useMemo(() => (isList ? [] : undefined), [isList])

  return [data ?? nullResponse, !loading, error, triggerRefetch]
}
