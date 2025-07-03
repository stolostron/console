/* Copyright Contributors to the Open Cluster Management project */
import { UseHubClusterName } from '../types'
import { useEffect, useState } from 'react'
import { getBackendUrl } from './apiRequests'
import axios from 'axios'

export const getHubClusterNameUrl = () => '/hub'

export const useHubClusterName: UseHubClusterName = () => {
  const url = getBackendUrl() + getHubClusterNameUrl()
  const [hubClusterName, setHubClusterName] = useState<string>('local-cluster')
  const [isHubSelfManaged, setIsHubSelfManaged] = useState<boolean | undefined>(undefined)
  const [error, setError] = useState<any>(undefined)
  useEffect(() => {
    const fetchHubClusterName = async () => {
      try {
        const { data } = await axios.get(url)
        setHubClusterName(data.localHubName)
        setIsHubSelfManaged(data.isHubSelfManaged)
      } catch (err) {
        setHubClusterName('local-cluster')
        setIsHubSelfManaged(undefined)
        setError(err)
      }
    }
    fetchHubClusterName()
  }, [url])

  return [hubClusterName, isHubSelfManaged, error]
}
