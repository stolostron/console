/* Copyright Contributors to the Open Cluster Management project */
export interface IWatchOptions {
  apiVersion: string
  kind: string
  labelSelector?: Record<string, string>
  fieldSelector?: Record<string, string>
  // poll the resource list instead of watching it
  // process the items in its own cache so not to overload event cache
  isPolled?: boolean
  /**
   * True when the Kubernetes resource is cluster-scoped.
   * Used by SSE RBAC to decide whether SelfSubjectRulesReview should probe `default`
   * (cluster-scoped) or the resource namespace (namespaced).
   */
  clusterScoped?: boolean
}
