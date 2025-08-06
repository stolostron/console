/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResourceDefinition } from './resource'
import { listResources } from './utils/resource-request'
import { PolicyRule, LocalObjectReference, Subject, RoleRef } from './kubernetes-client'
import { ObjectReference } from '@openshift-console/dynamic-plugin-sdk'

export const UserApiVersion = 'user.openshift.io/v1'
export type UserApiVersionType = 'user.openshift.io/v1'

export const RbacApiVersion = 'rbac.authorization.k8s.io/v1'
export type RbacApiVersionType = 'rbac.authorization.k8s.io/v1'

export const ServiceAccountApiVersion = 'v1'
export type ServiceAccountApiVersionType = 'v1'

export const UserKind = 'User'
export type UserKindType = 'User'

export const GroupKind = 'Group'
export type GroupKindType = 'Group'

export const ServiceAccountKind = 'ServiceAccount'
export type ServiceAccountKindType = 'ServiceAccount'

export const ClusterRoleKind = 'ClusterRole'
export type ClusterRoleKindType = 'ClusterRole'

export const ClusterRoleBindingKind = 'ClusterRoleBinding'
export type ClusterRoleBindingKindType = 'ClusterRoleBinding'

export const RoleKind = 'Role'
export type RoleKindType = 'Role'

export const RoleBindingKind = 'RoleBinding'
export type RoleBindingKindType = 'RoleBinding'

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

export const RoleDefinition: IResourceDefinition = {
  apiVersion: RbacApiVersion,
  kind: RoleKind,
}

export const RoleBindingDefinition: IResourceDefinition = {
  apiVersion: RbacApiVersion,
  kind: RoleBindingKind,
}

export const ServiceAccountDefinition: IResourceDefinition = {
  apiVersion: ServiceAccountApiVersion,
  kind: ServiceAccountKind,
}

export interface User {
  fullName?: string
  apiVersion: UserApiVersionType
  kind: UserKindType
  metadata: Metadata
  identities?: string[]
  groups?: string[]
}

export interface Group {
  apiVersion: UserApiVersionType
  kind: GroupKindType
  metadata: Metadata
  users: string[]
}

export interface ClusterRole {
  apiVersion: RbacApiVersionType
  kind: ClusterRoleKindType
  metadata: Metadata
  rules: PolicyRule[]
}

export interface ClusterRoleBinding {
  apiVersion: RbacApiVersionType
  kind: ClusterRoleBindingKindType
  metadata: Metadata
  subjects?: Subject[]
  roleRef: RoleRef
}

export interface Role {
  apiVersion: RbacApiVersionType
  kind: RoleKindType
  metadata: Metadata
  rules: PolicyRule[]
}

export interface RoleBinding {
  apiVersion: RbacApiVersionType
  kind: RoleBindingKindType
  metadata: Metadata
  subjects?: Subject[]
  roleRef: RoleRef
}

export interface ServiceAccount {
  apiVersion: ServiceAccountApiVersionType
  kind: ServiceAccountKindType
  metadata: Metadata
  secrets: ObjectReference[]
  imagePullSecrets: LocalObjectReference[]
  automountServiceAccountToken?: boolean
}

export function listClusterRoles() {
  return listResources<ClusterRole>(ClusterRoleDefinition)
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

export function listServiceAccounts() {
  return listResources<ServiceAccount>(ServiceAccountDefinition)
}

export function listRoles() {
  return listResources<Role>(RoleDefinition)
}

export function listRoleBindings() {
  return listResources<RoleBinding>(RoleBindingDefinition)
}
