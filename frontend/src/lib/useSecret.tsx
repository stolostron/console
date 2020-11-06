import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { IResource, ResourceList } from '../library/resources/resource'
import { resourceMethods } from '../library/utils/resource-methods'
import { useQuery } from './useQuery'

export const SecretApiVersion = 'v1'
export type SecretApiVersionType = 'v1'

export const SecretKind = 'Secret'
export type SecretKindType = 'Secret'

interface Secret extends V1Secret, IResource {
    apiVersion: SecretApiVersionType
    kind: SecretKindType
    metadata: V1ObjectMeta
}

export const secretMethods = resourceMethods<Secret>({
    apiVersion: SecretApiVersion,
    kind: SecretKind,
})

export function useSecrets() {
    return useQuery<ResourceList<Secret>>(secretMethods.list)
}
