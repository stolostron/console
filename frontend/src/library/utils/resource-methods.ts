import { V1ObjectMeta } from '@kubernetes/client-node'
import Axios, { AxiosResponse, Method } from 'axios'

// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

const token = process.env.CLUSTER_API_TOKEN
const proxyPath =
    process.env.BACKEND_PROXY_PATH === undefined ? '/cluster-management/proxy' : process.env.BACKEND_PROXY_PATH
const namespacedPath =
    process.env.BACKEND_NAMESPACED_PATH === undefined
        ? '/cluster-management/namespaced'
        : process.env.BACKEND_NAMESPACED_PATH

export interface ResourceList<T> {
    items: T[]
}

export interface IResource {
    apiVersion?: string
    kind?: string
    metadata?: V1ObjectMeta
}

export async function restRequest<T>(method: Method, url: string, data?: object): Promise<AxiosResponse<T>> {
    return await Axios.request<T>({
        method,
        url,
        data,
        responseType: 'json',
        withCredentials: true,
        validateStatus: () => true,
    })
}

export interface IResourceMethods<Resource> {
    apiPath: string
    plural: string
    create: (resource: Resource) => Promise<AxiosResponse<Resource>>
    delete: (name: string, namespace?: string) => Promise<AxiosResponse>
    get: (name: string, namespace?: string) => Promise<AxiosResponse<Resource>>
    list: (labels?: string[]) => Promise<AxiosResponse<ResourceList<Resource>>>
    listCluster: (labels?: string[]) => Promise<AxiosResponse<ResourceList<Resource>>>
    listNamespace: (namespace: string, labels?: string[]) => Promise<AxiosResponse<ResourceList<Resource>>>
    getNamespaceResource: (namespace: string, name: string) => Promise<AxiosResponse<Resource>>
}

export function resourceMethods<Resource extends IResource>(options: {
    path: string
    plural: string
}): IResourceMethods<Resource> {
    return {
        apiPath: options.path,
        plural: options.plural,
        create: (resource: Resource) => {
            return createResource<Resource>({
                resource,
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                withCredentials: true,
                token,
            })
        },
        delete: (name: string, namespace?: string) => {
            return deleteResource({
                name,
                namespace,
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiPath: options.path + '/' + options.plural,
                withCredentials: true,
                token,
            })
        },
        get: (name: string, namespace?: string) => {
            return getResource<Resource>({
                name,
                namespace,
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiPath: options.path + '/' + options.plural,
                withCredentials: true,
                token,
            })
        },
        list: (labels?: string[]) => {
            return listResources<Resource>({
                apiUrl: `${process.env.REACT_APP_BACKEND}${namespacedPath}`,
                apiPath: options.path + '/' + options.plural,
                labels,
                withCredentials: true,
                token,
            })
        },
        listCluster: (labels?: string[]) => {
            return listResources<Resource>({
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiPath: options.path + '/' + options.plural,
                labels,
                withCredentials: true,
                token,
            })
        },
        listNamespace: (namespace: string, labels?: string[]) => {
            return listResources<Resource>({
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiPath: options.path + '/' + options.plural,
                namespace,
                labels,
                withCredentials: true,
                token,
            })
        },
        // TODO REMOVE
        getNamespaceResource: function getSingleNamespaceResource(namespace: string, name: string) {
            return getResource<Resource>({
                name,
                namespace,
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiPath: options.path + '/' + options.plural,
                withCredentials: true,
                token,
            })
        },
    }
}

export function deleteCreatedResources(resources: AxiosResponse[]) {
    return Promise.all(
        resources.map((resource) => {
            /* istanbul ignore else */
            if (resource.status !== 409) {
                const url = `${resource.config.url}/${resource.data.details.name}`
                return restRequest<IResource>('DELETE', url)
            }
        })
    )
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

export function namespacedApiPath(apiPath: string, namespace: string) {
    let path = apiPath
    if (path.endsWith('/')) path = path.substr(0, path.length - 1)
    const parts = path.split('/')
    return [...parts.slice(0, parts.length - 1), 'namespaces', namespace, parts[parts.length - 1]].join('/')
}

export function createResource<Resource extends IResource>(options: {
    resource: Resource
    apiUrl: string
    withCredentials?: boolean
    token?: string
}) {
    // apiPath: options.path + '/' + options.plural,

    let apiPath = options.resource.apiVersion
    if (apiPath?.includes('/')) {
        apiPath = '/apis' + apiPath
    } else {
        apiPath = '/api' + apiPath
    }

    let url = options.apiUrl
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    if (options.resource.metadata?.namespace) {
        url += namespacedApiPath(apiPath, options.resource.metadata?.namespace)
    } else {
        url += apiPath
    }
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    return Axios.request<Resource>({
        method: 'POST',
        url,
        data: options.resource,
        responseType: 'json',
        withCredentials: options.withCredentials,
        validateStatus: () => true,
        headers: options.token ? { Authentication: `Bearer ${options.token}` } : undefined,
    })
}

export function deleteResource(options: {
    name: string
    namespace?: string
    apiUrl: string
    apiPath: string
    withCredentials?: boolean
    token?: string
}) {
    let url = options.apiUrl
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    if (options.namespace) {
        url += namespacedApiPath(options.apiPath, options.namespace)
    } else {
        url += options.apiPath
    }
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    url += '/' + options.name

    return Axios.request({
        method: 'DELETE',
        url,
        withCredentials: options.withCredentials,
        validateStatus: () => true,
        headers: options.token ? { Authentication: `Bearer ${options.token}` } : undefined,
    })
}

export function listResources<Resource = unknown>(options: {
    apiUrl: string
    apiPath: string
    namespace?: string
    withCredentials?: boolean
    token?: string
    labels?: string[] // TODO support Record<string,string>
}) {
    let url = options.apiUrl
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    if (options.namespace) {
        url += namespacedApiPath(options.apiPath, options.namespace)
    } else {
        url += options.apiPath
    }
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    if (options.labels) {
        url += '?labelSelector=' + options.labels.join(',')
    }

    return Axios.request<ResourceList<Resource>>({
        method: 'GET',
        url,
        responseType: 'json',
        withCredentials: options.withCredentials,
        validateStatus: () => true,
        headers: options.token ? { Authentication: `Bearer ${options.token}` } : undefined,
    })
}

export function getResource<Resource = unknown>(options: {
    apiUrl: string
    apiPath: string
    name: string
    namespace?: string
    withCredentials?: boolean
    token?: string
}) {
    let url = options.apiUrl
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    if (options.namespace) {
        url += namespacedApiPath(options.apiPath, options.namespace)
    } else {
        url += options.apiPath
    }
    if (url.endsWith('/')) url = url.substr(0, url.length - 1)

    if (options.name) {
        url += '/' + options.name
    }

    return Axios.request<Resource>({
        method: 'GET',
        url,
        responseType: 'json',
        withCredentials: options.withCredentials,
        validateStatus: () => true,
        headers: options.token ? { Authentication: `Bearer ${options.token}` } : undefined,
    })
}
