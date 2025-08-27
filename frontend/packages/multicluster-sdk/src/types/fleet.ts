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

export type FleetWatchK8sResource = Fleet<WatchK8sResource>
export type FleetK8sResourceCommon = Fleet<K8sResourceCommon>
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
