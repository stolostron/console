/* Copyright Contributors to the Open Cluster Management project */

import { clusterManagementAddonsState } from '../../../../../atoms'
import {
  Cluster,
  ClusterDeployment,
  ClusterPool,
  ManagedCluster,
  ManagedClusterSet,
  managedClusterSetLabel,
  mapClusters,
} from '../../../../../resources'
import { useRecoilValue, useSharedAtoms, useSharedRecoil } from '../../../../../shared-recoil'

// returns the clusters assigned to a ManagedClusterSet
export function useClusters(
  managedClusterSet: ManagedClusterSet | undefined,
  clusterPool?: ClusterPool | undefined,
  isGlobalClusterSet?: boolean
) {
  const { waitForAll } = useSharedRecoil()
  const {
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    agentClusterInstallsState,
    clusterCuratorsState,
    hostedClustersState,
    nodePoolsState,
  } = useSharedAtoms()

  const [
    managedClusters,
    clusterDeployments,
    managedClusterInfos,
    certificateSigningRequests,
    managedClusterAddons,
    clusterManagementAddons,
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

  let groupManagedClusters: ManagedCluster[] = []
  let groupClusterDeployments: ClusterDeployment[] = []

  if (managedClusterSet || isGlobalClusterSet === true) {
    groupManagedClusters =
      isGlobalClusterSet === true
        ? managedClusters
        : managedClusters.filter(
            (mc) => mc.metadata.labels?.[managedClusterSetLabel] === managedClusterSet?.metadata.name
          )
    groupClusterDeployments = clusterDeployments.filter(
      (cd) =>
        cd.metadata.labels?.[managedClusterSetLabel] === managedClusterSet?.metadata.name ||
        groupManagedClusters.find((mc) => mc.metadata.name === cd.metadata.namespace)
    )

    // prevent the unclaimed clusters from showing up in cluster set clusters
    groupClusterDeployments = groupClusterDeployments.filter((cd) => {
      if (cd.spec?.clusterPoolRef?.poolName !== undefined) {
        return cd.spec?.clusterPoolRef?.claimName !== undefined
      } else {
        return true
      }
    })
  }

  if (clusterPool) {
    groupClusterDeployments = clusterDeployments.filter(
      (cd) =>
        cd.spec?.clusterPoolRef?.claimName === undefined &&
        cd.spec?.clusterPoolRef?.poolName === clusterPool.metadata.name &&
        cd.spec?.clusterPoolRef?.namespace === clusterPool.metadata.namespace
    )
    groupManagedClusters = managedClusters.filter((mc) =>
      groupClusterDeployments.find((cd) => mc.metadata.name === cd.metadata.name)
    )
  }

  const clusterNames = Array.from(
    new Set([
      ...groupManagedClusters.map((mc) => mc.metadata.name),
      ...groupClusterDeployments.map((cd) => cd.metadata.name),
    ])
  )
  const groupManagedClusterInfos = managedClusterInfos.filter((mci) => clusterNames.includes(mci.metadata.namespace))
  const groupManagedClusterAddons = managedClusterAddons.filter((mca) => clusterNames.includes(mca.metadata.namespace))

  const groupHostedClusters = hostedClusters.filter((hc) => clusterNames.includes(hc.metadata?.name))

  const clusters: Cluster[] = mapClusters(
    groupClusterDeployments,
    groupManagedClusterInfos,
    certificateSigningRequests,
    groupManagedClusters,
    groupManagedClusterAddons,
    clusterManagementAddons,
    clusterClaims,
    clusterCurators,
    agentClusterInstalls,
    groupHostedClusters,
    nodePools
  )

  return clusters
}
