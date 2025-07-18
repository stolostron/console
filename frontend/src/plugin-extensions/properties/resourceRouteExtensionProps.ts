/* Copyright Contributors to the Open Cluster Management project */

export type ResourceRouteExtensionProps = {
  /** Resource model to match against */
  model: {
    group?: string
    kind: string
    version?: string
  }
  /** Function that returns the path for the resource */
  handler: (params: { kind: string; cluster?: string; namespace?: string; name: string }) => string | null
}
