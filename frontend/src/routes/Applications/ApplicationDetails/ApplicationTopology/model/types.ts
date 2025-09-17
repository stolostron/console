/* Copyright Contributors to the Open Cluster Management project */
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
  type?: 'label' | 'spacer' | 'link' | 'snippet' | 'clusterdetailcombobox' | 'relatedargoappdetails'
  labelValue?: string
  value?: unknown
  status?: StatusType
  indent?: boolean
  data?: ResourceAction
  comboboxdata?: {
    clusterList: ClusterData[]
    sortedClusterNames?: string[]
    searchClusters?: ClusterData[]
    clusterID: string
  }
  relatedargoappsdata?: {
    argoAppList: ArgoApplication[]
  }
}

// Window status array for subscription time windows
export type WindowStatusArray = string[]

// Function type for translation
export type TranslationFunction = (key: string, params?: (string | number)[]) => string

// Types for computeRelated functionality

// Resource status data structure from search results
export interface ResourceStatusData {
  searchResult: SearchResultItem[]
}

export interface ResourceStatuses {
  data: ResourceStatusData
}

// Individual search result item containing application and related resources
export interface SearchResultItem {
  items?: ResourceItem[]
  related?: RelatedKindGroup[]
  name?: string
  namespace?: string
  dashboard?: string
  selfLink?: string
  _uid?: string
  created?: string
  apigroup?: string
  cluster?: string
  kind?: string
  label?: string
  _hubClusterResource?: string
  _rbac?: string
}

// Group of related resources by kind
export interface RelatedKindGroup {
  kind: string
  items: RelatedResourceItem[]
}

// Individual related resource item
export interface RelatedResourceItem {
  kind: string
  cluster: string
  name: string
  namespace: string
  label?: string
  desired?: string
  localPlacement?: string
  [key: string]: unknown
}

