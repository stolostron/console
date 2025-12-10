/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const CertificatePolicyApiVersion = 'policy.open-cluster-management.io/v1'
export type CertificatePolicyApiVersionType = 'policy.open-cluster-management.io/v1'

export const CertificatePolicyKind = 'CertificatePolicy'
export type CertificatePolicyKindType = 'CertificatePolicy'

export const CertificatePolicyDefinition: IResourceDefinition = {
  apiVersion: CertificatePolicyApiVersion,
  kind: CertificatePolicyKind,
}

export interface CertificatePolicy extends IResource {
  apiVersion: CertificatePolicyApiVersionType
  kind: CertificatePolicyKindType
  metadata: Metadata
  status: {
    compliant: 'Compliant' | 'NonCompliant' | 'Pending'
    history: { lastTimestamp: string; message: string }[]
  }
}
