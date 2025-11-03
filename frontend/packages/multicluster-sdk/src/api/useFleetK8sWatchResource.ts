/* Copyright Contributors to the Open Cluster Management project */
import { useHubClusterName } from './useHubClusterName'
import { FleetK8sResourceCommon, FleetWatchK8sResource } from '../types'
import {
  consoleFetchJSON,
  useK8sModel,
  useK8sWatchResource,
  WatchK8sResult,
} from '@openshift-console/dynamic-plugin-sdk'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useEffect, useMemo, useState } from 'react'
import { buildResourceURL, fleetWatch } from '../internal/apiRequests'
import { handleWebsocketEvent } from '../internal/fleetK8sWatchResource'
import { getCacheKey, useFleetK8sWatchResourceStore } from '../internal/fleetK8sWatchResourceStore'
import { selectorToString } from '../internal/requirements'
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
export function useFleetK8sWatchResource<R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  initResource: FleetWatchK8sResource | null
): WatchK8sResult<R> | [undefined, boolean, any] {
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
    const fetchData = async () => {
      if (!useFleet || nullResource) {
        store.setResource(requestPath, noCachedValue, false)
        return
      }

      if (!backendPathLoaded) {
        return
      }

      const socketKey = getCacheKey({ model, cluster, namespace, name })
      const existingSocket = store.getSocket(socketKey)

      // Check for existing WebSocket connection
      // If a valid socket exists, reuse it and return early (real-time updates already active)
      // Socket ref counting is handled by the separate effect below
      if (existingSocket && existingSocket.socket.readyState === WebSocket.OPEN) {
        return
      }

      // No active socket exists - we need to fetch data and create a new socket
      // Check cache to avoid unnecessary HTTP fetch
      const existingEntry = store.getResource(requestPath)

      // If another hook is already fetching (loaded: false), wait for it to complete
      // This prevents race conditions where multiple hooks fetch the same data
      if (existingEntry && !existingEntry.loaded && !existingEntry.error) {
        // Data is being fetched by another instance, the cache update will trigger our re-render
        // Socket ref counting is handled in the separate effect below
        return
      }

      const needsFetch = !existingEntry || store.isResourceExpired(requestPath)

      try {
        let processedData: R
        let resourceVersion: string | undefined

        if (needsFetch) {
          // Cache miss or expired - fetch fresh data from API
          store.setResource(requestPath, noCachedValue, false) // Set loading state
          const rawData = await consoleFetchJSON(requestPath, 'GET')

          // Add cluster field to each item for identification
          processedData = (
            isList
              ? (rawData as { items: K8sResourceCommon[] }).items.map((i) => ({ cluster, ...i }))
              : { cluster, ...(rawData as K8sResourceCommon) }
          ) as R

          // Extract resourceVersion for list resources to enable watch continuation
          // Single resources don't need this as watch uses fieldSelector instead
          if (isList) {
            resourceVersion = (rawData as { metadata?: { resourceVersion?: string } })?.metadata?.resourceVersion
          }

          // Store the fetched data in Zustand store with resourceVersion
          store.setResource(requestPath, processedData, true, undefined, resourceVersion)
        } else {
          // Cache hit - use existing data for instant display, skip HTTP fetch
          resourceVersion = existingEntry.resourceVersion
        }

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

        // For list resources, use resourceVersion to continue from where we left off
        // This prevents missing events between cache creation and socket connection
        if (isList && resourceVersion) {
          watchQuery.resourceVersion = resourceVersion
        }

        const socket = fleetWatch(model, watchQuery, backendAPIPath as string)
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
          // Keep existing data, just add the error
          const currentEntry = store.getResource(requestPath)
          if (currentEntry) {
            store.setResource(requestPath, currentEntry.data, true, err, currentEntry.resourceVersion)
          }
        }
      } catch (err) {
        store.setResource(requestPath, noCachedValue, true, err)
      }
    }

    fetchData()
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

  // Separate effect to manage socket ref counting
  // This ensures all hook instances properly increment/decrement refs even if they skip fetching
  useEffect(() => {
    if (!useFleet || nullResource || !backendPathLoaded || !model) {
      return
    }

    const socketKey = getCacheKey({ model, cluster, namespace, name })
    let attachedToSocket = false

    // Check if socket exists (it might have been created by another hook instance)
    const existingSocket = store.getSocket(socketKey)
    if (existingSocket && existingSocket.socket.readyState === WebSocket.OPEN) {
      store.addSocketRef(socketKey)
      attachedToSocket = true
    }

    // Cleanup - only decrement if we actually incremented
    return () => {
      if (attachedToSocket) {
        store.removeSocketRef(socketKey)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useFleet, nullResource, backendPathLoaded, model, cluster, namespace, name, cachedEntry?.loaded])

  const fallbackResult = useK8sWatchResource<R>(useFallback ? resource : null)

  if (!nullResource && useFallback) {
    return fallbackResult
  } else if (!nullResource && useFleet) {
    return [data, loaded, error]
  } else {
    return [undefined, false, undefined]
  }
}
