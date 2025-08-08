/* Copyright Contributors to the Open Cluster Management project */
import { useHubClusterName } from './useHubClusterName'
import { FleetK8sResourceCommon, FleetWatchK8sResource, UseFleetK8sWatchResource } from '../types'
import { consoleFetchJSON, useK8sModel, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useEffect, useMemo, useState } from 'react'
import { buildResourceURL, fleetWatch } from '../internal/apiRequests'
import { getCacheKey, handleWebsocketEvent } from '../internal/fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from '../internal/fleetK8sWatchResourceStore'
import { selectorToString } from './utils/requirements'
import { useDeepCompareMemoize } from '../internal/hooks/useDeepCompareMemoize'

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
export const useFleetK8sWatchResource: UseFleetK8sWatchResource = <
  R extends FleetK8sResourceCommon | FleetK8sResourceCommon[],
>(
  initResource: FleetWatchK8sResource | null
) => {
  const [hubClusterName, hubClusterNameLoaded] = useHubClusterName()

  const memoizedResource = useDeepCompareMemoize(initResource, true)

  const clusterSpecified = memoizedResource?.cluster !== undefined
  const shouldWaitForHubClusterName = clusterSpecified && !hubClusterNameLoaded

  const { cluster, ...resource } = memoizedResource ?? {}
  const nullResource = !memoizedResource || !resource?.groupVersionKind
  const selector = memoizedResource?.selector

  const { isList, groupVersionKind, namespace, name } = resource ?? {}
  const [model] = useK8sModel(groupVersionKind)
  const [backendAPIPath, backendPathLoaded] = useFleetK8sAPIPath(cluster)
  const isFleetAvailable = useIsFleetAvailable()
  const isRemoteCluster = !!cluster && cluster !== hubClusterName
  const useFleet = isFleetAvailable && !shouldWaitForHubClusterName && isRemoteCluster
  const useFallback = !isFleetAvailable || (!shouldWaitForHubClusterName && !isRemoteCluster)

  const noCachedValue = useMemo(() => (isList ? [] : (undefined as unknown)) as R, [isList])

  const requestPath = useMemo(
    () =>
      backendPathLoaded && model
        ? buildResourceURL({
            model,
            ns: namespace,
            name,
            cluster,
            queryParams: {
              ...(memoizedResource?.fieldSelector ? { fieldSelector: memoizedResource?.fieldSelector } : {}),
              labelSelector: selectorToString(memoizedResource?.selector || {}),
            },
            basePath: backendAPIPath as string,
          })
        : '',

    [
      model,
      namespace,
      name,
      cluster,
      backendPathLoaded,
      backendAPIPath,
      memoizedResource?.selector,
      memoizedResource?.fieldSelector,
    ]
  )

  // Subscribe to store changes for this specific resource path
  const cachedEntry = useFleetK8sWatchResourceStore((state) => state.resourceCache[requestPath])

  // Get store instance for imperative operations
  const store = useFleetK8sWatchResourceStore.getState()

  const [data, setData] = useState<R>(cachedEntry?.data ?? noCachedValue)
  const [loaded, setLoaded] = useState<boolean>(cachedEntry?.loaded ?? false)
  const [error, setError] = useState<any>(cachedEntry?.error)

  // Update local state when store changes
  useEffect(() => {
    if (cachedEntry) {
      setData(cachedEntry.data ?? noCachedValue)
      setLoaded(cachedEntry.loaded)
      setError(cachedEntry.error)
    } else {
      setData(noCachedValue)
      setLoaded(false)
      setError(undefined)
    }
  }, [cachedEntry, noCachedValue])

  useEffect(() => {
    let socket: WebSocket | undefined
    const fetchData = async () => {
      if (!useFleet || nullResource) {
        store.setResource(requestPath, noCachedValue, false)
        return
      }

      if (!backendPathLoaded) {
        return
      }

      // Check if we already have this resource cached and it's not expired
      const existingEntry = store.getResource(requestPath)
      if (existingEntry && !store.isResourceExpired(requestPath)) {
        return
      }

      const socketKey = getCacheKey({ model, cluster, namespace, name })
      const existingSocket = store.getSocket(socketKey)

      // If we have a valid socket, increment reference count and use it
      if (existingSocket && existingSocket.socket.readyState === WebSocket.OPEN) {
        store.addSocketRef(socketKey)
        socket = existingSocket.socket
        return
      }

      try {
        store.setResource(requestPath, noCachedValue, false) // Set loading state

        const data = (await consoleFetchJSON(requestPath, 'GET')) as R

        const processedData = (
          isList
            ? (data as { items: K8sResourceCommon[] }).items.map((i) => ({ cluster, ...i }))
            : { cluster, ...(data as K8sResourceCommon) }
        ) as R

        // Store the data in Zustand store
        store.setResource(requestPath, processedData, true)

        const watchQuery: any = {
          ns: namespace,
          cluster,
        }

        if (name) {
          watchQuery.fieldSelector = `metadata.name=${name}`
        }
        if (selector) {
          watchQuery.labelSelector = selector
        }

        if (isList) {
          watchQuery.resourceVersion = (data as { metadata: { resourceVersion?: string } })?.metadata?.resourceVersion
        }

        // Only create a new WebSocket if we don't have a valid one
        socket = fleetWatch(model, watchQuery, backendAPIPath as string)
        store.setSocket(socketKey, socket)

        socket.onmessage = (event) => {
          try {
            // Handle WebSocket event - this will update the store and notify all subscribers
            handleWebsocketEvent(event, requestPath, isList, cluster)
          } catch (e) {
            console.error('Failed to parse WebSocket message', e)
          }
        }

        socket.onclose = () => {
          store.removeSocket(socketKey)
        }

        socket.onerror = (err) => {
          console.error('WebSocket error:', err)
          store.setResource(requestPath, processedData, true, err)
        }
      } catch (err) {
        store.setResource(requestPath, noCachedValue, true, err)
      }
    }

    fetchData()

    // Cleanup function - decrement reference count for socket
    return () => {
      if (useFleet && !nullResource && backendPathLoaded && model) {
        const socketKey = getCacheKey({ model, cluster, namespace, name })
        store.removeSocketRef(socketKey)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cluster,
    isList,
    requestPath,
    name,
    namespace,
    nullResource,
    noCachedValue,
    useFleet,
    backendPathLoaded,
    model,
    backendAPIPath,
    selector,
  ])

  const fallbackResult = useK8sWatchResource<R>(useFallback ? resource : null)

  if (!nullResource && useFallback) {
    return fallbackResult
  } else if (!nullResource && useFleet) {
    return [data, loaded, error]
  } else {
    return [undefined, false, undefined]
  }
}
