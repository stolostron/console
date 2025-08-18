/* Copyright Contributors to the Open Cluster Management project */
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { useCallback, useMemo } from 'react'
import { SearchResult } from '../types/search'
import { UseFleetSearchPoll } from '../types/fleet'
import { searchClient } from '../internal/search/search-client'
import { set } from 'lodash'

// Constants for polling interval configuration
const DEFAULT_POLL_INTERVAL_SECONDS = 30

/**
 * A React hook that provides fleet-wide search functionality using the ACM search API.
 *
 * @template T - The type of Kubernetes resource(s) to search for, extending K8sResourceCommon
 *
 * @param watchOptions - Configuration options for the resource watch
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
const setIfDefined = (obj: any, path: string, value: any): void => {
  if (value !== undefined) {
    set(obj, path, value)
  }
}
const getResourceKey = (kind: string, apigroup?: string): string => {
  if (apigroup) {
    return `${kind}.${apigroup}`
  }
  return kind
}

export const useFleetSearchPoll: UseFleetSearchPoll = (watchOptions, advancedSearch, pollInterval) => {
  const { groupVersionKind, limit, namespace, namespaced, name, isList } = watchOptions

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
    if (advancedSearch) {
      for (const { property, values } of advancedSearch) {
        if (property && values !== undefined && !watchOptionsProperties.has(property)) {
          filters.push({ property, values })
        }
      }
    }

    return {
      filters,
      limit: limit ?? -1,
    }
  }, [group, version, kind, namespaced, namespace, name, advancedSearch, limit])

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

  const data = useMemo(
    () =>
      result?.searchResult?.[0]?.items?.map((item) => {
        let label: Record<string, string> = {}
        if (item?.label) {
          label = Object.fromEntries(item.label.split(';').map((pair: string) => pair.trimStart().split('=')))
        }
        const resource: any = {
          cluster: item.cluster,
          apiVersion: `${item.apigroup ? `${item.apigroup}/` : ''}${item.apiversion}`,
          kind: item.kind,
          metadata: {
            creationTimestamp: item.created,
            name: item.name,
            namespace: item.namespace,
            labels: label,
          },
        }
        const resourceKey = getResourceKey(item.kind, item.apigroup)
        // Reverse the flattening of specific resources by the search-collector
        // See https://github.com/stolostron/search-collector/blob/main/pkg/transforms/genericResourceConfig.go
        switch (resourceKey) {
          case 'ClusterServiceVersion.operators.coreos.com':
            setIfDefined(resource, 'spec.version', item.version)
            setIfDefined(resource, 'spec.displayName', item.display)
            setIfDefined(resource, 'status.phase', item.phase)
            break

          case 'PersistentVolumeClaim':
            setIfDefined(resource, 'spec.resources.requests.storage', item.requestedStorage)
            setIfDefined(resource, 'spec.volumeMode', item.volumeMode)
            break

          case 'VirtualMachine.kubevirt.io':
            setIfDefined(resource, 'spec.runStrategy', item.runStrategy)
            setIfDefined(resource, 'spec.template.spec.domain.cpu.cores', item.cpu)
            setIfDefined(resource, 'spec.template.spec.domain.memory.guest', item.memory)
            setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/flavor"]', item.flavor)
            setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/os"]', item.osName)
            setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/workload"]', item.workload)
            resource.status = {
              conditions: [
                { type: 'Ready', status: item.ready },
                { type: 'AgentConnected', status: item.agentConnected },
              ],
            }
            setIfDefined(resource, 'status.printableStatus', item.status)
            break

          case 'VirtualMachineInstance.kubevirt.io':
            setIfDefined(resource, 'spec.domain.cpu.cores', item.cpu)
            setIfDefined(resource, 'spec.domain.memory.guest', item.memory)
            resource.status = {
              conditions: [
                { type: 'LiveMigratable', status: item.liveMigratable },
                { type: 'Ready', status: item.ready },
              ],
            }
            if (item.ipaddress !== undefined) {
              setIfDefined(resource, 'status.interfaces', [{ ipAddress: item.ipaddress, name: 'default' }])
            }
            setIfDefined(resource, 'status.nodeName', item.node)
            setIfDefined(resource, 'status.phase', item.phase)
            setIfDefined(resource, 'status.guestOSInfo.version', item.osVersion)
            setIfDefined(resource, 'metadata.labels["kubevirt.io/size"]', item.vmSize)
            break

          case 'VirtualMachineInstanceMigration.kubevirt.io':
            setIfDefined(resource, 'spec.vmiName', item.vmiName)
            setIfDefined(resource, 'status.migrationState.endTimestamp', item.endTime)
            setIfDefined(resource, 'status.phase', item.phase)
            break
        }
        return resource
      }),
    [result]
  )

  const nullResponse = useMemo(() => (isList ? [] : undefined), [isList])

  return [(data as SearchResult<any>) ?? nullResponse, !loading, error, triggerRefetch]
}
