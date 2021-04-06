/* Copyright Contributors to the Open Cluster Management project */

import { useRecoilValue, waitForAll } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
} from '../../../../atoms'
import { ManagedClusterSet, managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { Cluster, mapClusters } from '../../../../lib/get-cluster'

// returns the clusters assigned to a ManagedClusterSet
export function useClusters(managedClusterSet: ManagedClusterSet | undefined) {
    const [
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
    ] = useRecoilValue(
        waitForAll([
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
        ])
    )

    const clusterSetManagedClusters = managedClusters.filter(
        (mc) => mc.metadata.labels?.[managedClusterSetLabel] === managedClusterSet?.metadata.name
    )
    const clusterSetClusterDeployments = clusterDeployments.filter(
        (cd) => cd.metadata.labels?.[managedClusterSetLabel] === managedClusterSet?.metadata.name
    )
    const clusterNames = Array.from(
        new Set([
            ...clusterSetManagedClusters.map((mc) => mc.metadata.name),
            ...clusterSetClusterDeployments.map((cd) => cd.metadata.name),
        ])
    )
    const clusterSetManagedClusterInfos = managedClusterInfos.filter((mci) =>
        clusterNames.includes(mci.metadata.namespace)
    )
    const clusterSetManagedClusterAddons = managedClusterAddons.filter((mca) =>
        clusterNames.includes(mca.metadata.namespace)
    )

    const clusters: Cluster[] = mapClusters(
        clusterSetClusterDeployments,
        clusterSetManagedClusterInfos,
        certificateSigningRequests,
        clusterSetManagedClusters,
        clusterSetManagedClusterAddons
    )

    return clusters
}
