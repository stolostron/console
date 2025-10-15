/* Copyright Contributors to the Open Cluster Management project */
export interface Metadata {
  name?: string
  namespace?: string
  resourceVersion?: string
  creationTimestamp?: string
  uid?: string
  annotations?: Record<string, string>
  labels?: Record<string, string>
  generateName?: string
  deletionTimestamp?: string
  selfLink?: string
  generation?: number
  finalizers?: string[]
  ownerReferences?: OwnerReference[]
  managedFields?: unknown[]
}

export interface OwnerReference {
  apiVersion: string
  blockOwnerDeletion?: boolean
  controller?: boolean
  kind: string
  name: string
  uid?: string
}
