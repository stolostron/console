/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react'
import { usePoll } from './usePoll'
import { useSafeFetch } from './useSafeFetch'

const URL_POLL_DEFAULT_DELAY = 15000 // 15 seconds

export function useURLPoll<R>(
  url: string | null,
  delay = URL_POLL_DEFAULT_DELAY,
  ...dependencies: any[]
): [response: R | undefined, loaded: boolean, error: unknown] {
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<R | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)
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
            setResponse(undefined)
            setError(err)
            // eslint-disable-next-line no-console
            console.error(`Error polling URL: ${err}`)
          }
        })
        .finally(() => setLoaded(true))
    }
  }, [url])

  usePoll(tick, delay, ...dependencies)

  return [response, loaded, error]
}
