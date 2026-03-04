/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { searchClient } from '../routes/Search/search-sdk/search-client'
import { useSearchResultItemsQuery } from '../routes/Search/search-sdk/search-sdk'

/**
 * Hook to get the cluster namespace map
 *
 * @returns { clusterNamespaceMap: Record<string, string[]>, isLoading: boolean }
 * clusterNamespaceMap is a map of cluster names to namespace names
 * isLoading is a boolean indicating if the namespaces are still loading
 */
export const useClusterNamespaceMap = () => {
  const { data: allNamespacesQuery, loading: isLoading } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: [{ property: 'kind', values: ['Namespace'] }],
          limit: -1,
        },
      ],
    },
  })

  const clusterNamespaceMap = useMemo(() => {
    if (!isLoading && allNamespacesQuery?.searchResult?.[0]?.items?.length) {
      const items = allNamespacesQuery?.searchResult?.[0]?.items || []
      return items.reduce<Record<string, string[]>>((acc, ns) => {
        const clusterName = ns.cluster
        const namespaceName = ns.name
        if (
          namespaceName &&
          !namespaceName.startsWith('kube') &&
          !namespaceName.startsWith('openshift') &&
          !namespaceName.startsWith('open-cluster-management')
        ) {
          if (!acc[clusterName]) acc[clusterName] = []
          acc[clusterName].push(namespaceName)
        }
        return acc
      }, {})
    } else {
      return {}
    }
  }, [allNamespacesQuery?.searchResult, isLoading])

  return { clusterNamespaceMap, isLoading }
}
