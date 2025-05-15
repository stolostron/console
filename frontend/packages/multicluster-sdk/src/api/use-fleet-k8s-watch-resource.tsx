/* Copyright Contributors to the Open Cluster Management project */
import {
  K8sResourceCommon,
  useK8sModel,
  useK8sWatchResource,
  WatchK8sResult,
} from '@openshift-console/dynamic-plugin-sdk'
import { useEffect, useMemo, useState } from 'react'

import { MulticlusterSDKProvider } from '../internal'
import { FleetK8sResourceCommon, FleetWatchK8sResource } from '../types'
import { fetchRetry } from './utils/fetchRetry'
import { fleetWatch, getResourceURL } from './apiRequests'

export const useFleetK8sWatchResource: MulticlusterSDKProvider['useFleetK8sWatchResource'] = <
  R extends FleetK8sResourceCommon | FleetK8sResourceCommon[],
>(
  hubClusterName: string,
  initResource: FleetWatchK8sResource | null
): WatchK8sResult<R> => {
  const { cluster, ...resource } = initResource ?? {}
  const useFleet = cluster && cluster !== hubClusterName
  const nullResource = resource === null
  const { isList, groupVersionKind, namespace, name } = resource ?? {}
  const [model] = useK8sModel(groupVersionKind)

  const [data, setData] = useState<R>((isList ? [] : {}) as R)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)

  const requestPath = useMemo(
    () =>
      getResourceURL({
        model,
        ns: namespace,
        name,
        cluster,
      }),
    [model, namespace, name, cluster]
  )

  useEffect(() => {
    const fetchData = async () => {
      setError(undefined)
      if (!useFleet || nullResource) {
        setData((isList ? [] : {}) as R)
        setLoaded(false)
        return
      }

      try {
        console.log('requestPath', requestPath)
        const headers: HeadersInit = { ['Content-Type']: 'application/json' }

        const { data, status } = await fetchRetry({
          method: 'GET',
          url: requestPath,
          headers: headers,
          retries: 0,
        })

        console.log('data', data)
        console.log('status', status)

        if (status === 200) {
          const processedData = (
            isList
              ? (data as { items: K8sResourceCommon[] }).items.map((i) => ({ cluster, ...i }))
              : { cluster, ...(data as K8sResourceCommon) }
          ) as R

          const query: any = {
            ns: namespace,
            cluster,
          }

          if (name) {
            query.fieldSelector = `metadata.name=${name}`
          }

          if (isList) {
            query.resourceVersion = (data as { resourceVersion?: string })?.resourceVersion
          }

          const socket = fleetWatch(model, query)

          socket.onmessage = (event: MessageEvent) => {
            try {
              const parsed = JSON.parse(event.data)

              const updatedObject = { cluster, ...parsed.object }
              if (parsed && updatedObject) {
                setData(updatedObject)
              }
            } catch (e) {
              console.error('Failed to parse WebSocket message', e)
            }
          }

          setData(processedData)
        } else {
          throw new Error('Failed to fetch data')
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoaded(true)
      }
    }
    fetchData()
  }, [cluster, isList, requestPath, name, namespace, nullResource, useFleet])

  console.log('useFleet', useFleet)
  const [defaultData, defaultLoaded, defaultError] = useK8sWatchResource<R>(useFleet ? null : resource)

  return useFleet ? [data, loaded, error] : [defaultData, defaultLoaded, defaultError]
}
