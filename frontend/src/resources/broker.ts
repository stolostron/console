/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const BrokerApiVersion = 'v1alpha1'
export type BrokerApiVersionType = 'v1alpha1'

export const BrokerKind = 'Broker'
export type BrokerKindType = 'Broker'

export const ClusterClaimDefinition: IResourceDefinition = {
    apiVersion: BrokerApiVersion,
    kind: BrokerKind,
}

export interface Broker extends IResource {
    apiVersion: BrokerApiVersionType
    kind: BrokerKindType
    metadata: Metadata
    spec?: {
        defaultGlobalnetClusterSize?: number
        globalnetCIDRRange?: string
        globalnetEnabled?: boolean
    }
}
