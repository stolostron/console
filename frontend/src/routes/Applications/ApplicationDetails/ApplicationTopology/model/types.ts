export type Pulse = 'red' | 'yellow' | 'orange' | 'green'

export interface AnsibleCondition {
  ansibleResult?: string
  reason?: string
  message?: string
}

export interface AnsibleJobStatus {
  status?: string
  url?: string | null
}

export type Translator = (key: string) => string
export type DetailsList = Array<Record<string, unknown>>
export type NodeLike = Record<string, unknown>

// Describes optional URL search parameters supported by Argo helpers
export interface URLSearchData {
  apiVersion?: string
  cluster?: string
}

// Generic resource item returned by search/model collections
export type ResourceItem = Record<string, unknown>

// Map from arbitrary keys (e.g., cluster or kind key) to arrays of resources
export type ResourceMap = Record<string, ResourceItem[]>

// Callback used to add a related resource into a model collection
export type AddResourceToModelFn = (
  resourceObj: NodeLike,
  kind: string,
  relatedKind: string,
  nameWithoutChartRelease: string
) => void

export interface ResourceRef {
  name?: string
  namespace?: string
  kind?: string
  cluster?: string
  apigroup?: string
  apiversion?: string
}

export interface ResourceAction {
  action?: string
  name?: string
  namespace?: string
  kind?: string
  cluster?: string
  editLink?: string
  routeObject?: ResourceRef
  targetLink?: string
}

// Parameters used to build a Search YAML editor link for a resource
export interface EditLinkParams {
  name?: string
  namespace?: string
  kind?: string
  apiVersion?: string
  cluster?: string
}

// Describes a single search filter token such as "kind:Deployment"
export interface SearchFilter {
  property: string
  values: string[]
}

// Parsed search query returned by helpers/search-helper
export interface SearchQuery {
  keywords: string[]
  filters: SearchFilter[]
  relatedKinds: string[]
}

// Application Topology model shared types

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

// Minimal channel kind used to associate subscriptions to channels
export interface ChannelKind {
  metadata: {
    name: string
    namespace: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

// Minimal placement decision shape used to collect cluster names
export interface PlacementDecisionKind {
  metadata: {
    namespace: string
    labels?: Record<string, string>
    [key: string]: unknown
  }
  status?: {
    decisions?: Array<{
      clusterName: string
      clusterNamespace?: string
      [key: string]: unknown
    }>
  }
  [key: string]: unknown
}

// Minimal Placement and PlacementRule resources
export interface PlacementResource {
  kind?: string
  metadata: { name: string; namespace: string; [key: string]: unknown }
  [key: string]: unknown
}

export interface PlacementRuleResource {
  kind?: string
  metadata: { name: string; namespace: string; [key: string]: unknown }
  [key: string]: unknown
}

// Minimal AnsibleJob used for pre/post hooks
export interface AnsibleJob {
  kind: string
  metadata: { name: string; namespace: string; [key: string]: unknown }
  [key: string]: unknown
}

// Minimal subscription report used to render deployed resources
export interface SubscriptionReportResource {
  name: string
  namespace: string
  kind: string
  template?: Record<string, unknown>
  resources?: unknown
  resourceCount?: number
  [key: string]: unknown
}

export interface SubscriptionReportResult {
  source?: string
  result?: string
  [key: string]: unknown
}

export interface SubscriptionReport {
  resources?: SubscriptionReportResource[]
  results?: SubscriptionReportResult[]
  [key: string]: unknown
}

// Minimal Subscription resource shape with fields accessed by topology helpers
export interface SubscriptionKind {
  metadata: { name: string; namespace: string; [key: string]: unknown }
  spec?: {
    channel?: string
    placement?: {
      local?: boolean
      placementRef?: { name?: string; kind?: string }
      [key: string]: unknown
    }
    packageOverrides?: Array<{ packageName?: string; [key: string]: unknown }>
    [key: string]: unknown
  }
  status?: Record<string, unknown>
  // Derived/augmented fields used during model building
  report?: SubscriptionReport
  prehooks?: AnsibleJob[]
  posthooks?: AnsibleJob[]
  channels?: ChannelKind[]
  decisions?: PlacementDecisionKind[]
  placements?: Array<PlacementResource | PlacementRuleResource>
  deployablePaths?: string[]
  isChucked?: boolean
  rules?: unknown[]
  [key: string]: unknown
}

// Model used by subscription application view
export interface SubscriptionApplicationModel {
  channels: string[]
  subscriptions: SubscriptionKind[]
  allSubscriptions: SubscriptionKind[]
  allChannels: ChannelKind[]
  allClusters: string[]
  reports: Array<Record<string, unknown>>
  activeChannel?: string
  [key: string]: unknown
}

// Extend RecoilStates with optional resources used by subscription model helpers
export interface RecoilStates {
  applications: Array<Record<string, unknown>>
  placementDecisions: Array<Record<string, unknown>>
  placements: Array<Record<string, unknown>>
  multiclusterApplicationSetReports: Array<Record<string, unknown>>
  // Optional fields consumed by subscription helpers
  subscriptions?: SubscriptionKind[]
  channels?: ChannelKind[]
  placementRules?: PlacementRuleResource[]
  subscriptionReports?: SubscriptionReport[]
}

// Topology model types

// Minimal link structure used by topology rendering and conversion helpers
export interface TopologyLink {
  from?: { uid: string }
  to?: { uid: string }
  type: string
  // D3-friendly properties after conversion
  source?: string
  target?: string
  label?: string
  uid?: string
  specs?: Record<string, unknown>
  [key: string]: unknown
}

// Minimal node structure used by topology model helpers
export interface TopologyNode {
  name: string
  namespace: string
  type: string
  id: string
  uid: string
  specs: Record<string, unknown>
  // Allow additional dynamic fields used throughout helpers
  [key: string]: unknown
}

// Container for topology graph
export interface Topology {
  nodes: TopologyNode[]
  links: TopologyLink[]
  hubClusterName?: string
}

// Output of getApplicationData used to form search queries
export interface ApplicationData {
  subscription: string | null
  relatedKinds: string[]
  // Optional fields for Argo handling
  isArgoApp?: boolean
  applicationSet?: string
  cluster?: string
  source?: Record<string, unknown>
}
