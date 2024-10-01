/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const MulticlusterApplicationSetReportApiVersion = 'apps.open-cluster-management.io/v1alpha1'
export type MulticlusterApplicationSetReportApiVersionType = 'apps.open-cluster-management.io/v1alpha1'

export const MulticlusterApplicationSetReportKind = 'MulticlusterApplicationSetReport'
export type MulticlusterApplicationSetReportKindType = 'MulticlusterApplicationSetReport'

export const MulticlusterApplicationSetReportDefinition: IResourceDefinition = {
  apiVersion: MulticlusterApplicationSetReportApiVersion,
  kind: MulticlusterApplicationSetReportKind,
}

export interface MulticlusterApplicationSetReport extends IResource {
  apiVersion: MulticlusterApplicationSetReportApiVersionType
  kind: MulticlusterApplicationSetReportKindType
  metadata: Metadata
  statuses: object
}
