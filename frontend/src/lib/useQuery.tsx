import { AxiosResponse } from 'axios'
import { useCallback, useEffect, useState } from 'react'

export function useQuery<T>(restFunc: () => Promise<AxiosResponse<T>>) {
    const [data, setData] = useState<T>()
    const [error, setError] = useState<Error>()
    const [loading, setLoading] = useState(true)
    const [polling, setPolling] = useState(0)

    const refresh = useCallback(
        function refresh() {
            void restFunc()
                .then((response) => {
                    setLoading(false)
                    switch (response.status) {
                        case 401:
                            window.location.href = `${process.env.REACT_APP_BACKEND}/cluster-management/login`
                            setData(undefined)
                            break
                        default:
                            setData(response.data)
                            setError(undefined)
                            break
                    }
                })
                .catch((err: Error) => {
                    console.log(typeof err)
                    setData(undefined)
                    setError(err)
                    setLoading(false)
                })
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

    function startPolling(interval: number) {
        setPolling(interval)
    }

    function stopPolling() {
        setPolling(0)
    }

    useEffect(() => {
        const code: string = (error as any)?.statusCode
        switch (code) {
            case '401':
                window.location.href = `${process.env.REACT_APP_BACKEND}/cluster-management/login`
        }
    }, [error])

    return { error, loading, data, startPolling, stopPolling, refresh }
}
