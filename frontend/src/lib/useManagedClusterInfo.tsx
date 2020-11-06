import { useCallback } from 'react'
import { ManagedClusterInfo, managedClusterInfoMethods } from '../library/resources/managed-cluster-info'
import { ResourceList } from '../library/resources/resource'
import { useQuery } from './useQuery'

export function useManagedClusterInfos(namespace: string) {
    const restFunc = useCallback(() => {
        return managedClusterInfoMethods.listNamespace(namespace)
    }, [namespace])
    return useQuery<ResourceList<ManagedClusterInfo>>(restFunc)
}
