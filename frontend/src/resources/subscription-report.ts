/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const SubscriptionReportApiVersion = 'apps.open-cluster-management.io/v1alpha1'
export type SubscriptionReportApiVersionType = 'apps.open-cluster-management.io/v1alpha1'

export const SubscriptionReportKind = 'SubscriptionReport'
export type SubscriptionReportKindType = 'SubscriptionReport'

export const SubscriptionReportDefinition: IResourceDefinition = {
  apiVersion: SubscriptionReportApiVersion,
  kind: SubscriptionReportKind,
}

export interface SubscriptionReport extends IResource {
  apiVersion: SubscriptionReportApiVersionType
  kind: SubscriptionReportKindType
  metadata: Metadata
  spec: object
}
