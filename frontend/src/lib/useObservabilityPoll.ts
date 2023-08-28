/* Copyright Contributors to the Open Cluster Management project */
import _ from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchGet, getBackendUrl } from '../resources'

export enum ObservabilityEndpoint {
  LABEL = 'observability/label',
  QUERY = 'observability/query',
  QUERY_RANGE = 'observability/query_range',
  RULES = 'observability/rules',
  TARGETS = 'observability/targets',
}
type ObservabilityURLProps = {
  skip?: boolean
  endpoint: ObservabilityEndpoint
  endTime?: number
  namespace?: string
  query?: string
  samples?: number
  timeout?: string
  timespan?: number
}
type ObservabilityResponse = {
  status: string
  data: {
    resultType: 'matrix' | 'vector' | 'scalar' | 'string'
    result: {
      metric: { [key: string]: string }
      values?: [number, string][]
      value?: [number, string]
    }[]
  }
  errorType?: string
  error?: string
  warnings?: string[]
}
type UseObservabilityPoll = (props: ObservabilityURLProps, delay?: number) => [ObservabilityResponse, unknown, boolean]

// Range vector queries require end, start, and step search params
const getRangeVectorSearchParams = (
  endTime: number = Date.now(),
  samples = 60,
  timespan: number = 60 * 60 * 1000
): URLSearchParams => {
  const params = new URLSearchParams()
  params.append('start', `${(endTime - timespan) / 1000}`)
  params.append('end', `${endTime / 1000}`)
  params.append('step', `${timespan / samples / 1000}`)
  return params
}

const getObservabilityURL = (props: ObservabilityURLProps): string => {
  const { skip, endpoint, endTime, timespan, samples, ...params }: ObservabilityURLProps = props
  if (skip || (props.endpoint !== ObservabilityEndpoint.RULES && !props.query)) {
    return ''
  }
  const searchParams =
    endpoint === ObservabilityEndpoint.QUERY_RANGE
      ? getRangeVectorSearchParams(endTime, samples, timespan)
      : new URLSearchParams()
  _.each(params, (value, key) => value && searchParams.append(key, value.toString()))

  return `${getBackendUrl()}/${props.endpoint}?${searchParams.toString()}`
}

const usePoll = (callback: () => void, skip?: boolean, delay?: number) => {
  const pollDelay = delay ?? 60000 // delay is 1 min
  const savedCallback = useRef<{ (): void } | null>(null)

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    const tick = () => savedCallback?.current?.()

    tick() // Run first tick immediately.

    if (pollDelay) {
      // Only start interval if a delay is provided.
      const id = setInterval(tick, pollDelay)
      return () => clearInterval(id)
    }
  }, [pollDelay, skip])
}

export const useObservabilityPoll: UseObservabilityPoll = (
  { skip, endpoint, endTime, namespace, query, samples = 60, timeout, timespan = 60 * 60 * 1000 },
  delay
) => {
  const observabilityURLProps = { skip, endpoint, endTime, namespace, query, samples, timeout, timespan }

  const url = getObservabilityURL(observabilityURLProps)
  const [error, setError] = useState<unknown>()
  const [response, setResponse] = useState<any>()
  const [loading, setLoading] = useState(true)
  const tick = useCallback(() => {
    if (url && !skip) {
      setLoading(true)
      const abortController = new AbortController()
      fetchGet(url, abortController.signal)
        .then((res) => {
          setResponse(res.data as any)
          setError(undefined)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setResponse(undefined)
            setError(err?.message)
            // eslint-disable-next-line no-console
            console.error(`Error polling URL: ${err?.message}`)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [url, skip])

  usePoll(tick, skip, delay)

  return [response, error, loading]
}
