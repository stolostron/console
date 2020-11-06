import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import * as YAML from 'yamljs'
import { ResourceList } from './resource'
import { resourceMethods } from '../utils/resource-methods'
import { ProviderID } from '../../lib/providers'
import { useQuery } from '../../lib/useQuery'

export const ProviderConnectionApiVersion = 'v1'
export type ProviderConnectionApiVersionType = 'v1'

export const ProviderConnectionKind = 'Secret'
export type ProviderConnectionKindType = 'Secret'

export interface ProviderConnection extends V1Secret {
    apiVersion: ProviderConnectionApiVersionType
    kind: ProviderConnectionKindType
    metadata: V1ObjectMeta
    data?: {
        metadata: string
    }
    spec?: {
        awsAccessKeyID?: string
        awsSecretAccessKeyID?: string
        baseDomainResourceGroupName?: string
        clientId?: string
        clientsecret?: string
        subscriptionid?: string
        tenantid?: string
        gcProjectID?: string
        gcServiceAccountKey?: string
        username?: string
        password?: string
        vcenter?: string
        cacertificate?: string
        vmClusterName?: string
        datacenter?: string
        datastore?: string
        libvirtURI?: string
        sshKnownHosts?: string

        // Image Registry Mirror
        // Bootstrap OS Image
        // Cluster OS Image
        // Additional Trust Bundle

        baseDomain: string
        pullSecret: string
        sshPrivatekey: string
        sshPublickey: string
        isOcp?: boolean
    }
}

export const providerConnectionMethods = resourceMethods<ProviderConnection>({
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
})

const originalList = providerConnectionMethods.list

providerConnectionMethods.list = async (labels?: string[]) => {
    if (!labels) {
        labels = ['cluster.open-cluster-management.io/cloudconnection=']
    } else if (!labels.includes('cluster.open-cluster-management.io/cloudconnection=')) {
        labels.push('cluster.open-cluster-management.io/cloudconnection=')
    }
    const result = await originalList(labels)
    for (const providerConnection of result.data.items) {
        if (providerConnection?.data?.metadata) {
            try {
                const yaml = Buffer.from(providerConnection?.data?.metadata, 'base64').toString('ascii')
                providerConnection.spec = YAML.parse(yaml)
            } catch {}
        }
    }
    return result
}

const originalCreate = providerConnectionMethods.create

providerConnectionMethods.create = async (providerConnection: ProviderConnection) => {
    const copy = { ...providerConnection }
    delete copy.data
    copy.stringData = { metadata: YAML.stringify(copy.spec) }
    delete copy.spec
    return originalCreate(copy)
}

export function useProviderConnections() {
    return useQuery<ResourceList<ProviderConnection>>(providerConnectionMethods.list)
}

export function getProviderConnectionProviderID(providerConnection: Partial<ProviderConnection>) {
    const label = providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/provider']
    return label as ProviderID
}

export function setProviderConnectionProviderID(
    providerConnection: Partial<ProviderConnection>,
    providerID: ProviderID
) {
    if (!providerConnection.metadata) {
        providerConnection.metadata = {}
    }
    if (!providerConnection.metadata.labels) {
        providerConnection.metadata.labels = {}
    }
    providerConnection.metadata.labels['cluster.open-cluster-management.io/provider'] = providerID
    providerConnection.metadata.labels['cluster.open-cluster-management.io/cloudconnection'] = ''
}
