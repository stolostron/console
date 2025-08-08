/* Copyright Contributors to the Open Cluster Management project */
import { Subject } from './kubernetes-client'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const RoleAssignmentApiVersion = 'rbac.open-cluster-management.io/v1alpha1'
export type RoleAssignmentApiVersionType = 'rbac.open-cluster-management.io/v1alpha1'

export const RoleAssignmentKind = 'RoleAssignment'
export type RoleAssignmentKindType = 'RoleAssignment'

export const RoleAssignmentDefinition: IResourceDefinition = {
  apiVersion: RoleAssignmentApiVersion,
  kind: RoleAssignmentKind,
}

interface Cluster {
  name: string
  namespaces: string[]
}

export interface RoleAssignment extends IResource {
  apiVersion: RoleAssignmentApiVersionType
  kind: RoleAssignmentKindType
  metadata: Metadata
  spec: {
    roles: string[]
    subjects: Subject[]
    clusters: Cluster[]
  }
}
