/* Copyright Contributors to the Open Cluster Management project */
import { useSearchResultItemsQuery } from './search-sdk'
import { useMemo } from 'react'
import { convertStringToQuery } from './searchUtils'
import { SearchResult, UseMulticlusterSearchWatch } from './types'
import { searchClient } from './search-client'

export const useMulticlusterSearchWatch: UseMulticlusterSearchWatch = (watchOptions, advancedSearchFilters) => {
  const { groupVersionKind, limit, namespace, namespaced, name, isList } = watchOptions

  const { group, version, kind } = groupVersionKind ?? {}

  const queryInput = convertStringToQuery(
    `${group ? `apigroup:${group}` : ''} apiversion:${version} kind:${kind}${namespaced && namespace ? ` namespace:${namespace}` : ''}${name ? ` name:${name}` : ''}`,
    limit ?? -1
  )

  queryInput.filters.push(...(advancedSearchFilters || []))

  const {
    data: result,
    loading,
    error,
  } = useSearchResultItemsQuery({
    client: searchClient,
    skip: kind === undefined,
    variables: {
      input: [queryInput],
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
