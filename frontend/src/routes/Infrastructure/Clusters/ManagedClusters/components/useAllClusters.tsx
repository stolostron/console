/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, mapClusters } from '../../../../../resources/utils'
import { useMemo } from 'react'
import { useSharedAtoms, useSharedValue } from '../../../../../shared-atoms'

/**
 * Hook to retrieve aggregated list of all clusters
 * @param excludeUnclaimed Excludes unclaimed clusters in cluster pools (or claimed clusters for which the user can not see the claim)
 */
export function useAllClusters(excludeUnclaimed?: boolean) {
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
    discoveredClusterState,
  } = useSharedAtoms()

  const managedClusters = useSharedValue(managedClustersState)
  const clusterDeployments = useSharedValue(clusterDeploymentsState)
  const managedClusterInfos = useSharedValue(managedClusterInfosState)
  const certificateSigningRequests = useSharedValue(certificateSigningRequestsState)
  const managedClusterAddOns = useSharedValue(managedClusterAddonsState)
  const clusterManagementAddOns = useSharedValue(clusterManagementAddonsState)
  const clusterClaims = useSharedValue(clusterClaimsState)
  const clusterCurators = useSharedValue(clusterCuratorsState)
  const agentClusterInstalls = useSharedValue(agentClusterInstallsState)
  const hostedClusters = useSharedValue(hostedClustersState)
  const nodePools = useSharedValue(nodePoolsState)
  const discoveredClusters = useSharedValue(discoveredClusterState)

  const clusters = useMemo(
    () =>
      mapClusters({
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusters,
        managedClusterAddOns,
        clusterManagementAddOns,
        clusterClaims,
        clusterCurators,
        agentClusterInstalls,
        hostedClusters,
        nodePools,
        discoveredClusters,
      }).filter((cluster) => {
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
      managedClusterAddOns,
      clusterManagementAddOns,
      clusterClaims,
      clusterCurators,
      agentClusterInstalls,
      hostedClusters,
      nodePools,
      discoveredClusters,
      excludeUnclaimed,
    ]
  )
  return clusters as Cluster[]
}
