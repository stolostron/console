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

export const handleWebsocketEvent = <R>(
  event: any,
  requestPath: string,
  setData: (data: R) => void,
  isList: boolean | undefined,
  store: any, // FleetK8sWatchResourceStore
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

  if (!isList) {
    const currentEntry = store.getResource(requestPath)
    if (eventType === 'ADDED' && currentEntry?.data) return

    const processedEventData = { cluster, ...(object as K8sResourceCommon) } as R

    if (processedEventData) {
      setData(processedEventData)
    }

    return
  }

  if (eventType === 'DELETED') {
    const currentEntry = store.getResource(requestPath)
    const storedData = currentEntry?.data as K8sResourceCommon[]
    if (!storedData) return
    const updatedData = storedData.filter((i) => i.metadata?.uid !== object?.metadata?.uid)
    setData(updatedData as R)
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
    setData(updatedData as R)
    return
  }

  if (!objectExists) {
    const updatedData = [...storedData, { cluster, ...(object as K8sResourceCommon) }] as R
    setData(updatedData)
  }
}
