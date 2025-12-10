/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ConfigurationPolicyApiVersion = 'policy.open-cluster-management.io/v1'
export type ConfigurationPolicyApiVersionType = 'policy.open-cluster-management.io/v1'

export const ConfigurationPolicyKind = 'ConfigurationPolicy'
export type ConfigurationPolicyKindType = 'ConfigurationPolicy'

export const ConfigurationPolicyDefinition: IResourceDefinition = {
  apiVersion: ConfigurationPolicyApiVersion,
  kind: ConfigurationPolicyKind,
}

export interface ConfigurationPolicy extends IResource {
  apiVersion: ConfigurationPolicyApiVersionType
  kind: ConfigurationPolicyKindType
  metadata: Metadata
  status: {
    compliant: 'Compliant' | 'NonCompliant' | 'Pending'
    history: { lastTimestamp: string; message: string }[]
  }
}
