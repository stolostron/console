/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { V1Secret } from '@kubernetes/client-node/dist/gen/model/v1Secret'
import * as YAML from 'yamljs'
import { listResources } from '../lib/resource-request'
import { IResourceDefinition } from './resource'

export const ProviderConnectionApiVersion = 'v1'
export type ProviderConnectionApiVersionType = 'v1'

export const ProviderConnectionKind = 'Secret'
export type ProviderConnectionKindType = 'Secret'

export const ProviderConnectionDefinition: IResourceDefinition = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
}

export interface ProviderConnectionSpec {
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
    additionalTrustBundle?: string

    ocmAPIToken?: string

    openstackCloudsYaml?: string
    openstackCloud?: string

    baseDomain?: string
    pullSecret?: string
    sshPrivatekey?: string
    sshPublickey?: string
}

export interface ProviderConnectionStringData {
    host?: string
    token?: string
}

export interface ProviderConnection {
    apiVersion: ProviderConnectionApiVersionType
    kind: ProviderConnectionKindType
    metadata: V1ObjectMeta
    data?: { metadata: string } & ProviderConnectionStringData
    stringData?: ProviderConnectionStringData
    spec?: ProviderConnectionSpec
    type: 'Opaque'
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

export function unpackProviderConnection(secret: ProviderConnection | V1Secret) {
    const providerConnection: ProviderConnection = { ...secret } as ProviderConnection
    if (providerConnection.data) {
        if (!providerConnection.stringData) providerConnection.stringData = {}
        const data = (providerConnection.data as unknown) as Record<string, string>
        const stringData = providerConnection.stringData as Record<string, string>

        for (const key in providerConnection.data) {
            stringData[key] = Buffer.from(data[key], 'base64').toString('ascii')
        }

        if (stringData.metadata) {
            try {
                providerConnection.spec = YAML.parse(stringData.metadata)
            } catch {}
        }

        delete providerConnection.data
    }
    return providerConnection
}

export function packProviderConnection(providerConnection: ProviderConnection) {
    if (providerConnection.spec) {
        if (Object.keys(providerConnection.spec).length > 0) {
            const metadata = YAML.stringify(providerConnection.spec)
            providerConnection.data = { metadata: Buffer.from(metadata).toString('base64') }
        } else {
            delete providerConnection.data
        }
        delete providerConnection.spec
    }
    if (providerConnection.stringData === undefined) {
        delete providerConnection.stringData
    } else if (providerConnection.stringData) {
        if (Object.keys(providerConnection.stringData).length === 0) {
            delete providerConnection.stringData
        }
    }
    return providerConnection
}
