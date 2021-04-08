/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useRecoilValue, waitForAll } from 'recoil'
import { Cluster, mapClusters } from '../../../../lib/get-cluster'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterAddonsState,
    clusterClaimsState,
} from '../../../../atoms'

export function useAllClusters() {
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
    const clusters = useMemo(
        () =>
            mapClusters(
                clusterDeployments,
                managedClusterInfos,
                certificateSigningRequests,
                managedClusters,
                managedClusterAddons,
                clusterClaims
            ),
        [
            clusterDeployments,
            managedClusterInfos,
            certificateSigningRequests,
            managedClusters,
            managedClusterAddons,
            clusterClaims,
        ]
    )
    return clusters as Cluster[]
}
