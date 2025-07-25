/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk'
import { useEffect, useRef } from 'react'

export const useSafeFetch = () => {
  const controller = useRef<AbortController>()
  useEffect(() => {
    controller.current = new AbortController()
    return () => controller.current?.abort()
  }, [])

  return (url: string) =>
    consoleFetch(url, {
      signal: controller.current?.signal as AbortSignal,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then((response) => response.json())
}
