import nock from 'nock'
import { join } from 'path'
import { getResourceApiPath, getResourceNameApiPath, IResource } from '../resources/resource'
import { StatusApiVersion, StatusKind } from '../resources/status'
import { apiNamespacedUrl, apiProxyUrl } from './resource-request'

export function nockGet<Resource extends IResource>(resource: Resource, response?: IResource) {
    return nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true })
        .get(join(apiProxyUrl, getResourceNameApiPath(resource)))
        .reply(200, resource ?? response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockList<Resource extends IResource>(
    resource: {
        apiVersion: string
        kind: string
    },
    resources: Resource[],
    labels?: string[]
) {
    let nockScope = nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true }).get(
        join(
            apiNamespacedUrl,
            getResourceApiPath({
                apiVersion: resource.apiVersion,
                kind: resource.kind,
            })
        )
    )

    if (labels) {
        nockScope = nockScope.query({
            labelSelector: encodeURIComponent(labels.join(',')),
        })
    }

    return nockScope.reply(
        200,
        { items: resources },
        {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        }
    )
}

export function nockClusterList<Resource extends IResource>(
    resource: { apiVersion: string; kind: string },
    resources: Resource[],
    labels?: string[]
) {
    let networkMock = nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true }).get(
        join(apiProxyUrl, getResourceApiPath({ apiVersion: resource.apiVersion, kind: resource.kind }))
    )

    if (labels) {
        networkMock = networkMock.query({ labelSelector: encodeURIComponent(labels.join(',')) })
    }

    return networkMock.reply(
        200,
        { items: resources },
        {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        }
    )
}

export function nockCreate(resource: IResource, response: IResource, statusCode: number = 201) {
    return nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true })
        .post(apiProxyUrl + getResourceApiPath(resource), JSON.stringify(resource))
        .reply(statusCode, response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockDelete(resource: IResource) {
    return nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true })
        .options(apiProxyUrl + getResourceNameApiPath(resource))
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .delete(apiProxyUrl + getResourceNameApiPath(resource))
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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
