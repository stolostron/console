/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import * as YAML from 'yamljs'
import { ProviderID } from '../lib/providers'
import { IResourceDefinition } from './resource'
import { createResource, getResource, listResources, replaceResource } from '../lib/resource-request'

export const ProviderConnectionApiVersion = 'v1'
export type ProviderConnectionApiVersionType = 'v1'

export const ProviderConnectionKind = 'Secret'
export type ProviderConnectionKindType = 'Secret'

export const ProviderConnectionDefinition: IResourceDefinition = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
}

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
        clientSecret?: string
        subscriptionId?: string
        tenantId?: string

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
        sshKnownHosts?: string[]
        imageMirror?: string
        bootstrapOSImage?: string
        clusterOSImage?: string
        additionalTrustBundle?: string[]

        ocmAPIToken?: string

        baseDomain: string
        pullSecret: string
        sshPrivatekey: string
        sshPublickey: string
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
        ['cluster.open-cluster-management.io/cloudconnection=']
    )
    return {
        promise: result.promise.then((providerConnections) => {
            return providerConnections.map(unpackProviderConnection)
        }),
        abort: result.abort,
    }
}

export function getProviderConnection(metadata: { name: string; namespace: string }) {
    const result = getResource<ProviderConnection>({
        apiVersion: ProviderConnectionApiVersion,
        kind: ProviderConnectionKind,
        metadata,
    })
    return {
        promise: result.promise.then(unpackProviderConnection),
        abort: result.abort,
    }
}

export function createProviderConnection(providerConnection: ProviderConnection) {
    return createResource<ProviderConnection>(packProviderConnection({ ...providerConnection }))
}

export function replaceProviderConnection(providerConnection: ProviderConnection) {
    return replaceResource<ProviderConnection>(packProviderConnection({ ...providerConnection }))
}

export function unpackProviderConnection(providerConnection: ProviderConnection) {
    if (providerConnection.data) {
        try {
            const yaml = Buffer.from(providerConnection?.data?.metadata, 'base64').toString('ascii')
            providerConnection.spec = YAML.parse(yaml)
        } catch {}
    } else if (providerConnection.stringData) {
        try {
            providerConnection.spec = YAML.parse(providerConnection.stringData.metadata)
        } catch {}
    }
    delete providerConnection.stringData
    delete providerConnection.data
    return providerConnection
}

export function packProviderConnection(providerConnection: ProviderConnection) {
    if (providerConnection.spec) {
        providerConnection.stringData = { metadata: YAML.stringify(providerConnection.spec) }
    }
    delete providerConnection.spec
    delete providerConnection.data
    return providerConnection
}
