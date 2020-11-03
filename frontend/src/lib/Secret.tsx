import { V1Secret } from '@kubernetes/client-node'
import { resourceMethods, GetWrapper, ResourceList } from './Resource'

export const secrets = resourceMethods<V1Secret>({
    path: '/api/v1',
    plural: 'secrets',
})

export function Secrets() {
    return GetWrapper<ResourceList<V1Secret>>(secrets.list)
}
