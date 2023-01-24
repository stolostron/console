/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const HelmReleaseApiVersion = 'apps.open-cluster-management.io/v1'
export type HelmReleaseApiVersionType = 'apps.open-cluster-management.io/v1'

export const HelmReleaseKind = 'HelmRelease'
export type HelmReleaseKindType = 'HelmRelease'

export const HelmReleaseDefinition: IResourceDefinition = {
  apiVersion: HelmReleaseApiVersion,
  kind: HelmReleaseKind,
}

export interface HelmRelease extends IResource {
  apiVersion: HelmReleaseApiVersionType
  kind: HelmReleaseKindType
  metadata: Metadata
}
