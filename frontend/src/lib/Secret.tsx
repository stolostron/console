import { V1Secret } from '@kubernetes/client-node'
import { resourceMethods, useQueryWrapper, ResourceList } from './Resource'

export const secretMethods = resourceMethods<V1Secret>({
    path: '/api/v1',
    plural: 'secrets',
})

export function useSecrets() {
    return useQueryWrapper<ResourceList<V1Secret>>(secretMethods.list)
}
