/* Copyright Contributors to the Open Cluster Management project */

import { useSharedSelectors, useRecoilValue } from '../shared-recoil'

export function useLocalHubManagedCluster() {
  const { localHubManagedClusterValue } = useSharedSelectors()
  return useRecoilValue(localHubManagedClusterValue)
}

export function useLocalHubName() {
  return useLocalHubManagedCluster()?.metadata.name ?? 'local-cluster'
}

export function useIsLocalHub(cluster: string) {
  const localHubName = useLocalHubManagedCluster()?.metadata.name
  return localHubName === cluster || (!localHubName && cluster === 'local-cluster')
}
