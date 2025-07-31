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
  kind: string
  apiGroup?: string
  name: string
  namespace?: string
}

export interface RoleRef {
  apiGroup: string
  kind: string
  name: string
}
