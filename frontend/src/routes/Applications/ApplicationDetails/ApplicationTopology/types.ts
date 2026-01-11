import { Dispatch, SetStateAction } from 'react'
import {
  AnsibleJob,
  Application,
  ArgoApplication,
  Channel,
  Metadata,
  Placement,
  PlacementDecision,
  PlacementRule,
  SubscriptionReport,
  Subscription,
} from '../../../../resources'
import { TFunction } from 'react-i18next'
import { ArgoAppDetailsContainerData, ClusterDetailsContainerData } from './ApplicationTopology'

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
export type NodeLike = Record<string, any>

// Describes optional URL search parameters supported by Argo helpers
export interface URLSearchData {
  apiVersion?: string
  cluster?: string
}

// Generic resource item returned by search/model collections
export type ResourceItem = Record<string, any>

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
  name?: string
  namespace?: string
  kubeApiServer?: string
  status?: string
  creationTimestamp?: string
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
  channels?: SetStateAction<string[]>
  activeChannel?: SetStateAction<string | undefined>
  name: string
  namespace: string
  app: any
  metadata?: Metadata
  placement?: PlacementDecision | Placement
  isArgoApp: boolean
  isAppSet: boolean
  isOCPApp: boolean
  isFluxApp: boolean
  isAppSetPullModel: boolean
  relatedPlacement?: Placement
  clusterList?: string[]
  appSetApps?: AppSetApplication[]
  appSetClusters?: AppSetCluster[]
  appStatusByNameMap?: Record<string, { health: { status: string }; sync: { status: string } }>
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
export interface AnsibleJobModel extends AnsibleJob {
  hookType?: string
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
  placements?: Array<Placement | PlacementRule>
  deployablePaths?: string[]
  isChucked?: boolean
  rules?: unknown[]
  [key: string]: unknown
}

// Model used by subscription application view
export interface SubscriptionApplicationModel extends ApplicationModel {
  channels: string[]
  subscriptions: SubscriptionKind[]
  allSubscriptions: SubscriptionKind[]
  allChannels: ChannelKind[]
  allClusters: string[]
  reports: Array<SubscriptionReport>
  [key: string]: unknown
}

// Maps and entries used by subscription model helpers
export interface SubscriptionHookMapEntry {
  deployableName: string
  subscription: SubscriptionKind
}

export type SubscriptionHooksMap = Record<string, SubscriptionHookMapEntry[]>

export interface SubscriptionDecisionMapEntry {
  ruleName: string
  subscription: SubscriptionKind
}

export type SubscriptionDecisionsMap = Record<string, SubscriptionDecisionMapEntry[]>

export interface SubscriptionChannelMapEntry {
  chnName: string
  subscription: SubscriptionKind
}

export type SubscriptionChannelsMap = Record<string, SubscriptionChannelMapEntry[]>

export type SubscriptionPlacementsMap = Record<string, SubscriptionDecisionMapEntry[]>

// Extend RecoilStates with optional resources used by subscription model helpers

// Minimal shape for global recoil-backed resource state consumed by model helpers
export interface RecoilStates {
  applications: Application[]
  placementDecisions?: PlacementDecision[]
  placements: Placement[]
  ansibleJob: AnsibleJob[]
  subscriptions?: Subscription[]
  channels?: Channel[]
  placementRules?: PlacementRule[]
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
  id?: string
  uid?: string
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
  name?: string
  namespace?: string
  status?: ClusterStatus
  metadata?: {
    name: string
    [key: string]: unknown
  }
  _clusterNamespace?: string
  HubAcceptedManagedCluster?: string
  ManagedClusterJoined?: string
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
  searchClusters?: ClusterInfo[] | string[]
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
  value?: any
  status?: StatusType
  indent?: boolean
  data?: ResourceAction
  comboboxdata?: {
    clusterList: ClusterData[]
    sortedClusterNames?: string[]
    searchClusters?: ClusterData[]
    clusterID?: string
  }
  relatedargoappsdata?: {
    argoAppList: ArgoApp[]
  }
}

