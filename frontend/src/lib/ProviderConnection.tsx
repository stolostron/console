import { V1Secret } from '@kubernetes/client-node'
import { resourceMethods, GetWrapper } from './Resource'

export interface ProviderConnection extends V1Secret {
    apiVersion: 'v1'
    kind: 'Secret'
}

export const providerConnections = resourceMethods<ProviderConnection>({ path: '/api/v1', plural: 'secrets' })

const original = providerConnections.list

providerConnections.list = (labels?: string[]) => {
    if (!labels) {
        labels = ['cluster.open-cluster-management.io/cloudconnection=']
    } else if (!labels.includes('cluster.open-cluster-management.io/cloudconnection=')) {
        labels.push('cluster.open-cluster-management.io/cloudconnection=')
    }
    return original(labels)
}

export function ProviderConnections() {
    return GetWrapper<ProviderConnection[]>(providerConnections.list)
}
