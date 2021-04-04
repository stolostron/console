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
} from '../../../../atoms'

export function useAllClusters() {
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

    const clusters = useMemo(
        () =>
            mapClusters(
                clusterDeployments,
                managedClusterInfos,
                certificateSigningRequests,
                managedClusters,
                managedClusterAddons
            ),
        [clusterDeployments, managedClusterInfos, certificateSigningRequests, managedClusters, managedClusterAddons]
    )

    return clusters as Cluster[]
}
