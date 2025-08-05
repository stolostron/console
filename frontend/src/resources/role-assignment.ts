/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { Subject } from './kubernetes-client'

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

export interface RoleAssignmentSubject extends Subject {
  clusters: Cluster[]
}

export interface RoleAssignment extends IResource {
  apiVersion: RoleAssignmentApiVersionType
  kind: RoleAssignmentKindType
  metadata: Metadata
  spec: {
    role: string
    subjects: RoleAssignmentSubject[]
  }
}
