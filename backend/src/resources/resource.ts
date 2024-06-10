/* Copyright Contributors to the Open Cluster Management project */

interface OwnerReference {
  apiVersion: string
  blockOwnerDeletion?: boolean
  controller?: boolean
  kind: string
  name: string
  uid?: string
}
export interface IResource {
  kind: string
  apiVersion: string
  metadata?: {
    name: string
    namespace?: string
    resourceVersion?: string
    managedFields?: unknown
    selfLink?: string
    uid?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    ownerReferences?: OwnerReference[]
    creationTimestamp?: string | number | Date
  }
  transform?: string[]
}
