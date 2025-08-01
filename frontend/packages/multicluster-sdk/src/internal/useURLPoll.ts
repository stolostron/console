/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react'
import { usePoll } from './usePoll'
import { useSafeFetch } from './useSafeFetch'

export const URL_POLL_DEFAULT_DELAY = 15000 // 15 seconds

export type UseURLPoll = <R>(url: string | null, delay?: number, ...dependencies: any[]) => [R | null, any, boolean]

export const useURLPoll: UseURLPoll = <R>(
  url: string | null,
  delay = URL_POLL_DEFAULT_DELAY,
  ...dependencies: any[]
) => {
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<R | null>(null)
  const [loading, setLoading] = useState(true)
  const safeFetch = useSafeFetch()
  const tick = useCallback(() => {
    if (url) {
      safeFetch(url)
        .then((data) => {
          setResponse(data as R)
          setError(null)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setResponse(null)
            setError(err)
            // eslint-disable-next-line no-console
            console.error(`Error polling URL: ${err}`)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [url])

  usePoll(tick, delay, ...dependencies)

  return [response, error, loading]
}
