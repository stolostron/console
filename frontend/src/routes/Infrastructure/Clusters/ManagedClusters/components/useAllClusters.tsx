/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, mapClusters } from '../../../../../resources'
import { useMemo } from 'react'
import { useSharedAtoms, useRecoilValue, useSharedRecoil } from '../../../../../shared-recoil'
import { clusterManagementAddonsState } from '../../../../../atoms'

export function useAllClusters() {
  const { waitForAll } = useSharedRecoil()
  const {
    managedClustersState,
    clusterDeploymentsState,
    managedClusterInfosState,
    certificateSigningRequestsState,
    managedClusterAddonsState,
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
      ),
    [
      clusterDeployments,
      managedClusterInfos,
      certificateSigningRequests,
      managedClusters,
      managedClusterAddons,
      clusterClaims,
      clusterCurators,
      agentClusterInstalls,
      hostedClusters,
      nodePools,
    ]
  )
  return clusters as Cluster[]
}
