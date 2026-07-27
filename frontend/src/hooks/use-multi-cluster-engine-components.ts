/* Copyright Contributors to the Open Cluster Management project */
import { useState, useEffect } from 'react'
import { fetchGet, getBackendUrl } from '~/resources/utils'
interface MultiClusterEngineComponent {
  name: string
  enabled: boolean
}
export const useMultiClusterEngineComponents = () => {
  const [components, setComponents] = useState<MultiClusterEngineComponent[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const url = `${getBackendUrl()}/multiclusterengine/components`
        const abortController = new AbortController()
        const response = await fetchGet<MultiClusterEngineComponent[]>(url, abortController.signal)
        setComponents(response.data ?? [])
        setLoaded(true)
      } catch (error) {
        console.warn('Failed to fetch MCE components:', error)
        setComponents([])
        setLoaded(true)
      }
    }
    fetchComponents()
  }, [])
  return { components, loaded }
}
