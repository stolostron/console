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
  DiscoveredCluster,
  isGlobalClusterSet,
  ManagedCluster,
  ManagedClusterAddOn,
  ManagedClusterInfo,
  ManagedClusterSet,
  managedClusterSetLabel,
} from '../../../../../resources'
import { mapClusters } from '../../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import keyBy from 'lodash/keyBy'

// returns the clusters assigned to a ManagedClusterSet
export function useClusters({
  managedClusterSet,
  clusterPool,
}: {
  managedClusterSet?: ManagedClusterSet
  clusterPool?: ClusterPool
}) {
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
    discoveredClusterState,
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
  const discoveredClusters = useRecoilValue(discoveredClusterState)

  return getMappedClusterPoolClusterSetClusters({
    managedClusters,
    clusterDeployments,
    managedClusterInfos,
    certificateSigningRequests,
    managedClusterAddOns: managedClusterAddons,
    clusterManagementAddOns: clusterManagementAddons,
    clusterClaims,
    clusterCurators,
    agentClusterInstalls,
    hostedClusters,
    nodePools,
    discoveredClusters,
    managedClusterSet,
    clusterPool,
  })
}

export function getMappedClusterSetClusters(
  params: Required<Omit<Parameters<typeof getMappedClusterPoolClusterSetClusters>[0], 'clusterPool'>>
) {
  return getMappedClusterPoolClusterSetClusters(params)
}

export function getMappedClusterPoolClusters(
  params: Required<Omit<Parameters<typeof getMappedClusterPoolClusterSetClusters>[0], 'managedClusterSet'>>
) {
  return getMappedClusterPoolClusterSetClusters(params)
}

// returns the clusters assigned to a ManagedClusterSet without invoking a react hook
function getMappedClusterPoolClusterSetClusters({
  managedClusters,
  clusterDeployments,
  managedClusterInfos,
  certificateSigningRequests,
  managedClusterAddOns,
  clusterManagementAddOns,
  clusterClaims,
  clusterCurators,
  agentClusterInstalls,
  hostedClusters,
  nodePools,
  discoveredClusters,
  managedClusterSet,
  clusterPool,
}: {
  managedClusters: ManagedCluster[]
  clusterDeployments: ClusterDeployment[]
  managedClusterInfos: ManagedClusterInfo[]
  certificateSigningRequests: CertificateSigningRequest[]
  managedClusterAddOns: Record<string, ManagedClusterAddOn[]>
  clusterManagementAddOns: ClusterManagementAddOn[]
  clusterClaims: ClusterClaim[]
  clusterCurators: ClusterCurator[]
  agentClusterInstalls: AgentClusterInstallK8sResource[]
  hostedClusters: HostedClusterK8sResource[]
  nodePools: NodePoolK8sResource[]
  discoveredClusters: DiscoveredCluster[]
  managedClusterSet?: ManagedClusterSet
  clusterPool?: ClusterPool
}) {
  let groupManagedClusters: ManagedCluster[] = []
  let groupClusterDeployments: ClusterDeployment[] = []

  if (managedClusterSet) {
    groupManagedClusters = isGlobalClusterSet(managedClusterSet)
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

  return mapClusters({
    clusterDeployments: groupClusterDeployments,
    managedClusterInfos: groupManagedClusterInfos,
    certificateSigningRequests,
    managedClusters: groupManagedClusters,
    managedClusterAddOns,
    clusterManagementAddOns,
    clusterClaims,
    clusterCurators,
    agentClusterInstalls,
    hostedClusters: groupHostedClusters,
    nodePools,
    discoveredClusters,
  })
}
