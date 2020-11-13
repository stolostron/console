import { V1ObjectMeta } from '@kubernetes/client-node'
import { listClusterResources } from '../lib/resource-request'
import { IResource } from './resource'

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

export function listClusterManagementAddOns() {
    return listClusterResources<ClusterManagementAddOn>({
        apiVersion: ClusterManagementAddOnApiVersion,
        kind: ClusterManagementAddOnKind,
    })
}
