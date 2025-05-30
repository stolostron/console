/* Copyright Contributors to the Open Cluster Management project */
export interface IWatchOptions {
  apiVersion: string
  kind: string
  labelSelector?: Record<string, string>
  fieldSelector?: Record<string, string>
  // poll the resource list instead of watching it
  // process the items in its own cache so not to overload event cache
  isPolled?: boolean
}
