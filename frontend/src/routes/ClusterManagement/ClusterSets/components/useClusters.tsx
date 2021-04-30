/* Copyright Contributors to the Open Cluster Management project */

import { useRecoilValue, waitForAll } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    clusterClaimsState,
} from '../../../../atoms'
import { ManagedClusterSet, managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { ManagedCluster } from '../../../../resources/managed-cluster'
import { ClusterDeployment } from '../../../../resources/cluster-deployment'
import { ClusterPool } from '../../../../resources/cluster-pool'
import { Cluster, mapClusters } from '../../../../lib/get-cluster'

// returns the clusters assigned to a ManagedClusterSet
export function useClusters(managedClusterSet: ManagedClusterSet | undefined, clusterPool?: ClusterPool | undefined) {
    const [
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
        clusterClaims,
    ] = useRecoilValue(
        waitForAll([
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
            clusterClaimsState,
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
        clusterClaims
    )

    return clusters
}