// Window status array for subscription time windows
export type WindowStatusArray = string[]

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

// Control interface for ArgoAppDetailsContainer
export interface ArgoAppDetailsContainerControl {
  argoAppDetailsContainerData: ArgoAppDetailsContainerData
  handleArgoAppDetailsContainerUpdate: React.Dispatch<React.SetStateAction<ArgoAppDetailsContainerData>>
  handleErrorMsg: () => void
}

// Props for ArgoAppDetailsContainer component
export interface ArgoAppDetailsContainerProps {
  argoAppDetailsContainerControl: ArgoAppDetailsContainerControl
  argoAppList: ArgoApp[]
  t: TFunction
  hubClusterName?: string
}

// State for ArgoAppDetailsContainer component
export interface ArgoAppDetailsContainerState {
  argoAppList: ArgoApp[]
  t: TFunction
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
  channelControl?: ChannelControlData
  t: TFunction
  setDrawerContent?: (
    title: string,
    isInline: boolean,
    isResizable: boolean,
    disableDrawerHead: boolean,
    drawerPanelBodyHasNoPadding: boolean,
    panelContent: React.ReactNode | React.ReactNode[],
    closeDrawer: boolean
  ) => void
}
export interface ChannelControlData {
  allChannels: string[]
  activeChannel?: string
  setActiveChannel?: (channel: string) => void
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
  t: TFunction
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
  HubAcceptedManagedCluster?: string
  ManagedClusterJoined?: string
  ManagedClusterConditionAvailable?: string
  [key: string]: unknown
}

// Control interface for ClusterDetailsContainer
export interface ClusterDetailsContainerControl {
  clusterDetailsContainerData: ClusterDetailsContainerData
  handleClusterDetailsContainerUpdate: Dispatch<SetStateAction<ClusterDetailsContainerData>>
}

// Props for ClusterDetailsContainer component
export interface ClusterDetailsContainerProps {
  clusterDetailsContainerControl: ClusterDetailsContainerControl
  clusterID: string
  clusterList: ClusterData[]
  t: TFunction
}

