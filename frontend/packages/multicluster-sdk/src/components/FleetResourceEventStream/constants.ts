/* Copyright Contributors to the Open Cluster Management project */
export const MAX_MESSAGES = 500

export type EventInvolvedObject = {
  apiVersion?: string
  kind?: string
  name?: string
  uid?: string
  namespace?: string
}

export type EventKind = {
  reportingComponent?: string
  action?: string
  count?: number
  type?: string
  involvedObject: EventInvolvedObject
  message?: string
  eventTime?: string
  lastTimestamp?: string
  firstTimestamp?: string
  reason?: string
  source: {
    component: string
    host?: string
  }
  series?: {
    count?: number
    lastObservedTime?: string
    state?: string
  }
} & K8sResourceCommon
