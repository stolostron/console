/* Copyright Contributors to the Open Cluster Management project */

export interface ResourceList<T> {
  apiversion: string
  kind: string
  metadata?: {
    name: string
    namespace?: string
    resourceVersion?: string
    managedFields?: unknown
    selfLink?: string
    uid?: string
    labels?: Record<string, string>
  }
  items: T[]
}
