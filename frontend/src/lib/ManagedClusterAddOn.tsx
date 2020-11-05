import { V1ObjectMeta } from '@kubernetes/client-node'
import { useCallback } from 'react'
import { IResource, ResourceList, resourceMethods, GetWrapper } from './Resource'

export interface ManagedClusterAddOn extends IResource {
    apiVersion: string
    kind: 'ManagedClusterAddOn'
    metadata: V1ObjectMeta
    spec: {}
    status: {
        conditions: {
            lastTransitionTime: string
            message: string
            reason: string
            status: string
            type: string
        }[]
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

export const managedClusterAddOns = resourceMethods<ManagedClusterAddOn>({
    path: '/apis/addon.open-cluster-management.io/v1alpha1',
    plural: 'managedclusteraddons',
})

export function ManagedClusterAddOns(namespace: string) {
    const restFunc = useCallback(() => {
        return managedClusterAddOns.listNamespace(namespace)
    }, [namespace])
    return GetWrapper<ResourceList<ManagedClusterAddOn>>(restFunc)
}
