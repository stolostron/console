import { ClusterManagementAddOn, clusterManagementAddOnMethods } from '../library/resources/cluster-management-add-on'
import { ResourceList } from '../library/resources/resource'
import { useQuery } from './useQuery'

export function useClusterManagementAddons() {
    return useQuery<ResourceList<ClusterManagementAddOn>>(clusterManagementAddOnMethods.listCluster)
}
