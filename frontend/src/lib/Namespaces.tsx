import Axios from 'axios'
import { V1Namespace, V1NamespaceList } from '@kubernetes/client-node'
import { useEffect, useState } from 'react'

export async function getNamespaces() {
    const result = await Axios.request<V1NamespaceList>({
        url: `${process.env.REACT_APP_BACKEND}/proxy/api/v1/namespaces`,
        responseType: 'json',
        withCredentials: true,
    })
    return result.data.items
}

export function RestWrapper<T>(restFunc: () => Promise<T>) {
    const [data, setData] = useState<T>()
    const [err, setError] = useState<Error>()
    // TODO POLLING
    // TODO RETRY
    // TODO CACHING
    // TODO REDIRECT TO OAUTH IF 401 or 403
    useEffect(() => {
        void restFunc()
            .then((data) => {
                setData(data)
                setError(undefined)
            })
            .catch((err: Error) => {
                setData(undefined)
                setError(err)
            })
    }, [restFunc])
    return [data, err]
}

export function Namespaces() {
    return RestWrapper<V1Namespace[]>(getNamespaces)
}
