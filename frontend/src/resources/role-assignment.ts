/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { UserKindType, GroupKindType, ServiceAccountKindType } from './rbac'

export const RoleAssignmentApiVersion = 'rbac.open-cluster-management.io/v1alpha1'
export type RoleAssignmentApiVersionType = 'rbac.open-cluster-management.io/v1alpha1'

export const RoleAssignmentKind = 'RoleAssignment'
export type RoleAssignmentKindType = 'RoleAssignment'

export const RoleAssignmentDefinition: IResourceDefinition = {
  apiVersion: RoleAssignmentApiVersion,
  kind: RoleAssignmentKind,
}

export interface Cluster {
  name: string
  clusterWide: boolean
  namespaces?: string[]
}

export interface Subject {
  kind: UserKindType | GroupKindType | ServiceAccountKindType
  name: string
  clusters: Cluster[]
}

export interface RoleAssignment extends IResource {
  apiVersion: RoleAssignmentApiVersionType
  kind: RoleAssignmentKindType
  metadata: Metadata
  spec: {
    role: string
    subjects: Subject[]
  }
}
