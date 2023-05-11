/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, mapClusters } from '../../../../../resources'
import { useMemo } from 'react'
import { useSharedAtoms, useRecoilValue, useSharedRecoil } from '../../../../../shared-recoil'

/**
 * Hook to retrieve aggregated list of all clusters
 * @param excludeUnclaimed Excludes unclaimed clusters in cluster pools (or claimed clusters for which the user can not see the claim)
 * @returns 
 */
export function useAllClusters(excludeUnclaimed?: boolean) {
  const { waitForAll } = useSharedRecoil()
  const {
    managedClustersState,
    clusterDeploymentsState,
    managedClusterInfosState,
    certificateSigningRequestsState,
    managedClusterAddonsState,
    clusterManagementAddonsState,
    clusterClaimsState,
    clusterCuratorsState,
    agentClusterInstallsState,
    hostedClustersState,
    nodePoolsState,
  } = useSharedAtoms()
  const [
    managedClusters,
    clusterDeployments,
    managedClusterInfos,
    certificateSigningRequests,
    managedClusterAddons,
    clusterManagementAddOns,
    clusterClaims,
    clusterCurators,
    agentClusterInstalls,
    hostedClusters,
    nodePools,
  ] = useRecoilValue(
    waitForAll([
      managedClustersState,
      clusterDeploymentsState,
      managedClusterInfosState,
      certificateSigningRequestsState,
      managedClusterAddonsState,
      clusterManagementAddonsState,
      clusterClaimsState,
      clusterCuratorsState,
      agentClusterInstallsState,
      hostedClustersState,
      nodePoolsState,
    ])
  )
  const clusters = useMemo(
    () =>
      mapClusters(
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusters,
        managedClusterAddons,
        clusterManagementAddOns,
        clusterClaims,
        clusterCurators,
        agentClusterInstalls,
        hostedClusters,
        nodePools
      ).filter((cluster) => {
        if (excludeUnclaimed) {
          if (cluster.hive.clusterPool) {
            return cluster.hive.clusterClaimName !== undefined
          }
        }
        return true
      }),
    [
      clusterDeployments,
      managedClusterInfos,
      certificateSigningRequests,
      managedClusters,
      managedClusterAddons,
      clusterManagementAddOns,
      clusterClaims,
      clusterCurators,
      agentClusterInstalls,
      hostedClusters,
      nodePools,
    ]
  )
  return clusters as Cluster[]
}
