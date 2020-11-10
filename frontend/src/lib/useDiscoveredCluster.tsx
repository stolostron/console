import { DiscoveredCluster, discoveredClusterMethods } from '../library/resources/discovered-cluster'
import { ResourceList } from '../library/resources/resource'
import { useQuery } from './useQuery'

export function useDiscoveredClusters() {
    return useQuery<ResourceList<DiscoveredCluster>>(discoveredClusterMethods.list)
}