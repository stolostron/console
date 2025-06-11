/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { getBackendUrl } from './utils/api-resource-list'
import { BASE_K8S_API_PATH } from './constants'

let cachedBackendURL: string

export const useBackendURL = (cluster?: string): [string | undefined, boolean, Error | undefined] => {
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

  return [backendURL, loaded, error]
}
