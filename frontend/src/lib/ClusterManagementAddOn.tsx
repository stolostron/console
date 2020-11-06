import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, ResourceList } from '../library/resources/resource'
import { resourceMethods } from '../library/utils/resource-methods'
import { useQuery } from './useQuery'

export const ClusterManagementAddOnApiVersion = 'addon.open-cluster-management.io/v1alpha1'
export type ClusterManagementAddOnApiVersionType = 'addon.open-cluster-management.io/v1alpha1'

export const ClusterManagementAddOnKind = 'ClusterManagementAddOn'
export type ClusterManagementAddOnKindType = 'ClusterManagementAddOn'

export interface ClusterManagementAddOn extends IResource {
    apiVersion: ClusterManagementAddOnApiVersionType
    kind: ClusterManagementAddOnKindType
    metadata: V1ObjectMeta
    spec: {
        addOnMeta: {
            displayName: string
            description: string
        }
        addOnConfiguration: {
            crdName: string
            crName: string
        }
    }
}

export const clusterManagementAddOnMethods = resourceMethods<ClusterManagementAddOn>({
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
})

export function useClusterManagementAddons() {
    return useQuery<ResourceList<ClusterManagementAddOn>>(clusterManagementAddOnMethods.listCluster)
}
