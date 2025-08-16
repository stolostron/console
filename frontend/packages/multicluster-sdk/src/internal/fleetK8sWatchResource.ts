/* Copyright Contributors to the Open Cluster Management project */

/**
 * Clears the cache for fleet resources and closes any open WebSockets.
 * @deprecated Use useFleetK8sCache().clearAll() instead
 */
import { useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'

export function clearFleetK8sWatchResourceCache() {
  // This function is kept for backward compatibility but now uses Zustand store
  const store = useFleetK8sWatchResourceStore.getState()
  store.clearAll()
}

// Re-export the getCacheKey function for backward compatibility
export { getCacheKey } from './fleetK8sWatchResourceStore'

// Type imports
import type { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'

export const handleWebsocketEvent = <R>(
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
    const currentEntry = store.getResource(requestPath)
    if (eventType === 'ADDED' && currentEntry?.data) return

    const processedEventData = { cluster, ...(object as K8sResourceCommon) } as R

    if (processedEventData) {
      // Update the store with the new data - this will notify all subscribers
      store.setResource(requestPath, processedEventData, true)
    }

    return
  }

  if (eventType === 'DELETED') {
    const currentEntry = store.getResource(requestPath)
    const storedData = currentEntry?.data as K8sResourceCommon[]
    if (!storedData) return
    const updatedData = storedData.filter((i) => i.metadata?.uid !== object?.metadata?.uid)
    store.setResource(requestPath, updatedData as R, true)
    return
  }

  if (eventType !== 'ADDED' && eventType !== 'MODIFIED') {
    return
  }
  if (!object?.metadata?.uid) {
    console.warn('Event object does not have a metadata.uid', eventDataParsed)
    return
  }

  const currentEntry = store.getResource(requestPath)
  const storedData = currentEntry?.data as K8sResourceCommon[]
  if (!storedData) return

  const objectExists = storedData.some((i) => i.metadata?.uid === object?.metadata?.uid)

  if (objectExists && eventType === 'MODIFIED') {
    const updatedData = storedData.map((i) => (i.metadata?.uid === object?.metadata?.uid ? { cluster, ...object } : i))
    store.setResource(requestPath, updatedData as R, true)
    return
  }

  if (!objectExists) {
    const updatedData = [...storedData, { cluster, ...(object as K8sResourceCommon) }] as R
    store.setResource(requestPath, updatedData, true)
  }
}
