/* Copyright Contributors to the Open Cluster Management project */

// Minimal shape for a managed cluster used by topology utilities
export interface ManagedCluster {
  name: string
  namespace?: string
  kubeApiServer?: string
  status?: string
  creationTimestamp?: string
  [key: string]: unknown
}

// Minimal shape for global recoil-backed resource state consumed by model helpers
export interface RecoilStates {
  applications: Array<Record<string, unknown>>
  placementDecisions: Array<Record<string, unknown>>
  placements: Array<Record<string, unknown>>
  multiclusterApplicationSetReports: Array<Record<string, unknown>>
  [key: string]: unknown
}

// Cluster summary used for ApplicationSet views
export interface AppSetCluster {
  name: string
  namespace?: string
  url?: string
  status?: string
  // Some sources use creationTimestamp, others use created
  created?: string
  creationTimestamp?: string
}

// Core application model returned by getApplication
export interface ApplicationModel {
  name: string
  namespace: string
  app: Record<string, unknown>
  metadata?: Record<string, unknown>
  placement?: Record<string, unknown>
  isArgoApp: boolean
  isAppSet: boolean
  isOCPApp: boolean
  isFluxApp: boolean
  isAppSetPullModel: boolean
  relatedPlacement?: Record<string, unknown>
  clusterList?: string[]
  appSetApps?: Array<Record<string, unknown>>
  appSetClusters?: AppSetCluster[]
}
