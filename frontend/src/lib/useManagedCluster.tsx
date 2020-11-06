import { ManagedCluster, managedClusterMethods } from '../library/resources/managed-cluster'
import { ResourceList } from '../library/resources/resource'
import { useQuery } from './useQuery'

export function useManagedClusters() {
    return useQuery<ResourceList<ManagedCluster>>(managedClusterMethods.list)
}
