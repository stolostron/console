/* Copyright Contributors to the Open Cluster Management project */
import { Subject } from './kubernetes-client'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const MulticlusterRoleAssignmentApiVersion = 'rbac.open-cluster-management.io/v1alpha1'
export type MulticlusterRoleAssignmentApiVersionType = 'rbac.open-cluster-management.io/v1alpha1'

export const MulticlusterRoleAssignmentKind = 'MulticlusterRoleAssignment'
export type MulticlusterRoleAssignmentKindType = 'MulticlusterRoleAssignment'

export const MulticlusterRoleAssignmentNamespace = 'open-cluster-management-global-set'

export const MulticlusterRoleAssignmentDefinition: IResourceDefinition = {
  apiVersion: MulticlusterRoleAssignmentApiVersion,
  kind: MulticlusterRoleAssignmentKind,
}

export interface RoleAssignment {
  name: string
  clusterRole: string
  targetNamespaces?: string[]
  clusterSets: string[]
  // this is information should come from the aggregated API
  clusters?: string[]
}

export interface RoleAssignmentStatus {
  name: string
  status: 'Active' | 'Error' | 'Pending'
  reason?: string
}

export interface MulticlusterRoleAssignment extends IResource {
  apiVersion: MulticlusterRoleAssignmentApiVersionType
  kind: MulticlusterRoleAssignmentKindType
  metadata: Metadata
  spec: {
    subject: Subject
    roleAssignments: RoleAssignment[]
  }
  status: {
    roleAssignments?: RoleAssignmentStatus[]
  }
}
