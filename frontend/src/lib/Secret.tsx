import { V1Secret } from '@kubernetes/client-node'
import { resourceMethods, GetWrapper } from './Resource'

export const secrets = resourceMethods<V1Secret>({
    path: '/apis/cluster.open-cluster-management.io/v1',
    plural: 'managedclusters',
})

export function Secrets() {
    return GetWrapper<V1Secret[]>(secrets.list)
}

export function CreateSecret(secret: V1Secret) {
    return GetWrapper<V1Secret>(() => secrets.create(secret))
}
