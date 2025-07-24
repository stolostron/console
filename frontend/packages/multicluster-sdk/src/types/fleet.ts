/* Copyright Contributors to the Open Cluster Management project */
import {
  AccessReviewResourceAttributes,
  K8sResourceCommon,
  ResourceLinkProps,
  WatchK8sResource,
  WatchK8sResult,
} from '@openshift-console/dynamic-plugin-sdk'

export type Fleet<T> = T & { cluster?: string }

export type FleetWatchK8sResource = Fleet<WatchK8sResource>
export type FleetK8sResourceCommon = Fleet<K8sResourceCommon>
export type FleetAccessReviewResourceAttributes = Fleet<AccessReviewResourceAttributes>

export type UseHubClusterName = () => [hubClusterName: string | undefined, loaded: boolean, error: any]
export type UseFleetK8sAPIPath = (
  cluster?: string
) => [k8sAPIPath: string | undefined, loaded: boolean, error: Error | undefined]
export type FleetResourceLinkProps = Fleet<ResourceLinkProps>
export type UseFleetK8sWatchResource = <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  initResource: FleetWatchK8sResource | null
) => WatchK8sResult<R> | [undefined, boolean, any]
export type UseFleetClusterNames = () => [string[], boolean, any]

/** Signature of the `useIsFleetAvailable` hook */
export type UseIsFleetAvailable = () => boolean

/**
 * Fleet configuration.
 *  @property {boolean} isGlobalHub Whether the hub cluster is the global hub.
 *  @property {string} localHubName The name of the local hub cluster.
 *  @property {boolean} isHubSelfManaged Whether the hub cluster is self-managed.
 *  @property {boolean} isObservabilityInstalled Whether the observability controller is installed.
 */
export type FleetConfiguration = {
  isGlobalHub: boolean
  localHubName: string
  isHubSelfManaged: boolean
  isObservabilityInstalled: boolean
}

/**
 * Signature of the `UseFleetConfiguration` hook.
 *
 * @returns A tuple containing the fleet configuration, a boolean indicating if the configuration is loaded, and an error if any.
 */
export type UseFleetConfiguration = () => [fleetConfiguration: FleetConfiguration | null, loaded: boolean, error: any]
