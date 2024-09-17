/* Copyright Contributors to the Open Cluster Management project */

import {
  AgentClusterInstallK8sResource,
  HostedClusterK8sResource,
  NodePoolK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import {
  CertificateSigningRequest,
  ClusterClaim,
  ClusterCurator,
  ClusterDeployment,
  ClusterManagementAddOn,
  ClusterPool,
  ManagedCluster,
  ManagedClusterAddOn,
  ManagedClusterInfo,
  ManagedClusterSet,
  managedClusterSetLabel,
  mapClusters,
} from '../../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import keyBy from 'lodash/keyBy'

// returns the clusters assigned to a ManagedClusterSet
export function useClusters(
  managedClusterSet: ManagedClusterSet | undefined,
  clusterPool?: ClusterPool | undefined,
  isGlobalClusterSet?: boolean
) {
  const {
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    clusterManagementAddonsState,
    managedClusterInfosState,
    managedClustersState,
    agentClusterInstallsState,
    clusterCuratorsState,
    hostedClustersState,
    nodePoolsState,
  } = useSharedAtoms()

  const managedClusters = useRecoilValue(managedClustersState)
  const clusterDeployments = useRecoilValue(clusterDeploymentsState)
  const managedClusterInfos = useRecoilValue(managedClusterInfosState)
  const certificateSigningRequests = useRecoilValue(certificateSigningRequestsState)
  const managedClusterAddons = useRecoilValue(managedClusterAddonsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const clusterClaims = useRecoilValue(clusterClaimsState)
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const nodePools = useRecoilValue(nodePoolsState)

  return getMappedClusterPoolClusterSetClusters(
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
    managedClusterSet,
    clusterPool,
    isGlobalClusterSet
  )
}

// returns the clusters assigned to a ManagedClusterSet without invoking a react hook
export function getMappedClusterPoolClusterSetClusters(
  managedClusters: ManagedCluster[],
  clusterDeployments: ClusterDeployment[],
  managedClusterInfos: ManagedClusterInfo[],
  certificateSigningRequests: CertificateSigningRequest[],
  managedClusterAddons: Map<string, ManagedClusterAddOn[]>,
  clusterManagementAddons: ClusterManagementAddOn[],
  clusterClaims: ClusterClaim[],
  clusterCurators: ClusterCurator[],
  agentClusterInstalls: AgentClusterInstallK8sResource[],
  hostedClusters: HostedClusterK8sResource[],
  nodePools: NodePoolK8sResource[],
  managedClusterSet: ManagedClusterSet | undefined,
  clusterPool: ClusterPool | undefined,
  isGlobalClusterSet: boolean | undefined
) {
  let groupManagedClusters: ManagedCluster[] = []
  let groupClusterDeployments: ClusterDeployment[] = []

  if (managedClusterSet || isGlobalClusterSet === true) {
    groupManagedClusters =
      isGlobalClusterSet === true
        ? managedClusters
        : managedClusters.filter(
            (mc) => mc.metadata.labels?.[managedClusterSetLabel] === managedClusterSet?.metadata.name
          )

    const groupManagedClustersMap = keyBy(groupManagedClusters, 'metadata.name')
    groupClusterDeployments = clusterDeployments.filter(
      (cd) =>
        cd.metadata.labels?.[managedClusterSetLabel] === managedClusterSet?.metadata.name ||
        groupManagedClustersMap[cd.metadata.namespace!]
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

  const clusterNameSet = new Set([
    ...groupManagedClusters.map((mc) => mc.metadata.name),
    ...groupClusterDeployments.map((cd) => cd.metadata.name),
  ])

  const groupManagedClusterInfos = managedClusterInfos.filter((mci) => clusterNameSet.has(mci.metadata.namespace))

  const groupHostedClusters = hostedClusters.filter((hc) => clusterNameSet.has(hc.metadata?.name))

  return mapClusters(
    groupClusterDeployments,
    groupManagedClusterInfos,
    certificateSigningRequests,
    groupManagedClusters,
    managedClusterAddons,
    clusterManagementAddons,
    clusterClaims,
    clusterCurators,
    agentClusterInstalls,
    groupHostedClusters,
    nodePools
  )
}
