import { ProviderConnection, providerConnectionMethods } from '../library/resources/provider-connection'
import { ResourceList } from '../library/resources/resource'
import { useQuery } from './useQuery'

export function useProviderConnections() {
    return useQuery<ResourceList<ProviderConnection>>(providerConnectionMethods.list)
}
