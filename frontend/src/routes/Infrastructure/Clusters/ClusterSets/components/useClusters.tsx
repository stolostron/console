/* Copyright Contributors to the Open Cluster Management project */

import {
    Cluster,
    ClusterDeployment,
    ClusterPool,
    ManagedCluster,
    ManagedClusterSet,
    managedClusterSetLabel,
    mapClusters,
} from '../../../../../resources'
import { useRecoilValue, waitForAll } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    agentClusterInstallsState,
    clusterCuratorsState,
    agentsState,
    hostedClustersState,
    nodePoolsState,
} from '../../../../../atoms'

// returns the clusters assigned to a ManagedClusterSet
export function useClusters(managedClusterSet: ManagedClusterSet | undefined, clusterPool?: ClusterPool | undefined) {
    const [
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
        clusterClaims,
        clusterCurators,
        agentClusterInstalls,
        agents,
        hostedClusters,
        nodePools,
    ] = useRecoilValue(
        waitForAll([
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
            clusterClaimsState,
            clusterCuratorsState,
            agentClusterInstallsState,
            agentsState,
            hostedClustersState,
            nodePoolsState,
        ])
    )

    let groupManagedClusters: ManagedCluster[] = []
    let groupClusterDeployments: ClusterDeployment[] = []

    if (managedClusterSet) {
        groupManagedClusters = managedClusters.filter(
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
    const groupManagedClusterAddons = managedClusterAddons.filter((mca) =>
        clusterNames.includes(mca.metadata.namespace)
    )

    const clusters: Cluster[] = mapClusters(
        groupClusterDeployments,
        groupManagedClusterInfos,
        certificateSigningRequests,
        groupManagedClusters,
        groupManagedClusterAddons,
        clusterClaims,
        clusterCurators,
        agentClusterInstalls,
        hostedClusters,
        nodePools,
        agents
    )

    return clusters
}
