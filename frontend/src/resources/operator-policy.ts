/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const OperatorPolicyApiVersion = 'policy.open-cluster-management.io/v1beta1'
export type OperatorPolicyApiVersionType = 'policy.open-cluster-management.io/v1beta1'

export const OperatorPolicyKind = 'OperatorPolicy'
export type OperatorPolicyKindType = 'OperatorPolicy'

export const OperatorPolicyDefinition: IResourceDefinition = {
  apiVersion: OperatorPolicyApiVersion,
  kind: OperatorPolicyKind,
}

export interface OperatorPolicy extends IResource {
  apiVersion: OperatorPolicyApiVersionType
  kind: OperatorPolicyKindType
  metadata: Metadata
  status: {
    compliant: 'Compliant' | 'NonCompliant' | 'Pending'
    history: { lastTimestamp: string; message: string }[]
  }
}
