/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, mapClusters } from '../../../../../resources'
import { useMemo } from 'react'
import { useSharedAtoms, useRecoilValue, useSharedRecoil } from '../../../../../shared-recoil'

export function useAllClusters() {
  const { waitForAll } = useSharedRecoil()
  const {
    managedClustersState,
    clusterDeploymentsState,
    managedClusterInfosState,
    certificateSigningRequestsState,
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
      clusterClaims,
      clusterCurators,
      agentClusterInstalls,
      hostedClusters,
      nodePools,
    ]
  )
  return clusters as Cluster[]
}
