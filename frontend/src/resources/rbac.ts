/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResourceDefinition } from './resource'
import { listResources } from '../lib/resource-request'

export const UserApiVersion = 'user.openshift.io/v1'
export type UserApiVersionType = 'user.openshift.io/v1'

export const RbacApiVersion = 'rbac.authorization.k8s.io/v1'
export type RbacApiVersionType = 'rbac.authorization.k8s.io/v1'

export const UserKind = 'User'
export type UserKindType = 'User'

export const GroupKind = 'Group'
export type GroupKindType = 'Group'

export const ClusterRoleKind = 'ClusterRole'
export type ClusterRoleKindType = 'ClusterRole'

export const ClusterRoleBindingKind = 'ClusterRoleBinding'
export type ClusterRoleBindingKindType = 'ClusterRoleBinding'

export const UserDefinition: IResourceDefinition = {
    apiVersion: UserApiVersion,
    kind: UserKind,
}

export const GroupDefinition: IResourceDefinition = {
    apiVersion: UserApiVersion,
    kind: GroupKind,
}

export const ClusterRoleDefinition: IResourceDefinition = {
    apiVersion: RbacApiVersion,
    kind: ClusterRoleKind,
}

export const ClusterRoleBindingDefinition: IResourceDefinition = {
    apiVersion: RbacApiVersion,
    kind: ClusterRoleBindingKind,
}

export interface User {
    apiVersion: UserApiVersionType
    kind: UserKindType
    metadata: V1ObjectMeta
    identities: string[]
    groups: string[]
}

export interface Group {
    apiVersion: UserApiVersionType
    kind: GroupKindType
    metadata: V1ObjectMeta
    users: string[]
}

export interface ClusterRole {
    apiVersion: RbacApiVersionType
    kind: ClusterRoleKindType
    metadata: V1ObjectMeta
    rules: {
        verbs: string[]
        apiGroups: string[]
        resources: string[]
        resourceNames: string[]
    }[]
}

export interface ClusterRoleBinding {
    apiVersion: RbacApiVersionType
    kind: ClusterRoleBindingKindType
    metadata: V1ObjectMeta
    subjects: {
        kind: 'User' | 'Group'
        apiGroup: 'rbac.authorization.k8s.io'
        name: string
    }[]
    roleRef: {
        apiGroup: 'rbac.authorization.k8s.io'
        kind: ClusterRoleKindType
        name: string
    }
}

export function listClusterRoleBindings() {
    return listResources<ClusterRoleBinding>(ClusterRoleBindingDefinition)
}

export function listUsers() {
    return listResources<User>(UserDefinition)
}

export function listGroups() {
    return listResources<Group>(GroupDefinition)
}
