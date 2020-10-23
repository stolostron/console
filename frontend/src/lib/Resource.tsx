import { V1ObjectMeta } from '@kubernetes/client-node'
import Axios, { AxiosResponse, Method, AxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'

// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

const responseType = 'json'
const withCredentials = true

export function GetWrapper<T>(restFunc: () => Promise<AxiosResponse<T>>) {
    const [data, setData] = useState<T>()
    const [error, setError] = useState<Error>()
    const [loading, setLoading] = useState(true)
    const [polling, setPolling] = useState(0)

    const refresh = useCallback(
        function refresh() {
            void restFunc()
                .then((response) => {
                    setData(response.data)
                    setError(undefined)
                    setLoading(false)
                })
                .catch((err: Error) => {
                    setData(undefined)
                    setError(err)
                    setLoading(false)
                })
        },
        [restFunc]
    )

    useEffect(refresh, [])

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
                window.location.href = `${process.env.REACT_APP_BACKEND}/login`
        }
    }, [error])

    return { error, loading, data, startPolling, stopPolling, refresh }
}

export interface IResource {
    apiVersion?: string
    kind?: string
    metadata?: V1ObjectMeta
}

export interface IResourceList<Resource extends IResource> {
    items: Resource[]
}

async function restRequest<T>(method: Method, url: string, data?: unknown): Promise<AxiosResponse<T>> {
    const result = await Axios.request<T>({ method, url, data, responseType, withCredentials })
    return result
}

export function resourceMethods<Resource extends IResource>(options: { path: string; plural: string }) {
    const root = `${process.env.REACT_APP_BACKEND}/cluster-management/proxy${options.path}`
    return {
        create: function createResource(resource: Resource) {
            let url = root
            if (resource.metadata?.namespace) url += `/namespaces/${resource.metadata.namespace}`
            url += +`/${options.plural}`
            return restRequest<Resource>('POST', url, resource)
        },
        delete: function deleteResource(name?: string, namespace?: string) {
            let url = root
            if (namespace) url += `/namespaces/${namespace}`
            url += `/${options.plural}`
            url += `/${name}`
            return restRequest<Resource>('DELETE', url)
        },
        list: function listClusterResources(labels?: string[]) {
            let url = `${process.env.REACT_APP_BACKEND}/cluster-management/namespaced${options.path}`
            url += `/${options.plural}`
            if (labels) url += '?labelSelector=' + labels.join(',')
            return restRequest<Resource[]>('GET', url)
        },
        listCluster: function listClusterResources(labels?: string[]) {
            let url = root
            url += `/${options.plural}`
            if (labels) url += '?labelSelector=' + labels.join(',')
            return restRequest<Resource[]>('GET', url)
        },
        listNamespace: function listNamespaceResources(namespace: string, labels?: string[]) {
            let url = root
            url += `/namespaces/${namespace}`
            url += `/${options.plural}`
            if (labels) url += '?labelSelector=' + labels.join(',')
            return restRequest<Resource[]>('GET', url)
        },
    }
}

export function getResourceName(resource: Partial<IResource>) {
    return resource.metadata?.name
}

export function setResourceName(resource: Partial<IResource>, name: string) {
    if (!resource.metadata) resource.metadata = {}
    return (resource.metadata.name = name)
}

export function getResourceNamespace(resource: Partial<IResource>) {
    return resource.metadata?.namespace
}

export function setResourceNamespace(resource: Partial<IResource>, namespace: string) {
    if (!resource.metadata) resource.metadata = {}
    return (resource.metadata.namespace = namespace)
}
