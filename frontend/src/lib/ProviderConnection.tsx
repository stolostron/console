import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { resourceMethods, GetWrapper } from './Resource'
import * as YAML from 'yamljs'

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
