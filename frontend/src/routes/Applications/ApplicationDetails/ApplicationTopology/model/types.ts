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

// Status types for compute statuses functionality
export type StatusType = 'checkmark' | 'warning' | 'pending' | 'failure'
export type StatusCode = 0 | 1 | 2 | 3

// Argo application health status types
export type ArgoHealthStatus = 'Healthy' | 'Degraded' | 'Missing' | 'Progressing' | 'Unknown' | 'Suspended'

// Pulse colors for node status visualization
export type PulseColor = 'red' | 'green' | 'yellow' | 'orange' | 'blocked' | 'spinner'

// Pulse type that matches the existing pulseValueArr - includes blocked and spinner
export type Pulse = 'red' | 'yellow' | 'orange' | 'green' | 'blocked' | 'spinner'

// Resource state types
export type ResourceState =
  | 'running'
  | 'bound'
  | 'pending'
  | 'creating'
  | 'terminating'
  | 'failed'
  | 'error'
  | 'offline'
  | 'invalid'
  | 'killed'
  | 'propagationfailed'
  | 'imagepullbackoff'
  | 'crashloopbackoff'
  | 'lost'

// Cluster status types
export type ClusterStatus = 'ok' | 'ready' | 'offline' | 'unknown' | 'pendingimport' | 'notaccepted' | ''

// Subscription status types
export type SubscriptionStatus = 'Subscribed' | 'Propagated' | 'Failed'

// Node types in the topology
export type NodeType =
  | 'application'
  | 'applicationset'
  | 'subscription'
  | 'cluster'
  | 'placements'
  | 'placement'
  | 'pod'
  | 'ansiblejob'
  | 'package'
  | 'namespace'
  | 'ocpapplication'
  | 'fluxapplication'

// Active filter configuration for status filtering
export interface ActiveFilters {
  resourceStatuses?: Set<StatusType>
}

// Cluster information interface
export interface ClusterInfo {
  name: string
  namespace?: string
  status?: ClusterStatus
  metadata?: {
    name: string
    [key: string]: unknown
  }
  _clusterNamespace?: string
  HubAcceptedManagedCluster?: boolean
  ManagedClusterJoined?: boolean
  ManagedClusterConditionAvailable?: string
  [key: string]: unknown
}

// Resource item with status information
export interface ResourceItemWithStatus extends ResourceItem {
  cluster?: string
  status?: string
  desired?: number
  available?: number
  current?: number
  resStatus?: string
  pulse?: PulseColor
  namespace?: string
  name?: string
  _hubClusterResource?: boolean
  localPlacement?: string
  [key: string]: unknown
}

// Subscription item interface
export interface SubscriptionItem extends ResourceItemWithStatus {
  status?: SubscriptionStatus | string
}

// Pod information interface
export interface PodInfo extends ResourceItemWithStatus {
  restarts?: number
  hostIP?: string
  podIP?: string
  startedAt?: string
}

// Argo application interface
export interface ArgoApplication {
  status?: {
    health?: {
      status?: ArgoHealthStatus
    }
    sync?: {
      status?: string
    }
    conditions?: Array<{
      type: string
      message: string
      [key: string]: unknown
    }>
  }
  metadata?: {
    name?: string
    namespace?: string
  }
  [key: string]: unknown
}

// Node specification interface
export interface NodeSpecs {
  pulse?: PulseColor
  shapeType?: string
  isDesign?: boolean
  isBlocked?: boolean
  raw?: {
    apiVersion?: string
    spec?: Record<string, unknown>
    status?: Record<string, unknown>
    hookType?: string
    [key: string]: unknown
  }
  channels?: unknown[]
  clusters?: ClusterInfo[]
  appClusters?: string[]
  clustersNames?: string[]
  targetNamespaces?: Record<string, unknown>
  searchClusters?: ClusterInfo[]
  subscriptionModel?: ResourceMap
  podModel?: ResourceMap
  resourceCount?: number
  relatedApps?: ArgoApplication[]
  appSetApps?: ArgoApplication[]
  [key: string]: unknown
}

// Enhanced topology node with computed status information
export interface TopologyNodeWithStatus extends TopologyNode {
  specs: NodeSpecs
  cluster?: string
  isPlacement?: boolean
  isArgoCDPullModelTargetLocalCluster?: boolean
  isPlacementFound?: boolean
  report?: SubscriptionReport
  [key: string]: unknown
}

// State names for internationalization
export interface StateNames {
  notDeployedStr: string
  notDeployedNSStr: string
  deployedStr: string
  deployedNSStr: string
  resNotDeployedStates: string[]
  resSuccessStates: string[]
}

// Detail item for status display
export interface DetailItem extends Record<string, unknown> {
  type?: 'label' | 'spacer' | 'link' | 'clusterdetailcombobox' | 'relatedargoappdetails'
  labelValue?: string
  value?: unknown
  status?: StatusType
  indent?: boolean
  data?: ResourceAction
  comboboxdata?: {
    clusterList: ClusterInfo[]
    clusterID: string
  }
  relatedargoappsdata?: {
    argoAppList: ArgoApplication[]
  }
}

// Window status array for subscription time windows
export type WindowStatusArray = string[]

// Function type for translation
export type TranslationFunction = (key: string, params?: string[]) => string
