/* Copyright Contributors to the Open Cluster Management project */
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { useCallback, useMemo } from 'react'
import { AdvancedSearchFilter, SearchResult } from '../types/search'
import { searchClient } from '../internal/search/search-client'
import { set } from 'lodash'
import { WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'

// Constants for polling interval configuration
const DEFAULT_POLL_INTERVAL_SECONDS = 30

const setIfDefined = (obj: any, path: string, value: any, valueToSet?: any): void => {
  if (value !== undefined) {
    set(obj, path, valueToSet ?? value)
  }
}
const getResourceKey = (kind: string, apigroup?: string): string => {
  if (apigroup) {
    return `${kind}.${apigroup}`
  }
  return kind
}

const parseConditionString = (conditionString: string): Array<{ type: string; status: string }> | undefined => {
  if (!conditionString || typeof conditionString !== 'string') {
    return undefined
  }
  const conditions = conditionString
    .split(';')
    .filter((condition) => condition.includes('='))
    .map((condition) => {
      const [type, status] = condition.split('=')
      return {
        type: type?.trim(),
        status: status?.trim(),
      }
    })
    .filter((condition) => condition.type && condition.status)
  return conditions.length > 0 ? conditions : undefined
}

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
export function useFleetSearchPoll<T extends K8sResourceCommon | K8sResourceCommon[]>(
  watchOptions: WatchK8sResource,
  advancedSearchFilters?: AdvancedSearchFilter,
  pollInterval?: number | false
): [SearchResult<T> | undefined, boolean, Error | undefined, () => void] {
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
  }, [group, version, kind, namespaced, namespace, name, advancedSearchFilters, limit])

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
        // _uid field holds '<cluster>/<uid>' but may be removed in the future
        const uid = item._uid?.split('/').pop() || undefined
        setIfDefined(resource, 'metadata.uid', uid)
        setIfDefined(resource, 'status.conditions', parseConditionString(item.condition))
        const resourceKey = getResourceKey(item.kind, item.apigroup)
        // Reverse the flattening of specific resources by the search-collector
        // See https://github.com/stolostron/search-collector/blob/main/pkg/transforms/genericResourceConfig.go
        switch (resourceKey) {
          case 'ClusterServiceVersion.operators.coreos.com':
            setIfDefined(resource, 'spec.version', item.version)
            setIfDefined(resource, 'spec.displayName', item.display)
            setIfDefined(resource, 'status.phase', item.phase)
            break
          case 'ClusterOperator.config.openshift.io': {
            setIfDefined(resource, 'status.versions[0]', item.version, { name: 'operator', version: item.version })
            if (!resource.status?.conditions) {
              const conditions: any = []
              setIfDefined(conditions, `[${conditions.length}]`, item.available, {
                type: 'Available',
                status: item.available,
              })
              setIfDefined(conditions, `[${conditions.length}]`, item.progressing, {
                type: 'Progressing',
                status: item.progressing,
              })
              setIfDefined(conditions, `[${conditions.length}]`, item.degraded, {
                type: 'Degraded',
                status: item.degraded,
              })
              if (conditions.length) {
                setIfDefined(resource, 'status.conditions', conditions)
              }
            }
            break
          }

          case 'DataVolume.cdi.kubevirt.io':
            setIfDefined(resource, 'spec.storage.resources.requests.storage', item.size)
            setIfDefined(resource, 'spec.storage.storageClassName', item.storageClassName)
            break

          case 'Namespace':
            setIfDefined(resource, 'status.phase', item.status)
            break
          case 'Node': {
            setIfDefined(resource, 'status.addresses[0]', item.ipAddress, {
              type: 'InternalIP',
              address: item.ipAddress,
            })
            setIfDefined(resource, 'status.allocatable.memory', item.memoryAllocatable)
            setIfDefined(resource, 'status.capacity.memory', item.memoryCapacity)
            break
          }

          case 'PersistentVolumeClaim':
            setIfDefined(resource, 'spec.resources.requests.storage', item.requestedStorage)
            setIfDefined(resource, 'spec.storageClassName', item.storageClassName)
            setIfDefined(resource, 'spec.volumeMode', item.volumeMode)
            setIfDefined(resource, 'status.phase', item.status)
            setIfDefined(resource, 'status.capacity.storage', item.capacity)
            break

          case 'StorageClass.storage.k8s.io':
            setIfDefined(resource, 'allowVolumeExpansion', item.allowVolumeExpansion)
            setIfDefined(resource, 'provisioner', item.provisioner)
            setIfDefined(resource, 'reclaimPolicy', item.reclaimPolicy)
            setIfDefined(resource, 'volumeBindingMode', item.volumeBindingMode)
            break

          case 'Subscription.operators.coreos.com':
            setIfDefined(resource, 'spec.source', item.source)
            setIfDefined(resource, 'spec.name', item.package)
            setIfDefined(resource, 'spec.channel', item.channel)
            setIfDefined(resource, 'status.installedCSV', item.installplan)
            setIfDefined(resource, 'status.state', item.phase)
            break

          case 'VirtualMachine.kubevirt.io': {
            setIfDefined(resource, 'spec.runStrategy', item.runStrategy)
            setIfDefined(resource, 'spec.template.spec.architecture', item.architecture)
            setIfDefined(resource, 'spec.template.spec.domain.cpu.cores', item.cpu, Number(item.cpu))
            setIfDefined(resource, 'spec.template.spec.domain.memory.guest', item.memory)
            setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/flavor"]', item.flavor)
            setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/os"]', item.osName)
            setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/workload"]', item.workload)
            if (item.dataVolumeNames && typeof item.dataVolumeNames === 'string') {
              const dataVolumeNamesList = item.dataVolumeNames.split(';').filter((name: string) => name.trim() !== '')
              if (dataVolumeNamesList.length > 0) {
                const volumes = dataVolumeNamesList.map((name: string) => ({
                  dataVolume: { name: name.trim() },
                }))
                setIfDefined(resource, 'spec.template.spec.volumes', volumes)
              }
            }

            if (item.pvcClaimNames && typeof item.pvcClaimNames === 'string') {
              const pvcClaimNamesList = item.pvcClaimNames.split(';').filter((name: string) => name.trim() !== '')
              if (pvcClaimNamesList.length > 0) {
                const pvcVolumes = pvcClaimNamesList.map((claimName: string) => ({
                  persistentVolumeClaim: { claimName: claimName.trim() },
                }))
                if (resource.spec?.template?.spec?.volumes) {
                  resource.spec.template.spec.volumes.push(...pvcVolumes)
                } else {
                  setIfDefined(resource, 'spec.template.spec.volumes', pvcVolumes)
                }
              }
            }
            if (!resource.status?.conditions) {
              const conditions: any = []
              setIfDefined(conditions, `[${conditions.length}]`, item.ready, { type: 'Ready', status: item.ready })
              setIfDefined(conditions, `[${conditions.length}]`, item.agentConnected, {
                type: 'AgentConnected',
                status: item.agentConnected,
              })
              if (conditions.length) {
                setIfDefined(resource, 'status.conditions', conditions)
              }
            }
            setIfDefined(resource, 'status.printableStatus', item.status)
            break
          }

          case 'VirtualMachineInstance.kubevirt.io': {
            setIfDefined(resource, 'spec.domain.cpu.cores', item.cpu, Number(item.cpu))
            setIfDefined(resource, 'spec.domain.cpu.sockets', item.cpuSockets, Number(item.cpuSockets))
            setIfDefined(resource, 'spec.domain.cpu.threads', item.cpuThreads, Number(item.cpuThreads))
            setIfDefined(resource, 'spec.domain.memory.guest', item.memory)
            if (!resource.status?.conditions) {
              const conditions: any = []
              setIfDefined(conditions, `[${conditions.length}]`, item.liveMigratable, {
                type: 'LiveMigratable',
                status: item.liveMigratable,
              })
              setIfDefined(conditions, `[${conditions.length}]`, item.ready, {
                type: 'Ready',
                status: item.ready,
              })
              if (conditions.length) {
                setIfDefined(resource, 'status.conditions', conditions)
              }
            }
            setIfDefined(resource, 'status.interfaces[0]', item.ipaddress, {
              ipAddress: item.ipaddress,
              name: 'default',
            })
            setIfDefined(resource, 'status.nodeName', item.node)
            setIfDefined(resource, 'status.phase', item.phase)
            setIfDefined(resource, 'status.guestOSInfo.version', item.osVersion)
            break
          }

          case 'VirtualMachineInstanceMigration.kubevirt.io':
            setIfDefined(resource, 'status.migrationState.endTimestamp', item.endTime)
            setIfDefined(resource, 'status.phase', item.phase)
            setIfDefined(resource, 'spec.vmiName', item.vmiName)
            break
          case 'VirtualMachineSnapshot.snapshot.kubevirt.io': {
            if (!resource.status?.conditions) {
              setIfDefined(resource, 'status.conditions[0]', item.ready, {
                type: 'Ready',
                status: item.ready,
              })
            }
            setIfDefined(resource, 'status.phase', item.phase)
            if (item.indications && typeof item.indications === 'string') {
              const indicationsArray = item.indications.split(';')
              setIfDefined(resource, 'status.indications', indicationsArray)
            }
            setIfDefined(resource, 'spec.source.kind', item.sourceKind)
            setIfDefined(resource, 'spec.source.name', item.sourceName)
            setIfDefined(resource, 'status.readyToUse', item.readyToUse)
            break
          }
          case 'VirtualMachineRestore.snapshot.kubevirt.io': {
            if (!resource.status?.conditions) {
              setIfDefined(resource, 'status.conditions[0]', item.ready, {
                type: 'Ready',
                status: item.ready,
              })
            }
            setIfDefined(resource, 'status.restoreTime', item.restoreTime)
            setIfDefined(resource, 'status.complete', item.complete)
            setIfDefined(resource, 'spec.target.kind', item.targetKind)
            setIfDefined(resource, 'spec.target.name', item.targetName)
            break
          }
        }
        return resource
      }),
    [result]
  )

  const nullResponse = useMemo(() => (isList ? [] : undefined), [isList])

  return [(data as SearchResult<any>) ?? nullResponse, !loading, error, triggerRefetch]
}
