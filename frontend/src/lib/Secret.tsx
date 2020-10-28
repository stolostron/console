import { V1Secret } from '@kubernetes/client-node'
import { resourceMethods, GetWrapper } from './Resource'

export const secrets = resourceMethods<V1Secret>({
    path: '/api/v1',
    plural: 'secrets',
})

export function Secrets() {
    return GetWrapper<V1Secret[]>(secrets.list)
}
