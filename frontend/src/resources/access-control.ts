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
export type SubjectType = 'User' | 'Group' | 'Role'

export interface RoleBinding {
  namespace: string
  roleRef: {
    apiGroup: string
    kind: 'Role'
    name: string
  }
  subject: {
    apiGroup: string
    kind: SubjectType
    name: string
  }
}

export interface AccessControl extends IResource {
  /**
   * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   */
  apiVersion: AccessControlApiVersionType
  /**
   * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   */
  kind: AccessControlKindType

  spec: {
    roleBindings: RoleBinding[]
  }
}
