/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useRecoilValue, waitForAll } from 'recoil'
import { Cluster, mapClusters } from '../../../../../lib/get-cluster'
import {
    ansibleJobState,
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterCuratorsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
} from '../../../../../atoms'

export function useAllClusters() {
    const [
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
        clusterClaims,
        clusterCurators,
    ] = useRecoilValue(
        waitForAll([
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
            clusterClaimsState,
            clusterCuratorsState,
            ansibleJobState,
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
                clusterClaims,
                clusterCurators
            ),
        [
            clusterDeployments,
            managedClusterInfos,
            certificateSigningRequests,
            managedClusters,
            managedClusterAddons,
            clusterClaims,
            clusterCurators,
        ]
    )
    return clusters as Cluster[]
}
