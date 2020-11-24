import { useCallback, useEffect, useState } from 'react'
import { IResource } from '../resources/resource'
import { IRequestResult } from './resource-request'

export function useQuery<T extends IResource>(restFunc: () => IRequestResult<T[]>) {
    const [data, setData] = useState<T[]>()
    const [error, setError] = useState<Error>()
    const [loading, setLoading] = useState(true)
    const [polling, setPolling] = useState(0)

    const refresh = useCallback(
        function refresh() {
            const result = restFunc()
            result.promise
                .then((data) => {
                    setData(data)
                    setLoading(false)
                    setError(undefined)
                })
                .catch((err: Error) => {
                    // TODO check for
                    if (err.name === 'AbortError') {
                        setError(err)
                    } else {
                        setError(err)
                    }
                    setLoading(false)
                    setData(undefined)
                })
            return result.abort
        },
        [restFunc]
    )

    useEffect(refresh, [refresh])

    useEffect(() => {
        if (polling > 0) {
            const interval = setInterval(refresh, polling)
            return () => clearInterval(interval)
        }
    }, [refresh, polling])

    function stopPolling() {
        setPolling(0)
    }

    function startPolling() {
        setPolling(5 * 1000)
        return stopPolling
    }

    return { error, loading, data, startPolling, stopPolling, refresh }
}
