/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */

import { isEqual } from 'lodash'
import nock from 'nock'
import { getResourceApiPath, getResourceNameApiPath, IResource } from '../resources/resource'
import {
    ResourceAttributes,
    SelfSubjectAccessReview,
    SelfSubjectAccessReviewApiVersion,
    SelfSubjectAccessReviewKind,
} from '../resources/self-subject-access-review'
import { StatusApiVersion, StatusKind } from '../resources/status'
import { apiSearchUrl, ISearchResult, SearchQuery } from './search'

export function nockGet<Resource extends IResource>(
    resource: Resource,
    response?: IResource,
    statusCode = 200,
    polling = true
) {
    const nockScope = nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true }).get(
        getResourceNameApiPath(resource)
    )
    const finalNockScope = nockScope.reply(statusCode, response ?? resource, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    })
    if (polling) {
        nockScope
            .optionally()
            .times(20)
            .reply(statusCode, response ?? resource, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
            })
    }
    return finalNockScope
}

export function nockOptions<Resource extends IResource>(resource: Resource, response?: IResource, statusCode = 200) {
    return nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .options(getResourceNameApiPath(resource))
        .optionally()
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockList<Resource extends IResource>(
    resource: { apiVersion: string; kind: string },
    resources: Resource[] | IResource,
    labels?: string[],
    query?: object
) {
    let nockScope = nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true }).get(
        getResourceApiPath({ apiVersion: resource.apiVersion, kind: resource.kind })
    )

    if (labels) {
        nockScope = nockScope.query({ labelSelector: encodeURIComponent(labels.join(',')) })
    } else if (query) {
        nockScope = nockScope.query({ ...query })
    }

    if (Array.isArray(resources)) {
        return nockScope.reply(
            200,
            { items: resources },
            {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
            }
        )
    } else {
        return nockScope.reply(200, resources, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
    }
}

export function nockClusterList<Resource extends IResource>(
    resource: { apiVersion: string; kind: string },
    resources: Resource[] | IResource,
    labels?: string[],
    polling = true
) {
    const data = Array.isArray(resources) ? { items: resources } : resources
    let networkMock = nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true }).get(
        getResourceApiPath({ apiVersion: resource.apiVersion, kind: resource.kind })
    )

    if (labels) {
        networkMock = networkMock.query({ labelSelector: encodeURIComponent(labels.join(',')) })
    }

    const finalNetworkMock = networkMock.reply(200, data, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    })

    if (polling) {
        networkMock.optionally().times(20).reply(200, data, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
    }

    return finalNetworkMock
}

export function nockNamespacedList<Resource extends IResource>(
    resource: { apiVersion: string; kind: string; metadata: { namespace?: string } },
    resources: Resource[] | IResource,
    labels?: string[],
    polling = true
) {
    const data = Array.isArray(resources) ? { items: resources } : resources
    let networkMock = nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true }).get(
        getResourceApiPath(resource)
    )

    if (labels) {
        networkMock = networkMock.query({ labelSelector: encodeURIComponent(labels.join(',')) })
    }

    const finalNetworkMock = networkMock.reply(200, data, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    })

    if (polling) {
        networkMock.optionally().times(20).reply(200, data, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
    }

    return finalNetworkMock
}

export function nockCreate(resource: IResource, response?: IResource, statusCode = 201) {
    const scope = nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .post(getResourceApiPath(resource), (body) => isEqual(body, resource))
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
    return scope
}

export function nockIgnoreRBAC() {
    const scope = nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .persist()
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', () => true)
        .optionally()
        .reply(
            201,
            (_uri, requestBody: SelfSubjectAccessReview) => {
                return {
                    apiVersion: SelfSubjectAccessReviewApiVersion,
                    kind: SelfSubjectAccessReviewKind,
                    metadata: {},
                    spec: requestBody.spec,
                    status: { allowed: true },
                } as SelfSubjectAccessReview
            },
            {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
            }
        )
    return scope
}

export function nockRBAC(resourceAttributes: ResourceAttributes, allowed = true) {
    return nockCreate(
        {
            apiVersion: SelfSubjectAccessReviewApiVersion,
            kind: SelfSubjectAccessReviewKind,
            metadata: {},
            spec: { resourceAttributes },
        } as SelfSubjectAccessReview,
        {
            apiVersion: SelfSubjectAccessReviewApiVersion,
            kind: SelfSubjectAccessReviewKind,
            metadata: {},
            spec: { resourceAttributes },
            status: { allowed },
        } as SelfSubjectAccessReview
    )
}

export function nockPatch(resource: IResource, data: unknown[], response?: IResource, statusCode = 204) {
    return nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .options(getResourceNameApiPath(resource))
        .optionally()
        .reply(200, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .patch(getResourceNameApiPath(resource), (body) => isEqual(body, data))
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockReplace(resource: IResource, response?: IResource, statusCode = 200) {
    return nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .options(getResourceNameApiPath(resource))
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .put(getResourceNameApiPath(resource), (body) => isEqual(body, resource))
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockDelete(resource: IResource, response?: IResource) {
    return nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .options(getResourceNameApiPath(resource))
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .delete(getResourceNameApiPath(resource))
        .reply(response ? 200 : 204, response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockSearch(query: SearchQuery, response?: ISearchResult, statusCode = 201, polling = true) {
    nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .options(apiSearchUrl)
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })

    const networkMock = nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true }).post(
        apiSearchUrl,
        JSON.stringify(query)
    )

    const finalNetworkMock = networkMock.reply(statusCode, response, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    })

    if (polling) {
        networkMock.optionally().times(20).reply(201, response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
    }

    return finalNetworkMock
}

export function nockUpgrade(clusterName: string, version: string, response?: string, statusCode = 201, delay = 0) {
    return nock(process.env.REACT_APP_BACKEND_HOST as string, { encodedQueryParams: true })
        .post('/upgrade', (body) => isEqual(body, { clusterName, version }))
        .delay(delay)
        .reply(statusCode, response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export const mockBadRequestStatus = {
    kind: StatusKind,
    apiVersion: StatusApiVersion,
    metadata: {},
    status: 'Failure',
    message: 'Bad request.',
    code: 400,
}

export const mockNotFoundStatus = {
    kind: StatusKind,
    apiVersion: StatusApiVersion,
    metadata: {},
    status: 'Failure',
    message: 'Not Found.',
    code: 404,
}
