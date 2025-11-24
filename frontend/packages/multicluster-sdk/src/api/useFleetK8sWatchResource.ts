/* Copyright Contributors to the Open Cluster Management project */
import { useHubClusterName } from './useHubClusterName'
import {
  FleetK8sResourceCommon,
  FleetWatchK8sResource,
  FleetWatchK8sResult,
  FleetWatchK8sResultsObject,
} from '../types'
import { useK8sModel, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useEffect, useMemo, useState } from 'react'
import { useDeepCompareMemoize } from '../internal/hooks/useDeepCompareMemoize'
import { NO_FLEET_AVAILABLE_ERROR } from '../internal/constants'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { getInitialResult, startWatch, stopWatch } from '../internal/fleetK8sWatchResource'

/**
 * A hook for watching Kubernetes resources with support for multi-cluster environments.
 * It is equivalent to the [`useK8sWatchResource`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#usek8swatchresource)
 * hook from the [OpenShift Console Dynamic Plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk)
 * but allows you to retrieve data from any cluster managed by Red Hat Advanced Cluster Management.
 *
 * It automatically detects the hub cluster and handles resource watching on both hub
 * and remote clusters using WebSocket connections for real-time updates.
 *
 * @param initResource - The resource to watch. Can be null to disable the watch.
 * @param initResource.cluster - The managed cluster on which the resource resides; null for the hub cluster
 * @returns A tuple containing the watched resource data, a boolean indicating if the data is loaded,
 *          and any error that occurred. The hook returns live-updating data.
 *
 * @example
 * ```typescript
 * // Watch pods on a remote cluster
 * const [pods, loaded, error] = useFleetK8sWatchResource({
 *   groupVersionKind: { version: 'v1', kind: 'Pod' },
 *   isList: true,
 *   cluster: 'remote-cluster',
 *   namespace: 'default'
 * })
 *
 * // Watch a specific deployment on hub cluster
 * const [deployment, loaded, error] = useFleetK8sWatchResource({
 *   groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
 *   name: 'my-app',
 *   namespace: 'default'
 * })
 * ```
 */
export function useFleetK8sWatchResource<R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  initResource: FleetWatchK8sResource | null
): FleetWatchK8sResult<R> {
  const isFleetAvailable = useIsFleetAvailable()
  const [hubClusterName, hubClusterNameLoaded, hubClusterNameLoadedError] = useHubClusterName()

  const memoizedResource = useDeepCompareMemoize(initResource, true)
  const { cluster, ...resource } = memoizedResource || {}
  const { groupVersionKind } = resource
  const [model, modelLoading] = useK8sModel(groupVersionKind)
  const [backendAPIPath, backendPathLoaded] = useFleetK8sAPIPath(cluster)

  const waitingForHubClusterName = !!cluster && !hubClusterNameLoaded
  const isFleetQuery = cluster && cluster !== hubClusterName

  // avoid using the fleet query if it is not available
  // avoid using either query if we are still waiting for the hub name to compare against the supplied cluster name
  const useFleet = isFleetQuery && isFleetAvailable && !waitingForHubClusterName
  const useLocal = !isFleetQuery && !waitingForHubClusterName

  const isResourceNull = !memoizedResource || !groupVersionKind

  const [fleetResult, setFleetResult] = useState<FleetWatchK8sResultsObject<R>>(
    getInitialResult(memoizedResource, model, backendAPIPath)
  )
  const fleetResultTuple = useMemo<FleetWatchK8sResult<R>>(() => {
    const { data, loaded, loadError } = fleetResult
    return [data, loaded, loadError]
  }, [fleetResult])

  const localResult = useK8sWatchResource<R>(useLocal && !isResourceNull ? resource : null)

  useEffect(() => {
    if (useFleet && !isResourceNull && backendPathLoaded && backendAPIPath && !modelLoading && model) {
      startWatch(memoizedResource, model, backendAPIPath, setFleetResult)
      return () => stopWatch(memoizedResource, model, backendAPIPath)
    }
  }, [backendAPIPath, backendPathLoaded, isResourceNull, memoizedResource, model, modelLoading, useFleet])

  if (waitingForHubClusterName) {
    // if we are still waiting for hub name to load,
    // there is no result, loaded is false, and we should return any error fetching the hub name
    return [undefined, false, hubClusterNameLoadedError]
  } else if (isFleetQuery && !isFleetAvailable) {
    // if we need to use fleet support but it it not available,
    // we return an error
    return [undefined, false, NO_FLEET_AVAILABLE_ERROR]
  } else {
    // otherwise, we return the fleet or single-cluster result accordingly
    return useFleet ? fleetResultTuple : localResult
  }
}
