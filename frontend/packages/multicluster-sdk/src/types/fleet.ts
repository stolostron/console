/* Copyright Contributors to the Open Cluster Management project */
import {
  K8sResourceCommon,
  ResourceLinkProps,
  WatchK8sResource,
  WatchK8sResult,
} from '@openshift-console/dynamic-plugin-sdk'

export type Fleet<T> = T & { cluster?: string }

export type FleetWatchK8sResource = Fleet<WatchK8sResource>
export type FleetK8sResourceCommon = Fleet<K8sResourceCommon>

export type UseHubClusterName = () => [hubClusterName: string | undefined, loaded: boolean, error: any]
export type UseFleetK8sAPIPath = (
  cluster?: string
) => [k8sAPIPath: string | undefined, loaded: boolean, error: Error | undefined]
export type FleetResourceLinkProps = Fleet<ResourceLinkProps>
export type UseFleetK8sWatchResource = <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  initResource: FleetWatchK8sResource | null
) => WatchK8sResult<R> | [undefined, boolean, any]
export type UseFleetClusterNames = () => [string[], boolean, any]
