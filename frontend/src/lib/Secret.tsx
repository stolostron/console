import { V1Secret } from '@kubernetes/client-node'
import { resourceMethods, QueryWrapper, ResourceList } from './Resource'

export const secretMethods = resourceMethods<V1Secret>({
    path: '/api/v1',
    plural: 'secrets',
})

export function QuerySecrets() {
    return QueryWrapper<ResourceList<V1Secret>>(secretMethods.list)
}
