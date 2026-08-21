/* Copyright Contributors to the Open Cluster Management project */

import { FleetK8sResourceCommon, FleetWatchK8sResource, FleetWatchK8sResultsObject } from '../types'
import { isCacheEntryValid, useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'

// Type imports
import { consoleFetchJSON, type K8sModel, type K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { selectorToString } from './requirements'
import { buildResourceURL, fleetWatch, WatchErrorGone } from './apiRequests'
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

const RECONNECT_DELAY = 5000

const isGoneError = (err: any): err is WatchErrorGone => err?.type === 'GONE' && err?.status === 410

const openFleetWatchStream = (
  requestPath: string,
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string
) => {
  const { cluster, name, namespace, selector, isList } = resource
  const store = useFleetK8sWatchResourceStore.getState()
  const cachedResult = store.getResult(requestPath)
  const resourceVersion = store.getResourceVersion(requestPath)

  const existingEntry = store.cache[requestPath]
  if (existingEntry?.abortController) {
    existingEntry.abortController.abort()
  }

  store.setStreamStatus(requestPath, 'Connecting')

  try {
    const abortController = fleetWatch(
      model,
      {
        ns: namespace,
        cluster,
        fieldSelector: name ? `metadata.name=${name}` : undefined,
        labelSelector: selector || undefined,
        resourceVersion: isList ? resourceVersion : undefined,
        allowWatchBookmarks: isList,
      },
      basePath,
      {
        onEvent: (eventData) => {
          store.setStreamStatus(requestPath, 'Active')
          handleWatchEvent(eventData, requestPath, isList, cluster as string)
        },
        onError: (err) => {
          if (isGoneError(err)) {
            store.setStreamStatus(requestPath, 'Gone (410) → re-listing')
            store.setResult(requestPath, cachedResult?.data, true, undefined, '')
            scheduleReconnect(requestPath, resource, model, basePath, 0, true)
          } else {
            const msg = err instanceof Error ? err.message : String(err)
            store.setStreamStatus(requestPath, `Error: ${msg} → reconnecting in ${RECONNECT_DELAY / 1000}s`)
            console.error('Watch stream error:', err)
            store.setResult(requestPath, cachedResult?.data, true, err)
            scheduleReconnect(requestPath, resource, model, basePath, RECONNECT_DELAY, true)
          }
        },
        onClose: () => {
          store.setStreamStatus(requestPath, 'Closed → reconnecting')
          store.touchEntry(requestPath)
          scheduleReconnect(requestPath, resource, model, basePath, 0, false)
        },
      }
    )
    store.setAbortController(requestPath, abortController)
  } catch (err) {
    handleError(err, requestPath, resource)
  }
}

const scheduleReconnect = (
  requestPath: string,
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string,
  delay: number,
  reload: boolean
) => {
  setTimeout(async () => {
    const store = useFleetK8sWatchResourceStore.getState()
    const entry = store.cache[requestPath]
    if (entry && entry.refCount > 0) {
      if (reload) {
        if (await loadInitialData(requestPath, resource)) {
          openFleetWatchStream(requestPath, resource, model, basePath)
        }
      } else {
        openFleetWatchStream(requestPath, resource, model, basePath)
      }
    }
  }, delay)
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
    const resourceVersion = isList ? (data as K8sResourceCommon)?.metadata?.resourceVersion : undefined
    store.setResult(requestPath, processedData, true, undefined, resourceVersion)
  } catch (err) {
    handleError(err, requestPath, resource)
    return false
  }
  return true
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

  if (store.getRefCount(requestPath) === 1) {
    const entry = store.cache[requestPath]
    if ((entry && isCacheEntryValid(entry)) || (await loadInitialData(requestPath, resource))) {
      openFleetWatchStream(requestPath, resource, model, basePath)
    }
  }
}

export const stopWatch = (resource: FleetWatchK8sResource, model: K8sModel, basePath: string) => {
  const requestPath = getRequestPathFromResource(resource, model, basePath)
  const store = useFleetK8sWatchResourceStore.getState()
  store.decrementRefCount(requestPath)
}

export const handleWatchEvent = <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  eventData: { type: string; object: any } | undefined,
  requestPath: string,
  isList: boolean | undefined,
  cluster: string
): void => {
  if (!eventData) {
    console.warn('Received undefined event', eventData)
    return
  }

  const eventType = eventData.type
  const object = eventData.object

  if (!object) return

  const store = useFleetK8sWatchResourceStore.getState()

  if (!isList) {
    const currentEntry = store.getResult(requestPath)
    if (eventType === 'ADDED' && currentEntry?.data) return

    const processedEventData = { cluster, ...(object as K8sResourceCommon) }

    if (processedEventData) {
      store.setResult(requestPath, processedEventData, true)
    }

    return
  }

  const currentEntry = store.getResult(requestPath)
  const storedData = currentEntry?.data as K8sResourceCommon[]
  if (!storedData) {
    return
  }

  if (eventType === 'DELETED') {
    const updatedData = storedData.filter((i) => i.metadata?.uid !== object?.metadata?.uid)
    store.setResult(requestPath, updatedData, true)
    return
  }

  if (eventType === 'BOOKMARK') {
    store.setResult(requestPath, storedData, true, undefined, object?.metadata?.resourceVersion)
  }

  if (eventType !== 'ADDED' && eventType !== 'MODIFIED') {
    return
  }
  if (!object?.metadata?.uid) {
    console.warn('Event object does not have a metadata.uid', eventData)
    return
  }

  const objectExists = storedData.some((i) => i.metadata?.uid === object?.metadata?.uid)

  if (objectExists && eventType === 'MODIFIED') {
    const updatedData = storedData.map((i) => (i.metadata?.uid === object?.metadata?.uid ? { cluster, ...object } : i))
    store.setResult(requestPath, updatedData, true)
    return
  }

  if (!objectExists) {
    const updatedData = [...storedData, { cluster, ...(object as K8sResourceCommon) }] as R
    store.setResult(requestPath, updatedData, true)
  }
}
