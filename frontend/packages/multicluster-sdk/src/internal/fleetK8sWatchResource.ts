/* Copyright Contributors to the Open Cluster Management project */

import { FleetK8sResourceCommon, FleetWatchK8sResource, FleetWatchK8sResultsObject } from '../types'
import { isCacheEntryValid, useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'

// Type imports
import { consoleFetchJSON, type K8sModel, type K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { selectorToString } from './requirements'
import { buildResourceURL, fleetWatch } from './apiRequests'

const getRequestPathFromResource = (resource: FleetWatchK8sResource, model: K8sModel, basePath: string) => {
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
        resourceVersion: isList ? resourceVersion : undefined,
        allowWatchBookmarks: isList,
      },
      basePath
    )
    store.setSocket(requestPath, socket)

    socket.onmessage = (event) => {
      try {
        // Handle WebSocket event - this will update the store and notify all subscribers
        handleWebsocketEvent(event, requestPath, isList, cluster as string)
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
      if (store.getRefCount(requestPath) > 0) {
        // TODO: at least one watcher remains; open a new socket
        // openFleetWatchSocket(requestPath, resource, model, basePath)
      }
    }

    socket.onerror = (err) => {
      console.error('WebSocket error:', err)
      store.setResult(requestPath, cachedResult?.data, true, err)
    }
  } catch (err) {
    handleError(err, requestPath, resource)
  }
}

export const getInitialResult = <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
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
  return { data: getDefaultData(resource), loaded: false } as FleetWatchK8sResultsObject<R>
}

export const startWatch = async <R extends FleetK8sResourceCommon | FleetK8sResourceCommon[]>(
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string,
  setResult: (result: FleetWatchK8sResultsObject<R>) => void
) => {
  const { cluster, isList } = resource
  const requestPath = getRequestPathFromResource(resource, model, basePath)
  const store = useFleetK8sWatchResourceStore.getState()
  store.incrementRefCount(requestPath)
  useFleetK8sWatchResourceStore.subscribe(
    (state) => state.cache[requestPath]?.result,
    (result) => {
      if (result) {
        setResult(result as FleetWatchK8sResultsObject<R>)
      } else {
        setResult({ data: getDefaultData(resource), loaded: false } as FleetWatchK8sResultsObject<R>)
      }
    }
  )

  // if there were already other subscribers, there is nothing more to do (WebSocket will be opened even if it is not yet in the store)
  if (store.getRefCount(requestPath) > 1) {
    return
  }

  // if there is a cached value that is not expired, we can skip the initial fetch
  const entry = store.cache[requestPath]
  if (!entry || !isCacheEntryValid(entry)) {
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
    }
  }
  openFleetWatchSocket(requestPath, resource, model, basePath)
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
): void => {
  if (!event) {
    console.warn('Received undefined event', event)
    return
  }

  const eventDataParsed = JSON.parse(event.data)
  const eventType = eventDataParsed?.type
  const object = eventDataParsed?.object

  if (!object) return

  const store = useFleetK8sWatchResourceStore.getState()

  if (!isList) {
    const currentEntry = store.getResult(requestPath)
    if (eventType === 'ADDED' && currentEntry?.data) return

    const processedEventData = { cluster, ...(object as K8sResourceCommon) }

    if (processedEventData) {
      // Update the store with the new data - this will notify all subscribers
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
    console.warn('Event object does not have a metadata.uid', eventDataParsed)
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
