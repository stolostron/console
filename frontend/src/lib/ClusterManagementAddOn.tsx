import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, ResourceList,resourceMethods, GetWrapper } from './Resource'

export interface ClusterManagementAddOn extends IResource {
    apiVersion: string
    kind: 'ClusterManagementAddOn'
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

export const clusterManagementAddOns = resourceMethods<ClusterManagementAddOn>({
    path: '/apis/addon.open-cluster-management.io/v1alpha1',
    plural: 'clustermanagementaddons',
})

export function ClusterManagementAddons() {
    return GetWrapper<ResourceList<ClusterManagementAddOn>>(clusterManagementAddOns.listCluster)
}
