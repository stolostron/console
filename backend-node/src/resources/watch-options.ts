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
   * Whether watch events should be forwarded to browser clients via SSE.
   * When false, resources are still cached in the backend (available via
   * `getKubeResources`) but no `ServerSideEvents.pushEvent` calls are made,
   * avoiding per-client RBAC checks and SSE bandwidth for resources the
   * frontend does not consume through the event stream.
   * Defaults to true when omitted.
   */
  forwardEventsToClients?: boolean
}
