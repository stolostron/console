/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { listClusterResources } from './utils/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const ClusterManagementAddOnApiVersion = 'addon.open-cluster-management.io/v1alpha1'
export type ClusterManagementAddOnApiVersionType = 'addon.open-cluster-management.io/v1alpha1'

export const ClusterManagementAddOnKind = 'ClusterManagementAddOn'
export type ClusterManagementAddOnKindType = 'ClusterManagementAddOn'

export const ClusterManagementAddOnDefinition: IResourceDefinition = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
}

export interface ClusterManagementAddOn extends IResource {
    apiVersion: ClusterManagementAddOnApiVersionType
    kind: ClusterManagementAddOnKindType
    metadata: V1ObjectMeta
    spec: {
        addOnMeta?: {
            displayName: string
            description: string
        }
        addOnConfiguration?: {
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
