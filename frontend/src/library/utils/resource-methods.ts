import Axios, { AxiosResponse, Method } from 'axios'
import * as https from 'https'
import { join } from 'path'
import { IResource, ResourceList } from '../resources/resource'

// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

const token = process.env.CLUSTER_API_TOKEN
const proxyPath = process.env.CLUSTER_API_URL ?? '/cluster-management/proxy'
const namespacedPath = '/cluster-management/namespaced'

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

export interface IResourceMethods<Resource extends IResource> {
    apiVersion: string
    kind: string
    create: (resource: Resource) => Promise<AxiosResponse<Resource>>
    delete: (name: string, namespace?: string) => Promise<AxiosResponse>
    get: (name: string, namespace?: string) => Promise<AxiosResponse<Resource>>
    list: (labels?: string[]) => Promise<AxiosResponse<ResourceList<Resource>>>
    listCluster: (labels?: string[]) => Promise<AxiosResponse<ResourceList<Resource>>>
    listNamespace: (namespace: string, labels?: string[]) => Promise<AxiosResponse<ResourceList<Resource>>>
}

export function resourceMethods<Resource extends IResource>(options: {
    apiVersion: string
    kind: string
}): IResourceMethods<Resource> {
    return {
        apiVersion: options.apiVersion,
        kind: options.kind,
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
                kind: options.kind,
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiVersion: options.apiVersion,
                withCredentials: true,
                token,
            })
        },
        get: (name: string, namespace?: string) => {
            return getResource<Resource>({
                name,
                namespace,
                kind: options.kind,
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiVersion: options.apiVersion,
                withCredentials: true,
                token,
            })
        },
        list: (labels?: string[]) => {
            return listResources<Resource>({
                apiUrl: `${process.env.REACT_APP_BACKEND}${namespacedPath}`,
                apiVersion: options.apiVersion,
                kind: options.kind,
                labels,
                withCredentials: true,
                token,
            })
        },
        listCluster: (labels?: string[]) => {
            return listResources<Resource>({
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiVersion: options.apiVersion,
                kind: options.kind,
                labels,
                withCredentials: true,
                token,
            })
        },
        listNamespace: (namespace: string, labels?: string[]) => {
            return listResources<Resource>({
                apiUrl: `${process.env.REACT_APP_BACKEND}${proxyPath}`,
                apiVersion: options.apiVersion,
                kind: options.kind,
                namespace,
                labels,
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

export function createResource<Resource extends IResource>(options: {
    apiUrl: string
    resource: Resource
    withCredentials?: boolean
    token?: string
}) {
    const { apiUrl, resource, withCredentials, token } = options
    let url = apiUrl + getResourcePath(resource)
    return Axios.request<Resource>({
        method: 'POST',
        url,
        data: resource,
        responseType: 'json',
        withCredentials: withCredentials,
        validateStatus: () => true,
        headers: token ? { Authentication: `Bearer ${token}` } : undefined,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    })
}

export function deleteResource(options: {
    apiUrl: string
    apiVersion: string
    kind: string
    name: string
    namespace?: string
    withCredentials?: boolean
    token?: string
}) {
    const { apiUrl, apiVersion, kind, name, namespace, withCredentials, token } = options
    let url = apiUrl + getResourceNamePath({ apiVersion, kind, metadata: { name, namespace } })
    return Axios.request({
        method: 'DELETE',
        url,
        withCredentials: withCredentials,
        validateStatus: () => true,
        headers: token ? { Authentication: `Bearer ${token}` } : undefined,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    })
}

export function listResources<Resource extends IResource>(options: {
    apiUrl: string
    apiVersion: string
    kind: string
    namespace?: string
    withCredentials?: boolean
    token?: string
    labels?: string[] // TODO support Record<string,string>
}) {
    const { apiUrl, apiVersion, kind, namespace, withCredentials, token } = options
    let url = apiUrl + getResourcePath({ apiVersion, kind, metadata: { namespace } })

    if (options.labels) {
        url += '?labelSelector=' + options.labels.join(',')
    }

    return Axios.request<ResourceList<Resource>>({
        method: 'GET',
        url,
        responseType: 'json',
        withCredentials: withCredentials,
        validateStatus: () => true,
        headers: token ? { Authentication: `Bearer ${token}` } : undefined,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    })
}

export function getResource<Resource = unknown>(options: {
    apiUrl: string
    apiVersion: string
    kind: string
    name: string
    namespace?: string
    withCredentials?: boolean
    token?: string
}) {
    const { apiUrl, apiVersion, kind, name, namespace, withCredentials, token } = options
    const url = apiUrl + getResourceNamePath({ apiVersion, kind, metadata: { name, namespace } })
    return Axios.request<Resource>({
        method: 'GET',
        url,
        responseType: 'json',
        withCredentials: withCredentials,
        validateStatus: () => true,
        headers: token ? { Authentication: `Bearer ${token}` } : undefined,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    })
}

export function getResourcePath(options: {
    apiVersion: string
    kind?: string
    plural?: string
    metadata?: { namespace?: string }
}): string {
    const { apiVersion } = options

    let path: string
    if (apiVersion?.includes('/')) {
        path = join('/apis', apiVersion)
    } else {
        path = join('/api', apiVersion)
    }

    const namespace = options.metadata?.namespace
    if (namespace !== undefined) {
        path = join(path, 'namespaces', namespace)
    }

    if (options.plural !== undefined) {
        path = join(path, options.plural)
    } else if (options.kind !== undefined) {
        path = join(path, options.kind.toLowerCase() + 's')
    }

    return path
}

export function getResourceNamePath(options: {
    apiVersion: string
    kind?: string
    plural?: string
    metadata?: { name?: string; namespace?: string }
}): string {
    let path = getResourcePath(options)

    const name = options.metadata?.name
    if (name !== undefined) {
        path = join(path, name)
    }

    return path
}
