/* Copyright Contributors to the Open Cluster Management project */
import {
  AccessReviewResourceAttributes,
  K8sModel,
  K8sResourceCommon,
  Patch,
  QueryParams,
  ResourceLinkProps,
  WatchK8sResource,
} from '@openshift-console/dynamic-plugin-sdk'

export type Fleet<T> = T & { cluster?: string }
export type FleetK8sResourceCommon = Fleet<K8sResourceCommon>

export type FleetWatchK8sResource = Fleet<WatchK8sResource>
export type FleetWatchK8sResources<R extends FleetResourcesObject> = {
  [k in keyof R]: FleetWatchK8sResource
}
export type FleetWatchK8sResult<R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]> = [
  R | undefined,
  boolean,
  any,
]

export type FleetResourcesObject = { [key: string]: FleetK8sResourceCommon | FleetK8sResourceCommon[] }
export type FleetWatchK8sResultsObject<R extends K8sResourceCommon | K8sResourceCommon[]> = {
  data: R | undefined
  loaded: boolean
  loadError?: any
}

export type FleetWatchK8sResults<R extends FleetResourcesObject> = {
  [k in keyof R]: FleetWatchK8sResultsObject<R[k]>
}

export type FleetAccessReviewResourceAttributes = Fleet<AccessReviewResourceAttributes>

export type FleetResourceLinkProps = Fleet<ResourceLinkProps>
export type FleetResourceEventStreamProps = { resource: FleetK8sResourceCommon }

export type FleetK8sCreateUpdateOptions<R extends FleetK8sResourceCommon> = {
  model: K8sModel
  name?: string
  ns?: string
  path?: string
  cluster?: string
  queryParams?: QueryParams
  data: R
}

export type FleetK8sGetOptions = {
  model: K8sModel
  name?: string
  ns?: string
  path?: string
  cluster?: string
  queryParams?: QueryParams
  requestInit?: RequestInit
}

export type FleetK8sPatchOptions<R extends FleetK8sResourceCommon> = {
  model: K8sModel
  name?: string
  ns?: string
  path?: string
  cluster?: string
  queryParams?: QueryParams
  resource: R
  data: Patch[]
}

export type FleetK8sDeleteOptions<R extends FleetK8sResourceCommon> = {
  model: K8sModel
  name?: string
  ns?: string
  path?: string
  cluster?: string
  queryParams?: QueryParams
  resource: R
  requestInit?: RequestInit
  json?: Record<string, any>
}

export type FleetK8sListOptions = {
  model: K8sModel
  queryParams: { [key: string]: any }
  requestInit?: RequestInit
}

/**
 * Structured data containing cluster names organized by cluster sets.
 *
 * Clusters without an explicit cluster set label are automatically assigned to the "default" cluster set.
 * The "global" key is a special set that contains all clusters (when includeGlobal is true).
 */
export type ClusterSetData = Record<string, string[]>

/**
 * Options for advanced cluster name retrieval with cluster set organization.
 */
export type FleetClusterNamesOptions = {
  /** Whether to return all clusters regardless of availability status. Defaults to false. */
  returnAllClusters?: boolean
  /** Specific cluster set names to include. If not specified, includes all cluster sets including "default". Should not include "global" - use includeGlobal instead. */
  clusterSets?: string[]
  /** Whether to include a special "global" set containing all clusters. Defaults to false. */
  includeGlobal?: boolean
}
