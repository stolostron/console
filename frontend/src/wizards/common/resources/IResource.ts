/* Copyright Contributors to the Open Cluster Management project */
export interface IResource {
  status?: any
  apiVersion?: string
  kind?: string
  metadata?: {
    name?: string
    namespace?: string
    labels?: Record<string, string>
    uid?: string
  }
}
