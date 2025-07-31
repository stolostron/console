export interface PolicyRule {
  verbs: string[]
  apiGroups: string[]
  resources: string[]
  resourceNames?: string[]
}

export interface LocalObjectReference {
  name: string
}
