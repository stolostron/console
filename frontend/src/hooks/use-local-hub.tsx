/* Copyright Contributors to the Open Cluster Management project */

import { useSharedSelectors, useRecoilValue } from '../shared-recoil'

const DEFAULT_LOCAL_CLUSTER_NAME = 'local-cluster'

export function useLocalHubManagedCluster() {
  const { localHubManagedClusterValue } = useSharedSelectors()
  return useRecoilValue(localHubManagedClusterValue)
}

export function useLocalHubName() {
  return useLocalHubManagedCluster()?.metadata.name ?? DEFAULT_LOCAL_CLUSTER_NAME
}

export function useIsLocalHub(cluster: string) {
  const localHubName = useLocalHubManagedCluster()?.metadata.name
  return localHubName === cluster || (!localHubName && cluster === DEFAULT_LOCAL_CLUSTER_NAME)
}
