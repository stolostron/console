/* Copyright Contributors to the Open Cluster Management project */
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { useMemo } from 'react'
import { SearchResult, UseFleetSearchPoll } from '../internal/search/types'
import { searchClient } from '../internal/search/search-client'

/**
 * A React hook that provides fleet-wide search functionality using ACM search API.
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
 * @returns A tuple containing:
 * - `data`: The search results formatted as Kubernetes resources, or undefined if no results
 * - `loaded`: Boolean indicating if the search has completed (opposite of loading)
 * - `error`: Any error that occurred during the search, or undefined if successful
 *
 * @example
 * ```typescript
 * // Search for all Pods in a specific namespace
 * const [pods, loaded, error] = useFleetSearchPoll({
 *   groupVersionKind: { group: '', version: 'v1', kind: 'Pod' },
 *   namespace: 'default',
 *   namespaced: true,
 *   isList: true
 * });
 *
 * // Search for a specific Deployment with additional filters
 * const [deployment, loaded, error] = useFleetSearchPoll({
 *   groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
 *   name: 'my-deployment',
 *   namespace: 'default',
 *   namespaced: true,
 *   isList: false
 * }, [
 *   { property: 'label', values: ['app=my-app'] }
 * ]);
 * ```
 *
 * @remarks
 * - The hook automatically handles the transformation of flattened search results back into
 *   properly structured Kubernetes resources
 * - Special handling is provided for VirtualMachine and VirtualMachineInstance resources
 * - Watch options filters take precedence over advanced search filters
 * - The search is skipped if no `kind` is specified in the groupVersionKind
 * - Results include cluster information for multi-cluster environments
 */
export const useFleetSearchPoll: UseFleetSearchPoll = (watchOptions, advancedSearch) => {
  const { groupVersionKind, limit, namespace, namespaced, name, isList } = watchOptions

  const { group, version, kind } = groupVersionKind ?? {}

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
  } = useSearchResultItemsQuery({
    client: searchClient,
    skip: kind === undefined,
    variables: {
      input: [searchInput],
    },
  })

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
        // Reverse the flattening of specific resources by the search-collector
        // See https://github.com/stolostron/search-collector/blob/main/pkg/transforms/genericResourceConfig.go
        switch (kind) {
          case 'VirtualMachine':
            resource.spec = {
              running: item._specRunning,
              runStrategy: item._specRunStrategy,
              template: { spec: { domain: { cpu: { cores: item.cpu }, memory: { guest: item.memory } } } },
            }
            resource.status = { conditions: [{ type: 'Ready', status: item.ready }], printableStatus: item.status }
            break
          case 'VirtualMachineInstance':
            resource.status = {
              conditions: [
                { type: 'LiveMigratable', status: item.liveMigratable },
                { type: 'Ready', status: item.ready },
              ],
              interfaces: [{ ipAddress: item.ipaddress, name: 'default' }],
              nodeName: item.node,
              phase: item.phase,
            }
        }
        return resource
      }),
    [kind, result]
  )

  const nullResponse = useMemo(() => (isList ? [] : undefined), [isList])

  return [(data as SearchResult<any>) ?? nullResponse, !loading, error]
}
