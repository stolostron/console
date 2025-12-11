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
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import {
  getRequestPathFromResource,
  startWatch,
  stopWatch,
  subscribe,
  useGetInitialResult,
} from '../internal/fleetK8sWatchResource'

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
 * @param initResource.cluster - The managed cluster on which the resource resides; null or undefined for the hub cluster
 * @param initResource.groupVersionKind - The group, version, and kind of the resource (e.g., `{ group: 'apps', version: 'v1', kind: 'Deployment' }`)
 * @param initResource.name - The name of the resource (for watching a specific resource)
 * @param initResource.namespace - The namespace of the resource
 * @param initResource.isList - Whether to watch a list of resources (true) or a single resource (false)
 * @param initResource.selector - Label selector to filter resources (e.g., `{ matchLabels: { app: 'myapp' } }`)
 * @param initResource.fieldSelector - Field selector to filter resources (e.g., `status.phase=Running`)
 * @param initResource.limit - Maximum number of resources to return (not supported yet)
 * @param initResource.namespaced - Whether the resource is namespaced (not supported yet)
 * @param initResource.optional - If true, errors will not be thrown when the resource is not found (not supported yet)
 * @param initResource.partialMetadata - If true, only fetch metadata for the resources (not supported yet)
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
 *
 * // Watch pods with label selector on remote cluster
 * const [filteredPods, loaded, error] = useFleetK8sWatchResource({
 *   groupVersionKind: { version: 'v1', kind: 'Pod' },
 *   isList: true,
 *   cluster: 'remote-cluster',
 *   namespace: 'default',
 *   selector: { matchLabels: { app: 'myapp' } }
 * })
 * ```
 */
export function useFleetK8sWatchResource<R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  initResource: FleetWatchK8sResource | null
): FleetWatchK8sResult<R> {
  const isFleetAvailable = useIsFleetAvailable()
  const [hubClusterName, hubClusterNameLoaded] = useHubClusterName()

  const [memoizedResource, memoizedResourceChanged] = useDeepCompareMemoize(initResource, true)
  const { cluster, ...resource } = memoizedResource ?? {}
  const { groupVersionKind } = resource
  const [model, modelLoading] = useK8sModel(groupVersionKind)
  const [backendAPIPath, backendPathLoaded] = useFleetK8sAPIPath(cluster)

  const waitingForHubClusterName = !!cluster && !hubClusterNameLoaded
  const isProbablyFleetQuery = !!cluster && cluster !== hubClusterName

  // avoid using the fleet query if it is not available
  // avoid using either query if we are still waiting for the hub name to compare against the supplied cluster name
  const useFleet = isProbablyFleetQuery && isFleetAvailable && !waitingForHubClusterName
  const useLocal = !isProbablyFleetQuery && !waitingForHubClusterName

  const isResourceNull = !memoizedResource || !groupVersionKind

  const getInitialResult = useGetInitialResult()

  const initialResult = getInitialResult<R>(memoizedResource, model, backendAPIPath)
  const [fleetResult, setFleetResult] = useState<FleetWatchK8sResultsObject<R>>(initialResult)
  if (memoizedResourceChanged) {
    setFleetResult(initialResult)
  }
  const fleetResultTuple = useMemo<FleetWatchK8sResult<R>>(() => {
    const { data, loaded, loadError } = fleetResult
    return [data, loaded, loadError]
  }, [fleetResult])

  const localResult = useK8sWatchResource<R>(useLocal && !isResourceNull ? resource : null)

  useEffect(() => {
    if (useFleet && !isResourceNull && backendPathLoaded && backendAPIPath && !modelLoading && model) {
      const requestPath = getRequestPathFromResource(memoizedResource, model, backendAPIPath)
      const unsubscribe = subscribe(memoizedResource, requestPath, setFleetResult)
      startWatch(memoizedResource, model, backendAPIPath)

      return () => {
        unsubscribe()
        stopWatch(memoizedResource, model, backendAPIPath)
      }
    }
  }, [backendAPIPath, backendPathLoaded, isResourceNull, memoizedResource, model, modelLoading, useFleet])

  return useLocal ? localResult : fleetResultTuple
}
