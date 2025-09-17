/* Copyright Contributors to the Open Cluster Management project */
import { Subject } from './kubernetes-client'
import { Metadata } from './metadata'
import { UserKind } from './rbac'
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
  clusterSelection: {
    type: 'clusterNames'
    clusterNames: string[]
  }
}

export interface RoleAssignmentStatus {
  name: string
  status: 'Active' | 'Error' | 'Pending'
  reason?: string
  message?: string
}

export interface Condition {
  lastTransitionTime: string
  message: string
  observedGeneration: number
  reason: string
  status: 'True' | 'False' | 'Unknown'
  type: string
}

export interface MulticlusterRoleAssignment extends IResource {
  apiVersion: MulticlusterRoleAssignmentApiVersionType
  kind: MulticlusterRoleAssignmentKindType
  metadata: Metadata
  spec: {
    subject: Subject
    roleAssignments: RoleAssignment[]
  }
  status?: {
    conditions?: Condition[]
    roleAssignments?: RoleAssignmentStatus[]
  }
}

export const emptyMulticlusterRoleAssignment: MulticlusterRoleAssignment = {
  apiVersion: MulticlusterRoleAssignmentApiVersion,
  kind: MulticlusterRoleAssignmentKind,
  metadata: {},
  spec: {
    subject: {
      kind: UserKind,
      name: '',
    },
    roleAssignments: [],
  },
}
