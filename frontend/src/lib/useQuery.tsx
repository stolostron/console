/* Copyright Contributors to the Open Cluster Management project */

import { IRequestResult, ResourceError, ResourceErrorCode } from '../resources'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useQuery<T>(restFunc: () => IRequestResult<T | T[]>, initialData?: T[]) {
  const [data, setData] = useState<T[] | undefined>(initialData)
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(true)
  const [iteration, setIteration] = useState(0)

  const dataRef = useRef<{
    ismounted: boolean
    polling: number
    timeout?: ReturnType<typeof setTimeout>
    requestResult?: IRequestResult<T | T[]>
  }>({
    ismounted: false,
    polling: 0,
  })

  useEffect(() => {
    const current = dataRef.current
    current.ismounted = true
    return () => {
      current.ismounted = false
    }
  }, [])

  const refresh = useCallback(
    function refresh() {
      if (!dataRef.current.ismounted) return
      if (dataRef.current.requestResult) return
      if (dataRef.current.timeout) {
        clearTimeout(dataRef.current.timeout)
        dataRef.current.timeout = undefined
      }
      const requestResult = restFunc()
      dataRef.current.requestResult = requestResult
      let aborted = false
      dataRef.current.requestResult.promise
        .then((data) => {
          if (!dataRef.current.ismounted) return
          setData(Array.isArray(data) ? data : [data])
          setError(undefined)
        })
        .catch((err: Error) => {
          if (!dataRef.current.ismounted) return
          if (err instanceof ResourceError) {
            switch (err.code) {
              case ResourceErrorCode.RequestAborted:
                aborted = true
                return
              case ResourceErrorCode.TooManyRequests:
              case ResourceErrorCode.Timeout:
              case ResourceErrorCode.ServiceUnavailable:
              case ResourceErrorCode.NetworkError:
              case ResourceErrorCode.InternalServerError:
              case ResourceErrorCode.GatewayTimeout:
              case ResourceErrorCode.ConnectionReset:
              case ResourceErrorCode.BadGateway:
                break
              default:
                setData(undefined)
                break
            }
          }
          setError(err)
        })
        .finally(() => {
          if (!dataRef.current.ismounted) return
          dataRef.current.requestResult = undefined
          if (!aborted) {
            setLoading(false)
          }
          if (dataRef.current.polling > 0 && !document.hidden) {
            dataRef.current.timeout = setTimeout(
              () => setIteration((iteration) => iteration + 1),
              dataRef.current.polling
            )
          }
        })
      return () => {
        requestResult.abort()
      }
    },
    [restFunc]
  )

  useEffect(() => {
    return refresh()
  }, [iteration, refresh])

  const stopPolling = useCallback(() => {
    dataRef.current.polling = 0
  }, [])
  const startPolling = useCallback(
    (interval: number = 5 * 1000) => {
      if (!dataRef.current.ismounted) return
      if (process.env.NODE_ENV !== 'test') {
        dataRef.current.polling = interval
        if (!dataRef.current.requestResult) {
          setIteration((iteration) => iteration + 1)
        }
        return () => stopPolling()
      }
    },
    [stopPolling]
  )

  useEffect(() => {
    const handler = () => {
      if (!document.hidden) setIteration((iteration) => iteration + 1)
    }
    document.addEventListener('visibilitychange', handler, false)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return {
    error,
    loading,
    data,
    startPolling,
    stopPolling,
    refresh: () => {
      if (!dataRef.current.ismounted) return
      setIteration((iteration) => iteration + 1)
    },
  }
}
