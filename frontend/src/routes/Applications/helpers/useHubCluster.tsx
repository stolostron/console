/* Copyright Contributors to the Open Cluster Management project */

import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { getClusterStatus } from '../../../resources/utils'

// returns the hub cluster managed cluster object
export function useHubCluster(statusReady: boolean = false) {
  const { managedClustersState } = useSharedAtoms()
  const managedClusters = useRecoilValue(managedClustersState)

  return statusReady
    ? managedClusters.find(
        (cls) =>
          cls.metadata?.labels &&
          cls.metadata?.labels['local-cluster'] === 'true' &&
          getClusterStatus(undefined, undefined, undefined, cls, undefined, undefined, undefined).status === 'ready'
      )
    : managedClusters.find((cls) => cls.metadata?.labels && cls.metadata?.labels['local-cluster'] === 'true')
}
