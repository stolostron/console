/* Copyright Contributors to the Open Cluster Management project */
import { UseHubClusterName } from '../types'
import { useEffect, useState } from 'react'
import { getBackendUrl } from './apiRequests'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

export const getHubClusterNameUrl = () => '/hub'
let cachedhubClusterName: string | undefined = undefined

export const fetchHubClusterName = async () => {
  const url = getBackendUrl() + getHubClusterNameUrl()
  if (!cachedhubClusterName) {
    const data = await consoleFetchJSON(url, 'GET')
    cachedhubClusterName = data.localHubName
  }
  return cachedhubClusterName
}

export const useHubClusterName: UseHubClusterName = () => {
  const [hubClusterName, setHubClusterName] = useState<string | undefined>(cachedhubClusterName)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)
  useEffect(() => {
    if (error) {
      try {
        fetchHubClusterName()
        setHubClusterName(cachedhubClusterName)
        setLoaded(true)
      } catch (err) {
        setHubClusterName('local-cluster')
        setLoaded(false)
        setError(err)
      }
    }
  }, [error])

  return [hubClusterName, loaded, error]
}
