import { useCallback, useEffect, useRef, useState } from 'react'
import { IRequestResult } from './resource-request'

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
    function stopPolling() {
        dataRef.current.polling = 0
        if (dataRef.current.timeout) {
            clearTimeout(dataRef.current.timeout)
            dataRef.current.timeout = undefined
        }
    }
    useEffect(() => stopPolling, [])

    const refresh = useCallback(
        function refresh() {
            if (dataRef.current.promise) return
            const result = restFunc()
            dataRef.current.promise = result.promise
            result.promise
                .then((data) => {
                    setData(Array.isArray(data) ? data : [data])
                    setLoading(false)
                    setError(undefined)
                })
                .catch((err: Error) => {
                    if (err.name === 'AbortError') {
                        dataRef.current.aborted = true
                    } else {
                        setError(err)
                        setLoading(false)
                        setData(undefined)
                    }
                })
                .finally(() => {
                    if (dataRef.current.aborted) return
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

    function startPolling() {
        stopPolling()
        dataRef.current.polling = 5 * 1000
        refresh()
        return stopPolling
    }

    return { error, loading, data, startPolling, stopPolling, refresh }
}