// Resource map object structure used in topology
export interface ResourceMapObject {
  name: string
  namespace: string
  type: string
  specs?: {
    resources?: Array<{
      name: string
      namespace: string
    }>
    clustersNames?: string[]
    searchClusters?: ClusterInfo[]
    parent?: {
      parentName: string
      parentType: string
      parentId: string
    }
    replicaCount?: number
    resourceCount?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

// Name processing result from pod hash removal
export interface NameProcessingResult {
  nameNoHash: string
  deployableName: string | null
}

// Parent resource information for controller revision sync
export interface ParentResourceInfo {
  parentName: string
  parentType: string
  parentId: string
}

// Cluster summary for application nodes
export interface AppClusterSummary {
  isLocal: boolean
  remoteCount: number
}

// Helm release detection helper
export interface HelmReleaseDetector {
  value: boolean
}

// Types for relatedResources functionality

// Resource definition within a report
export interface ReportResource {
  kind: string
  name: string
  namespace: string
}

// Individual result within a report indicating deployment status
export interface ReportResult {
  source: string
  result: string
}

// Report structure containing resources and deployment results
export interface ResourceReport {
  resources?: ReportResource[]
  results?: ReportResult[]
}

// Search query structure for finding related resources
export interface RelatedResourcesSearchQuery {
  keywords: string[]
  filters: SearchFilter[]
  relatedKinds?: string[]
}

// Response from ManagedClusterView API
export interface ManagedClusterViewResponse {
  result?: {
    metadata?: {
      name: string
      namespace: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  message?: string
}

// Search response structure for related resources
export interface RelatedResourcesSearchResponse {
  data?: {
    searchResult?: Array<{
      items?: ResourceItem[]
      related?: RelatedKindGroup[]
    }>
  }
}

// Structure for storing related resources by resource key
export interface RelatedResourcesMap {
  [resourceKey: string]: {
    related?: RelatedKindGroup[]
    template?: Record<string, unknown>
  }
}

// Additional types for topology.ts functionality

// Cluster grouping state tracker
export interface ClusterGroupingState {
  value: boolean
}

// Helm releases detection state tracker
export interface HelmReleasesState {
  value: boolean
}

// Resource map for topology processing - maps resource keys to topology nodes
export interface TopologyResourceMap {
  [resourceKey: string]: TopologyNode
}

// Diagram elements returned by getDiagramElements function
export interface DiagramElements {
  activeChannel: string | null
  channels: string[]
  links: TopologyLink[]
  nodes: TopologyNode[]
}

// Argo data structure passed to getArgoTopology
export interface ArgoData {
  topology?: Topology
  cluster?: string
  [key: string]: unknown
}

// Extended topology with optional raw search data (used by OCP/Flux apps)
export interface ExtendedTopology extends Topology {
  rawSearchData?: unknown
}

// Types for topologySubscription functionality

// Rule decision mapping for placement decisions
export interface RuleDecisionMap {
  [clusterName: string]: string
}

// Service mapping for service owners (Route, Ingress, StatefulSet)
export interface ServiceMap {
  [serviceName: string]: string
}

// Parent object information for deployed resources
export interface ParentObject {
  parentId: string
  parentName: string
  parentType: string
  parentSpecs: Record<string, unknown>
}

// Subscription application model with extended properties
export interface SubscriptionApplicationModelExtended extends SubscriptionApplicationModel {
  name: string
  namespace: string
  app: Record<string, unknown>
}

// Test-specific types for diagram-helpers-utils.test.ts

// Test topology node with minimal required fields for testing
export interface TestTopologyNode {
  type: string
  _lastUpdated?: number
  id?: string
  name?: string
  cluster?: string | null
  clusterName?: string | null
  clusters?: {
    specs?: {
      targetNamespaces?: Record<string, string[]>
      appClusters?: string[]
    }
  }
  specs?: {
    raw?: {
      apiVersion?: string
      kind?: string
      metadata?: {
        name?: string
        namespace?: string
      }
      spec?: Record<string, unknown>
    }
    deployStatuses?: unknown[]
    isDesign?: boolean
    parent?: {
      parentId: string
      parentName: string
      parentType: string
    }
    clustersNames?: string[]
    searchClusters?: ClusterInfo[]
    namespaceModel?: Record<string, ResourceItem[]>
    clusterroleModel?: Record<string, ResourceItem[]>
    policyModel?: Record<string, ResourceItem[]>
    pulse?: string
    shapeType?: string
    appClusters?: string[]
    targetNamespaces?: Record<string, string[]>
    clusters?: ClusterInfo[]
    subscriptionModel?: Record<string, SubscriptionItem[]>
    daemonsetModel?: Record<string, ResourceItem>
  }
  namespace?: string
}

// Test cluster node structure
export interface TestClusterNode {
  id: string
  clusters?: {
    specs?: {
      appClusters?: string[]
    }
  }
  specs?: {
    clustersNames?: string[]
    appClusters?: string[]
    targetNamespaces?: Record<string, string[]>
    searchClusters?: ClusterInfo[]
    clusters?: ClusterInfo[]
  }
}

// Test namespace node structure
export interface TestNamespaceNode extends TestTopologyNode {
  type: 'namespace'
}

// Test policy node structure
export interface TestPolicyNode extends TestTopologyNode {
  type: 'policy'
}

// Test subscription node structure (basic)
export interface TestSubscriptionNodeBasic extends Omit<TestTopologyNode, 'specs'> {
  type: 'subscription'
  specs?: {
    raw?: {
      apiVersion?: string
      kind?: string
      metadata?: {
        name?: string
        namespace?: string
      }
      spec?: Record<string, unknown>
    }
    deployStatuses?: unknown[]
    isDesign?: boolean
    parent?: {
      parentId: string
      parentName: string
      parentType: string
    }
    clustersNames?: string[]
    searchClusters?: unknown[]
    namespaceModel?: Record<string, ResourceItem[]>
    clusterroleModel?: Record<string, ResourceItem[]>
    policyModel?: Record<string, ResourceItem[]>
    pulse?: string
    shapeType?: string
    appClusters?: string[]
    targetNamespaces?: Record<string, string[]>
    clusters?: unknown[]
    subscriptionModel?: Record<string, SubscriptionItem[]>
    daemonsetModel?: Record<string, ResourceItem>
  }
}

// Test placement node structure
export interface TestPlacementNode extends TestTopologyNode {
  type: 'placements'
}

// Test resource item for search clusters
export interface TestResourceItem extends ResourceItem {
  name: string
  consoleURL?: string
  HubAcceptedManagedCluster?: string
  ManagedClusterConditionAvailable?: string
  kind?: string
  label?: string
  cluster?: string
  namespace?: string
  status?: string
  _clusterNamespace?: string
  _rbac?: string
  _uid?: string
}

// Test search clusters structure
export interface TestSearchClusters {
  items: TestResourceItem[]
}

// Additional test-specific types for diagram-helpers.test.ts

// Basic test node structure used in diagram helper tests
export interface TestNode extends Record<string, unknown> {
  specs: {
    raw: {
      metadata: {
        name: string
        namespace: string
        [key: string]: unknown
      }
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

// Test property data structure for property list tests
export interface TestPropertyData {
  labelValue: string
  value: string
}

// Test route node structure for route-related tests
export interface TestRouteNode extends Record<string, unknown> {
  type: 'route'
  name: string
  namespace: string
  id: string
  clusters?: {
    specs?: {
      clusters?: Array<{
        metadata: {
          name: string
        }
        clusterip?: string
        consoleURL?: string
      }>
    }
  }
  specs: {
    routeModel?: Record<
      string,
      Array<{
        namespace: string
        cluster: string
        kind?: string
      }>
    >
    searchClusters?: Array<{
      consoleURL: string
      metadata: {
        name: string
      }
    }>
    raw?: {
      kind: string
      metadata?: {
        namespace: string
      }
      spec?: {
        metadata?: {
          namespace: string
        }
        tls?: Record<string, unknown>
        host?: string
        rules?: Array<{
          route?: string
          [key: string]: unknown
        }>
      }
    }
    template?: {
      template: {
        kind: string
        spec: {
          metadata?: {
            namespace: string
          }
          tls?: Record<string, unknown>
          host?: string
        }
      }
    }
  }
}

// Test ingress node structure for ingress-related tests
export interface TestIngressNode {
  type: 'ingress' | string
  name: string
  namespace: string
  id: string
  specs: {
    raw: {
      kind: string
      metadata?: {
        namespace: string
      }
      spec?: {
        metadata?: {
          namespace: string
        }
        rules?: Array<{
          host: string
          http: {
            paths: Array<{
              backend: {
                serviceName: string
                servicePort: string
              }
            }>
          }
        }>
        host?: string
      }
    }
  }
}

// Test service node structure for service-related tests
export interface TestServiceNode {
  type: 'service'
  name: string
  namespace: string
  id: string
  specs: {
    serviceModel?: Record<
      string,
      Array<{
        namespace: string
        clusterIP: string
        port: string
      }>
    >
    raw: {
      metadata: {
        namespace: string
        name: string
      }
      kind: string
      spec: {
        tls?: Record<string, unknown>
        host?: string
      }
    }
  }
}

// Test subscription node structure for subscription-related tests
export interface TestSubscriptionNode extends Record<string, unknown> {
  name: string
  namespace: string
  type: 'subscription'
  id: string
  uid: string
  specs: {
    title: string
    isDesign: boolean
    hasRules: boolean
    isPlaced: boolean
    raw: {
      apiVersion: string
      kind: string
      metadata: {
        annotations?: Record<string, string>
        creationTimestamp: string
        generation: number
        labels?: Record<string, string>
        name: string
        namespace: string
        resourceVersion: string
        uid: string
      }
      spec: {
        channel: string
        name: string
        packageOverrides?: Array<{
          packageAlias: string
          packageName: string
        }>
        placement?: {
          placementRef?: {
            kind: string
            name: string
          }
        }
      }
      status?: {
        lastUpdateTime: string
        message: string
        phase: string
      }
      posthooks?: unknown[]
      prehooks?: unknown[]
      channels?: unknown[]
      decisions?: unknown[]
      placements?: unknown[]
      report?: unknown
    }
    clustersNames: string[]
    searchClusters: unknown[]
    subscriptionModel: Record<string, unknown>
    pulse: string
    shapeType: string
  }
  report?: unknown
}

// Test resource action link structure
export interface TestResourceActionLink {
  action: string
  kind?: string
  name?: string
  namespace?: string
  cluster?: string
  editLink?: string
  targetLink?: string
  routeObject?: {
    id?: string
    cluster?: string
    _uid?: string
  }
}

// Test cluster object structure
export interface TestClusterObject {
  id?: string
  cluster: string
  clusterIP?: string
  created?: string
  kind?: string
  label?: string
  name?: string
  namespace?: string
  port?: string
  selfLink?: string
  type?: string
  _uid?: string
}

// Test route object structure
export interface TestRouteObject {
  id?: string
  cluster: string
  _uid?: string
}

// Test service object structure
export interface TestServiceObject {
  cluster: string
  clusterIP: string
  created: string
  kind: string
  label: string
  name: string
  namespace: string
  port: string
  selfLink: string
  type: string
}

// Test generic link structure
export interface TestGenericLink {
  action: string
  targetLink?: string
  targetLink1?: string
}

// Test Argo link structure
export interface TestArgoLink {
  action: 'open_argo_editor'
  name: string
  namespace: string
  cluster: string
}

// Test route link structure
export interface TestRouteLink {
  action: 'open_route_url'
  name: string
  namespace: string
  cluster: string
}

// Test edit link node structure
export interface TestEditLinkNode extends Record<string, unknown> {
  name?: string
  namespace?: string
  kind?: string
  apigroup?: string
  apiversion?: string
  cluster?: string
}

// ArgoAppDetailsContainer component types

// Argo application data structure
export interface ArgoApp {
  name: string
  cluster: string
  namespace: string
  destinationName: string
  destinationNamespace: string
  healthStatus: ArgoHealthStatus | string
  [key: string]: unknown
}

// Container data for ArgoAppDetailsContainer state management
export interface ArgoAppDetailsContainerData {
  selected?: string
  page: number
  startIdx: number
  argoAppSearchToggle: boolean
  expandSectionToggleMap: Set<number>
  selectedArgoAppList: ArgoApp[]
  isLoading?: boolean
}

// Control interface for ArgoAppDetailsContainer
export interface ArgoAppDetailsContainerControl {
  argoAppDetailsContainerData: ArgoAppDetailsContainerData
  handleArgoAppDetailsContainerUpdate: (data: Partial<ArgoAppDetailsContainerData>) => void
  handleErrorMsg?: (error: string) => void
}

// Props for ArgoAppDetailsContainer component
export interface ArgoAppDetailsContainerProps {
  argoAppDetailsContainerControl: ArgoAppDetailsContainerControl
  argoAppList: ArgoApp[]
  t: TranslationFunction
  hubClusterName?: string
}

// State for ArgoAppDetailsContainer component
export interface ArgoAppDetailsContainerState {
  argoAppList: ArgoApp[]
  t: TranslationFunction
  selected?: string
  page: number
  perPage: number
  startIdx: number
  argoAppSearchToggle: boolean
  expandSectionToggleMap: Set<number>
  selectedArgoAppList: ArgoApp[]
  isLoading: boolean
}

// Status icon types for Argo applications
export type ArgoStatusIcon = 'checkmark' | 'failure' | 'warning' | 'pending'

// Resource action for Argo editor or YAML view
export interface ArgoResourceAction extends ResourceAction {
  action: 'open_argo_editor' | 'show_resource_yaml'
  cluster?: string
  namespace?: string
  name?: string
  editLink?: string
}

// LegendView component types

// Status type for legend status descriptions
export type LegendStatusType = 'success' | 'pending' | 'warning' | 'failure'

// Channel control interfaces for ChannelControl component
export interface ChannelControlData {
  allChannels: string[]
  activeChannel: string
  setActiveChannel: (channel: string) => void
}

export interface ChannelItem {
  chnl: string
  splitChn: RegExpExecArray
  subchannels: SubChannelItem[]
}

export interface SubChannelItem {
  chnl: string
  beg: string
  end: string
  text: string
}

export interface DisplayChannel {
  id: string
  text: string
  chn: string
  subchannels: SubChannelItem[]
}

export interface ChannelControlProps {
  channelControl: ChannelControlData
  t: (key: string, params?: (string | number)[]) => string
  setDrawerContent: (
    action: string,
    arg1: boolean,
    arg2: boolean,
    arg3: boolean,
    arg4: boolean,
    arg5: unknown,
    arg6: boolean
  ) => void
}

export interface ChannelControlState {
  currentChannel: DisplayChannel | SubChannelItem | Record<string, never>
  fetchChannel?: string
}

export interface SelectedSubscriptionData {
  selectedSubscription: DisplayChannel | null
  selectedPageForCurrentSubs: number
}

// Props interface for LegendView component
export interface LegendViewProps {
  /** Translation function for internationalization */
  t: TranslationFunction
}

// ClusterDetailsContainer component types

// Cluster data structure with capacity and allocatable resources
export interface ClusterData {
  name?: string
  namespace?: string
  status?: ClusterStatus | string
  creationTimestamp?: string
  cpu?: string | number
  memory?: string | number
  consoleURL?: string
  metadata?: {
    name: string
    namespace?: string
    creationTimestamp?: string
    [key: string]: unknown
  }
  capacity?: {
    cpu?: string
    memory?: string
    [key: string]: unknown
  }
  allocatable?: {
    cpu?: string
    memory?: string
    [key: string]: unknown
  }
  _clusterNamespace?: string
  HubAcceptedManagedCluster?: boolean
  ManagedClusterJoined?: boolean
  ManagedClusterConditionAvailable?: string
  [key: string]: unknown
}

// Container data for ClusterDetailsContainer state management
export interface ClusterDetailsContainerData {
  clusterID: string
  selected?: string
  page: number
  startIdx: number
  clusterSearchToggle: boolean
  expandSectionToggleMap: Set<number>
  selectedClusterList: ClusterData[]
}

// Control interface for ClusterDetailsContainer
export interface ClusterDetailsContainerControl {
  clusterDetailsContainerData: ClusterDetailsContainerData
  handleClusterDetailsContainerUpdate: (
    data:
      | Partial<ClusterDetailsContainerData>
      | {
          page: number
          startIdx: number
          clusterSearchToggle: boolean
          expandSectionToggleMap: Set<number>
          clusterID: string
          selected?: string
          selectedClusterList: ClusterData[]
        }
  ) => void
}

// Props for ClusterDetailsContainer component
export interface ClusterDetailsContainerProps {
  clusterDetailsContainerControl: ClusterDetailsContainerControl
  clusterID: string
  clusterList: ClusterData[]
  t: TranslationFunction
}

// State for ClusterDetailsContainer component
export interface ClusterDetailsContainerState {
  clusterList: ClusterData[]
  t: TranslationFunction
  selected?: string
  page: number
  perPage: number
  startIdx: number
  clusterSearchToggle: boolean
  expandSectionToggleMap: Set<number>
  clusterID?: string
  selectedClusterList: ClusterData[]
}

// Status icon types for cluster status visualization
export type ClusterStatusIcon = 'checkmark' | 'failure' | 'warning' | 'pending'

// DetailsTable component types

// Page size configuration for table pagination
export interface PageSizes {
  DEFAULT: number
  VALUES: number[]
}

// Column definition for table headers
export interface TableColumn {
  name: string
  id: string
  width: string
}

// Table data structure for column configuration (alias for TableColumn)
export type TableData = TableColumn

// Sort configuration for table sorting
export interface SortBy {
  index?: number
  sortIndex?: number
  direction?: 'asc' | 'desc'
}

// Resource item displayed in the details table
export interface DetailsTableResourceItem {
  pulse: PulseColor | undefined
  name: string
  namespace?: string
  cluster: string
  type: string
}

// Table row structure after processing
export interface DetailsTableRow {
  id: string
  cells: (React.ReactNode | string)[]
}

// Column header structure for PatternFly table
export interface TableColumnHeader {
  title: string
  columnTransforms?: Array<() => { style: { width: string } }>
  transforms?: unknown[]
  key?: string
}

// Node specs structure used by DetailsTable
export interface DetailsTableNodeSpecs {
  resources?: Array<{
    name: string
    namespace?: string
    cluster?: string
  }>
  clustersNames?: string[]
  replicaCount?: number
  [key: string]: unknown // Allow for dynamic model properties like subscriptionModel, podModel, etc.
}

// Node structure expected by DetailsTable component
export interface DetailsTableNode {
  name: string
  namespace: string
  type: string
  specs: DetailsTableNodeSpecs
}

// Props interface for DetailsTable component
export interface DetailsTableProps {
  /** Function to handle opening resource details */
  handleOpen?: (node: DetailsTableNode, item: DetailsTableResourceItem) => void
  /** Unique identifier for the table instance */
  id: string
  /** Node data containing resources and specifications */
  node: DetailsTableNode
  /** Translation function for internationalization */
  t: TranslationFunction
}

// State interface for DetailsTable component
export interface DetailsTableState {
  /** Current page number for pagination */
  page: number
  /** Number of items per page */
  perPage: number
  /** Current sort configuration */
  sortBy: SortBy
  /** Search filter value */
  searchValue: string
  /** Type of detail being displayed (for state reset detection) */
  detailType: string
  /** Processed table data configuration */
  tableData?: TableData[]
  /** Column configuration for table headers */
  columns?: Array<{ key: string }>
  /** Processed and filtered table rows */
  rows?: DetailsTableRow[]
}

// DetailsView component types

// Shape and class name mapping for node visualization
export interface TypeToShapeMap {
  [resourceType: string]: {
    shape?: string
    className?: string
  }
}

// Options configuration for DetailsView component
export interface DetailsViewOptions {
  typeToShapeMap: TypeToShapeMap
  getNodeDetails: (
    node: TopologyNodeWithStatus,
    activeFilters: ActiveFilters,
    t: TranslationFunction,
    hubClusterName?: string
  ) => DetailItem[]
}

// Props for DetailsViewDecorator component
export interface DetailsViewDecoratorProps {
  /** CSS class name for styling the decorator icon */
  className?: string
  /** Shape identifier for the node icon */
  shape?: string
}

// Detail item with specific types for rendering different content
export interface DetailItemExtended extends DetailItem {
  type?: 'label' | 'spacer' | 'link' | 'snippet' | 'clusterdetailcombobox' | 'relatedargoappdetails'
  /** Snippet value for YAML display */
  value?: unknown
  /** Indentation flag for nested content */
  indent?: boolean
  /** Status icon type for visual indicators */
  status?: StatusType
  /** Combo box data for cluster selection */
  comboboxdata?: {
    clusterList: ClusterData[]
    sortedClusterNames: string[]
    searchClusters: ClusterData[]
    clusterID: string
  }
  /** Related Argo application data */
  relatedargoappsdata?: {
    argoAppList: ArgoApp[]
  }
}

// Link value structure for action links
export interface LinkValue {
  id: string
  labelValue?: string
  label?: string
  data: ResourceAction
}

// Props interface for DetailsView component
export interface DetailsViewProps {
  /** Active filters for resource status filtering */
  activeFilters: ActiveFilters
  /** Control interface for Argo application details container */
  argoAppDetailsContainerControl: ArgoAppDetailsContainerControl
  /** Control interface for cluster details container */
  clusterDetailsContainerControl: ClusterDetailsContainerControl
  /** Function to get layout nodes for topology */
  getLayoutNodes: () => TopologyNodeWithStatus[]
  /** Translation function for internationalization */
  t: TranslationFunction
  /** Array of topology nodes */
  nodes: TopologyNodeWithStatus[]
  /** Function called when closing the details view */
  onClose?: () => void
  /** Function to process action links (navigation, external links, etc.) */
  processActionLink: (data: ResourceAction, toggleLoading: () => void, arg3?: unknown, hubClusterName?: string) => void
  /** ID of the currently selected node */
  selectedNodeId: string
  /** Configuration options for the details view */
  options: DetailsViewOptions
  /** Active tab key for tab navigation */
  activeTabKey: number
  /** Hub cluster name for multi-cluster scenarios */
  hubClusterName?: string
}

// State interface for DetailsView component
export interface DetailsViewState {
  /** Loading state for action links */
  isLoading: boolean
  /** ID of the currently loading link */
  linkID: string
  /** Currently active tab key */
  activeTabKey: number
  /** Filtered node when viewing specific resource details */
  filteredNode?: TopologyNodeWithStatus
}

// Test-specific types for ChannelController.test.ts

// Mock channel control data structure for testing
export interface MockChannelControlData {
  /** Currently active channel identifier */
  activeChannel: string
  /** Flag indicating if channel is currently being changed */
  isChangingChannel?: boolean
  /** Mock function for changing the active channel */
  changeTheChannel: jest.Mock
  /** Array of all available channel strings */
  allChannels: string[]
}

// Mock translation function type for testing
export type MockTranslationFunction = (key: string) => string

// Mock drawer content setter function type for testing
export type MockSetDrawerContent = jest.Mock
