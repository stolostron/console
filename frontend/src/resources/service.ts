/* Copyright Contributors to the Open Cluster Management project */

import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ServiceApiVersion = 'v1'
export type ServiceApiVersionType = 'v1'

export const ServiceKind = 'Service'
export type ServiceKindType = 'Service'

export const ServiceDefinition: IResourceDefinition = {
  apiVersion: ServiceApiVersion,
  kind: ServiceKind,
}

export interface Service extends IResource {
  apiVersion: ServiceApiVersionType
  kind: ServiceKindType
  metadata: Metadata
  spec: {
    ports: {
      port: number
    }[]
  }
}
