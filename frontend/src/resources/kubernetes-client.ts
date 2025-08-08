/* Copyright Contributors to the Open Cluster Management project */
import { GroupKindType, ServiceAccountKindType, UserKindType } from './rbac'
export interface PolicyRule {
  verbs: string[]
  apiGroups: string[]
  resources: string[]
  resourceNames?: string[]
  nonResourceURLs?: string[]
}

export interface LocalObjectReference {
  name: string
}

export interface Subject {
  kind: UserKindType | GroupKindType | ServiceAccountKindType
  apiGroup?: string
  name: string
  namespace?: string
}

export interface RoleRef {
  apiGroup: string
  kind: string
  name: string
}
