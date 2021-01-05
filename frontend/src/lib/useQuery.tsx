import { useCallback, useEffect, useRef, useState } from 'react'
import { IRequestResult, ResourceError, ResourceErrorCode } from './resource-request'

export function useQuery<T>(restFunc: () => IRequestResult<T | T[]>, initialData?: T[]) {
    const [data, setData] = useState<T[] | undefined>(initialData)
    const [error, setError] = useState<Error>()
    const [loading, setLoading] = useState(true)

    const dataRef = useRef<{
        timeout?: NodeJS.Timeout
        polling: number
        promise?: Promise<T | T[]>
        aborted?: boolean
    }>({ polling: 0 })
    const stopPolling = useCallback(function stopPolling() {
        dataRef.current.polling = 0
        if (dataRef.current.timeout) {
            clearTimeout(dataRef.current.timeout)
            dataRef.current.timeout = undefined
        }
    }, [])
    useEffect(() => stopPolling, [stopPolling])

    const refresh = useCallback(
        function refresh() {
            if (dataRef.current.promise) return
            const result = restFunc()
            dataRef.current.promise = result.promise
            result.promise
                .then((data) => {
                    setData(Array.isArray(data) ? data : [data])
                    setError(undefined)
                })
                .catch((err: Error) => {
                    if (err instanceof ResourceError) {
                        switch (err.code) {
                            case ResourceErrorCode.RequestCancelled:
                                dataRef.current.aborted = true
                                break
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
                    } else if (err.name === 'AbortError') {
                        dataRef.current.aborted = true
                    }
                    setError(err)
                })
                .finally(() => {
                    if (dataRef.current.aborted) return
                    setLoading(false)
                    dataRef.current.promise = undefined
                    if (dataRef.current.timeout) {
                        clearTimeout(dataRef.current.timeout)
                        dataRef.current.timeout = undefined
                    }
                    if (dataRef.current.polling > 0) {
                        dataRef.current.timeout = setTimeout(() => {
                            dataRef.current.timeout = undefined
                            refresh()
                        }, dataRef.current.polling)
                    }
                })
            return result.abort
        },
        [restFunc]
    )

    useEffect(refresh, [refresh])

    const startPolling = useCallback(
        function startPolling(interval: number = 5 * 1000) {
            if (process.env.NODE_ENV !== 'test') {
                stopPolling()
                dataRef.current.polling = interval
                refresh()
                return stopPolling
            }
        },
        [refresh, stopPolling]
    )

    return { error, loading, data, startPolling, stopPolling, refresh }
}
