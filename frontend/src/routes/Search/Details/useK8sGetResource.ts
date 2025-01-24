import * as _ from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { K8sResourceCommon, WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'
import { fetchRetry, getBackendUrl } from '../../../resources/utils'
import { getResourceNameApiPath, getResourcePlural } from '../../../resources'
import { ClusterScopeContext } from '../../../plugin-extensions/ClusterScopeContext'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version

type GetK8sResult<R extends K8sResourceCommon | K8sResourceCommon[]> = [R, boolean, any]

export type Query = { [key: string]: any }

export type MakeQuery = (
  namespace?: string,
  labelSelector?: any,
  fieldSelector?: any,
  name?: string,
  limit?: number
) => Query

export const useK8sGetResource = (resource: WatchK8sResource | null): GetK8sResult<any> => {
  const noResource = !resource
  const { isList, groupVersionKind, namespace, name } = resource ?? {}
  const { group, version, kind = '' } = groupVersionKind ?? {}

  const [data, setData] = useState<any>(isList ? [] : {})
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)
  const { cluster: clusterName } = useContext(ClusterScopeContext)

  useEffect(() => {
    const fetchData = async () => {
      if (noResource) {
        setData(isList ? [] : {})
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

        const requestPath = `${getBackendUrl()}/managedclusterproxy/${clusterName}${resourcePath}`
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
    fetchData()
  }, [clusterName, group, isList, kind, name, namespace, noResource, version])

  return [data, loaded, error]
}
