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
