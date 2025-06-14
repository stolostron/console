/* Copyright Contributors to the Open Cluster Management project */
export const handleWebsocketEvent = <R>(
  event: any,
  requestPath: string,
  setData: (data: R) => void,
  isList: boolean | undefined,
  fleetResourceCache: Record<string, any>,
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
    if (eventType === 'ADDED' && fleetResourceCache[requestPath]) return

    const processedEventData = { cluster, ...(object as K8sResourceCommon) } as R

    if (processedEventData) {
      fleetResourceCache[requestPath] = processedEventData
      setData(processedEventData)
    }

    return
  }

  if (eventType === 'DELETED') {
    const storedData = fleetResourceCache[requestPath] as K8sResourceCommon[]
    const updatedData = storedData.filter((i) => i.metadata?.uid !== object?.metadata?.uid)
    fleetResourceCache[requestPath] = updatedData
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

  const storedData = fleetResourceCache[requestPath] as K8sResourceCommon[]

  const objectExist = storedData.some((i) => i.metadata?.uid === object?.metadata?.uid)

  if (objectExist && eventType === 'MODIFIED') {
    const updatedData = storedData.map((i) => (i.metadata?.uid === object?.metadata?.uid ? { cluster, ...object } : i))
    fleetResourceCache[requestPath] = updatedData
    setData(updatedData as R)
    return
  }

  if (!objectExist) {
    const updatedData = [...storedData, { cluster, ...(object as K8sResourceCommon) }] as R
    fleetResourceCache[requestPath] = updatedData
    setData(updatedData)
    return
  }
}
