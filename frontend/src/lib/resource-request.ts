import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import {
    getResourceApiPath,
    getResourceName,
    getResourceNameApiPath,
    IResource,
    ResourceList,
} from '../resources/resource'
import { Status, StatusKind } from '../resources/status'

export const backendUrl = `${process.env.REACT_APP_BACKEND_HOST}${process.env.REACT_APP_BACKEND_PATH}`

export interface IRequestOptions {
    retries?: number
    backoff?: number
    // TODO abortSignal - incases where you want one abort for a bunch of requests
}

export interface IRequestResult<ResultType = unknown> {
    promise: Promise<ResultType>
    abort: () => void
}

export function resultsSettled<T>(results: IRequestResult<T>[]): IRequestResult<PromiseSettledResult<T>[]> {
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}

export enum ResourceErrorCode {
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    Timeout = 408,
    Conflict = 409,
    UnprocessableEntity = 422,
    TooManyRequests = 429,
    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
    GatewayTimeout = 504,
    NetworkError = 700,
    RequestCancelled = 800,
    ConnectionReset = 900,
    Unknown = 999,
}
const ResourceErrorCodes = Object.keys(ResourceErrorCode).map((k) => Number(ResourceErrorCode[k as any]))

export class ResourceError extends Error {
    constructor(message: string, public code: ResourceErrorCode, public reason?: string) {
        super(message)
        Object.setPrototypeOf(this, ResourceError.prototype)
        this.name = 'ResourceError'
    }
}

export function createResource<Resource extends IResource, ResultType = Resource>(
    resource: Resource,
    options?: IRequestOptions
): IRequestResult<ResultType> {
    const url = backendUrl + getResourceApiPath(resource)
    return postRequest<Resource, ResultType>(url, resource, options)
}

export function replaceResource<Resource extends IResource, ResultType = Resource>(
    resource: Resource,
    options?: IRequestOptions
): IRequestResult<ResultType> {
    const url = backendUrl + getResourceNameApiPath(resource)
    return putRequest<Resource, ResultType>(url, resource, options)
}

export function patchResource<Resource extends IResource, ResultType = Resource>(
    resource: Resource,
    data: unknown,
    options?: IRequestOptions
): IRequestResult<ResultType> {
    const url = backendUrl + getResourceNameApiPath(resource)
    let headers: Record<string, string> = {}
    if (Array.isArray(data)) {
        headers['Content-Type'] = 'application/json-patch+json'
    } else {
        headers['Content-Type'] = 'application/merge-patch+json'
    }
    return patchRequest<Resource, ResultType>(url, data, headers, options)
}

export function deleteResource<Resource extends IResource>(
    resource: Resource,
    options?: IRequestOptions
): IRequestResult {
    if (getResourceName(resource) === undefined)
        throw new ResourceError('Resource name is required.', ResourceErrorCode.BadRequest)
    const url = backendUrl + getResourceNameApiPath(resource)
    return deleteRequest(url, options)
}

export function getResource<Resource extends IResource>(
    resource: Resource,
    options?: IRequestOptions
): IRequestResult<Resource> {
    if (getResourceName(resource) === undefined)
        throw new ResourceError('Resource name is required.', ResourceErrorCode.BadRequest)
    const url = backendUrl + getResourceNameApiPath(resource)
    return getRequest<Resource>(url, { ...{ retries: 2 }, ...options })
}

export function listResources<Resource extends IResource>(
    resource: { apiVersion: string; kind: string },
    options?: IRequestOptions,
    labels?: string[],
    query?: Record<string, string>
): IRequestResult<Resource[]> {
    let url = backendUrl + getResourceApiPath(resource)
    if (labels) {
        url += '?labelSelector=' + labels.join(',')
        if (query)
            url += `&${Object.keys(query)
                .map((key) => `${key}=${query[key]}`)
                .join('&')}`
    } else {
        if (query)
            url += `?${Object.keys(query)
                .map((key) => `${key}=${query[key]}`)
                .join('&')}`
    }
    const result = getRequest<ResourceList<Resource>>(url, { ...{ retries: 2 }, ...options })
    return {
        promise: result.promise.then((result) => {
            if (Array.isArray(result.items)) {
                return (result.items as Resource[]).map((item) => ({
                    ...item,
                    ...{
                        apiVersion: resource.apiVersion,
                        kind: resource.kind,
                    },
                }))
            } else {
                return []
            }
        }),
        abort: result.abort,
    }
}

export function listClusterResources<Resource extends IResource>(
    resource: { apiVersion: string; kind: string },
    options?: IRequestOptions,
    labels?: string[]
): IRequestResult<Resource[]> {
    let url = backendUrl + getResourceApiPath(resource)
    if (labels) url += '?labelSelector=' + labels.join(',')
    const result = getRequest<ResourceList<Resource>>(url, { ...{ retries: 2 }, ...options })
    return {
        promise: result.promise.then((result) => result.items as Resource[]),
        abort: result.abort,
    }
}

export function listNamespacedResources<Resource extends IResource>(
    resource: {
        apiVersion: string
        kind: string
        metadata: { namespace: string }
    },
    options?: IRequestOptions,
    labels?: string[]
): IRequestResult<Resource[]> {
    let url = backendUrl + getResourceApiPath(resource)
    if (labels) url += '?labelSelector=' + labels.join(',')
    const result = getRequest<ResourceList<Resource>>(url, { ...{ retries: 2 }, ...options })
    return {
        promise: result.promise.then((result) => result.items as Resource[]),
        abort: result.abort,
    }
}

