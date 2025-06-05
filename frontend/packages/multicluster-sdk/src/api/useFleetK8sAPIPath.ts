/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { UseFleetK8sAPIPath } from '../types'
import { getBackendUrl } from './utils/api-resource-list'
import { BASE_K8S_API_PATH } from './constants'

let cachedBackendURL: string

export const useFleetK8sAPIPath: UseFleetK8sAPIPath = (cluster) => {
  const [backendURL, setBackendURL] = useState<string>(cachedBackendURL)
  const [loaded, setLoaded] = useState<boolean>(!!cachedBackendURL)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    if (cachedBackendURL) return

    const fetchBackendURL = async () => {
      try {
        const url = await getBackendUrl()
        cachedBackendURL = url
        setBackendURL(url)
        setLoaded(true)
      } catch (err) {
        setError(err as Error)
      }
    }

    fetchBackendURL()
  }, [])

  if (!loaded || !backendURL) return [undefined, false, error]
  if (!cluster) return [BASE_K8S_API_PATH, true, undefined]

  return [`${backendURL}/managedclusterproxy/${cluster}`, loaded, error]
}

export const getFleetK8sAPIPath = async (cluster?: string) => {
  if (cluster) {
    const backendURL = await getBackendUrl()
    return `${backendURL}/managedclusterproxy/${cluster}`
  } else {
    return BASE_K8S_API_PATH
  }
}
