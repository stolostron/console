/* Copyright Contributors to the Open Cluster Management project */
export const handleWebsocketEvent = <R>(
  event: any,
  requestPath: string,
  setData: (data: R) => void,
  isList: boolean | undefined,
  fleetResourceCache: Record<string, any>,
  cluster: string
): void => {
  if (!isList) {
    if (event?.type === 'ADDED' && fleetResourceCache[requestPath]) return

    const processedEventData = { cluster, ...(event?.object as K8sResourceCommon) } as R

    if (processedEventData) {
      fleetResourceCache[requestPath] = processedEventData
      setData(processedEventData)
    }

    return
  }

  if (event?.type === 'DELETED') {
    const storedData = fleetResourceCache[requestPath] as K8sResourceCommon[]
    const updatedData = storedData.filter((i) => i.metadata?.uid !== event?.object?.metadata?.uid)
    fleetResourceCache[requestPath] = updatedData
    setData(updatedData as R)
    return
  }

  if (event?.type !== 'ADDED' && event?.type !== 'MODIFIED') {
    return
  }
  if (!event?.object?.metadata?.uid) {
    console.warn('Event object does not have a metadata.uid', event)
    return
  }

  const storedData = fleetResourceCache[requestPath] as K8sResourceCommon[]

  const objectExist = storedData.some((i) => i.metadata?.uid === event?.object?.metadata?.uid)

  if (objectExist && event?.type === 'MODIFIED') {
    const updatedData = storedData.map((i) =>
      i.metadata?.uid === event?.object?.metadata?.uid ? { cluster, ...event.object } : i
    )
    fleetResourceCache[requestPath] = updatedData
    setData(updatedData as R)
    return
  }

  if (!objectExist) {
    const updatedData = [...storedData, { cluster, ...(event?.object as K8sResourceCommon) }] as R
    fleetResourceCache[requestPath] = updatedData
    setData(updatedData)
    return
  }
}