function getRequest<ResourceType, ResultType = ResourceType>(
    url: string,
    options?: IRequestOptions
): IRequestResult<ResultType> {
    return axiosRequest<ResultType>({
        ...{ url, method: 'GET', validateStatus: (status) => true },
        ...{ retries: 2 },
        ...options,
    })
}

export function postRequest<ResourceType, ResultType = ResourceType>(
    url: string,
    data: ResourceType,
    options?: IRequestOptions
): IRequestResult<ResultType> {
    return axiosRequest<ResultType>({
        ...{ url, method: 'POST', validateStatus: (status) => true, data },
        ...options,
    })
}

function putRequest<ResourceType, ResultType = ResourceType>(
    url: string,
    data: ResourceType,
    options?: IRequestOptions
): IRequestResult<ResultType> {
    return axiosRequest<ResultType>({
        ...{ url, method: 'PUT', validateStatus: (status) => true, data },
        ...options,
    })
}

function patchRequest<ResourceType, ResultType = ResourceType>(
    url: string,
    data: unknown,
    headers: Record<string, string>,
    options?: IRequestOptions
): IRequestResult<ResultType> {
    return axiosRequest<ResultType>({
        ...{
            url,
            method: 'PATCH',
            validateStatus: (status) => true,
            headers,
            data,
        },
        ...options,
    })
}

function deleteRequest(url: string, options?: IRequestOptions): IRequestResult {
    return axiosRequest({
        ...{ url, method: 'DELETE', validateStatus: (status) => true },
        ...options,
    })
}

function axiosRequest<ResultType>(config: AxiosRequestConfig & IRequestOptions): IRequestResult<ResultType> {
    const cancelTokenSource = Axios.CancelToken.source()
    return {
        promise: axiosRetry<ResultType>({
            ...config,
            ...{ cancelToken: cancelTokenSource.token, withCredentials: true },
        })
            .then((response) => {
                if ((response.data as any)?.kind === StatusKind) {
                    const status = (response.data as unknown) as Status
                    if (status.status === 'Success') {
                        // TODO...
                        return response.data as ResultType
                    } else {
                        if (status.code === 401) {
                            // 401 is returned from kubernetes in a Status object if token is not valid
                            window.location.href = `${process.env.REACT_APP_BACKEND_HOST}/login`
                            throw new ResourceError(status.message as string, status.code as number)
                        } else if (ResourceErrorCodes.includes(status.code as number)) {
                            throw new ResourceError(status.message as string, status.code as number)
                        } else {
                            throw new ResourceError('Unknown error.', ResourceErrorCode.Unknown)
                        }
                    }
                } else if (response.status === 302) {
                    // 302 is returned when token is valid but logged out
                    window.location.href = `${process.env.REACT_APP_BACKEND_HOST}/login`
                } else if (response.status >= 400) {
                    if (response.status === 401) {
                        // 401 is returned from the backend if no token cookie is on request
                        window.location.href = `${process.env.REACT_APP_BACKEND_HOST}/login`
                    } else if (ResourceErrorCodes.includes(response.status)) {
                        throw new ResourceError(response.statusText, response.status)
                    } else {
                        throw new ResourceError('Unknown error.', ResourceErrorCode.Unknown)
                    }
                }
                return response.data
            })
            .catch((err) => {
                if (Axios.isCancel(err)) {
                    throw new ResourceError('Request cancelled', ResourceErrorCode.RequestCancelled)
                } else if (err instanceof Error) {
                    if (typeof (err as any)?.code === 'string') {
                        switch ((err as any)?.code) {
                            case 'ETIMEDOUT':
                                throw new ResourceError('Request timeout.', ResourceErrorCode.Timeout)
                            case 'ECONNRESET':
                                throw new ResourceError('Request connection reset.', ResourceErrorCode.ConnectionReset)
                            default:
                                throw new ResourceError(
                                    `Unknown error. code: ${(err as any)?.code}`,
                                    ResourceErrorCode.Unknown
                                )
                        }
                    } else if (typeof (err as any)?.code === 'number') {
                        if (ResourceErrorCodes.includes((err as any)?.code)) {
                            throw new ResourceError(err.message, (err as any)?.code)
                        } else {
                            throw new ResourceError(
                                `Unknown error. code: ${(err as any)?.code}`,
                                ResourceErrorCode.Unknown
                            )
                        }
                    } else if (err.message === 'Network Error') {
                        throw new ResourceError('Network error', ResourceErrorCode.NetworkError)
                    }
                }
                throw new ResourceError(`Unknown error. code: ${(err as any)?.code}`, ResourceErrorCode.Unknown)
            }),
        abort: cancelTokenSource.cancel,
    }
}

function axiosRetry<ResponseType>(
    config: AxiosRequestConfig & IRequestOptions & unknown
): Promise<AxiosResponse<ResponseType>> {
    const retryCodes = [408, 429, 500, 502, 503, 504, 522, 524]
    const retries = config?.retries ?? 0
    const backoff = config?.backoff ?? 300
    return new Promise((resolve, reject) => {
        function retryRequest(config: AxiosRequestConfig & IRequestOptions) {
            Axios.request(config)
                .then((response) => {
                    resolve(response)
                })
                .catch((err) => {
                    if (retries > 0 && retryCodes.includes(err.status)) {
                        setTimeout(() => {
                            retryRequest({ ...config, ...{ retries: retries - 1, backoff: backoff * 2 } })
                        }, backoff)
                    } else if (typeof err.code === 'number') {
                        // TO
                    } else {
                        reject(err)
                    }
                })
        }
        retryRequest(config)
    })
}
