import { useQuery } from '@apollo/client'
import { ManagedCluster, managedClusterMethods } from '../library/resources/managed-cluster'
import { ResourceList } from '../library/resources/resource'

export function useManagedClusters() {
    return useQuery<ResourceList<ManagedCluster>>(managedClusterMethods.list)
}
