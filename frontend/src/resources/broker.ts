/* Copyright Contributors to the Open Cluster Management project */
import { getResource } from '../resources/utils'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const BrokerApiVersion = 'submariner.io/v1alpha1'
export type BrokerApiVersionType = 'submariner.io/v1alpha1'

export const BrokerKind = 'Broker'
export type BrokerKindType = 'Broker'

export const defaultBrokerName = 'submariner-broker'

export const BrokerDefinition: IResourceDefinition = {
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

export function getBroker(metadata: { name: string; namespace: string }) {
  return getResource<Broker>({
    apiVersion: BrokerApiVersion,
    kind: BrokerKind,
    metadata,
  })
}
