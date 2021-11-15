/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ChannelApiVersion = 'apps.open-cluster-management.io/v1'
export type ChannelApiVersionType = 'apps.open-cluster-management.io/v1'

export const ChannelKind = 'Channel'
export type ChannelKindType = 'Channel'

export const ChannelDefinition: IResourceDefinition = {
  apiVersion: ChannelApiVersion,
  kind: ChannelKind,
}

export interface Channel extends IResource {
  apiVersion: ChannelApiVersionType
  kind: ChannelKindType
  metadata: Metadata
  spec: {
    pathname: string
    type: string
  }
}