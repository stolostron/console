/* Copyright Contributors to the Open Cluster Management project */

import { FleetK8sResourceCommon, FleetWatchK8sResource, FleetWatchK8sResultsObject } from '../types'
import {
  getCacheEntryAge,
  getErrorRetryInterval,
  getSocketMonitoringInterval,
  is404Error,
  isCacheEntryFresh,
  isCacheEntryValid,
  useFleetK8sWatchResourceStore,
} from './fleetK8sWatchResourceStore'

// Type imports
import { consoleFetchJSON, type K8sModel, type K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { selectorToString } from './requirements'
import { buildResourceURL, fleetWatch } from './apiRequests'
import { NO_FLEET_AVAILABLE_ERROR } from './constants'
import { useHubClusterName, useIsFleetAvailable } from '../api'
import { useCallback } from 'react'

export const getRequestPathFromResource = (resource: FleetWatchK8sResource, model: K8sModel, basePath: string) => {
  const { cluster, name, namespace, fieldSelector, selector } = resource
  return buildResourceURL({
    model,
    ns: namespace,
    name,
    cluster,
    queryParams: {
      ...(fieldSelector ? { fieldSelector: fieldSelector } : {}),
      labelSelector: selectorToString(selector || {}),
    },
    basePath,
  })
}

const getDefaultData = (resource?: FleetWatchK8sResource | null) => {
  const { isList } = resource ?? {}
  return isList ? [] : undefined
}

const handleError = (err: any, requestPath: string, resource: FleetWatchK8sResource) => {
  const store = useFleetK8sWatchResourceStore.getState()
  store.setResult(requestPath, getDefaultData(resource), true, err)
}

const openFleetWatchSocket = (
  requestPath: string,
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string
) => {
  const { cluster, name, namespace, selector, isList } = resource
  const store = useFleetK8sWatchResourceStore.getState()
  const cachedResult = store.getResult(requestPath)
  const resourceVersion = store.getResourceVersion(requestPath)

  try {
    const socket = fleetWatch(
      model,
      {
        ns: namespace,
        cluster,
        fieldSelector: name ? `metadata.name=${name}` : undefined,
        labelSelector: selector || undefined,
        resourceVersion,
        allowWatchBookmarks: true,
      },
      basePath
    )
    store.setSocket(requestPath, socket)

    socket.onmessage = (event) => {
      try {
        // Handle WebSocket event - this will update the store and notify all subscribers
        const shouldRefresh = handleWebsocketEvent(event, requestPath, isList, cluster as string)
        if (shouldRefresh) {
          // Single resource was deleted — confirm 404 via GET but keep socket open
          loadInitialData(requestPath, resource)
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e)
      }
    }

    socket.onclose = (event) => {
      if (event.wasClean) {
        // assume data is fresh up to this point
        store.touchEntry(requestPath)
      } else {
        console.error('WebSocket did not close cleanly:', event)
      }
    }

    socket.onerror = (err) => {
      console.error('WebSocket error:', err)
      // Clear resourceVersion on transport errors to avoid resuming from a potentially stale version
      store.setResult(requestPath, cachedResult?.data, true, err, '')
    }
  } catch (err) {
    handleError(err, requestPath, resource)
  }
}

const loadInitialData = async (requestPath: string, resource: FleetWatchK8sResource) => {
  const { cluster, isList } = resource
  const store = useFleetK8sWatchResourceStore.getState()
  try {
    // load initial data into the zustand store
    const data = await consoleFetchJSON(requestPath, 'GET')
    const processedData = isList
      ? (data as { items: K8sResourceCommon[] }).items.map((i) => ({ cluster, ...i }))
      : { cluster, ...(data as K8sResourceCommon) }
    const resourceVersion = (data as K8sResourceCommon)?.metadata?.resourceVersion
    store.setResult(requestPath, processedData, true, undefined, resourceVersion)
  } catch (err) {
    handleError(err, requestPath, resource)
    return false
  }
  return true
}

const checkFleetWatchSocket = async (
  requestPath: string,
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string
) => {
  const store = useFleetK8sWatchResourceStore.getState()
  const entry = store.cache[requestPath]
  if (entry && entry.refCount > 0) {
    const hasLiveSocket = !!entry.socket && entry.socket.readyState <= WebSocket.OPEN

    if (hasLiveSocket && isCacheEntryFresh(entry)) {
      // Socket is alive and receiving bookmarks — schedule next check at normal interval.
      scheduleSocketCheck(
        requestPath,
        resource,
        model,
        basePath,
        getSocketMonitoringInterval() - getCacheEntryAge(entry)
      )
    } else {
      // Socket may have disconnected or we have a non-404 error; reconnect
      entry.socket?.close()
      const initialDataLoaded = await loadInitialData(requestPath, resource)
      const freshState = useFleetK8sWatchResourceStore.getState()
      if (initialDataLoaded || (!resource.isList && is404Error(freshState.cache[requestPath]?.result?.loadError))) {
        openFleetWatchSocket(requestPath, resource, model, basePath)
        scheduleSocketCheck(requestPath, resource, model, basePath, getSocketMonitoringInterval())
      } else {
        // non-404 error — retry sooner
        scheduleSocketCheck(requestPath, resource, model, basePath, getErrorRetryInterval())
      }
    }
  } else {
    // Monitoring chain ending — clear tracked handle so a later watch can start fresh
    store.clearMonitorTimeout(requestPath)
  }
}

const scheduleSocketCheck = (
  requestPath: string,
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string,
  delay: number
) => {
  const store = useFleetK8sWatchResourceStore.getState()
  const timeout = setTimeout(() => checkFleetWatchSocket(requestPath, resource, model, basePath), delay)
  store.setMonitorTimeout(requestPath, timeout)
}

const monitorFleetWatchSocket = (
  requestPath: string,
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string
) => {
  scheduleSocketCheck(requestPath, resource, model, basePath, getSocketMonitoringInterval())
}

export function useGetInitialResult() {
  const isFleetAvailable = useIsFleetAvailable()
  const [hubClusterName, hubClusterNameLoaded, hubClusterNameLoadedError] = useHubClusterName()
  return useCallback(
    <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
      resource?: FleetWatchK8sResource | null,
      model?: K8sModel,
      basePath?: string
    ) => {
      if (resource && model && basePath) {
        const requestPath = getRequestPathFromResource(resource, model, basePath)
        const store = useFleetK8sWatchResourceStore.getState()
        const entry = store.cache[requestPath]
        if (entry && isCacheEntryValid(entry)) {
          return store.getResult(requestPath) as FleetWatchK8sResultsObject<R>
        }
      }
      // Return default data and error, if any
      const waitingForHubClusterName = !!resource?.cluster && !hubClusterNameLoaded
      const isProbablyFleetQuery = !!resource?.cluster && resource?.cluster !== hubClusterName
      let loadError = undefined
      if (waitingForHubClusterName) {
        // if we are still waiting for hub name to load, we should return any error fetching the hub name
        loadError = hubClusterNameLoadedError
      } else if (isProbablyFleetQuery && !isFleetAvailable) {
        // if we need to use fleet support but it it not available, we return an error
        loadError = NO_FLEET_AVAILABLE_ERROR
      }
      return { data: getDefaultData(resource), loaded: false, loadError } as FleetWatchK8sResultsObject<R>
    },
    [isFleetAvailable, hubClusterName, hubClusterNameLoaded, hubClusterNameLoadedError]
  )
}

