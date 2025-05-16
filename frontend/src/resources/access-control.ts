/* Copyright Contributors to the Open Cluster Management project */
import { IResource, IResourceDefinition } from './resource'

export const AccessControlApiVersion = 'rbac.open-cluster-management.io/v1alpha1'
export type AccessControlApiVersionType = 'rbac.open-cluster-management.io/v1alpha1'

export const AccessControlKind = 'ClusterPermission'
export type AccessControlKindType = 'ClusterPermission'

export const AccessControlDefinition: IResourceDefinition = {
  apiVersion: AccessControlApiVersion,
  kind: AccessControlKind,
}

export interface RoleBinding {
  namespace: string
  roleRef: RoleRef
  subject?: Subject
  subjects?: Subject[]
}

export interface ClusterRoleBinding {
  name?: string
  roleRef: RoleRef
  subject?: Subject
  subjects?: Subject[]
}

interface RoleRef {
  apiGroup: string
  kind: 'Role' | 'ClusterRole'
  name: string
}

interface Subject {
  apiGroup: string
  kind: 'User' | 'Group'
  name: string
  namespace?: string
}

export interface Condition {
  type: 'AppliedRBACManifestWork' | 'Validation'
  status: 'True' | 'False'
  reason?:
    | 'AppliedRBACManifestWork'
    | 'FailedValidationNoBindingsDefined'
    | 'FailedValidationNotInManagedClusterNamespace'
    | 'FailedBuildManifestWork'
  message: string
  lastTransitionTime: string
}

interface Status {
  conditions: Condition[]
}

export interface AccessControl extends IResource<Status> {
  apiVersion: AccessControlApiVersionType
  kind: AccessControlKindType
  spec: {
    roleBindings?: RoleBinding[]
    clusterRoleBinding?: ClusterRoleBinding
  }
}
