/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useEffect, useState } from 'react'
import {
  K8sResourceCommon,
  UseK8sWatchResource,
  WatchK8sResource,
  WatchK8sResult,
  useK8sWatchResource as useK8sWatchResourceDefault,
} from '@openshift-console/dynamic-plugin-sdk'
import { fetchRetry, getBackendUrl } from '../../../resources/utils'
import { getResourceNameApiPath, getResourcePlural } from '../../../resources'
import { ClusterScopeContext } from '../../../plugin-extensions/ClusterScopeContext'
import { useIsLocalHub, useLocalHubName } from '../../../hooks/use-local-hub'

export type Query = { [key: string]: any }

export type MakeQuery = (
  namespace?: string,
  labelSelector?: any,
  fieldSelector?: any,
  name?: string,
  limit?: number
) => Query

export const useK8sWatchResource: UseK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  resource: WatchK8sResource | null
): WatchK8sResult<R> => {
  const noResource = !resource
  const { isList, groupVersionKind, namespace, name } = resource ?? {}
  const { group, version, kind = '' } = groupVersionKind ?? {}

  const [data, setData] = useState<R>((isList ? [] : {}) as R)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)
  const localHubName = useLocalHubName()
  const { cluster = localHubName } = useContext(ClusterScopeContext)
  const isLocalHub = useIsLocalHub(cluster)
  const [dataDefault, loadedDefault, errorDefault] = useK8sWatchResourceDefault<R>(isLocalHub ? resource : null)

  useEffect(() => {
    const fetchData = async () => {
      if (noResource) {
        setData((isList ? [] : {}) as R)
        setLoaded(false)
        setError(undefined)
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

        fetchRetry({
          method: 'GET',
          url: requestPath,
          headers: headers,
          retries: 0,
        })
          .then(({ data, status }) => {
            if (status !== 200) {
              setError(new Error('Failed to fetch data'))
              setLoaded(true)
            } else {
              setData(isList ? (data as { items: any }).items : data)
              setLoaded(true)
            }
          })
          .catch((err) => {
            setError(err)
            setLoaded(true)
          })
      } catch (err) {
        setError(err)
        setLoaded(true)
      }
    }
    if (isLocalHub) {
      setData(dataDefault)
      setLoaded(loadedDefault)
      setError(errorDefault)
    } else {
      fetchData()
    }
  }, [
    cluster,
    dataDefault,
    errorDefault,
    group,
    isList,
    isLocalHub,
    kind,
    loadedDefault,
    name,
    namespace,
    noResource,
    version,
  ])

  return [data, loaded, error]
}