export const subscribe = <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  resource: FleetWatchK8sResource,
  requestPath: string,
  setResult: (result: FleetWatchK8sResultsObject<R>) => void
) => {
  return useFleetK8sWatchResourceStore.subscribe(
    (state) => state.cache[requestPath]?.result,
    (result) => {
      if (result) {
        setResult(result as FleetWatchK8sResultsObject<R>)
      } else {
        setResult({ data: getDefaultData(resource), loaded: false } as FleetWatchK8sResultsObject<R>)
      }
    }
  )
}

export const startWatch = async (resource: FleetWatchK8sResource, model: K8sModel, basePath: string) => {
  const requestPath = getRequestPathFromResource(resource, model, basePath)
  const store = useFleetK8sWatchResourceStore.getState()
  store.incrementRefCount(requestPath)

  // If we are the first subscriber, we are responsible for getting the initial data and watching for updates
  if (store.getRefCount(requestPath) === 1) {
    const entry = store.cache[requestPath]
    if (entry && isCacheEntryValid(entry)) {
      // Cached value is not expired — skip the initial fetch
      openFleetWatchSocket(requestPath, resource, model, basePath)
    } else {
      const loadSuccess = await loadInitialData(requestPath, resource)
      // For non-list: open socket even on 404 (resource may be created later via ADDED event)
      // For list or non-404 errors: only open socket on success
      const freshState = useFleetK8sWatchResourceStore.getState()
      if (loadSuccess || (!resource.isList && is404Error(freshState.cache[requestPath]?.result?.loadError))) {
        openFleetWatchSocket(requestPath, resource, model, basePath)
      }
    }
    // Only start a new monitoring chain if one isn't already pending
    // (an existing chain survives refCount 0→1 transitions and will continue on its own)
    if (!useFleetK8sWatchResourceStore.getState().cache[requestPath]?.monitorTimeout) {
      monitorFleetWatchSocket(requestPath, resource, model, basePath)
    }
  }
}

