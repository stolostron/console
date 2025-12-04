/* Copyright Contributors to the Open Cluster Management project */
import { useHubClusterName } from './useHubClusterName'
import { FleetResourcesObject, FleetWatchK8sResource, FleetWatchK8sResources, FleetWatchK8sResults } from '../types'
import { K8sModel, useK8sModels, useK8sWatchResources, WatchK8sResources } from '@openshift-console/dynamic-plugin-sdk'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useEffect, useState } from 'react'
import { useDeepCompareMemoize } from '../internal/hooks/useDeepCompareMemoize'
import {
  startWatch,
  stopWatch,
  subscribe,
  useGetInitialResult,
  getRequestPathFromResource,
} from '../internal/fleetK8sWatchResource'
import { getFleetK8sAPIPath } from '../internal/getFleetK8sAPIPath'

function getModelForWatch(watch: FleetWatchK8sResource, models: { [key: string]: K8sModel }) {
  if (watch.groupVersionKind) {
    const { group, version, kind } = watch.groupVersionKind
    const reference = [group || 'core', version, kind].join('~')
    return models[reference] ?? models[kind]
  } else if (watch.kind) {
    const kind = watch.kind?.split('~')?.[2]
    return models[watch.kind] ?? models[kind]
  }
  return undefined
}

/**
 * A hook for watching multiple Kubernetes resources with support for multi-cluster environments.
 * It is equivalent to the [`useK8sWatchResources`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#usek8swatchresources)
 * hook from the [OpenShift Console Dynamic Plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk)
 * but allows you to retrieve data from any cluster managed by Red Hat Advanced Cluster Management.
 *
 * It automatically detects the hub cluster and handles resource watching on both hub
 * and remote clusters using WebSocket connections for real-time updates.
 *
 * @param initResources - An object where each key represents a resource identifier and each value is a resource watch configuration. Can be null to disable all watches.
 * @param initResources[key].cluster - The managed cluster on which the resource resides; null or undefined for the hub cluster
 * @param initResources[key].groupVersionKind - The group, version, and kind of the resource (e.g., `{ group: 'apps', version: 'v1', kind: 'Deployment' }`)
 * @param initResources[key].name - The name of the resource (for watching a specific resource)
 * @param initResources[key].namespace - The namespace of the resource
 * @param initResources[key].isList - Whether to watch a list of resources (true) or a single resource (false)
 * @param initResources[key].selector - Label selector to filter resources (e.g., `{ matchLabels: { app: 'myapp' } }`)
 * @param initResources[key].fieldSelector - Field selector to filter resources (e.g., `status.phase=Running`)
 * @param initResources[key].limit - Maximum number of resources to return (not supported yet)
 * @param initResources[key].namespaced - Whether the resource is namespaced (not supported yet)
 * @param initResources[key].optional - If true, errors will not be thrown when the resource is not found (not supported yet)
 * @param initResources[key].partialMetadata - If true, only fetch metadata for the resources (not supported yet)
 * @returns An object with the same keys as initResources, where each value contains the watched resource data,
 *          a boolean indicating if the data is loaded, and any error that occurred. The hook returns live-updating data.
 *
 * @example
 * ```typescript
 * // Watch multiple resources on different clusters
 * const result = useFleetK8sWatchResources({
 *   pods: {
 *     groupVersionKind: { version: 'v1', kind: 'Pod' },
 *     isList: true,
 *     cluster: 'remote-cluster-1',
 *     namespace: 'default'
 *   },
 *   deployments: {
 *     groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
 *     isList: true,
 *     cluster: 'remote-cluster-2',
 *     namespace: 'default'
 *   }
 * })
 *
 * // Access individual resources
 * const { pods, deployments } = result
 * console.log(pods.data, pods.loaded, pods.loadError)
 * console.log(deployments.data, deployments.loaded, deployments.loadError)
 * ```
 */
export function useFleetK8sWatchResources<R extends FleetResourcesObject>(
  initResources: FleetWatchK8sResources<R> | null
): FleetWatchK8sResults<R> {
  const isFleetAvailable = useIsFleetAvailable()
  const [hubClusterName, hubClusterNameLoaded] = useHubClusterName()

  const [memoizedResources, memoizedResourceChanged] = useDeepCompareMemoize(initResources, true)
  const resources = memoizedResources ?? ({} as FleetWatchK8sResources<R>)
  const [models, modelsLoading] = useK8sModels()

  const waitingForHubClusterName = Object.values(resources).some((watch) => !!watch.cluster) && !hubClusterNameLoaded
  const probablyHasFleetQueries = Object.values(resources).some(
    (watch) => !!watch.cluster && watch.cluster !== hubClusterName
  )

  // avoid using the fleet query if it is not available
  // avoid using either query if we are still waiting for the hub name to compare against the supplied cluster name
  const useFleet = probablyHasFleetQueries && isFleetAvailable && !waitingForHubClusterName
  const useLocal = !probablyHasFleetQueries && !waitingForHubClusterName

  const isResourceNullOrEmpty = !initResources || Object.keys(initResources).length === 0

  const getInitialResult = useGetInitialResult()

  const initialFleetResult = {} as FleetWatchK8sResults<R>
  for (const [key, watch] of Object.entries(resources)) {
    initialFleetResult[key as keyof R] = getInitialResult(
      watch,
      getModelForWatch(watch, models),
      getFleetK8sAPIPath(hubClusterName, watch.cluster)
    )
  }
  const [fleetResult, setFleetResult] = useState<FleetWatchK8sResults<R>>(initialFleetResult)
  if (memoizedResourceChanged) {
    setFleetResult(initialFleetResult)
  }

  const localResult = useK8sWatchResources<R>(
    useLocal && !isResourceNullOrEmpty ? initResources : ({} as WatchK8sResources<R>)
  )

  useEffect(
    () => {
      if (useFleet && !isResourceNullOrEmpty && !modelsLoading) {
        const watches = [] as [FleetWatchK8sResource, K8sModel, string, () => void][]
        for (const [key, watch] of Object.entries(resources)) {
          const model = getModelForWatch(watch, models) as K8sModel
          const path = getFleetK8sAPIPath(hubClusterName, watch.cluster)
          const requestPath = model && path ? getRequestPathFromResource(watch, model, path) : ''
          watches.push([
            watch,
            model,
            path,
            subscribe(watch, requestPath, (newResult) => setFleetResult((result) => ({ ...result, [key]: newResult }))),
          ])
        }
        for (const [watch, model, path] of watches) {
          startWatch(watch, model, path)
        }
        return () => {
          for (const [watch, model, path, unsubscribe] of watches) {
            unsubscribe()
            stopWatch(watch, model, path)
          }
        }
      }
    },
    // models updates frequently, but does not require a re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isResourceNullOrEmpty, resources, modelsLoading, useFleet, hubClusterName]
  )

  return useLocal ? localResult : fleetResult
}
