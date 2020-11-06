import { useCallback } from 'react'
import { ManagedClusterAddOn, managedClusterAddOnMethods } from '../library/resources/managed-cluster-add-on'
import { ResourceList } from '../library/resources/resource'
import { useQuery } from './useQuery'

export function useManagedClusterAddOns(namespace: string) {
    const restFunc = useCallback(() => {
        return managedClusterAddOnMethods.listNamespace(namespace)
    }, [namespace])
    return useQuery<ResourceList<ManagedClusterAddOn>>(restFunc)
}