export const stopWatch = (resource: FleetWatchK8sResource, model: K8sModel, basePath: string) => {
  const requestPath = getRequestPathFromResource(resource, model, basePath)
  const store = useFleetK8sWatchResourceStore.getState()
  store.decrementRefCount(requestPath)
}

export const handleWebsocketEvent = <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  event: any,
  requestPath: string,
  isList: boolean | undefined,
  cluster: string
): boolean => {
  if (!event) {
    console.warn('Received undefined event', event)
    return false
  }

  const eventDataParsed = JSON.parse(event.data)
  const eventType = eventDataParsed?.type
  const object = eventDataParsed?.object

  if (!object) return false

  const store = useFleetK8sWatchResourceStore.getState()

  const currentEntry = store.getResult(requestPath)
  const storedData = currentEntry?.data
  if (isList && !storedData) {
    return false
  }

  const uidMatches = (i: FleetK8sResourceCommon | undefined) => i?.metadata?.uid === object?.metadata?.uid

  if (eventType === 'DELETED') {
    if (Array.isArray(storedData)) {
      store.setResult(
        requestPath,
        storedData.filter((i) => !uidMatches(i)),
        true
      )
      return false
    }
    // Signal caller to do a GET to confirm 404 (socket stays open)
    return true
  }

  if (eventType === 'ERROR') {
    if (object?.code === 410) {
      // 410 Gone — watch expired; clear resourceVersion so reconnect starts fresh
      store.setResult(requestPath, storedData, currentEntry?.loaded ?? true, currentEntry?.loadError, '')
    }
    return false
  }

  if (eventType === 'BOOKMARK') {
    // Update resourceVersion and refresh timestamp, but preserve any existing loadError
    // (e.g. a 404 should not be cleared just because the watch connection sent a bookmark)
    store.setResult(
      requestPath,
      storedData,
      currentEntry?.loaded ?? true,
      currentEntry?.loadError,
      object?.metadata?.resourceVersion
    )
  }

  if (eventType !== 'ADDED' && eventType !== 'MODIFIED') {
    return false
  }
  if (!object?.metadata?.uid) {
    console.warn('Event object does not have a metadata.uid', eventDataParsed)
    return false
  }

  const addOrReplaceObject = Array.isArray(storedData) ? storedData.some(uidMatches) : true

  if (addOrReplaceObject) {
    const objectWithCluster = { cluster, ...object }
    const updatedData = Array.isArray(storedData)
      ? storedData.map((i) => (uidMatches(i) ? objectWithCluster : i))
      : objectWithCluster
    store.setResult(requestPath, updatedData, true)
    return false
  }

  if (!addOrReplaceObject && Array.isArray(storedData)) {
    const updatedData = [...storedData, { cluster, ...(object as K8sResourceCommon) }] as R
    store.setResult(requestPath, updatedData, true)
  }
  return false
}