// State for ClusterDetailsContainer component
export interface ClusterDetailsContainerState {
  clusterList: ClusterData[]
  t: TFunction
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
export type DetailsTableNodeSpecsStatusMap = Record<
  string,
  Array<{ pulse: PulseColor; name: string; namespace: string }>
>

// Node structure expected by DetailsTable component
export interface DetailsTableNode {
  name: string
  namespace: string
  type: string
  id: string
  uid: string
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
  t: TFunction
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
    t: TFunction,
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
  value?: any
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
  argoAppDetailsContainerControl: {
    argoAppDetailsContainerData: ArgoAppDetailsContainerData
    handleArgoAppDetailsContainerUpdate: React.Dispatch<React.SetStateAction<ArgoAppDetailsContainerData>>
    handleErrorMsg: () => void
  }
  /** Control interface for cluster details container */
  clusterDetailsContainerControl: {
    clusterDetailsContainerData: ClusterDetailsContainerData
    handleClusterDetailsContainerUpdate: React.Dispatch<React.SetStateAction<ClusterDetailsContainerData>>
  }
  /** Function to get layout nodes for topology */
  getLayoutNodes: () => TopologyNodeWithStatus[]
  /** Translation function for internationalization */
  t: TFunction
  /** Array of topology nodes */
  nodes: TopologyNodeWithStatus[]
  /** Function called when closing the details view */
  onClose?: () => void
  /** Function to process action links (navigation, external links, etc.) */
  processActionLink?: (resource: any, toggleLoading: () => void, hubClusterName: string) => void
  /** ID of the currently selected node */
  selectedNodeId: string
  nodeDetailsProvider?: (node: any, activeFilters: Record<string, any>, t: TFunction, hubClusterName: string) => any
  /** Active tab key for tab navigation */
  activeTabKey?: number
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

// Types for resourceStatuses functionality

// Result structure returned by resource status functions
export interface ResourceStatusResult {
  /** Resource statuses data from search or processing */
  resourceStatuses: unknown
  /** Related resources mapping (optional, used by subscription resources) */
  relatedResources?: RelatedResourcesMap
}

// Parameters for getResourceStatuses function
export interface GetResourceStatussParams {
  /** Application model containing metadata and configuration */
  application: ApplicationModel
  /** Application data with search queries and related information */
  appData: Record<string, unknown>
  /** Topology data structure (optional, used by Argo and subscription apps) */
  topology?: ExtendedTopology
}

// Return type for getResourceStatuses function
export interface GetResourceStatussResult {
  /** Processed resource statuses data */
  resourceStatuses: any
  /** Related resources mapping */
  relatedResources: RelatedResourcesMap
  /** Application data with computed statuses */
  appDataWithStatuses: Record<string, any>
}

// Types for resourceStatusesAppSet functionality

// Argo application specification for ApplicationSet apps
export interface ArgoAppSpec {
  /** Destination configuration for the Argo application */
  destination: {
    /** Target namespace for deployment */
    namespace?: string
    /** Target cluster for deployment */
    cluster?: string
    /** Server URL for the target cluster */
    server?: string
  }
  /** Source configuration for the Argo application */
  source?: {
    /** Git repository URL */
    repoURL?: string
    /** Path within the repository */
    path?: string
    /** Target revision (branch, tag, or commit) */
    targetRevision?: string
    /** Helm chart configuration */
    chart?: string
  }
  /** Project name for the Argo application */
  project?: string
}

// Argo application status for ApplicationSet apps
export interface ArgoAppStatus {
  /** Resources deployed by this Argo application */
  resources?: ArgoAppResource[]
  /** Health status of the application */
  health?: {
    /** Health status value */
    status?: ArgoHealthStatus
    /** Health status message */
    message?: string
  }
  /** Sync status of the application */
  sync?: {
    /** Sync status value */
    status?: string
    /** Sync revision */
    revision?: string
  }
}

// Individual resource deployed by an Argo application
export interface ArgoAppResource extends Record<string, unknown> {
  /** Resource name */
  name: string
  /** Resource namespace (optional for cluster-scoped resources) */
  namespace?: string
  /** Kubernetes resource kind */
  kind: string
  /** API version */
  version?: string
  /** API group */
  group?: string
  /** Resource status */
  status?: string
  /** Health status */
  health?: {
    status?: string
    message?: string
  }
}

// ApplicationSet application structure
export interface AppSetApplication {
  /** Application metadata */
  metadata?: {
    /** Application name */
    name?: string
    /** Application namespace */
    namespace?: string
    /** Application labels */
    labels?: Record<string, string>
    /** Application annotations */
    annotations?: Record<string, string>
    generation?: number
  }
  /** Application specification */
  spec: ArgoAppSpec
  /** Application status */
  status?: ArgoAppStatus
}

// ApplicationSet cluster information
export interface AppSetClusterInfo {
  /** Cluster name */
  name: string
  /** Cluster namespace (for managed clusters) */
  namespace?: string
  /** Cluster server URL */
  server?: string
  /** Cluster status */
  status?: string
  /** Cluster creation timestamp */
  created?: string
  /** Cluster creation timestamp (alternative field name) */
  creationTimestamp?: string
}

// Application model for ApplicationSet applications
export interface AppSetApplicationModel {
  /** Application name */
  name: string
  /** Application namespace */
  namespace: string
  /** ApplicationSet applications */
  appSetApps: AppSetApplication[]
  /** ApplicationSet clusters */
  appSetClusters: AppSetClusterInfo[]
}

// Application data structure used for search queries
export interface AppSetApplicationData {
  /** Related Kubernetes resource kinds to search for */
  relatedKinds?: string[]
  /** Target namespaces for resource deployment */
  targetNamespaces?: string[]
  /** Argo secrets for authentication */
  argoSecrets?: ResourceItem[]
  /** ApplicationSet name (for ApplicationSet applications) */
  applicationSet?: string
  /** Cluster name */
  cluster?: string
}

// Search query result for ApplicationSet resource statuses
export interface AppSetResourceStatusResult {
  /** Resource statuses from search query */
  resourceStatuses: unknown
}

// Types for resourceStatusesArgo functionality

// Argo source information for application queries
export interface ArgoSource {
  /** Search result data containing Argo applications */
  data: {
    searchResult: Array<{
      /** Array of search result items */
      items?: ResourceItem[]
    }>
  }
}

// Application data structure used by Argo resource status functions
export interface ArgoApplicationData {
  /** ApplicationSet name (if this is an ApplicationSet application) */
  applicationSet?: string
  /** Cluster name where the application is deployed */
  cluster?: string
  /** Source configuration for the Argo application */
  source?: {
    /** Git repository URL */
    repoURL?: string
    /** Path within the repository */
    path?: string
    /** Helm chart name */
    chart?: string
    /** Target revision (branch, tag, or commit) */
    targetRevision?: string
  }
  /** Related Kubernetes resource kinds */
  relatedKinds?: string[]
  /** Target namespaces for deployment */
  targetNamespaces?: string[]
  /** Cluster information array */
  clusterInfo?: string[]
  /** Argo secrets for cluster authentication */
  argoSecrets?: ResourceItem[]
}

// Argo application resource structure from status.resources
export interface ArgoApplicationResource extends Record<string, unknown> {
  /** Resource name */
  name: string
  /** Resource namespace (optional for cluster-scoped resources) */
  namespace?: string
  /** Kubernetes resource kind */
  kind: string
  /** API version */
  version?: string
  /** API group */
  group?: string
}

// Argo application structure with metadata and status
export interface ArgoApplicationItem extends ResourceItem {
  /** Application name */
  name?: string
  /** Application namespace */
  namespace?: string
  /** Application cluster */
  cluster?: string
  /** Destination namespace for deployment */
  destinationNamespace?: string
  /** Destination server URL */
  destinationServer?: string
  /** Destination cluster name */
  destinationName?: string
  /** Destination cluster (computed field) */
  destinationCluster?: string
  /** ApplicationSet name (if part of an ApplicationSet) */
  applicationSet?: string
  /** Application status */
  status?: {
    /** Resources deployed by this application */
    resources?: ArgoApplicationResource[]
  }
}

// Search query variables structure for GraphQL queries
export interface SearchQueryVariables {
  /** Array of search input queries */
  input: SearchQuery[]
  /** Maximum number of results to return */
  limit: number
}

// Search query options for Apollo Client
export interface SearchQueryOptions {
  /** GraphQL query document */
  query: unknown
  /** Query variables */
  variables: SearchQueryVariables
  /** Fetch policy for caching */
  fetchPolicy: 'network-only' | 'cache-first' | 'cache-only' | 'no-cache' | 'standby'
}

// Result structure returned by Argo resource status functions
export interface ArgoResourceStatusResult {
  /** Resource statuses data from search query */
  resourceStatuses: unknown
}

// Types for resourceStatusesSubscription functionality

/**
 * Application data structure used to build search queries for subscription resources
 */
export interface SubscriptionApplicationData {
  /** Selected subscription name for filtering resources */
  subscription?: string
  /** Array of related Kubernetes resource kinds to include in search */
  relatedKinds?: string[]
}

// Types for topologyArgo functionality

/**
 * Argo application destination configuration
 */
export interface ArgoDestination {
  /** Target cluster name or server URL */
  name?: string
  /** Target cluster server URL */
  server?: string
  /** Target namespace for deployment */
  namespace?: string
}

/**
 * Argo application data structure passed to topology functions
 */
export interface ArgoApplicationTopologyData {
  /** Application name */
  name: string
  /** Application namespace */
  namespace: string
  /** Raw Argo application object */
  app: {
    /** Application metadata */
    metadata?: {
      name?: string
      namespace?: string
      [key: string]: unknown
    }
    /** Application specification */
    spec?: {
      /** Destination configuration */
      destination?: ArgoDestination
      /** Source configuration */
      source?: {
        /** Repository path */
        path?: string
        [key: string]: unknown
      }
      [key: string]: unknown
    }
    /** Application status */
    status?: {
      /** Resources deployed by this application */
      resources?: ArgoApplicationResource[]
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  /** Active channel information */
  activeChannel?: string
  /** Available channels */
  channels?: unknown[]
}

/**
 * Argo topology data structure containing topology and cluster information
 */
export interface ArgoTopologyData {
  /** Optional topology data from backend */
  topology?: Topology
  /** Cluster name where the Argo application is defined */
  cluster?: string
}

/**
 * Result structure returned by getArgoTopology function
 */
export interface ArgoTopologyResult {
  /** Array of topology nodes */
  nodes: TopologyNode[]
  /** Array of topology links */
  links: TopologyLink[]
}

/**
 * Cluster information with destination details for Argo applications
 */
export interface ArgoClusterInfo extends ManagedCluster {
  /** Remote cluster destination URL (for apps defined on remote clusters) */
  remoteClusterDestination?: string
  /** Destination configuration */
  destination?: ArgoDestination
}

// Types for topologyAppSet functionality

/**
 * Route object structure from OpenShift Route resources
 */
export interface RouteObject {
  /** Route metadata */
  metadata?: {
    name?: string
    namespace?: string
    labels?: Record<string, string>
    [key: string]: unknown
  }
  /** Route specification */
  spec?: {
    /** Route hostname */
    host?: string
    /** TLS configuration */
    tls?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Parameters for opening Argo CD editor
 */
export interface OpenArgoCDEditorParams {
  /** Target cluster name */
  cluster: string
  /** Application namespace */
  namespace: string
  /** Application name */
  name: string
  /** Loading toggle function */
  toggleLoading: () => void
  /** Translation function */
  t: TFunction
  /** Hub cluster name */
  hubClusterName: string
}

/**
 * Parameters for opening route URLs
 */
export interface OpenRouteURLParams {
  /** Route object with metadata */
  routeObject: {
    name?: string
    namespace?: string
    cluster?: string
    kind?: string
    apigroup?: string
    apiversion?: string
  }
  /** Loading toggle function */
  toggleLoading: () => void
  /** Hub cluster name */
  hubClusterName: string
}

/**
 * Managed cluster view data structure for remote cluster operations
 */
export interface ManagedClusterViewData {
  /** Target cluster name */
  cluster: string
  /** Resource kind */
  kind: string
  /** API version */
  apiVersion: string
  /** Resource name */
  name: string
  /** Resource namespace */
  namespace: string
}

/**
 * Application resource from Argo Application status.resources
 */
export interface AppSetApplicationResource {
  /** Resource name */
  name: string
  /** Resource namespace */
  namespace?: string
  /** Resource kind */
  kind: string
  /** API version */
  version?: string
  /** API group */
  group?: string
  /** Target cluster name */
  cluster?: string
}

/**
 * Processed deployable resource with multiple instances
 */
export interface ProcessedDeployableResource {
  /** Resource name */
  name: string
  /** Resource namespace */
  namespace: string
  /** Resource kind */
  kind: string
  /** API version */
  version?: string
  /** API group */
  group?: string
  /** Number of resource instances */
  resourceCount?: number
  /** Array of individual resource instances */
  resources?: AppSetApplicationResource[]
}

/**
 * Application Set topology generation result
 */
export interface AppSetTopologyResult {
  /** Array of topology nodes */
  nodes: TopologyNode[]
  /** Array of topology links */
  links: TopologyLink[]
}

/**
 * Function parameters for getSubscriptionResourceStatuses
 */
export interface GetSubscriptionResourceStatusesParams {
  /** Application model containing name, namespace, and reports */
  application: ApplicationModel & {
    /** Array of resource reports from subscription deployments */
    reports?: ResourceReport[]
  }
  /** Optional application data for filtering and query customization */
  appData?: SubscriptionApplicationData
}

/**
 * Result structure returned by getSubscriptionResourceStatuses function
 */
export interface SubscriptionResourceStatusResult {
  /** Resource statuses data from search query */
  resourceStatuses: any
  /** Map of related resources keyed by resource identifier */
  relatedResources: RelatedResourcesMap
}

/**
 * Parameters for getQueryStringForResource function
 */
export interface QueryStringResourceParams {
  /** Resource type name (e.g., 'Subscription', 'Application') */
  resourcename: string
  /** Resource name to filter by */
  name: string
  /** Resource namespace to filter by */
  namespace: string
}

// Types for topologyOCPFluxApp functionality

/**
 * OCP/Flux application model containing metadata and cluster information
 */
export interface OCPFluxApplicationModel extends ApplicationModel {
  /** Flag indicating if this is an OCP application */
  isOCPApp: boolean
  /** Flag indicating if this is a Flux application */
  isFluxApp: boolean
  /** Application metadata and configuration */
  app: any
}

/**
 * Search result structure from GraphQL search queries
 */
export interface TopologySearchResult {
  /** GraphQL query response data */
  data?: {
    /** Array of search results */
    searchResult?: Array<{
      /** Array of resource items matching the search */
      items?: ResourceItem[]
      /** Array of related resource groups */
      related?: Array<{
        /** Resource kind */
        kind: string
        /** Array of related resource items */
        items?: ResourceItem[]
      }>
    }>
  }
}

/**
 * Processed resource from search results with aggregated information
 */
export interface ProcessedOCPFluxResource {
  /** Resource name */
  name: string
  /** Resource namespace */
  namespace: string
  /** Kubernetes resource kind */
  kind: string
  /** API version */
  apiversion?: string
  /** API group */
  apigroup?: string
  /** Array of individual resource instances */
  resources?: ResourceItem[]
  /** Total count of resource instances across clusters */
  resourceCount?: number
}

/**
 * Cluster summary information for OCP/Flux applications
 */
export interface OCPFluxClusterSummary {
  /** Whether the application is deployed locally on the hub cluster */
  isLocal: boolean
  /** Number of remote clusters where the application is deployed */
  remoteCount: number
}

/**
 * Extended topology result with raw search data for OCP/Flux applications
 */
export interface OCPFluxTopologyResult extends ExtendedTopology {
  /** Raw search data from GraphQL queries */
  rawSearchData?: TopologySearchResult
}

/**
 * Parameters for getOCPFluxAppTopology function
 */
export interface GetOCPFluxAppTopologyParams {
  /** OCP/Flux application model */
  application: OCPFluxApplicationModel
  /** Hub cluster name for local deployment detection */
  hubClusterName: string
}

/**
 * Parameters for getResourcesWithAppLabel function
 */
export interface GetResourcesWithAppLabelParams {
  /** Application name */
  name: string
  /** Application namespace */
  namespace: string
  /** Application configuration object */
  app: {
    /** Cluster information */
    cluster?: {
      /** Cluster name */
      name: string
    }
  }
  /** Flag indicating if this is an OCP application */
  isOCPApp: boolean
}

/**
 * Parameters for getQueryStringForLabel function
 */
export interface GetQueryStringForLabelParams {
  /** Label selector string for filtering resources */
  label: string
  /** Target namespace */
  namespace: string
  /** Target cluster name */
  cluster: string
}
