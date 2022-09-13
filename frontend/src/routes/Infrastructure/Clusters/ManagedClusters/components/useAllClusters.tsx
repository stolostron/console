/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, mapClusters } from '../../../../../resources'
import { useContext, useMemo } from 'react'
import { PluginContext } from '../../../../../lib/PluginContext'

export function useAllClusters() {

    const { dataContext } = useContext(PluginContext)
    const { recoil, atoms } = useContext(dataContext)
    const { useRecoilValue, waitForAll } = recoil
    const {
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
    } = atoms
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
                nodePools
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
        ]
    )
    return clusters as Cluster[]
}
