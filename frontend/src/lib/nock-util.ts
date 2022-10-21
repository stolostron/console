/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */
import { isEqual } from 'lodash'
import nock from 'nock'
import {
    AnsibleTowerJobTemplateList,
    ClusterRoleBinding,
    getResourceApiPath,
    getResourceNameApiPath,
    IResource,
    ResourceAttributes,
    SelfSubjectAccessReview,
    SelfSubjectAccessReviewApiVersion,
    SelfSubjectAccessReviewKind,
    StatusApiVersion,
    StatusKind,
} from '../resources'
import { apiSearchUrl, ISearchResult, SearchQuery } from './search'

export type ISearchRelatedResult = {
    data: {
        searchResult: any
    }
}

export async function nockGet<Resource extends IResource>(
    resource: Resource,
    response?: IResource,
    statusCode = 200,
    polling = true
) {
    const resourcePath = await getResourceNameApiPath(resource)
    const nockScope = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true }).get(resourcePath)
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

export function nockGetTextPlain(response: string, statusCode = 200, polling = true, customUri = '') {
    const nockScope = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true }).get(customUri)
    const finalNockScope = nockScope.reply(statusCode, response, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'text/plain',
    })
    if (polling) {
        nockScope.optionally().times(20).reply(statusCode, response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'text/plain',
        })
    }
    return finalNockScope
}

export async function nockOptions<Resource extends IResource>(
    resource: Resource,
    response?: IResource,
    statusCode = 200
) {
    const resourcePath = await getResourceNameApiPath(resource)
    return nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        .options(resourcePath)
        .optionally()
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export async function nockList<Resource extends IResource>(
    resource: { apiVersion: string; kind: string; metadata?: { namespace?: string } },
    resources: Resource[] | IResource,
    labels?: string[],
    query?: object
) {
    const resourceApiPaths = await getResourceApiPath({
        apiVersion: resource.apiVersion,
        kind: resource.kind,
        metadata: resource.metadata,
    })
    let nockScope = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true }).get(resourceApiPaths)

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

export async function nockClusterList<Resource extends IResource>(
    resource: { apiVersion: string; kind: string },
    resources: Resource[] | IResource,
    labels?: string[],
    polling = true
) {
    const resourceApiPath = await getResourceApiPath({ apiVersion: resource.apiVersion, kind: resource.kind })
    const data = Array.isArray(resources) ? { items: resources } : resources
    let networkMock = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true }).get(resourceApiPath)

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

export async function nockNamespacedList<Resource extends IResource>(
    resource: { apiVersion: string; kind: string; metadata: { namespace?: string } },
    resources: Resource[] | IResource,
    labels?: string[],
    polling = true
) {
    const resourceApiPath = await getResourceApiPath(resource)
    const data = Array.isArray(resources) ? { items: resources } : resources
    let networkMock = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true }).get(resourceApiPath)

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

/*
    params - map with key/value pairs i.e.
    { param1: 'val1', param2: 'val2' } = ?param1=val1&param2=val2
*/

function getNockParams(params: any) {
    let paramString = ''
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (paramString === '') {
                paramString = `?${key}=${value}`
            } else {
                paramString = `${paramString}&${key}=${value}`
            }
        }
    }
    return paramString
}

export function nockCreate(
    resource: IResource | ClusterRoleBinding,
    response?: IResource,
    statusCode = 201,
    params?: any
) {
    const scope = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        .post(`${getResourceApiPath(resource)}${getNockParams(params)}`, (body) => {
            // if (!isEqual(body, resource)) {
            //     console.log(body)
            //     console.log(resource)
            // }
            return isEqual(body, resource)
        })
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
    return scope
}

export function nockPatch(
    resource: IResource,
    data: unknown[] | unknown,
    response?: IResource,
    statusCode = 204,
    params?: any
) {
    return nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        .options(`${getResourceNameApiPath(resource)}${getNockParams(params)}`)
        .optionally()
        .reply(200, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .patch(`${getResourceNameApiPath(resource)}${getNockParams(params)}`, (body) => isEqual(body, data))
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockIgnoreRBAC() {
    const scope = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
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

interface AnsibleCredentialPostBody {
    towerHost: string
    token: string
}

interface GetGitBranchesArgoResponse {
    branchList: { name: string }[]
}

interface GetGitBranchShaArgoResponse {
    commit: { sha: string }
}

interface GetGitPathsArgoResponse {
    tree: { path: string; type: string }[]
}

export function nockAnsibleTower(
    data: AnsibleCredentialPostBody | unknown,
    response: AnsibleTowerJobTemplateList,
    statusCode = 200
) {
    return nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        .post('/ansibletower', (body) => isEqual(body, data))
        .reply(statusCode, response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockArgoGitBranches(repositoryUrl: string, response: GetGitBranchesArgoResponse, statusCode = 200) {
    const url = new URL(repositoryUrl)
    return nock('https://api.github.com')
        .get('/repos' + url.pathname + '/branches')
        .reply(statusCode, response.branchList)
}

export function nockArgoGitPathSha(
    repositoryUrl: string,
    branch: string,
    response: GetGitBranchShaArgoResponse,
    statusCode = 200
) {
    const url = new URL(repositoryUrl)
    return nock('https://api.github.com')
        .get('/repos' + url.pathname + '/branches/' + branch)
        .reply(statusCode, response)
}

export function nockArgoGitPathTree(repositoryUrl: string, response: GetGitPathsArgoResponse, statusCode = 200) {
    const url = new URL(repositoryUrl)
    return nock('https://api.github.com')
        .get('/repos' + url.pathname + '/git/trees/01?recursive=true')
        .reply(statusCode, response)
}

export async function nockReplace(resource: IResource, response?: IResource, statusCode = 200) {
    const resourceApiPath = await getResourceNameApiPath(resource)
    return nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        .options(resourceApiPath)
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .put(resourceApiPath, (body) => isEqual(body, resource))
        .reply(statusCode, response ?? resource, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export async function nockDelete(resource: IResource, response?: IResource) {
    const resourceApiPath = await getResourceNameApiPath(resource)
    return nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        .options(resourceApiPath)
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .delete(resourceApiPath)
        .reply(response ? 200 : 204, response, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

export function nockSearch(
    query: SearchQuery,
    response?: ISearchResult | ISearchRelatedResult,
    statusCode = 201,
    polling = true
) {
    nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        .options(apiSearchUrl)
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })

    const networkMock = nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true }).post(
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

export function nockRequest(pathname: string, response: object, statusCode = 200) {
    return nock(process.env.JEST_DEFAULT_HOST as string)
        .get(pathname)
        .reply(statusCode, response)
}

export const mockBadRequestStatus = {
    kind: StatusKind,
    apiVersion: StatusApiVersion,
    metadata: { name: '' },
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
