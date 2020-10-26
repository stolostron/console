import { V1ObjectMeta } from '@kubernetes/client-node'
import * as YAML from 'yamljs'
import { ProviderID } from './providers'
import { GetWrapper, resourceMethods } from './Resource'

export interface ProviderConnection {
    apiVersion: 'v1'
    kind: 'Secret'
    metadata?: V1ObjectMeta
    data?: {
        metadata: string
    }
    stringData?: {
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

        // sshKnownHosts
        baseDomain: string
        pullSecret: string
        sshPrivatekey: string
        sshPublickey: string
        isOcp?: boolean
    }
}

export const providerConnections = resourceMethods<ProviderConnection>({ path: '/api/v1', plural: 'secrets' })

const originalList = providerConnections.list

providerConnections.list = async (labels?: string[]) => {
    if (!labels) {
        labels = ['cluster.open-cluster-management.io/cloudconnection=']
    } else if (!labels.includes('cluster.open-cluster-management.io/cloudconnection=')) {
        labels.push('cluster.open-cluster-management.io/cloudconnection=')
    }
    const result = await originalList(labels)
    for (const providerConnection of result.data) {
        if (providerConnection?.data?.metadata) {
            try {
                const yaml = Buffer.from(providerConnection?.data?.metadata, 'base64').toString('ascii')
                providerConnection.stringData = YAML.parse(yaml)
            } catch {}
        }
        console.log(providerConnection)
    }
    return result
}

const originalCreate = providerConnections.create

providerConnections.create = async (providerConnection: ProviderConnection) => {
    if (providerConnection.stringData) {
        delete providerConnection.data
    }
    return originalCreate(providerConnection)
}

export function ProviderConnections() {
    return GetWrapper<ProviderConnection[]>(providerConnections.list)
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
