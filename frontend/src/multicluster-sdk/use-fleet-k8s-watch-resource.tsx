/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon, useK8sWatchResource, WatchK8sResult } from '@openshift-console/dynamic-plugin-sdk'
import { useEffect, useState } from 'react'
import { getResourceNameApiPath, getResourcePlural } from '../resources'
import { fetchRetry, getBackendUrl } from '../resources/utils'
import { FleetK8sResourceCommon, FleetWatchK8sResource } from '@stolostron/multicluster-sdk'
import { MulticlusterSDKProvider } from '@stolostron/multicluster-sdk/lib/internal'

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
  const { group, version, kind = '' } = groupVersionKind ?? {}

  const [data, setData] = useState<R>((isList ? [] : {}) as R)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      setError(undefined)
      if (!useFleet || nullResource) {
        setData((isList ? [] : {}) as R)
        setLoaded(false)
        return
      }
      try {
        const apiVersion = `${group ? `${group}/` : ''}${version}`

        const pluralResourceKind = await getResourcePlural({
          kind,
          apiVersion,
        })

        const resourcePath = await getResourceNameApiPath({
          kind,
          apiVersion,
          metadata: { namespace, name },
          plural: pluralResourceKind,
        })

        const requestPath = `${getBackendUrl()}/managedclusterproxy/${cluster}${resourcePath}`
        const headers: HeadersInit = { ['Content-Type']: 'application/json' }

        const { data, status } = await fetchRetry({
          method: 'GET',
          url: requestPath,
          headers: headers,
          retries: 0,
        })

        if (status === 200) {
          setData(
            (isList
              ? (data as { items: K8sResourceCommon[] }).items.map((i) => ({ cluster, ...i }))
              : { cluster, ...(data as K8sResourceCommon) }) as R
          )
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
  }, [cluster, group, isList, kind, name, namespace, nullResource, useFleet, version])

  const [defaultData, defaultLoaded, defaultError] = useK8sWatchResource<R>(useFleet ? null : resource)

  return useFleet ? [data, loaded, error] : [defaultData, defaultLoaded, defaultError]
}
