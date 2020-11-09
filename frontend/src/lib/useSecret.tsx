import { ResourceList } from '../library/resources/resource'
import { secretMethods, Secret } from '../library/resources/secret'
import { useQuery } from './useQuery'

export function useSecrets() {
    return useQuery<ResourceList<Secret>>(secretMethods.list)
}
