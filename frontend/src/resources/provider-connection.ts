import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import * as YAML from 'yamljs'
import { ProviderID } from '../lib/providers'
import { createResource, listResources } from '../lib/resource-request'

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

export function listProviderConnections() {
    const result = listResources<ProviderConnection>(
        {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
        },
        undefined,
        ['cluster.open-cluster-management.io/cloudconnection=']
    )
    return {
        promise: result.promise.then((providerConnections) => {
            for (const providerConnection of providerConnections) {
                if (providerConnection?.data?.metadata) {
                    try {
                        const yaml = Buffer.from(providerConnection?.data?.metadata, 'base64').toString('ascii')
                        providerConnection.spec = YAML.parse(yaml)
                    } catch {}
                }
                providerConnection.apiVersion = ProviderConnectionApiVersion
                providerConnection.kind = ProviderConnectionKind
            }
            return providerConnections
        }),
        abort: result.abort,
    }
}

export function createProviderConnection(providerConnection: ProviderConnection) {
    const copy = { ...providerConnection }
    delete copy.data
    copy.stringData = { metadata: YAML.stringify(copy.spec) }
    delete copy.spec
    return createResource<ProviderConnection>(copy)
}
