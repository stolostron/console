/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, mapClusters } from '../../../../../resources'
import { useMemo } from 'react'
import { useRecoilValue, waitForAll } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterCuratorsState,
    clusterDeploymentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    agentClusterInstallsState,
    hostedClustersState,
    nodePoolsState,
    agentsState,
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
        agentClusterInstalls,
        hostedClusters,
        nodePools,
        agents,
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
            hostedClustersState,
            nodePoolsState,
            agentsState,
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
                clusterCurators,
                agentClusterInstalls,
                hostedClusters,
                nodePools,
                agents
            ),
        [
            clusterDeployments,
            managedClusterInfos,
            certificateSigningRequests,
            managedClusters,
            managedClusterAddons,
            clusterClaims,
            clusterCurators,
            agentClusterInstalls,
            hostedClusters,
            nodePools,
            agents,
        ]
    )
    return clusters as Cluster[]
}
