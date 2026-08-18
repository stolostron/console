/* Copyright Contributors to the Open Cluster Management project */

import { FleetK8sResourceCommon, FleetWatchK8sResource, FleetWatchK8sResultsObject } from '../types'
import { isCacheEntryValid, useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'

// Type imports
import { consoleFetchJSON, type K8sModel, type K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { selectorToString } from './requirements'
import { buildResourceURL } from './apiRequests'
import { NO_FLEET_AVAILABLE_ERROR } from './constants'
import { useHubClusterName, useIsFleetAvailable } from '../api'
import { useCallback } from 'react'

const MIN_POLL_INTERVAL_SECONDS = 10
const DEFAULT_POLL_INTERVAL_SECONDS = 10

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

const loadInitialData = async (requestPath: string, resource: FleetWatchK8sResource) => {
  const { cluster, isList } = resource
  const store = useFleetK8sWatchResourceStore.getState()
  try {
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

const pollData = async (requestPath: string, resource: FleetWatchK8sResource) => {
  const store = useFleetK8sWatchResourceStore.getState()
  const entry = store.cache[requestPath]
  if (!entry || entry.refCount <= 0) return

  store.setPollStatus(requestPath, 'Polling')
  try {
    await loadInitialData(requestPath, resource)
    store.setPollStatus(requestPath, 'Idle')
  } catch {
    store.setPollStatus(requestPath, 'Error')
  }
}

const startPolling = (requestPath: string, resource: FleetWatchK8sResource, pollInterval: number) => {
  const store = useFleetK8sWatchResourceStore.getState()

  const existingEntry = store.cache[requestPath]
  if (existingEntry?.pollTimer) {
    clearInterval(existingEntry.pollTimer)
  }

  const timer = setInterval(() => pollData(requestPath, resource), pollInterval)
  store.setPollTimer(requestPath, timer)
  store.setPollStatus(requestPath, 'Idle')
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
      const waitingForHubClusterName = !!resource?.cluster && !hubClusterNameLoaded
      const isProbablyFleetQuery = !!resource?.cluster && resource?.cluster !== hubClusterName
      let loadError = undefined
      if (waitingForHubClusterName) {
        loadError = hubClusterNameLoadedError
      } else if (isProbablyFleetQuery && !isFleetAvailable) {
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

export const startWatch = async (
  resource: FleetWatchK8sResource,
  model: K8sModel,
  basePath: string,
  pollInterval?: number
) => {
  const intervalSeconds = Math.max(pollInterval ?? DEFAULT_POLL_INTERVAL_SECONDS, MIN_POLL_INTERVAL_SECONDS)
  const effectiveInterval = intervalSeconds * 1000

  const requestPath = getRequestPathFromResource(resource, model, basePath)
  const store = useFleetK8sWatchResourceStore.getState()
  store.incrementRefCount(requestPath)

  if (store.getRefCount(requestPath) === 1) {
    const entry = store.cache[requestPath]
    if ((entry && isCacheEntryValid(entry)) || (await loadInitialData(requestPath, resource))) {
      startPolling(requestPath, resource, effectiveInterval)
    }
  }
}

export const stopWatch = (resource: FleetWatchK8sResource, model: K8sModel, basePath: string) => {
  const requestPath = getRequestPathFromResource(resource, model, basePath)
  const store = useFleetK8sWatchResourceStore.getState()
  store.decrementRefCount(requestPath)
}
