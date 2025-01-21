/* Copyright Contributors to the Open Cluster Management project */

import { useSharedSelectors, useRecoilValue } from '../shared-recoil'

export function useLocalHubManagedCluster() {
  const { localHubManagedClusterValue } = useSharedSelectors()
  return useRecoilValue(localHubManagedClusterValue)
}

export function useLocalHubName() {
  return useLocalHubManagedCluster()?.metadata.name
}
